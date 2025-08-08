"""
Crash session state service (design stub).

Goal:
- Manage ongoing crash game sessions for each user.
- Store ephemeral state in Redis for speed; write final results to DB for audit.

Data model sketch:
- crash_sessions (DB)
  id (pk), user_id, game_id, bet_amount, started_at, cashed_out_at (nullable),
  cashout_multiplier (nullable), payout_amount (nullable), status(enum: active, cashed, expired)
- crash_bets (DB)
  id (pk), session_id (fk), amount, created_at

Redis keys:
- crash:session:{user_id} -> JSON { session_id, game_id, bet_amount, placed_at, multiplier, status }
- TTL: e.g., 30 minutes to auto-expire stale sessions

API (to be used by router/service):
- start_session(user_id, game_id, bet_amount) -> session_id
- get_session(user_id) -> dict | None
- update_multiplier(user_id, multiplier) -> None
- cashout(user_id, at_multiplier) -> { payout, session_id }
- expire_session(user_id) -> None

Error cases:
- Double-bet while active session exists -> 409
- Cashout without active session -> 404
- Multiplier regression / race -> guard via optimistic lock (version) or Lua
"""
from __future__ import annotations
from typing import Optional, Dict, Any
from datetime import datetime, timedelta

try:
	import redis  # type: ignore
except Exception:  # redis may not exist in some dev environments
	redis = None  # type: ignore

from app.database import SessionLocal  # SQLAlchemy session factory
from sqlalchemy import text
import os

class CrashSessionService:
	def __init__(self, redis_url: Optional[str] = None):
		# Prefer environment variables provided by docker-compose
		if redis_url:
			self.redis_url = redis_url
		else:
			host = os.getenv("REDIS_HOST", "redis")  # default to service name in compose
			port = os.getenv("REDIS_PORT", "6379")
			pwd = os.getenv("REDIS_PASSWORD")
			if pwd:
				self.redis_url = f"redis://:{pwd}@{host}:{port}/0"
			else:
				self.redis_url = f"redis://{host}:{port}/0"

		self._r = None
		if redis is not None:
			try:
				self._r = redis.Redis.from_url(self.redis_url, decode_responses=True)
			except Exception:
				self._r = None

	@staticmethod
	def _key(user_id: int) -> str:
		return f"crash:session:{user_id}"

	def start_session(self, user_id: int, game_id: int, bet_amount: float) -> Dict[str, Any]:
		"""Create a new session if none active; set TTL.
		Returns the created session dict."""
		if self._r is None:
			# Fallback: in-memory dict pattern could be added; for now raise to indicate infra missing
			raise RuntimeError('Redis not configured for crash sessions')

		key = self._key(user_id)
		if self._r.exists(key):
			raise ValueError('Active crash session already exists')

		session = {
			"session_id": f"{user_id}-{int(datetime.utcnow().timestamp())}",
			"user_id": user_id,
			"game_id": game_id,
			"bet_amount": bet_amount,
			"placed_at": datetime.utcnow().isoformat(),
			"multiplier": 1.0,
			"status": "active",
		}
		self._r.set(key, json_dumps(session))
		self._r.expire(key, 60 * 30)

		# Persist a pending row to DB with external_session_id
		with SessionLocal() as db:
			try:
				db.execute(
					text(
						"""
						INSERT INTO crash_sessions (external_session_id, user_id, game_id, bet_amount, status)
						VALUES (:ext_id, :uid, :gid, :bet, 'active')
						"""
					),
					{"ext_id": session["session_id"], "uid": user_id, "gid": game_id, "bet": bet_amount},
				)
				db.commit()
			except Exception as e:
				# Fail-fast if strict mode is enabled for guaranteed Postgres envs
				if os.getenv("CRASH_DB_STRICT", "0") in ("1", "true", "True"):  # env-gated strictness
					raise
				# Otherwise, non-fatal in early stage; audit table can be backfilled later
				print(f"[crash] DB insert failed (non-strict): {e}")
		return session

	def get_session(self, user_id: int) -> Optional[Dict[str, Any]]:
		if self._r is None:
			return None
		val = self._r.get(self._key(user_id))
		return json_loads(val) if val else None

	def update_multiplier(self, user_id: int, multiplier: float) -> None:
		if self._r is None:
			return
		cur = self.get_session(user_id)
		if not cur:
			return
		if multiplier < cur.get('multiplier', 1.0):
			return  # ignore regression
		cur['multiplier'] = multiplier
		self._r.set(self._key(user_id), json_dumps(cur))

	def cashout(self, user_id: int, at_multiplier: float) -> Optional[Dict[str, Any]]:
		if self._r is None:
			return None
		session = self.get_session(user_id)
		if not session or session.get('status') != 'active':
			return None
		mult = min(max(at_multiplier, 1.0), session.get('multiplier', 1.0))
		payout = round(session['bet_amount'] * mult, 2)
		session['status'] = 'cashed'
		session['cashout_multiplier'] = mult
		session['payout_amount'] = payout
		self._r.delete(self._key(user_id))

		# Persist final to DB
		with SessionLocal() as db:
			try:
				db.execute(
					text(
						"""
						UPDATE crash_sessions
						SET status='cashed', cashed_out_at=NOW(), cashout_multiplier=:mult, payout_amount=:payout
						WHERE external_session_id=:ext_id
						"""
					),
					{"mult": mult, "payout": payout, "ext_id": session["session_id"]},
				)
				db.commit()
			except Exception as e:
				if os.getenv("CRASH_DB_STRICT", "0") in ("1", "true", "True"):
					raise
				print(f"[crash] DB update failed (non-strict): {e}")
		return {"session_id": session['session_id'], "payout": payout}

	def expire_session(self, user_id: int) -> None:
		if self._r is None:
			return
		self._r.delete(self._key(user_id))


# Small JSON helpers (avoid importing full json to keep this stub lightweight)
import json as _json
                                                                                                      
def json_dumps(obj: Any) -> str:
	return _json.dumps(obj, separators=(',', ':'))

def json_loads(s: str) -> Any:
	return _json.loads(s)
