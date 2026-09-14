export type PreOrderStatus =
  | 'Taking Pre-Orders'
  | 'Procuring in London'
  | 'Air Cargo Flight Scheduled'
  | 'In Transit to Entebbe'
  | 'Clearing Customs'
  | 'Arrived at Kampala Hub'
  | 'Pre-Orders Closed';

export interface Product {
  id: string;
  title: string;
  brand?: string;
  sku?: string; // Product number / SKU e.g. UK-TECH-001
  productUrl?: string;
  description: string;
  basePrice: number; // in UGX
  quantity: number; // Stock level
  categoryId: string;
  images: string[]; // up to 6 images
  inTheBox: string[];
  features?: string[]; // Product features / key highlights
  sourcingSpecs: { key: string; value: string }[];
  originalPrice?: number; // if discounted, basePrice is current price, originalPrice is the strike-through
  isFlashDeal?: boolean;
  flashDealEnd?: string; // ISO date string
  rating: number;
  // Pre-Order Attributes
  isPreOrder?: boolean;
  preOrderStatus?: PreOrderStatus;
  preOrderEstimatedArrival?: string;
  preOrderDepositPercent?: number; // e.g. 50 or 100
  preOrderTotalSlots?: number;
  preOrderClaimedSlots?: number;
  preOrderBatchNote?: string;
}

export interface Category {
  id: string;
  name: string;
  parentId?: string;
}

export interface District {
  name: string;
  fee: number;
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  userInitials: string;
  rating: number;
  comment: string;
  date: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string; // UK2UG-2026-XXXXXX
  customerName: string;
  customerPhone: string;
  deliveryPath: 'pickup' | 'delivery';
  deliveryDetails?: {
    district: string;
    area: string;
    landmark: string;
    notes?: string;
  };
  deliveryFee: number;
  subtotal: number;
  totalAmount: number;
  paymentMethod: 'MTN' | 'Airtel' | 'Visa' | 'Mastercard' | 'COD';
  paymentPhone?: string; // MTN/Airtel number
  cardDetails?: {
    cardNumber?: string;
    cardHolder?: string;
    expiry?: string;
    cvv?: string;
  };
  status: 'Pending' | 'Paid' | 'Ready for Pickup' | 'Picked Up' | 'Processing' | 'Out for Delivery' | 'Delivered' | 'Returned' | 'Failed';
  deliveryPin?: string; // 4-digit handover verification PIN for safe package transition
  date: string;
  items: {
    productId: string;
    title: string;
    price: number;
    quantity: number;
  }[];
}

export interface ImportRequest {
  id: string; // UK2UG-REQ-XXXXXX
  productName: string;
  productLink?: string;
  description: string;
  quantity: number;
  targetBudget?: string;
  estimatedPrice?: string;
  notes?: string;
  imageUrl?: string;
  imageUrl2?: string;
  images?: string[];
  status: 'Pending' | 'Quoted' | 'Ordered' | 'Completed';
  quotePrice?: number; // UGX quoted by Admin
  date: string;
  customerName: string;
  customerPhone: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'Active' | 'Suspended';
  joinDate: string;
}

export interface ChatMessage {
  id: string;
  sender: 'customer' | 'admin';
  senderName: string;
  userEmail: string;
  userPhone?: string;
  text: string;
  timestamp: string;
  readByCustomer?: boolean;
  readByAdmin?: boolean;
  relatedOrderId?: string;
}

export interface StorefrontBanner {
  imageUrl: string;
  badgeTitle?: string;
  badgeText?: string;
  headline?: string;
  subtitle?: string;
  altText?: string;
  ctaPrimaryText?: string;
  ctaSecondaryText?: string;
  features?: string[];
  isActive?: boolean;
}

export const DEFAULT_STOREFRONT_BANNER: StorefrontBanner = {
  imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=800',
  badgeTitle: 'Verification',
  badgeText: '100% Authentic UK Sourced',
  headline: 'Original UK Retail Products, Delivered in Uganda',
  subtitle: 'Shop verified electronics, luxury beauty, and lifestyle goods sourced directly from authorized UK stores with original receipts.',
  altText: 'iPhone 15 Pro Max Sourced',
  ctaPrimaryText: 'Browse Sourced Catalog',
  ctaSecondaryText: 'Product Request',
  features: [
    'London Personal Shopper Service',
    'Official UK Store Receipts Included',
    '1-Year Global Manufacturer Guarantee',
    'Doorstep Delivery in Kampala & Environs'
  ],
  isActive: true
};

export type ComplaintStatus = 'Open' | 'Under Review' | 'In Progress' | 'Resolved' | 'Closed';

export type ComplaintPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type ComplaintCategory =
  | 'Delayed Delivery'
  | 'Damaged / Broken Item'
  | 'Wrong Item Model'
  | 'Missing Accessories'
  | 'Payment / Refund Issue'
  | 'Courier / Rider Issue'
  | 'Quality Discrepancy'
  | 'Other';

export interface Complaint {
  id: string; // UK2UG-CMP-XXXXXX
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  orderId?: string; // Reference to UK2UG-2026-XXXXXX
  category: ComplaintCategory;
  priority: ComplaintPriority;
  subject: string;
  description: string;
  images?: string[];
  status: ComplaintStatus;
  adminResponse?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

