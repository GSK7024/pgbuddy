import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
    const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return new Response(
        JSON.stringify({ error: "VAPID keys not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, subscription, user_id, title, message, target_user_ids, url } = await req.json();

    // Action: get VAPID public key
    if (action === "get-vapid-key") {
      return new Response(
        JSON.stringify({ vapidPublicKey: VAPID_PUBLIC_KEY }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: subscribe
    if (action === "subscribe") {
      if (!subscription || !user_id) {
        return new Response(
          JSON.stringify({ error: "Missing subscription or user_id" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
        { onConflict: "user_id,endpoint" }
      );

      if (error) {
        console.error("Error saving subscription:", error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: unsubscribe
    if (action === "unsubscribe") {
      if (!user_id) {
        return new Response(
          JSON.stringify({ error: "Missing user_id" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await supabase.from("push_subscriptions").delete().eq("user_id", user_id);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: send push notification to target users
    if (action === "send") {
      if (!target_user_ids || !title || !message) {
        return new Response(
          JSON.stringify({ error: "Missing target_user_ids, title, or message" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: subscriptions, error: subErr } = await supabase
        .from("push_subscriptions")
        .select("*")
        .in("user_id", target_user_ids);

      if (subErr) {
        console.error("Error fetching subscriptions:", subErr);
        return new Response(
          JSON.stringify({ error: subErr.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!subscriptions || subscriptions.length === 0) {
        return new Response(
          JSON.stringify({ sent: 0, message: "No push subscriptions found for target users" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Use web-push library for Deno
      const { default: webpush } = await import("npm:web-push@3.6.7");

      webpush.setVapidDetails(
        "mailto:support@pgbuddy.lovable.app",
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY
      );

      const payload = JSON.stringify({
        title,
        body: message,
        icon: "/pwa-icon-192.png",
        badge: "/pwa-icon-192.png",
        url: url || "/",
        timestamp: Date.now(),
      });

      let sent = 0;
      let failed = 0;

      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload
          );
          sent++;
        } catch (err: any) {
          console.error(`Push failed for ${sub.endpoint}:`, err.message);
          // Remove invalid subscriptions (410 Gone or 404)
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          }
          failed++;
        }
      }

      return new Response(
        JSON.stringify({ sent, failed, total: subscriptions.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
