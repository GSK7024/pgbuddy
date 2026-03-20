-- Update subscription_plans features to include WhatsApp capability details

UPDATE subscription_plans
SET features = '["Up to 5 tenants","Unlimited properties","Basic reports","Payment tracking","Auto rent reminders via WhatsApp"]'
WHERE slug = 'free';

UPDATE subscription_plans
SET features = '["Up to 50 tenants","Unlimited properties","Advanced reports","Payment tracking","Priority support","Expense analytics","Auto rent reminders via WhatsApp"]'
WHERE slug = 'pro';

UPDATE subscription_plans
SET features = '["Up to 100 tenants","Unlimited properties","Advanced analytics","Payment tracking","Priority support","Expense analytics","Custom branding","Full WhatsApp notifications"]'
WHERE slug = 'business';

UPDATE subscription_plans
SET features = '["Unlimited tenants","Unlimited properties","Everything in Business","Priority WhatsApp support","Custom branding","API access","Dedicated account manager","Custom integrations","Full WhatsApp notifications"]'
WHERE slug = 'enterprise';
