"""
Firestore Client Service for Intent-First Onboarding Engine.

Handles all Firestore CRUD operations for user profiles and drop-off events.
"""

import os
import json
import logging
from datetime import datetime
from typing import Optional, Dict, List, Any

from google.cloud import firestore
from google.oauth2 import service_account
from pydantic import ValidationError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Firestore collection names
USERS_COLLECTION = "users"
DROP_OFF_COLLECTION = "drop_off_events"
PERSONAS_COLLECTION = "personas"


class FirestoreClient:
    """Firestore client for the onboarding engine."""
    
    def __init__(self):
        """Initialize Firestore client."""
        self.db: Optional[firestore.Client] = None
        self._initialized = False
        self._initialize()
    
    def _initialize(self) -> None:
        """Initialize Firestore client with credentials."""
        try:
            # Try to get credentials from environment
            project_id = os.getenv("GCP_PROJECT_ID")
            credentials_json = os.getenv("FIRESTORE_SERVICE_ACCOUNT_JSON")
            
            if credentials_json:
                # Parse JSON credentials
                try:
                    creds_dict = json.loads(credentials_json)
                    credentials = service_account.Credentials.from_service_account_info(creds_dict)
                except json.JSONDecodeError:
                    logger.warning("Invalid FIRESTORE_SERVICE_ACCOUNT_JSON, trying file")
                    credentials = None
            else:
                credentials = None
            
            # Initialize client
            if project_id:
                self.db = firestore.Client(
                    project=project_id,
                    credentials=credentials
                )
                logger.info(f"Firestore client initialized for project: {project_id}")
            elif credentials:
                self.db = firestore.Client(credentials=credentials)
                logger.info("Firestore client initialized with credentials")
            else:
                # Try default application credentials
                try:
                    self.db = firestore.Client()
                    logger.info("Firestore client initialized with default credentials")
                except Exception as e:
                    logger.warning(f"Could not initialize Firestore: {e}")
                    return
            
            self._initialized = True
            
        except Exception as e:
            logger.error(f"Failed to initialize Firestore client: {e}")
            self._initialized = False
    
    def is_initialized(self) -> bool:
        """Check if Firestore client is initialized."""
        return self._initialized and self.db is not None
    
    def save_user_profile(
        self,
        uid: str,
        profile_data: Dict[str, Any]
    ) -> bool:
        """
        Save user profile to Firestore.
        
        Args:
            uid: User ID
            profile_data: Profile data to save
            
        Returns:
            True if successful
        """
        if not self.is_initialized():
            logger.warning("Firestore not initialized, skipping save")
            return False
        
        try:
            # Add timestamps
            now = datetime.utcnow().isoformat()
            data = {
                **profile_data,
                "created_at": profile_data.get("created_at", now),
                "updated_at": now,
            }
            
            # Save to users collection
            doc_ref = self.db.collection(USERS_COLLECTION).document(uid)
            doc_ref.set(data, merge=True)
            
            logger.info(f"User profile saved: {uid}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to save user profile: {e}")
            return False
    
    def get_user_profile(self, uid: str) -> Optional[Dict]:
        """
        Get user profile from Firestore.
        
        Args:
            uid: User ID
            
        Returns:
            User profile dict or None
        """
        if not self.is_initialized():
            logger.warning("Firestore not initialized")
            return None
        
        try:
            doc_ref = self.db.collection(USERS_COLLECTION).document(uid)
            doc = doc_ref.get()
            
            if doc.exists:
                return doc.to_dict()
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get user profile: {e}")
            return None
    
    def update_user_persona(
        self,
        uid: str,
        persona: str,
        session_config: Dict[str, Any]
    ) -> bool:
        """
        Update user with matched persona and session config.
        
        Args:
            uid: User ID
            persona: Matched persona ID
            session_config: Session configuration
            
        Returns:
            True if successful
        """
        if not self.is_initialized():
            return False
        
        try:
            doc_ref = self.db.collection(USERS_COLLECTION).document(uid)
            doc_ref.update({
                "persona": persona,
                "session_config": session_config,
                "updated_at": datetime.utcnow().isoformat(),
            })
            
            logger.info(f"User persona updated: {uid} -> {persona}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to update user persona: {e}")
            return False
    
    def save_drop_off_event(self, event_data: Dict[str, Any]) -> bool:
        """
        Save drop-off event to Firestore.
        
        Args:
            event_data: Drop-off event data
            
        Returns:
            True if successful
        """
        if not self.is_initialized():
            logger.warning("Firestore not initialized, skipping save")
            return False
        
        try:
            # Add timestamp
            data = {
                **event_data,
                "timestamp": event_data.get("timestamp", datetime.utcnow().isoformat()),
            }
            
            # Save to drop_off collection
            doc_ref = self.db.collection(DROP_OFF_COLLECTION).document()
            doc_ref.set(data)
            
            logger.info(f"Drop-off event saved")
            return True
            
        except Exception as e:
            logger.error(f"Failed to save drop-off event: {e}")
            return False
    
    def get_drop_off_stats(self, persona: Optional[str] = None) -> Dict:
        """
        Get drop-off statistics.
        
        Args:
            persona: Optional persona filter
            
        Returns:
            Statistics dict
        """
        if not self.is_initialized():
            return {"error": "Firestore not initialized"}
        
        try:
            collection = self.db.collection(DROP_OFF_COLLECTION)
            
            # Apply filter if persona specified
            if persona:
                query = collection.where("persona", "==", persona)
            else:
                query = collection
            
            # Get all events
            docs = query.stream()
            
            total_events = 0
            idle_triggered = 0
            step_counts = {}
            
            for doc in docs:
                data = doc.to_dict()
                total_events += 1
                
                if data.get("idle_triggered"):
                    idle_triggered += 1
                
                step = data.get("step", "unknown")
                step_counts[step] = step_counts.get(step, 0) + 1
            
            return {
                "total_events": total_events,
                "idle_triggered": idle_triggered,
                "idle_rate": idle_triggered / total_events if total_events > 0 else 0,
                "step_counts": step_counts,
            }
            
        except Exception as e:
            logger.error(f"Failed to get drop-off stats: {e}")
            return {"error": str(e)}
    
    def get_analytics_summary(self) -> Dict:
        """
        Get analytics summary for all users.
        
        Returns:
            Analytics summary dict
        """
        if not self.is_initialized():
            return {"error": "Firestore not initialized"}
        
        try:
            # Get all users
            users_ref = self.db.collection(USERS_COLLECTION)
            users_docs = users_ref.stream()
            
            total_users = 0
            persona_counts = {}
            completed_sessions = 0
            
            for doc in users_docs:
                data = doc.to_dict()
                total_users += 1
                
                # Count personas
                persona = data.get("persona")
                if persona:
                    persona_counts[persona] = persona_counts.get(persona, 0) + 1
                
                # Count completed sessions
                if data.get("session_config"):
                    completed_sessions += 1
            
            completion_rate = completed_sessions / total_users if total_users > 0 else 0
            
            # Get drop-off stats
            drop_off_stats = self.get_drop_off_stats()
            
            return {
                "total_users": total_users,
                "completion_rate": completion_rate,
                "persona_distribution": persona_counts,
                "drop_off_stats": drop_off_stats,
            }
            
        except Exception as e:
            logger.error(f"Failed to get analytics summary: {e}")
            return {"error": str(e)}


# Global Firestore client instance
_firestore_client: Optional[FirestoreClient] = None


def get_firestore_client() -> FirestoreClient:
    """Get or create the global Firestore client instance."""
    global _firestore_client
    if _firestore_client is None:
        _firestore_client = FirestoreClient()
    return _firestore_client
