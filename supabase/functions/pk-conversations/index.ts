import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to derive public key from private key using SHA-256
async function derivePublicKey(privateKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(privateKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, privateKey, timestamp, conversationId, content } = await req.json();
    
    if (!privateKey || !action) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify timestamp is recent (within 5 minutes)
    if (!timestamp || Math.abs(Date.now() - timestamp) > 5 * 60 * 1000) {
      return new Response(JSON.stringify({ error: 'Request expired' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Derive public key from private key (proof of ownership)
    const encoder = new TextEncoder();
    const data = encoder.encode(privateKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const publicKey = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get PK user from public key
    const { data: pkUser, error: userError } = await supabase
      .from('private_key_users')
      .select('id, display_name')
      .eq('public_key', publicKey)
      .maybeSingle();

    if (userError || !pkUser) {
      console.log(`[pk-conversations] User not found for key ${publicKey.slice(0, 8)}...`);
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[pk-conversations] Authenticated user ${pkUser.id} for action ${action}`);

    // Handle different actions
    switch (action) {
      case 'list': {
        // Get conversation IDs where this PK user is a participant
        const { data: participantData, error: partError } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('private_key_user_id', pkUser.id);

        if (partError) throw partError;
        if (!participantData || participantData.length === 0) {
          return new Response(JSON.stringify({ conversations: [] }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const conversationIds = participantData.map(p => p.conversation_id);

        // Fetch conversations
        const { data: convData, error: convError } = await supabase
          .from('conversations')
          .select('id, listing_id, created_at, updated_at, listings(id, title, images)')
          .in('id', conversationIds)
          .order('updated_at', { ascending: false });

        if (convError) throw convError;

        // Fetch all participants
        const { data: allParticipants, error: allPartError } = await supabase
          .from('conversation_participants')
          .select('conversation_id, user_id, private_key_user_id')
          .in('conversation_id', conversationIds);

        if (allPartError) throw allPartError;

        // Fetch profiles and pk users
        const userIds = (allParticipants || []).filter(p => p.user_id).map(p => p.user_id!);
        const pkUserIds = (allParticipants || []).filter(p => p.private_key_user_id).map(p => p.private_key_user_id!);

        const { data: profilesData } = userIds.length > 0
          ? await supabase.from('public_profiles').select('id, display_name').in('id', userIds)
          : { data: [] };

        const { data: pkUsersData } = pkUserIds.length > 0
          ? await supabase.from('public_private_key_users').select('id, display_name').in('id', pkUserIds)
          : { data: [] };

        // Fetch last message for each conversation
        const { data: lastMessages } = await supabase
          .from('messages')
          .select('conversation_id, content, created_at')
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: false });

        // Count unread messages
        const { data: unreadCounts } = await supabase
          .from('messages')
          .select('conversation_id, id')
          .in('conversation_id', conversationIds)
          .is('read_at', null)
          .neq('sender_private_key_user_id', pkUser.id);

        // Combine data
        const conversations = (convData || []).map(conv => {
          const participants = (allParticipants || [])
            .filter(p => p.conversation_id === conv.id)
            .map(p => ({
              user_id: p.user_id,
              private_key_user_id: p.private_key_user_id,
              profile: (profilesData || []).find(pr => pr.id === p.user_id) || null,
              pk_user: (pkUsersData || []).find(pk => pk.id === p.private_key_user_id) || null,
            }));

          const lastMsg = (lastMessages || []).find(m => m.conversation_id === conv.id);
          const unreadCount = (unreadCounts || []).filter(m => m.conversation_id === conv.id).length;

          return {
            id: conv.id,
            listing_id: conv.listing_id,
            created_at: conv.created_at,
            updated_at: conv.updated_at,
            listing: conv.listings,
            participants,
            last_message: lastMsg ? { content: lastMsg.content, created_at: lastMsg.created_at } : undefined,
            unread_count: unreadCount,
          };
        });

        return new Response(JSON.stringify({ conversations }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'getMessages': {
        if (!conversationId) {
          return new Response(JSON.stringify({ error: 'Conversation ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Verify user is a participant
        const { data: isParticipant } = await supabase
          .from('conversation_participants')
          .select('id')
          .eq('conversation_id', conversationId)
          .eq('private_key_user_id', pkUser.id)
          .maybeSingle();

        if (!isParticipant) {
          return new Response(JSON.stringify({ error: 'Not a participant' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Fetch messages
        const { data: messages, error: msgError } = await supabase
          .from('messages')
          .select('id, conversation_id, sender_user_id, sender_private_key_user_id, content, read_at, created_at')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (msgError) throw msgError;

        // Fetch sender info
        const senderUserIds = (messages || []).filter(m => m.sender_user_id).map(m => m.sender_user_id!);
        const senderPkIds = (messages || []).filter(m => m.sender_private_key_user_id).map(m => m.sender_private_key_user_id!);

        const { data: senderProfiles } = senderUserIds.length > 0
          ? await supabase.from('public_profiles').select('id, display_name').in('id', senderUserIds)
          : { data: [] };

        const { data: senderPkUsers } = senderPkIds.length > 0
          ? await supabase.from('public_private_key_users').select('id, display_name').in('id', senderPkIds)
          : { data: [] };

        const enrichedMessages = (messages || []).map(msg => ({
          ...msg,
          sender_profile: (senderProfiles || []).find(p => p.id === msg.sender_user_id) || null,
          sender_pk_user: (senderPkUsers || []).find(pk => pk.id === msg.sender_private_key_user_id) || null,
        }));

        // Mark messages as read
        await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .eq('conversation_id', conversationId)
          .neq('sender_private_key_user_id', pkUser.id)
          .is('read_at', null);

        // Get participants for recipient info
        const { data: participants } = await supabase
          .from('conversation_participants')
          .select('user_id, private_key_user_id')
          .eq('conversation_id', conversationId);

        return new Response(JSON.stringify({ messages: enrichedMessages, participants }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'sendMessage': {
        if (!conversationId || !content) {
          return new Response(JSON.stringify({ error: 'Conversation ID and content required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Verify user is a participant
        const { data: isParticipant } = await supabase
          .from('conversation_participants')
          .select('id')
          .eq('conversation_id', conversationId)
          .eq('private_key_user_id', pkUser.id)
          .maybeSingle();

        if (!isParticipant) {
          return new Response(JSON.stringify({ error: 'Not a participant' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Insert message
        const { data: newMessage, error: insertError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_private_key_user_id: pkUser.id,
            content: content.trim(),
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Update conversation timestamp
        await supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId);

        return new Response(JSON.stringify({ message: newMessage }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('[pk-conversations] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
