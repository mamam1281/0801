from app.services.auth_service import AuthService


def test_rank_access_matrix():
    # STANDARD < PREMIUM < VIP
    assert AuthService.check_rank_access("STANDARD", "STANDARD") is True
    assert AuthService.check_rank_access("STANDARD", "PREMIUM") is False
    assert AuthService.check_rank_access("VIP", "PREMIUM") is True
    assert AuthService.check_rank_access("PREMIUM", "VIP") is False


def test_combined_access_requires_both_conditions():
    # Needs both rank and segment
    assert AuthService.check_combined_access("VIP", 5, "PREMIUM", 3) is True
    assert AuthService.check_combined_access("STANDARD", 5, "PREMIUM", 3) is False  # rank fails
    assert AuthService.check_combined_access("VIP", 2, "PREMIUM", 3) is False  # segment fails
