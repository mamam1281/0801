# 경고 정리 체크리스트

- [ ] Pydantic v2: BaseModel `class Config` → `model_config = ConfigDict(...)`로 전환
- [ ] FastAPI Query/Path `regex=` → `pattern=`로 전환
- [ ] httpx TestClient/WSGITransport 경고 제거(테스트 클라이언트 초기화 조정, httpx==0.27.0 확인)
- [ ] OpenAPI operationId 중복 제거(라우터 전수 검사, export 후 스냅샷 비교)
- [ ] pytest 실행 시 경고 레벨을 에러로 끌어올려 누락 감지(선택)
