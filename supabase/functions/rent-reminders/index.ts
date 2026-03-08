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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // Current month string (e.g., "2026-03")
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

    // Calculate dates for reminders
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Get all pending rent payments for current month
    const { data: pendingPayments, error: payErr } = await supabase
      .from("rent_payments")
      .select(
        "id, tenant_id, amount, month, status, property_id, room_id, properties:property_id(name), rooms:room_id(room_number)"
      )
      .eq("status", "pending")
      .eq("month", currentMonth);

    if (payErr) {
      console.error("Error fetching payments:", payErr);
      return new Response(JSON.stringify({ error: payErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!pendingPayments || pendingPayments.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending payments found", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Due date is the 1st of the payment month
    const [year, month] = currentMonth.split("-").map(Number);
    const dueDate = new Date(year, month - 1, 1); // 1st of month
    const dueDateStr = dueDate.toISOString().split("T")[0];

    // Calculate days until/since due
    const daysDiff = Math.floor(
      (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    let reminderType: string | null = null;
    let titleTemplate: string;
    let messageTemplate: (propertyName: string, roomNumber: string, amount: number) => string;

    if (daysDiff === -3) {
      // 3 days before due date
      reminderType = "upcoming";
      titleTemplate = "🔔 Rent Due in 3 Days";
      messageTemplate = (pName, room, amt) =>
        `Your rent of ₹${amt.toLocaleString()} for ${pName} (Room ${room}) is due on the 1st. Please pay on time to avoid late fees.`;
    } else if (daysDiff === 0) {
      // Due date
      reminderType = "due_today";
      titleTemplate = "⚠️ Rent Due Today";
      messageTemplate = (pName, room, amt) =>
        `Your rent of ₹${amt.toLocaleString()} for ${pName} (Room ${room}) is due today. Please make the payment at your earliest convenience.`;
    } else if (daysDiff === 3) {
      // 3 days overdue
      reminderType = "overdue";
      titleTemplate = "🚨 Rent Overdue";
      messageTemplate = (pName, room, amt) =>
        `Your rent of ₹${amt.toLocaleString()} for ${pName} (Room ${room}) is 3 days overdue. Please pay immediately to avoid penalties.`;
    }

    if (!reminderType) {
      return new Response(
        JSON.stringify({
          message: `No reminders to send today (daysDiff: ${daysDiff})`,
          sent: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check which tenants already got this type of reminder for this month
    const tenantIds = pendingPayments.map((p: any) => p.tenant_id);
    const { data: existingNotifs } = await supabase
      .from("notifications")
      .select("user_id, metadata")
      .in("user_id", tenantIds)
      .eq("type", "reminder")
      .gte("created_at", `${currentMonth}-01T00:00:00Z`);

    const alreadyNotified = new Set(
      (existingNotifs ?? [])
        .filter((n: any) => n.metadata?.reminder_type === reminderType && n.metadata?.month === currentMonth)
        .map((n: any) => `${n.user_id}_${n.metadata?.payment_id}`)
    );

    // Create notifications for tenants who haven't been reminded yet
    const notifications = pendingPayments
      .filter(
        (p: any) => !alreadyNotified.has(`${p.tenant_id}_${p.id}`)
      )
      .map((p: any) => ({
        user_id: p.tenant_id,
        title: titleTemplate,
        message: messageTemplate(
          (p as any).properties?.name || "your PG",
          (p as any).rooms?.room_number || "N/A",
          Number(p.amount)
        ),
        type: "reminder",
        metadata: {
          reminder_type: reminderType,
          payment_id: p.id,
          month: currentMonth,
          amount: p.amount,
          property_id: p.property_id,
        },
      }));

    let sent = 0;
    if (notifications.length > 0) {
      const { error: insertErr } = await supabase
        .from("notifications")
        .insert(notifications);

      if (insertErr) {
        console.error("Error inserting notifications:", insertErr);
        return new Response(
          JSON.stringify({ error: insertErr.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      sent = notifications.length;
    }

    console.log(
      `Rent reminders: type=${reminderType}, sent=${sent}, skipped=${pendingPayments.length - sent}`
    );

    return new Response(
      JSON.stringify({
        message: `Sent ${sent} ${reminderType} reminders`,
        sent,
        type: reminderType,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
