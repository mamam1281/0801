#!/usr/bin/env node
/*
  Prod build guard: Fail build if required env vars are missing in production.
  Required in production:
    - NEXT_PUBLIC_API_BASE
    - NEXT_PUBLIC_API_ORIGIN
*/

const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production' || process.env.NEXT_PHASE === 'phase-production-build';
if (!isProd) {
  process.exit(0);
}

const missing = [];
for (const key of ['NEXT_PUBLIC_API_BASE', 'NEXT_PUBLIC_API_ORIGIN']) {
  if (!process.env[key] || String(process.env[key]).trim() === '') {
    missing.push(key);
  }
}

if (missing.length) {
  console.error('[ENV VALIDATION] Missing required env vars for production build:', missing.join(', '));
  console.error('Add them to your environment (.env.production, CI secrets, or deployment config).');
  process.exit(1);
}

console.log('[ENV VALIDATION] All required production env vars present.');
