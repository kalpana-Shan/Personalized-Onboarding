"""
Scheduler for Intent-First Onboarding Engine.

Provides weekly job to recalculate persona weights from drop-off data
using APScheduler.
"""

import json
import logging
import os
from datetime import datetime
from typing import Dict, List, Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from services import firestore_client, persona_matcher

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PersonaWeightUpdater:
    """Updates persona weights based on drop-off data."""
    
    def __init__(self):
        """Initialize the weight updater."""
        self.scheduler = AsyncIOScheduler()
        self.personas_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "data",
            "personas.json"
        )
    
    async def recalculate_weights(self) -> Dict:
        """
        Recalculate persona weights based on drop-off data.
        
        This is a semi-supervised learning loop that adjusts persona
        feature vectors based on:
        - Which personas have higher drop-off rates
        - Which personas have higher rescue success rates
        - Time spent on first session
        
        Returns:
            Dict with update results
        """
        logger.info("Starting weekly persona weight recalculation")
        
        try:
            fs_client = firestore_client.get_firestore_client()
            
            if not fs_client.is_initialized():
                logger.warning("Firestore not initialized, skipping weight recalculation")
                return {"status": "skipped", "reason": "Firestore not initialized"}
            
            # Get all drop-off events
            events_ref = fs_client.db.collection("drop_off_events")
            events = list(events_ref.stream())
            
            if not events:
                logger.info("No drop-off events found, skipping recalculation")
                return {"status": "skipped", "reason": "No events"}
            
            # Analyze by persona
            persona_stats: Dict[str, Dict] = {}
            
            for event_doc in events:
                event = event_doc.to_dict()
                persona = event.get("persona", "unknown")
                
                if persona not in persona_stats:
                    persona_stats[persona] = {
                        "total_events": 0,
                        "idle_triggered": 0,
                        "total_time": 0,
                        "rescue_actions": 0,
                    }
                
                stats = persona_stats[persona]
                stats["total_events"] += 1
                
                if event.get("idle_triggered"):
                    stats["idle_triggered"] += 1
                
                stats["total_time"] += event.get("time_spent", 0)
                
                if event.get("event_type") == "rescue_action":
                    stats["rescue_actions"] += 1
            
            # Calculate adjustment factors
            logger.info(f"Persona stats: {persona_stats}")
            
            # Load current personas
            with open(self.personas_path, 'r') as f:
                data = json.load(f)
            
            personas = data.get("personas", [])
            
            # Adjust weights based on performance
            for persona in personas:
                persona_id = persona.get("id")
                
                if persona_id in persona_stats:
                    stats = persona_stats[persona_id]
                    
                    # Calculate performance score
                    idle_rate = stats["idle_triggered"] / stats["total_events"]
                    avg_time = stats["total_time"] / stats["total_events"]
                    rescue_rate = stats["rescue_actions"] / stats["total_events"]
                    
                    # Adjust urgency based on idle rate (high idle = lower urgency preference)
                    urgency_adjustment = 1.0 - (idle_rate * 0.3)
                    
                    # Adjust style based on rescue rate (high rescue = prefer simpler style)
                    style_adjustment = 1.0 - (rescue_rate * 0.2)
                    
                    # Apply adjustments to feature vector
                    # Vector format: [domain_score, urgency_score, style_score, skill_score]
                    vector = persona.get("feature_vector", [0.5, 0.5, 0.5, 0.5])
                    
                    # Adjust urgency (index 1) and style (index 2)
                    vector[1] = max(0.1, min(1.0, vector[1] * urgency_adjustment))
                    vector[2] = max(0.1, min(1.0, vector[2] * style_adjustment))
                    
                    persona["feature_vector"] = vector
                    
                    logger.info(
                        f"Adjusted persona {persona_id}: "
                        f"idle_rate={idle_rate:.2f}, urgency={vector[1]:.2f}, "
                        f"rescue_rate={rescue_rate}, style={vector[2]:.2f}"
                    )
            
            # Save updated personas
            data["personas"] = personas
            data["metadata"]["last_updated"] = datetime.utcnow().isoformat()
            
            with open(self.personas_path, 'w') as f:
                json.dump(data, f, indent=2)
            
            logger.info("Persona weights recalculated successfully")
            
            return {
                "status": "success",
                "personas_updated": len(personas),
                "persona_stats": persona_stats,
            }
            
        except Exception as e:
            logger.error(f"Error recalculating weights: {e}")
            return {"status": "error", "error": str(e)}
    
    def start_scheduler(self) -> None:
        """Start the weekly scheduler."""
        # Run every Sunday at midnight
        self.scheduler.add_job(
            self.recalculate_weights,
            CronTrigger(day_of_week="sun", hour=0, minute=0),
            id="persona_weight_update",
            name="Weekly Persona Weight Update",
            replace_existing=True,
        )
        
        self.scheduler.start()
        logger.info("Scheduler started - weekly persona weight updates enabled")
    
    def stop_scheduler(self) -> None:
        """Stop the scheduler."""
        self.scheduler.shutdown()
        logger.info("Scheduler stopped")
    
    async def run_now(self) -> Dict:
        """Manually trigger weight update."""
        return await self.recalculate_weights()


# Global scheduler instance
_persona_updater: Optional[PersonaWeightUpdater] = None


def get_persona_updater() -> PersonaWeightUpdater:
    """Get or create the global persona updater instance."""
    global _persona_updater
    if _persona_updater is None:
        _persona_updater = PersonaWeightUpdater()
    return _persona_updater


async def trigger_weight_update() -> Dict:
    """Trigger a manual weight update."""
    updater = get_persona_updater()
    return await updater.run_now()
