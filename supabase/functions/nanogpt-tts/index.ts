import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voice } = await req.json();
    const NANOGPT_API_KEY = Deno.env.get('NANOGPT_API_KEY');

    if (!NANOGPT_API_KEY) {
      throw new Error('NANOGPT_API_KEY is not configured');
    }

    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limit text length to prevent abuse
    if (text.length > 5000) {
      return new Response(
        JSON.stringify({ error: 'Text exceeds maximum length of 5000 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`TTS request: ${text.length} chars, voice: ${voice || 'default'}`);

    // Proxy to NanoGPT TTS endpoint
    const response = await fetch('https://nano-gpt.com/api/tts', {
      method: 'POST',
      headers: {
        'x-api-key': NANOGPT_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model: 'Kokoro-82m',
        voice: voice || 'af_bella',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NanoGPT TTS error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'TTS credits exhausted.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'TTS generation failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Stream the audio response back to client
    const audioData = await response.arrayBuffer();
    
    console.log(`TTS success: ${audioData.byteLength} bytes generated`);

    return new Response(audioData, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioData.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('TTS proxy error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
