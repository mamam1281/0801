-- Verify read parity and write double-write integrity for shop_transactions

-- Row count parity
SELECT
  (SELECT count(*) FROM shop_transactions) AS src_count,
  (SELECT count(*) FROM shop_transactions_shadow) AS shadow_count;

-- Sum parity on numeric columns
SELECT
  (SELECT coalesce(sum(amount),0) FROM shop_transactions) AS src_sum,
  (SELECT coalesce(sum(amount),0) FROM shop_transactions_shadow) AS shadow_sum;

-- Recent 24h parity (optional windowed check)
SELECT
  (SELECT count(*) FROM shop_transactions WHERE created_at >= now() - interval '24 hours') AS src_24h,
  (SELECT count(*) FROM shop_transactions_shadow WHERE created_at >= now() - interval '24 hours') AS shadow_24h;
