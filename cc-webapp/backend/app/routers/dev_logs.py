from fastapi import APIRouter, Request, status

router = APIRouter(prefix="/api/dev", tags=["dev"], include_in_schema=False)


@router.post('/logs', status_code=status.HTTP_204_NO_CONTENT)
async def receive_logs(request: Request):
    """개발용: 프론트에서 전송하는 디버그/추적 로그를 수신합니다. 프로덕션에 포함 금지."""
    try:
        payload = await request.json()
    except Exception:
        payload = await request.body()
    # 간단히 로그에 출력합니다. 운영 환경에서는 파일/외부 수집기로 전송하도록 변경하세요.
    try:
        print('[dev_logs] received logs:')
        print(payload)
    except Exception:
        pass
    return None
