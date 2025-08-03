"""
KOREAN_TEXT_REMOVEDÔøKOREAN_TEXT_REMOVED Casino-Club F2P - Quiz API Router
===================================
KOREAN_TEXT_REMOVEDÔøKOREAN_TEXT_REMOVED Í≤KOREAN_TEXT_REMOVED ÔøKOREAN_TEXT_REMOVEDÔøKOREAN_TEXT_REMOVED¶¨ KOREAN_TEXT_REMOVEDÔøKOREAN_TEXT_REMOVEDÏ∏°ÏKOREAN_TEXT_REMOVED API
"""

from fastapi import APIRouter, Depends, HTTPException, Query

from typing import List, Optional
import json
from datetime import datetime, timedelta

from ..database import get_db
from ..models.auth_models import User
from ..models.quiz_models import (
    Quiz, QuizCategory, QuizQuestion, QuizAnswer,
    UserQuizAttempt, UserQuizAnswer, QuizLeaderboard
)
from ..schemas.quiz_schemas import (
    QuizResponse, QuizCategoryResponse, QuizQuestionResponse,
    QuizAttemptCreate, QuizAttemptResponse, QuizAnswerSubmit,
    QuizLeaderboardResponse, QuizStatsResponse
)
from ..dependencies import get_current_user
from ..services.quiz_service import QuizService
from ..utils.redis import get_redis_manager
from ..utils.emotion_engine import EmotionEngine

router = APIRouter(prefix="/api/quiz", tags=["Quiz"])

@router.get("/categories", response_model=List[QuizCategoryResponse])
async def get_quiz_categories(
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """KOREAN_TEXT_REMOVEDÔøKOREAN_TEXT_REMOVED ÏπKOREAN_TEXT_REMOVEDÍ≥KOREAN_TEXT_REMOVED¶¨ Î™©ÎKOREAN_TEXT_REMOVED Ï°KOREAN_TEXT_REMOVED"""
    try:
        categories = db.query(QuizCategory).filter(
            QuizCategory.is_active == True
        ).all()
        return categories
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch categories: {str(e)}")


@router.get("/categories/{category_id}/quizzes", response_model=List[QuizResponse])
async def get_quizzes_by_category(
    category_id: int,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """ÏπKOREAN_TEXT_REMOVEDÍ≥KOREAN_TEXT_REMOVED¶¨ÔøKOREAN_TEXT_REMOVEDÔøKOREAN_TEXT_REMOVED Î™©ÎKOREAN_TEXT_REMOVED Ï°KOREAN_TEXT_REMOVED"""
    try:
        quizzes = db.query(Quiz).filter(
            Quiz.category_id == category_id,
            Quiz.is_active == True
        ).all()
        return quizzes
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch quizzes: {str(e)}")


@router.get("/{quiz_id}", response_model=QuizResponse)
async def get_quiz_details(
    quiz_id: int,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """KOREAN_TEXT_REMOVEDÔøKOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVEDÔøKOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVEDÔøKOREAN_TEXT_REMOVED Ï°KOREAN_TEXT_REMOVED"""
    try:
        quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")
        return quiz
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch quiz: {str(e)}")


@router.get("/{quiz_id}/questions", response_model=List[QuizQuestionResponse])
async def get_quiz_questions(
    quiz_id: int,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """KOREAN_TEXT_REMOVEDÔøKOREAN_TEXT_REMOVED Î¨KOREAN_TEXT_REMOVED Î™©ÎKOREAN_TEXT_REMOVED Ï°KOREAN_TEXT_REMOVED"""
    try:
        questions = db.query(QuizQuestion).filter(
            QuizQuestion.quiz_id == quiz_id
        ).order_by(QuizQuestion.order).all()
        return questions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch questions: {str(e)}")


@router.post("/{quiz_id}/start", response_model=QuizAttemptResponse)
async def start_quiz_attempt(
    quiz_id: int,
    attempt_data: QuizAttemptCreate,
    db = Depends(get_db),
    redis = Depends(get_redis_manager),
    current_user: User = Depends(get_current_user)
):
    """KOREAN_TEXT_REMOVEDÔøKOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVEDÔøKOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVEDÔøKOREAN_TEXT_REMOVED"""
    try:
        quiz_service = QuizService(db, redis)
        attempt = await quiz_service.start_quiz_attempt(
            user_id=current_user.id,
            quiz_id=quiz_id,
            attempt_data=attempt_data
        )
        return attempt
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start quiz: {str(e)}")


@router.post("/attempts/{attempt_id}/answer", response_model=dict)
async def submit_quiz_answer(
    attempt_id: int,
    answer_data: QuizAnswerSubmit,
    db = Depends(get_db),
    redis = Depends(get_redis_manager),
    current_user: User = Depends(get_current_user)
):
    """KOREAN_TEXT_REMOVEDÔøKOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVEDÔøKOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVEDÔøKOREAN_TEXT_REMOVED"""
    try:
        quiz_service = QuizService(db, redis)
        result = await quiz_service.submit_answer(
            attempt_id=attempt_id,
            user_id=current_user.id,
            answer_data=answer_data
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit answer: {str(e)}")


@router.post("/attempts/{attempt_id}/complete", response_model=QuizAttemptResponse)
async def complete_quiz_attempt(
    attempt_id: int,
    db = Depends(get_db),
    redis = Depends(get_redis_manager),
    current_user: User = Depends(get_current_user)
):
    """KOREAN_TEXT_REMOVEDÔøKOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVEDÔøKOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVEDÔøKOREAN_TEXT_REMOVED"""
    try:
        quiz_service = QuizService(db, redis)
        result = await quiz_service.complete_quiz_attempt(
            attempt_id=attempt_id,
            user_id=current_user.id
        )
        
        # Í∞KOREAN_TEXT_REMOVED Í∏KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVEDÔøKOREAN_TEXT_REMOVEDÔøKOREAN_TEXT_REMOVEDÔøKOREAN_TEXT_REMOVED
        emotion_engine = EmotionEngine(redis)
        feedback = await emotion_engine.generate_quiz_feedback(
            user_id=current_user.id,
            quiz_result=result
        )
        
        result.feedback = feedback
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to complete quiz: {str(e)}")


@router.get("/attempts/{attempt_id}", response_model=QuizAttemptResponse)
async def get_quiz_attempt(
    attempt_id: int,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """KOREAN_TEXT_REMOVEDÔøKOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVEDÔøKOREAN_TEXT_REMOVED Ï°KOREAN_TEXT_REMOVED"""
    try:
        attempt = db.query(UserQuizAttempt).filter(
            UserQuizAttempt.id == attempt_id,
            UserQuizAttempt.user_id == current_user.id
        ).first()
        
        if not attempt:
            raise HTTPException(status_code=404, detail="Quiz attempt not found")
        
        return attempt
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch attempt: {str(e)}")


@router.get("/user/history", response_model=List[QuizAttemptResponse])
async def get_user_quiz_history(
    limit: int = Query(10, ge=1, le=50),
    offset: int = Query(0, ge=0),
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """KOREAN_TEXT_REMOVEDÔøKOREAN_TEXT_REMOVEDÔøKOREAN_TEXT_REMOVED Í∏KOREAN_TEXT_REMOVED Ï°KOREAN_TEXT_REMOVED"""
    try:
        attempts = db.query(UserQuizAttempt).filter(
            UserQuizAttempt.user_id == current_user.id
        ).order_by(UserQuizAttempt.start_time.desc()).offset(offset).limit(limit).all()
        
        return attempts
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch history: {str(e)}")


@router.get("/leaderboard/{quiz_id}", response_model=List[QuizLeaderboardResponse])
async def get_quiz_leaderboard(
    quiz_id: int,
    period: str = Query("all_time", regex="^(daily|weekly|monthly|all_time)$"),
    limit: int = Query(10, ge=1, le=100),
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """KOREAN_TEXT_REMOVEDÔøKOREAN_TEXT_REMOVED Î¶¨ÎKOREAN_TEXT_REMOVEDÎ≥KOREAN_TEXT_REMOVED Ï°KOREAN_TEXT_REMOVED"""
    try:
        leaderboard = db.query(QuizLeaderboard).filter(
            QuizLeaderboard.quiz_id == quiz_id,
            QuizLeaderboard.period_type == period
        ).order_by(QuizLeaderboard.rank_position).limit(limit).all()
        
        return leaderboard
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch leaderboard: {str(e)}")


@router.get("/user/stats", response_model=QuizStatsResponse)
async def get_user_quiz_stats(
    db = Depends(get_db),
    redis = Depends(get_redis_manager),
    current_user: User = Depends(get_current_user)
):
    """KOREAN_TEXT_REMOVEDÔøKOREAN_TEXT_REMOVEDÔøKOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVEDÔøKOREAN_TEXT_REMOVED Ï°KOREAN_TEXT_REMOVED"""
    try:
        quiz_service = QuizService(db, redis)
        stats = await quiz_service.get_user_stats(current_user.id)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch stats: {str(e)}")


@router.get("/user/risk-profile", response_model=dict)
async def get_user_risk_profile(
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """KOREAN_TEXT_REMOVEDÔøKOREAN_TEXT_REMOVEDÎ¶¨ÏKOREAN_TEXT_REMOVEDÔøKOREAN_TEXT_REMOVEDÏ°KOREAN_TEXT_REMOVED"""
    try:
        # ÏµKOREAN_TEXT_REMOVED Î¶¨ÏKOREAN_TEXT_REMOVEDÔøKOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVEDÔøKOREAN_TEXT_REMOVED Í≤KOREAN_TEXT_REMOVED Ï°KOREAN_TEXT_REMOVED
        recent_attempts = db.query(UserQuizAttempt).join(Quiz).filter(
            UserQuizAttempt.user_id == current_user.id,
            Quiz.quiz_type == "risk_profile",
            UserQuizAttempt.status == "completed"
        ).order_by(UserQuizAttempt.submitted_at.desc()).limit(5).all()
        
        if not recent_attempts:
            return {
                "risk_profile": "unknown",
                "confidence": 0.0,
                "last_assessment": None,
                "recommendations": []
            }
        
        # Î¶¨ÏKOREAN_TEXT_REMOVEDÔøKOREAN_TEXT_REMOVEDÍ≥KOREAN_TEXT_REMOVED (ÏµKOREAN_TEXT_REMOVED Í≤KOREAN_TEXT_REMOVEDÔøKOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVEDÔøKOREAN_TEXT_REMOVED)
        risk_scores = [attempt.final_score for attempt in recent_attempts if attempt.final_score]
        avg_score = sum(risk_scores) / len(risk_scores) if risk_scores else 0
        
        # Î¶¨ÏKOREAN_TEXT_REMOVEDÔøKOREAN_TEXT_REMOVED Í≤KOREAN_TEXT_REMOVED
        if avg_score >= 80:
            risk_level = "high-risk"
        elif avg_score >= 60:
            risk_level = "moderate-risk"
        elif avg_score >= 40:
            risk_level = "calculated-risk"
        else:
            risk_level = "conservative"
        
        return {
            "risk_profile": risk_level,
            "confidence": min(len(recent_attempts) * 0.2, 1.0),
            "last_assessment": recent_attempts[0].submitted_at,
            "recent_scores": risk_scores,
            "recommendations": _get_risk_recommendations(risk_level)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch risk profile: {str(e)}")


def _get_risk_recommendations(risk_level: str) -> List[str]:
    """Î¶¨ÏKOREAN_TEXT_REMOVEDÎ≥KOREAN_TEXT_REMOVEDÏ∂KOREAN_TEXT_REMOVED¨ÌKOREAN_TEXT_REMOVED"""
    recommendations = {
        "high-risk": [
            "KOREAN_TEXT_REMOVEDÍ≤KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED Í∂KOREAN_TEXT_REMOVED©ÎKOREAN_TEXT_REMOVED,
            "KOREAN_TEXT_REMOVED Î≤KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED",
            "KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVEDÎ•KOREAN_TEXT_REMOVED§ÏKOREAN_TEXT_REMOVED Í≤KOREAN_TEXT_REMOVED Ï¢KOREAN_TEXT_REMOVED"
        ],
        "moderate-risk": [
            "Í∑KOREAN_TEXT_REMOVED°ÌKOREAN_TEXT_REMOVED Í≤KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED Í∂KOREAN_TEXT_REMOVED,
            "KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVEDÏ∑®ÌKOREAN_TEXT_REMOVED",
            "KOREAN_TEXT_REMOVED Í¥ÄÎ¶¨ÏKOREAN_TEXT_REMOVED Ï£KOREAN_TEXT_REMOVED
        ],
        "calculated-risk": [
            "KOREAN_TEXT_REMOVED Í≤KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED Í≥KOREAN_TEXT_REMOVED,
            "KOREAN_TEXT_REMOVED§ÏKOREAN_TEXT_REMOVEDÍ≤KOREAN_TEXT_REMOVED",
            "Î¶¨ÏKOREAN_TEXT_REMOVEDÏµKOREAN_TEXT_REMOVED ÏßKOREAN_TEXT_REMOVED
        ],
        "conservative": [
            "KOREAN_TEXT_REMOVED§ÌKOREAN_TEXT_REMOVED Í∂KOREAN_TEXT_REMOVED¶ΩKOREAN_TEXT_REMOVED",
            "Î≥KOREAN_TEXT_REMOVED Ï§KOREAN_TEXT_REMOVEDÍ≤KOREAN_TEXT_REMOVEDÏ¶KOREAN_TEXT_REMOVED",
            "KOREAN_TEXT_REMOVEDÎ°KOREAN_TEXT_REMOVED"
        ]
    }
    return recommendations.get(risk_level, [])
