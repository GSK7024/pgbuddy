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
    // ──────────────────────────────────────────────
    // Twilio credentials – replace with real values
    // or add them to Supabase Secrets
    // ──────────────────────────────────────────────
    const TWILIO_ACCOUNT_SID =
      Deno.env.get("TWILIO_ACCOUNT_SID") ?? "PLACEHOLDER_ACCOUNT_SID";
    const TWILIO_AUTH_TOKEN =
      Deno.env.get("TWILIO_AUTH_TOKEN") ?? "PLACEHOLDER_AUTH_TOKEN";
    const TWILIO_WHATSAPP_FROM =
      Deno.env.get("TWILIO_WHATSAPP_FROM") ?? "whatsapp:+14155238886"; // Twilio sandbox default

    if (
      TWILIO_ACCOUNT_SID === "PLACEHOLDER_ACCOUNT_SID" ||
      TWILIO_AUTH_TOKEN === "PLACEHOLDER_AUTH_TOKEN"
    ) {
      console.warn(
        "⚠️  Twilio credentials are placeholders – messages will NOT be sent. " +
          "Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM to Supabase Secrets."
      );
      return new Response(
        JSON.stringify({
          success: false,
          reason: "Twilio credentials not configured – using placeholders",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, tenant_ids, tenant_phone, message, property_name, room_number, amount, month } =
      await req.json();

    // ── Action: send-rent-reminder ───────────────
    if (action === "send-rent-reminder") {
      let recipients = [];

      if (tenant_phone) {
        // Use the explicit phone number passed in (pending tenant case)
        recipients.push({
          phone: tenant_phone,
          full_name: "Tenant", // fallback
        });
      } else if (tenant_ids && Array.isArray(tenant_ids) && tenant_ids.length > 0) {
        // Look up phone numbers from profiles
        const { data: profiles, error: profErr } = await supabase
          .from("profiles")
          .select("user_id, phone, full_name")
          .in("user_id", tenant_ids);

        if (profErr) {
          console.error("Error fetching profiles:", profErr);
          return new Response(
            JSON.stringify({ error: profErr.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        recipients = (profiles ?? []).filter(
          (p: any) => p.phone && p.phone.trim() !== ""
        );
      }

      if (recipients.length === 0) {
        return new Response(
          JSON.stringify({ sent: 0, message: "No recipients with valid phone numbers found" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let sent = 0;
      let failed = 0;

      for (const tenant of recipients) {
        // Normalise phone to E.164 with whatsapp: prefix
        const phone = tenant.phone.replace(/\s+/g, "");
        const whatsappTo = phone.startsWith("whatsapp:")
          ? phone
          : `whatsapp:${phone.startsWith("+") ? phone : "+91" + phone}`;

        // Build the message body
        const body =
          message ??
          `🏠 *PG Buddy – Rent Reminder*\n\nHi ${tenant.full_name ?? "Tenant"},\n\nYour rent of ₹${Number(amount ?? 0).toLocaleString("en-IN")} for *${property_name ?? "your PG"}* (Room ${room_number ?? "N/A"}) for the month of *${month ?? "this month"}* is due.\n\nPlease pay at your earliest convenience to avoid late fees.\n\nThank you! 🙏`;

        try {
          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

          const formData = new URLSearchParams();
          formData.append("From", TWILIO_WHATSAPP_FROM);
          formData.append("To", whatsappTo);
          formData.append("Body", body);

          const resp = await fetch(twilioUrl, {
            method: "POST",
            headers: {
              Authorization:
                "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: formData.toString(),
          });

          if (resp.ok) {
            sent++;
          } else {
            const errText = await resp.text();
            console.error(`Twilio error for ${whatsappTo}:`, errText);
            failed++;
          }
        } catch (err: any) {
          console.error(`Failed to message ${whatsappTo}:`, err.message);
          failed++;
        }
      }

      return new Response(
        JSON.stringify({ sent, failed, total: recipients.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action. Supported: send-rent-reminder" }),
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
