import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userId = claimsData.claims.sub;
    const userEmail = claimsData.claims.email;

    const { plan_slug, billing_cycle } = await req.json();

    const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not configured');
    }

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('slug', plan_slug)
      .single();

    if (planError || !plan) {
      return new Response(JSON.stringify({ error: 'Plan not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (plan.slug === 'free') {
      // For free plan, just create a subscription record
      const { error: subError } = await supabase.from('subscriptions').upsert({
        user_id: userId,
        plan_id: plan.id,
        status: 'active',
        billing_cycle: 'monthly',
        current_period_start: new Date().toISOString(),
        current_period_end: null,
      }, { onConflict: 'user_id' });

      return new Response(JSON.stringify({ success: true, free: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const amount = billing_cycle === 'yearly' ? plan.yearly_price : plan.monthly_price;
    const period = billing_cycle === 'yearly' ? 'yearly' : 'monthly';
    const interval = billing_cycle === 'yearly' ? 12 : 1;

    // Create Razorpay Plan
    const razorpayAuth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

    const planRes = await fetch('https://api.razorpay.com/v1/plans', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${razorpayAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        period: 'monthly',
        interval: interval,
        item: {
          name: `${plan.name} Plan (${period})`,
          amount: amount * 100, // paise
          currency: 'INR',
          description: plan.description,
        },
      }),
    });

    const razorpayPlan = await planRes.json();
    if (!planRes.ok) {
      throw new Error(`Razorpay plan creation failed [${planRes.status}]: ${JSON.stringify(razorpayPlan)}`);
    }

    // Create Razorpay Subscription
    const subRes = await fetch('https://api.razorpay.com/v1/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${razorpayAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan_id: razorpayPlan.id,
        total_count: billing_cycle === 'yearly' ? 10 : 120, // max cycles
        quantity: 1,
        notes: {
          user_id: userId,
          plan_slug: plan_slug,
          billing_cycle: billing_cycle,
        },
      }),
    });

    const razorpaySub = await subRes.json();
    if (!subRes.ok) {
      throw new Error(`Razorpay subscription creation failed [${subRes.status}]: ${JSON.stringify(razorpaySub)}`);
    }

    // Store subscription in DB (pending until payment confirmed)
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    await serviceClient.from('subscriptions').upsert({
      user_id: userId,
      plan_id: plan.id,
      status: 'pending',
      billing_cycle: billing_cycle,
      razorpay_subscription_id: razorpaySub.id,
    }, { onConflict: 'user_id' });

    return new Response(JSON.stringify({
      subscription_id: razorpaySub.id,
      razorpay_key: RAZORPAY_KEY_ID,
      amount: amount * 100,
      plan_name: plan.name,
      billing_cycle,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
