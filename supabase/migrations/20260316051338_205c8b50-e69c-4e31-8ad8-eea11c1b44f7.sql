
-- Update Pro plan pricing and tenant limit
UPDATE subscription_plans SET monthly_price = 799, yearly_price = 7999, tenant_limit = 50, description = 'For standard single-building PGs' WHERE slug = 'pro';

-- Update Business plan pricing and tenant limit
UPDATE subscription_plans SET monthly_price = 1499, yearly_price = 14999, tenant_limit = 100, description = 'For large PG operations' WHERE slug = 'business';

-- Insert Enterprise plan
INSERT INTO subscription_plans (name, slug, description, monthly_price, yearly_price, tenant_limit, features, is_active)
VALUES ('Enterprise', 'enterprise', 'For multi-building operators with 100+ tenants', 2999, 29999, -1, '["Unlimited tenants","Unlimited properties","Everything in Business","Priority WhatsApp support","Custom branding","API access","Dedicated account manager","Custom integrations"]', true);
