import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { usePrivateKeyAuth } from './usePrivateKeyAuth';

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'disputed';

export interface Order {
  id: string;
  listing_id: string | null;
  buyer_user_id: string | null;
  buyer_pk_user_id: string | null;
  seller_user_id: string | null;
  seller_pk_user_id: string | null;
  quantity: number;
  unit_price_usd: number;
  shipping_price_usd: number;
  total_price_usd: number;
  status: OrderStatus;
  shipping_address: string | null;
  tracking_number: string | null;
  notes: string | null;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  conversation_id: string | null;
  // Enriched data
  listing?: {
    id: string;
    title: string;
    images: string[] | null;
  };
  buyer_name?: string;
  seller_name?: string;
}

export function useOrders() {
  const { user } = useAuth();
  const { privateKeyUser } = usePrivateKeyAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user || !!privateKeyUser;

  const fetchOrders = useCallback(async () => {
    if (!user && !privateKeyUser) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          listings(id, title, images)
        `)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      // Fetch buyer/seller names
      const buyerUserIds = (data || []).filter(o => o.buyer_user_id).map(o => o.buyer_user_id!);
      const sellerUserIds = (data || []).filter(o => o.seller_user_id).map(o => o.seller_user_id!);
      const allUserIds = [...new Set([...buyerUserIds, ...sellerUserIds])];

      const buyerPkIds = (data || []).filter(o => o.buyer_pk_user_id).map(o => o.buyer_pk_user_id!);
      const sellerPkIds = (data || []).filter(o => o.seller_pk_user_id).map(o => o.seller_pk_user_id!);
      const allPkIds = [...new Set([...buyerPkIds, ...sellerPkIds])];

      const { data: profiles } = allUserIds.length > 0
        ? await supabase.from('public_profiles').select('id, display_name').in('id', allUserIds)
        : { data: [] };

      const { data: pkUsers } = allPkIds.length > 0
        ? await supabase.from('public_private_key_users').select('id, display_name').in('id', allPkIds)
        : { data: [] };

      const enrichedOrders: Order[] = (data || []).map(order => {
        const buyerName = 
          (profiles || []).find(p => p.id === order.buyer_user_id)?.display_name ||
          (pkUsers || []).find(pk => pk.id === order.buyer_pk_user_id)?.display_name ||
          'Unknown';
        
        const sellerName = 
          (profiles || []).find(p => p.id === order.seller_user_id)?.display_name ||
          (pkUsers || []).find(pk => pk.id === order.seller_pk_user_id)?.display_name ||
          'Unknown';

        return {
          id: order.id,
          listing_id: order.listing_id,
          buyer_user_id: order.buyer_user_id,
          buyer_pk_user_id: order.buyer_pk_user_id,
          seller_user_id: order.seller_user_id,
          seller_pk_user_id: order.seller_pk_user_id,
          quantity: order.quantity,
          unit_price_usd: order.unit_price_usd,
          shipping_price_usd: order.shipping_price_usd,
          total_price_usd: order.total_price_usd,
          status: order.status as OrderStatus,
          shipping_address: order.shipping_address,
          tracking_number: order.tracking_number,
          notes: order.notes,
          paid_at: order.paid_at,
          shipped_at: order.shipped_at,
          delivered_at: order.delivered_at,
          completed_at: order.completed_at,
          created_at: order.created_at,
          updated_at: order.updated_at,
          conversation_id: order.conversation_id,
          listing: order.listings as Order['listing'],
          buyer_name: buyerName,
          seller_name: sellerName,
        };
      });

      setOrders(enrichedOrders);
    } catch (e) {
      console.error('Failed to fetch orders:', e);
    } finally {
      setLoading(false);
    }
  }, [user, privateKeyUser]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId: string, status: OrderStatus, extras?: Partial<Order>): Promise<boolean> => {
    try {
      const updateData: any = { status, ...extras };
      
      // Set timestamp based on status
      if (status === 'paid') updateData.paid_at = new Date().toISOString();
      if (status === 'shipped') updateData.shipped_at = new Date().toISOString();
      if (status === 'delivered') updateData.delivered_at = new Date().toISOString();
      if (status === 'completed') updateData.completed_at = new Date().toISOString();

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;
      
      await fetchOrders();
      return true;
    } catch (e) {
      console.error('Failed to update order:', e);
      return false;
    }
  };

  const isBuyer = (order: Order) => {
    if (user && order.buyer_user_id === user.id) return true;
    if (privateKeyUser && order.buyer_pk_user_id === privateKeyUser.id) return true;
    return false;
  };

  const isSeller = (order: Order) => {
    if (user && order.seller_user_id === user.id) return true;
    if (privateKeyUser && order.seller_pk_user_id === privateKeyUser.id) return true;
    return false;
  };

  return {
    orders,
    loading,
    isAuthenticated,
    updateOrderStatus,
    isBuyer,
    isSeller,
    refetch: fetchOrders,
  };
}

export interface CreateOrderParams {
  listingId: string;
  sellerId: string;
  isSellerPrivateKey: boolean;
  quantity: number;
  unitPrice: number;
  shippingPrice: number;
  encryptedShippingAddress: string;
  conversationId?: string;
}

export async function createOrder(params: CreateOrderParams): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const {
    listingId,
    sellerId,
    isSellerPrivateKey,
    quantity,
    unitPrice,
    shippingPrice,
    encryptedShippingAddress,
    conversationId
  } = params;

  try {
    const totalPrice = (unitPrice * quantity) + shippingPrice;

    const orderData: any = {
      listing_id: listingId,
      buyer_user_id: user.id,
      quantity,
      unit_price_usd: unitPrice,
      shipping_price_usd: shippingPrice,
      total_price_usd: totalPrice,
      shipping_address: encryptedShippingAddress,
      conversation_id: conversationId || null,
    };

    if (isSellerPrivateKey) {
      orderData.seller_pk_user_id = sellerId;
    } else {
      orderData.seller_user_id = sellerId;
    }

    const { data, error } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (error) throw error;
    
    // Note: Analytics are now recorded automatically via database trigger 
    // when order status changes to 'paid' or later
    
    return data.id;
  } catch (e) {
    console.error('Failed to create order:', e);
    return null;
  }
}

// Legacy function signature for backward compatibility
export async function createOrderLegacy(
  listingId: string,
  sellerId: string,
  isSellerPrivateKey: boolean,
  quantity: number,
  unitPrice: number,
  shippingPrice: number,
  shippingAddress?: string
): Promise<string | null> {
  return createOrder({
    listingId,
    sellerId,
    isSellerPrivateKey,
    quantity,
    unitPrice,
    shippingPrice,
    encryptedShippingAddress: shippingAddress || '',
  });
}
