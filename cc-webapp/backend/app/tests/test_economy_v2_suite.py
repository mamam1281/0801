import os

# Force enable V2 economy for this aggregated suite
os.environ["ECONOMY_V2_ACTIVE"] = "true"

from .test_slot_v2_economy import test_slot_spin_v2  # noqa: F401
from .test_rps_v2_economy import test_rps_play_v2  # noqa: F401
from .test_gacha_v2_economy import test_gacha_pull_v2  # noqa: F401
from .test_game_stats_v2 import test_game_stats_v2  # noqa: F401

# Pytest will discover the imported test functions.
