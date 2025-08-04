# 파일 위치: c:\Users\bdbd\Downloads\auto202506-a-main\auto202506-a-main\cc-webapp\backend\app\schemas\site_visit.py
from pydantic import BaseModel
from datetime import datetime

class SiteVisitBase(BaseModel):
    user_id: int
    source: str

class SiteVisitCreate(SiteVisitBase):
    pass

class SiteVisit(SiteVisitBase):
    id: int
    visit_timestamp: datetime

    class Config:
        from_attributes = True