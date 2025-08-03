# Casino Club F2P Backend - Router Module Registry
# Clean English comments only - no Unicode issues

# Core authentication and user management
from . import auth  # Authentication system
from . import users  # User API

# Administrative and basic game functions
from . import admin  # Admin API
from . import actions  # Game action API
from . import gacha  # Gacha system API
from . import rewards  # Reward system API
from . import shop  # Shop transaction API
from . import missions  # Mission system API
from . import quiz  # Quiz system API
from . import dashboard  # Dashboard API
from . import prize_roulette  # Prize roulette API
from . import rps  # Rock Paper Scissors API
from . import notifications  # Notification API

# Progressive expansion phases
from . import doc_titles  # Phase 1: Document titles
from . import feedback  # Phase 2: Feedback system
from . import games  # Phase 3: Game collection
from . import game_api  # Phase 4: Unified game API
from . import invite_router  # Phase 5: Invite code system
from . import analyze  # Phase 6: Analytics API
from . import roulette  # Phase 7: Roulette API
from . import segments  # Phase 8: User segmentation
from . import tracking  # Phase 9: User tracking
from . import unlock  # Phase 10: Content unlock system

# AI and Chat systems
from . import ai_router  # AI recommendation system
from . import chat_router as chat  # Chat system

# Export list for controlled imports
__all__ = [
    "auth",
    "users",
    "admin",
    "actions", 
    "gacha",
    "rewards",
    "shop",
    "missions",
    "quiz",
    "dashboard",
    "prize_roulette",
    "rps", 
    "notifications",
    "doc_titles",
    "feedback",
    "games",
    "game_api",
    "invite_router",
    "analyze",
    "roulette",
    "segments",
    "tracking",
    "unlock",
    "ai_router",
    "chat"
]