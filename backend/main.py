"""
Intent-First Onboarding Engine - Backend

FastAPI application with:
- CORS middleware
- Router registration
- Firestore client initialization
- WebSocket support for real-time analytics
"""

import os
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi import WebSocket, WebSocketDisconnect
from dotenv import load_dotenv

from routers import onboard, analytics

# Load environment variables
load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    print("Intent-First Onboarding Engine starting up...")
    
    # Check for required environment variables
    required_vars = ["GEMINI_API_KEY"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print(f"Warning: Missing environment variables: {', '.join(missing_vars)}")
        print("Please add these to backend/.env before running")
    
    yield
    
    # Shutdown
    print("Intent-First Onboarding Engine shutting down...")


# Create FastAPI application
app = FastAPI(
    title="Intent-First Onboarding Engine",
    description="Personalized onboarding system API",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")
origins = [origin.strip() for origin in cors_origins.split(",")]

# Use simple CORS that allows all for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers
app.include_router(onboard.router, prefix="/api/v1", tags=["onboarding"])
app.include_router(analytics.router, prefix="/api/v1", tags=["analytics"])

c
# Standalone WebSocket endpoint at root level (no prefix)
@app.websocket("/ws/session/{session_id}")
async def websocket_root(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for real-time session trackingv
    This endpoint is at root level to avoid prefix issues.
    """
    # Accept the connection without any authentication
    await websocket.accept()
    
    # Send welcome message
    await websocket.send_json({
        "type": "connected",
        "session_id": session_id,
        "message": "Connected to analytics stream",
    })
    
    # Handle messages from client - echo back
    while True:
        try:
            data = await websocket.receive_text()
            print(f"WebSocket received: {data}")
            
            # Echo back the message
            await websocket.send_json({
                "type": "ack",
                "message": "received",
            })
            
        except Exception as e:
            print(f"WebSocket error: {e}")
            break


@app.get("/")
async def root():
    """Health check endpoint."""
    return JSONResponse(
        content={
            "status": "healthy",
            "service": "Intent-First Onboarding Engine",
            "version": "1.0.0",
        }
    )


@app.get("/health")
async def health_check():
    """Detailed health check."""
    return JSONResponse(
        content={
            "status": "healthy",
            "components": {
                "api": "ok",
                "gemini": "configured" if os.getenv("GEMINI_API_KEY") else "missing",
                "firestore": "configured" if os.getenv("GCP_PROJECT_ID") else "not configured",
            },
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        reload=os.getenv("DEBUG", "true").lower() == "true",
    )
