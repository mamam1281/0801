// Global setup waits for backend and frontend readiness using fetch.
// Using JS avoids TS node typing issues inside the Playwright container.

async function wait(ms) { return new Promise(res => setTimeout(res, ms)); }

async function waitForOk(url, timeoutMs) {
  const started = Date.now();
  let lastErr;
  while (Date.now() - started < timeoutMs) {
    try {
      const resp = await fetch(url, { method: 'GET' });
      // Treat any non-5xx as readiness (200/404 are fine for root)
      if (resp.status < 500) return;
      lastErr = new Error(`Status ${resp.status}`);
    } catch (e) {
      lastErr = e;
    }
    await wait(1000);
  }
  throw lastErr ?? new Error(`Timeout waiting for ${url}`);
}

module.exports = async () => {
  const api = process.env.API_BASE_URL || 'http://backend:8000';
  const web = process.env.BASE_URL || 'http://frontend:3000';

  // Backend first (prefer health, fallback to root)
  try {
    await waitForOk(`${api}/health`, 60_000);
  } catch (_) {
    await waitForOk(api, 30_000);
  }

  // Then frontend: prefer lightweight healthz if available
  try {
    await waitForOk(`${web}/healthz`, 60_000);
  } catch (_) {
    await waitForOk(web, 60_000);
  }
};
