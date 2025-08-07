#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Export current OpenAPI schema to project root for syncing with frontend/docs.
Usage: python -m app.export_openapi
"""
from fastapi.testclient import TestClient
from app.main import app
import json

if __name__ == "__main__":
    client = TestClient(app)
    schema = client.get("/openapi.json").json()
    with open("../../current_openapi.json", "w", encoding="utf-8") as f:
        json.dump(schema, f, ensure_ascii=False, indent=2)
    print("✅ Exported OpenAPI to cc-webapp/current_openapi.json")
