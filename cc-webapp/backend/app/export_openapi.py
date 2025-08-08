#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Export current OpenAPI schema to project root for syncing with frontend/docs.
Usage: python -m app.export_openapi

This implementation uses app.openapi() directly to avoid potential incompatibilities
between Starlette's TestClient and the installed HTTP client libraries in runtime.
"""
import json
from app.main import app


def main() -> None:
    schema = app.openapi()
    out_path = "current_openapi.json"  # Writes to backend workdir (/app)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(schema, f, ensure_ascii=False, indent=2)
    print(f"✅ Exported OpenAPI to {out_path}")


if __name__ == "__main__":
    main()
