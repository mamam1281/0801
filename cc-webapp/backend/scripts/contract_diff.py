"""Contract Diff 유틸리티

목적:
  ECONOMY_V2_ACTIVE 플래그 ON/OFF 두 상태에서 특정 엔드포인트 응답 JSON key set 차이를 수집/비교.

사용 (컨테이너 내부):
  ECONOMY_V2_ACTIVE=false python -m scripts.contract_diff --endpoints /api/games/slot/spin /api/games/gacha/pull > off.json
  ECONOMY_V2_ACTIVE=true  python -m scripts.contract_diff --endpoints /api/games/slot/spin /api/games/gacha/pull > on.json
  # 또는 한 번에 비교
  python -m scripts.contract_diff --endpoints /api/games/slot/spin /api/games/gacha/pull --output current.json

사후 diff (호스트에서):
  python - <<'PY'
import json,sys
on=json.load(open('on.json','r',encoding='utf-8'))
off=json.load(open('off.json','r',encoding='utf-8'))
by_ep={}
for ep in {*(r['endpoint'] for r in on['results']), *(r['endpoint'] for r in off['results'])}:
    on_keys=set(); off_keys=set()
    for r in on['results']:
        if r['endpoint']==ep: on_keys.update(r.get('keys',[]))
    for r in off['results']:
        if r['endpoint']==ep: off_keys.update(r.get('keys',[]))
    by_ep[ep]={
        'only_in_on': sorted(on_keys-off_keys),
        'only_in_off': sorted(off_keys-on_keys),
        'common': sorted(on_keys & off_keys)
    }
print(json.dumps(by_ep,ensure_ascii=False,indent=2))
PY
"""
from __future__ import annotations
import os
import json
import argparse
from typing import List, Dict, Any
import httpx

DEFAULT_TIMEOUT = 10.0


def fetch(endpoint: str, base_url: str, token: str | None) -> Dict[str, Any]:
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    url = base_url.rstrip("/") + endpoint
    method = "POST"
    if endpoint.endswith("/config") or endpoint.endswith("/stats") or endpoint.endswith("/profile"):
        method = "GET"
    with httpx.Client(timeout=DEFAULT_TIMEOUT) as client:
        if method == "GET":
            r = client.get(url, headers=headers)
        else:
            # 기본 body 비워두되 문제 없게 {} 전송
            r = client.post(url, json={}, headers=headers)
        try:
            data = r.json()
        except Exception:
            data = {"_raw_text": r.text}
        keys = list(data.keys()) if isinstance(data, dict) else []
        return {"status": r.status_code, "endpoint": endpoint, "keys": sorted(keys), "data": data}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--endpoints", nargs="+", required=True, help="비교할 엔드포인트 목록 (예: /api/games/slot/spin /api/games/gacha/pull)")
    parser.add_argument("--base-url", default=os.getenv("BASE_URL", "http://localhost:8000"))
    parser.add_argument("--token", default=os.getenv("TEST_TOKEN"))
    parser.add_argument("--output", help="JSON 결과 저장 경로")
    args = parser.parse_args()

    results: List[Dict[str, Any]] = []
    for ep in args.endpoints:
        try:
            results.append(fetch(ep, args.base_url, args.token))
        except Exception as e:
            results.append({"endpoint": ep, "error": str(e), "keys": []})

    out = {
        "flag_state": ("on" if os.getenv("ECONOMY_V2_ACTIVE", "false").lower() in ("1", "true", "yes") else "off"),
        "results": results,
    }

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False, indent=2)
    else:
        print(json.dumps(out, ensure_ascii=False, indent=2))


if __name__ == "__main__":  # pragma: no cover
    main()
