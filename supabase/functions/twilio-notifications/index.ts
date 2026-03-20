import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Helper: normalise phone to E.164 (India default) ──
function toE164(phone: string): string {
  const clean = phone.replace(/[\s\-()whatsapp:]/g, "");
  if (clean.startsWith("+")) return clean;
  if (clean.startsWith("91") && clean.length >= 12) return "+" + clean;
  return "+91" + clean;
}

// ── Helper: send a single WhatsApp message via Aisensy ──
async function sendAisensy(
  to: string,
  templateName: string,
  templateParams: string[],
  apiKey: string
): Promise<boolean> {
  const url = "https://backend.aisensy.com/campaign/t1/api/v2";
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apiKey,
        campaignName: templateName,
        destination: to,
        userName: "PG Buddy",
        templateParams,
      }),
    });
    if (!resp.ok) {
      const errText = await resp.text();
      console.error(`Aisensy error for ${to}:`, errText);
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
    const AISENSY_API_KEY = Deno.env.get("AISENSY_API_KEY");
    if (!AISENSY_API_KEY) {
      console.error("AISENSY_API_KEY not configured");
      return new Response(
        JSON.stringify({ sent: 0, reason: "api_key_missing", message: "Aisensy API key not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const payload = await req.json();
    const { action } = payload;

    // ── Plan gating: gated actions require Business or Enterprise plan ──
    const GATED_ACTIONS = ["send-announcement", "send-complaint-alert", "send-vacancy-alert"];
    if (GATED_ACTIONS.includes(action) && payload.property_id) {
      const { data: property } = await supabase
        .from("properties")
        .select("owner_id")
        .eq("id", payload.property_id)
        .single();

      if (property?.owner_id) {
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("plan_id, subscription_plans(slug)")
          .eq("user_id", property.owner_id)
          .eq("status", "active")
          .maybeSingle();

        const slug = (sub as any)?.subscription_plans?.slug || "free";
        if (slug !== "business" && slug !== "enterprise") {
          return new Response(
            JSON.stringify({ sent: 0, reason: "upgrade_required", message: "WhatsApp notifications for announcements, complaints, and vacancy alerts require a Business or Enterprise plan." }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // ════════════════════════════════════════════════
    // ACTION 1: send-rent-reminder
    // ════════════════════════════════════════════════
    if (action === "send-rent-reminder") {
      const { tenant_ids, tenant_phone, property_name, room_number, amount, month } = payload;

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

      let sent = 0;
      for (const t of recipients) {
        // Template params: {{1}}=name, {{2}}=amount, {{3}}=property, {{4}}=room, {{5}}=month
        const params = [
          t.full_name || "Tenant",
          String(amount || "0"),
          property_name || "Your PG",
          room_number || "N/A",
          month || "this month",
        ];
        if (await sendAisensy(toE164(t.phone), "rent_reminder", params, AISENSY_API_KEY)) sent++;
      }

      return new Response(
        JSON.stringify({ sent, total: recipients.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ════════════════════════════════════════════════
    // ACTION 2: send-announcement
    // ════════════════════════════════════════════════
    if (action === "send-announcement") {
      const { property_id, title, content, property_name } = payload;

      const { data: assignments } = await supabase
        .from("tenant_assignments")
        .select("tenant_id, tenant_phone")
        .eq("property_id", property_id)
        .eq("status", "active");

      const tenantIds = (assignments ?? []).map((a: any) => a.tenant_id).filter(Boolean);
      const directPhones = (assignments ?? []).filter((a: any) => a.tenant_phone && !a.tenant_id).map((a: any) => a.tenant_phone);

      let profilePhones: { phone: string; full_name: string }[] = [];
      if (tenantIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("phone, full_name")
          .in("user_id", tenantIds);
        profilePhones = (profiles ?? []).filter((p: any) => p.phone?.trim());
      }

      const allRecipients = [
        ...profilePhones.map((p: any) => ({ phone: p.phone })),
        ...directPhones.map((ph: string) => ({ phone: ph })),
      ];

      if (allRecipients.length === 0) {
        return new Response(
          JSON.stringify({ sent: 0, message: "No tenants with phone numbers" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let sent = 0;
      for (const r of allRecipients) {
        // Template params: {{1}}=title, {{2}}=content, {{3}}=property
        const params = [
          title || "Update",
          content || "Please check your PG Buddy app for details.",
          property_name || "Your PG",
        ];
        if (await sendAisensy(toE164(r.phone), "pg_announcement", params, AISENSY_API_KEY)) sent++;
      }

      return new Response(
        JSON.stringify({ sent, total: allRecipients.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ════════════════════════════════════════════════
    // ACTION 3: send-complaint-alert
    // ════════════════════════════════════════════════
    if (action === "send-complaint-alert") {
      const { property_id, title, category, tenant_name, room_number } = payload;

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

      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("phone, full_name")
        .eq("user_id", property.owner_id)
        .single();

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
        ...(ownerProfile?.phone ? [{ phone: ownerProfile.phone }] : []),
        ...managerPhones.map((p: any) => ({ phone: p.phone })),
      ];

      if (recipients.length === 0) {
        return new Response(
          JSON.stringify({ sent: 0, message: "No owner/manager phone numbers" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let sent = 0;
      for (const r of recipients) {
        // Template params: {{1}}=tenant, {{2}}=property, {{3}}=room, {{4}}=issue, {{5}}=category
        const params = [
          tenant_name || "A tenant",
          property.name || "Your PG",
          room_number || "N/A",
          title || "Issue reported",
          category || "General",
        ];
        if (await sendAisensy(toE164(r.phone), "complaint_alert", params, AISENSY_API_KEY)) sent++;
      }

      return new Response(
        JSON.stringify({ sent, total: recipients.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ════════════════════════════════════════════════
    // ACTION 4: send-vacancy-alert
    // ════════════════════════════════════════════════
    if (action === "send-vacancy-alert") {
      const { property_id, tenant_name, expected_move_out } = payload;

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

      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("phone, full_name")
        .eq("user_id", property.owner_id)
        .single();

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
        ...(ownerProfile?.phone ? [{ phone: ownerProfile.phone }] : []),
        ...managerPhones.map((p: any) => ({ phone: p.phone })),
      ];

      if (recipients.length === 0) {
        return new Response(
          JSON.stringify({ sent: 0, message: "No owner/manager phone numbers" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let sent = 0;
      for (const r of recipients) {
        // Template params: {{1}}=tenant, {{2}}=property, {{3}}=move-out date
        const params = [
          tenant_name || "A tenant",
          property.name || "Your PG",
          expected_move_out || "Not specified",
        ];
        if (await sendAisensy(toE164(r.phone), "vacancy_alert", params, AISENSY_API_KEY)) sent++;
      }

      return new Response(
        JSON.stringify({ sent, total: recipients.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ════════════════════════════════════════════════
    // ACTION 5: send-payment-approval (NEW)
    // Tenant submits payment proof → WhatsApp owner + manager
    // ════════════════════════════════════════════════
    if (action === "send-payment-approval") {
      const { property_id, tenant_name, room_number, amount, month } = payload;

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

      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("phone, full_name")
        .eq("user_id", property.owner_id)
        .single();

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
        ...(ownerProfile?.phone ? [{ phone: ownerProfile.phone }] : []),
        ...managerPhones.map((p: any) => ({ phone: p.phone })),
      ];

      if (recipients.length === 0) {
        return new Response(
          JSON.stringify({ sent: 0, message: "No owner/manager phone numbers" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let sent = 0;
      for (const r of recipients) {
        // Template params: {{1}}=tenant, {{2}}=property, {{3}}=room, {{4}}=amount, {{5}}=month
        const params = [
          tenant_name || "A tenant",
          property.name || "Your PG",
          room_number || "N/A",
          String(amount || "0"),
          month || "this month",
        ];
        if (await sendAisensy(toE164(r.phone), "payment_approval", params, AISENSY_API_KEY)) sent++;
      }

      return new Response(
        JSON.stringify({ sent, total: recipients.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Unknown action ──
    return new Response(
      JSON.stringify({ error: "Unknown action. Supported: send-rent-reminder, send-announcement, send-complaint-alert, send-vacancy-alert, send-payment-approval" }),
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
