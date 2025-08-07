#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Casino-Club F2P 인증 시스템 전체 검증 스크립트
=============================================
회원가입, 로그인, 토큰 관리 등 모든 인증 기능을 검증합니다.
"""

import requests
import json
import time
import random
from typing import Optional, Dict, Any
from colorama import init, Fore, Style
from datetime import datetime

# Colorama 초기화
init()

BASE_URL = "http://localhost:8000"

class AuthSystemTester:
    def __init__(self):
        self.access_token: Optional[str] = None
        self.refresh_token: Optional[str] = None
        self.test_user_data: Dict[str, Any] = {}
        self.test_results = []
        self.session = requests.Session()
        
    def print_header(self, text):
        print(f"\n{Fore.CYAN}{'='*80}{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}🔍 {text}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'='*80}{Style.RESET_ALL}\n")
    
    def print_success(self, text):
        print(f"{Fore.GREEN}✅ {text}{Style.RESET_ALL}")
        self.test_results.append(("SUCCESS", text))
    
    def print_error(self, text):
        print(f"{Fore.RED}❌ {text}{Style.RESET_ALL}")
        self.test_results.append(("ERROR", text))
    
    def print_warning(self, text):
        print(f"{Fore.YELLOW}⚠️ {text}{Style.RESET_ALL}")
        self.test_results.append(("WARNING", text))
    
    def print_info(self, text):
        print(f"{Fore.BLUE}ℹ️ {text}{Style.RESET_ALL}")
    
    def test_health_check(self):
        """서버 상태 확인"""
        self.print_header("서버 상태 확인")
        try:
            response = self.session.get(f"{BASE_URL}/health", timeout=5)
            if response.status_code == 200:
                self.print_success("서버가 정상 작동 중입니다")
                return True
            else:
                self.print_error(f"서버 응답 오류: {response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            self.print_error(f"서버 연결 실패: {str(e)}")
            return False
    
    def test_registration(self):
        """회원가입 테스트"""
        self.print_header("회원가입 기능 테스트")
        
        # 테스트용 고유 사용자 데이터 생성
        timestamp = int(time.time())
        self.test_user_data = {
            "invite_code": "5858",
            "nickname": f"test_user_{timestamp}",
            "site_id": f"test_{timestamp}@casino-club.local",
            "phone_number": f"010{timestamp % 100000000:08d}",
            "password": "test1234"  # 4자리 이상
        }
        
        test_cases = [
            {
                "name": "잘못된 초대 코드로 가입 시도",
                "data": {**self.test_user_data, "invite_code": "9999"},
                "expected_status": [400, 422],
                "should_fail": True
            },
            {
                "name": "짧은 비밀번호로 가입 시도 (3자리)",
                "data": {**self.test_user_data, "invite_code": "5858", "password": "123"},
                "expected_status": [400, 422],
                "should_fail": True
            },
            {
                "name": "정상적인 회원가입 (초대코드 5858)",
                "data": self.test_user_data,
                "expected_status": [200, 201],
                "should_fail": False
            },
            {
                "name": "중복 아이디로 가입 시도",
                "data": self.test_user_data,
                "expected_status": [400, 409, 422],
                "should_fail": True
            }
        ]
        
        for test_case in test_cases:
            self.print_info(f"테스트: {test_case['name']}")
            
            try:
                response = self.session.post(
                    f"{BASE_URL}/auth/register",
                    params=test_case["data"],
                    timeout=5
                )
                
                if test_case["should_fail"]:
                    if response.status_code in test_case["expected_status"]:
                        self.print_success(f"{test_case['name']} - 예상대로 실패")
                    else:
                        self.print_error(f"{test_case['name']} - 예상과 다른 결과: {response.status_code}")
                else:
                    if response.status_code in test_case["expected_status"]:
                        data = response.json()
                        if "access_token" in data:
                            self.access_token = data["access_token"]
                            self.refresh_token = data.get("refresh_token")
                            self.print_success(f"{test_case['name']} - 성공")
                        else:
                            self.print_warning(f"{test_case['name']} - 토큰이 반환되지 않음")
                    else:
                        self.print_error(f"{test_case['name']} - 실패: {response.status_code}")
                        if response.text:
                            print(f"  응답: {response.text[:200]}")
                            
            except requests.exceptions.RequestException as e:
                self.print_error(f"{test_case['name']} - 요청 오류: {str(e)}")
        
        return self.access_token is not None
    
    def test_login(self):
        """로그인 테스트"""
        self.print_header("로그인 기능 테스트")
        
        test_cases = [
            {
                "name": "잘못된 아이디로 로그인",
                "site_id": "nonexistent@casino-club.local",
                "password": "wrongpass",
                "should_fail": True
            },
            {
                "name": "올바른 아이디, 잘못된 비밀번호",
                "site_id": self.test_user_data.get("site_id", "test@casino-club.local"),
                "password": "wrongpass",
                "should_fail": True
            },
            {
                "name": "정상 로그인",
                "site_id": self.test_user_data.get("site_id", "test@casino-club.local"),
                "password": self.test_user_data.get("password", "test1234"),
                "should_fail": False
            }
        ]
        
        for test_case in test_cases:
            self.print_info(f"테스트: {test_case['name']}")
            
            try:
                response = self.session.post(
                    f"{BASE_URL}/auth/login",
                    params={
                        "site_id": test_case["site_id"],
                        "password": test_case["password"]
                    },
                    timeout=5
                )
                
                if test_case["should_fail"]:
                    if response.status_code in [401, 403, 422]:
                        self.print_success(f"{test_case['name']} - 예상대로 실패")
                    else:
                        self.print_error(f"{test_case['name']} - 예상과 다른 결과: {response.status_code}")
                else:
                    if response.status_code == 200:
                        data = response.json()
                        if "access_token" in data:
                            self.access_token = data["access_token"]
                            self.refresh_token = data.get("refresh_token")
                            self.print_success(f"{test_case['name']} - 성공")
                        else:
                            self.print_warning(f"{test_case['name']} - 토큰이 반환되지 않음")
                    else:
                        self.print_error(f"{test_case['name']} - 실패: {response.status_code}")
                        
            except requests.exceptions.RequestException as e:
                self.print_error(f"{test_case['name']} - 요청 오류: {str(e)}")
        
        return True
    
    def test_token_management(self):
        """토큰 관리 테스트"""
        self.print_header("토큰 관리 기능 테스트")
        
        if not self.access_token:
            self.print_warning("액세스 토큰이 없어 테스트를 건너뜁니다")
            return False
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        # 1. 프로필 조회 (토큰 검증)
        self.print_info("토큰으로 프로필 조회 테스트")
        try:
            response = self.session.get(f"{BASE_URL}/auth/profile", headers=headers, timeout=5)
            if response.status_code == 200:
                profile = response.json()
                self.print_success(f"프로필 조회 성공: {profile.get('site_id', 'Unknown')}")
            else:
                self.print_error(f"프로필 조회 실패: {response.status_code}")
        except requests.exceptions.RequestException as e:
            self.print_error(f"프로필 조회 오류: {str(e)}")
        
        # 2. 토큰 갱신
        if self.refresh_token:
            self.print_info("토큰 갱신 테스트")
            try:
                response = self.session.post(
                    f"{BASE_URL}/auth/refresh",
                    json={"refresh_token": self.refresh_token},
                    timeout=5
                )
                if response.status_code == 200:
                    data = response.json()
                    if "access_token" in data:
                        self.access_token = data["access_token"]
                        self.print_success("토큰 갱신 성공")
                    else:
                        self.print_warning("토큰 갱신 응답에 액세스 토큰 없음")
                else:
                    self.print_error(f"토큰 갱신 실패: {response.status_code}")
            except requests.exceptions.RequestException as e:
                self.print_error(f"토큰 갱신 오류: {str(e)}")
        
        # 3. 로그아웃
        self.print_info("로그아웃 테스트")
        try:
            response = self.session.post(f"{BASE_URL}/auth/logout", headers=headers, timeout=5)
            if response.status_code in [200, 204]:
                self.print_success("로그아웃 성공")
            else:
                self.print_warning(f"로그아웃 응답: {response.status_code}")
        except requests.exceptions.RequestException as e:
            self.print_error(f"로그아웃 오류: {str(e)}")
        
        return True
    
    def test_admin_login(self):
        """관리자 로그인 테스트"""
        self.print_header("관리자 로그인 테스트")
        
        admin_accounts = [
            {"site_id": "admin@casino-club.local", "password": "admin123"},
            {"site_id": "admin", "password": "admin123"}
        ]
        
        for account in admin_accounts:
            self.print_info(f"관리자 계정 테스트: {account['site_id']}")
            try:
                response = self.session.post(
                    f"{BASE_URL}/auth/login",
                    params=account,
                    timeout=5
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if "access_token" in data:
                        # 관리자 권한 확인
                        headers = {"Authorization": f"Bearer {data['access_token']}"}
                        profile_response = self.session.get(
                            f"{BASE_URL}/auth/profile",
                            headers=headers,
                            timeout=5
                        )
                        if profile_response.status_code == 200:
                            profile = profile_response.json()
                            if profile.get("is_admin"):
                                self.print_success(f"관리자 로그인 성공: {account['site_id']}")
                            else:
                                self.print_warning(f"로그인 성공했으나 관리자 권한 없음: {account['site_id']}")
                        else:
                            self.print_warning(f"로그인 성공했으나 프로필 조회 실패: {account['site_id']}")
                    else:
                        self.print_warning(f"로그인 응답에 토큰 없음: {account['site_id']}")
                else:
                    self.print_warning(f"관리자 로그인 실패: {account['site_id']} - {response.status_code}")
                    
            except requests.exceptions.RequestException as e:
                self.print_warning(f"관리자 로그인 오류: {str(e)}")
        
        return True
    
    def run_all_tests(self):
        """모든 테스트 실행"""
        print(f"\n{Fore.MAGENTA}🚀 Casino-Club F2P 인증 시스템 전체 검증 시작{Style.RESET_ALL}")
        print(f"{Fore.CYAN}테스트 시작 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Style.RESET_ALL}\n")
        
        # 1. 서버 상태 확인
        if not self.test_health_check():
            print(f"\n{Fore.RED}서버가 응답하지 않습니다. 테스트를 중단합니다.{Style.RESET_ALL}")
            return
        
        # 2. 회원가입 테스트
        self.test_registration()
        
        # 3. 로그인 테스트
        self.test_login()
        
        # 4. 토큰 관리 테스트
        self.test_token_management()
        
        # 5. 관리자 로그인 테스트
        self.test_admin_login()
        
        # 결과 요약
        self.print_summary()
    
    def print_summary(self):
        """테스트 결과 요약"""
        self.print_header("테스트 결과 요약")
        
        success_count = sum(1 for status, _ in self.test_results if status == "SUCCESS")
        error_count = sum(1 for status, _ in self.test_results if status == "ERROR")
        warning_count = sum(1 for status, _ in self.test_results if status == "WARNING")
        
        print(f"{Fore.GREEN}성공: {success_count}개{Style.RESET_ALL}")
        print(f"{Fore.RED}실패: {error_count}개{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}경고: {warning_count}개{Style.RESET_ALL}")
        
        total = success_count + error_count + warning_count
        if total > 0:
            success_rate = (success_count / total) * 100
            print(f"\n{Fore.CYAN}성공률: {success_rate:.1f}%{Style.RESET_ALL}")
            
            if success_rate >= 80:
                print(f"{Fore.GREEN}✨ 인증 시스템이 정상적으로 작동하고 있습니다!{Style.RESET_ALL}")
            elif success_rate >= 50:
                print(f"{Fore.YELLOW}⚠️ 일부 문제가 있지만 기본 기능은 작동합니다.{Style.RESET_ALL}")
            else:
                print(f"{Fore.RED}🔧 많은 문제가 발견되었습니다. 수정이 필요합니다.{Style.RESET_ALL}")
        
        print(f"\n{Fore.CYAN}테스트 완료 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Style.RESET_ALL}")

if __name__ == "__main__":
    tester = AuthSystemTester()
    tester.run_all_tests()