/**
 * FE api client 401 -> refresh -> retry flow test
 */
import { jest } from '@jest/globals'

// We import functions under test
import apiRequest, { setTokens, clearTokens } from '../utils/api'

// Helper to mock global fetch
const mockFetch = (impl?: any) => {
  // @ts-ignore
  global.fetch = jest.fn(impl)
}

// Minimal fetch Response-like helper
const jsonResponse = (status: number, body: any) => ({
  status,
  ok: status >= 200 && status < 300,
  headers: { 'Content-Type': 'application/json' },
  text: async () => JSON.stringify(body),
}) as any

describe('api.ts refresh flow', () => {
  beforeEach(() => {
    // Fresh tokens each test
    localStorage.clear()
    setTokens('oldAccess', 'refresh123')
  })
  afterEach(() => {
    clearTokens()
    // @ts-ignore
    global.fetch && (global.fetch as jest.Mock).mockReset()
  })

  it('retries original request after successful refresh', async () => {
    // Sequence:
    // 1) GET /api/protected -> 401
    // 2) POST /api/auth/refresh -> 200 { access_token: 'newAccess', refresh_token: 'refresh123' }
    // 3) Retry GET /api/protected -> 200 { ok: true }

    let call = 0
    mockFetch((input: RequestInfo | URL, init?: RequestInit) => {
      call += 1
      const url = String(input)
      const method = init?.method || 'GET'

      if (call === 1) {
        expect(url).toMatch(/\/api\/protected/)
        return Promise.resolve(jsonResponse(401, { detail: 'expired' }))
      }

      if (call === 2) {
        expect(url).toMatch(/\/api\/auth\/refresh/)
        expect(method).toBe('POST')
        return Promise.resolve(jsonResponse(200, { access_token: 'newAccess', refresh_token: 'refresh123' }))
      }

      if (call === 3) {
        expect(url).toMatch(/\/api\/protected/)
        // The Authorization header should carry newAccess now
        const auth = (init?.headers as any)?.Authorization || (init?.headers as any)?.authorization
        expect(auth).toBe('Bearer newAccess')
        return Promise.resolve(jsonResponse(200, { ok: true }))
      }

      return Promise.resolve(jsonResponse(500, { error: 'unexpected call' }))
    })

    const data = await apiRequest('/protected')
    expect(data).toEqual({ ok: true })
    // Ensure exactly 3 calls
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(3)
  })

  it('fails and clears tokens when refresh is missing/invalid', async () => {
    // 1) GET protected -> 401
    // 2) POST refresh -> 400

    let call = 0
    mockFetch((input: RequestInfo | URL) => {
      call += 1
      const url = String(input)
      if (call === 1) return Promise.resolve(jsonResponse(401, { detail: 'expired' }))
      if (call === 2 && /\/api\/auth\/refresh/.test(url)) return Promise.resolve(jsonResponse(400, { detail: 'bad token' }))
      return Promise.resolve(jsonResponse(500, { error: 'unexpected call' }))
    })

    await expect(apiRequest('/protected')).rejects.toBeTruthy()
    // Tokens should be cleared
    expect(localStorage.getItem('cc_auth_tokens')).toBeNull()
  })
})
