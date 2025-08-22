import json
import os
from pathlib import Path

# 간단한 OpenAPI 계약 변화 감시 스모크
# 컨테이너 내부에서 실행 가정(파일 경로는 프로젝트 표준을 따름)

ROOT = Path("/workspace").resolve() if Path("/workspace").exists() else Path("/")
# 백엔드 저장 위치(레포 구조에 맞춰 상대 경로 계산)
BASE = Path(__file__).resolve().parents[3]  # cc-webapp/backend/app/tests -> cc-webapp
CUR_SPEC = BASE / "backend" / "app" / "current_openapi.json"
SNAPSHOT = BASE / "backend" / "app" / "openapi_snapshot.json"

REQUIRED_PATHS = [
    "/health",
    "/api/auth/login",
    "/api/actions",
    "/api/shop/buy",
]

def test_openapi_is_valid_json():
    assert CUR_SPEC.exists(), f"current_openapi.json not found: {CUR_SPEC}"
    data = json.loads(CUR_SPEC.read_text(encoding="utf-8"))
    assert isinstance(data, dict)
    # 최소 경로 확인
    paths = data.get("paths") or {}
    for p in REQUIRED_PATHS:
        assert p in paths, f"required path missing in OpenAPI: {p}"


def test_openapi_snapshot_diff_is_generated_when_changed():
    # 스냅샷이 있으면 핵심 경로 삭제 같은 파괴적 변경을 거칠게 감지
    if not SNAPSHOT.exists():
        # 스냅샷이 아직 없다면 초기화 단계로 통과(차기 CI에서 비교)
        return
    cur = json.loads(CUR_SPEC.read_text(encoding="utf-8"))
    old = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
    cur_paths = set((cur.get("paths") or {}).keys())
    old_paths = set((old.get("paths") or {}).keys())
    removed = old_paths - cur_paths
    # 중요한 경로가 제거되면 실패(필요 시 allowlist 적용)
    breaking = removed.intersection(set(REQUIRED_PATHS))
    assert not breaking, f"Breaking OpenAPI change: required paths removed: {sorted(breaking)}"
