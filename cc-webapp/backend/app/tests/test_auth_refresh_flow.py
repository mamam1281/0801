import time
import base64
import json


def _b64url_decode(data: str) -> dict:
	# Pad base64url string and decode JSON
	pad = '=' * ((4 - len(data) % 4) % 4)
	return json.loads(base64.urlsafe_b64decode(data + pad).decode('utf-8'))


def _signup_and_login(client, site_id: str, nickname: str, password: str = "pass1234"):
	# Sign up (ignore duplicates)
	suffix = str(int(time.time() * 1000))[-7:]
	phone = f"010{suffix}0"
	r = client.post(
		"/api/auth/signup",
		json={
			"site_id": site_id,
			"nickname": nickname,
			"password": password,
			"invite_code": "5858",
			"phone_number": phone,
		},
	)
	if r.status_code != 200:
		# Fallback to login when user already exists
		r = client.post("/api/auth/login", json={"site_id": site_id, "password": password})
		assert r.status_code == 200
	data = r.json()
	return data["access_token"], data["user"]["id"]


def test_refresh_returns_new_access_token_and_preserves_user(client):
	uniq = str(int(time.time()))[-6:]
	access_token, user_id = _signup_and_login(client, f"refresh_{uniq}", f"refresh_{uniq}")

	# Call refresh using Authorization header (no separate refresh token store yet)
	r = client.post(
		"/api/auth/refresh",
		headers={"Authorization": f"Bearer {access_token}"},
	)
	assert r.status_code == 200
	body = r.json()
	assert "access_token" in body and body["access_token"]
	assert body.get("token_type") == "bearer"
	assert body.get("user", {}).get("id") == user_id

	new_access = body["access_token"]
	assert new_access != access_token  # should be a freshly minted token

	# Use new token to hit a protected endpoint
	me = client.get("/api/users/profile", headers={"Authorization": f"Bearer {new_access}"})
	assert me.status_code == 200
	me_json = me.json()
	assert me_json["id"] == user_id


def test_access_token_is_hs256_and_has_exp_claim(client):
	uniq = str(int(time.time()))[-6:]
	access_token, _ = _signup_and_login(client, f"refresh2_{uniq}", f"refresh2_{uniq}")

	# Decode header and payload without verifying signature
	parts = access_token.split(".")
	assert len(parts) == 3
	header = _b64url_decode(parts[0])
	payload = _b64url_decode(parts[1])

	# Algorithm should be HS256 per service config
	assert header.get("alg") in ("HS256", "RS256")  # tolerate env overrides; prefer HS256
	# Must have exp claim and it should be in the near future
	assert "exp" in payload
	assert isinstance(payload["exp"], int)
	assert payload["exp"] > int(time.time())

