"""
Casino-Club F2P 게임 API 통합 테스트
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_auth():
    """인증 테스트"""
    print("\n🔐 인증 테스트")
    
    # 로그인 시도
    login_data = {
        "username": "test_user_01",
        "password": "test1234"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/auth/login", 
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    if response.status_code == 200:
        token_data = response.json()
        print("✅ 로그인 성공")
        return token_data["access_token"]
    else:
        print(f"❌ 로그인 실패: {response.status_code} - {response.text}")
        
        # 로그인 실패 시 회원가입 시도
        print("새 계정으로 회원가입 시도...")
        signup_data = {
            "site_id": "test_user_02",
            "nickname": "테스트유저2",
            "phone_number": "01098765432",
            "invite_code": "5858",
            "password": "test1234"
        }
        
        signup_response = requests.post(f"{BASE_URL}/api/auth/signup", json=signup_data)
        if signup_response.status_code == 200:
            print("✅ 회원가입 성공")
            
            # 회원가입 성공 시 새 계정으로 로그인
            login_data = {
                "username": "test_user_02",
                "password": "test1234"
            }
            
            login_response = requests.post(
                f"{BASE_URL}/api/auth/login", 
                data=login_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if login_response.status_code == 200:
                token_data = login_response.json()
                print("✅ 새 계정으로 로그인 성공")
                return token_data["access_token"]
            else:
                print(f"❌ 새 계정 로그인 실패: {login_response.status_code} - {login_response.text}")
                return None
        else:
            print(f"❌ 회원가입 실패: {signup_response.status_code} - {signup_response.text}")
            return None

def test_games(token):
    """게임 API 테스트"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n🎮 게임 목록 조회")
    response = requests.get(f"{BASE_URL}/api/games/", headers=headers)
    if response.status_code == 200:
        games = response.json()
        print(f"✅ 게임 목록 조회 성공: {len(games)}개 게임")
        for game in games[:3]:
            print(f"  - {game.get('name', 'Unknown')}: {game.get('description', '')}")
    else:
        print(f"❌ 게임 목록 조회 실패: {response.status_code}")

def test_slot_game(token):
    """슬롯 게임 테스트"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n🎰 슬롯 게임 테스트")
    
    # 슬롯 스핀
    spin_data = {"bet_amount": 100, "lines": 5}
    response = requests.post(f"{BASE_URL}/api/games/slot/spin", json=spin_data, headers=headers)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ 슬롯 스핀 성공")
        print(f"  - 릴: {result.get('reels', [])}")
        print(f"  - 당첨금: {result.get('win_amount', 0)}")
        print(f"  - 잔액: {result.get('balance', 0)}")
    else:
        print(f"❌ 슬롯 스핀 실패: {response.status_code} - {response.text}")

def test_gacha_game(token):
    """가챠 게임 테스트"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n🎁 가챠 시스템 테스트")
    
    # 가챠 뽑기
    gacha_data = {"gacha_id": "basic_gacha", "pull_count": 1}
    response = requests.post(f"{BASE_URL}/api/games/gacha/pull", json=gacha_data, headers=headers)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ 가챠 뽑기 성공")
        print(f"  - 획득 아이템: {result.get('items', [])}")
        print(f"  - 메시지: {result.get('message', '')}")
    else:
        print(f"❌ 가챠 뽑기 실패: {response.status_code} - {response.text}")

def test_crash_game(token):
    """네온크래시 게임 테스트"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n⚡ 네온크래시 게임 테스트")
    
    # 베팅
    bet_data = {"bet_amount": 100, "auto_cashout_multiplier": 2.0}
    response = requests.post(f"{BASE_URL}/api/games/crash/bet", json=bet_data, headers=headers)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ 네온크래시 베팅 성공")
        print(f"  - 게임 ID: {result.get('game_id', '')}")
        print(f"  - 베팅 금액: {result.get('bet_amount', 0)}")
        print(f"  - 잠재 당첨금: {result.get('potential_win', 0)}")
    else:
        print(f"❌ 네온크래시 베팅 실패: {response.status_code} - {response.text}")

def test_missions(token):
    """미션 시스템 테스트"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n🎯 미션 시스템 테스트")
    
    # 일일 미션 조회
    response = requests.get(f"{BASE_URL}/api/events/missions/daily", headers=headers)
    if response.status_code == 200:
        missions = response.json()
        print(f"✅ 일일 미션 조회 성공: {len(missions)}개 미션")
        for mission in missions[:3]:
            print(f"  - {mission.get('mission', {}).get('title', 'Unknown')}")
    else:
        print(f"❌ 일일 미션 조회 실패: {response.status_code}")

def test_events(token):
    """이벤트 시스템 테스트"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n🎉 이벤트 시스템 테스트")
    
    # 활성 이벤트 조회
    response = requests.get(f"{BASE_URL}/api/events/", headers=headers)
    if response.status_code == 200:
        events = response.json()
        print(f"✅ 이벤트 조회 성공: {len(events)}개 이벤트")
        for event in events[:3]:
            print(f"  - {event.get('title', 'Unknown')}: {event.get('description', '')}")
    else:
        print(f"❌ 이벤트 조회 실패: {response.status_code}")

def main():
    """메인 테스트 실행"""
    print("🎰 Casino-Club F2P 게임 API 통합 테스트 시작")
    
    # 인증
    token = test_auth()
    if not token:
        print("❌ 인증 실패로 테스트 중단")
        return
    
    # 게임 기능 테스트
    test_games(token)
    test_slot_game(token)
    test_gacha_game(token)
    test_crash_game(token)
    test_missions(token)
    test_events(token)
    
    print("\n✅ 테스트 완료!")

if __name__ == "__main__":
    main()
