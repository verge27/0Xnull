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
}

export interface Order {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  quantity: number;
  totalXmr: number;
  status: 'pending_payment' | 'paid' | 'shipped' | 'completed';
  createdAt: string;
}

export interface User {
  id: string;
  displayName: string;
  xmrAddress: string;
}
