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

    const INTERAKT_API_KEY = Deno.env.get("INTERAKT_API_KEY") || "Z25CdHpKQ0xpcU9wZVE3SlNpLXNLdU0zczFYUUJWYXNOa1NXTzJER01ENDo=";
    if (!INTERAKT_API_KEY) {
      throw new Error("Missing INTERAKT_API_KEY");
    }

    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    console.log(`Final Formatted Phone for Interakt: +91 ${cleanPhone}`);

    const interaktUrl = "https://api.interakt.ai/v1/public/message/";
    const templateName = "announcement"; 

    const interaktPayload = {
      countryCode: "+91",
      phoneNumber: cleanPhone,
      callbackData: "otp_login",
      type: "Template",
      template: {
        name: templateName,
        languageCode: "en",
        bodyValues: [
          "Login Security", 
          `Your PG Buddy login code is: ${otp}. Please do not share this with anyone.`, 
          "PG Buddy App"
        ],
      }
    };

    const response = await fetch(interaktUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Basic ${INTERAKT_API_KEY}`
      },
      body: JSON.stringify(interaktPayload),
    });

    const respText = await response.text();
    console.log(`Interakt Response (Status ${response.status}):`, respText);

    if (!response.ok) {
        console.error("Interakt API rejected the message:", respText);
        return new Response(
          JSON.stringify({ error: "Interakt Error", detail: respText }), 
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
    
    console.log("Interakt message sent successfully!");
    
    return new Response(JSON.stringify({ success: true, interakt: respText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("SMS Edge error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
