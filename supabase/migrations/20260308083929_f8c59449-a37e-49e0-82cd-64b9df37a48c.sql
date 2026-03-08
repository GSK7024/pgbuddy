
-- Subscription plans table
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  monthly_price numeric NOT NULL DEFAULT 0,
  yearly_price numeric NOT NULL DEFAULT 0,
  tenant_limit integer NOT NULL DEFAULT 5,
  razorpay_monthly_plan_id text,
  razorpay_yearly_plan_id text,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans"
ON public.subscription_plans
FOR SELECT
TO authenticated
USING (is_active = true);

-- Subscriptions table
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  status text NOT NULL DEFAULT 'active',
  billing_cycle text NOT NULL DEFAULT 'monthly',
  razorpay_subscription_id text,
  razorpay_payment_id text,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancelled_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can manage subscriptions"
ON public.subscriptions
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Insert default plans
INSERT INTO public.subscription_plans (name, slug, description, monthly_price, yearly_price, tenant_limit, features) VALUES
('Free', 'free', 'Perfect for getting started', 0, 0, 5, '["Up to 5 tenants", "Unlimited properties", "Basic reports", "Payment tracking"]'),
('Pro', 'pro', 'For growing PG businesses', 499, 4999, 25, '["Up to 25 tenants", "Unlimited properties", "Advanced reports", "Payment tracking", "Priority support", "Expense analytics"]'),
('Business', 'business', 'For large-scale operations', 999, 9999, -1, '["Unlimited tenants", "Unlimited properties", "Advanced analytics", "Payment tracking", "Priority support", "Expense analytics", "Custom branding"]');
