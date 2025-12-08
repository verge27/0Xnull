import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voice_id, tier } = await req.json();

    if (!text || !voice_id || !tier) {
      return new Response(
        JSON.stringify({ error: "text, voice_id, and tier are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      console.error("ELEVENLABS_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "ElevenLabs API not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating TTS: tier=${tier}, voice=${voice_id}, chars=${text.length}`);

    // Map tier to model
    // standard = turbo (faster, cheaper)
    // ultra = multilingual_v2 (highest quality)
    const model_id = tier === "ultra" 
      ? "eleven_multilingual_v2" 
      : "eleven_turbo_v2";

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs TTS error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `TTS generation failed: ${errorText}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate cost
    const charCount = text.length;
    const rate = tier === "ultra" ? 0.25 : 0.15;
    const cost_cents = Math.ceil((charCount / 1000) * rate * 100);

    // Get audio as base64
    const audioBuffer = await response.arrayBuffer();
    const base64Audio = btoa(
      String.fromCharCode(...new Uint8Array(audioBuffer))
    );

    console.log(`TTS generated: ${charCount} chars, cost: ${cost_cents} cents`);

    return new Response(
      JSON.stringify({
        audio_base64: base64Audio,
        cost_cents,
        characters_used: charCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Voice generate error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
