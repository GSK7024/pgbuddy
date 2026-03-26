import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Helper: send a single WhatsApp message via Interakt ──
async function sendInterakt(
  to: string,
  templateName: string,
  bodyValues: string[],
  apiKey: string
): Promise<boolean> {
  const cleanPhone = to.replace(/\D/g, "").slice(-10);
  const url = "https://api.interakt.ai/v1/public/message/";
  const payload = {
    countryCode: "+91",
    phoneNumber: cleanPhone,
    callbackData: "pg_notification",
    type: "Template",
    template: {
      name: templateName,
      languageCode: "en",
      bodyValues,
    },
  };
  
  console.log(`[Interakt] Sending to ${cleanPhone}, template=${templateName}, params=`, JSON.stringify(bodyValues));
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${apiKey}`
      },
      body: JSON.stringify(payload),
    });
    const respText = await resp.text();
    console.log(`[Interakt] Response for ${cleanPhone}:`, resp.status, respText);
    if (!resp.ok) {
      console.error(`Interakt error for ${cleanPhone}:`, respText);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error(`Failed to message ${cleanPhone}:`, err.message);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const INTERAKT_API_KEY = Deno.env.get("INTERAKT_API_KEY");
    if (!INTERAKT_API_KEY) {
      console.error("INTERAKT_API_KEY not configured");
      return new Response(
        JSON.stringify({ sent: 0, reason: "api_key_missing", message: "Interakt API key not configured" }),
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
    // Plan gating temporarily disabled
    /*
    const GATED_ACTIONS = ["send-announcement", "send-complaint-alert", "send-vacancy-alert", "send-payment-approval", "send-payment-received", "send-mess-reminder"];
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
    */

    // ════════════════════════════════════════════════
    // ACTION 1: send-rent-reminder
    // ════════════════════════════════════════════════
    if (action === "send-rent-reminder") {
      const { tenant_ids, tenant_phone, tenant_name, property_name, room_number, amount, month } = payload;

      let recipients: { phone: string; full_name: string }[] = [];

      if (tenant_phone) {
        recipients.push({ phone: tenant_phone, full_name: tenant_name || "Tenant" });
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
        if (await sendInterakt(t.phone, "rent_reminder", params, INTERAKT_API_KEY)) sent++;
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
        .eq("is_active", true);

      // Build recipient list: use tenant_phone from assignment first, then fallback to profiles.phone
      const tenantIds = (assignments ?? []).map((a: any) => a.tenant_id).filter(Boolean);
      
      // Build a map of assignment phones keyed by tenant_id
      const assignPhoneMap: Record<string, string> = {};
      for (const a of (assignments ?? [])) {
        if (a.tenant_id && a.tenant_phone?.trim()) {
          assignPhoneMap[a.tenant_id] = a.tenant_phone;
        }
      }
      
      // Get profile phones as fallback for registered tenants
      let profilePhoneMap: Record<string, string> = {};
      if (tenantIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, phone, full_name")
          .in("user_id", tenantIds);
        for (const p of (profiles ?? [])) {
          if (p.phone?.trim()) profilePhoneMap[p.user_id] = p.phone;
        }
      }

      // Collect all unique phones: assignment phone > profile phone > direct phone (no tenant_id)
      const allRecipients: { phone: string }[] = [];
      const seenPhones = new Set<string>();
      for (const a of (assignments ?? [])) {
        const phone = a.tenant_phone?.trim() || (a.tenant_id ? profilePhoneMap[a.tenant_id] : null);
        if (phone && !seenPhones.has(phone)) {
          seenPhones.add(phone);
          allRecipients.push({ phone });
        }
      }

      if (allRecipients.length === 0) {
        return new Response(
          JSON.stringify({ sent: 0, message: "No tenants with phone numbers" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[Announcements] Found ${allRecipients.length} recipients. Sending using pg_announcement...`);
      let sent = 0;
      for (const r of allRecipients) {
        // Template params: {{1}}=title, {{2}}=content, {{3}}=property
        const params = [
          title || "Update",
          content || "Please check your PG Buddy app for details.",
          property_name || "Your PG",
        ];
        if (await sendInterakt(r.phone, "announcement", params, INTERAKT_API_KEY)) sent++;
      }

      return new Response(
        JSON.stringify({ sent, total: allRecipients.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ════════════════════════════════════════════════
    // ACTION 2.5: send-welcome-message (NEW)
    // ════════════════════════════════════════════════
    if (action === "send-welcome-message") {
      const { tenant_phone, tenant_name, property_name } = payload;

      if (!tenant_phone) {
        return new Response(
          JSON.stringify({ sent: 0, message: "No phone number provided" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Template params: {{1}}=TenantName, {{2}}=Property, {{3}}=Room, {{4}}=Website
      const params = [
        tenant_name || "Tenant",
        property_name || "PG Buddy",
        payload.room_number || "N/A",
        "https://pgbuddy-zeta-rust.vercel.app"
      ];

      let sent = 0;
      if (await sendInterakt(tenant_phone, "welcome_tenant", params, INTERAKT_API_KEY)) sent++;

      return new Response(
        JSON.stringify({ sent, total: 1 }),
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
        .or(`property_id.eq.${property_id},property_id.is.null`)
        .in("role", ["manager", "caretaker"]);

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

      console.log(`[ComplaintAlert] Sending to ${recipients.length} recipients (Owner/Managers).`);
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
        if (await sendInterakt(r.phone, "complaint_alert", params, INTERAKT_API_KEY)) sent++;
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
        if (await sendInterakt(r.phone, "announcement", params, INTERAKT_API_KEY)) sent++;
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
        if (await sendInterakt(r.phone, "payment_approval", params, INTERAKT_API_KEY)) sent++;
      }

      return new Response(
        JSON.stringify({ sent, total: recipients.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ════════════════════════════════════════════════
    // ACTION 6: send-payment-received (NEW)
    // Owner confirms payment → WhatsApp tenant with receipt link
    // ════════════════════════════════════════════════
    if (action === "send-payment-received") {
      const { tenant_phone, tenant_name, amount, month, property_name, room_number, receipt_url } = payload;

      if (!tenant_phone) {
        return new Response(
          JSON.stringify({ sent: 0, message: "No tenant phone number provided" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Template params: {{1}}=name, {{2}}=amount, {{3}}=month, {{4}}=property, {{5}}=room, {{6}}=receipt_link
      const params = [
        tenant_name || "Tenant",
        String(amount || "0"),
        month || "this month",
        property_name || "Your PG",
        room_number || "N/A",
        receipt_url || "https://pgbuddy-zeta-rust.vercel.app",
      ];

      let sent = 0;
      if (await sendInterakt(tenant_phone, "payment_received", params, INTERAKT_API_KEY)) sent++;

      return new Response(
        JSON.stringify({ sent, total: 1 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ════════════════════════════════════════════════
    // ACTION 7: send-mess-reminder (NEW)
    // ════════════════════════════════════════════════
    if (action === "send-mess-reminder") {
      const { member_phone, member_name, amount, month, mess_name } = payload;

      if (!member_phone) {
        return new Response(
          JSON.stringify({ sent: 0, message: "No phone number provided" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Template params: {{1}}=name, {{2}}=amount, {{3}}=month, {{4}}=mess_name
      const params = [
        member_name || "Member",
        String(amount || "0"),
        month || "this month",
        mess_name || "Your PG Buddy Host",
      ];

      let sent = 0;
      if (await sendInterakt(member_phone, "announcement", params, INTERAKT_API_KEY)) sent++;

      return new Response(
        JSON.stringify({ sent, total: 1 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ════════════════════════════════════════════════
    // ACTION 8: send-welcome-message
    // ════════════════════════════════════════════════
    if (action === "send-welcome-message") {
      const { tenant_phone, tenant_name, property_name, room_number } = payload;

      if (!tenant_phone) {
        return new Response(
          JSON.stringify({ sent: 0, message: "No phone number provided" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Template params: {{1}}=name, {{2}}=property, {{3}}=room
      const params = [
        tenant_name || "Tenant",
        property_name || "your PG",
        room_number || "N/A",
      ];

      let sent = 0;
      if (await sendInterakt(tenant_phone, "welcome_template", params, INTERAKT_API_KEY)) sent++;

      return new Response(
        JSON.stringify({ sent, total: 1 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Unknown action ──
    return new Response(
      JSON.stringify({ error: `Unknown action: ${action}. Supported: send-rent-reminder, send-announcement, send-complaint-alert, send-vacancy-alert, send-payment-approval, send-payment-received, send-mess-reminder, send-welcome-message` }),
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
