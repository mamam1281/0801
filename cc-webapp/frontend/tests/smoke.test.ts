let fetchFn: (typeof fetch) | undefined = globalThis.fetch as unknown as typeof fetch | undefined;
try {
  if (!fetchFn) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    fetchFn = require('node-fetch');
  }
} catch (_err) {
  // optional dependency not installed; tests will fail with descriptive message
}

if (!fetchFn) {
  // Jest on Node 18+ provides fetch; if not available, provide instructive error.
  throw new Error('No fetch available in test environment. Install node-fetch or run tests on Node 18+');
}

const BACKEND = process.env.BACKEND_URL || 'http://localhost:8000';
const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:3000';

describe('smoke', () => {
  test('backend health', async () => {
    const res = await fetchFn!(`${BACKEND.replace(/\/$/, '')}/api/health`);
    expect(res.ok).toBe(true);
  });

  test('frontend smoke route', async () => {
    const res = await fetchFn!(`${FRONTEND.replace(/\/$/, '')}/api/smoke-refresh`);
    expect(res.ok).toBe(true);
  });
});
