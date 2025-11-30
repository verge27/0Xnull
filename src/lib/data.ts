import { Listing, Order, User } from './types';

export const DEMO_USERS: User[] = [
  {
    id: 'user1',
    displayName: 'CryptoArtisan',
    xmrAddress: '888tNkZrPN6JsEgekjMnABU4TBzc2Dt29EPAvkRxbANsAnjyPbb3iQ1YBRk1UXcdRsiKc9dhwMVgN5S9cQUiyoogDavup3H',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
    bio: 'Handcrafting quality leather goods since 2019. Every piece is made to last a lifetime with premium materials.',
    location: 'Brighton, UK',
    joinedAt: '2024-01-15T00:00:00Z',
    totalSales: 234,
    rating: 4.8,
    reviewCount: 189
  },
  {
    id: 'user2',
    displayName: 'PrivacyFirst',
    xmrAddress: '888tNkZrPN6JsEgekjMnABU4TBzc2Dt29EPAvkRxbANsAnjyPbb3iQ1YBRk1UXcdRsiKc9dhwMVgN5S9cQUiyoogDavup3H',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    bio: 'Digital privacy advocate selling VPNs, encrypted services, and privacy tools. Your security is my priority.',
    location: 'Switzerland',
    joinedAt: '2024-03-01T00:00:00Z',
    totalSales: 1205,
    rating: 4.9,
    reviewCount: 892
  },
  {
    id: 'user3',
    displayName: 'TechAnon',
    xmrAddress: '888tNkZrPN6JsEgekjMnABU4TBzc2Dt29EPAvkRxbANsAnjyPbb3iQ1YBRk1UXcdRsiKc9dhwMVgN5S9cQUiyoogDavup3H',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200',
    bio: 'Custom mechanical keyboards and tech gear. All products tested before shipping. Quality guaranteed.',
    location: 'Berlin, Germany',
    joinedAt: '2024-02-10T00:00:00Z',
    totalSales: 67,
    rating: 4.6,
    reviewCount: 45
  }
];

export const DEMO_LISTINGS: Listing[] = [
  {
    id: 'listing1',
    sellerId: 'user1',
    title: 'Custom Leather Wallet',
    description: 'Handcrafted genuine leather wallet with RFID protection. Perfect for storing your cards securely. Made with premium Italian leather and includes multiple card slots.',
    priceUsd: 37.50,
    category: 'wallets',
    images: ['https://images.unsplash.com/photo-1627123424574-724758594e93?w=800'],
    stock: 5,
    shippingPriceUsd: 3.00,
    status: 'active',
    condition: 'new',
    createdAt: '2024-11-20T10:00:00Z'
  },
  {
    id: 'listing2',
    sellerId: 'user2',
    title: 'VPN Subscription 1 Year',
    description: 'Premium VPN service with no-logs policy. Unlimited bandwidth, 50+ countries, and 24/7 support. Perfect for maintaining your privacy online.',
    priceUsd: 22.50,
    category: 'vpn-privacy',
    images: ['https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=800'],
    stock: 100,
    shippingPriceUsd: 0,
    status: 'active',
    condition: 'digital',
    createdAt: '2024-11-22T14:30:00Z'
  },
  {
    id: 'listing3',
    sellerId: 'user1',
    title: 'Privacy Consultation 1hr',
    description: 'One-on-one privacy consultation with a security expert. Learn how to protect your digital footprint, secure your communications, and maintain anonymity online.',
    priceUsd: 45.00,
    category: 'consulting',
    images: ['https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800'],
    stock: 10,
    shippingPriceUsd: 0,
    status: 'active',
    condition: 'digital',
    createdAt: '2024-11-18T09:00:00Z'
  },
  {
    id: 'listing4',
    sellerId: 'user3',
    title: 'Mechanical Keyboard',
    description: 'Custom mechanical keyboard with Cherry MX switches. RGB backlight, aluminum case, and programmable keys. Perfect for privacy-focused professionals.',
    priceUsd: 127.50,
    category: 'laptop-accessories',
    images: ['https://images.unsplash.com/photo-1595225476474-87563907a212?w=800'],
    stock: 3,
    shippingPriceUsd: 7.50,
    status: 'active',
    condition: 'new',
    createdAt: '2024-11-25T16:00:00Z'
  },
  {
    id: 'listing5',
    sellerId: 'user2',
    title: 'Digital Art Pack',
    description: 'Collection of 50 high-resolution digital artworks focused on privacy and cryptocurrency themes. Perfect for your projects or personal use.',
    priceUsd: 7.50,
    category: 'digital-art',
    images: ['https://images.unsplash.com/photo-1561998338-13ad7883b20f?w=800'],
    stock: 999,
    shippingPriceUsd: 0,
    status: 'active',
    condition: 'digital',
    createdAt: '2024-11-15T11:00:00Z'
  },
  {
    id: 'listing6',
    sellerId: 'user3',
    title: 'Encrypted USB Drive 64GB',
    description: 'Hardware-encrypted USB drive with military-grade AES-256 encryption. Water and dust resistant. Perfect for storing sensitive data.',
    priceUsd: 27.00,
    category: 'gadgets',
    images: ['https://images.unsplash.com/photo-1624823183493-ed5832f48f18?w=800'],
    stock: 8,
    shippingPriceUsd: 3.00,
    status: 'active',
    condition: 'new',
    createdAt: '2024-11-28T08:00:00Z'
  },
  {
    id: 'listing7',
    sellerId: 'user1',
    title: 'Privacy-Focused Phone Setup',
    description: 'Complete setup service for a privacy-focused mobile phone. Includes degoogled OS installation, secure apps configuration, and privacy training.',
    priceUsd: 67.50,
    category: 'privacy-security',
    images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800'],
    stock: 5,
    shippingPriceUsd: 0,
    status: 'active',
    condition: 'digital',
    createdAt: '2024-11-19T13:00:00Z'
  },
  {
    id: 'listing8',
    sellerId: 'user2',
    title: 'Cryptocurrency Trading Course',
    description: 'Comprehensive video course on anonymous cryptocurrency trading. Learn best practices, privacy tools, and trading strategies. 10+ hours of content.',
    priceUsd: 33.00,
    category: 'courses',
    images: ['https://images.unsplash.com/photo-1640340434855-6084b1f4901c?w=800'],
    stock: 999,
    shippingPriceUsd: 0,
    status: 'active',
    condition: 'digital',
    createdAt: '2024-11-23T12:00:00Z'
  },
  {
    id: 'listing9',
    sellerId: 'user3',
    title: 'Vintage Camera Body',
    description: 'Classic film camera body in excellent working condition. Perfect for photography enthusiasts. Includes original leather case.',
    priceUsd: 89.00,
    category: 'photography',
    images: ['https://images.unsplash.com/photo-1606986628516-d0152cd2c963?w=800'],
    stock: 1,
    shippingPriceUsd: 5.00,
    status: 'active',
    condition: 'used',
    createdAt: '2024-11-10T15:00:00Z'
  },
  {
    id: 'listing10',
    sellerId: 'user1',
    title: 'Silver Chain Necklace',
    description: 'Handmade sterling silver necklace with minimalist design. Perfect for everyday wear.',
    priceUsd: 55.00,
    category: 'necklaces',
    images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800'],
    stock: 4,
    shippingPriceUsd: 2.50,
    status: 'active',
    condition: 'new',
    createdAt: '2024-11-26T10:00:00Z'
  },
  {
    id: 'listing11',
    sellerId: 'user2',
    title: 'Organic Lavender Soap',
    description: 'All-natural handmade soap with organic lavender essential oil. Gentle on skin.',
    priceUsd: 8.50,
    category: 'soaps',
    images: ['https://images.unsplash.com/photo-1588945404629-4387d23f001f?w=800'],
    stock: 25,
    shippingPriceUsd: 3.00,
    status: 'active',
    condition: 'new',
    createdAt: '2024-11-27T14:00:00Z'
  },
  {
    id: 'listing12',
    sellerId: 'user3',
    title: 'Wireless Earbuds Case',
    description: 'Protective silicone case for wireless earbuds. Multiple colors available.',
    priceUsd: 12.00,
    category: 'phone-cases',
    images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800'],
    stock: 15,
    shippingPriceUsd: 2.00,
    status: 'active',
    condition: 'new',
    createdAt: '2024-11-24T09:00:00Z'
  }
];

// LocalStorage helpers
export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('currentUser');
  return userStr ? JSON.parse(userStr) : null;
};

export const setCurrentUser = (user: User | null): void => {
  if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
  } else {
    localStorage.removeItem('currentUser');
  }
};

export const getListings = (): Listing[] => {
  // Always return demo listings
  return DEMO_LISTINGS;
};

export const getListing = (id: string): Listing | undefined => {
  return getListings().find(l => l.id === id);
};

export const addListing = (listing: Listing): void => {
  const listings = getListings();
  listings.push(listing);
  localStorage.setItem('listings', JSON.stringify(listings));
};

export const updateListing = (id: string, updates: Partial<Listing>): void => {
  const listings = getListings();
  const index = listings.findIndex(l => l.id === id);
  if (index !== -1) {
    listings[index] = { ...listings[index], ...updates };
    localStorage.setItem('listings', JSON.stringify(listings));
  }
};

export const getOrders = (): Order[] => {
  const ordersStr = localStorage.getItem('orders');
  return ordersStr ? JSON.parse(ordersStr) : [];
};

export const getOrder = (id: string): Order | undefined => {
  return getOrders().find(o => o.id === id);
};

export const addOrder = (order: Order): void => {
  const orders = getOrders();
  orders.push(order);
  localStorage.setItem('orders', JSON.stringify(orders));
};

export const updateOrder = (id: string, updates: Partial<Order>): void => {
  const orders = getOrders();
  const index = orders.findIndex(o => o.id === id);
  if (index !== -1) {
    orders[index] = { ...orders[index], ...updates };
    localStorage.setItem('orders', JSON.stringify(orders));
  }
};
