-- Seed data for development

-- Insert default brand settings
INSERT INTO brand_settings (brand_name, primary_color, secondary_color, accent_color)
VALUES ('Crypto Shield', '#E87A00', '#FFD700', '#F5F0E8');

-- Insert a demo admin user (password handled by Supabase Auth)
INSERT INTO users (email, wallet_address, subscription_status)
VALUES ('admin@cryptoshield.io', NULL, 'premium')
ON CONFLICT (email) DO NOTHING;

-- Insert sample ad banners
INSERT INTO ad_banners (admin_id, title, link, image_url, position, start_date, end_date)
SELECT 
  id,
  'Secure Your Crypto',
  'https://example.com',
  '/ads/secure-banner.png',
  'sidebar_top',
  NOW(),
  NOW() + INTERVAL '30 days'
FROM users WHERE email = 'admin@cryptoshield.io'
ON CONFLICT DO NOTHING;