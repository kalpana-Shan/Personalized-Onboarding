"""
Onboarding Router for Intent-First Onboarding Engine.

Provides the POST /onboard endpoint for capturing user preferences
and generating personalized session configurations.
"""

import uuid
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Header, Request
from pydantic import ValidationError

from models.schemas import (
    OnboardRequest,
    OnboardResponse,
    SessionConfig,
    DropOffEvent,
)
from services import gemini_nlp, persona_matcher, firestore_client

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()


@router.post("/onboard", response_model=OnboardResponse)
async def onboard_user(
    request_data: OnboardRequest,
    request: Request,
    x_device_type: Optional[str] = Header(None, alias="X-Device-Type"),
    x_utm_source: Optional[str] = Header(None, alias="X-UTM-Source"),
    x_utm_campaign: Optional[str] = Header(None, alias="X-UTM-Campaign"),
) -> OnboardResponse:
    """
    Process user onboarding and generate personalized session config.
    
    Full pipeline:
    1. Extract intent from success_text using Gemini NLP
    2. Match persona using cosine similarity
    3. Store user profile in Firestore
    4. Return personalized session_config
    
    Args:
        request_data: User's onboarding data
        request: FastAPI request for headers
        x_device_type: Device type from header
        x_utm_source: UTM source from header
        x_utm_campaign: UTM campaign from header
        
    Returns:
        OnboardResponse with session configuration
    """
    try:
        # Generate session ID
        session_id = str(uuid.uuid4())
        uid = request_data.uid
        
        logger.info(f"Processing onboarding for user: {uid}")
        
        # Step 1: Extract intent using Gemini NLP
        intent_vector = gemini_nlp.extract_intent_with_retry(
            request_data.success_text
        )
        
        # Step 2: Match persona
        session_config_dict = persona_matcher.get_session_config(
            goal=request_data.goal,
            skill_level=request_data.skill_level,
            intent=intent_vector
        )
        
        # Step 3: Prepare user profile data
        profile_data = {
            "uid": uid,
            "goal": request_data.goal.value,
            "skill_level": request_data.skill_level,
            "success_text": request_data.success_text,
            "device_type": x_device_type or request_data.device_type.value,
            "utm_source": x_utm_source or request_data.utm_source,
            "utm_campaign": x_utm_campaign or request_data.utm_campaign,
            "intent_vector": (
                intent_vector.model_dump() if intent_vector else None
            ),
            "persona": session_config_dict.get("persona"),
            "session_config": session_config_dict,
            "session_id": session_id,
        }
        
        # Step 4: Generate AI learning recommendations with validation
        goal_str = request_data.goal.value
        validation_result = persona_matcher.validate_and_enrich_description(
            goal=goal_str,
            experience=request_data.skill_level,
            description=request_data.success_text
        )
        
        # Extract results
        is_valid = validation_result.get("is_valid", True)
        validation_message = validation_result.get("validation_message", "")
        learning_recommendations = validation_result.get("learning_recommendations", [])
        
        # Add learning recommendations and validation to session config
        session_config_dict["learning_recommendations"] = learning_recommendations
        session_config_dict["validation_message"] = validation_message
        session_config_dict["is_valid"] = is_valid
        
        # Step 4: Save to Firestore
        fs_client = firestore_client.get_firestore_client()
        fs_client.save_user_profile(uid, profile_data)
        
        # Log the result
        logger.info(
            f"Onboarding complete: user={uid}, "
            f"persona={session_config_dict.get('persona')}"
        )
        
        # Return response
        session_config = SessionConfig(
            persona=session_config_dict.get("persona", "slow-explorer"),
            highlight_features=session_config_dict.get("highlight_features", []),
            content_tone=session_config_dict.get("content_tone", "friendly"),
            first_task=session_config_dict.get("first_task", "explore"),
            skip_modules=session_config_dict.get("skip_modules", []),
            learning_recommendations=session_config_dict.get("learning_recommendations", []),
            validation_message=session_config_dict.get("validation_message", ""),
            is_valid=session_config_dict.get("is_valid", True),
        )
        
        return OnboardResponse(
            session_config=session_config,
            user_id=uid,
            session_id=session_id,
        )
        
    except ValidationError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Error in onboard endpoint: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/personas")
async def get_personas():
    """
    Get all available persona archetypes.
    
    Returns:
        List of persona definitions
    """
    try:
        personas = persona_matcher.get_persona_library().get_all_personas()
        return {"personas": personas}
    except Exception as e:
        logger.error(f"Error getting personas: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/personas/{persona_id}")
async def get_persona(persona_id: str):
    """
    Get a specific persona by ID.
    
    Args:
        persona_id: The persona ID to retrieve
        
    Returns:
        Persona definition
    """
    persona = persona_matcher.get_persona_config(persona_id)
    
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    
    return persona
