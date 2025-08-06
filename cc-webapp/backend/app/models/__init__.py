"""
🎰 Casino-Club F2P - 통합 모델 모듈
=================================
모든 데이터베이스 모델의 중앙 집중 관리

✅ 정리 완료 (2025-08-02)
- 중복 제거 및 통합
- 체계적인 분류
- 일관된 import 경로
"""

# Base 클래스 먼저 import
from .auth_models import Base

# Auth 모델들
from .auth_models import (
    User,
    InviteCode,
    LoginAttempt,
    RefreshToken,
    UserSession,
    SecurityEvent,
)

# Game 모델들
from .game_models import (
    Game,
    UserAction,
    UserReward,
    GameSession,
    UserActivity,
    Reward,
    GachaResult,
    UserProgress,
)

# User Segment 모델 추가
from .user_models import UserSegment, VIPAccessLog

# 알림 모델 추가
from .notification_models import Notification

# Quiz 모델들 추가
from .quiz_models import (
    QuizCategory,
    Quiz,
    QuizQuestion,
    QuizAnswer,
    UserQuizAttempt,
    UserQuizAnswer,
    QuizLeaderboard,
    QuizResult,
)

# AI 추천 시스템 모델들 추가
from .ai_models import (
    RecommendationTemplate,
    UserRecommendation,
    RecommendationInteraction,
    UserPreference,
    AIModel,
    ModelPrediction,
    PersonalizationRule,
    ContentPersonalization,
)

# 채팅 시스템 모델들 추가
from .chat_models import (
    ChatRoom,
    ChatParticipant,
    ChatMessage,
    MessageReaction,
    AIAssistant,
    AIConversation,
    AIMessage,
    EmotionProfile,
    ChatModeration,
)

# 모든 모델 클래스들을 리스트로 정의
__all__ = [
    # Base
    "Base",
    
    # Auth
    "User",
    "InviteCode", 
    "LoginAttempt",
    "RefreshToken",
    "UserSession",
    "SecurityEvent",
    
    # Game
    "Game",
    "UserAction",
    "UserReward",
    "GameSession", 
    "UserActivity",
    "Reward",
    "GachaResult",
    "UserProgress",

    # User
        # User Segments
    "UserSegment",
    "VIPAccessLog",
    
    # Notifications
    "Notification",
    
    # Quiz
    "QuizCategory",
    "Quiz", 
    "QuizQuestion",
    "QuizAnswer",
    "UserQuizAttempt",
    "UserQuizAnswer",
    "QuizLeaderboard",
    
    # AI Recommendation
    "RecommendationTemplate",
    "UserRecommendation",
    "RecommendationInteraction", 
    "UserPreference",
    "AIModel",
    "ModelPrediction",
    "PersonalizationRule",
    "ContentPersonalization",
    
    # Chat System
    "ChatRoom",
    "ChatParticipant",
    "ChatMessage",
    "MessageReaction",
    "AIAssistant",
    "AIConversation",
    "AIMessage",
    "EmotionProfile",
    "ChatModeration",

    # Content Models
    "AdultContent",
    "ContentView",
    "ContentLike",
    "ContentPurchase",
    "ContentCategory",
    "ContentTag",

    # Analytics Models
    "SiteVisit",
    "UserAnalytics",

    # Emotion Models
    "SupportedEmotion",

    # Mission Models
    "Mission",
    "UserMissionProgress",
    "PageView",
    "ConversionEvent",
    "ABTestParticipant",
    "CustomEvent",
]

# Content 모델들 추가
from .content_models import (
    AdultContent,
    ContentView,
    ContentLike,
    ContentPurchase,
    ContentCategory,
    ContentTag,
)

# Mission 모델들 추가
from .mission_models import Mission, UserMissionProgress

# Analytics 모델들 추가
from .analytics_models import (
    SiteVisit,
    UserAnalytics,
    PageView,
    ConversionEvent,
    ABTestParticipant,
    CustomEvent,
)

# Emotion 모델들 추가
from .emotion_models import SupportedEmotion
