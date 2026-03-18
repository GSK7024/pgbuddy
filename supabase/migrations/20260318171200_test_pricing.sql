-- Set Pro plan to ₹1 for testing
UPDATE subscription_plans SET monthly_price = 1, yearly_price = 10 WHERE slug = 'pro';
