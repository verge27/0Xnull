export type FulfillmentType = 'referral' | 'affiliate' | 'proxy' | 'direct' | 'vendor';

export interface Listing {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  priceUsd: number;
  category: string;
  images: string[];
  stock: number;
  shippingPriceUsd: number;
  status: 'active' | 'sold_out' | 'draft';
  condition: 'new' | 'used' | 'digital';
  createdAt: string;
  // Legacy fields for backward compatibility
  priceXmr?: number;
  shippingPriceXmr?: number;
  // Extended fields for new categories
  fulfillment?: FulfillmentType;
  referralUrl?: string;
  supplierSku?: string;
  supplier?: string;
  margin?: number;
  vendorId?: string;
  vendorRating?: number;
  vendorReviews?: number;
  ageRestricted?: boolean;
  disclaimer?: string;
  discreteShipping?: boolean;
  shipsFrom?: string;
  shipsTo?: string[];
  requiresSignature?: boolean;
  coaAvailable?: boolean;
}

export interface Order {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  quantity: number;
  totalXmr: number;
  status: 'created' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'disputed' | 'refunded';
  trackingCarrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippedAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  disputeReason?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  listingId?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface User {
  id: string;
  displayName: string;
  xmrAddress: string;
  avatar?: string;
  bio?: string;
  location?: string;
  joinedAt: string;
  totalSales: number;
  rating: number;
  reviewCount: number;
}
