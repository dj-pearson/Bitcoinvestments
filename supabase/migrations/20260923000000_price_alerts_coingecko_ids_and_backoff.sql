-- Price alerts: CoinGecko ids + delivery backoff
--
-- 1. Backfill cryptocurrency_id. Until 2026-09 the Profile price-alert form
--    stored the lowercased ticker ("btc") instead of the CoinGecko id
--    ("bitcoin"), so check-price-alerts could never find a price for them.
--    The function now maps legacy tickers at read time; this makes the data
--    itself correct. Idempotent: rows already holding an id are untouched.
-- 2. Add columns used by check-price-alerts to back off after failed email
--    deliveries and deactivate after repeated failures. The function works
--    without them (it detects the missing columns), but without backoff.

UPDATE public.price_alerts AS pa
SET cryptocurrency_id = m.coingecko_id
FROM (VALUES
  ('btc', 'bitcoin'),
  ('eth', 'ethereum'),
  ('usdt', 'tether'),
  ('usdc', 'usd-coin'),
  ('bnb', 'binancecoin'),
  ('sol', 'solana'),
  ('xrp', 'ripple'),
  ('ada', 'cardano'),
  ('doge', 'dogecoin'),
  ('trx', 'tron'),
  ('avax', 'avalanche-2'),
  ('link', 'chainlink'),
  ('dot', 'polkadot'),
  ('ltc', 'litecoin'),
  ('bch', 'bitcoin-cash'),
  ('xlm', 'stellar'),
  ('atom', 'cosmos'),
  ('uni', 'uniswap'),
  ('pol', 'polygon-ecosystem-token'),
  ('near', 'near'),
  ('dai', 'dai')
) AS m(ticker, coingecko_id)
WHERE lower(pa.cryptocurrency_id) = m.ticker;

ALTER TABLE public.price_alerts ADD COLUMN IF NOT EXISTS failure_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.price_alerts ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz;
ALTER TABLE public.price_alerts ADD COLUMN IF NOT EXISTS last_error text;
