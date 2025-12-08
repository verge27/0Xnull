import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Preset voices from ElevenLabs
const presetVoices = [
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", description: "Soft and gentle" },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", description: "Warm and friendly" },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie", description: "Clear and professional" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", description: "Calm and authoritative" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam", description: "Deep and confident" },
  { id: "XB0fDUnXU5powFXDhCwa", name: "Charlotte", description: "Bright and energetic" },
];

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const includeCustom = url.searchParams.get("include_custom") === "true";

    let customVoices: Array<{ id: string; name: string; description: string; is_custom: boolean }> = [];

    // If requested, fetch user's custom voices from ElevenLabs
    if (includeCustom) {
      const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
      if (ELEVENLABS_API_KEY) {
        try {
          const response = await fetch("https://api.elevenlabs.io/v1/voices", {
            headers: { "xi-api-key": ELEVENLABS_API_KEY },
          });

          if (response.ok) {
            const data = await response.json();
            // Filter to only cloned voices (not preset/premade)
            customVoices = data.voices
              .filter((v: any) => v.category === "cloned")
              .map((v: any) => ({
                id: v.voice_id,
                name: v.name,
                description: "Custom cloned voice",
                is_custom: true,
              }));
            console.log(`Found ${customVoices.length} custom voices`);
          }
        } catch (error) {
          console.error("Error fetching custom voices:", error);
        }
      }
    }

    const allVoices = [
      ...customVoices,
      ...presetVoices.map(v => ({ ...v, is_custom: false })),
    ];

    return new Response(
      JSON.stringify({ voices: allVoices }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Voice voices error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
