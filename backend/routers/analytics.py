"""
Analytics Router for Intent-First Onboarding Engine.

Provides:
- POST /analytics/drop-off: Track drop-off events
- GET /analytics/summary/{persona}: Get analytics for a persona
- WebSocket /ws/session/{uid}: Real-time event streaming
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Set

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, Query
from fastapi.responses import JSONResponse

from pydantic import BaseModel

from models.schemas import DropOffEvent, DropOffResponse, AnalyticsSummary
import services.firestore_client as firestore_client

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()


# TrackEvent model for flexible event tracking
class TrackEvent(BaseModel):
    type: str
    step: Optional[str] = None
    timestamp: Optional[int] = None
    depth: Optional[float] = None
    
    class Config:
        extra = "allow"


# WebSocket connection manager
class ConnectionManager:
    """Manages WebSocket connections for real-time analytics."""
    
    def __init__(self):
        """Initialize connection manager."""
        self.active_connections: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, session_id: str, websocket: WebSocket):
        """Connect a new WebSocket client."""
        await websocket.accept()
        
        if session_id not in self.active_connections:
            self.active_connections[session_id] = set()
        
        self.active_connections[session_id].add(websocket)
        logger.info(f"WebSocket connected: {session_id}")
    
    def disconnect(self, session_id: str, websocket: WebSocket):
        """Disconnect a WebSocket client."""
        if session_id in self.active_connections:
            self.active_connections[session_id].discard(websocket)
            
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]
        
        logger.info(f"WebSocket disconnected: {session_id}")
    
    async def send_personal_message(self, message: dict, session_id: str):
        """Send a message to all clients in a session."""
        if session_id not in self.active_connections:
            return
        
        disconnected = set()
        
        for connection in self.active_connections[session_id]:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error sending message: {e}")
                disconnected.add(connection)
        
        # Clean up disconnected clients
        for connection in disconnected:
            self.disconnect(session_id, connection)
    
    async def broadcast_to_session(self, message: dict, session_id: str):
        """Broadcast a message to all clients in a session."""
        await self.send_personal_message(message, session_id)


# Global connection manager
manager = ConnectionManager()


@router.post("/analytics/drop-off", response_model=DropOffResponse)
async def track_drop_off(event: DropOffEvent) -> DropOffResponse:
    """
    Track a drop-off event.
    
    Args:
        event: Drop-off event data
        
    Returns:
        DropOffResponse with status
    """
    try:
        # Save to Firestore
        fs_client = firestore_client.get_firestore_client()
        
        event_data = event.model_dump()
        event_data["timestamp"] = datetime.utcnow().isoformat()
        
        success = fs_client.save_drop_off_event(event_data)
        
        if not success:
            logger.warning("Failed to save drop-off event")
        
        return DropOffResponse(
            status="recorded" if success else "failed",
            session_id=event.uid,
        )
        
    except Exception as e:
        logger.error(f"Error tracking drop-off: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/analytics/summary/{persona}")
async def get_analytics_summary(persona: str) -> AnalyticsSummary:
    """
    Get analytics summary for a specific persona.
    
    Args:
        persona: Persona ID to get stats for
        
    Returns:
        Analytics summary
    """
    try:
        fs_client = firestore_client.get_firestore_client()
        
        # Get drop-off stats for persona
        drop_off_stats = fs_client.get_drop_off_stats(persona)
        
        # Get user stats
        users_ref = fs_client.db.collection("users")
        users_query = users_ref.where("persona", "==", persona)
        users_docs = list(users_query.stream())
        
        total_users = len(users_docs)
        completed = sum(1 for doc in users_docs if doc.to_dict().get("session_config"))
        
        return AnalyticsSummary(
            total_users=total_users,
            completion_rate=completed / total_users if total_users > 0 else 0,
            persona_distribution={persona: total_users},
            average_session_duration=drop_off_stats.get("average_duration", 0),
            drop_off_by_step=drop_off_stats.get("step_counts", {}),
        )
        
    except Exception as e:
        logger.error(f"Error getting analytics summary: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/analytics/summary")
async def get_global_analytics_summary() -> Dict:
    """
    Get global analytics summary.
    
    Returns:
        Global analytics summary
    """
    try:
        fs_client = firestore_client.get_firestore_client()
        summary = fs_client.get_analytics_summary()
        return summary
        
    except Exception as e:
        logger.error(f"Error getting global analytics: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.websocket("/ws/session/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for real-time session tracking.
    
    Args:
        websocket: WebSocket connection
        session_id: Session ID for this connection
    """
    await manager.connect(session_id, websocket)
    
    try:
        # Send welcome message
        await websocket.send_json({
            "type": "connected",
            "session_id": session_id,
            "message": "Connected to analytics stream",
        })
        
        # Handle messages from client
        while True:
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
                message_type = message.get("type")
                
                # Process different message types
                if message_type == "scroll":
                    # Track scroll depth
                    scroll_depth = message.get("depth", 0)
                    logger.debug(f"Scroll depth: {scroll_depth}%")
                    
                elif message_type == "click":
                    # Track click events
                    element = message.get("element", "unknown")
                    logger.debug(f"Click on: {element}")
                    
                elif message_type == "step_enter":
                    # Track step entry
                    step = message.get("step")
                    logger.debug(f"Step entered: {step}")
                    
                elif message_type == "step_exit":
                    # Track step exit and duration
                    step = message.get("step")
                    duration = message.get("duration", 0)
                    logger.debug(f"Step exited: {step}, duration: {duration}s")
                    
                    # Save to Firestore
                    event_data = {
                        "uid": session_id,
                        "persona": message.get("persona", "unknown"),
                        "step": step,
                        "time_spent": duration,
                        "event_type": "step_exit",
                    }
                    fs_client = firestore_client.get_firestore_client()
                    fs_client.save_drop_off_event(event_data)
                    
                elif message_type == "idle_start":
                    # User went idle
                    logger.debug("User became idle")
                    
                elif message_type == "idle_end":
                    # User returned from idle
                    duration = message.get("duration", 0)
                    logger.debug(f"User returned after {duration}s idle")
                    
                    # If idle for more than 30s, send rescue prompt
                    if duration > 30:
                        await manager.send_personal_message({
                            "type": "rescue_prompt",
                            "message": "Stuck? Switch to a simpler path →",
                            "options": [
                                {
                                    "action": "switch_persona",
                                    "label": "Switch to simpler path",
                                },
                                {
                                    "action": "skip",
                                    "label": "Skip this step",
                                },
                                {
                                    "action": "continue",
                                    "label": "Continue",
                                },
                            ],
                        }, session_id)
                
                # Acknowledge message
                await websocket.send_json({
                    "type": "ack",
                    "message_id": message.get("id"),
                })
                
            except json.JSONDecodeError:
                logger.error("Invalid JSON received")
                
    except WebSocketDisconnect:
        manager.disconnect(session_id, websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(session_id, websocket)


@router.post("/analytics/rescue-action")
async def record_rescue_action(
    session_id: str,
    action: str,
    reason: Optional[str] = None,
) -> Dict:
    """
    Record when a user takes a rescue action.
    
    Args:
        session_id: User's session ID
        action: Action taken (switch_persona, skip, continue)
        reason: Optional reason for the action
        
    Returns:
        Status response
    """
    try:
        fs_client = firestore_client.get_firestore_client()
        
        event_data = {
            "uid": session_id,
            "event_type": "rescue_action",
            "action": action,
            "reason": reason,
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        fs_client.save_drop_off_event(event_data)
        
        return {"status": "recorded", "action": action}
        
    except Exception as e:
        logger.error(f"Error recording rescue action: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/track")
async def track_event(event: TrackEvent):
    """
    Track analytics events from frontend.
    
    Args:
        event: TrackEvent with type and optional fields
        
    Returns:
        Status response
    """
    try:
        logger.info(f"Track event received: {event.type}")
        
        # Log the event details
        logger.info(f"Event details: {event.model_dump(exclude_none=True)}")
        
        # Save to Firestore if available
        try:
            fs_client = firestore_client.get_firestore_client()
            event_data = event.model_dump(exclude_none=True)
            event_data["timestamp"] = datetime.utcnow().isoformat()
            fs_client.save_drop_off_event(event_data)
        except Exception as e:
            logger.warning(f"Could not save to Firestore: {e}")
        
        return {"status": "tracked", "type": event.type}
        
    except Exception as e:
        logger.error(f"Error tracking event: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/analytics/track-event")
async def track_event(event: TrackEvent) -> Dict:
    """
    Track analytics events from frontend.
    
    Accepts flexible event payloads with optional fields.
    
    Args:
        event: TrackEvent with type and optional fields
        
    Returns:
        Status response
    """
    try:
        logger.info(f"Track event: {event.type}")
        
        # Log the event details
        logger.info(f"Event details: {event.model_dump(exclude_none=True)}")
        
        # Save to Firestore if available
        try:
            fs_client = firestore_client.get_firestore_client()
            event_data = event.model_dump(exclude_none=True)
            event_data["timestamp"] = datetime.utcnow().isoformat()
            fs_client.save_drop_off_event(event_data)
        except Exception as e:
            logger.warning(f"Could not save to Firestore: {e}")
        
        return {"status": "tracked", "type": event.type}
        
    except Exception as e:
        logger.error(f"Error tracking event: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
