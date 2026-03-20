import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, origin, accept, x-requested-with',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse body FIRST before consuming it elsewhere
    const { plan_slug, billing_cycle } = await req.json();

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'No auth token provided' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Create user-scoped client for auth verification
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', JSON.stringify(userError));
      return new Response(JSON.stringify({ error: `Auth failed: ${userError?.message || 'No user'}` }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userId = user.id;

    // Service Role client for ALL database operations (bypasses RLS)
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return new Response(JSON.stringify({ error: 'Razorpay keys missing from server config' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get plan details using service role
    const { data: plan, error: planError } = await serviceClient
      .from('subscription_plans')
      .select('*')
      .eq('slug', plan_slug)
      .single();

    if (planError || !plan) {
      console.error('Plan error:', JSON.stringify(planError));
      return new Response(JSON.stringify({ error: `Plan '${plan_slug}' not found: ${planError?.message}` }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (plan.slug === 'free') {
      // Use serviceClient for DB write too (bypasses RLS)
      const { error: subError } = await serviceClient.from('subscriptions').upsert({
        user_id: userId,
        plan_id: plan.id,
        status: 'active',
        billing_cycle: 'monthly',
        current_period_start: new Date().toISOString(),
        current_period_end: null,
      }, { onConflict: 'user_id' });

      if (subError) {
        console.error('Free sub upsert error:', JSON.stringify(subError));
        return new Response(JSON.stringify({ error: `Free plan activation failed: ${subError.message}` }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      return new Response(JSON.stringify({ success: true, free: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const amount = billing_cycle === 'yearly' ? plan.yearly_price : plan.monthly_price;
    const razorpayPeriod = billing_cycle === 'yearly' ? 'yearly' : 'monthly';

    // Create Razorpay Plan
    const razorpayAuth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

    const planRes = await fetch('https://api.razorpay.com/v1/plans', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${razorpayAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        period: razorpayPeriod,
        interval: 1,
        item: {
          name: `${plan.name} Plan (${billing_cycle})`,
          amount: Math.round(amount * 100),
          currency: 'INR',
          description: plan.description,
        },
      }),
    });

    const razorpayPlan = await planRes.json();
    if (!planRes.ok) {
      return new Response(JSON.stringify({ error: `Razorpay plan failed: ${JSON.stringify(razorpayPlan)}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
        total_count: billing_cycle === 'yearly' ? 10 : 120,
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
      return new Response(JSON.stringify({ error: `Razorpay subscription failed: ${JSON.stringify(razorpaySub)}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

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
    console.error('Unhandled error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: `Server error: ${msg}` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
