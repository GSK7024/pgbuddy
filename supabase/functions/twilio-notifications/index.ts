import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Helper: normalise phone to WhatsApp E.164 ──
function toWhatsApp(phone: string): string {
  const clean = phone.replace(/\s+/g, "");
  if (clean.startsWith("whatsapp:")) return clean;
  return `whatsapp:${clean.startsWith("+") ? clean : "+91" + clean}`;
}

// ── Helper: send a single WhatsApp message ──
async function sendWhatsApp(
  to: string,
  body: string,
  sid: string,
  token: string,
  from: string
): Promise<boolean> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const form = new URLSearchParams();
  form.append("From", from);
  form.append("To", to);
  form.append("Body", body);

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`${sid}:${token}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
    if (!resp.ok) {
      console.error(`Twilio error for ${to}:`, await resp.text());
      return false;
    }
    return true;
  } catch (err: any) {
    console.error(`Failed to message ${to}:`, err.message);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TWILIO_ACCOUNT_SID =
      Deno.env.get("TWILIO_ACCOUNT_SID") ?? "PLACEHOLDER_ACCOUNT_SID";
    const TWILIO_AUTH_TOKEN =
      Deno.env.get("TWILIO_AUTH_TOKEN") ?? "PLACEHOLDER_AUTH_TOKEN";
    const TWILIO_WHATSAPP_FROM =
      Deno.env.get("TWILIO_WHATSAPP_FROM") ?? "whatsapp:+14155238886";

    const isPlaceholder =
      TWILIO_ACCOUNT_SID === "PLACEHOLDER_ACCOUNT_SID" ||
      TWILIO_AUTH_TOKEN === "PLACEHOLDER_AUTH_TOKEN";

    if (isPlaceholder) {
      console.warn(
        "⚠️  Twilio credentials are placeholders – messages will NOT be sent."
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const payload = await req.json();
    const { action } = payload;

    // ════════════════════════════════════════════════
    // ACTION 1: send-rent-reminder (existing)
    // ════════════════════════════════════════════════
    if (action === "send-rent-reminder") {
      const { tenant_ids, tenant_phone, message, property_name, room_number, amount, month } = payload;

      let recipients: { phone: string; full_name: string }[] = [];

      if (tenant_phone) {
        recipients.push({ phone: tenant_phone, full_name: "Tenant" });
      } else if (tenant_ids?.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, phone, full_name")
          .in("user_id", tenant_ids);
        recipients = (profiles ?? []).filter((p: any) => p.phone?.trim());
      }

      if (recipients.length === 0) {
        return new Response(
          JSON.stringify({ sent: 0, message: "No recipients found" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (isPlaceholder) {
        console.log(`[PLACEHOLDER] Would send rent reminder to ${recipients.length} recipient(s)`);
        return new Response(
          JSON.stringify({ sent: 0, reason: "placeholder_credentials", recipients: recipients.length }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let sent = 0;
      for (const t of recipients) {
        const body =
          message ??
          `🏠 *PG Buddy – Rent Reminder*\n\nHi ${t.full_name ?? "Tenant"},\n\nYour rent of ₹${Number(amount ?? 0).toLocaleString("en-IN")} for *${property_name ?? "your PG"}* (Room ${room_number ?? "N/A"}) for *${month ?? "this month"}* is due.\n\nPlease pay at your earliest convenience.\n\nThank you! 🙏`;
        if (await sendWhatsApp(toWhatsApp(t.phone), body, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM)) sent++;
      }

      return new Response(
        JSON.stringify({ sent, total: recipients.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ════════════════════════════════════════════════
    // ACTION 2: send-announcement
    // Owner/Manager posts announcement → WhatsApp all tenants of that property
    // ════════════════════════════════════════════════
    if (action === "send-announcement") {
      const { property_id, title, content, property_name } = payload;

      // Get all tenants assigned to this property
      const { data: assignments } = await supabase
        .from("tenant_assignments")
        .select("tenant_id, tenant_phone")
        .eq("property_id", property_id)
        .eq("status", "active");

      const tenantIds = (assignments ?? []).map((a: any) => a.tenant_id).filter(Boolean);
      const directPhones = (assignments ?? []).filter((a: any) => a.tenant_phone && !a.tenant_id).map((a: any) => a.tenant_phone);

      // Fetch profile phones for registered tenants
      let profilePhones: { phone: string; full_name: string }[] = [];
      if (tenantIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("phone, full_name")
          .in("user_id", tenantIds);
        profilePhones = (profiles ?? []).filter((p: any) => p.phone?.trim());
      }

      const allRecipients = [
        ...profilePhones.map((p: any) => ({ phone: p.phone, name: p.full_name })),
        ...directPhones.map((ph: string) => ({ phone: ph, name: "Tenant" })),
      ];

      if (allRecipients.length === 0) {
        return new Response(
          JSON.stringify({ sent: 0, message: "No tenants with phone numbers" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const body = `📢 *PG Buddy – Announcement*\n\n*${title}*\n\n${content}\n\n🏠 ${property_name || "Your PG"}`;

      if (isPlaceholder) {
        console.log(`[PLACEHOLDER] Would send announcement "${title}" to ${allRecipients.length} tenant(s)`);
        return new Response(
          JSON.stringify({ sent: 0, reason: "placeholder_credentials", recipients: allRecipients.length }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let sent = 0;
      for (const r of allRecipients) {
        if (await sendWhatsApp(toWhatsApp(r.phone), body, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM)) sent++;
      }

      return new Response(
        JSON.stringify({ sent, total: allRecipients.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ════════════════════════════════════════════════
    // ACTION 3: send-complaint-alert
    // Tenant files complaint → WhatsApp owner + manager
    // ════════════════════════════════════════════════
    if (action === "send-complaint-alert") {
      const { property_id, title, category, tenant_name, room_number } = payload;

      // Get property owner
      const { data: property } = await supabase
        .from("properties")
        .select("owner_id, name")
        .eq("id", property_id)
        .single();

      if (!property) {
        return new Response(
          JSON.stringify({ error: "Property not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get owner phone
      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("phone, full_name")
        .eq("user_id", property.owner_id)
        .single();

      // Get manager(s) for this property
      const { data: staff } = await supabase
        .from("staff_members")
        .select("staff_user_id, role")
        .eq("owner_id", property.owner_id)
        .eq("status", "active")
        .in("role", ["manager"]);

      const managerIds = (staff ?? []).map((s: any) => s.staff_user_id);
      let managerPhones: any[] = [];
      if (managerIds.length > 0) {
        const { data: mProfiles } = await supabase
          .from("profiles")
          .select("phone, full_name")
          .in("user_id", managerIds);
        managerPhones = (mProfiles ?? []).filter((p: any) => p.phone?.trim());
      }

      const recipients = [
        ...(ownerProfile?.phone ? [{ phone: ownerProfile.phone, name: ownerProfile.full_name }] : []),
        ...managerPhones.map((p: any) => ({ phone: p.phone, name: p.full_name })),
      ];

      if (recipients.length === 0) {
        return new Response(
          JSON.stringify({ sent: 0, message: "No owner/manager phone numbers" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const body = `🚨 *PG Buddy – New Complaint*\n\n*${title}*\nCategory: ${category}\nBy: ${tenant_name || "A tenant"}${room_number ? ` (Room ${room_number})` : ""}\n\n🏠 ${property.name}\n\nPlease check your PG Buddy dashboard for details.`;

      if (isPlaceholder) {
        console.log(`[PLACEHOLDER] Would send complaint alert "${title}" to ${recipients.length} recipient(s)`);
        return new Response(
          JSON.stringify({ sent: 0, reason: "placeholder_credentials", recipients: recipients.length }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let sent = 0;
      for (const r of recipients) {
        if (await sendWhatsApp(toWhatsApp(r.phone), body, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM)) sent++;
      }

      return new Response(
        JSON.stringify({ sent, total: recipients.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ════════════════════════════════════════════════
    // ACTION 4: send-vacancy-alert
    // Tenant submits vacancy notice → WhatsApp owner + manager
    // ════════════════════════════════════════════════
    if (action === "send-vacancy-alert") {
      const { property_id, tenant_name, room_number, expected_move_out } = payload;

      // Get property owner
      const { data: property } = await supabase
        .from("properties")
        .select("owner_id, name")
        .eq("id", property_id)
        .single();

      if (!property) {
        return new Response(
          JSON.stringify({ error: "Property not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get owner phone
      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("phone, full_name")
        .eq("user_id", property.owner_id)
        .single();

      // Get manager(s)
      const { data: staff } = await supabase
        .from("staff_members")
        .select("staff_user_id")
        .eq("owner_id", property.owner_id)
        .eq("status", "active")
        .in("role", ["manager"]);

      const managerIds = (staff ?? []).map((s: any) => s.staff_user_id);
      let managerPhones: any[] = [];
      if (managerIds.length > 0) {
        const { data: mProfiles } = await supabase
          .from("profiles")
          .select("phone, full_name")
          .in("user_id", managerIds);
        managerPhones = (mProfiles ?? []).filter((p: any) => p.phone?.trim());
      }

      const recipients = [
        ...(ownerProfile?.phone ? [{ phone: ownerProfile.phone, name: ownerProfile.full_name }] : []),
        ...managerPhones.map((p: any) => ({ phone: p.phone, name: p.full_name })),
      ];

      if (recipients.length === 0) {
        return new Response(
          JSON.stringify({ sent: 0, message: "No owner/manager phone numbers" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const body = `🏠 *PG Buddy – Vacancy Notice*\n\n${tenant_name || "A tenant"}${room_number ? ` (Room ${room_number})` : ""} has submitted a move-out notice.\n\n📅 Expected move-out: *${expected_move_out}*\n🏠 ${property.name}\n\nPlease check your dashboard to acknowledge.`;

      if (isPlaceholder) {
        console.log(`[PLACEHOLDER] Would send vacancy alert to ${recipients.length} recipient(s)`);
        return new Response(
          JSON.stringify({ sent: 0, reason: "placeholder_credentials", recipients: recipients.length }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let sent = 0;
      for (const r of recipients) {
        if (await sendWhatsApp(toWhatsApp(r.phone), body, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM)) sent++;
      }

      return new Response(
        JSON.stringify({ sent, total: recipients.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Unknown action ──
    return new Response(
      JSON.stringify({ error: "Unknown action. Supported: send-rent-reminder, send-announcement, send-complaint-alert, send-vacancy-alert" }),
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
