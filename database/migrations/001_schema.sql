-- Crypto Shield Database Schema
-- Migration 001: Initial Schema

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  wallet_address TEXT UNIQUE,
  subscription_status TEXT NOT NULL DEFAULT 'free' CHECK (subscription_status IN ('free', 'premium')),
  subscription_expiry TIMESTAMPTZ,
  daily_analysis_count INTEGER NOT NULL DEFAULT 0,
  last_analysis_reset TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scan history table
CREATE TABLE scan_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contract_address TEXT NOT NULL,
  chain TEXT NOT NULL DEFAULT 'bsc' CHECK (chain IN ('bsc', 'ethereum')),
  trust_score NUMERIC(5, 2) NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('safe', 'low', 'medium', 'high', 'critical')),
  buy_tax NUMERIC(5, 2) NOT NULL DEFAULT 0,
  sell_tax NUMERIC(5, 2) NOT NULL DEFAULT 0,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  has_blacklist BOOLEAN NOT NULL DEFAULT false,
  owner_renounced BOOLEAN NOT NULL DEFAULT false,
  has_hidden_mint BOOLEAN NOT NULL DEFAULT false,
  is_proxy BOOLEAN NOT NULL DEFAULT false,
  owner_address TEXT,
  raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Data source scores for each scan
CREATE TABLE data_source_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scan_id UUID NOT NULL REFERENCES scan_history(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL CHECK (source_name IN ('bscscan', 'etherscan', 'getblock')),
  score NUMERIC(5, 2) NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Monitored contracts
CREATE TABLE monitored_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contract_address TEXT NOT NULL,
  chain TEXT NOT NULL DEFAULT 'bsc',
  last_scan TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  alert_level TEXT NOT NULL DEFAULT 'low' CHECK (alert_level IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, contract_address)
);

-- Monitoring history
CREATE TABLE monitoring_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES monitored_contracts(id) ON DELETE CASCADE,
  scan_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trust_score NUMERIC(5, 2) NOT NULL,
  buy_tax NUMERIC(5, 2) NOT NULL DEFAULT 0,
  sell_tax NUMERIC(5, 2) NOT NULL DEFAULT 0,
  is_blacklisted BOOLEAN NOT NULL DEFAULT false,
  owner_changed BOOLEAN NOT NULL DEFAULT false,
  alert_triggered BOOLEAN NOT NULL DEFAULT false,
  alert_level TEXT NOT NULL DEFAULT 'low',
  changes_detected JSONB DEFAULT '{}'::jsonb
);

-- User alert settings
CREATE TABLE user_alert_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email_alerts BOOLEAN NOT NULL DEFAULT false,
  telegram_alerts BOOLEAN NOT NULL DEFAULT false,
  in_app_alerts BOOLEAN NOT NULL DEFAULT true,
  min_alert_level TEXT NOT NULL DEFAULT 'medium' CHECK (min_alert_level IN ('low', 'medium', 'high', 'critical'))
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('alert', 'info', 'warning')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ad banners
CREATE TABLE ad_banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  link TEXT NOT NULL,
  image_url TEXT NOT NULL,
  position TEXT NOT NULL CHECK (position IN ('sidebar_top', 'sidebar_bottom', 'header', 'footer', 'between_results', 'popup')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  clicks INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Brand settings
CREATE TABLE brand_settings (
  instance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  logo_url TEXT DEFAULT '/logo.svg',
  brand_name TEXT NOT NULL DEFAULT 'Crypto Shield',
  primary_color TEXT NOT NULL DEFAULT '#E87A00',
  secondary_color TEXT NOT NULL DEFAULT '#FFD700',
  accent_color TEXT NOT NULL DEFAULT '#F5F0E8',
  custom_domain TEXT,
  telegram_bot_token TEXT,
  theme TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
  font_family TEXT NOT NULL DEFAULT "'Inter', system-ui, sans-serif",
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_scan_history_user_id ON scan_history(user_id);
CREATE INDEX idx_scan_history_contract ON scan_history(contract_address);
CREATE INDEX idx_scan_history_created ON scan_history(created_at DESC);
CREATE INDEX idx_monitored_contracts_user ON monitored_contracts(user_id);
CREATE INDEX idx_monitored_contracts_active ON monitored_contracts(is_active);
CREATE INDEX idx_monitoring_history_contract ON monitoring_history(contract_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_ad_banners_position ON ad_banners(position);
CREATE INDEX idx_ad_banners_active ON ad_banners(is_active, start_date, end_date);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_settings_updated_at
  BEFORE UPDATE ON brand_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_source_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitored_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY users_own_data ON users
  FOR ALL USING (id = auth.uid());

CREATE POLICY scan_history_own ON scan_history
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY data_source_scores_own ON data_source_scores
  FOR ALL USING (
    scan_id IN (SELECT id FROM scan_history WHERE user_id = auth.uid())
  );

CREATE POLICY monitored_contracts_own ON monitored_contracts
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY monitoring_history_own ON monitoring_history
  FOR ALL USING (
    contract_id IN (SELECT id FROM monitored_contracts WHERE user_id = auth.uid())
  );

CREATE POLICY notifications_own ON notifications
  FOR ALL USING (user_id = auth.uid());