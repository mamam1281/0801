"""
ì´ˆë?ì½”ë“œ ê´€??API ?¼ìš°??
- ì´ˆë?ì½”ë“œ ? íš¨??ê²€ì¦?API (/api/invite/validate)
- ê³ ì • ì´ˆë?ì½”ë“œ: 6969, 6974, 2560
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Path, Body

from typing import List, Optional
from pydantic import BaseModel

from app.database import get_db
from app.services.invite_service import InviteService
from app.schemas.invite_code import InviteCodeResponse, InviteCodeList
from app.core.error_handlers import UserServiceException

# ì´ˆë?ì½”ë“œ ?ì„± ?”ì²­ ?¤í‚¤ë§?
class InviteCodeGenerateRequest(BaseModel):
    count: Optional[int] = 1
    length: Optional[int] = 6
    max_uses: Optional[int] = 1
    days_valid: Optional[int] = 30

# ?¼ìš°???¤ì •
router = APIRouter(
    prefix="/api/invite",
    tags=["invite"],
    responses={404: {"description": "Not found"}},
)

@router.get("/validate/{code}", response_model=dict)
async def validate_invite_code(
    code: str = Path(..., description="ê²€ì¦í•  ì´ˆë?ì½”ë“œ"),
    db = Depends(get_db)
):
    """
    ì´ˆë?ì½”ë“œ ? íš¨??ê²€ì¦?API
    
    Args:
        code: ê²€ì¦í•  ì´ˆë?ì½”ë“œ
        db: ?°ì´?°ë² ?´ìŠ¤ ?¸ì…˜
        
    Returns:
        ? íš¨??ê²€ì¦?ê²°ê³¼
        
    Raises:
        HTTPException: ì´ˆë?ì½”ë“œê°€ ? íš¨?˜ì? ?Šì? ê²½ìš°
    """
    invite_service = InviteService(db)
    try:
        result = invite_service.validate_invite_code(code)
        return {
            "valid": True,
            "detail": "? íš¨??ì´ˆë?ì½”ë“œ?…ë‹ˆ??",
            "code": result["code"],
            "created_at": result["created_at"],
            "is_special": result["is_special"]
        }
    except UserServiceException as e:
        return {
            "valid": False,
            "detail": e.message,
            "error_code": e.error_code
        }

@router.get("/list", response_model=InviteCodeList)
async def list_invite_codes(
    limit: int = Query(10, description="ì¡°íšŒ??ìµœë? ??ª© ??),
    offset: int = Query(0, description="ì¡°íšŒ ?œì‘??),
    db = Depends(get_db)
):
    """
    ì´ˆë?ì½”ë“œ ëª©ë¡ ì¡°íšŒ
    
    Args:
        limit: ì¡°íšŒ??ìµœë? ??ª© ??
        offset: ì¡°íšŒ ?œì‘??
        db: ?°ì´?°ë² ?´ìŠ¤ ?¸ì…˜
        
    Returns:
        ì´ˆë?ì½”ë“œ ëª©ë¡
    """
    invite_service = InviteService(db)
    invite_codes = invite_service.list_invite_codes(limit, offset)
    
    return {
        "invite_codes": invite_codes
    }

@router.post("/generate", response_model=InviteCodeList)
async def generate_invite_codes(
    request: InviteCodeGenerateRequest = Body(...),
    db = Depends(get_db)
):
    """
    ë³´ì•ˆ???’ì? ì´ˆë?ì½”ë“œ ?ì„± API
    
    Args:
        request: ì´ˆë?ì½”ë“œ ?ì„± ?”ì²­ ?•ë³´
        db: ?°ì´?°ë² ?´ìŠ¤ ?¸ì…˜
        
    Returns:
        ?ì„±??ì´ˆë?ì½”ë“œ ëª©ë¡
    """
    invite_service = InviteService(db)
    
    # ?Œë¼ë¯¸í„° ê²€ì¦?
    if request.count <= 0:
        return HTTPException(status_code=400, detail="?ì„±??ì½”ë“œ ?˜ëŠ” 1 ?´ìƒ?´ì–´???©ë‹ˆ??")
    if request.length < 4:
        return HTTPException(status_code=400, detail="ì½”ë“œ ê¸¸ì´??ìµœì†Œ 4???´ìƒ?´ì–´???©ë‹ˆ??")
    
    # ?€??ì´ˆë?ì½”ë“œ ?ì„±
    invite_codes = invite_service.generate_bulk_invite_codes(
        count=request.count,
        length=request.length,
        max_uses=request.max_uses,
        days_valid=request.days_valid
    )
    
    return {
        "invite_codes": invite_codes
    }

@router.get("/{code}", response_model=InviteCodeResponse)
async def get_invite_code(
    code: str = Path(..., description="ì¡°íšŒ??ì´ˆë?ì½”ë“œ"),
    db = Depends(get_db)
):
    """
    ?¹ì • ì´ˆë?ì½”ë“œ ì¡°íšŒ API
    
    Args:
        code: ì¡°íšŒ??ì´ˆë?ì½”ë“œ
        db: ?°ì´?°ë² ?´ìŠ¤ ?¸ì…˜
        
    Returns:
        ì´ˆë?ì½”ë“œ ?•ë³´
    """
    invite_service = InviteService(db)
    invite_code = invite_service.get_invite_code(code)
    
    if not invite_code:
        raise HTTPException(status_code=404, detail=f"ì´ˆë?ì½”ë“œ {code}ë¥?ì°¾ì„ ???†ìŠµ?ˆë‹¤.")
    
    return invite_code
