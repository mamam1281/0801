from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

router = APIRouter(prefix="/test", tags=["테스트"])

class TestUserCreate(BaseModel):
    site_id: str
    password: str
    nickname: str

@router.post("/simple-register")
async def simple_register(user: TestUserCreate):
    """간단한 테스트용 회원가입"""
    try:
        return {"message": "테스트 성공", "user": user.site_id}
    except Exception as e:
        return {"error": str(e)}
