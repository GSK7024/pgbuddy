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

    const { payment_id } = await req.json();
    if (!payment_id) {
      return new Response(JSON.stringify({ error: 'payment_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Verify this payment belongs to the user and is pending
    const { data: payment, error: payError } = await supabase
      .from('rent_payments')
      .select('id, amount, month, tenant_id, property_id')
      .eq('id', payment_id)
      .eq('tenant_id', userId)
      .eq('status', 'pending')
      .single();

    if (payError || !payment) {
      return new Response(JSON.stringify({ error: 'Payment not found or not pending' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not configured');
    }

    const razorpayAuth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

    // Create Razorpay Order
    const orderRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${razorpayAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(Number(payment.amount) * 100), // paise
        currency: 'INR',
        receipt: payment.id,
        notes: {
          payment_id: payment.id,
          tenant_id: userId,
          month: payment.month,
          type: 'rent_payment',
        },
      }),
    });

    const order = await orderRes.json();
    if (!orderRes.ok) {
      throw new Error(`Razorpay order creation failed: ${JSON.stringify(order)}`);
    }

    return new Response(JSON.stringify({
      order_id: order.id,
      razorpay_key: RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      payment_id: payment.id,
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
