/**
 * Complete Etsy Category Taxonomy
 * 
 * Based on Etsy's official category structure.
 * Etsy has 6,000+ categories organized in a hierarchical tree.
 * 
 * This is the full clone structure for Tari Market.
 */

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
      { id: 101, name: "Aprons", slug: "aprons" },
      {
        id: 102,
        name: "Belts & Suspenders",
        slug: "belts-and-suspenders",
        children: [
          { id: 1021, name: "Belt Buckles", slug: "belt-buckles" },
          { id: 1022, name: "Belts", slug: "belts" },
          { id: 1023, name: "Suspenders", slug: "suspenders" },
        ],
      },
      {
        id: 103,
        name: "Bouquets & Corsages",
        slug: "bouquets-and-corsages",
        children: [
          { id: 1031, name: "Bouquets", slug: "bouquets" },
          { id: 1032, name: "Corsages", slug: "corsages" },
          { id: 1033, name: "Boutonnieres", slug: "boutonnieres" },
        ],
      },
      { id: 104, name: "Collars", slug: "collars" },
      {
        id: 105,
        name: "Costume Accessories",
        slug: "costume-accessories",
        children: [
          { id: 1051, name: "Capes", slug: "capes" },
          { id: 1052, name: "Costume Hats", slug: "costume-hats" },
          { id: 1053, name: "Costume Tails & Ears", slug: "costume-tails-ears" },
          { id: 1054, name: "Masks & Prosthetics", slug: "masks-prosthetics" },
          { id: 1055, name: "Wings", slug: "wings" },
        ],
      },
      {
        id: 106,
        name: "Face Masks & Accessories",
        slug: "face-masks-and-accessories",
        children: [
          { id: 1061, name: "Face Masks", slug: "face-masks" },
          { id: 1062, name: "Mask Chains & Lanyards", slug: "mask-chains-lanyards" },
        ],
      },
      {
        id: 107,
        name: "Gloves & Sleeves",
        slug: "gloves-and-sleeves",
        children: [
          { id: 1071, name: "Arm Warmers", slug: "arm-warmers" },
          { id: 1072, name: "Gloves & Mittens", slug: "gloves-mittens" },
        ],
      },
      {
        id: 108,
        name: "Hair Accessories",
        slug: "hair-accessories",
        children: [
          { id: 1081, name: "Barrettes & Clips", slug: "barrettes-clips" },
          { id: 1082, name: "Combs", slug: "combs" },
          { id: 1083, name: "Hair Pins", slug: "hair-pins" },
          { id: 1084, name: "Headbands", slug: "headbands" },
          { id: 1085, name: "Ponytail Holders", slug: "ponytail-holders" },
          { id: 1086, name: "Scrunchies", slug: "scrunchies" },
          { id: 1087, name: "Tiaras", slug: "tiaras" },
          { id: 1088, name: "Wigs", slug: "wigs" },
        ],
      },
      { id: 109, name: "Hand Fans", slug: "hand-fans" },
      {
        id: 110,
        name: "Hats & Head Coverings",
        slug: "hats-and-head-coverings",
        children: [
          { id: 1101, name: "Baseball & Trucker Caps", slug: "baseball-trucker-caps" },
          { id: 1102, name: "Beanies & Winter Hats", slug: "beanies-winter-hats" },
          { id: 1103, name: "Berets", slug: "berets" },
          { id: 1104, name: "Fascinators & Mini Hats", slug: "fascinators-mini-hats" },
          { id: 1105, name: "Fedoras", slug: "fedoras" },
          { id: 1106, name: "Hijabs", slug: "hijabs" },
          { id: 1107, name: "Sun Hats", slug: "sun-hats" },
          { id: 1108, name: "Turbans", slug: "turbans" },
          { id: 1109, name: "Veils", slug: "veils" },
        ],
      },
      {
        id: 111,
        name: "Keychains & Lanyards",
        slug: "keychains-and-lanyards",
        children: [
          { id: 1111, name: "Keychains", slug: "keychains" },
          { id: 1112, name: "Lanyards", slug: "lanyards" },
        ],
      },
      { id: 112, name: "Patches & Appliques", slug: "patches-and-appliques" },
      {
        id: 113,
        name: "Pins & Clips",
        slug: "pins-and-clips",
        children: [
          { id: 1131, name: "Brooches", slug: "brooches" },
          { id: 1132, name: "Enamel Pins", slug: "enamel-pins" },
        ],
      },
      {
        id: 114,
        name: "Scarves & Wraps",
        slug: "scarves-and-wraps",
        children: [
          { id: 1141, name: "Bandanas", slug: "bandanas" },
          { id: 1142, name: "Handkerchiefs", slug: "handkerchiefs" },
          { id: 1143, name: "Scarves", slug: "scarves" },
          { id: 1144, name: "Shawls & Wraps", slug: "shawls-wraps" },
        ],
      },
      {
        id: 115,
        name: "Suit & Tie Accessories",
        slug: "suit-and-tie-accessories",
        children: [
          { id: 1151, name: "Bow Ties", slug: "bow-ties" },
          { id: 1152, name: "Cufflinks & Tie Clips", slug: "cufflinks-tie-clips" },
          { id: 1153, name: "Neckties", slug: "neckties" },
          { id: 1154, name: "Pocket Squares", slug: "pocket-squares" },
        ],
      },
      {
        id: 116,
        name: "Sunglasses & Eyewear",
        slug: "sunglasses-and-eyewear",
        children: [
          { id: 1161, name: "Eyeglasses", slug: "eyeglasses" },
          { id: 1162, name: "Glasses Chains", slug: "glasses-chains" },
          { id: 1163, name: "Sunglasses", slug: "sunglasses" },
        ],
      },
      {
        id: 117,
        name: "Umbrellas & Rain Accessories",
        slug: "umbrellas-and-rain-accessories",
      },
      { id: 118, name: "Scrub Caps", slug: "scrub-caps" },
      { id: 119, name: "Parandas", slug: "parandas" },
    ],
  },
  {
    id: 2,
    name: "Art & Collectibles",
    slug: "art-and-collectibles",
    children: [
      {
        id: 201,
        name: "Collectibles",
        slug: "collectibles",
        children: [
          { id: 2011, name: "Figurines & Knick Knacks", slug: "figurines-knick-knacks" },
          { id: 2012, name: "Memorabilia", slug: "memorabilia" },
          { id: 2013, name: "Trading Cards", slug: "trading-cards" },
          { id: 2014, name: "Vintage", slug: "vintage-collectibles" },
        ],
      },
      {
        id: 202,
        name: "Drawing & Illustration",
        slug: "drawing-and-illustration",
        children: [
          { id: 2021, name: "Architectural Drawings", slug: "architectural-drawings" },
          { id: 2022, name: "Charcoal Drawings", slug: "charcoal-drawings" },
          { id: 2023, name: "Digital Drawings", slug: "digital-drawings" },
          { id: 2024, name: "Ink Drawings", slug: "ink-drawings" },
          { id: 2025, name: "Pencil Drawings", slug: "pencil-drawings" },
        ],
      },
      {
        id: 203,
        name: "Dolls & Miniatures",
        slug: "dolls-and-miniatures",
        children: [
          { id: 2031, name: "Art Dolls", slug: "art-dolls" },
          { id: 2032, name: "Dollhouse Miniatures", slug: "dollhouse-miniatures" },
          { id: 2033, name: "Figurines", slug: "figurines" },
          { id: 2034, name: "Shadow Boxes", slug: "shadow-boxes" },
        ],
      },
      {
        id: 204,
        name: "Fiber Arts",
        slug: "fiber-arts",
        children: [
          { id: 2041, name: "Embroidery", slug: "embroidery" },
          { id: 2042, name: "Macrame", slug: "macrame" },
          { id: 2043, name: "Needlepoint", slug: "needlepoint" },
          { id: 2044, name: "Quilts", slug: "quilts" },
          { id: 2045, name: "Tapestries", slug: "tapestries" },
          { id: 2046, name: "Weaving", slug: "weaving" },
        ],
      },
      {
        id: 205,
        name: "Glass Art",
        slug: "glass-art",
        children: [
          { id: 2051, name: "Blown Glass", slug: "blown-glass" },
          { id: 2052, name: "Fused Glass", slug: "fused-glass" },
          { id: 2053, name: "Stained Glass", slug: "stained-glass" },
        ],
      },
      {
        id: 206,
        name: "Mixed Media & Collage",
        slug: "mixed-media-and-collage",
      },
      {
        id: 207,
        name: "Painting",
        slug: "painting",
        children: [
          { id: 2071, name: "Acrylic Paintings", slug: "acrylic-paintings" },
          { id: 2072, name: "Oil Paintings", slug: "oil-paintings" },
          { id: 2073, name: "Spray Paint", slug: "spray-paint" },
          { id: 2074, name: "Watercolor Paintings", slug: "watercolor-paintings" },
        ],
      },
      {
        id: 208,
        name: "Photography",
        slug: "photography",
        children: [
          { id: 2081, name: "Black & White", slug: "black-and-white" },
          { id: 2082, name: "Color", slug: "color-photography" },
          { id: 2083, name: "Digital", slug: "digital-photography" },
        ],
      },
      {
        id: 209,
        name: "Prints",
        slug: "prints",
        children: [
          { id: 2091, name: "Digital Prints", slug: "digital-prints" },
          { id: 2092, name: "Etchings & Engravings", slug: "etchings-engravings" },
          { id: 2093, name: "Giclee", slug: "giclee" },
          { id: 2094, name: "Linocuts", slug: "linocuts" },
          { id: 2095, name: "Lithographs", slug: "lithographs" },
          { id: 2096, name: "Screen Prints", slug: "screen-prints" },
          { id: 2097, name: "Woodcuts", slug: "woodcuts" },
        ],
      },
      {
        id: 210,
        name: "Sculpture",
        slug: "sculpture",
        children: [
          { id: 2101, name: "Art Objects", slug: "art-objects" },
          { id: 2102, name: "Statues", slug: "statues" },
        ],
      },
    ],
  },
  {
    id: 3,
    name: "Bags & Purses",
    slug: "bags-and-purses",
    children: [
      {
        id: 301,
        name: "Backpacks",
        slug: "backpacks",
      },
      {
        id: 302,
        name: "Cosmetic & Toiletry Bags",
        slug: "cosmetic-and-toiletry-bags",
      },
      {
        id: 303,
        name: "Diaper Bags",
        slug: "diaper-bags",
      },
      {
        id: 304,
        name: "Fanny Packs",
        slug: "fanny-packs",
      },
      {
        id: 305,
        name: "Handbags",
        slug: "handbags",
        children: [
          { id: 3051, name: "Bucket Bags", slug: "bucket-bags" },
          { id: 3052, name: "Clutches & Evening Bags", slug: "clutches-evening-bags" },
          { id: 3053, name: "Crossbody Bags", slug: "crossbody-bags" },
          { id: 3054, name: "Hobo Bags", slug: "hobo-bags" },
          { id: 3055, name: "Satchels", slug: "satchels" },
          { id: 3056, name: "Shoulder Bags", slug: "shoulder-bags" },
          { id: 3057, name: "Top Handle Bags", slug: "top-handle-bags" },
          { id: 3058, name: "Tote Bags", slug: "tote-bags" },
        ],
      },
      {
        id: 306,
        name: "Luggage & Travel",
        slug: "luggage-and-travel",
        children: [
          { id: 3061, name: "Duffel Bags", slug: "duffel-bags" },
          { id: 3062, name: "Luggage", slug: "luggage" },
          { id: 3063, name: "Messenger Bags", slug: "messenger-bags" },
          { id: 3064, name: "Packing Organizers", slug: "packing-organizers" },
          { id: 3065, name: "Weekender Bags", slug: "weekender-bags" },
        ],
      },
      {
        id: 307,
        name: "Market Bags",
        slug: "market-bags",
      },
      {
        id: 308,
        name: "Pouches & Coin Purses",
        slug: "pouches-and-coin-purses",
      },
      {
        id: 309,
        name: "Sports Bags",
        slug: "sports-bags",
      },
      {
        id: 310,
        name: "Wallets & Money Clips",
        slug: "wallets-and-money-clips",
        children: [
          { id: 3101, name: "Card Cases", slug: "card-cases" },
          { id: 3102, name: "Money Clips", slug: "money-clips" },
          { id: 3103, name: "Wallets", slug: "wallets" },
        ],
      },
      { id: 311, name: "Potli Bags", slug: "potli-bags" },
    ],
  },
  {
    id: 4,
    name: "Bath & Beauty",
    slug: "bath-and-beauty",
    children: [
      {
        id: 401,
        name: "Bath Accessories",
        slug: "bath-accessories",
        children: [
          { id: 4011, name: "Bath Bombs & Fizzies", slug: "bath-bombs-fizzies" },
          { id: 4012, name: "Bath Salts", slug: "bath-salts" },
          { id: 4013, name: "Bubble Bath", slug: "bubble-bath" },
          { id: 4014, name: "Shower Steamers", slug: "shower-steamers" },
        ],
      },
      {
        id: 402,
        name: "Essential Oils",
        slug: "essential-oils",
      },
      {
        id: 403,
        name: "Fragrances",
        slug: "fragrances",
        children: [
          { id: 4031, name: "Cologne", slug: "cologne" },
          { id: 4032, name: "Perfume", slug: "perfume" },
        ],
      },
      {
        id: 404,
        name: "Hair Care",
        slug: "hair-care",
        children: [
          { id: 4041, name: "Conditioners", slug: "conditioners" },
          { id: 4042, name: "Hair Masks & Treatments", slug: "hair-masks-treatments" },
          { id: 4043, name: "Shampoos", slug: "shampoos" },
          { id: 4044, name: "Styling Products", slug: "styling-products" },
        ],
      },
      {
        id: 405,
        name: "Makeup & Cosmetics",
        slug: "makeup-and-cosmetics",
        children: [
          { id: 4051, name: "Blush & Bronzer", slug: "blush-bronzer" },
          { id: 4052, name: "Eye Makeup", slug: "eye-makeup" },
          { id: 4053, name: "Foundation & Concealer", slug: "foundation-concealer" },
          { id: 4054, name: "Lip Balms & Treatments", slug: "lip-balms-treatments" },
          { id: 4055, name: "Lipstick", slug: "lipstick" },
          { id: 4056, name: "Makeup Bags & Cases", slug: "makeup-bags-cases" },
          { id: 4057, name: "Makeup Brushes & Tools", slug: "makeup-brushes-tools" },
        ],
      },
      {
        id: 406,
        name: "Skin Care",
        slug: "skin-care",
        children: [
          { id: 4061, name: "Body Butters", slug: "body-butters" },
          { id: 4062, name: "Body Lotions", slug: "body-lotions" },
          { id: 4063, name: "Face Masks", slug: "face-masks-skincare" },
          { id: 4064, name: "Facial Cleansers", slug: "facial-cleansers" },
          { id: 4065, name: "Lip Balms", slug: "lip-balms" },
          { id: 4066, name: "Moisturizers", slug: "moisturizers" },
          { id: 4067, name: "Serums", slug: "serums" },
          { id: 4068, name: "Toners", slug: "toners" },
        ],
      },
      {
        id: 407,
        name: "Soaps",
        slug: "soaps",
        children: [
          { id: 4071, name: "Bar Soaps", slug: "bar-soaps" },
          { id: 4072, name: "Body Wash", slug: "body-wash" },
          { id: 4073, name: "Hand Soaps", slug: "hand-soaps" },
        ],
      },
      { id: 408, name: "Cloth Wipes", slug: "cloth-wipes" },
    ],
  },
  {
    id: 5,
    name: "Books, Movies & Music",
    slug: "books-movies-and-music",
    children: [
      {
        id: 501,
        name: "Books",
        slug: "books",
        children: [
          { id: 5011, name: "Blank Books", slug: "blank-books" },
          { id: 5012, name: "Book Accessories", slug: "book-accessories" },
          { id: 5013, name: "Coloring Books", slug: "coloring-books" },
          { id: 5014, name: "eBooks", slug: "ebooks" },
          { id: 5015, name: "Journals & Notebooks", slug: "journals-notebooks" },
          { id: 5016, name: "Zines", slug: "zines" },
        ],
      },
      {
        id: 502,
        name: "Movies",
        slug: "movies",
        children: [
          { id: 5021, name: "DVDs", slug: "dvds" },
          { id: 5022, name: "VHS", slug: "vhs" },
        ],
      },
      {
        id: 503,
        name: "Music",
        slug: "music",
        children: [
          { id: 5031, name: "CDs", slug: "cds" },
          { id: 5032, name: "Cassettes", slug: "cassettes" },
          { id: 5033, name: "Digital Downloads", slug: "digital-downloads" },
          { id: 5034, name: "Vinyl Records", slug: "vinyl-records" },
        ],
      },
    ],
  },
  {
    id: 6,
    name: "Clothing",
    slug: "clothing",
    children: [
      {
        id: 601,
        name: "Women's Clothing",
        slug: "womens-clothing",
        children: [
          { id: 6011, name: "Activewear", slug: "womens-activewear" },
          { id: 6012, name: "Dresses", slug: "dresses" },
          { id: 6013, name: "Hoodies & Sweatshirts", slug: "womens-hoodies-sweatshirts" },
          { id: 6014, name: "Jackets & Coats", slug: "womens-jackets-coats" },
          { id: 6015, name: "Jumpsuits & Rompers", slug: "jumpsuits-rompers" },
          { id: 6016, name: "Lingerie", slug: "lingerie" },
          { id: 6017, name: "Pants & Capris", slug: "womens-pants-capris" },
          { id: 6018, name: "Shorts", slug: "womens-shorts" },
          { id: 6019, name: "Skirts", slug: "skirts" },
          { id: 6020, name: "Sleepwear", slug: "womens-sleepwear" },
          { id: 6021, name: "Suits & Blazers", slug: "womens-suits-blazers" },
          { id: 6022, name: "Sweaters", slug: "womens-sweaters" },
          { id: 6023, name: "Swimwear", slug: "womens-swimwear" },
          { id: 6024, name: "Tops & Tees", slug: "womens-tops-tees" },
          { id: 6025, name: "Dress Material", slug: "dress-material" },
        ],
      },
      {
        id: 602,
        name: "Men's Clothing",
        slug: "mens-clothing",
        children: [
          { id: 6021, name: "Activewear", slug: "mens-activewear" },
          { id: 6022, name: "Hoodies & Sweatshirts", slug: "mens-hoodies-sweatshirts" },
          { id: 6023, name: "Jackets & Coats", slug: "mens-jackets-coats" },
          { id: 6024, name: "Pants", slug: "mens-pants" },
          { id: 6025, name: "Shirts", slug: "mens-shirts" },
          { id: 6026, name: "Shorts", slug: "mens-shorts" },
          { id: 6027, name: "Sleepwear", slug: "mens-sleepwear" },
          { id: 6028, name: "Suits & Sport Coats", slug: "suits-sport-coats" },
          { id: 6029, name: "Sweaters", slug: "mens-sweaters" },
          { id: 6030, name: "Swimwear", slug: "mens-swimwear" },
          { id: 6031, name: "T-Shirts", slug: "mens-tshirts" },
          { id: 6032, name: "Underwear", slug: "mens-underwear" },
        ],
      },
      {
        id: 603,
        name: "Gender-Neutral Clothing",
        slug: "gender-neutral-clothing",
      },
      {
        id: 604,
        name: "Kids' & Baby Clothing",
        slug: "kids-baby-clothing",
        children: [
          { id: 6041, name: "Boys' Clothing", slug: "boys-clothing" },
          { id: 6042, name: "Girls' Clothing", slug: "girls-clothing" },
          { id: 6043, name: "Gender-Neutral Kids' Clothing", slug: "gender-neutral-kids-clothing" },
          { id: 6044, name: "Baby Clothing", slug: "baby-clothing" },
          { id: 6045, name: "Gender-Neutral Baby Clothing", slug: "gender-neutral-baby-clothing" },
        ],
      },
      {
        id: 605,
        name: "Costumes",
        slug: "costumes",
      },
      {
        id: 606,
        name: "Uniforms",
        slug: "uniforms",
      },
    ],
  },
  {
    id: 7,
    name: "Craft Supplies & Tools",
    slug: "craft-supplies-and-tools",
    children: [
      {
        id: 701,
        name: "Beads, Gems & Cabochons",
        slug: "beads-gems-cabochons",
      },
      {
        id: 702,
        name: "Fabric & Notions",
        slug: "fabric-and-notions",
        children: [
          { id: 7021, name: "Fabric", slug: "fabric" },
          { id: 7022, name: "Interfacing", slug: "interfacing" },
          { id: 7023, name: "Ribbon & Trim", slug: "ribbon-trim" },
          { id: 7024, name: "Sewing Notions", slug: "sewing-notions" },
          { id: 7025, name: "Zippers", slug: "zippers" },
        ],
      },
      {
        id: 703,
        name: "Floral Supplies",
        slug: "floral-supplies",
      },
      {
        id: 704,
        name: "Frames, Hoops & Stands",
        slug: "frames-hoops-stands",
      },
      {
        id: 705,
        name: "Jewelry & Beading Supplies",
        slug: "jewelry-beading-supplies",
        children: [
          { id: 7051, name: "Chains", slug: "chains" },
          { id: 7052, name: "Clasps & Hooks", slug: "clasps-hooks" },
          { id: 7053, name: "Jewelry Findings", slug: "jewelry-findings" },
          { id: 7054, name: "Wire", slug: "wire" },
        ],
      },
      {
        id: 706,
        name: "Patterns & How To",
        slug: "patterns-and-how-to",
        children: [
          { id: 7061, name: "Craft Patterns", slug: "craft-patterns" },
          { id: 7062, name: "Knitting Patterns", slug: "knitting-patterns" },
          { id: 7063, name: "Sewing Patterns", slug: "sewing-patterns" },
        ],
      },
      {
        id: 707,
        name: "Scrapbooking",
        slug: "scrapbooking",
      },
      {
        id: 708,
        name: "Stamping",
        slug: "stamping",
      },
      {
        id: 709,
        name: "Tools & Equipment",
        slug: "tools-and-equipment",
      },
      {
        id: 710,
        name: "Yarn & Fiber",
        slug: "yarn-and-fiber",
        children: [
          { id: 7101, name: "Fiber", slug: "fiber" },
          { id: 7102, name: "Yarn", slug: "yarn" },
        ],
      },
      {
        id: 711,
        name: "Craft Machine Files",
        slug: "craft-machine-files",
        children: [
          { id: 7111, name: "3D Printer Files", slug: "3d-printer-files" },
          { id: 7112, name: "Cutting Machine Files", slug: "cutting-machine-files" },
          { id: 7113, name: "Embroidery Machine Files", slug: "embroidery-machine-files" },
          { id: 7114, name: "Knitting Machine Files", slug: "knitting-machine-files" },
        ],
      },
    ],
  },
  {
    id: 8,
    name: "Electronics & Accessories",
    slug: "electronics-and-accessories",
    children: [
      {
        id: 801,
        name: "Computers & Peripherals",
        slug: "computers-and-peripherals",
        children: [
          { id: 8011, name: "Computer Accessories", slug: "computer-accessories" },
          { id: 8012, name: "Keyboards & Mice", slug: "keyboards-mice" },
          { id: 8013, name: "Monitors & Screens", slug: "monitors-screens" },
        ],
      },
      {
        id: 802,
        name: "Electronics Cases",
        slug: "electronics-cases",
        children: [
          { id: 8021, name: "E-Reader Cases", slug: "e-reader-cases" },
          { id: 8022, name: "Laptop Cases", slug: "laptop-cases" },
          { id: 8023, name: "Phone Cases", slug: "phone-cases" },
          { id: 8024, name: "Tablet Cases", slug: "tablet-cases" },
        ],
      },
      {
        id: 803,
        name: "Gadgets",
        slug: "gadgets",
      },
      {
        id: 804,
        name: "Video Games",
        slug: "video-games",
      },
      {
        id: 805,
        name: "Car Accessories",
        slug: "car-accessories",
        children: [
          { id: 8051, name: "Car Air Fresheners", slug: "car-air-fresheners" },
          { id: 8052, name: "Car Charms", slug: "car-charms" },
          { id: 8053, name: "Car Coasters", slug: "car-coasters" },
          { id: 8054, name: "Key Fob Covers", slug: "key-fob-covers" },
          { id: 8055, name: "License Plate Covers & Frames", slug: "license-plate-covers-frames" },
          { id: 8056, name: "Seat Covers", slug: "seat-covers" },
          { id: 8057, name: "Steering Wheel Covers", slug: "steering-wheel-covers" },
        ],
      },
    ],
  },
  {
    id: 9,
    name: "Home & Living",
    slug: "home-and-living",
    children: [
      {
        id: 901,
        name: "Bathroom",
        slug: "bathroom",
        children: [
          { id: 9011, name: "Bath Mats & Rugs", slug: "bath-mats-rugs" },
          { id: 9012, name: "Bathroom Storage", slug: "bathroom-storage" },
          { id: 9013, name: "Shower Curtains", slug: "shower-curtains" },
          { id: 9014, name: "Soap Dispensers", slug: "soap-dispensers" },
          { id: 9015, name: "Towels", slug: "towels" },
        ],
      },
      {
        id: 902,
        name: "Bedding",
        slug: "bedding",
        children: [
          { id: 9021, name: "Blankets & Throws", slug: "blankets-throws" },
          { id: 9022, name: "Duvet Covers", slug: "duvet-covers" },
          { id: 9023, name: "Pillowcases", slug: "pillowcases" },
          { id: 9024, name: "Quilts", slug: "quilts-bedding" },
          { id: 9025, name: "Sheet Sets", slug: "sheet-sets" },
          { id: 9026, name: "Bedspreads", slug: "bedspreads" },
        ],
      },
      {
        id: 903,
        name: "Food & Drink",
        slug: "food-and-drink",
        children: [
          { id: 9031, name: "Baked Goods", slug: "baked-goods" },
          { id: 9032, name: "Candy", slug: "candy" },
          { id: 9033, name: "Coffee", slug: "coffee" },
          { id: 9034, name: "Herbs & Spices", slug: "herbs-spices" },
          { id: 9035, name: "Tea", slug: "tea" },
        ],
      },
      {
        id: 904,
        name: "Furniture",
        slug: "furniture",
        children: [
          { id: 9041, name: "Beds & Headboards", slug: "beds-headboards" },
          { id: 9042, name: "Benches & Ottomans", slug: "benches-ottomans" },
          { id: 9043, name: "Bookcases & Shelving", slug: "bookcases-shelving" },
          { id: 9044, name: "Cabinets & Cupboards", slug: "cabinets-cupboards" },
          { id: 9045, name: "Chairs", slug: "chairs" },
          { id: 9046, name: "Desks", slug: "desks" },
          { id: 9047, name: "Dressers & Armoires", slug: "dressers-armoires" },
          { id: 9048, name: "Entryway & Mudroom Furniture", slug: "entryway-mudroom-furniture" },
          { id: 9049, name: "Sofas & Loveseats", slug: "sofas-loveseats" },
          { id: 9050, name: "Tables", slug: "tables" },
          { id: 9051, name: "Hall Trees", slug: "hall-trees" },
          { id: 9052, name: "Standing Coat Racks", slug: "standing-coat-racks" },
          { id: 9053, name: "Umbrella Stands", slug: "umbrella-stands" },
          { id: 9054, name: "Filing Cabinets", slug: "filing-cabinets" },
        ],
      },
      {
        id: 905,
        name: "Home Decor",
        slug: "home-decor",
        children: [
          { id: 9051, name: "Candles & Holders", slug: "candles-holders" },
          { id: 9052, name: "Clocks", slug: "clocks" },
          { id: 9053, name: "Mirrors", slug: "mirrors" },
          { id: 9054, name: "Picture Frames", slug: "picture-frames" },
          { id: 9055, name: "Vases", slug: "vases" },
          { id: 9056, name: "Wall Art", slug: "wall-art" },
          { id: 9057, name: "Wreaths", slug: "wreaths" },
        ],
      },
      {
        id: 906,
        name: "Kitchen & Dining",
        slug: "kitchen-and-dining",
        children: [
          { id: 9061, name: "Bakeware", slug: "bakeware" },
          { id: 9062, name: "Barware", slug: "barware" },
          { id: 9063, name: "Cookware", slug: "cookware" },
          { id: 9064, name: "Dining & Serving", slug: "dining-serving" },
          { id: 9065, name: "Drinkware", slug: "drinkware" },
          { id: 9066, name: "Kitchen Storage", slug: "kitchen-storage" },
          { id: 9067, name: "Linens", slug: "linens" },
          { id: 9068, name: "Utensils & Gadgets", slug: "utensils-gadgets" },
          { id: 9069, name: "Oven Mitts", slug: "oven-mitts" },
          { id: 9070, name: "Napkin Rings", slug: "napkin-rings" },
          { id: 9071, name: "Mug Rugs", slug: "mug-rugs" },
        ],
      },
      {
        id: 907,
        name: "Lighting",
        slug: "lighting",
        children: [
          { id: 9071, name: "Chandeliers", slug: "chandeliers" },
          { id: 9072, name: "Lamp Shades", slug: "lamp-shades" },
          { id: 9073, name: "Lamps", slug: "lamps" },
          { id: 9074, name: "Night Lights", slug: "night-lights" },
          { id: 9075, name: "Pendant Lights", slug: "pendant-lights" },
          { id: 9076, name: "Sconces", slug: "sconces" },
          { id: 9077, name: "String Lights", slug: "string-lights" },
          { id: 9078, name: "Garden Lights", slug: "garden-lights" },
          { id: 9079, name: "Pathway Lights", slug: "pathway-lights" },
          { id: 9080, name: "Post Lights", slug: "post-lights" },
          { id: 9081, name: "Step Lights", slug: "step-lights" },
          { id: 9082, name: "Deck Lights", slug: "deck-lights" },
        ],
      },
      {
        id: 908,
        name: "Office",
        slug: "office",
        children: [
          { id: 9081, name: "Calendars & Planners", slug: "calendars-planners" },
          { id: 9082, name: "Desk Accessories", slug: "desk-accessories" },
          { id: 9083, name: "Office Storage", slug: "office-storage" },
          { id: 9084, name: "Desk Name Plates", slug: "desk-name-plates" },
        ],
      },
      {
        id: 909,
        name: "Outdoor & Garden",
        slug: "outdoor-and-garden",
        children: [
          { id: 9091, name: "Fire Pits", slug: "fire-pits" },
          { id: 9092, name: "Garden Decor", slug: "garden-decor" },
          { id: 9093, name: "Outdoor Furniture", slug: "outdoor-furniture" },
          { id: 9094, name: "Planters & Pots", slug: "planters-pots" },
          { id: 9095, name: "Door Mats", slug: "door-mats" },
        ],
      },
      {
        id: 910,
        name: "Rugs",
        slug: "rugs",
        children: [
          { id: 9101, name: "Area Rugs", slug: "area-rugs" },
          { id: 9102, name: "Floor Runners", slug: "floor-runners" },
        ],
      },
      {
        id: 911,
        name: "Spirituality & Religion",
        slug: "spirituality-and-religion",
      },
      {
        id: 912,
        name: "Storage & Organization",
        slug: "storage-and-organization",
        children: [
          { id: 9121, name: "Baskets", slug: "baskets" },
          { id: 9122, name: "Boxes & Bins", slug: "boxes-bins" },
          { id: 9123, name: "Hooks & Fixtures", slug: "hooks-fixtures" },
        ],
      },
      {
        id: 913,
        name: "Window Treatments",
        slug: "window-treatments",
        children: [
          { id: 9131, name: "Curtains", slug: "curtains" },
          { id: 9132, name: "Valances", slug: "valances" },
        ],
      },
    ],
  },
  {
    id: 10,
    name: "Jewelry",
    slug: "jewelry",
    children: [
      {
        id: 1001,
        name: "Anklets",
        slug: "anklets",
      },
      {
        id: 1002,
        name: "Body Jewelry",
        slug: "body-jewelry",
      },
      {
        id: 1003,
        name: "Bracelets",
        slug: "bracelets",
        children: [
          { id: 10031, name: "Bangles", slug: "bangles" },
          { id: 10032, name: "Beaded Bracelets", slug: "beaded-bracelets" },
          { id: 10033, name: "Chain & Link Bracelets", slug: "chain-link-bracelets" },
          { id: 10034, name: "Charm Bracelets", slug: "charm-bracelets" },
          { id: 10035, name: "Cuffs", slug: "cuffs" },
          { id: 10036, name: "Woven & Braided Bracelets", slug: "woven-braided-bracelets" },
        ],
      },
      {
        id: 1004,
        name: "Brooches",
        slug: "brooches-jewelry",
      },
      {
        id: 1005,
        name: "Earrings",
        slug: "earrings",
        children: [
          { id: 10051, name: "Chandelier Earrings", slug: "chandelier-earrings" },
          { id: 10052, name: "Clip-On Earrings", slug: "clip-on-earrings" },
          { id: 10053, name: "Dangle & Drop Earrings", slug: "dangle-drop-earrings" },
          { id: 10054, name: "Ear Jackets & Climbers", slug: "ear-jackets-climbers" },
          { id: 10055, name: "Hoop Earrings", slug: "hoop-earrings" },
          { id: 10056, name: "Stud Earrings", slug: "stud-earrings" },
          { id: 10057, name: "Threader Earrings", slug: "threader-earrings" },
        ],
      },
      {
        id: 1006,
        name: "Jewelry Sets",
        slug: "jewelry-sets",
      },
      {
        id: 1007,
        name: "Necklaces",
        slug: "necklaces",
        children: [
          { id: 10071, name: "Bib Necklaces", slug: "bib-necklaces" },
          { id: 10072, name: "Chains", slug: "chains-necklaces" },
          { id: 10073, name: "Charm Necklaces", slug: "charm-necklaces" },
          { id: 10074, name: "Chokers", slug: "chokers" },
          { id: 10075, name: "Lockets", slug: "lockets" },
          { id: 10076, name: "Pendants", slug: "pendants" },
          { id: 10077, name: "Statement Necklaces", slug: "statement-necklaces" },
        ],
      },
      {
        id: 1008,
        name: "Rings",
        slug: "rings",
        children: [
          { id: 10081, name: "Bands", slug: "bands" },
          { id: 10082, name: "Engagement Rings", slug: "engagement-rings" },
          { id: 10083, name: "Midi Rings", slug: "midi-rings" },
          { id: 10084, name: "Promise Rings", slug: "promise-rings" },
          { id: 10085, name: "Signet Rings", slug: "signet-rings" },
          { id: 10086, name: "Stackable Rings", slug: "stackable-rings" },
          { id: 10087, name: "Statement Rings", slug: "statement-rings" },
          { id: 10088, name: "Wedding Rings", slug: "wedding-rings" },
        ],
      },
      {
        id: 1009,
        name: "Watches",
        slug: "watches",
      },
    ],
  },
  {
    id: 11,
    name: "Paper & Party Supplies",
    slug: "paper-and-party-supplies",
    children: [
      {
        id: 1101,
        name: "Calendars",
        slug: "calendars",
        children: [
          { id: 11011, name: "Desk Calendars", slug: "desk-calendars" },
          { id: 11012, name: "Pocket Calendars", slug: "pocket-calendars" },
          { id: 11013, name: "Wall Calendars", slug: "wall-calendars" },
        ],
      },
      {
        id: 1102,
        name: "Gift Wrapping",
        slug: "gift-wrapping",
        children: [
          { id: 11021, name: "Gift Bags", slug: "gift-bags" },
          { id: 11022, name: "Gift Boxes", slug: "gift-boxes" },
          { id: 11023, name: "Gift Tags", slug: "gift-tags" },
          { id: 11024, name: "Tissue Paper", slug: "tissue-paper" },
          { id: 11025, name: "Wrapping Paper", slug: "wrapping-paper" },
        ],
      },
      {
        id: 1103,
        name: "Invitations & Announcements",
        slug: "invitations-and-announcements",
        children: [
          { id: 11031, name: "Birthday Invitations", slug: "birthday-invitations" },
          { id: 11032, name: "Graduation Announcements", slug: "graduation-announcements" },
          { id: 11033, name: "Holiday Cards", slug: "holiday-cards" },
          { id: 11034, name: "Save the Dates", slug: "save-the-dates" },
          { id: 11035, name: "Wedding Invitations", slug: "wedding-invitations" },
        ],
      },
      {
        id: 1104,
        name: "Paper",
        slug: "paper",
        children: [
          { id: 11041, name: "Letterhead", slug: "letterhead" },
          { id: 11042, name: "Stationery", slug: "stationery" },
        ],
      },
      {
        id: 1105,
        name: "Party Decorations",
        slug: "party-decorations",
        children: [
          { id: 11051, name: "Balloons", slug: "balloons" },
          { id: 11052, name: "Banners & Signs", slug: "banners-signs" },
          { id: 11053, name: "Cake Toppers", slug: "cake-toppers" },
          { id: 11054, name: "Confetti", slug: "confetti" },
          { id: 11055, name: "Party Hats", slug: "party-hats" },
          { id: 11056, name: "Streamers", slug: "streamers" },
        ],
      },
      {
        id: 1106,
        name: "Party Favors",
        slug: "party-favors",
      },
      {
        id: 1107,
        name: "Stickers, Labels & Tags",
        slug: "stickers-labels-and-tags",
        children: [
          { id: 11071, name: "Labels", slug: "labels" },
          { id: 11072, name: "Stickers", slug: "stickers" },
          { id: 11073, name: "Tags", slug: "tags" },
        ],
      },
      {
        id: 1108,
        name: "Templates",
        slug: "templates",
        children: [
          { id: 11081, name: "Architectural & Drafting Templates", slug: "architectural-drafting-templates" },
          { id: 11082, name: "Bookkeeping Templates", slug: "bookkeeping-templates" },
          { id: 11083, name: "Chore Chart Templates", slug: "chore-chart-templates" },
          { id: 11084, name: "Contract & Agreement Templates", slug: "contract-agreement-templates" },
          { id: 11085, name: "Event Program Templates", slug: "event-program-templates" },
          { id: 11086, name: "Gift Tag Templates", slug: "gift-tag-templates" },
          { id: 11087, name: "Greeting Card Templates", slug: "greeting-card-templates" },
          { id: 11088, name: "Journal Templates", slug: "journal-templates" },
          { id: 11089, name: "Menu Templates", slug: "menu-templates" },
          { id: 11090, name: "Newsletter Templates", slug: "newsletter-templates" },
          { id: 11091, name: "Personal Finance Templates", slug: "personal-finance-templates" },
          { id: 11092, name: "Planner Templates", slug: "planner-templates" },
          { id: 11093, name: "Social Media Templates", slug: "social-media-templates" },
          { id: 11094, name: "Flashcards", slug: "flashcards" },
          { id: 11095, name: "Study Guides", slug: "study-guides" },
          { id: 11096, name: "Worksheets", slug: "worksheets" },
        ],
      },
    ],
  },
  {
    id: 12,
    name: "Pet Supplies",
    slug: "pet-supplies",
    children: [
      {
        id: 1201,
        name: "Pet Beds & Crates",
        slug: "pet-beds-and-crates",
      },
      {
        id: 1202,
        name: "Pet Clothing",
        slug: "pet-clothing",
        children: [
          { id: 12021, name: "Dog Clothing", slug: "dog-clothing" },
          { id: 12022, name: "Cat Clothing", slug: "cat-clothing" },
        ],
      },
      {
        id: 1203,
        name: "Pet Collars & Leashes",
        slug: "pet-collars-and-leashes",
      },
      {
        id: 1204,
        name: "Pet Feeding",
        slug: "pet-feeding",
      },
      {
        id: 1205,
        name: "Pet Furniture",
        slug: "pet-furniture",
      },
      {
        id: 1206,
        name: "Pet Grooming",
        slug: "pet-grooming",
      },
      {
        id: 1207,
        name: "Pet Memorials",
        slug: "pet-memorials",
      },
      {
        id: 1208,
        name: "Pet Toys",
        slug: "pet-toys",
      },
      {
        id: 1209,
        name: "Pet Treats",
        slug: "pet-treats",
      },
    ],
  },
  {
    id: 13,
    name: "Shoes",
    slug: "shoes",
    children: [
      {
        id: 1301,
        name: "Women's Shoes",
        slug: "womens-shoes",
        children: [
          { id: 13011, name: "Boots", slug: "womens-boots" },
          { id: 13012, name: "Flats", slug: "flats" },
          { id: 13013, name: "Heels", slug: "heels" },
          { id: 13014, name: "Oxfords & Tie Shoes", slug: "womens-oxfords" },
          { id: 13015, name: "Sandals", slug: "womens-sandals" },
          { id: 13016, name: "Slippers", slug: "womens-slippers" },
          { id: 13017, name: "Sneakers & Athletic", slug: "womens-sneakers" },
          { id: 13018, name: "Wedges", slug: "wedges" },
        ],
      },
      {
        id: 1302,
        name: "Men's Shoes",
        slug: "mens-shoes",
        children: [
          { id: 13021, name: "Boots", slug: "mens-boots" },
          { id: 13022, name: "Loafers & Slip-Ons", slug: "loafers-slip-ons" },
          { id: 13023, name: "Oxfords & Tie Shoes", slug: "mens-oxfords" },
          { id: 13024, name: "Sandals", slug: "mens-sandals" },
          { id: 13025, name: "Slippers", slug: "mens-slippers" },
          { id: 13026, name: "Sneakers & Athletic", slug: "mens-sneakers" },
        ],
      },
      {
        id: 1303,
        name: "Kids' Shoes",
        slug: "kids-shoes",
        children: [
          { id: 13031, name: "Baby Shoes", slug: "baby-shoes" },
          { id: 13032, name: "Boys' Shoes", slug: "boys-shoes" },
          { id: 13033, name: "Girls' Shoes", slug: "girls-shoes" },
        ],
      },
      {
        id: 1304,
        name: "Shoe Accessories",
        slug: "shoe-accessories",
        children: [
          { id: 13041, name: "Boot Cuffs", slug: "boot-cuffs" },
          { id: 13042, name: "Insoles & Inserts", slug: "insoles-inserts" },
          { id: 13043, name: "Shoe Care", slug: "shoe-care" },
          { id: 13044, name: "Shoe Clips", slug: "shoe-clips" },
          { id: 13045, name: "Shoelaces", slug: "shoelaces" },
        ],
      },
    ],
  },
  {
    id: 14,
    name: "Toys & Games",
    slug: "toys-and-games",
    children: [
      {
        id: 1401,
        name: "Art & Creativity",
        slug: "art-and-creativity",
      },
      {
        id: 1402,
        name: "Dolls & Action Figures",
        slug: "dolls-and-action-figures",
        children: [
          { id: 14021, name: "Action Figures", slug: "action-figures" },
          { id: 14022, name: "Doll Accessories", slug: "doll-accessories" },
          { id: 14023, name: "Dolls", slug: "dolls" },
          { id: 14024, name: "Dollhouses", slug: "dollhouses" },
          { id: 14025, name: "Doll Shoes", slug: "doll-shoes" },
        ],
      },
      {
        id: 1403,
        name: "Games & Puzzles",
        slug: "games-and-puzzles",
        children: [
          { id: 14031, name: "Board Games", slug: "board-games" },
          { id: 14032, name: "Card Games", slug: "card-games" },
          { id: 14033, name: "Puzzles", slug: "puzzles" },
        ],
      },
      {
        id: 1404,
        name: "Learning & School",
        slug: "learning-and-school",
      },
      {
        id: 1405,
        name: "Outdoor & Active Play",
        slug: "outdoor-and-active-play",
        children: [
          { id: 14051, name: "Cornhole", slug: "cornhole" },
          { id: 14052, name: "Kites & Pinwheels", slug: "kites-pinwheels" },
          { id: 14053, name: "Lawn Games", slug: "lawn-games" },
        ],
      },
      {
        id: 1406,
        name: "Pretend Play",
        slug: "pretend-play",
      },
      {
        id: 1407,
        name: "Sports & Outdoor Recreation",
        slug: "sports-and-outdoor-recreation",
        children: [
          { id: 14071, name: "Roller Skate Accessories", slug: "roller-skate-accessories", children: [
            { id: 140711, name: "Skate Leashes", slug: "skate-leashes" },
            { id: 140712, name: "Toe Guards", slug: "toe-guards" },
          ]},
        ],
      },
      {
        id: 1408,
        name: "Stuffed Animals & Plushies",
        slug: "stuffed-animals-and-plushies",
      },
      {
        id: 1409,
        name: "Vehicles & Remote Control",
        slug: "vehicles-and-remote-control",
      },
      { id: 1410, name: "Compasses", slug: "compasses" },
    ],
  },
  {
    id: 15,
    name: "Weddings",
    slug: "weddings",
    children: [
      {
        id: 1501,
        name: "Accessories",
        slug: "wedding-accessories",
        children: [
          { id: 15011, name: "Belts & Sashes", slug: "wedding-belts-sashes" },
          { id: 15012, name: "Flower Girl Accessories", slug: "flower-girl-accessories" },
          { id: 15013, name: "Garters", slug: "garters" },
          { id: 15014, name: "Gloves & Sleeves", slug: "wedding-gloves-sleeves" },
          { id: 15015, name: "Hair Accessories", slug: "wedding-hair-accessories" },
          { id: 15016, name: "Ring Bearer Accessories", slug: "ring-bearer-accessories" },
          { id: 15017, name: "Veils", slug: "wedding-veils" },
        ],
      },
      {
        id: 1502,
        name: "Ceremony Supplies",
        slug: "ceremony-supplies",
        children: [
          { id: 15021, name: "Aisle Runners", slug: "aisle-runners" },
          { id: 15022, name: "Altar Decorations", slug: "altar-decorations" },
          { id: 15023, name: "Ring Pillows & Boxes", slug: "ring-pillows-boxes" },
          { id: 15024, name: "Unity Candles", slug: "unity-candles" },
        ],
      },
      {
        id: 1503,
        name: "Decorations",
        slug: "wedding-decorations",
        children: [
          { id: 15031, name: "Backdrops & Arches", slug: "backdrops-arches" },
          { id: 15032, name: "Banners & Signs", slug: "wedding-banners-signs" },
          { id: 15033, name: "Centerpieces", slug: "centerpieces" },
          { id: 15034, name: "Table Numbers", slug: "table-numbers" },
        ],
      },
      {
        id: 1504,
        name: "Dresses",
        slug: "wedding-dresses",
        children: [
          { id: 15041, name: "Bridal Gowns", slug: "bridal-gowns" },
          { id: 15042, name: "Bridesmaid Dresses", slug: "bridesmaid-dresses" },
          { id: 15043, name: "Flower Girl Dresses", slug: "flower-girl-dresses" },
          { id: 15044, name: "Mother of the Bride", slug: "mother-of-the-bride" },
        ],
      },
      {
        id: 1505,
        name: "Gifts & Mementos",
        slug: "wedding-gifts-and-mementos",
        children: [
          { id: 15051, name: "Bridesmaid Gifts", slug: "bridesmaid-gifts" },
          { id: 15052, name: "Gifts for the Couple", slug: "gifts-for-the-couple" },
          { id: 15053, name: "Groomsmen Gifts", slug: "groomsmen-gifts" },
          { id: 15054, name: "Guest Books", slug: "guest-books" },
        ],
      },
      {
        id: 1506,
        name: "Invitations & Paper",
        slug: "wedding-invitations-and-paper",
        children: [
          { id: 15061, name: "Invitations", slug: "wedding-invitations" },
          { id: 15062, name: "Programs", slug: "wedding-programs" },
          { id: 15063, name: "Save the Dates", slug: "wedding-save-the-dates" },
          { id: 15064, name: "Thank You Cards", slug: "wedding-thank-you-cards" },
        ],
      },
      {
        id: 1507,
        name: "Party Favors",
        slug: "wedding-party-favors",
      },
    ],
  },
  {
    id: 16,
    name: "Baby",
    slug: "baby",
    children: [
      {
        id: 1601,
        name: "Baby Care",
        slug: "baby-care",
      },
      {
        id: 1602,
        name: "Nursery Decor",
        slug: "nursery-decor",
      },
      {
        id: 1603,
        name: "Nursery Furniture",
        slug: "nursery-furniture",
      },
      {
        id: 1604,
        name: "Baby Clothing",
        slug: "baby-clothing-category",
      },
      {
        id: 1605,
        name: "Teething",
        slug: "teething",
      },
      {
        id: 1606,
        name: "Diapering",
        slug: "diapering",
      },
    ],
  },
  {
    id: 17,
    name: "Gifts",
    slug: "gifts",
    children: [
      {
        id: 1701,
        name: "Gifts for Her",
        slug: "gifts-for-her",
      },
      {
        id: 1702,
        name: "Gifts for Him",
        slug: "gifts-for-him",
      },
      {
        id: 1703,
        name: "Gifts for Kids",
        slug: "gifts-for-kids",
      },
      {
        id: 1704,
        name: "Gifts for Pets",
        slug: "gifts-for-pets",
      },
      {
        id: 1705,
        name: "Gift Cards",
        slug: "gift-cards",
      },
      {
        id: 1706,
        name: "Personalized Gifts",
        slug: "personalized-gifts",
      },
    ],
  },
];

// Additional category for digital goods (Tari Market specific)
export const DIGITAL_GOODS_CATEGORY: Category = {
  id: 100,
  name: "Digital Goods",
  slug: "digital-goods",
  children: [
    { id: 10001, name: "VPN & Privacy Services", slug: "vpn-privacy-services" },
    { id: 10002, name: "Software & Apps", slug: "software-apps" },
    { id: 10003, name: "eBooks & Guides", slug: "ebooks-guides" },
    { id: 10004, name: "Courses & Tutorials", slug: "courses-tutorials" },
    { id: 10005, name: "Digital Art & Graphics", slug: "digital-art-graphics" },
    { id: 10006, name: "Music & Audio", slug: "music-audio" },
    { id: 10007, name: "Video Content", slug: "video-content" },
    { id: 10008, name: "Website Templates", slug: "website-templates" },
    { id: 10009, name: "Fonts & Typography", slug: "fonts-typography" },
    { id: 10010, name: "Stock Photography", slug: "stock-photography" },
    { id: 10011, name: "3D Models", slug: "3d-models" },
    { id: 10012, name: "Game Assets", slug: "game-assets" },
  ],
};

// Services category (Tari Market specific)
export const SERVICES_CATEGORY: Category = {
  id: 101,
  name: "Services",
  slug: "services",
  children: [
    { id: 10101, name: "Consulting", slug: "consulting" },
    { id: 10102, name: "Design Services", slug: "design-services" },
    { id: 10103, name: "Writing & Translation", slug: "writing-translation" },
    { id: 10104, name: "Programming & Tech", slug: "programming-tech" },
    { id: 10105, name: "Marketing", slug: "marketing" },
    { id: 10106, name: "Music & Audio", slug: "music-audio-services" },
    { id: 10107, name: "Video & Animation", slug: "video-animation" },
    { id: 10108, name: "Business", slug: "business-services" },
    { id: 10109, name: "Lifestyle", slug: "lifestyle-services" },
    { id: 10110, name: "Privacy & Security", slug: "privacy-security-services" },
  ],
};

// Combine all categories
export const ALL_CATEGORIES: Category[] = [
  ...CATEGORIES,
  DIGITAL_GOODS_CATEGORY,
  SERVICES_CATEGORY,
];

// Helper function to get all categories as a flat list
export const getFlatCategories = (categories: Category[] = ALL_CATEGORIES): Category[] => {
  const flat: Category[] = [];
  
  const flatten = (cats: Category[]) => {
    cats.forEach(cat => {
      flat.push(cat);
      if (cat.children) {
        flatten(cat.children);
      }
    });
  };
  
  flatten(categories);
  return flat;
};

// Helper function to find a category by slug
export const findCategoryBySlug = (slug: string, categories: Category[] = ALL_CATEGORIES): Category | undefined => {
  for (const category of categories) {
    if (category.slug === slug) {
      return category;
    }
    if (category.children) {
      const found = findCategoryBySlug(slug, category.children);
      if (found) return found;
    }
  }
  return undefined;
};

// Helper function to get category path (breadcrumb)
export const getCategoryPath = (slug: string, categories: Category[] = ALL_CATEGORIES): Category[] => {
  const path: Category[] = [];
  
  const findPath = (cats: Category[], target: string): boolean => {
    for (const cat of cats) {
      if (cat.slug === target) {
        path.push(cat);
        return true;
      }
      if (cat.children) {
        if (findPath(cat.children, target)) {
          path.unshift(cat);
          return true;
        }
      }
    }
    return false;
  };
  
  findPath(categories, slug);
  return path;
};
