// Lightweight health endpoint for container healthcheck
// Supports GET and HEAD; returns 200 immediately without touching app state
export const runtime = 'nodejs';

export async function GET() {
  return new Response('ok', { status: 200, headers: { 'content-type': 'text/plain' } });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}
