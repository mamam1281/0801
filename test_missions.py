import requests
import json

# 로그인
login_data = {'site_id': 'user001', 'password': '123455'}
login_response = requests.post('http://localhost:8000/api/auth/login', json=login_data)

if login_response.status_code == 200:
    token = login_response.json()['access_token']
    print('✅ 로그인 성공!')

    # 미션 목록 조회
    headers = {'Authorization': f'Bearer {token}'}
    missions_response = requests.get('http://localhost:8000/api/events/missions/all', headers=headers)
    print(f'📋 미션 목록 조회: {missions_response.status_code}')

    if missions_response.status_code == 200:
        missions = missions_response.json()
        print(f'📊 총 {len(missions)}개의 미션 발견')
        for mission in missions[:2]:  # 처음 2개만 표시
            print(f'  - ID {mission["mission_id"]}: {mission["title"]} (목표: {mission["target_value"]} {mission["target_type"]})')

    # 미션 진행 상황 업데이트 테스트
    update_data = {
        'mission_id': 1,  # 첫 번째 미션
        'progress_increment': 1
    }
    update_response = requests.put('http://localhost:8000/api/events/missions/progress',
                                 json=update_data, headers=headers)
    print(f'🎯 미션 진행 업데이트: {update_response.status_code}')

    if update_response.status_code == 200:
        result = update_response.json()
        print('✅ 미션 진행 업데이트 성공!')
        print('업데이트 결과:', json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print('❌ 미션 진행 업데이트 실패:', update_response.text)

else:
    print('❌ 로그인 실패:', login_response.text)