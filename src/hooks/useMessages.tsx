import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { usePrivateKeyAuth } from './usePrivateKeyAuth';
import { usePGP } from './usePGP';

export interface Conversation {
  id: string;
  listing_id: string | null;
  created_at: string;
  updated_at: string;
  listing?: {
    id: string;
    title: string;
    images: string[] | null;
  };
  participants: {
    user_id: string | null;
    private_key_user_id: string | null;
    profile?: { display_name: string } | null;
    pk_user?: { display_name: string } | null;
  }[];
  last_message?: {
    content: string;
    created_at: string;
  };
  unread_count: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_user_id: string | null;
  sender_private_key_user_id: string | null;
  content: string;
  read_at: string | null;
  created_at: string;
  sender_profile?: { display_name: string } | null;
  sender_pk_user?: { display_name: string } | null;
}

export function useMessages() {
  const { user } = useAuth();
  const { privateKeyUser } = usePrivateKeyAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user || !!privateKeyUser;

  const fetchConversations = useCallback(async () => {
    if (!user && !privateKeyUser) {
      setConversations([]);
      setLoading(false);
      return;
    }

    try {
      // First get conversation IDs where user is a participant
      let participantQuery = supabase
        .from('conversation_participants')
        .select('conversation_id');

      if (user) {
        participantQuery = participantQuery.eq('user_id', user.id);
      }

      const { data: participantData, error: participantError } = await participantQuery;
      
      if (participantError) throw participantError;
      if (!participantData || participantData.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const conversationIds = participantData.map(p => p.conversation_id);

      // Fetch conversations with related data
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select(`
          id,
          listing_id,
          created_at,
          updated_at,
          listings(id, title, images)
        `)
        .in('id', conversationIds)
        .order('updated_at', { ascending: false });

      if (convError) throw convError;

      // Fetch participants for each conversation
      const { data: allParticipants, error: partError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          user_id,
          private_key_user_id
        `)
        .in('conversation_id', conversationIds);

      if (partError) throw partError;

      // Fetch profiles and pk users separately
      const userIds = (allParticipants || []).filter(p => p.user_id).map(p => p.user_id!);
      const pkUserIds = (allParticipants || []).filter(p => p.private_key_user_id).map(p => p.private_key_user_id!);

      const { data: profilesData } = userIds.length > 0 
        ? await supabase.from('public_profiles').select('id, display_name').in('id', userIds)
        : { data: [] };

      const { data: pkUsersData } = pkUserIds.length > 0
        ? await supabase.from('public_private_key_users').select('id, display_name').in('id', pkUserIds)
        : { data: [] };

      // Fetch last message for each conversation
      const { data: lastMessages, error: msgError } = await supabase
        .from('messages')
        .select('conversation_id, content, created_at')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false });

      if (msgError) throw msgError;

      // Count unread messages
      const { data: unreadCounts, error: unreadError } = await supabase
        .from('messages')
        .select('conversation_id, id')
        .in('conversation_id', conversationIds)
        .is('read_at', null)
        .neq('sender_user_id', user?.id || '00000000-0000-0000-0000-000000000000');

      if (unreadError) throw unreadError;

      // Combine data
      const enrichedConversations: Conversation[] = (convData || []).map(conv => {
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
          listing: conv.listings as { id: string; title: string; images: string[] | null } | undefined,
          participants,
          last_message: lastMsg ? { content: lastMsg.content, created_at: lastMsg.created_at } : undefined,
          unread_count: unreadCount,
        };
      });

      setConversations(enrichedConversations);
    } catch (e) {
      console.error('Failed to fetch conversations:', e);
    } finally {
      setLoading(false);
    }
  }, [user, privateKeyUser]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    loading,
    isAuthenticated,
    refetch: fetchConversations,
  };
}

export function useConversation(conversationId: string | undefined) {
  const { user } = useAuth();
  const { privateKeyUser } = usePrivateKeyAuth();
  const { encryptMessage, getRecipientPublicKey, isUnlocked } = usePGP();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [recipientInfo, setRecipientInfo] = useState<{
    recipientUserId?: string;
    recipientPkUserId?: string;
    recipientHasPGP?: boolean;
  } | null>(null);

  const currentUserId = user?.id || '';

  const fetchMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      setRecipientInfo(null);
      return;
    }

    try {
      // First, get participants to find recipient
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('user_id, private_key_user_id')
        .eq('conversation_id', conversationId);

      if (participants) {
        const recipient = participants.find(p => 
          (p.user_id && p.user_id !== user?.id) ||
          (p.private_key_user_id && p.private_key_user_id !== privateKeyUser?.id)
        );
        if (recipient) {
          // Check if recipient has PGP keys
          let hasPGP = false;
          if (recipient.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('pgp_public_key')
              .eq('id', recipient.user_id)
              .maybeSingle();
            hasPGP = !!profile?.pgp_public_key;
          } else if (recipient.private_key_user_id) {
            const stored = localStorage.getItem(`pgp_keys_${recipient.private_key_user_id}`);
            hasPGP = !!stored;
          }

          setRecipientInfo({
            recipientUserId: recipient.user_id || undefined,
            recipientPkUserId: recipient.private_key_user_id || undefined,
            recipientHasPGP: hasPGP,
          });
        }
      }
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          conversation_id,
          sender_user_id,
          sender_private_key_user_id,
          content,
          read_at,
          created_at
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch sender profiles
      const senderUserIds = (data || []).filter(m => m.sender_user_id).map(m => m.sender_user_id!);
      const senderPkIds = (data || []).filter(m => m.sender_private_key_user_id).map(m => m.sender_private_key_user_id!);

      const { data: senderProfiles } = senderUserIds.length > 0
        ? await supabase.from('public_profiles').select('id, display_name').in('id', senderUserIds)
        : { data: [] };

      const { data: senderPkUsers } = senderPkIds.length > 0
        ? await supabase.from('public_private_key_users').select('id, display_name').in('id', senderPkIds)
        : { data: [] };

      const enrichedMessages: Message[] = (data || []).map(msg => ({
        id: msg.id,
        conversation_id: msg.conversation_id,
        sender_user_id: msg.sender_user_id,
        sender_private_key_user_id: msg.sender_private_key_user_id,
        content: msg.content,
        read_at: msg.read_at,
        created_at: msg.created_at,
        sender_profile: (senderProfiles || []).find(p => p.id === msg.sender_user_id) || null,
        sender_pk_user: (senderPkUsers || []).find(pk => pk.id === msg.sender_private_key_user_id) || null,
      }));

      setMessages(enrichedMessages);

      // Mark messages as read
      if (user) {
        await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .eq('conversation_id', conversationId)
          .neq('sender_user_id', user.id)
          .is('read_at', null);
      }
    } catch (e) {
      console.error('Failed to fetch messages:', e);
    } finally {
      setLoading(false);
    }
  }, [conversationId, user]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const sendMessage = async (content: string) => {
    if (!conversationId || !user || !content.trim()) return false;

    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_user_id: user.id,
        content: content.trim(),
      });

      if (error) throw error;

      // Update conversation updated_at
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      return true;
    } catch (e) {
      console.error('Failed to send message:', e);
      return false;
    }
  };

  const sendEncryptedMessage = async (
    content: string,
    recipientUserId?: string,
    recipientPkUserId?: string
  ) => {
    if (!conversationId || !user || !content.trim()) return false;

    try {
      // PGP encryption is mandatory - no fallback
      if (!isUnlocked) {
        console.error('PGP not unlocked - cannot send message');
        return false;
      }

      if (!recipientUserId && !recipientPkUserId) {
        console.error('No recipient specified - cannot send message');
        return false;
      }

      const recipientPublicKey = await getRecipientPublicKey(recipientUserId, recipientPkUserId);
      if (!recipientPublicKey) {
        console.error('Recipient has no PGP public key - cannot send encrypted message');
        return false;
      }

      const encrypted = await encryptMessage(content.trim(), recipientPublicKey);
      if (!encrypted) {
        console.error('Encryption failed - cannot send message');
        return false;
      }

      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_user_id: user.id,
        content: encrypted,
      });

      if (error) throw error;

      // Update conversation updated_at
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      return true;
    } catch (e) {
      console.error('Failed to send encrypted message:', e);
      return false;
    }
  };

  const getRecipientIds = () => recipientInfo;

  return {
    messages,
    loading,
    sendMessage,
    sendEncryptedMessage,
    getRecipientIds,
    currentUserId,
    refetch: fetchMessages,
  };
}

export async function startConversation(
  listingId: string,
  sellerId: string,
  buyerId: string,
  initialMessage?: string
): Promise<string | null> {
  try {
    // Check if conversation already exists
    const { data: existingParticipants } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', buyerId);

    if (existingParticipants && existingParticipants.length > 0) {
      const conversationIds = existingParticipants.map(p => p.conversation_id);
      
      // Check if seller is also a participant and it's about the same listing
      const { data: sellerParticipants } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', sellerId)
        .in('conversation_id', conversationIds);

      if (sellerParticipants && sellerParticipants.length > 0) {
        const { data: conv } = await supabase
          .from('conversations')
          .select('id')
          .eq('listing_id', listingId)
          .in('id', sellerParticipants.map(p => p.conversation_id))
          .maybeSingle();

        if (conv) {
          return conv.id;
        }
      }
    }

    // Create new conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({ listing_id: listingId })
      .select()
      .single();

    if (convError) throw convError;

    // Add participants
    const { error: partError } = await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: conversation.id, user_id: buyerId },
        { conversation_id: conversation.id, user_id: sellerId },
      ]);

    if (partError) throw partError;

    // Send initial message if provided
    if (initialMessage) {
      await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender_user_id: buyerId,
        content: initialMessage,
      });
    }

    return conversation.id;
  } catch (e) {
    console.error('Failed to start conversation:', e);
    return null;
  }
}
