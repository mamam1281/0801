from .recommendation import FinalRecommendation
from app.schemas.user import User, UserCreate, UserLogin, UserUpdate, Token, TokenPayload, UserRegister, UserResponse
from app.schemas.admin import UserActivity, UserActivityCreate, Reward, RewardCreate, AdminDashboardData
from app.schemas.notification import Notification, NotificationCreate, NotificationBase
from app.schemas.site_visit import SiteVisit, SiteVisitCreate, SiteVisitBase
from app.schemas.user_action import UserAction, UserActionCreate, UserActionBase
from app.schemas.invite_code import InviteCode, InviteCodeCreate, InviteCodeBase, InviteCodeResponse, InviteCodeList
from app.schemas.feedback import FeedbackResponse, FeedbackRequest, FeedbackLog
from app.schemas.adult_content import AdultContentDetail
from app.schemas.adult_content import AdultContentGalleryItem
from app.schemas.adult_content import AdultContentStageBase
from app.schemas.adult_content import AdultContentGalleryResponse
from app.schemas.adult_content import ContentPreviewResponse
from app.schemas.adult_content import ContentUnlockResponse
from app.schemas.adult_content import AccessUpgradeRequest
from app.schemas.adult_content import AccessUpgradeResponse
from app.schemas.adult_content import ContentUnlockRequestNew
from app.schemas.adult_content import UnlockHistoryResponse

# VIP schemas
from app.schemas.vip import VIPInfoResponse, VIPExclusiveContentItem