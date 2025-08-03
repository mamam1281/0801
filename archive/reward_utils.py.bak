# cc-webapp/backend/app/utils/reward_utils.py
import random
from sqlalchemy.orm import Session
from sqlalchemy import desc # For ordering
from datetime import datetime
import logging

# Assuming models are available via 'from .. import models'
from .. import models

logger = logging.getLogger(__name__)

# This should be consistent with routers.unlock.py or a central config
MAX_UNLOCK_STAGE = 3

# --- Helper function for unlock check ---
def _check_eligibility_for_next_unlock_stage(user_id: int, db: Session) -> int | None:
    """
    Checks if a user is eligible to unlock a new stage.
    Returns the next stage number if eligible and content exists, otherwise None.
    This function DOES NOT perform the unlock or check segment requirements.
    """
    latest_unlock_reward = db.query(models.UserReward).filter(
        models.UserReward.user_id == user_id,
        models.UserReward.reward_type == "CONTENT_UNLOCK"
    ).order_by(desc(models.UserReward.awarded_at)).first() # Assuming awarded_at defines sequence.
                                                          # Could also order by CAST(reward_value AS INTEGER) DESC.

    last_stage_unlocked = 0
    if latest_unlock_reward and latest_unlock_reward.reward_value:
        try:
            last_stage_unlocked = int(latest_unlock_reward.reward_value)
        except ValueError:
            logger.error(f"_check_eligibility_for_next_unlock_stage: User {user_id}, invalid reward_value '{latest_unlock_reward.reward_value}' for CONTENT_UNLOCK.")
            last_stage_unlocked = 0 # Or handle as error

    next_stage = last_stage_unlocked + 1
    if next_stage > MAX_UNLOCK_STAGE:
        logger.info(f"_check_eligibility_for_next_unlock_stage: User {user_id} has unlocked all stages (last: {last_stage_unlocked}).")
        return None # All stages unlocked or surpassed

    # Check if content for this next_stage exists
    content_for_next_stage = db.query(models.AdultContent).filter(models.AdultContent.stage == next_stage).first()
    if not content_for_next_stage:
        logger.info(f"_check_eligibility_for_next_unlock_stage: User {user_id}, no content found for next stage {next_stage}.")
        return None # No content for this stage

    logger.info(f"_check_eligibility_for_next_unlock_stage: User {user_id} is eligible for unlock of stage {next_stage}.")
    return next_stage


# --- Main utility functions ---
def calculate_daily_streak_reward(user_id: int, streak_count: int, db: Session) -> dict | None:
    """
    Calculates if a daily streak reward should be given.
    If a reward is determined, it might suggest a content unlock or give coins.
    The actual unlock is performed by the GET /api/unlock endpoint.
    This function returns a dictionary describing the reward, or None.
    The caller is responsible for creating UserReward entries.
    """
    # Example: Higher streak, higher chance of a "better" reward.
    # Probability for any reward: Min 10%, +1% per streak day, max 40%.
    base_probability = 0.10 + (streak_count * 0.01)
    reward_probability = min(base_probability, 0.40)

    if random.random() < reward_probability:
        logger.info(f"User {user_id} (streak {streak_count}) met daily reward condition (prob: {reward_probability:.2f}).")

        # Decision: Attempt unlock or give coins?
        # Let's say, every 7 streak days, try for an unlock if eligible, otherwise coins.
        # Or, 20% chance of unlock attempt, 80% coins.
        if random.random() < 0.20: # 20% chance to try for an unlock
            next_eligible_stage = _check_eligibility_for_next_unlock_stage(user_id, db)
            if next_eligible_stage:
                # This indicates an unlock *could* happen.
                # The /api/unlock endpoint will do the full check (segment, etc.) and award.
                # The caller of this function (e.g. /api/actions for daily_check_in)
                # should inform the frontend that an unlock is available/attemptable.
                logger.info(f"User {user_id} daily reward: Potential unlock for stage {next_eligible_stage}. Frontend should prompt user or call /api/unlock.")
                return {"type": "POTENTIAL_UNLOCK", "stage": next_eligible_stage, "message": f"You might be eligible to unlock new content (Stage {next_eligible_stage})!"}

        # Default reward: COINS
        coins_rewarded = 10 + streak_count # e.g., 10 coins + 1 per streak day
        logger.info(f"User {user_id} daily reward: Awarded {coins_rewarded} coins.")
        return {"type": "COIN", "amount": coins_rewarded, "message": f"You received {coins_rewarded} coins for your daily streak!"}

    logger.info(f"User {user_id} (streak {streak_count}) did not meet daily reward condition (prob: {reward_probability:.2f}).")
    return None


GACHA_ITEMS_POOL = [
    # {"type": "COIN", "value_range": (min_val, max_val), "weight": X},
    # {"type": "CONTENT_UNLOCK", "stage": N, "weight": Y}, -> result {"type": "CONTENT_UNLOCK", "stage": N}
    # {"type": "BADGE", "value": "BADGE_NAME", "weight": Z} -> result {"type": "BADGE", "badge_name": "BADGE_NAME"}

    # Example Pool (ensure weights sum to a convenient number, e.g., 100 or 1000)
    {"item_type": "COIN", "details": {"min_amount": 10, "max_amount": 50}, "weight": 400},
    {"item_type": "COIN", "details": {"min_amount": 50, "max_amount": 200}, "weight": 150},
    {"item_type": "BADGE", "details": {"badge_name": "FIRST_SPIN"}, "weight": 150}, # Example badge
    {"item_type": "BADGE", "details": {"badge_name": "LUCKY_STREAK"}, "weight": 50},
    {"item_type": "CONTENT_UNLOCK", "details": {"stage": 1}, "weight": 100},
    {"item_type": "CONTENT_UNLOCK", "details": {"stage": 2}, "weight": 80},
    {"item_type": "CONTENT_UNLOCK", "details": {"stage": 3}, "weight": 70},
    # Fallback / "Dud" prize
    {"item_type": "COIN", "details": {"min_amount": 1, "max_amount": 5}, "weight": 50},
] # Total weight = 1000

def spin_gacha(user_id: int, db: Session) -> dict:
    """
    Simulates a gacha spin and returns the item won.
    The caller (e.g., an /api/actions endpoint for GACHA_SPIN) is responsible for:
    1. Deducting gacha cost (if any).
    2. Recording the gacha result as a UserReward.
    3. If CONTENT_UNLOCK is the result, the frontend should then be prompted to call /api/unlock.    """
    choices, weights = zip(*[(item, item["weight"]) for item in GACHA_ITEMS_POOL])
    chosen_item_template = random.choices(choices, weights=weights, k=1)[0]

    item_type = chosen_item_template["item_type"]
    details = chosen_item_template["details"]
    
    gacha_result: dict = {"user_id": user_id}

    if item_type == "COIN":
        amount = random.randint(details["min_amount"], details["max_amount"])
        gacha_result["type"] = "COIN"
        gacha_result["amount"] = amount
        gacha_result["message"] = f"You won {amount} coins!"
        logger.info(f"Gacha result for user {user_id}: {amount} COINs.")
    elif item_type == "BADGE":
        badge_name = details["badge_name"]
        gacha_result["type"] = "BADGE"
        gacha_result["badge_name"] = badge_name
        gacha_result["message"] = f"You won the '{badge_name}' badge!"
        logger.info(f"Gacha result for user {user_id}: BADGE '{badge_name}'.")
    elif item_type == "CONTENT_UNLOCK":
        stage_to_potentially_unlock = details["stage"]

        # Check if user has already unlocked this stage or beyond to avoid duplicate "wins" of same stage unlock
        latest_unlock_reward = db.query(models.UserReward).filter(
            models.UserReward.user_id == user_id,
            models.UserReward.reward_type == "CONTENT_UNLOCK"
        ).order_by(desc(models.UserReward.awarded_at)).first() # Or by int value of stage

        last_stage_unlocked = 0
        if latest_unlock_reward and hasattr(latest_unlock_reward, 'reward_value') and latest_unlock_reward.reward_value:
            try:
                last_stage_unlocked = int(latest_unlock_reward.reward_value)
            except ValueError: # Should not happen if reward_value for CONTENT_UNLOCK is always int string
                logger.error(f"spin_gacha: User {user_id}, invalid reward_value '{latest_unlock_reward.reward_value}' for CONTENT_UNLOCK.")
                last_stage_unlocked = 0

        if stage_to_potentially_unlock <= last_stage_unlocked:
            # User already unlocked this or a higher stage, give fallback COIN reward
            fallback_coins = random.randint(10, 30)
            gacha_result["type"] = "COIN"
            gacha_result["amount"] = fallback_coins
            gacha_result["message"] = f"You already unlocked stage {stage_to_potentially_unlock} or higher! Here's {fallback_coins} coins instead."
            logger.info(f"Gacha result for user {user_id}: CONTENT_UNLOCK for stage {stage_to_potentially_unlock} (already unlocked or surpassed). Awarding fallback {fallback_coins} COINs.")
        else:
            # User won a new content unlock stage. Frontend should be informed to call /api/unlock.
            # The /api/unlock endpoint will verify segment eligibility.
            gacha_result["type"] = "CONTENT_UNLOCK"
            gacha_result["stage"] = stage_to_potentially_unlock
            gacha_result["message"] = f"Congratulations! You've won a chance to unlock new content (Stage {stage_to_potentially_unlock})!"
            logger.info(f"Gacha result for user {user_id}: CONTENT_UNLOCK for stage {stage_to_potentially_unlock}.")
    else: # Should not happen if GACHA_ITEMS_POOL is well-defined
        logger.error(f"spin_gacha: User {user_id}, unknown item_type '{item_type}' from GACHA_ITEMS_POOL.")
        gacha_result["type"] = "COIN"
        gacha_result["amount"] = 1
        gacha_result["message"] = "Here's a small consolation prize." # Default consolation

    return gacha_result
