// src/mocks/handlers.js
import { rest } from 'msw';

export const handlers = [
  // 회원가입 모의 응답
  rest.post('http://localhost:8000/api/auth/signup', (req, res, ctx) => {
    const { invite_code } = req.body;
    
    if (invite_code !== '5858') {
      return res(
        ctx.status(400),
        ctx.json({ detail: "유효하지 않은 초대코드입니다" })
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json({
        access_token: "mock_token_123456",
        token_type: "bearer",
        user: {
          id: 1,
          site_id: req.body.site_id,
          nickname: req.body.nickname,
          phone_number: req.body.phone_number,
          is_active: true,
          is_admin: false,
          created_at: new Date().toISOString(),
          last_login: null
        }
      })
    );
  }),

  // 로그인 모의 응답
  rest.post('http://localhost:8000/api/auth/login', (req, res, ctx) => {
    const { site_id, password } = req.body;
    
    if (site_id === 'testuser123' && password === 'password123') {
      return res(
        ctx.status(200),
        ctx.json({
          access_token: "mock_token_123456",
          token_type: "bearer",
          user: {
            id: 1,
            site_id: "testuser123",
            nickname: "테스트유저",
            phone_number: "01012345678",
            is_active: true,
            is_admin: false,
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString()
          }
        })
      );
    }
    
    return res(
      ctx.status(401),
      ctx.json({ detail: "아이디 또는 비밀번호가 올바르지 않습니다." })
    );
  }),

  // 어드민 로그인 모의 응답
  rest.post('http://localhost:8000/api/auth/admin/login', (req, res, ctx) => {
    const { site_id, password } = req.body;
    
    if (site_id === 'admin' && password === 'admin123') {
      return res(
        ctx.status(200),
        ctx.json({
          access_token: "mock_admin_token_123456",
          token_type: "bearer",
          user: {
            id: 999,
            site_id: "admin",
            nickname: "관리자",
            phone_number: "01099999999",
            is_active: true,
            is_admin: true,
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString()
          }
        })
      );
    }
    
    return res(
      ctx.status(401),
      ctx.json({ detail: "관리자 아이디 또는 비밀번호가 올바르지 않습니다." })
    );
  }),

  // 유저 프로필 조회 모의 응답
  rest.get('http://localhost:8000/api/users/profile', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: 1,
        site_id: "testuser123",
        nickname: "테스트유저",
        phone_number: "01012345678",
        cyber_token_balance: 500,
        is_admin: false,
        is_active: true
      })
    );
  }),

  // 헬스체크 엔드포인트
  rest.get('http://localhost:8000/health', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: "1.0.0"
      })
    );
  })
];
