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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized', details: userError?.message }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userId = user.id;

    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = await req.json();

    if (!razorpay_payment_id || !razorpay_subscription_id) {
      return new Response(JSON.stringify({ error: 'Missing payment details' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Verify payment with Razorpay API
    const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not configured');
    }

    const razorpayAuth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

    // Verify the subscription status from Razorpay
    const subRes = await fetch(`https://api.razorpay.com/v1/subscriptions/${razorpay_subscription_id}`, {
      headers: { 'Authorization': `Basic ${razorpayAuth}` },
    });

    const razorpaySub = await subRes.json();
    if (!subRes.ok) {
      throw new Error(`Failed to verify subscription: ${JSON.stringify(razorpaySub)}`);
    }

    // Only activate if Razorpay confirms it's active/authenticated
    if (razorpaySub.status !== 'active' && razorpaySub.status !== 'authenticated') {
      return new Response(JSON.stringify({ error: 'Subscription not active on Razorpay', razorpay_status: razorpaySub.status }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role to update subscription
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const billingCycle = razorpaySub.notes?.billing_cycle || 'monthly';
    const planSlug = razorpaySub.notes?.plan_slug;

    if (!planSlug) {
      throw new Error(`Plan slug not found in Razorpay subscription notes: ${JSON.stringify(razorpaySub.notes)}`);
    }

    // Get the exact plan ID to assign
    const { data: plan, error: planError } = await serviceClient
      .from('subscription_plans')
      .select('id')
      .eq('slug', planSlug)
      .single();

    if (planError || !plan) {
      throw new Error(`Plan not found for slug ${planSlug}`);
    }

    const now = new Date();
    const periodEnd = new Date(now);
    if (billingCycle === 'yearly') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    // Upsert the subscription now that payment is verified
    // This safely overwrites their OLD subscription only after the NEW one clears!
    const { error: updateError } = await serviceClient
      .from('subscriptions')
      .upsert({
        user_id: userId,
        plan_id: plan.id,
        status: 'active',
        billing_cycle: billingCycle,
        razorpay_subscription_id: razorpay_subscription_id,
        razorpay_payment_id: razorpay_payment_id,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: now.toISOString(),
      }, { onConflict: 'user_id' });

    if (updateError) {
      throw new Error(`Failed to upsert verified subscription: ${updateError.message}`);
    }

    return new Response(JSON.stringify({ success: true }), {
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
