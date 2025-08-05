import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_slot_spin_betting_limits_too_low():
    """Test that betting amount below 5,000 is rejected."""
    response = client.post(
        "/api/actions/SLOT_SPIN",
        json={"user_id": "12345", "bet_amount": 4999, "lines": 3, "vip_mode": False},
    )
    assert response.status_code == 422  # Validation error

def test_slot_spin_betting_limits_too_high():
    """Test that betting amount above 10,000 is rejected."""
    response = client.post(
        "/api/actions/SLOT_SPIN",
        json={"user_id": "12345", "bet_amount": 10001, "lines": 3, "vip_mode": False},
    )
    assert response.status_code == 422  # Validation error

def test_slot_spin_betting_limits_valid_min():
    """Test that minimum valid betting amount (5,000) is accepted."""
    # This test will only pass with proper mocking of Redis and other dependencies
    # For now, just checking that validation passes
    response = client.post(
        "/api/actions/SLOT_SPIN",
        json={"user_id": "12345", "bet_amount": 5000, "lines": 3, "vip_mode": False},
    )
    # Should not be a validation error (though might fail for other reasons in a real test)
    assert response.status_code != 422

def test_slot_spin_betting_limits_valid_max():
    """Test that maximum valid betting amount (10,000) is accepted."""
    # This test will only pass with proper mocking of Redis and other dependencies
    # For now, just checking that validation passes
    response = client.post(
        "/api/actions/SLOT_SPIN",
        json={"user_id": "12345", "bet_amount": 10000, "lines": 3, "vip_mode": False},
    )
    # Should not be a validation error (though might fail for other reasons in a real test)
    assert response.status_code != 422
