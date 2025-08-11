import os
import time
from datetime import timedelta

import pytest
from jose import jwt
from fastapi import HTTPException

from app.services.auth_service import AuthService, SECRET_KEY, ALGORITHM


def test_password_hash_and_verify():
    pwd = "s3cret!"
    hashed = AuthService.get_password_hash(pwd)
    assert hashed and isinstance(hashed, str)
    assert AuthService.verify_password(pwd, hashed) is True
    assert AuthService.verify_password("wrong", hashed) is False


def test_create_and_verify_access_token_roundtrip():
    payload = {"sub": "site_123", "user_id": 42, "is_admin": False}
    token = AuthService.create_access_token(payload, expires_delta=timedelta(minutes=1))
    assert isinstance(token, str) and token.count(".") == 2
    data = AuthService.verify_token(token)
    assert data.site_id == "site_123"
    assert data.user_id == 42
    assert data.is_admin is False


def test_token_expiration_enforced():
    payload = {"sub": "user", "user_id": 1}
    # Create an already-expired token to avoid timing flakiness
    token = AuthService.create_access_token(payload, expires_delta=timedelta(seconds=-1))
    with pytest.raises(HTTPException):
        AuthService.verify_token(token)


def test_jwt_is_signed_with_expected_algo_and_key():
    payload = {"sub": "siteX", "user_id": 7}
    token = AuthService.create_access_token(payload, expires_delta=timedelta(minutes=1))
    header = jwt.get_unverified_header(token)
    assert header.get("alg") == ALGORITHM
    # sanity: decoding with wrong key should fail
    with pytest.raises(Exception):
        jwt.decode(token, SECRET_KEY + "-wrong", algorithms=[ALGORITHM])
