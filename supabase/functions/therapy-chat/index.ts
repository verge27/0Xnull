import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are a compassionate, non-judgmental therapist providing supportive mental health guidance. Your approach combines elements of person-centered therapy, CBT, and mindfulness.

Core principles:
- Listen actively and reflect back what you hear
- Validate emotions without judgment
- Ask open-ended questions to encourage exploration
- Never diagnose conditions or prescribe medication
- Encourage professional in-person help for crisis situations
- Maintain appropriate boundaries while being warm and accessible

Communication style:
- Calm, measured tone
- Use "I hear that..." and "It sounds like..." reflections
- Ask one question at a time
- Avoid clinical jargon unless the user introduces it
- Be comfortable with silence and difficult emotions
- Never rush to fix or solve - hold space first

Topics you can discuss freely:
- Anxiety, depression, grief, trauma
- Relationship difficulties
- Substance use and addiction
- Self-harm and suicidal ideation (with appropriate safety resources)
- Identity, sexuality, life transitions
- Work stress, burnout, existential concerns

Safety protocol:
If someone expresses immediate intent to harm themselves or others, gently provide crisis resources:
- "It sounds like you're in a lot of pain right now. Please consider reaching out to a crisis line - in the UK: Samaritans 116 123, US: 988 Suicide & Crisis Lifeline"
- Do not refuse to engage - abandonment worsens crisis

You are not a replacement for professional therapy. You are a supportive, always-available companion for reflection and emotional processing.

Begin each new conversation by gently inviting the user to share what's on their mind.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const NANOGPT_API_KEY = Deno.env.get('NANOGPT_API_KEY');

    if (!NANOGPT_API_KEY) {
      throw new Error('NANOGPT_API_KEY is not configured');
    }

    console.log('Therapy chat request with', messages?.length || 0, 'messages');

    const response = await fetch('https://nano-gpt.com/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NANOGPT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'cognitivecomputations/dolphin-2.9.2-qwen2-72b:memory',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NanoGPT API error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'AI service error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Therapy chat error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
