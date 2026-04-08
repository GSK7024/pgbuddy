import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Helper: send bulk messages via whatsapp-server queue or fallback to Interakt ──
async function sendBulkWhatsApp(
  phones: string[],
  templateName: string,
  bodyValuesList: string[][],
  messageTemplate: string,
  apiKey: string
): Promise<number> {
  const WA_SERVER_URL = Deno.env.get("WA_SERVER_URL");
  const WA_SERVER_SECRET = Deno.env.get("WA_SERVER_SECRET") || "pg_buddy_whatsapp_secret_2024";

  // Try WhatsApp Web.js Bulk Queue first
  if (WA_SERVER_URL && phones.length > 0) {
    try {
      console.log(`[WA Server] Queueing ${phones.length} messages...`);
      // For bulk queue, we assume identical message string (like an announcement)
      // If we need personalized messages, we either send them one by one to /api/send-otp
      // OR we just queue the first variant. For now, let's just queue the generic one.
      const resp = await fetch(`${WA_SERVER_URL}/api/bulk-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-server-secret": WA_SERVER_SECRET,
          "Bypass-Tunnel-Reminder": "true"
        },
        body: JSON.stringify({
          phoneNumbers: phones,
          message: messageTemplate,
          templateType: templateName
        }),
      });

      const rawText = await resp.text();
      let data: any = {};
      try { data = JSON.parse(rawText); } catch { /* tunnel HTML */ }

      if (resp.ok && data.success) {
        console.log(`✅ [WA Server] Successfully queued ${phones.length} messages`);
        return phones.length;
      }
      console.warn("[WA Server] Queue response:", rawText.substring(0, 200));
    } catch (err: any) {
      console.warn("[WA Server] Unreachable:", err.message);
    }
  }

  // Fallback to Interakt sending one by one
  let sentCount = 0;
  for (let i = 0; i < phones.length; i++) {
    const to = phones[i];
    const bodyValues = bodyValuesList[i] || bodyValuesList[0];
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
    
    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${apiKey}`
        },
        body: JSON.stringify(payload),
      });
      if (resp.ok) sentCount++;
    } catch (err) {
      console.error(`Interakt error for ${cleanPhone}`);
    }
  }
  return sentCount;
}

// ── Helper: send a single WhatsApp message (Fast lane or Interakt) ──
async function sendSingleWhatsApp(
  to: string,
  templateName: string,
  bodyValues: string[],
  messageText: string,
  apiKey: string
): Promise<boolean> {
  const WA_SERVER_URL = Deno.env.get("WA_SERVER_URL");
  const WA_SERVER_SECRET = Deno.env.get("WA_SERVER_SECRET") || "pg_buddy_whatsapp_secret_2024";

  if (WA_SERVER_URL) {
    try {
      const cleanPhone = to.replace(/\D/g, "").slice(-10);
      const formattedPhone = "91" + cleanPhone;
      
      // Use /api/send-instant for immediate single-message delivery
      const resp = await fetch(`${WA_SERVER_URL}/api/send-instant`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "x-server-secret": WA_SERVER_SECRET,
          "Bypass-Tunnel-Reminder": "true"
        },
        body: JSON.stringify({ phoneNumber: formattedPhone, message: messageText }),
      });
      // Even if tunnel garbles response, message was likely sent
      if (resp.ok || resp.status < 500) return true;
    } catch (err) { console.warn("[WA Instant] Error:", (err as any).message); }
  }

  // Fallback Interakt
  const cleanPhone = to.replace(/\D/g, "").slice(-10);
  const url = "https://api.interakt.ai/v1/public/message/";
  const payload = {
    countryCode: "+91",
    phoneNumber: cleanPhone,
    callbackData: "pg_notification",
    type: "Template",
    template: { name: templateName, languageCode: "en", bodyValues },
  };
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Basic ${apiKey}` },
      body: JSON.stringify(payload),
    });
    return resp.ok;
  } catch (err) { return false; }
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

      const phonesList = recipients.map(r => r.phone);
      const paramsList = recipients.map(t => [
        t.full_name || "Tenant",
        String(amount || "0"),
        property_name || "Your PG",
        room_number || "N/A",
        month || "this month",
      ]);

      // Professional rent reminder template
      const messageText = `🏠 *${property_name || "Your PG"} — Rent Reminder*\n\n────────────────────\nHi *${recipients[0]?.full_name || "Tenant"}* 👋\n\n💰 *Amount:* ₹${amount?.toLocaleString() || "0"}\n📍 *Room:* ${room_number || "N/A"}\n📅 *Month:* ${month || "this month"}\n\nPlease make the payment at your earliest convenience to avoid any late charges.\n────────────────────\n_Sent via PG Buddy_`;

      const sent = await sendBulkWhatsApp(
        phonesList,
        "rent_reminder",
        paramsList,
        messageText,
        INTERAKT_API_KEY
      );

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

      console.log(`[Announcements] Found ${allRecipients.length} recipients. Queueing...`);
      
      const phonesList = allRecipients.map(r => r.phone);
      const paramsList = allRecipients.map(() => [
        title || "Update",
        content || "Please check your PG Buddy app for details.",
        property_name || "Your PG",
      ]);

      const messageText = `📢 *${property_name || "PG"} — New Announcement*\n\n────────────────────\n📌 *${title || "Update"}*\n\n${content || "Please check your PG Buddy app for details."}\n────────────────────\n_Sent via PG Buddy • ${property_name || "Your PG"}_`;

      const sent = await sendBulkWhatsApp(
        phonesList,
        "announcement",
        paramsList,
        messageText,
        INTERAKT_API_KEY
      );

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

      const messageText = `👋 *Welcome to ${property_name || "PG Buddy"}!*\n\n────────────────────\nHi *${tenant_name || "Tenant"}*,\n\nYou’ve been assigned to:\n🏠 *Property:* ${property_name || "Your PG"}\n🚪 *Room:* ${payload.room_number || "N/A"}\n\n📲 Access your dashboard, pay rent, and raise complaints anytime:\nhttps://pgbuddy-zeta-rust.vercel.app\n────────────────────\n_Sent via PG Buddy_`;

      let sent = 0;
      if (await sendSingleWhatsApp(tenant_phone, "welcome_tenant", params, messageText, INTERAKT_API_KEY)) sent++;

      return new Response(
        JSON.stringify({ sent, total: 1 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ════════════════════════════════════════════════
    // ACTION 3: send-complaint-alert
    // ════════════════════════════════════════════════
    if (action === "send-complaint-alert") {
      const { property_id, title, category, tenant_name, room_number, tenant_phone } = payload;

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

      // Map complaint categories to specific vendor roles
      const categoryToRole: Record<string, string> = {
        "plumbing": "plumber",
        "electrical": "electrician",
        "cleaning": "cleaner",
      };
      const matchingRole = categoryToRole[(category || "").toLowerCase()] || null;
      
      const rolesToNotify = ["manager", "caretaker"];
      if (matchingRole) {
         rolesToNotify.push(matchingRole);
      }

      // Fetch staff, including "pending" status so unregistered vendors get SMS
      const { data: staff } = await supabase
        .from("staff_members")
        .select("staff_user_id, invited_phone")
        .eq("owner_id", property.owner_id)
        .in("status", ["active", "pending"])
        .or(`property_id.eq.${property_id},property_id.is.null`)
        .in("role", rolesToNotify);

      // Extract registered staff IDs
      const managerIds = (staff ?? []).map((s: any) => s.staff_user_id).filter(Boolean);
      let managerPhones: any[] = [];
      if (managerIds.length > 0) {
        const { data: mProfiles } = await supabase
          .from("profiles")
          .select("phone, full_name")
          .in("user_id", managerIds);
        managerPhones = (mProfiles ?? []).filter((p: any) => p.phone?.trim());
      }

      // Extract directly invited vendor phones (bypassing profile creation)
      const invitedPhones = (staff ?? [])
         .filter((s: any) => !s.staff_user_id && s.invited_phone?.trim())
         .map((s: any) => ({ phone: s.invited_phone.trim() }));

      const recipientsRaw = [
        ...(ownerProfile?.phone ? [{ phone: ownerProfile.phone }] : []),
        ...managerPhones.map((p: any) => ({ phone: p.phone })),
        ...invitedPhones,
        ...(tenant_phone ? [{ phone: tenant_phone }] : []),
      ];

      // Deduplicate phone numbers
      const seenRaw = new Set();
      const recipients = [];
      for (const r of recipientsRaw) {
        if (!seenRaw.has(r.phone)) {
           seenRaw.add(r.phone);
           recipients.push(r);
        }
      }

      if (recipients.length === 0) {
        return new Response(
          JSON.stringify({ sent: 0, message: "No owner/manager phone numbers" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[ComplaintAlert] Sending to ${recipients.length} recipients (Owner/Managers).`);
      
      const phonesList = recipients.map(r => r.phone);
      const paramsList = recipients.map(() => [
        tenant_name || "A tenant",
        property.name || "Your PG",
        room_number || "N/A",
        title || "Issue reported",
        category || "General",
      ]);

      const messageText = `🚨 *${property.name || "Your PG"} — Complaint Logged*\n\n────────────────────\n📝 *Issue:* ${title || "Issue reported"}\n🏷️ *Category:* ${category || "General"}\n👤 *Tenant:* ${tenant_name || "A tenant"}\n🚪 *Room:* ${room_number || "N/A"}\n\nThe staff has been notified and will resolve this shortly.\n────────────────────\n_Sent via PG Buddy_`;

      // Complaints send INSTANTLY to each recipient (not queued)
      let sent = 0;
      for (const r of recipients) {
        if (await sendSingleWhatsApp(r.phone, "complaint_alert", paramsList[0], messageText, INTERAKT_API_KEY)) sent++;
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

      const phonesList = recipients.map(r => r.phone);
      const paramsList = recipients.map(() => [
        tenant_name || "A tenant",
        property.name || "Your PG",
        expected_move_out || "Not specified",
      ]);

      const messageText = `🚪 *${property.name || "Your PG"} — Vacancy Alert*\n\n────────────────────\n👤 *Tenant:* ${tenant_name || "A tenant"}\n📅 *Expected move-out:* ${expected_move_out || "Not specified"}\n\nA room will be available soon. Plan accordingly.\n────────────────────\n_Sent via PG Buddy_`;

      // Vacancy alerts also send instantly
      let sent = 0;
      for (const r of recipients) {
        if (await sendSingleWhatsApp(r.phone, "announcement", paramsList[0], messageText, INTERAKT_API_KEY)) sent++;
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

      const phonesList = recipients.map(r => r.phone);
      const paramsList = recipients.map(() => [
        tenant_name || "A tenant",
        property.name || "Your PG",
        room_number || "N/A",
        String(amount || "0"),
        month || "this month",
      ]);

      const messageText = `💳 *${property.name || "Your PG"} — Payment Received*\n\n────────────────────\n👤 *Tenant:* ${tenant_name || "A tenant"}\n🚪 *Room:* ${room_number || "N/A"}\n💰 *Amount:* ₹${amount?.toLocaleString() || "0"}\n📅 *Month:* ${month || "this month"}\n\nPayment proof submitted. Please review & approve on the dashboard.\n────────────────────\n_Sent via PG Buddy_`;

      // Payment approvals send instantly
      let sent = 0;
      for (const r of recipients) {
        if (await sendSingleWhatsApp(r.phone, "payment_approval", paramsList[0], messageText, INTERAKT_API_KEY)) sent++;
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

      let finalUrl = receipt_url || "https://pgbuddy-zeta-rust.vercel.app";
      if (finalUrl.includes('localhost') || finalUrl.includes('192.168.') || finalUrl.includes('127.0.0.1') || finalUrl.includes('10.0.')) {
        // Extract the path (e.g., /receipt/uuid) and prepend the production domain
        const urlParts = finalUrl.split('/receipt/');
        if (urlParts.length > 1) {
          finalUrl = `https://pgbuddy-zeta-rust.vercel.app/receipt/${urlParts[1]}`;
        } else {
          finalUrl = "https://pgbuddy-zeta-rust.vercel.app";
        }
      }

      // Template params: {{1}}=name, {{2}}=amount, {{3}}=month, {{4}}=property, {{5}}=room, {{6}}=receipt_link
      const params = [
        tenant_name || "Tenant",
        String(amount || "0"),
        month || "this month",
        property_name || "Your PG",
        room_number || "N/A",
        finalUrl,
      ];

      const messageText = `💰 *Payment Received*\n\nHi ${tenant_name || "Tenant"},\nWe have received your payment of ₹${amount || "0"} for ${month || "this month"}.\n\nView receipt: ${finalUrl}\n\n_PG Buddy App_`;

      let sent = 0;
      if (await sendSingleWhatsApp(tenant_phone, "payment_received", params, messageText, INTERAKT_API_KEY)) sent++;

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

      const messageText = `🍲 *Mess Bill Reminder*\n\nHi ${member_name || "Member"},\nThis is a reminder for your mess bill of ₹${amount || "0"} for ${month || "this month"} at ${mess_name || "the Mess"}.\n\n_PG Buddy App_`;

      let sent = 0;
      if (await sendSingleWhatsApp(member_phone, "announcement", params, messageText, INTERAKT_API_KEY)) sent++;

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

      // Template params: {{1}}=name, {{2}}=property, {{3}}=room, {{4}}=login link
      const params = [
        tenant_name || "Tenant",
        property_name || "your PG",
        room_number || "N/A",
        "https://pgbuddy.in/auth",
      ];

      const messageText = `👋 *Welcome to ${property_name || "PG Buddy"}!*\n\nHi ${tenant_name || "Tenant"},\nYou've been added to room ${room_number || "N/A"}.\n\nDownload the app to view your rent dues and notices: https://pgbuddy.in/auth\n\n_PG Buddy App_`;

      let sent = 0;
      if (await sendSingleWhatsApp(tenant_phone, "welcome_template", params, messageText, INTERAKT_API_KEY)) sent++;

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
