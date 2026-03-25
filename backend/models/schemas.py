"""
Pydantic models for the Intent-First Onboarding Engine.

Defines request/response schemas for all API endpoints.
"""

from typing import Optional, List, Dict
from enum import Enum
from pydantic import BaseModel, Field, field_validator


# Enums
class GoalEnum(str, Enum):
    """User goal options for onboarding."""
    LEARN = "learn"
    BUILD = "build"
    EXPLORE = "explore"
    COLLABORATE = "collaborate"


class SkillLevel(int, Enum):
    """Skill level from 1 (Beginner) to 5 (Expert)."""
    BEGINNER = 1
    NOVICE = 2
    INTERMEDIATE = 3
    ADVANCED = 4
    EXPERT = 5


class DeviceType(str, Enum):
    """Device type for tracking."""
    MOBILE = "mobile"
    TABLET = "tablet"
    DESKTOP = "desktop"


class ContentTone(str, Enum):
    """Content tone for personalized sessions."""
    TECHNICAL = "technical"
    FRIENDLY = "friendly"
    MINIMAL = "minimal"
    DETAILED = "detailed"


class IntentStyle(str, Enum):
    """Style of learning/interaction."""
    VISUAL = "visual"
    HANDS_ON = "hands-on"
    THEORETICAL = "theoretical"


class UrgencyLevel(str, Enum):
    """Urgency level for intent extraction."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


# Request Models
class OnboardRequest(BaseModel):
    """Request body for POST /onboard endpoint."""
    
    uid: str = Field(..., description="Unique user identifier")
    goal: GoalEnum = Field(..., description="User's primary goal")
    skill_level: SkillLevel = Field(..., description="User's skill level (1-5)")
    success_text: str = Field(
        ..., 
        description="User's description of what success looks like",
        max_length=500
    )
    device_type: DeviceType = Field(default=DeviceType.DESKTOP, description="Device type")
    utm_source: Optional[str] = Field(None, description="UTM source from referral")
    utm_campaign: Optional[str] = Field(None, description="UTM campaign")
    
    @field_validator('success_text')
    @classmethod
    def success_text_not_empty(cls, v: str) -> str:
        """Validate success text is not empty."""
        if not v or not v.strip():
            raise ValueError("success_text cannot be empty")
        return v.strip()


class DropOffEvent(BaseModel):
    """Request body for POST /analytics/drop-off endpoint."""
    
    uid: str = Field(..., description="Unique user identifier")
    persona: str = Field(..., description="Current persona ID")
    step: int = Field(..., description="Step where event occurred", ge=1)
    time_spent: int = Field(..., description="Time spent on step in seconds", ge=0)
    idle_triggered: bool = Field(default=False, description="Whether idle was detected")
    scroll_depth: Optional[int] = Field(None, description="Scroll depth percentage", ge=0, le=100)
    event_type: Optional[str] = Field(None, description="Type of event (scroll, click, idle, exit)")


# Response Models
class IntentVector(BaseModel):
    """Intent vector extracted from user success text."""
    
    domain: str = Field(..., description="Primary domain of interest")
    urgency: UrgencyLevel = Field(..., description="Urgency level")
    style: IntentStyle = Field(..., description="Preferred interaction style")
    
    def to_list(self) -> List[float]:
        """Convert to feature vector for similarity calculation."""
        style_map = {
            IntentStyle.VISUAL: [0.8, 0.2, 0.0],
            IntentStyle.HANDS_ON: [0.2, 0.8, 0.0],
            IntentStyle.THEORETICAL: [0.0, 0.2, 0.8],
        }
        urgency_map = {
            UrgencyLevel.LOW: 0.2,
            UrgencyLevel.MEDIUM: 0.5,
            UrgencyLevel.HIGH: 0.9,
        }
        
        style_vec = style_map.get(self.style, [0.33, 0.33, 0.34])
        urgency_val = urgency_map.get(self.urgency, 0.5)
        
        return [
            style_vec[0],  # visual_score
            style_vec[1],  # hands_on_score
            style_vec[2],  # theoretical_score
            urgency_val,  # urgency
        ]


class SessionConfig(BaseModel):
    """Session configuration for personalized first session."""
    
    persona: str = Field(..., description="Matched persona ID")
    highlight_features: List[str] = Field(..., description="Features to highlight")
    content_tone: ContentTone = Field(..., description="Content tone")
    first_task: str = Field(..., description="Pre-selected first task")
    skip_modules: List[str] = Field(default_factory=list, description="Modules to skip")
    learning_recommendations: List[Dict] = Field(default_factory=list, description="AI-generated learning recommendations")
    validation_message: Optional[str] = Field(default="", description="Validation message for skill mismatch")
    is_valid: bool = Field(default=True, description="Whether the user's goal matches their skill level")


class OnboardResponse(BaseModel):
    """Response body for POST /onboard endpoint."""
    
    session_config: SessionConfig = Field(..., description="Personalized session config")
    user_id: str = Field(..., description="User ID")
    session_id: str = Field(..., description="Session ID for tracking")


class DropOffResponse(BaseModel):
    """Response body for POST /analytics/drop-off endpoint."""
    
    status: str = Field(default="recorded", description="Status of the event")
    session_id: str = Field(..., description="Session ID")


class AnalyticsSummary(BaseModel):
    """Analytics summary response."""
    
    total_users: int = Field(..., description="Total number of users")
    completion_rate: float = Field(..., description="Onboarding completion rate")
    persona_distribution: dict = Field(..., description="Distribution by persona")
    average_session_duration: float = Field(..., description="Average session duration in seconds")
    drop_off_by_step: dict = Field(..., description="Drop-off counts by step")


# WebSocket Models
class WSClientMessage(BaseModel):
    """WebSocket message from client."""
    
    type: str = Field(..., description="Message type (scroll, click, step_enter, step_exit, idle_start, idle_end)")
    data: dict = Field(default_factory=dict, description="Message data")


class WSRescuePrompt(BaseModel):
    """Rescue prompt sent to client."""
    
    type: str = Field(default="rescue_prompt", description="Message type")
    message: str = Field(..., description="Rescue prompt message")
    options: List[dict] = Field(default_factory=list, description="Available rescue options")


# User Profile Model (for Firestore)
class UserProfile(BaseModel):
    """User profile stored in Firestore."""
    
    uid: str
    goal: GoalEnum
    skill_level: int
    success_text: str
    device_type: DeviceType
    utm_source: Optional[str] = None
    utm_campaign: Optional[str] = None
    intent_vector: Optional[IntentVector] = None
    persona: Optional[str] = None
    created_at: str = Field(..., description="ISO timestamp")
    updated_at: str = Field(..., description="ISO timestamp")
