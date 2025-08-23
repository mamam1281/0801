-- Backfill template (chunked)
-- Usage: replace <table>, <shadow_table>, <pk>, and columns mapping
-- Execute in batches to minimize locks. Ensure appropriate indexes exist on shadow table.

-- Parameters: adjust chunk size if needed
-- CHUNK_SIZE default: 10000

-- Copy missing rows only (id-based chunk). Run repeatedly until 0 rows.
BEGIN;
INSERT INTO shop_transactions_shadow (
	id, user_id, product_id, kind, quantity, unit_price, amount,
	payment_method, status, receipt_code, failure_reason,
	integrity_hash, original_tx_id, receipt_signature,
	idempotency_key, extra, created_at, updated_at
)
SELECT s.id, s.user_id, s.product_id, s.kind, s.quantity, s.unit_price, s.amount,
	   s.payment_method, s.status, s.receipt_code, s.failure_reason,
	   s.integrity_hash, s.original_tx_id, s.receipt_signature,
	   s.idempotency_key, s.extra, s.created_at, s.updated_at
FROM shop_transactions s
LEFT JOIN shop_transactions_shadow t ON t.id = s.id
WHERE t.id IS NULL
ORDER BY s.id
LIMIT 10000;
COMMIT;

-- Repeat until 0 rows affected.
