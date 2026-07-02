import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface MarketRequestPayload {
  title: string;
  description: string;
  oracle: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, description, oracle }: MarketRequestPayload = await req.json();

    // Validate required fields
    if (!title || !description || !oracle) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: title, description and oracle are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // HTML-escape user-supplied fields before interpolating into the email
    const esc = (v: string) => String(v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
    const safeTitle = esc(title);
    const safeDescription = esc(description);
    const safeOracle = esc(oracle);

    console.log("Sending market request email (title only):", safeTitle.slice(0, 80));

    const emailResponse = await resend.emails.send({
      from: "0xNull Markets <onboarding@resend.dev>",
      to: ["admin@0xnull.io"],
      subject: `[Market Request] ${safeTitle.slice(0, 120)}`,
      html: `
        <h1>New Market Request</h1>
        <h2>Market Title</h2>
        <p>${safeTitle}</p>
        
        <h2>Description</h2>
        <p>${safeDescription}</p>
        
        <h2>Oracle / Resolution Criteria</h2>
        <p>${safeOracle}</p>
        
        <hr />
        <p style="color: #666; font-size: 12px;">
          Submitted via 0xNull Governance Predictions
        </p>
      `,
    });

    console.log("Market request email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, id: emailResponse.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error sending market request email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
