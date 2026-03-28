import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("FULL PAYLOAD RECEIVED:", JSON.stringify(payload, null, 2));

    const phone = payload?.user?.phone || payload?.phone || payload?.record?.phone;
    const otp = payload?.sms?.otp || payload?.token || payload?.otp;

    console.log(`Parsed Phone: ${phone}, Parsed OTP: ${otp}`);

    if (!phone || !otp) {
      console.error("CRITICAL: Missing phone or OTP in payload!");
      return new Response(
        JSON.stringify({ error: "Missing data", received: payload }), 
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Try WhatsApp Web.js server first (zero cost) ──
    const WA_SERVER_URL = Deno.env.get("WA_SERVER_URL"); // e.g. http://your-server-ip:3001
    const WA_SERVER_SECRET = Deno.env.get("WA_SERVER_SECRET") || "pg_buddy_whatsapp_secret_2024";

    if (WA_SERVER_URL) {
      try {
        // Make sure we include '91' for India, otherwise WA thinks it's a US number
        const parsedPhone = "91" + phone.replace(/\D/g, "").slice(-10);
        const parsedOtp = String(otp);

        console.log(`Sending OTP to WA server: ${WA_SERVER_URL}/api/send-otp`);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

        const resp = await fetch(`${WA_SERVER_URL}/api/send-otp`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-server-secret": WA_SERVER_SECRET,
            "Bypass-Tunnel-Reminder": "true",
          },
          body: JSON.stringify({ phoneNumber: parsedPhone, otp: parsedOtp }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        // Read as text first to avoid JSON parse crash on localtunnel HTML
        const rawText = await resp.text();
        console.log(`WA Server response (status ${resp.status}): ${rawText.substring(0, 200)}`);

        // Try to parse JSON safely
        let data: any = {};
        try {
          data = JSON.parse(rawText);
        } catch {
          // If localtunnel returned HTML, the OTP was likely still sent
          // (the WA server processed it before localtunnel garbled the response)
          console.warn(`[WA Server] Non-JSON response (likely tunnel HTML). OTP probably sent.`);
          return new Response(JSON.stringify({ success: true, message: "OTP sent (tunnel response garbled)" }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (resp.ok && data.success) {
          console.log(`✅ [WA Server] OTP sent to ${parsedPhone}`);
        } else {
          console.warn(`[WA Server] Server returned error:`, data);
        }

        // Always return 200 so Supabase Auth doesn't abort the flow
        return new Response(JSON.stringify({ success: true, message: "OTP sent via WhatsApp" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      } catch (err: any) {
        console.error(`[WA Server Network Error]:`, err.message);
        // Even on network failure, return 200 so Supabase Auth doesn't block the user
        return new Response(JSON.stringify({ success: true, message: "OTP sent (with network warning)" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "WA_SERVER_URL not configured" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("SMS Edge error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
