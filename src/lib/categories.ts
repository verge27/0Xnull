export interface Category {
  id: number;
  name: string;
  slug: string;
  children?: Category[];
}

export const CATEGORIES: Category[] = [
  {
    id: 1,
    name: "Accessories",
    slug: "accessories",
    children: [
      { id: 101, name: "Hair Accessories", slug: "hair-accessories" },
      { id: 102, name: "Hats & Caps", slug: "hats-caps" },
      { id: 103, name: "Scarves & Wraps", slug: "scarves-wraps" },
      { id: 104, name: "Sunglasses", slug: "sunglasses" },
      { id: 105, name: "Belts", slug: "belts" },
      { id: 106, name: "Keychains", slug: "keychains" },
    ]
  },
  {
    id: 2,
    name: "Art & Collectibles",
    slug: "art-collectibles",
    children: [
      { id: 201, name: "Painting", slug: "painting" },
      { id: 202, name: "Photography", slug: "photography" },
      { id: 203, name: "Prints", slug: "prints" },
      { id: 204, name: "Sculpture", slug: "sculpture" },
      { id: 205, name: "Drawing", slug: "drawing" },
    ]
  },
  {
    id: 3,
    name: "Bags & Purses",
    slug: "bags-purses",
    children: [
      { id: 301, name: "Backpacks", slug: "backpacks" },
      { id: 302, name: "Handbags", slug: "handbags" },
      { id: 303, name: "Wallets", slug: "wallets" },
      { id: 304, name: "Tote Bags", slug: "tote-bags" },
    ]
  },
  {
    id: 4,
    name: "Bath & Beauty",
    slug: "bath-beauty",
    children: [
      { id: 401, name: "Soaps", slug: "soaps" },
      { id: 402, name: "Skincare", slug: "skincare" },
      { id: 403, name: "Hair Care", slug: "hair-care" },
      { id: 404, name: "Fragrances", slug: "fragrances" },
    ]
  },
  {
    id: 5,
    name: "Clothing",
    slug: "clothing",
    children: [
      { id: 501, name: "Women's", slug: "womens-clothing" },
      { id: 502, name: "Men's", slug: "mens-clothing" },
      { id: 503, name: "Kids & Baby", slug: "kids-baby" },
      { id: 504, name: "Costumes", slug: "costumes" },
    ]
  },
  {
    id: 6,
    name: "Electronics",
    slug: "electronics",
    children: [
      { id: 601, name: "Phone Cases", slug: "phone-cases" },
      { id: 602, name: "Laptop Accessories", slug: "laptop-accessories" },
      { id: 603, name: "Gadgets", slug: "gadgets" },
      { id: 604, name: "Car Accessories", slug: "car-accessories" },
    ]
  },
  {
    id: 7,
    name: "Home & Living",
    slug: "home-living",
    children: [
      { id: 701, name: "Furniture", slug: "furniture" },
      { id: 702, name: "Home Decor", slug: "home-decor" },
      { id: 703, name: "Kitchen & Dining", slug: "kitchen-dining" },
      { id: 704, name: "Bedding", slug: "bedding" },
      { id: 705, name: "Lighting", slug: "lighting" },
    ]
  },
  {
    id: 8,
    name: "Jewelry",
    slug: "jewelry",
    children: [
      { id: 801, name: "Necklaces", slug: "necklaces" },
      { id: 802, name: "Rings", slug: "rings" },
      { id: 803, name: "Earrings", slug: "earrings" },
      { id: 804, name: "Bracelets", slug: "bracelets" },
      { id: 805, name: "Watches", slug: "watches" },
    ]
  },
  {
    id: 9,
    name: "Digital Goods",
    slug: "digital-goods",
    children: [
      { id: 901, name: "VPN & Privacy", slug: "vpn-privacy" },
      { id: 902, name: "Software", slug: "software" },
      { id: 903, name: "eBooks & Guides", slug: "ebooks-guides" },
      { id: 904, name: "Courses", slug: "courses" },
      { id: 905, name: "Digital Art", slug: "digital-art" },
      { id: 906, name: "Templates", slug: "templates" },
    ]
  },
  {
    id: 10,
    name: "Services",
    slug: "services",
    children: [
      { id: 1001, name: "Consulting", slug: "consulting" },
      { id: 1002, name: "Design", slug: "design-services" },
      { id: 1003, name: "Writing", slug: "writing" },
      { id: 1004, name: "Programming", slug: "programming" },
      { id: 1005, name: "Privacy & Security", slug: "privacy-security" },
    ]
  },
  {
    id: 11,
    name: "Adult & Intimacy",
    slug: "adult-intimacy",
    children: [
      { id: 1101, name: "Toys & Devices", slug: "toys-devices" },
      { id: 1102, name: "Lingerie & Apparel", slug: "lingerie-apparel" },
      { id: 1103, name: "Wellness & Enhancement", slug: "wellness-enhancement" },
      { id: 1104, name: "Content & Subscriptions", slug: "content-subscriptions" },
      { id: 1105, name: "Accessories", slug: "intimacy-accessories" },
    ]
  },
  {
    id: 12,
    name: "Health & Wellness",
    slug: "health-wellness",
    children: [
      { id: 1201, name: "Hormone Optimization", slug: "hormone-optimization" },
      { id: 1202, name: "Peptides & Research", slug: "peptides-research" },
      { id: 1203, name: "Nootropics & Cognitive", slug: "nootropics-cognitive" },
      { id: 1204, name: "Sports & Recovery", slug: "sports-recovery" },
      { id: 1205, name: "Supplements & Vitamins", slug: "supplements-vitamins" },
    ]
  },
  {
    id: 13,
    name: "Tools & Outdoors",
    slug: "tools-outdoors",
    children: [
      { id: 1301, name: "Knives & Blades", slug: "knives-blades" },
      { id: 1302, name: "Multi-Tools", slug: "multi-tools" },
      { id: 1303, name: "Camping & Survival", slug: "camping-survival" },
      { id: 1304, name: "Flashlights & Lighting", slug: "flashlights-lighting" },
      { id: 1305, name: "Hand Tools", slug: "hand-tools" },
      { id: 1306, name: "Hunting & Fishing", slug: "hunting-fishing" },
    ]
  },
];

export const ALL_CATEGORIES = CATEGORIES;

// Helper function to get all categories flattened
export const getFlatCategories = (): Category[] => {
  const flat: Category[] = [];
  CATEGORIES.forEach(cat => {
    flat.push(cat);
    if (cat.children) {
      flat.push(...cat.children);
    }
  });
  return flat;
};

// Helper function to find category by slug
export const findCategoryBySlug = (slug: string): Category | undefined => {
  for (const cat of CATEGORIES) {
    if (cat.slug === slug) return cat;
    if (cat.children) {
      const found = cat.children.find(c => c.slug === slug);
      if (found) return found;
    }
  }
  return undefined;
};

// Helper function to get category path (breadcrumb)
export const getCategoryPath = (slug: string): Category[] => {
  for (const parent of CATEGORIES) {
    if (parent.slug === slug) {
      return [parent];
    }
    if (parent.children) {
      const child = parent.children.find(c => c.slug === slug);
      if (child) {
        return [parent, child];
      }
    }
  }
  return [];
};
