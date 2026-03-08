import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!RAZORPAY_KEY_SECRET) {
      throw new Error('RAZORPAY_KEY_SECRET not configured');
    }

    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    // Signature is mandatory — reject requests without it
    if (!signature) {
      return new Response(JSON.stringify({ error: 'Missing signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify webhook signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(RAZORPAY_KEY_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
    const expectedSig = Array.from(new Uint8Array(sig))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (expectedSig !== signature) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const event = JSON.parse(body);
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const eventType = event.event;
    const payload = event.payload;

    if (eventType === 'subscription.activated' || eventType === 'subscription.charged') {
      const subscriptionId = payload.subscription?.entity?.id;
      const paymentId = payload.payment?.entity?.id;
      const notes = payload.subscription?.entity?.notes || {};

      if (subscriptionId) {
        const now = new Date();
        const billingCycle = notes.billing_cycle || 'monthly';
        const periodEnd = new Date(now);
        if (billingCycle === 'yearly') {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            razorpay_payment_id: paymentId,
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq('razorpay_subscription_id', subscriptionId);
      }
    } else if (eventType === 'subscription.cancelled' || eventType === 'subscription.completed') {
      const subscriptionId = payload.subscription?.entity?.id;
      if (subscriptionId) {
        await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('razorpay_subscription_id', subscriptionId);
      }
    } else if (eventType === 'subscription.halted' || eventType === 'subscription.pending') {
      const subscriptionId = payload.subscription?.entity?.id;
      if (subscriptionId) {
        await supabase
          .from('subscriptions')
          .update({
            status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('razorpay_subscription_id', subscriptionId);
      }
    } else if (eventType === 'payment.captured') {
      // Handle rent payment captures
      const paymentEntity = payload.payment?.entity;
      const notes = paymentEntity?.notes || {};

      if (notes.type === 'rent_payment' && notes.payment_id) {
        const razorpayPaymentId = paymentEntity?.id;
        await supabase
          .from('rent_payments')
          .update({
            status: 'paid',
            payment_date: new Date().toISOString(),
            transaction_id: razorpayPaymentId,
          })
          .eq('id', notes.payment_id)
          .eq('status', 'pending');

        // Notify the property owner
        const { data: rentPayment } = await supabase
          .from('rent_payments')
          .select('property_id, month, amount, tenant_id')
          .eq('id', notes.payment_id)
          .single();

        if (rentPayment) {
          const { data: property } = await supabase
            .from('properties')
            .select('owner_id, name')
            .eq('id', rentPayment.property_id)
            .single();

          if (property) {
            await supabase.from('notifications').insert({
              user_id: property.owner_id,
              title: 'Rent Payment Received',
              message: `Rent of ₹${rentPayment.amount} for ${rentPayment.month} at ${property.name} has been paid online.`,
              type: 'payment',
            });
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
