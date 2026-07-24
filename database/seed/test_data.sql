-- Test data for development

-- Insert test users
INSERT INTO users (email, wallet_address, subscription_status, subscription_expiry)
VALUES 
  ('test-free@cryptoshield.io', '0x1234567890abcdef1234567890abcdef12345678', 'free', NULL),
  ('test-premium@cryptoshield.io', '0xabcdef1234567890abcdef1234567890abcdef12', 'premium', NOW() + INTERVAL '30 days');

-- Insert sample scan history
INSERT INTO scan_history (user_id, contract_address, chain, trust_score, risk_level, buy_tax, sell_tax, is_verified, has_blacklist, owner_renounced, has_hidden_mint)
SELECT 
  id,
  '0x2170ed0880ac9a755fd29b2688956bd959f933f8',
  'bsc',
  85.50,
  'safe',
  3.0,
  3.0,
  true,
  false,
  true,
  false
FROM users WHERE email = 'test-premium@cryptoshield.io';

-- Insert sample monitoring contracts
INSERT INTO monitored_contracts (user_id, contract_address, chain, is_active, alert_level)
SELECT 
  id,
  '0x2170ed0880ac9a755fd29b2688956bd959f933f8',
  'bsc',
  true,
  'low'
FROM users WHERE email = 'test-premium@cryptoshield.io';