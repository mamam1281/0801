"""API 엔드포인트 확인"""
import requests
import json

def check_api_endpoints():
    """사용 가능한 API 엔드포인트 확인"""
    base_url = "http://localhost:8000"
    
    try:
        # OpenAPI 스키마 가져오기
        response = requests.get(f"{base_url}/openapi.json")
        if response.status_code == 200:
            openapi_data = response.json()
            
            print("🔍 사용 가능한 API 엔드포인트:")
            print("=" * 50)
            
            paths = openapi_data.get("paths", {})
            for path, methods in paths.items():
                for method, details in methods.items():
                    if method.upper() in ["GET", "POST", "PUT", "DELETE"]:
                        summary = details.get("summary", "")
                        print(f"{method.upper():6} {path:30} - {summary}")
            
            # 인증 관련 엔드포인트 찾기
            auth_endpoints = []
            for path in paths.keys():
                if "auth" in path.lower() or "login" in path.lower() or "signup" in path.lower():
                    auth_endpoints.append(path)
            
            print("\n🔐 인증 관련 엔드포인트:")
            print("=" * 50)
            for endpoint in auth_endpoints:
                print(f"   {endpoint}")
                
        else:
            print(f"❌ OpenAPI 스키마 가져오기 실패: {response.status_code}")
            
    except Exception as e:
        print(f"❌ API 확인 오류: {e}")

if __name__ == "__main__":
    check_api_endpoints()
