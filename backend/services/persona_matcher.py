"""
Persona Matcher Service for Intent-First Onboarding Engine.

Uses sklearn cosine_similarity to match user intent vectors against persona archetypes.
"""

import json
import os
import logging
from typing import List, Dict, Optional, Tuple

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

from models.schemas import IntentVector, GoalEnum, DeviceType
from services.gemini_nlp import generate_text

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Feature weights for combining multiple signals
GOAL_WEIGHT = 0.3
SKILL_WEIGHT = 0.2
INTENT_WEIGHT = 0.5

# Default persona when no match is found
DEFAULT_PERSONA = "slow-explorer"


class PersonaLibrary:
    """Library of persona archetypes."""
    
    def __init__(self, personas_path: Optional[str] = None):
        """
        Initialize persona library.
        
        Args:
            personas_path: Path to personas.json file
        """
        if personas_path is None:
            # Get the path relative to this file
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            personas_path = os.path.join(base_dir, "data", "personas.json")
        
        self.personas_path = personas_path
        self.personas: List[Dict] = []
        self.persona_vectors: np.ndarray = None
        self.persona_ids: List[str] = []
        self._load_personas()
    
    def _load_personas(self) -> None:
        """Load personas from JSON file."""
        try:
            with open(self.personas_path, 'r') as f:
                data = json.load(f)
                self.personas = data.get('personas', [])
                self.persona_ids = [p['id'] for p in self.personas]
                self.persona_vectors = np.array([p['feature_vector'] for p in self.personas])
                
            logger.info(f"Loaded {len(self.personas)} personas")
        except FileNotFoundError:
            logger.error(f"Personas file not found: {self.personas_path}")
            self.personas = []
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse personas.json: {e}")
            self.personas = []
    
    def get_persona_by_id(self, persona_id: str) -> Optional[Dict]:
        """Get persona configuration by ID."""
        for persona in self.personas:
            if persona['id'] == persona_id:
                return persona
        return None
    
    def get_all_personas(self) -> List[Dict]:
        """Get all personas."""
        return self.personas


# Global persona library instance
_persona_library: Optional[PersonaLibrary] = None


def get_persona_library() -> PersonaLibrary:
    """Get or create the global persona library instance."""
    global _persona_library
    if _persona_library is None:
        _persona_library = PersonaLibrary()
    return _persona_library


def map_goal_to_vector(goal: GoalEnum) -> List[float]:
    """
    Map user goal to a feature vector.
    
    Args:
        goal: User's selected goal
        
    Returns:
        4-dimensional feature vector
    """
    goal_vectors = {
        GoalEnum.LEARN: [0.5, 0.3, 0.5, 0.5],    # domain, urgency, style, skill
        GoalEnum.BUILD: [0.2, 0.7, 0.8, 0.6],
        GoalEnum.EXPLORE: [0.6, 0.4, 0.4, 0.4],
        GoalEnum.COLLABORATE: [0.4, 0.5, 0.6, 0.5],
    }
    return goal_vectors.get(goal, [0.4, 0.5, 0.5, 0.5])


def map_skill_to_vector(skill_level: int) -> List[float]:
    """
    Map skill level to a feature vector.
    
    Args:
        skill_level: User's skill level (1-5)
        
    Returns:
        4-dimensional feature vector
    """
    # Normalize skill (1-5) to 0.2-1.0
    normalized = 0.2 + (skill_level - 1) * 0.2
    return [0.4, 0.5, 0.5, normalized]


def map_intent_to_vector(intent: Optional[IntentVector]) -> List[float]:
    """
    Map intent vector to feature vector.
    
    Args:
        intent: Extracted intent from NLP
        
    Returns:
        4-dimensional feature vector
    """
    if intent is None:
        return [0.5, 0.5, 0.5, 0.5]
    
    # Map style to vector position 2
    style_map = {
        "visual": 0.8,
        "hands-on": 0.6,
        "theoretical": 0.4,
    }
    style_score = style_map.get(intent.style.value, 0.5)
    
    # Map urgency to vector position 1
    urgency_map = {
        "low": 0.3,
        "medium": 0.5,
        "high": 0.8,
    }
    urgency_score = urgency_map.get(intent.urgency.value, 0.5)
    
    # Domain affects domain score (position 0)
    domain_score = 0.5
    
    return [domain_score, urgency_score, style_score, 0.5]


def build_combined_vector(
    goal: GoalEnum,
    skill_level: int,
    intent: Optional[IntentVector]
) -> np.ndarray:
    """
    Build combined feature vector from multiple signals.
    
    Args:
        goal: User's selected goal
        skill_level: User's skill level (1-5)
        intent: Extracted intent from NLP
        
    Returns:
        Combined 4-dimensional feature vector
    """
    goal_vec = np.array(map_goal_to_vector(goal))
    skill_vec = np.array(map_skill_to_vector(skill_level))
    intent_vec = np.array(map_intent_to_vector(intent))
    
    # Weighted combination
    combined = (
        GOAL_WEIGHT * goal_vec +
        SKILL_WEIGHT * skill_vec +
        INTENT_WEIGHT * intent_vec
    )
    
    return combined


def match_persona(
    goal: GoalEnum,
    skill_level: int,
    intent: Optional[IntentVector] = None
) -> Tuple[str, float]:
    """
    Match user preferences to a persona using cosine similarity.
    
    Args:
        goal: User's selected goal
        skill_level: User's skill level (1-5)
        intent: Extracted intent from NLP (optional)
        
    Returns:
        Tuple of (persona_id, similarity_score)
    """
    library = get_persona_library()
    
    if not library.personas:
        logger.warning("No personas loaded, using default")
        return DEFAULT_PERSONA, 0.0
    
    # Build combined vector
    combined_vector = build_combined_vector(goal, skill_level, intent)
    
    # Reshape for sklearn (needs 2D array)
    combined_vector = combined_vector.reshape(1, -1)
    
    # Calculate cosine similarity with all personas
    similarities = cosine_similarity(
        combined_vector,
        library.persona_vectors
    )[0]
    
    # Find best match
    best_idx = np.argmax(similarities)
    best_score = similarities[best_idx]
    best_persona_id = library.persona_ids[best_idx]
    
    logger.info(f"Matched persona: {best_persona_id} (similarity: {best_score:.3f})")
    
    # Return default if similarity is too low
    if best_score < 0.3:
        logger.warning(f"Low similarity ({best_score:.3f}), using default persona")
        return DEFAULT_PERSONA, best_score
    
    return best_persona_id, float(best_score)


def get_persona_config(persona_id: str) -> Optional[Dict]:
    """
    Get full persona configuration by ID.
    
    Args:
        persona_id: The persona ID to retrieve
        
    Returns:
        Persona configuration dict or None
    """
    library = get_persona_library()
    return library.get_persona_by_id(persona_id)


def get_session_config(
    goal: GoalEnum,
    skill_level: int,
    intent: Optional[IntentVector] = None
) -> Dict:
    """
    Get complete session configuration for a user.
    
    Args:
        goal: User's selected goal
        skill_level: User's skill level (1-5)
        intent: Extracted intent from NLP
        
    Returns:
        Session configuration dict
    """
    persona_id, similarity = match_persona(goal, skill_level, intent)
    persona = get_persona_config(persona_id)
    
    if persona is None:
        logger.error(f"Could not find config for persona: {persona_id}")
        persona = get_persona_config(DEFAULT_PERSONA)
    
    return {
        "persona": persona_id,
        "highlight_features": persona.get("highlight_features", []),
        "content_tone": persona.get("content_tone", "friendly"),
        "first_task": persona.get("first_task", "explore"),
        "skip_modules": persona.get("skip_modules", []),
        "similarity_score": similarity,
        "recommendations": persona.get("recommendations", []),
    }


def generate_learning_recommendations(goal: str, experience: str, description: str) -> List[Dict]:
    """
    Generate AI-powered learning recommendations using Gemini.
    
    Args:
        goal: User's learning goal (e.g., 'learn Python', 'build web apps')
        experience: User's experience level (e.g., 'beginner', 'intermediate', 'advanced')
        description: User's description of what they want to achieve
        
    Returns:
        List of 3 learning recommendation objects
    """
    # Map experience levels to more readable format
    experience_map = {
        1: "beginner",
        2: "beginner",
        3: "intermediate",
        4: "intermediate",
        5: "advanced",
    }
    
    exp_level = experience_map.get(experience, "intermediate")
    
    prompt = f"""User wants to {goal} at {exp_level} level. Description: {description}.
    Recommend 3 TECH learning resources:
    - [type: video/notes/quiz/flashcard], [title], [platform/link], [why perfect fit]
    Examples: Andrew Ng videos, React docs, LeetCode quizzes, LangChain notes
    Return JSON array only.
    Output format:
    [
      {{"type": "video", "title": "...", "platform": "...", "link": "...", "why": "..."}},
      {{"type": "notes", "title": "...", "platform": "...", "link": "...", "why": "..."}},
      {{"type": "quiz", "title": "...", "platform": "...", "link": "...", "why": "..."}}
    ]"""
    
    try:
        result = generate_text(prompt)
        
        # Parse the JSON response
        if result:
            # Try to find JSON in the response
            import re
            json_match = re.search(r'\[.*\]', result, re.DOTALL)
            if json_match:
                recommendations = json.loads(json_match.group())
                return recommendations[:3]  # Return max 3
    except Exception as e:
        logger.error(f"Error generating recommendations: {e}")
    
    # Fallback recommendations
    return [
        {
            "type": "video",
            "title": f"{goal.title()} - Getting Started",
            "platform": "YouTube",
            "link": "https://youtube.com",
            "why": f"Perfect for {exp_level} learners"
        },
        {
            "type": "notes",
            "title": f"{goal.title()} Documentation",
            "platform": "Official Docs",
            "link": "https://docs.example.com",
            "why": "Comprehensive reference guide"
        },
        {
            "type": "quiz",
            "title": f"{goal.title()} Practice Quiz",
            "platform": "LeetCode",
            "link": "https://leetcode.com",
            "why": "Hands-on practice for better retention"
        }
    ]


def validate_and_enrich_description(goal: str, experience: int, description: str) -> Dict:
    """
    Validate user's description and generate AI-powered recommendations.
    
    Checks for skill mismatches and uses Gemini to generate personalized
    recommendations based on the EXACT description provided.
    
    Args:
        goal: User's learning goal
        experience: User's skill level (1-5)
        description: User's description of what they want to achieve
        
    Returns:
        Dict with validation result and AI-generated recommendations
    """
    # Map experience level to readable format
    experience_map = {
        1: "beginner",
        2: "beginner",
        3: "intermediate",
        4: "intermediate",
        5: "advanced",
    }
    exp_level = experience_map.get(experience, "intermediate")
    
    # Keywords that indicate advanced/production goals
    advanced_keywords = [
        "production", "deploy", "scale", "microservices", "kubernetes",
        "CI/CD", "devops", "AWS", "GCP", "azure", "enterprise",
        "real-time", "multi-user", "authentication", "payment",
        "security", "performance optimization", "million users"
    ]
    
    beginner_keywords = [
        "first time", "never", "no experience", "new to", "just starting",
        "basics", "beginner", "introduction", "learn from scratch"
    ]
    
    description_lower = description.lower()
    
    # Check for skill mismatch
    is_valid = True
    validation_message = ""
    
    # Beginner trying advanced things
    if exp_level in ["beginner"]:
        advanced_count = sum(1 for kw in advanced_keywords if kw in description_lower)
        if advanced_count >= 1:
            is_valid = False
            validation_message = (
                f"⚠️ You mentioned '{description[:50]}...' but you're a {exp_level}. "
                f"This goal requires advanced skills. We recommend starting with "
                f"foundational resources first, then tackling production goals."
            )
    
    # Experienced user being too basic
    elif exp_level == "advanced":
        beginner_count = sum(1 for kw in beginner_keywords if kw in description_lower)
        if beginner_count >= 2:
            is_valid = False
            validation_message = (
                f"💡 As an {exp_level} learner, you might find this too basic. "
                f"We've adjusted recommendations to include more advanced content."
            )
    
    # Generate AI recommendations based on EXACT description
    ai_prompt = f"""User goal: {goal}, skill: {experience}, description: '{description}'

Generate 3 learning resources EXACTLY matching their description:
- type: video/notes/quiz
- title: specific resource name  
- why: 1 sentence explaining perfect fit
- link: realistic URL (YouTube/docs/etc)

Return ONLY JSON array."""

    try:
        result = generate_text(ai_prompt)
        
        if result:
            import re
            json_match = re.search(r'\[.*\]', result, re.DOTALL)
            if json_match:
                recommendations = json.loads(json_match.group())
                return {
                    "is_valid": is_valid,
                    "validation_message": validation_message,
                    "learning_recommendations": recommendations[:3]
                }
    except Exception as e:
        logger.error(f"Error in validate_and_enrich: {e}")
    
    # Fallback to regular recommendations
    return {
        "is_valid": True,
        "validation_message": "",
        "learning_recommendations": generate_learning_recommendations(goal, experience, description)
    }
