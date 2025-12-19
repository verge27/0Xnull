import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Combat sports channel IDs
const COMBAT_CHANNELS = [
  '677d9adfa9a51b0008497fa0', // UFC
  '5dcddf6f119c4b0009fa1d75', // Fight
  '5e8ed391e738c20007348eb1', // Bellator MMA
  '5e8ef7b5aef2ef0007f952b8', // GLORY Kickboxing
  '5e8ed2eaaef2ef0007f94b11', // PFL MMA
  '5c50c7561cf5c7e3a3b0bd38', // Top Rank Boxing
  '58e55b14ad8e9c364d55f717', // Flicks of Fury
  '5e8eb6e8aef2ef0007f93fb6', // Impact Wrestling
];

interface PlutoTimeline {
  _id: string;
  title: string;
  episode?: {
    name?: string;
    description?: string;
    number?: number;
    series?: {
      name?: string;
    };
  };
  start: string;
  stop: string;
  duration: number;
}

interface PlutoChannel {
  _id: string;
  name: string;
  slug: string;
  logo?: {
    path?: string;
  };
  timelines?: PlutoTimeline[];
}

interface ProgramInfo {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  progress?: number;
}

interface EPGResponse {
  channels: Record<string, {
    name: string;
    currentProgram: ProgramInfo | null;
    nextProgram: { title: string; startTime: string } | null;
    upcomingPrograms: ProgramInfo[];
  }>;
}

// In-memory cache (5 minute TTL)
const cache: { data: EPGResponse | null; timestamp: number } = { data: null, timestamp: 0 };
const CACHE_TTL_MS = 5 * 60 * 1000;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check cache
    if (cache.data && Date.now() - cache.timestamp < CACHE_TTL_MS) {
      console.log('Returning cached EPG data');
      return new Response(JSON.stringify(cache.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch EPG from Pluto TV - get 4 hours of programming
    const now = new Date();
    const start = new Date(now.getTime() - 60 * 60 * 1000).toISOString(); // 1 hour ago
    const stop = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(); // 4 hours from now
    
    const epgUrl = `https://api.pluto.tv/v2/channels?start=${encodeURIComponent(start)}&stop=${encodeURIComponent(stop)}`;
    
    console.log('Fetching Pluto TV EPG:', epgUrl);
    
    const response = await fetch(epgUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.error('Pluto TV API error:', response.status);
      throw new Error(`Pluto TV API returned ${response.status}`);
    }

    const channels: PlutoChannel[] = await response.json();
    console.log(`Received ${channels.length} channels from Pluto TV`);

    // Filter to just combat channels and extract current/next programs
    const result: EPGResponse = { channels: {} };
    const nowMs = now.getTime();

    for (const channelId of COMBAT_CHANNELS) {
      const channel = channels.find(c => c._id === channelId);
      
      if (!channel) {
        console.log(`Channel ${channelId} not found`);
        continue;
      }

      const timelines = channel.timelines || [];
      
      // Find current program
      const currentProgram = timelines.find(t => {
        const start = new Date(t.start).getTime();
        const stop = new Date(t.stop).getTime();
        return nowMs >= start && nowMs < stop;
      });

      // Find all upcoming programs (next 4 hours)
      const upcomingPrograms = timelines
        .filter(t => {
          const start = new Date(t.start).getTime();
          return start > nowMs;
        })
        .slice(0, 6) // Get up to 6 upcoming programs
        .map(t => ({
          title: t.episode?.series?.name || t.title,
          description: t.episode?.name || t.episode?.description,
          startTime: t.start,
          endTime: t.stop,
        }));

      const nextProgram = upcomingPrograms[0] || null;

      let currentInfo = null;
      if (currentProgram) {
        const startTime = new Date(currentProgram.start).getTime();
        const endTime = new Date(currentProgram.stop).getTime();
        const progress = Math.round(((nowMs - startTime) / (endTime - startTime)) * 100);
        
        currentInfo = {
          title: currentProgram.episode?.series?.name || currentProgram.title,
          description: currentProgram.episode?.name || currentProgram.episode?.description,
          startTime: currentProgram.start,
          endTime: currentProgram.stop,
          progress: Math.min(100, Math.max(0, progress)),
        };
      }

      result.channels[channelId] = {
        name: channel.name,
        currentProgram: currentInfo,
        nextProgram: nextProgram ? { title: nextProgram.title, startTime: nextProgram.startTime } : null,
        upcomingPrograms,
      };
    }

    // Cache the result
    cache.data = result;
    cache.timestamp = Date.now();

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching Pluto EPG:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message, channels: {} }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
