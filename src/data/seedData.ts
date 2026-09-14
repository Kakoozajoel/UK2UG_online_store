import { Product, Category, District, Order, ImportRequest, Review, Customer, ChatMessage, Complaint } from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-tech', name: 'UK Tech & Electronics' },
  { id: 'cat-beauty', name: 'Beauty & Luxury Styling' },
  { id: 'cat-fashion', name: 'Premium Apparel & Bags' },
  { id: 'cat-food', name: 'Gourmet Treats & Tea' },
  { id: 'cat-wellness', name: 'Wellness & Aromatherapy' },
];

export const INITIAL_DISTRICTS: District[] = [
  { name: 'Kampala', fee: 5000 },
  { name: 'Wakiso', fee: 8000 },
  { name: 'Mukono', fee: 10000 },
  { name: 'Jinja', fee: 15000 },
  { name: 'Mbarara', fee: 18000 },
  { name: 'Gulu', fee: 20000 },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-pre-1',
    sku: 'UK-TECH-001',
    title: 'Apple iPhone 16 Pro Max 256GB Desert Titanium (UK Spec)',
    brand: 'Apple UK',
    categoryId: 'cat-tech',
    basePrice: 6200000,
    originalPrice: 6800000,
    quantity: 10,
    features: [
      'Official Apple Regent Street London Receipt',
      'UK SIM-Free Factory Unlocked',
      'Apple 1-Year Worldwide Warranty',
      'Desert Titanium Grade 5 Alloy'
    ],
    description: 'Direct procurement from Apple Regent Street London. Brand new sealed unit with UK SIM-free carrier unlocked firmware, 3-pin USB-C power delivery specification, and Apple international guarantee.',
    images: [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&q=80&w=1000',
    ],
    inTheBox: ['Apple iPhone 16 Pro Max 256GB Sealed', 'USB-C Braided Fast Charge Cable', 'Original UK VAT Sourcing Receipt', '1-Year International Apple Warranty'],
    sourcingSpecs: [
      { key: 'Product SKU', value: 'UK-TECH-001' },
      { key: 'Sourcing Store', value: 'Apple Regent St, London W1B 2EL' },
      { key: 'Air Freight Cargo', value: 'British Airways World Cargo (BA063)' },
      { key: 'Arrival Terminal', value: 'Entebbe International Airport Cargo' },
      { key: 'Warranty', value: '1-Year Apple Worldwide Warranty' },
    ],
    rating: 5.0,
    isPreOrder: true,
    preOrderStatus: 'In Transit to Entebbe',
    preOrderEstimatedArrival: '2026-09-24',
    preOrderDepositPercent: 50,
    preOrderTotalSlots: 10,
    preOrderClaimedSlots: 7,
    preOrderBatchNote: 'Air cargo pallet on British Airways BA063. Authentic Apple Regent St stock with UK VAT receipts.',
  },
  {
    id: 'prod-pre-2',
    sku: 'UK-BEAU-002',
    title: 'Dyson Airwrap Multi-Styler Complete Long (UK Nickel/Copper)',
    brand: 'Dyson UK',
    categoryId: 'cat-beauty',
    basePrice: 2850000,
    originalPrice: 3200000,
    quantity: 8,
    features: [
      'Authentic UK 3-Pin Fused Plug (230V)',
      'Harrods & Boots Oxford Street Receipt',
      '2-Year Official Dyson UK Guarantee',
      'Complete Long Barrels & Storage Case'
    ],
    description: 'Engineered for multiple hair types and styles. Sourced directly from Harrods and Boots UK Oxford Street. Authentic British 230V model with genuine UK 3-pin fused plug.',
    images: [
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1000',
    ],
    inTheBox: ['Dyson Airwrap Complete Long Unit', 'Coanda Smoothing Dryer', '30mm & 40mm Airwrap Barrels', 'Firm & Soft Smoothing Brushes', 'Prussian Blue Storage Case'],
    sourcingSpecs: [
      { key: 'Product SKU', value: 'UK-BEAU-002' },
      { key: 'Sourcing Store', value: 'Harrods London Knightsbridge' },
      { key: 'Plug Type', value: 'UK Standard 3-Pin Fused Plug (230V)' },
      { key: 'Air Cargo Status', value: 'Consolidation at West London Depot' },
      { key: 'Warranty', value: '2-Year Dyson UK Guarantee' },
    ],
    rating: 4.9,
    isPreOrder: true,
    preOrderStatus: 'Taking Pre-Orders',
    preOrderEstimatedArrival: '2026-09-30',
    preOrderDepositPercent: 50,
    preOrderTotalSlots: 8,
    preOrderClaimedSlots: 3,
    preOrderBatchNote: 'Oxford Street Harrods & Boots UK allocation. Features UK 3-pin plug.',
  },
  {
    id: 'prod-pre-3',
    sku: 'UK-TECH-003',
    title: 'Sony PlayStation 5 Pro 2TB Digital Edition (UK Model)',
    brand: 'Sony UK',
    categoryId: 'cat-tech',
    basePrice: 4300000,
    originalPrice: 4700000,
    quantity: 5,
    features: [
      'Currys UK Sales Provenance & Till Slip',
      '2TB High-Speed SSD & Enhanced GPU',
      'UK 3-Pin AC Power Cord Included',
      'PlayStation Spectral Super Resolution'
    ],
    description: 'Upgraded PlayStation 5 Pro with enhanced GPU, advanced ray tracing, and PlayStation Spectral Super Resolution (PSSR). Brand new UK stock with Currys UK sales provenance.',
    images: [
      'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=1000',
    ],
    inTheBox: ['PS5 Pro Console with 2TB SSD', 'DualSense Wireless Controller', 'HDMI 2.1 Cable', 'UK 3-Pin AC Power Cord', 'Astro’s Playroom Pre-installed'],
    sourcingSpecs: [
      { key: 'Product SKU', value: 'UK-TECH-003' },
      { key: 'Sourcing Store', value: 'Currys PC World, London' },
      { key: 'Current Hub', value: 'Entebbe Cargo Hub' },
      { key: 'Clearance', value: 'URA Customs Handling' },
    ],
    rating: 5.0,
    isPreOrder: true,
    preOrderStatus: 'Clearing Customs',
    preOrderEstimatedArrival: '2026-09-18',
    preOrderDepositPercent: 100,
    preOrderTotalSlots: 5,
    preOrderClaimedSlots: 5,
    preOrderBatchNote: 'Entebbe Airport Cargo Terminal; URA customs tax assessment in final stage.',
  },
  {
    id: 'prod-stock-1',
    sku: 'UK-TECH-004',
    title: 'Apple MacBook Air 13-inch M3 Chip (16GB RAM / 512GB SSD) Midnight',
    brand: 'Apple UK',
    categoryId: 'cat-tech',
    basePrice: 5400000,
    originalPrice: 5900000,
    quantity: 4,
    features: [
      'Apple M3 Silicon with 16GB Unified Memory',
      'UK British Keyboard Layout',
      'Official UK Apple Store VAT Receipt',
      '18-Hour Battery Life & Liquid Retina'
    ],
    description: 'Lightning-fast Apple M3 chip in an impossibly thin aluminum enclosure. UK keyboard layout, 18 hours of battery life, Liquid Retina display, and 1080p FaceTime HD camera.',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&q=80&w=1000',
    ],
    inTheBox: ['MacBook Air 13-inch M3', '35W Dual USB-C Port Compact UK Power Adapter', 'USB-C to MagSafe 3 Cable (2m)', 'Official Apple Store Receipt'],
    sourcingSpecs: [
      { key: 'Product SKU', value: 'UK-TECH-004' },
      { key: 'Status', value: 'In Stock at Kampala Hub' },
      { key: 'Location', value: 'Thobani Centre, Kampala' },
      { key: 'Dispatch', value: 'Same Day Express Delivery' },
    ],
    rating: 4.9,
    isPreOrder: false,
  },
  {
    id: 'prod-stock-2',
    sku: 'UK-BEAU-005',
    title: 'Creed Aventus Eau de Parfum 100ml (UK Flagship Stock)',
    brand: 'House of Creed',
    categoryId: 'cat-beauty',
    basePrice: 1650000,
    originalPrice: 1850000,
    quantity: 6,
    features: [
      'Creed Mount Street Mayfair Boutique Sourced',
      'Embossed Batch Lot Verification',
      'Full 100ml Sealed Bottle with Certificate',
      'Mayfair Boutique Gift Presentation Bag'
    ],
    description: 'The legendary fragrance celebrating strength, power, and success. Sourced directly from The House of Creed Mayfair boutique in London. Batch verified authentic with original batch number embossed on bottle.',
    images: [
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=80&w=1000',
    ],
    inTheBox: ['Creed Aventus 100ml Bottle Sealed', 'Authenticity Certificate', 'Mayfair Boutique Gift Bag'],
    sourcingSpecs: [
      { key: 'Product SKU', value: 'UK-BEAU-005' },
      { key: 'Boutique', value: 'Creed Boutique, 99 Mount St, London' },
      { key: 'Batch Lot', value: 'Authentic 2026 Millesime' },
      { key: 'Status', value: 'In Stock at Kampala Hub' },
    ],
    rating: 5.0,
    isPreOrder: false,
  }
];

export const INITIAL_REVIEWS: Review[] = [];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_IMPORTS: ImportRequest[] = [];

export const INITIAL_CUSTOMERS: Customer[] = [];

export const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-welcome-1',
    sender: 'admin',
    senderName: 'UK2UG Support Desk',
    userEmail: 'kakoozajoel45@gmail.com',
    userPhone: '0774 540199',
    text: 'Hello Joel! Welcome to UK2UG. Feel free to send us any inquiries about your UK sourcing orders or custom quotes here.',
    timestamp: 'Jul 27, 2026, 08:00 AM',
    readByCustomer: false,
    readByAdmin: true,
  },
];

export const INITIAL_COMPLAINTS: Complaint[] = [
  {
    id: 'UK2UG-CMP-104921',
    customerName: 'Sarah Namubiru',
    customerEmail: 'sarah.n@gmail.com',
    customerPhone: '+256772112233',
    orderId: 'UK2UG-2026-884120',
    category: 'Delayed Delivery',
    priority: 'High',
    subject: 'Air freight parcel delayed beyond promised 5 days',
    description: 'My order of Jo Malone perfume was scheduled for arrival at Thobani Center on Friday. The tracking still shows clearing customs. Please check with Entebbe handlers.',
    status: 'In Progress',
    adminResponse: 'We contacted our Entebbe clearing agent. The customs inspection cleared this morning and rider dispatch is scheduled for 2:00 PM today.',
    createdAt: '2026-09-08T09:30:00Z',
    updatedAt: '2026-09-09T11:00:00Z',
  },
  {
    id: 'UK2UG-CMP-203819',
    customerName: 'David Mukasa',
    customerEmail: 'dmukasa@outlook.com',
    customerPhone: '+256701889944',
    orderId: 'UK2UG-2026-394850',
    category: 'Missing Accessories',
    priority: 'Medium',
    subject: 'UK 3-pin power adapter cable missing from Dyson box',
    description: 'The package arrived sealed, but the genuine Dyson Airwrap box inside was missing the UK 3-pin plug cord. Only the EU plug adapter was included.',
    status: 'Open',
    createdAt: '2026-09-10T14:15:00Z',
  },
  {
    id: 'UK2UG-CMP-301294',
    customerName: 'Grace Akello',
    customerEmail: 'gakello@gmail.com',
    customerPhone: '+256784556677',
    orderId: 'UK2UG-2026-619244',
    category: 'Damaged / Broken Item',
    priority: 'Urgent',
    subject: 'Minor scratch on MacBook Air outer chassis during flight transit',
    description: 'Received the MacBook Air 15-inch yesterday at the pickup desk. While the device works perfectly, there is a small scratch on the outer corner. Requesting store credit or partial refund.',
    status: 'Under Review',
    createdAt: '2026-09-11T16:45:00Z',
  },
  {
    id: 'UK2UG-CMP-409112',
    customerName: 'Brian Kigozi',
    customerEmail: 'briankig@yahoo.com',
    customerPhone: '+256755332211',
    orderId: 'UK2UG-2026-102938',
    category: 'Wrong Item Model',
    priority: 'High',
    subject: 'Received 256GB iPad instead of 512GB Space Grey ordered',
    description: 'We ordered the 512GB iPad Pro M4 from Regent St Apple store, but the package box received shows 256GB.',
    status: 'Resolved',
    adminResponse: 'Replacement 512GB model sourced directly from UK warehouse and exchanged at Thobani Center with UGX 100,000 voucher compensation.',
    resolvedAt: '2026-09-09T16:00:00Z',
    createdAt: '2026-09-05T10:00:00Z',
    updatedAt: '2026-09-09T16:00:00Z',
  }
];


