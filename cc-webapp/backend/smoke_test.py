import httpx, json, os, sys

BASE = os.environ.get("BASE", "http://localhost:8000")
SITE_ID = os.environ.get("SITE_ID", "smoke_user")
PASSWORD = os.environ.get("PASSWORD", "1234")

client = httpx.Client(base_url=BASE, timeout=10.0)

def main():
    print("BASE:", BASE)
    # Health
    try:
        r = client.get("/health")
        print("health", r.status_code, r.text)
    except Exception as e:
        print("health_exc", e)

    data = None
    # Signup
    try:
        r = client.post(
            "/api/auth/signup",
            json={
                "site_id": SITE_ID,
                "nickname": "Smoke",
                "phone_number": "01000000000",
                "invite_code": "5858",
                "password": PASSWORD,
            },
        )
        print("signup", r.status_code, r.text)
        data = r.json()
    except Exception as e:
        print("signup_exc", e)
        data = None

    # Login fallback
    if not data or "access_token" not in data:
        try:
            r = client.post("/api/auth/login", json={"site_id": SITE_ID, "password": PASSWORD})
            print("login", r.status_code, r.text)
            data = r.json()
        except Exception as e:
            print("login_exc", e)
            sys.exit(1)

    token = data.get("access_token", "")
    if not token:
        print("no token")
        sys.exit(1)

    headers = {"Authorization": f"Bearer {token}"}

    # Games list
    try:
        r = client.get("/api/games/", headers=headers)
        print("games", r.status_code, len(r.text))
    except Exception as e:
        print("games_exc", e)

    # RPS play
    try:
        r = client.post("/api/games/rps/play", headers=headers, json={"choice": "rock", "bet_amount": 10})
        print("rps", r.status_code, r.text)
    except Exception as e:
        print("rps_exc", e)

if __name__ == "__main__":
    main()
