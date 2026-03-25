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
    // Normalize today to start of day in UTC for consistent diffs
    const todayNum = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())).getTime();
    
    // Current month string (e.g., "2026-03")
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    const [year, month] = currentMonth.split("-").map(Number);

    // ========================================================================
    // PRE-FETCH RENT TENANT ASSIGNMENTS FOR ROLLING DUE DATES
    // ========================================================================
    const { data: assignments } = await supabase
      .from("tenant_assignments")
      .select("property_id, room_id, tenant_email, tenant_phone, move_in_date")
      .eq("is_active", true);

    const moveInDays: Record<string, number> = {};
    for (const a of assignments || []) {
      const day = new Date(a.move_in_date).getDate();
      if (a.property_id && a.room_id) {
        moveInDays[`${a.property_id}_${a.room_id}`] = day;
      }
      if (a.tenant_email) moveInDays[`email_${a.tenant_email}`] = day;
      if (a.tenant_phone) moveInDays[`phone_${a.tenant_phone}`] = day;
    }

    // ========================================================================
    // RENT REMINDERS
    // ========================================================================
    const { data: pendingPayments, error: payErr } = await supabase
      .from("rent_payments")
      .select(`
        id, tenant_id, tenant_email, tenant_phone, amount, month, status, property_id, room_id, 
        properties:property_id(name), rooms:room_id(room_number)
      `)
      .eq("status", "pending")
      .eq("month", currentMonth);

    if (payErr) console.error("Error fetching payments:", payErr);

    const rentPayloads: any[] = [];
    if (pendingPayments && pendingPayments.length > 0) {
      for (const p of pendingPayments) {
        let dueDay = 1;
        const rKey = `${p.property_id}_${p.room_id}`;
        
        // Match user's specific move-in date
        if (moveInDays[rKey]) dueDay = moveInDays[rKey];
        else if (p.tenant_email && moveInDays[`email_${p.tenant_email}`]) dueDay = moveInDays[`email_${p.tenant_email}`];
        else if (p.tenant_phone && moveInDays[`phone_${p.tenant_phone}`]) dueDay = moveInDays[`phone_${p.tenant_phone}`];

        // Format day suffix like 1st, 2nd, 3rd
        const ord = ["st","nd","rd"][((dueDay+90)%100-10)%10-1] || "th";
        const dueDate = new Date(Date.UTC(year, month - 1, dueDay));
        const daysDiff = Math.floor((todayNum - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        let reminderType: string | null = null;
        let titleTemplate = "";
        let messageTemplate: (pName: string, room: string, amt: number) => string;

        if (daysDiff === -3) {
          reminderType = "upcoming";
          titleTemplate = "🔔 Rent Due in 3 Days";
          messageTemplate = (pName, room, amt) =>
            `Your rent of ₹${amt.toLocaleString()} for ${pName} (Room ${room}) is due on the ${dueDay}${ord}. Please pay on time to avoid late fees.`;
        } else if (daysDiff === 0) {
          reminderType = "due_today";
          titleTemplate = "⚠️ Rent Due Today";
          messageTemplate = (pName, room, amt) =>
            `Your rent of ₹${amt.toLocaleString()} for ${pName} (Room ${room}) is due today (${dueDay}${ord}). Please make the payment at your earliest convenience.`;
        } else if (daysDiff === 3) {
          reminderType = "overdue";
          titleTemplate = "🚨 Rent Overdue";
          messageTemplate = (pName, room, amt) =>
            `Your rent of ₹${amt.toLocaleString()} for ${pName} (Room ${room}) is 3 days overdue. Please pay immediately to avoid penalties.`;
        }

        if (reminderType) {
           rentPayloads.push({ ...p, reminderType, titleTemplate, messageTemplate });
        }
      }
    }

    let sent = 0;
    if (rentPayloads.length > 0) {
      // Check which tenants already got this type of reminder for this month
      const tenantIds = rentPayloads.map(p => p.tenant_id).filter(Boolean);
      const { data: existingNotifs } = await supabase
        .from("notifications")
        .select("user_id, metadata")
        .eq("type", "reminder")
        .gte("created_at", `${currentMonth}-01T00:00:00Z`);

      const alreadyNotified = new Set(
        (existingNotifs ?? []).map((n: any) => `${n.metadata?.reminder_type}_${n.metadata?.payment_id}`)
      );

      const validRentPayloads = rentPayloads.filter((p: any) => !alreadyNotified.has(`${p.reminderType}_${p.id}`));
      
      const notifications = validRentPayloads.map((p: any) => ({
        user_id: p.tenant_id,
        title: p.titleTemplate,
        message: p.messageTemplate(
          p.properties?.name || "your PG",
          p.rooms?.room_number || "N/A",
          Number(p.amount)
        ),
        type: "reminder",
        metadata: {
          reminder_type: p.reminderType,
          payment_id: p.id,
          month: currentMonth,
          amount: p.amount,
          property_id: p.property_id,
          tenant_email: p.tenant_email,
        },
      }));

      if (notifications.length > 0) {
        const { error: insertErr } = await supabase.from("notifications").insert(notifications);
        if (insertErr) console.error("Error inserting notifications:", insertErr);
        else {
          sent = notifications.length;
          // Send WhatsApp via twilio-notifications
          try {
            const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
            const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
            
            for (const p of validRentPayloads) {
              const phoneNumber = p.tenant_phone;
              if (phoneNumber || p.tenant_id) {
                await fetch(`${supabaseUrl}/functions/v1/twilio-notifications`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${serviceRoleKey}`,
                  },
                  body: JSON.stringify({
                    action: "send-rent-reminder",
                    tenant_ids: p.tenant_id ? [p.tenant_id] : [],
                    tenant_phone: phoneNumber,
                    property_name: p.properties?.name ?? "your PG",
                    room_number: p.rooms?.room_number ?? "N/A",
                    amount: p.amount,
                    month: currentMonth,
                  }),
                });
              }
            }
            console.log(`Dispatched ${sent} WhatsApp rent reminders`);
          } catch (waErr: any) {
            console.error("WhatsApp dispatch error (non-fatal):", waErr.message);
          }
        }
      }
    }

    // ========================================================================
    // MESS REMINDERS (Daily checks, rolling cycle based on start_date)
    // ========================================================================
    let messSent = 0;
    try {
      const { data: pendingMess, error: messErr } = await supabase
        .from("mess_payments")
        .select(`
          id, member_id, month, final_amount, status,
          mess_members!inner ( full_name, phone, start_date, status, mess_plans ( name ) )
        `)
        .eq("status", "pending")
        .eq("month", currentMonth)
        .eq("mess_members.status", "active");

      if (messErr) {
        console.error("Error fetching mess payments:", messErr);
      } else if (pendingMess && pendingMess.length > 0) {
        
        const messPayloads = [];
        for (const p of pendingMess) {
          const startDay = p.mess_members?.start_date ? new Date(p.mess_members.start_date).getDate() : 1;
          const ord = ["st","nd","rd"][((startDay+90)%100-10)%10-1] || "th";
          const dueDate = new Date(Date.UTC(year, month - 1, startDay));
          const daysDiff = Math.floor((todayNum - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          
          let reminderType = null;
          if (daysDiff === -3) reminderType = "upcoming";
          else if (daysDiff === 0) reminderType = "due_today";
          else if (daysDiff === 3) reminderType = "overdue";
          
          if (reminderType) {
             messPayloads.push({ ...p, reminderType, startDay, ord });
          }
        }

        if (messPayloads.length > 0) {
          const { data: existingMessNotifs } = await supabase
            .from("notifications")
            .select("metadata")
            .eq("type", "reminder")
            .gte("created_at", `${currentMonth}-01T00:00:00Z`);

          const alreadyNotifiedMess = new Set(
            (existingMessNotifs ?? []).map((n: any) => `${n.metadata?.reminder_type}_${n.metadata?.mess_payment_id}`)
          );

          const validMessPayloads = messPayloads.filter((p: any) => !alreadyNotifiedMess.has(`${p.reminderType}_${p.id}`));

          const messNotifications = validMessPayloads.map((p: any) => ({
              user_id: null, 
              title: `Mess Fee ${p.reminderType === "upcoming" ? "Due Soon" : p.reminderType === "overdue" ? "Overdue" : "Due Today"}`,
              message: `Your mess fee of ₹${p.final_amount?.toLocaleString() || 0} for ${p.mess_members?.mess_plans?.name || "Mess"} is due on the ${p.startDay}${p.ord}.`,
              type: "reminder",
              metadata: {
                reminder_type: p.reminderType,
                mess_payment_id: p.id,
                month: currentMonth,
                amount: p.final_amount,
              },
            }));

          if (messNotifications.length > 0) {
            const { error: messInsErr } = await supabase.from("notifications").insert(messNotifications);
            if (!messInsErr) {
              messSent = messNotifications.length;
              const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
              const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
              
              for (const p of validMessPayloads) {
                if (p.mess_members?.phone) {
                  await fetch(`${supabaseUrl}/functions/v1/twilio-notifications`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${serviceRoleKey}`,
                    },
                    body: JSON.stringify({
                      action: "send-mess-reminder",
                      member_phone: p.mess_members.phone,
                      member_name: p.mess_members.full_name || "Member",
                      amount: p.final_amount,
                      month: currentMonth,
                      mess_name: p.mess_members.mess_plans?.name || "Your PG Mess",
                    }),
                  });
                }
              }
              console.log(`Dispatched ${messSent} WhatsApp mess reminders`);
            }
          }
        }
      }
    } catch (e) {
      console.error("Mess reminders error:", e);
    }

    return new Response(
      JSON.stringify({
        message: `Cron executed. Dispatched ${sent} rent reminders & ${messSent} mess reminders.`,
        rent_sent: sent,
        mess_sent: messSent,
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
