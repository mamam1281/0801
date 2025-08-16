# Realtime Game WebSockets

Two unified WebSocket endpoints provide realtime game events and monitoring.

## Endpoints

1. User stream: `GET /api/games/ws?token=<JWT>`
   - Auth: JWT access token (query param `token` OR `Authorization: Bearer` header)
   - Messages received:
     * `ws_ack` (initial acknowledgement)
     * `game_event` for each action (slot, rps, gacha, crash) initiated by this user
   - Future: may include balance updates / reward grants.

2. Monitor stream: `GET /api/games/ws/monitor?token=<JWT>`
   - Requires admin (current stub allows any authenticated user; tighten later).
   - On connect sends `monitor_snapshot` containing currently connected user ids & recent events.
   - Then streams all subsequent `game_event` broadcasts for every user.

## Event Payload Shape
```
{
  "type": "game_event",
  "game_type": "slot" | "rps" | "gacha" | "crash",
  "user_id": <int>,
  "bet": <number>,            // or relevant input field
  "result": { ... },           // game specific result data
  "ts": "2025-08-16T12:34:56.789Z"  // ISO8601 UTC
}
```
Additional fields may appear (e.g. reward summaries) but core keys are stable.

## Architecture

`app/realtime/hub.py` implements an in‑memory `RealtimeHub`:
- Tracks per-user WebSocket connections.
- Tracks monitor connections.
- Maintains a ring buffer of recent events for snapshotting.
- Broadcasts game events fan‑out to relevant sockets.

Why in‑memory now? Simplicity & low latency for a single instance. A later horizontal scale step can swap internal broadcast with Redis Pub/Sub or Kafka without changing router code (keep hub interface stable).

## Client Flow (User)
1. Obtain JWT via `/api/auth/login` or `/api/auth/signup`.
2. Open WS: `wss://<host>/api/games/ws?token=...`
3. Wait for `{ "type": "ws_ack" }`.
4. Perform gameplay REST calls (e.g. POST `/api/games/slot/spin`).
5. Receive corresponding `game_event` message.

## Client Flow (Monitor)
1. Obtain admin JWT.
2. Open WS: `/api/games/ws/monitor?token=...`.
3. Read initial `monitor_snapshot`.
4. Stream all subsequent `game_event` messages globally.

## Security Notes
- Current monitor auth is permissive; tighten with role/claims check (TODO).
- Query param token accepted for convenience; production should prefer `Authorization` header only.
- No rate limiting yet; consider simple message budget per connection.

## Migration Notes
Legacy endpoint `/ws/games` removed. All clients should migrate to `/api/games/ws` (user) or `/api/games/ws/monitor`.

## Testing
`test_games_ws.py` covers:
- User receives slot spin event.
- Monitor receives initial snapshot.

## Future Enhancements
- Add reward / token balance delta events.
- Add presence (join/leave) events to monitors.
- Externalize broadcast (Redis / Kafka) for multi-instance scale.
- Structured schema versioning for events.
