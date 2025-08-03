from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import random

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 경품 정의 (프론트엔드와 동일)
PRIZES = [
    {"id": "coins_100", "name": "코인 100개", "value": 100, "color": "#FFD700", "probability": 0.30},
    {"id": "coins_500", "name": "코인 500개", "value": 500, "color": "#FFA500", "probability": 0.25},
    {"id": "coins_1000", "name": "코인 1000개", "value": 1000, "color": "#FF6B35", "probability": 0.20},
    {"id": "gems_10", "name": "젬 10개", "value": 10, "color": "#9D4EDD", "probability": 0.15},
    {"id": "gems_50", "name": "젬 50개", "value": 50, "color": "#7209B7", "probability": 0.07},
    {"id": "jackpot", "name": "잭팟! 젬 200개", "value": 200, "color": "#FF0080", "probability": 0.02},
    {"id": "bonus", "name": "보너스 스핀", "value": 1, "color": "#00FF88", "probability": 0.01}
]

# 임시 스핀 저장소 (실제론 데이터베이스 사용)
user_spins = {}

class PrizeRouletteSpinResponse(BaseModel):
    success: bool
    prize: Optional[dict]
    message: str
    spins_left: int
    cooldown_expires: Optional[str]

class PrizeRouletteInfoResponse(BaseModel):
    spins_left: int
    prizes: list[dict]
    max_daily_spins: int

def get_user_spins_left(user_id: int = 1) -> int:
    """사용자의 남은 스핀 횟수 조회 (테스트용)"""
    if user_id not in user_spins:
        user_spins[user_id] = 3
    return user_spins[user_id]

def select_random_prize() -> dict:
    """확률에 따른 경품 선택"""
    weights = [prize["probability"] for prize in PRIZES]
    selected_prize = random.choices(PRIZES, weights=weights, k=1)[0]
    return selected_prize

@app.get("/api/games/roulette/info", response_model=PrizeRouletteInfoResponse)
async def get_roulette_info():
    """룰렛 정보 조회"""
    spins_left = get_user_spins_left()
    return PrizeRouletteInfoResponse(
        spins_left=spins_left,
        prizes=PRIZES,
        max_daily_spins=3
    )

@app.post("/api/games/roulette/spin", response_model=PrizeRouletteSpinResponse)
async def spin_prize_roulette():
    """경품추첨 룰렛 스핀"""
    user_id = 1  # 테스트용 고정 사용자 ID
    spins_left = get_user_spins_left(user_id)
    
    if spins_left <= 0:
        return PrizeRouletteSpinResponse(
            success=False,
            prize=None,
            message="오늘의 스핀 횟수를 모두 사용했습니다. 내일 다시 도전하세요!",
            spins_left=0,
            cooldown_expires=None
        )
    
    # 경품 추첨
    prize = select_random_prize()
    
    # 스핀 횟수 차감
    user_spins[user_id] = spins_left - 1
    
    return PrizeRouletteSpinResponse(
        success=True,
        prize=prize,
        message=f"축하합니다! {prize['name']}을(를) 획득했습니다!",
        spins_left=user_spins[user_id],
        cooldown_expires=None
    )

@app.get("/")
async def root():
    return {"message": "Prize Roulette API Server"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)
