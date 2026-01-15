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
    const oauthToken = Deno.env.get('TWITCH_OAUTH_TOKEN');

    if (!clientId || !oauthToken) {
      console.error('Missing Twitch credentials');
      return new Response(JSON.stringify({ error: 'Twitch credentials not configured' }), {
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
