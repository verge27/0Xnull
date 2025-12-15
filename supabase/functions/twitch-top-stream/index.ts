import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Twitch game IDs
const GAME_IDS: Record<string, string> = {
  csgo: '32399',
  cs2: '32399',
  lol: '21779',
  dota2: '29595',
  valorant: '516575',
  rl: '30921',
  ow: '488552', // Overwatch 2
  cod: '512710', // Call of Duty: Warzone
  r6siege: '460630',
};

// In-memory cache for streams (5 minute TTL)
const streamCache: Map<string, { data: any; timestamp: number }> = new Map();
const STREAM_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Token cache (tokens last ~60 days, but we'll refresh more often)
let tokenCache: { token: string; expiresAt: number } | null = null;

async function getAccessToken(clientId: string, clientSecret: string): Promise<string> {
  // Check if we have a valid cached token
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    console.log('Using cached access token');
    return tokenCache.token;
  }

  console.log('Fetching new access token from Twitch');
  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Failed to get access token: ${response.status} - ${errorText}`);
    throw new Error(`Failed to get access token: ${response.status}`);
  }

  const data = await response.json();
  console.log('Successfully obtained new access token');
  
  // Cache the token (expires_in is in seconds, subtract 5 minutes for safety)
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000,
  };

  return data.access_token;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Support both GET query params and POST body
    let game = 'lol';
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      game = body.game || 'lol';
    } else {
      const url = new URL(req.url);
      game = url.searchParams.get('game') || 'lol';
    }
    
    const gameId = GAME_IDS[game.toLowerCase()] || GAME_IDS.lol;
    const cacheKey = `stream_${gameId}`;
    
    // Check stream cache
    const cached = streamCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < STREAM_CACHE_TTL_MS) {
      console.log(`Cache hit for game: ${game}`);
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const clientId = Deno.env.get('TWITCH_CLIENT_ID');
    const clientSecret = Deno.env.get('TWITCH_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      console.error('Missing Twitch credentials');
      return new Response(JSON.stringify({ error: 'Twitch credentials not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get access token using client credentials flow
    const accessToken = await getAccessToken(clientId, clientSecret);

    // Fetch top stream for the game
    const twitchUrl = `https://api.twitch.tv/helix/streams?game_id=${gameId}&first=1&type=live`;
    console.log(`Fetching Twitch streams for game_id: ${gameId}`);
    
    const response = await fetch(twitchUrl, {
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Twitch API error: ${response.status} - ${errorText}`);
      
      // If token is invalid, clear cache and retry once
      if (response.status === 401) {
        console.log('Token invalid, clearing cache and retrying');
        tokenCache = null;
        const newToken = await getAccessToken(clientId, clientSecret);
        
        const retryResponse = await fetch(twitchUrl, {
          headers: {
            'Client-ID': clientId,
            'Authorization': `Bearer ${newToken}`,
          },
        });
        
        if (!retryResponse.ok) {
          const retryError = await retryResponse.text();
          console.error(`Retry failed: ${retryResponse.status} - ${retryError}`);
          return new Response(JSON.stringify({ error: 'Twitch API error after retry', details: retryError }), {
            status: retryResponse.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        const retryData = await retryResponse.json();
        return processStreamData(retryData, cacheKey);
      }
      
      return new Response(JSON.stringify({ error: 'Twitch API error', details: errorText }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    return processStreamData(data, cacheKey);
  } catch (error) {
    console.error('Error in twitch-top-stream:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function processStreamData(data: any, cacheKey: string): Response {
  console.log(`Twitch response: ${JSON.stringify(data)}`);
  
  let result;
  if (data.data && data.data.length > 0) {
    const stream = data.data[0];
    result = {
      channel: stream.user_login,
      channelName: stream.user_name,
      title: stream.title,
      viewerCount: stream.viewer_count,
      gameName: stream.game_name,
      thumbnailUrl: stream.thumbnail_url.replace('{width}', '440').replace('{height}', '248'),
    };
  } else {
    result = { channel: null };
  }

  // Cache the result
  streamCache.set(cacheKey, { data: result, timestamp: Date.now() });

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
