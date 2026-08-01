import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { z } from "npm:zod@3.23.8";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BodySchema = z.object({
  name: z.string().trim().min(2).max(100),
  url: z.string().trim().url().max(500),
  onionAddress: z.string().trim().max(120).optional().or(z.literal("")),
  category: z.string().trim().min(2).max(60),
  description: z.string().trim().min(10).max(1000),
  reason: z.string().trim().max(1000).optional().or(z.literal("")),
});

const esc = (v: string) =>
  String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const { name, url, onionAddress, category, description, reason } = parsed.data;

    const emailResponse = await resend.emails.send({
      from: "0xNull Links <onboarding@resend.dev>",
      to: ["admin@0xnull.io"],
      subject: `[Link Submission] ${esc(name).slice(0, 120)}`,
      html: `
        <h1>New External Link Submission</h1>
        <h2>Name</h2><p>${esc(name)}</p>
        <h2>URL</h2><p>${esc(url)}</p>
        ${onionAddress ? `<h2>Onion Address</h2><p>${esc(onionAddress)}</p>` : ""}
        <h2>Category</h2><p>${esc(category)}</p>
        <h2>Description</h2><p>${esc(description)}</p>
        ${reason ? `<h2>Why it belongs</h2><p>${esc(reason)}</p>` : ""}
        <hr />
        <p style="color:#666;font-size:12px;">Submitted via 0xNull External Links</p>
      `,
    });

    return new Response(JSON.stringify({ success: true, id: emailResponse.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error sending link suggestion:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
