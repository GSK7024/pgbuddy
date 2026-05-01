import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const receiptId = url.searchParams.get("id");

    if (!receiptId) {
      return new Response(
        JSON.stringify({ error: "Receipt ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // First, fetch the basic payment data
    const { data, error } = await supabase
      .from("rent_payments")
      .select("id, amount, month, payment_date, status, payment_method, transaction_id, tenant_name, tenant_id, property_id, room_id")
      .eq("id", receiptId)
      .single();

    if (error) {
      console.error("DB Error:", JSON.stringify(error));
      return new Response(
        JSON.stringify({ error: "Receipt not found", detail: error.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!data) {
      return new Response(
        JSON.stringify({ error: "Receipt not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch related data separately to avoid join issues
    let propertyName = null;
    let roomNumber = null;
    let tenantFullName = data.tenant_name || null;

    if (data.property_id) {
      const { data: prop } = await supabase.from("properties").select("name").eq("id", data.property_id).single();
      propertyName = prop?.name || null;
    }

    if (data.room_id) {
      const { data: room } = await supabase.from("rooms").select("room_number").eq("id", data.room_id).single();
      roomNumber = room?.room_number || null;
    }

    if (data.tenant_id && !tenantFullName) {
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", data.tenant_id).single();
      tenantFullName = profile?.full_name || null;
    }

    const receipt = {
      id: data.id,
      amount: data.amount,
      month: data.month,
      payment_date: data.payment_date,
      status: data.status,
      payment_method: data.payment_method,
      transaction_id: data.transaction_id,
      properties: propertyName ? { name: propertyName } : null,
      rooms: roomNumber ? { room_number: roomNumber } : null,
      profiles: tenantFullName ? { full_name: tenantFullName } : null,
    };

    return new Response(
      JSON.stringify({ receipt }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
