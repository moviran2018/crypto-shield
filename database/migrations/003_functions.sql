-- Database functions

-- Get user's daily analysis count
CREATE OR REPLACE FUNCTION get_daily_analysis_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT daily_analysis_count INTO v_count
  FROM users
  WHERE id = p_user_id;
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reset daily analysis counts (call via cron)
CREATE OR REPLACE FUNCTION reset_daily_analysis_counts()
RETURNS INTEGER AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE users 
  SET daily_analysis_count = 0,
      last_analysis_reset = NOW()
  WHERE last_analysis_reset < CURRENT_DATE;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get monitored contracts due for scan
CREATE OR REPLACE FUNCTION get_contracts_due_for_scan()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  contract_address TEXT,
  chain TEXT,
  last_scan TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT mc.id, mc.user_id, mc.contract_address, mc.chain, mc.last_scan
  FROM monitored_contracts mc
  WHERE mc.is_active = true
    AND (
      mc.last_scan IS NULL 
      OR mc.last_scan < NOW() - INTERVAL '6 hours'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get admin dashboard metrics
CREATE OR REPLACE FUNCTION get_admin_metrics()
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT JSONB_BUILD_OBJECT(
    'total_users', (SELECT COUNT(*) FROM users),
    'active_subscriptions', (SELECT COUNT(*) FROM users WHERE subscription_status = 'premium' AND (subscription_expiry IS NULL OR subscription_expiry > NOW())),
    'monthly_revenue', (SELECT COUNT(*) * 19.99 FROM users WHERE subscription_status = 'premium' AND (subscription_expiry IS NULL OR subscription_expiry > NOW())),
    'today_requests', (SELECT COUNT(*) FROM scan_history WHERE created_at > CURRENT_DATE),
    'user_growth', (SELECT JSONB_AGG(cnt) FROM (SELECT COUNT(*) as cnt FROM users GROUP BY DATE_TRUNC('day', created_at) ORDER BY DATE_TRUNC('day', created_at) DESC LIMIT 30) sub),
    'revenue_history', (SELECT JSONB_AGG(rev) FROM (SELECT COUNT(*) * 19.99 as rev FROM scan_history GROUP BY DATE_TRUNC('day', created_at) ORDER BY DATE_TRUNC('day', created_at) DESC LIMIT 30) sub)
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;