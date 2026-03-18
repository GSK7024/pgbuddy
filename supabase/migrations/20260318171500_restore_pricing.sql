-- Restore Pro plan to original pricing
UPDATE subscription_plans SET monthly_price = 799, yearly_price = 7999 WHERE slug = 'pro';
