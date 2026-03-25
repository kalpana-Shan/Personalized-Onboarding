"""
Gemini NLP Service for Intent-First Onboarding Engine.

Uses Google Gemini Flash API to extract structured intent from user success text.
"""

import os
import json
import logging
from typing import Optional

from google import genai
from pydantic import ValidationError

from models.schemas import IntentVector, IntentStyle, UrgencyLevel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Model fallback list for handling 429 errors
MODEL_FALLBACK_LIST = [
    "models/gemini-2.0-flash-lite",
    "models/gemini-2.0-flash",
    "models/gemini-1.5-flash-latest",
    "models/gemini-1.5-pro-latest"
]

# Gemini prompt template
INTENT_EXTRACTION_PROMPT = """Extract a structured intent from this user goal description. 

Return ONLY valid JSON with these exact fields:
- domain: string (e.g., "development", "marketing", "design", "data", "business")
- urgency: string ("low", "medium", or "high")
- style: string ("visual", "hands-on", or "theoretical")

User input: {success_text}

Respond with ONLY JSON, no additional text or explanation."""


def get_gemini_client() -> genai.Client:
    """
    Get configured Gemini client.
    
    Returns:
        Configured GenAI client
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.warning("GEMINI_API_KEY not found in environment")
        raise ValueError("GEMINI_API_KEY not configured")
    
    client = genai.Client(api_key=api_key)
    return client


def extract_intent(success_text: str) -> Optional[IntentVector]:
    """
    Extract structured intent from user success text using Gemini Flash API.
    
    Args:
        success_text: User's description of what success looks like
        
    Returns:
        IntentVector if successful, None otherwise
    """
    # Try each model in the fallback list
    for model_name in MODEL_FALLBACK_LIST:
        try:
            logger.info(f"Trying Gemini model: {model_name}")
            client = get_gemini_client()
            
            # Prepare the prompt
            prompt = INTENT_EXTRACTION_PROMPT.format(success_text=success_text)
            
            # Call Gemini API
            response = client.models.generate_content(
                model=model_name,
                contents=prompt
            )
            
            logger.info(f"Successfully used model: {model_name}")
            
            # Parse response
            result = response.text
            
            # Clean up response (remove markdown code blocks if present)
            if result.startswith('```'):
                result = result.split('```')[1]
                if result.startswith('json'):
                    result = result[4:]
            result = result.strip()
            
            # Parse JSON
            intent_data = json.loads(result)
            
            # Validate and create IntentVector
            # Map string values to enums
            style_map = {
                "visual": IntentStyle.VISUAL,
                "hands-on": IntentStyle.HANDS_ON,
                "hands_on": IntentStyle.HANDS_ON,
                "theoretical": IntentStyle.THEORETICAL,
            }
            urgency_map = {
                "low": UrgencyLevel.LOW,
                "medium": UrgencyLevel.MEDIUM,
                "high": UrgencyLevel.HIGH,
            }
            
            intent_vector = IntentVector(
                domain=intent_data.get("domain", "general"),
                urgency=urgency_map.get(intent_data.get("urgency", "medium"), UrgencyLevel.MEDIUM),
                style=style_map.get(intent_data.get("style", "hands-on"), IntentStyle.HANDS_ON),
            )
            
            logger.info(f"Successfully extracted intent: {intent_vector}")
            return intent_vector
            
        except Exception as e:
            error_msg = str(e)
            if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg or "quota" in error_msg.lower() or "404" in error_msg or "NOT_FOUND" in error_msg:
                logger.warning(f"Model {model_name} failed, trying next...")
                continue
            else:
                logger.error(f"Error calling Gemini API: {e}")
                break
    
    # All models failed, use fallback
    return _fallback_intent()


def _fallback_intent() -> IntentVector:
    """
    Provide fallback intent when Gemini API fails.
    
    Returns:
        IntentVector with default values
    """
    logger.info("Using fallback intent values")
    return IntentVector(
        domain="general",
        urgency=UrgencyLevel.MEDIUM,
        style=IntentStyle.HANDS_ON,
    )


def get_fallback_response() -> dict:
    """
    Provide fallback response when Gemini API fails.
    
    Returns:
        Dict with default learning recommendations
    """
    logger.info("Using fallback response with learning recommendations")
    return {
        "is_valid": True,
        "validation_message": "",
        "domain": "technology",
        "urgency": "medium",
        "style": "hands-on",
        "learning_recommendations": [
            {
                "type": "video",
                "title": "Getting Started Guide",
                "why": "Perfect introduction for your goal",
                "link": "https://youtube.com"
            },
            {
                "type": "notes",
                "title": "Core Concepts Documentation",
                "why": "Essential reading for your level",
                "link": "https://docs.google.com"
            },
            {
                "type": "quiz",
                "title": "Knowledge Check Quiz",
                "why": "Test your understanding",
                "link": "#"
            }
        ]
    }


def extract_intent_with_retry(
    success_text: str, 
    max_retries: int = 3
) -> Optional[IntentVector]:
    """
    Extract intent with retry logic.
    
    Args:
        success_text: User's description of what success looks like
        max_retries: Maximum number of retry attempts
        
    Returns:
        IntentVector if successful, None otherwise
    """
    for attempt in range(max_retries):
        result = extract_intent(success_text)
        if result:
            return result
        
        if attempt < max_retries - 1:
            logger.warning(f"Retry {attempt + 1}/{max_retries} for intent extraction")
    
    return _fallback_intent()


def generate_text(prompt: str, max_retries: int = 2) -> Optional[str]:
    """
    Generate text content using Gemini Flash API.
    
    Args:
        prompt: The prompt to send to Gemini
        max_retries: Maximum number of retry attempts
        
    Returns:
        Generated text if successful, None otherwise
    """
    # Try each model in the fallback list
    for model_name in MODEL_FALLBACK_LIST:
        try:
            logger.info(f"Trying Gemini model: {model_name}")
            client = get_gemini_client()
            
            response = client.models.generate_content(
                model=model_name,
                contents=prompt
            )
            
            logger.info(f"Successfully used model: {model_name}")
            
            if response.text:
                return response.text.strip()
            
        except Exception as e:
            error_msg = str(e)
            if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg or "quota" in error_msg.lower() or "404" in error_msg or "NOT_FOUND" in error_msg:
                logger.warning(f"Model {model_name} failed, trying next...")
                continue
            else:
                logger.error(f"Error generating text (attempt): {e}")
                break
    
    logger.error("Failed to generate text after all retries")
    return None


if __name__ == "__main__":
    print("Testing Gemini connection...")
    result = extract_intent("I want to learn Agentic AI")
    print("Result:", result)
