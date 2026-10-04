export type PreOrderStatus =
  | 'Taking Pre-Orders'
  | 'Procuring in London'
  | 'Air Cargo Flight Scheduled'
  | 'In Transit to Entebbe'
  | 'Clearing Customs'
  | 'Arrived at Kampala Hub'
  | 'Pre-Orders Closed'
  | string;

export interface ProductVariation {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  stock: number;
  available: boolean;
}

export interface Product {
  id: string;
  title: string;
  brand?: string;
  sku?: string; // Product number / SKU (deprecated in UI)
  productUrl?: string;
  productUrls?: string[]; // Up to 5+ external reference links / UK store URLs
  description: string;
  basePrice: number; // in UGX
  quantity: number; // Stock level (used for regular and pre-order products)
  categoryId: string;
  images: string[]; // up to 6 images
  inTheBox: string[];
  features?: string[]; // Product features / key highlights
  sourcingSpecs: { key: string; value: string }[];
  originalPrice?: number; // if discounted, basePrice is current price, originalPrice is the strike-through
  isFlashDeal?: boolean;
  flashDealEnd?: string; // ISO date string
  rating: number;
  // Product Variations
  variations?: ProductVariation[];
  // Pre-Order Attributes
  isPreOrder?: boolean;
  preOrderStatus?: PreOrderStatus;
  preOrderEstimatedArrival?: string; // e.g. '2026-09-20' or ISO date string or human readable
  // Size Variations for Garments and Shoes
  isGarment?: boolean; // Clothes / Apparel
  isFootwear?: boolean; // Shoes / Footwear
  sizes?: string[]; // e.g. ['XS', 'S', 'M', 'L'] or ['UK 7', 'UK 8', 'UK 9', 'UK 10']
  category?: string;
  reviewsCount?: number;
  specs?: Record<string, string>;
}

export interface Category {
  id: string;
  name: string;
  parentId?: string;
}

export interface District {
  id?: string;
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
  selectedSize?: string;
  autoAddedOnArrival?: boolean;
  userAdded?: boolean;
  // Variation support
  variationId?: string;
  variationName?: string;
  unitPrice?: number;
  originalPrice?: number;
  totalPrice?: number;
}

export interface Order {
  id: string; // UK2UG-2026-XXXXXX
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryPath: 'pickup' | 'delivery';
  deliveryType?: 'pickup' | 'delivery';
  deliveryDetails?: {
    district: string;
    area: string;
    landmark: string;
    address?: string;
    notes?: string;
  };
  deliveryFee: number;
  subtotal: number;
  totalAmount: number;
  paymentMethod: 'Shop' | 'Mobile Money' | 'COD' | 'MTN' | 'Airtel' | 'Visa' | 'Mastercard' | string;
  paymentPhone?: string; // Sourced from customer mobile money phone
  paymentTransactionRef?: string; // Optional customer transaction ref
  transactionId?: string; // Sourced transaction ID / reference
  paymentStatus?: 'Pending Verification' | 'Paid' | 'Unpaid' | 'Failed';
  paymentSubmittedAt?: string;
  paymentNotes?: string;
  paymentVerifiedAt?: string;
  paymentVerifiedBy?: string;
  cardDetails?: {
    cardNumber?: string;
    cardHolder?: string;
    expiry?: string;
    cvv?: string;
  };
  status: 'Pending' | 'Paid' | 'Ready for Pickup' | 'Picked Up' | 'Processing' | 'Out for Delivery' | 'Delivered' | 'Returned' | 'Failed';
  deliveryPin?: string; // 4-digit handover verification PIN for safe package transition
  handoverConfirmedAt?: string;
  handoverMethod?: 'pickup' | 'rider_delivery';
  handoverNotificationSent?: boolean;
  clearedFromRiderQueue?: boolean;
  assignedRiderId?: string;
  assignedRiderName?: string;
  assignedRiderPhone?: string;
  date: string;
  items: {
    productId: string;
    title: string;
    price: number;
    quantity: number;
    selectedSize?: string;
    variationId?: string;
    variationName?: string;
    unitPrice?: number;
    totalPrice?: number;
    isPreOrder?: boolean;
    preOrderStatus?: string;
    preOrderEstimatedArrival?: string;
  }[];
}

export interface CustomerNotification {
  id: string; // UK2UG-NOTIF-XXXXXX
  customerEmail?: string;
  customerPhone?: string;
  orderId: string;
  title: string;
  message: string;
  type: 'handover_store' | 'handover_rider' | 'payment_verified' | 'payment_flagged' | 'order_update';
  createdAt: string;
  read: boolean;
  pinUsed?: string;
  location?: string;
  actionUrl?: string;
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
  customerEmail?: string;
  brand?: string;
  model?: string;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'Active' | 'Suspended';
  joinDate: string;
}

export interface Rider {
  id: string; // e.g. 'rider-1' or 'rider-uid'
  name: string;
  phone: string;
  email: string;
  vehicleType?: 'Motorcycle (Boda Boda)' | 'Delivery Van' | 'Bicycle' | 'Car' | string;
  plateNumber?: string;
  status: 'Active' | 'On Delivery' | 'Off Duty' | 'Suspended';
  registeredDate: string; // YYYY-MM-DD
  updatedAt?: string;
  completedDeliveries?: number;
  currentAssignedOrders?: string[];
  nationalIdOrPermit?: string;
  notes?: string;
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

export type UserRole = 'customer' | 'admin' | 'driver';

export const ADMIN_UID = 'hVD9BP3k1GODRLhoCPXs6VNkvin2';

