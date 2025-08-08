#!/usr/bin/env python3
import json
import os


def test_rps_operation_id_present():
    """Ensure RPS play endpoint has a stable unique operationId."""
    path = os.path.join(os.path.dirname(__file__), "..", "current_openapi.json")
    path = os.path.abspath(path)
    assert os.path.exists(path), f"OpenAPI file not found: {path}"
    with open(path, "r", encoding="utf-8") as f:
        schema = json.load(f)
    post = schema.get("paths", {}).get("/api/games/rps/play", {}).get("post", {})
    assert post, "POST /api/games/rps/play not found in OpenAPI"
    assert post.get("operationId") == "games_rps_play_v1"
