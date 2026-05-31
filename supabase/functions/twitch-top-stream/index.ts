import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Twitch game IDs - covers all PandaScore supported games
const GAME_IDS: Record<string, string> = {
  // FPS
  csgo: '32399',
  cs2: '32399',
  valorant: '516575',
  cod: '512710', // Call of Duty: Warzone
  r6siege: '460630',
  ow: '488552', // Overwatch 2
  pubg: '493057',
  // MOBA
  lol: '21779',
  dota2: '29595',
  kog: '513181', // King of Glory / Honor of Kings
  'lol-wild-rift': '511399',
  mlbb: '495931', // Mobile Legends
  // Sports
  fifa: '1745202732', // EA Sports FC 24
  rl: '30921', // Rocket League
  // Strategy
  'starcraft-2': '490422',
  'starcraft-brood-war': '11989',
  sc2: '490422',
  starcraft: '490422',
};

// Priority override channels - if live, these take precedence
const PRIORITY_CHANNELS = ['awfdota'];

// In-memory cache (5 minute TTL)
const cache: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Cached app access token (client credentials flow)
let tokenCache: { token: string; expiresAt: number } | null = null;

async function getAppAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const now = Date.now();

  if (tokenCache) {
    const msLeft = tokenCache.expiresAt - now;
    if (msLeft > 60_000) {
      console.log(`[twitch-auth] reusing cached token (expires in ${Math.round(msLeft / 1000)}s)`);
      return tokenCache.token;
    }
    console.log(`[twitch-auth] cached token expired/near-expiry (msLeft=${msLeft}); refreshing`);
  } else {
    console.log('[twitch-auth] no cached token; fetching new app access token');
  }

  const clientIdFp = `${clientId.slice(0, 4)}…${clientId.slice(-4)} (len=${clientId.length})`;
  const secretFp = `len=${clientSecret.length}`;
  console.log(`[twitch-auth] client_credentials request client_id=${clientIdFp} secret_${secretFp}`);

  const started = Date.now();
  let res: Response;
  try {
    res = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
      }),
    });
  } catch (networkErr) {
    console.error(`[twitch-auth] network error contacting id.twitch.tv after ${Date.now() - started}ms:`, networkErr);
    throw new Error(`Twitch token network error: ${networkErr instanceof Error ? networkErr.message : String(networkErr)}`);
  }

  const elapsed = Date.now() - started;
  const bodyText = await res.text();

  if (!res.ok) {
    console.error(
      `[twitch-auth] token request FAILED status=${res.status} ${res.statusText} elapsed=${elapsed}ms ` +
      `body=${bodyText.slice(0, 500)}`,
    );
    // Common hints
    if (res.status === 400) {
      console.error('[twitch-auth] hint: 400 usually means invalid client_id, missing/invalid client_secret, or wrong grant_type');
    } else if (res.status === 401 || res.status === 403) {
      console.error('[twitch-auth] hint: 401/403 usually means the client_secret is wrong or the app was disabled in the Twitch dev console');
    }
    // Invalidate cache so we don't keep serving a bad token
    tokenCache = null;
    throw new Error(`Failed to fetch Twitch app token: ${res.status} ${bodyText}`);
  }

  let data: { access_token?: string; expires_in?: number; token_type?: string };
  try {
    data = JSON.parse(bodyText);
  } catch {
    console.error(`[twitch-auth] token response was not JSON: ${bodyText.slice(0, 200)}`);
    throw new Error('Twitch token response was not valid JSON');
  }

  if (!data.access_token) {
    console.error(`[twitch-auth] token response missing access_token: ${JSON.stringify(data)}`);
    throw new Error('Twitch token response missing access_token');
  }

  const expiresIn = data.expires_in ?? 3600;
  tokenCache = {
    token: data.access_token,
    expiresAt: now + expiresIn * 1000,
  };
  console.log(
    `[twitch-auth] new token acquired type=${data.token_type ?? 'bearer'} expires_in=${expiresIn}s elapsed=${elapsed}ms`,
  );
  return tokenCache.token;
}



// Helper to check if a specific channel is live
async function checkChannelLive(
  channel: string, 
  clientId: string, 
  oauthToken: string
): Promise<any | null> {
  try {
    const response = await fetch(
      `https://api.twitch.tv/helix/streams?user_login=${channel}&type=live`,
      {
        headers: {
          'Client-ID': clientId,
          'Authorization': `Bearer ${oauthToken}`,
        },
      }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.data && data.data.length > 0) {
      const stream = data.data[0];
      return {
        channel: stream.user_login,
        channelName: stream.user_name,
        title: stream.title,
        viewerCount: stream.viewer_count,
        gameName: stream.game_name,
        thumbnailUrl: stream.thumbnail_url.replace('{width}', '440').replace('{height}', '248'),
        isOverride: true,
      };
    }
    return null;
  } catch (error) {
    console.error(`Error checking channel ${channel}:`, error);
    return null;
  }
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

    const clientId = Deno.env.get('TWITCH_CLIENT_ID');
    const clientSecret = Deno.env.get('TWITCH_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      console.error('Missing Twitch credentials');
      return new Response(JSON.stringify({ error: 'Twitch credentials not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let oauthToken: string;
    try {
      oauthToken = await getAppAccessToken(clientId, clientSecret);
    } catch (e) {
      console.error('Twitch token fetch failed:', e);
      return new Response(JSON.stringify({ error: 'Twitch auth failed', details: String(e) }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check priority override channels first
    const overrideCacheKey = 'priority_override';
    const cachedOverride = cache.get(overrideCacheKey);
    
    if (cachedOverride && Date.now() - cachedOverride.timestamp < CACHE_TTL_MS) {
      if (cachedOverride.data) {
        console.log(`Cache hit: Priority channel ${cachedOverride.data.channel} is live`);
        return new Response(JSON.stringify(cachedOverride.data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      // Check if any priority channel is live
      for (const channel of PRIORITY_CHANNELS) {
        console.log(`Checking priority channel: ${channel}`);
        const liveStream = await checkChannelLive(channel, clientId, oauthToken);
        if (liveStream) {
          console.log(`Priority channel ${channel} is LIVE! Using as override.`);
          cache.set(overrideCacheKey, { data: liveStream, timestamp: Date.now() });
          return new Response(JSON.stringify(liveStream), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
      // Cache that no priority channel is live
      cache.set(overrideCacheKey, { data: null, timestamp: Date.now() });
    }
    
    // Fall back to normal game-based lookup
    const gameId = GAME_IDS[game.toLowerCase()] || GAME_IDS.lol;
    const cacheKey = `stream_${gameId}`;
    
    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      console.log(`Cache hit for game: ${game}`);
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch top stream for the game
    const twitchUrl = `https://api.twitch.tv/helix/streams?game_id=${gameId}&first=1&type=live`;
    console.log(`Fetching Twitch streams for game_id: ${gameId}`);
    
    const response = await fetch(twitchUrl, {
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${oauthToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Twitch API error: ${response.status} - ${errorText}`);
      return new Response(JSON.stringify({ error: 'Twitch API error', details: errorText }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
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
    cache.set(cacheKey, { data: result, timestamp: Date.now() });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in twitch-top-stream:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
