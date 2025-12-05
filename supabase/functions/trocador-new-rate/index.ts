import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TROCADOR_API_KEY = Deno.env.get('TROCADOR_API_KEY');
const API_BASE = "https://api.trocador.app";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting: 30 requests per minute per IP
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60 * 1000;
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const checkRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
};

const getClientIP = (req: Request): string => {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         req.headers.get('x-real-ip') || 
         'unknown';
};

// Input validation helpers
const isValidTicker = (value: unknown): value is string => 
  typeof value === 'string' && value.length >= 1 && value.length <= 20 && /^[a-zA-Z0-9]+$/.test(value);

const isValidNetwork = (value: unknown): value is string => 
  typeof value === 'string' && value.length >= 1 && value.length <= 50 && /^[a-zA-Z0-9_-]+$/.test(value);

const isValidAmount = (value: unknown): boolean => {
  if (typeof value === 'number') return value > 0 && value < 100000000;
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return !isNaN(num) && num > 0 && num < 100000000;
  }
  return false;
};

const isValidKycRating = (value: unknown): boolean => 
  value === undefined || value === null || 
  (typeof value === 'string' && ['A', 'B', 'C', 'D'].includes(value.toUpperCase()));

// Log API call to database
const logApiCall = async (
  functionName: string,
  endpoint: string,
  method: string,
  statusCode: number | null,
  responseTimeMs: number,
  errorMessage: string | null
) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    await supabase.from('api_call_logs').insert({
      function_name: functionName,
      endpoint,
      method,
      status_code: statusCode,
      response_time_ms: responseTimeMs,
      error_message: errorMessage,
    });
  } catch (err) {
    console.error('Failed to log API call:', err);
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting check
  const clientIP = getClientIP(req);
  if (!checkRateLimit(clientIP)) {
    console.warn(`Rate limit exceeded for IP: ${clientIP}`);
    return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' },
    });
  }

  const startTime = Date.now();
  let statusCode: number | null = null;
  let errorMessage: string | null = null;

  try {
    const { ticker_from, network_from, ticker_to, network_to, amount_from, min_kycrating } = await req.json();

    // Validate required parameters
    if (!ticker_from || !network_from || !ticker_to || !network_to || !amount_from) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate input formats
    if (!isValidTicker(ticker_from)) {
      return new Response(JSON.stringify({ error: 'Invalid ticker_from format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!isValidTicker(ticker_to)) {
      return new Response(JSON.stringify({ error: 'Invalid ticker_to format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!isValidNetwork(network_from)) {
      return new Response(JSON.stringify({ error: 'Invalid network_from format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!isValidNetwork(network_to)) {
      return new Response(JSON.stringify({ error: 'Invalid network_to format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!isValidAmount(amount_from)) {
      return new Response(JSON.stringify({ error: 'Invalid amount_from: must be a positive number less than 100,000,000' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!isValidKycRating(min_kycrating)) {
      return new Response(JSON.stringify({ error: 'Invalid min_kycrating: must be A, B, C, or D' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const params = new URLSearchParams({
      ticker_from,
      network_from,
      ticker_to,
      network_to,
      amount_from: amount_from.toString(),
    });

    if (min_kycrating) params.append('min_kycrating', min_kycrating);

    console.log('Fetching rate from Trocador:', params.toString());

    const response = await fetch(`${API_BASE}/new_rate?${params}`, {
      headers: { "API-Key": TROCADOR_API_KEY! },
    });

    statusCode = response.status;

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Trocador API error:', response.status, errorText);
      errorMessage = `Trocador API returned ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Rate response received');

    // Log successful API call
    await logApiCall('trocador-new-rate', '/new_rate', 'GET', statusCode, Date.now() - startTime, null);
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Log failed API call
    await logApiCall('trocador-new-rate', '/new_rate', 'GET', statusCode, Date.now() - startTime, errorMessage);
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
