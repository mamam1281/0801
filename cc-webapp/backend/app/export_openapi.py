#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Export current OpenAPI schema to project root for syncing with frontend/docs.
Usage: python -m app.export_openapi

This implementation uses app.openapi() directly to avoid potential incompatibilities
between Starlette's TestClient and the installed HTTP client libraries in runtime.
"""
import json
import os
import sys
from datetime import datetime

# Ensure 'app' package import works when run from different CWDs
HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND_ROOT = os.path.dirname(HERE)
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

from app.main import app


def main() -> None:
    # Invalidate cached schema so newly added routes are included
    try:
        app.openapi_schema = None  # type: ignore[attr-defined]
    except Exception:
        pass
    schema = app.openapi()
    # Always update canonical file
    canonical_path = os.path.join(BACKEND_ROOT, "current_openapi.json")
    with open(canonical_path, "w", encoding="utf-8") as f:
        json.dump(schema, f, ensure_ascii=False, indent=2)
    # Timestamped snapshot for change tracking
    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    snapshot_path = os.path.join(BACKEND_ROOT, f"openapi_{ts}.json")
    with open(snapshot_path, "w", encoding="utf-8") as f:
        json.dump(schema, f, ensure_ascii=False, indent=2)
    print(f"✅ Exported OpenAPI: canonical={canonical_path}, snapshot={snapshot_path}")


if __name__ == "__main__":
    main()
