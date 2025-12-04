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
    const { comment } = await req.json();
    
    if (!comment || typeof comment !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid comment' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const NANO_GPT_API_KEY = Deno.env.get('NANO_GPT_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    const systemPrompt = `You are a content moderation AI for 0xNull Marketplace, a Monero/XMR marketplace platform. 
This marketplace integrates listings from XMRBazaar and features categories including Services, Electronics, Digital Goods, Accessories, Physical Goods, Food & Local, and Sports & Outdoor.

Analyze comments for:
- Spam or advertising
- Offensive language or harassment
- Misinformation about cryptocurrency/Monero/XMRBazaar
- Scam attempts or phishing
- Off-topic content unrelated to the marketplace, Monero, or privacy

Respond with JSON:
{
  "approved": boolean,
  "reason": "brief explanation if not approved",
  "severity": "low" | "medium" | "high",
  "suggestions": "optional suggestions for improvement"
}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Moderate this comment: "${comment}"` }
    ];

    let response;
    let usedNanoGPT = false;

    // Try Nano GPT first
    if (NANO_GPT_API_KEY) {
      try {
        console.log('Attempting Nano GPT moderation...');
        const nanoResponse = await fetch('https://nano-gpt.com/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${NANO_GPT_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages,
            temperature: 0.3,
          }),
        });

        if (nanoResponse.ok) {
          response = nanoResponse;
          usedNanoGPT = true;
          console.log('Nano GPT moderation successful');
        } else {
          console.log(`Nano GPT failed with status ${nanoResponse.status}, falling back to Lovable AI`);
        }
      } catch (error) {
        console.log('Nano GPT error, falling back to Lovable AI:', error);
      }
    }

    // Fallback to Lovable AI
    if (!usedNanoGPT) {
      if (!LOVABLE_API_KEY) {
        throw new Error('No AI service available');
      }
      console.log('Using Lovable AI for moderation...');
      const lovableResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/gpt-5-nano',
          messages,
          temperature: 0.3,
        }),
      });

      response = lovableResponse;

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: 'AI credits exhausted. Please contact support.' }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        throw new Error(`AI Gateway error: ${response.status}`);
      }
    }

    if (!response) {
      throw new Error('No AI response received');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    let moderation;
    try {
      moderation = JSON.parse(content);
    } catch (e) {
      // Fallback if AI doesn't return valid JSON
      moderation = {
        approved: true,
        reason: '',
        severity: 'low',
        suggestions: ''
      };
    }

    return new Response(
      JSON.stringify(moderation),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Moderation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});