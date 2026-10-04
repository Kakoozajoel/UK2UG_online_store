import React, { useState, useMemo, useEffect } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Tags,
  Zap,
  Map,
  ClipboardList,
  Mail,
  Users,
  Search,
  Plus,
  Trash2,
  Edit,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  UserCheck,
  Power,
  TrendingUp,
  Info,
  MapPin,
  Truck,
  ChevronRight,
  MessageSquare,
  Send,
  Clock,
  User,
  Eye,
  ExternalLink,
  Maximize2,
  ChevronLeft,
  X,
  Image as ImageIcon,
  Upload,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Check,
  Shirt,
  Footprints,
  PlusCircle,
  Tag,
  LogOut,
  Phone,
  CreditCard,
  Copy,
  ShieldCheck,
  CheckCheck,
  Filter,
  Coins,
  Download,
  Package,
} from 'lucide-react';
import { Product, Category, District, Order, ImportRequest, Review, Customer, ChatMessage, StorefrontBanner, DEFAULT_STOREFRONT_BANNER, Complaint, PreOrderStatus, ComplaintStatus, CustomerNotification, Rider } from '../types';
import { InitialsBadge, StarRating, FormatCurrency, Modal } from './CommonUI';
import { AdminPreOrders } from './AdminPreOrders';
import { AdminComplaints } from './AdminComplaints';
import { getPreOrderStatuses, saveCustomPreOrderStatus, isEstimatedArrivalReached } from '../lib/preOrderStatusManager';

interface AdminPortalProps {
  products: Product[];
  categories: Category[];
  districts: District[];
  orders: Order[];
  imports: ImportRequest[];
  customers: Customer[];
  messages: ChatMessage[];
  complaints?: Complaint[];
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  addCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  addDistrict: (district: District) => void;
  updateDistrictFee: (name: string, fee: number) => void;
  deleteDistrict: (name: string) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  deleteOrder?: (orderId: string) => void;
  verifyOrderPayment?: (orderId: string, status: 'Paid' | 'Failed', notes?: string) => void;
  updateOrderPaymentDetails?: (orderId: string, details: any) => void;
  confirmOrderHandover?: (orderId: string, pin: string, handoverMethod: 'pickup' | 'rider_delivery') => void;
  batchDeleteCompletedRiderOrders?: () => number;
  notifications?: CustomerNotification[];
  riders?: Rider[];
  saveRiderProfile?: (riderData: Partial<Rider> & { name: string; phone: string; email: string }) => Promise<Rider>;
  updateRiderStatus?: (riderId: string, status: Rider['status']) => Promise<void>;
  deleteRider?: (riderId: string) => Promise<void>;
  assignRiderToOrder?: (orderId: string, rider: Rider | null) => Promise<void>;
  updateImportStatus: (reqId: string, status: ImportRequest['status'], quotePrice?: number) => void;
  deleteImportRequest?: (reqId: string) => void;
  updateCustomerStatus: (id: string, status: 'Active' | 'Suspended') => void;
  deleteCustomer: (id: string) => void;
  sendMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  deleteMessage?: (msgId: string) => void;
  deleteConversation?: (userEmail: string) => void;
  markMessagesAsReadByAdmin?: (userEmail: string) => void;
  banner?: StorefrontBanner;
  updateBanner?: (banner: StorefrontBanner) => void;
  addComplaint?: (complaintData: any) => void;
  updateComplaintStatus?: (id: string, status: ComplaintStatus, adminResponse?: string) => void;
  deleteComplaint?: (id: string) => void;
  updatePreOrderStatus?: (productId: string, status: PreOrderStatus) => void;
  toggleProductPreOrder?: (productId: string, isPreOrder: boolean, details?: any) => void;
  onLogout?: () => void;
}

type AdminTab =
  | 'dashboard'
  | 'banner'
  | 'products'
  | 'preorders'
  | 'categories'
  | 'deals'
  | 'districts'
  | 'orders'
  | 'imports'
  | 'customers'
  | 'complaints'
  | 'messages';

const BANNER_PRESETS = [
  {
    name: 'Apple iPhone 16 Pro Max',
    imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=800',
    badgeText: '100% Authentic UK Sourced',
    badgeTitle: 'Verification',
    headline: 'Premium Sourced UK Goods in Kampala',
    subtitle: "We offer a personal shopper service for products from the UK, ie bags, shoes, body lotions, shower gels, swimming costumes, Mary Kay products, Avon products, Body shop products, multivitamins, supplements, deodorants, perfumes, L'Oreal, clothes, Clarks shoes and lots more.",
    altText: 'iPhone 16 Pro Max Sourced',
    ctaPrimaryText: 'Browse Sourced Catalog',
    ctaSecondaryText: 'Product Request',
    features: [
      'Official Apple Regent Street London Receipt',
      'UK SIM-Free Factory Unlocked',
      'Apple 1-Year Worldwide Warranty',
      'Direct London Air Flight Handover'
    ]
  },
  {
    name: 'UK Designer Perfumes & Skincare',
    imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=800',
    badgeText: '100% Authentic UK Sourced',
    badgeTitle: 'Boutique Certified',
    headline: 'Authentic UK Fragrances & Skincare',
    subtitle: 'Directly sourced from Harrods, Selfridges, and Boots UK with authentic retail purchase receipts.',
    altText: 'Luxury Fragrance Sourced',
    ctaPrimaryText: 'Shop Luxury Beauty',
    ctaSecondaryText: 'Request Fragrance',
    features: [
      'Direct from Harrods & Boots London',
      'Batch Lot Embossed Verification',
      'Original Boutique Till Slips',
      '100% Authentic Guarantee'
    ]
  },
  {
    name: 'MacBook & Apple Pro Ecosystem',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=800',
    badgeText: 'Official UK Apple Store Stock',
    badgeTitle: 'Official UK Specs',
    headline: 'Original UK Apple Laptops & Tablets',
    subtitle: 'Brand new, sealed Apple silicon MacBooks with full 1-year global Apple Care warranty.',
    altText: 'MacBook Pro Sourced',
    ctaPrimaryText: 'Explore Apple Tech',
    ctaSecondaryText: 'Custom Mac Order',
    features: [
      'Original UK British Keyboard Layout',
      'Official Apple Store VAT Receipt',
      '1-Year Global AppleCare Warranty',
      'Same Day Kampala Dispatch'
    ]
  },
  {
    name: 'Dyson Grooming & Hair Care',
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800',
    badgeText: 'UK Voltage Compliant (230V)',
    badgeTitle: 'Original Warranty',
    headline: 'Dyson Styling Tech & Haircare',
    subtitle: 'UK specification Dyson stylers and grooming electronics directly sourced from London stores.',
    altText: 'Dyson Grooming Tech Sourced',
    ctaPrimaryText: 'View Dyson Range',
    ctaSecondaryText: 'Request Styler',
    features: [
      'Genuine UK Standard 3-Pin Fused Plug',
      '230V British Spec Electrical Safety',
      '2-Year Official Dyson UK Warranty',
      'Harrods Knightsbridge Stock'
    ]
  },
  {
    name: 'Designer Handbags & Shoes',
    imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=800',
    badgeText: 'With Boutique Invoices',
    badgeTitle: 'Authenticity Guaranteed',
    headline: 'Luxury Handbags & Accessories',
    subtitle: 'Curated premium handbags from Coach, Michael Kors, and London boutiques with original tags.',
    altText: 'Designer Handbag Sourced',
    ctaPrimaryText: 'Browse Designer Bags',
    ctaSecondaryText: 'Request Specific Bag',
    features: [
      'London Flagship Store Sourced',
      'Original Dust Bags & Authenticity Tags',
      'Official Store VAT Receipts',
      'Insured Safe Delivery'
    ]
  },
  {
    name: 'Luxury Watches & Chronographs',
    imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=800',
    badgeText: 'Serial Verified & Certified',
    badgeTitle: 'Authorized UK Retail',
    headline: 'Authentic UK Timepieces & Chronographs',
    subtitle: 'Original British and Swiss luxury watches complete with boxed paperwork and retail stamps.',
    altText: 'Luxury Watch Sourced',
    ctaPrimaryText: 'View Timepieces',
    ctaSecondaryText: 'Request Watch Model',
    features: [
      'Authorized UK Retailer Paperwork',
      'Stamped International Warranty Booklets',
      'Serial Number Authenticity Check',
      'Kampala In-Person Inspection Handover'
    ]
  }
];

export const AdminPortal: React.FC<AdminPortalProps> = ({
  products,
  categories,
  districts,
  orders,
  imports,
  customers,
  messages,
  complaints = [],
  addProduct,
  updateProduct,
  deleteProduct,
  addCategory,
  deleteCategory,
  addDistrict,
  updateDistrictFee,
  deleteDistrict,
  updateOrderStatus,
  deleteOrder,
  verifyOrderPayment,
  updateOrderPaymentDetails,
  confirmOrderHandover,
  batchDeleteCompletedRiderOrders,
  notifications = [],
  riders = [],
  saveRiderProfile,
  updateRiderStatus,
  deleteRider,
  assignRiderToOrder,
  updateImportStatus,
  deleteImportRequest,
  updateCustomerStatus,
  deleteCustomer,
  sendMessage,
  deleteMessage,
  deleteConversation,
  markMessagesAsReadByAdmin,
  banner,
  updateBanner,
  addComplaint,
  updateComplaintStatus,
  deleteComplaint,
  updatePreOrderStatus,
  toggleProductPreOrder,
  onLogout,
}) => {

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  // Deletion Modal States for Done Orders, Product Requests & Customer Messages
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [importToDelete, setImportToDelete] = useState<ImportRequest | null>(null);
  const [showClearAllDoneImportsModal, setShowClearAllDoneImportsModal] = useState<boolean>(false);
  const [importStatusFilter, setImportStatusFilter] = useState<'All' | 'Pending' | 'Quoted' | 'Ordered' | 'Completed'>('All');
  const [conversationToDelete, setConversationToDelete] = useState<{ email: string; name: string } | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

  const handleClearAllDoneImports = () => {
    const doneImports = imports.filter((i) => i.status === 'Completed');
    if (deleteImportRequest) {
      doneImports.forEach((i) => deleteImportRequest(i.id));
    }
    setShowClearAllDoneImportsModal(false);
    setBatchDeleteResultNotice(`Successfully deleted ${doneImports.length} completed product request records.`);
    setTimeout(() => setBatchDeleteResultNotice(''), 4000);
  };

  // Orders Sub-Views & Payments / Rider Deletion / Handover PIN states
  const [ordersSubView, setOrdersSubView] = useState<'all' | 'items_lookup' | 'payments' | 'rider_dispatch' | 'pickup'>('all');
  const [orderCodeSearch, setOrderCodeSearch] = useState<string>('');
  const [copiedOrderSummary, setCopiedOrderSummary] = useState<string | null>(null);
  const [inspectPaymentOrder, setInspectPaymentOrder] = useState<Order | null>(null);
  const [showBatchDeleteRiderModal, setShowBatchDeleteRiderModal] = useState<boolean>(false);
  const [batchDeleteResultNotice, setBatchDeleteResultNotice] = useState<string>('');
  const [paymentActionFeedback, setPaymentActionFeedback] = useState<string>('');
  const [copiedPaymentSummary, setCopiedPaymentSummary] = useState<boolean>(false);
  const [showFlagPaymentModal, setShowFlagPaymentModal] = useState<Order | null>(null);
  const [flagIssueNotes, setFlagIssueNotes] = useState<string>('');

  // Store Pickup PIN verification states
  const [pickupVerifyOrderId, setPickupVerifyOrderId] = useState<string | null>(null);
  const [pickupVerifyPin, setPickupVerifyPin] = useState<string>('');
  const [pickupVerifySuccess, setPickupVerifySuccess] = useState<string>('');
  const [pickupVerifyError, setPickupVerifyError] = useState<string>('');

  // Rider assignment state & Rider Profiles Management
  const [assigningOrder, setAssigningOrder] = useState<Order | null>(null);
  const [selectedRiderIdForAssign, setSelectedRiderIdForAssign] = useState<string>('');
  const [showAddRiderModal, setShowAddRiderModal] = useState<boolean>(false);
  const [newRiderForm, setNewRiderForm] = useState({
    name: '',
    phone: '',
    email: '',
    vehicleType: 'Motorcycle (Boda Boda)',
    plateNumber: '',
  });
  const [riderActionNotice, setRiderActionNotice] = useState<string>('');

  // Storefront Showcase Banner Form State
  const [bannerForm, setBannerForm] = useState<StorefrontBanner>(() => banner || DEFAULT_STOREFRONT_BANNER);
  const [bannerSavedAlert, setBannerSavedAlert] = useState(false);
  const [bannerFileError, setBannerFileError] = useState<string | null>(null);

  useEffect(() => {
    if (banner) {
      setBannerForm(banner);
    }
  }, [banner]);

  const handleBannerFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setBannerFileError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setBannerFileError('Image file size should be less than 3MB for high performance.');
      return;
    }
    setBannerFileError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setBannerForm((prev) => ({ ...prev, imageUrl: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBanner = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!bannerForm.imageUrl.trim()) {
      setBannerFileError('Please enter an image URL or upload an image file.');
      return;
    }
    setBannerFileError(null);
    if (updateBanner) {
      updateBanner(bannerForm);
    }
    setBannerSavedAlert(true);
    setTimeout(() => setBannerSavedAlert(false), 4000);
  };

  const handleResetBanner = () => {
    setBannerForm(DEFAULT_STOREFRONT_BANNER);
    if (updateBanner) {
      updateBanner(DEFAULT_STOREFRONT_BANNER);
    }
    setBannerFileError(null);
    setBannerSavedAlert(true);
    setTimeout(() => setBannerSavedAlert(false), 4000);
  };

  const [newBannerFeatureInput, setNewBannerFeatureInput] = useState<string>('');

  const handleAddBannerFeature = (featureText?: string) => {
    const feat = (featureText || newBannerFeatureInput).trim();
    if (!feat) return;
    const currentFeatures = bannerForm.features || [];
    if (!currentFeatures.includes(feat)) {
      setBannerForm((prev) => ({ ...prev, features: [...(prev.features || []), feat] }));
    }
    setNewBannerFeatureInput('');
  };

  const handleRemoveBannerFeature = (indexToRemove: number) => {
    setBannerForm((prev) => ({
      ...prev,
      features: (prev.features || []).filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleSelectBannerPreset = (preset: typeof BANNER_PRESETS[0]) => {
    setBannerForm((prev) => ({
      ...prev,
      imageUrl: preset.imageUrl,
      badgeTitle: preset.badgeTitle,
      badgeText: preset.badgeText,
      headline: preset.headline,
      subtitle: preset.subtitle,
      altText: preset.altText,
      ctaPrimaryText: preset.ctaPrimaryText,
      ctaSecondaryText: preset.ctaSecondaryText,
      features: preset.features || [],
    }));
  };

  // Search parameters inside subpanes
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Customer Messages active chat selection
  const [activeChatEmail, setActiveChatEmail] = useState<string>('kakoozajoel45@gmail.com');
  const [adminReplyInput, setAdminReplyInput] = useState<string>('');

  // Mark admin messages as read when active chat tab or activeChatEmail is selected
  useEffect(() => {
    if (activeTab === 'messages' && activeChatEmail && markMessagesAsReadByAdmin) {
      const hasUnread = messages.some((m) => m.userEmail === activeChatEmail && m.sender === 'customer' && !m.readByAdmin);
      if (hasUnread) {
        markMessagesAsReadByAdmin(activeChatEmail);
      }
    }
  }, [activeTab, activeChatEmail, messages, markMessagesAsReadByAdmin]);

  // Sourcing Product Admin form state
  const [showProductModal, setShowProductModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    title: '',
    brand: '',
    sku: '',
    productUrl: '',
    description: '',
    basePrice: 0,
    originalPrice: 0,
    quantity: 10,
    categoryId: categories[0]?.id ?? '',
    images: ['', '', '', '', '', ''],
    inTheBox: '', // comma-separated strings
    customerStatus: 'in_stock' as 'in_stock' | 'pre_order' | 'out_of_stock',
    preOrderStatus: 'Taking Pre-Orders' as PreOrderStatus,
    preOrderEstimatedArrival: '10-14 Business Days',
    isGarment: false,
    isFootwear: false,
    sizes: [] as string[],
    sourcingSpecs: [
      { key: 'Sourced From', value: '' },
      { key: 'Specifications', value: '' },
      { key: 'Warranty', value: '' },
      { key: 'Network / Power', value: '' }
    ]
  });

  // Custom size and pre-order status management states
  const [customSizeInput, setCustomSizeInput] = useState<string>('');
  const [showAddCustomStatusModal, setShowAddCustomStatusModal] = useState<boolean>(false);
  const [newStatusInput, setNewStatusInput] = useState<string>('');
  const [newStatusDescInput, setNewStatusDescInput] = useState<string>('');
  const [newStatusIconInput, setNewStatusIconInput] = useState<string>('📦');
  const [allPreOrderStatuses, setAllPreOrderStatuses] = useState(getPreOrderStatuses());

  // Flash Deals Deletion & Management States
  const [dealToDelete, setDealToDelete] = useState<Product | null>(null);
  const [showDeleteAllExpiredModal, setShowDeleteAllExpiredModal] = useState<boolean>(false);
  const [dealFilter, setDealFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [dealSuccessMsg, setDealSuccessMsg] = useState<string>('');

  const showDealFeedback = (msg: string) => {
    setDealSuccessMsg(msg);
    setTimeout(() => setDealSuccessMsg(''), 4500);
  };

  // Categories Form
  const [newCatName, setNewCatName] = useState<string>('');

  // Logistics form state
  const [newDistrictForm, setNewDistrictForm] = useState({ name: '', fee: 0 });

  // Custom Sourcing Quotes
  const [activeQuoteId, setActiveQuoteId] = useState<string | null>(null);
  const [customQuotePrice, setCustomQuotePrice] = useState<number>(0);

  // Sourced Product Parameter Inspection Modal
  const [inspectRequest, setInspectRequest] = useState<ImportRequest | null>(null);
  const [inspectActiveImageIdx, setInspectActiveImageIdx] = useState<number>(0);
  const [inspectQuoteInput, setInspectQuoteInput] = useState<number | ''>('');

  const currentInspectReq = inspectRequest ? (imports.find((i) => i.id === inspectRequest.id) || inspectRequest) : null;
  const inspectImages = useMemo(() => {
    if (!currentInspectReq) return [];
    const list: string[] = [];
    if (Array.isArray(currentInspectReq.images) && currentInspectReq.images.length > 0) {
      currentInspectReq.images.forEach((img) => {
        if (img && !list.includes(img)) list.push(img);
      });
    }
    if (currentInspectReq.imageUrl && !list.includes(currentInspectReq.imageUrl)) {
      list.unshift(currentInspectReq.imageUrl);
    }
    if (currentInspectReq.imageUrl2 && !list.includes(currentInspectReq.imageUrl2)) {
      list.push(currentInspectReq.imageUrl2);
    }
    return list;
  }, [currentInspectReq]);

  const handleInspectQuoteSubmit = () => {
    if (!currentInspectReq) return;
    if (Number(inspectQuoteInput) <= 0) return;
    updateImportStatus(currentInspectReq.id, 'Quoted', Number(inspectQuoteInput));
    setInspectRequest((prev) => prev ? { ...prev, status: 'Quoted', quotePrice: Number(inspectQuoteInput) } : null);
  };

  // Flash Deals Scheduler States
  const [dealProductId, setDealProductId] = useState<string>('');
  const [dealEndDate, setDealEndDate] = useState<string>('');
  const [dealOriginalPrice, setDealOriginalPrice] = useState<number | ''>('');
  const [dealDiscountedPrice, setDealDiscountedPrice] = useState<number | ''>('');
  const [dealError, setDealError] = useState<string>('');

  // Helper to format local time as YYYY-MM-DDTHH:mm to forbid selecting past dates/times
  const getMinDealDateTime = () => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  // Submit new/edited product
  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const boxArray = productForm.inTheBox
      ? productForm.inTheBox.split(',').map((s) => s.trim()).filter(Boolean)
      : ['Product unit', 'Secure UK cable packaging'];

    const isPreOrder = productForm.customerStatus === 'pre_order';
    const quantity = productForm.customerStatus === 'out_of_stock' ? 0 : Math.max(1, Number(productForm.quantity) || 1);

    const baseProductData = {
      title: productForm.title,
      brand: productForm.brand || undefined,
      sku: productForm.sku.trim() || editingProduct?.sku || `UK-${Date.now().toString().slice(-4)}`,
      productUrl: productForm.productUrl || undefined,
      description: productForm.description,
      basePrice: Number(productForm.basePrice),
      originalPrice: editingProduct?.originalPrice,
      quantity: quantity,
      categoryId: productForm.categoryId,
      images: productForm.images.filter((img) => img.trim() !== ''),
      inTheBox: boxArray,
      sourcingSpecs: productForm.sourcingSpecs.filter((s) => s.key && s.value),
      rating: editingProduct ? editingProduct.rating : 5.0,
      isFlashDeal: editingProduct?.isFlashDeal,
      flashDealEnd: editingProduct?.flashDealEnd,
      isPreOrder: isPreOrder,
      preOrderStatus: isPreOrder ? productForm.preOrderStatus : undefined,
      preOrderEstimatedArrival: isPreOrder ? productForm.preOrderEstimatedArrival : undefined,
      isGarment: Boolean(productForm.isGarment) || productForm.sizes.some((s) => ['28', '29', '30', '31', '32', '33', '34', '35', '36', 'S', 'M', 'L', 'XL', '2XL', '3XL'].includes(s)),
      isFootwear: Boolean(productForm.isFootwear) || productForm.sizes.some((s) => s.includes('UK') || s.includes('EUR')),
      sizes: (productForm.isGarment || productForm.isFootwear || productForm.sizes.length > 0) ? productForm.sizes : [],
      variations: editingProduct?.variations && editingProduct.variations.length > 0 && productForm.sizes.length === 0
        ? editingProduct.variations
        : productForm.sizes.length > 0
        ? productForm.sizes.map((sz, idx) => ({
            id: `var-size-${idx}-${sz.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
            name: sz.includes('/')
              ? sz
              : ['28', '29', '30', '31', '32', '33', '34', '35', '36'].includes(sz)
              ? `Waist ${sz}`
              : sz.startsWith('UK') || sz.startsWith('EUR')
              ? sz
              : `Size ${sz}`,
            price: Number(productForm.basePrice),
            originalPrice: editingProduct?.originalPrice || Number(productForm.basePrice),
            stock: Math.max(1, Math.min(quantity, 10)),
            available: quantity > 0,
          }))
        : editingProduct?.variations,
    };

    if (editingProduct) {
      updateProduct({
        ...baseProductData,
        id: editingProduct.id,
      });
    } else {
      addProduct({
        ...baseProductData,
        id: `prod-${Date.now()}`,
      });
    }

    setShowProductModal(false);
    setEditingProduct(null);
    resetProductForm();
  };

  const resetProductForm = () => {
    setProductForm({
      title: '',
      brand: '',
      sku: '',
      productUrl: '',
      description: '',
      basePrice: 0,
      originalPrice: 0,
      quantity: 10,
      categoryId: categories[0]?.id ?? '',
      images: ['', '', '', '', '', ''],
      inTheBox: '',
      customerStatus: 'in_stock',
      preOrderStatus: 'Taking Pre-Orders',
      preOrderEstimatedArrival: '10-14 Business Days',
      isGarment: false,
      isFootwear: false,
      sizes: [],
      sourcingSpecs: [
        { key: 'Sourced From', value: '' },
        { key: 'Specifications', value: '' },
        { key: 'Warranty', value: '' },
        { key: 'Network / Power', value: '' }
      ]
    });
    setCustomSizeInput('');
  };

  const handleEditProductClick = (prod: Product) => {
    setEditingProduct(prod);
    const defaultKeys = ['Sourced From', 'Specifications', 'Warranty', 'Network / Power'];
    const existingSpecs = prod.sourcingSpecs || [];
    const mergedSpecs = defaultKeys.map((k) => {
      const found = existingSpecs.find((s) => s.key === k);
      return { key: k, value: found ? found.value : '' };
    });
    existingSpecs.forEach((s) => {
      if (!defaultKeys.includes(s.key)) {
        mergedSpecs.push(s);
      }
    });

    const currentCustomerStatus: 'in_stock' | 'pre_order' | 'out_of_stock' = prod.isPreOrder
      ? 'pre_order'
      : prod.quantity <= 0
      ? 'out_of_stock'
      : 'in_stock';

    setProductForm({
      title: prod.title,
      brand: prod.brand ?? '',
      sku: prod.sku ?? '',
      productUrl: prod.productUrl ?? '',
      description: prod.description,
      basePrice: prod.basePrice,
      originalPrice: prod.originalPrice ?? 0,
      quantity: prod.quantity,
      categoryId: prod.categoryId,
      images: [
        prod.images[0] ?? '',
        prod.images[1] ?? '',
        prod.images[2] ?? '',
        prod.images[3] ?? '',
        prod.images[4] ?? '',
        prod.images[5] ?? '',
      ],
      inTheBox: prod.inTheBox.join(', '),
      customerStatus: currentCustomerStatus,
      preOrderStatus: prod.preOrderStatus || 'Taking Pre-Orders',
      preOrderEstimatedArrival: prod.preOrderEstimatedArrival || '10-14 Business Days',
      isGarment: Boolean(prod.isGarment),
      isFootwear: Boolean(prod.isFootwear),
      sizes: prod.sizes && prod.sizes.length > 0 ? prod.sizes : [],
      sourcingSpecs: mergedSpecs,
    });
    setCustomSizeInput('');
    setShowProductModal(true);
  };

  // Category addition
  const handleCategoryAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addCategory({
      id: `cat-${Date.now()}`,
      name: newCatName.trim(),
    });
    setNewCatName('');
  };

  // Flash deal submission (with calendar validation rule)
  const handleDealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDealError('');

    if (!dealProductId || !dealEndDate) {
      setDealError('Please select both a product and expiration date.');
      return;
    }

    if (!dealDiscountedPrice || Number(dealDiscountedPrice) <= 0) {
      setDealError('Please enter a valid discounted deal price in UGX.');
      return;
    }

    if (dealOriginalPrice && Number(dealDiscountedPrice) >= Number(dealOriginalPrice)) {
      setDealError('The discounted price must be lower than the original strikethrough price.');
      return;
    }

    // Strict validation: cannot choose a date in the past
    const selectedTime = new Date(dealEndDate).getTime();
    const currentTime = Date.now();

    if (selectedTime <= currentTime) {
      setDealError('Strict Scheduler Policy: Active deal timelines must occur in the future. Past dates are blocked.');
      return;
    }

    const matchedProd = products.find((p) => p.id === dealProductId);
    if (matchedProd) {
      const orig = dealOriginalPrice ? Number(dealOriginalPrice) : matchedProd.basePrice;
      updateProduct({
        ...matchedProd,
        basePrice: Number(dealDiscountedPrice),
        originalPrice: orig > Number(dealDiscountedPrice) ? orig : undefined,
        isFlashDeal: true,
        flashDealEnd: new Date(dealEndDate).toISOString(),
      });
      setDealProductId('');
      setDealEndDate('');
      setDealOriginalPrice('');
      setDealDiscountedPrice('');
    }
  };

  const handleRemoveDeal = (prod: Product) => {
    setDealToDelete(prod);
  };

  const handleConfirmDeleteDeal = (prod: Product) => {
    updateProduct({
      ...prod,
      basePrice: prod.originalPrice && prod.originalPrice > prod.basePrice ? prod.originalPrice : prod.basePrice,
      originalPrice: undefined,
      isFlashDeal: false,
      flashDealEnd: undefined,
    });
    showDealFeedback(`Flash deal for "${prod.title}" was successfully deleted and regular pricing restored.`);
    setDealToDelete(null);
  };

  const handleConfirmDeleteAllExpired = () => {
    const expiredList = products.filter(
      (p) => p.isFlashDeal && p.flashDealEnd && new Date(p.flashDealEnd).getTime() <= Date.now()
    );
    expiredList.forEach((prod) => {
      updateProduct({
        ...prod,
        basePrice: prod.originalPrice && prod.originalPrice > prod.basePrice ? prod.originalPrice : prod.basePrice,
        originalPrice: undefined,
        isFlashDeal: false,
        flashDealEnd: undefined,
      });
    });
    showDealFeedback(`Successfully deleted all ${expiredList.length} expired flash deal(s).`);
    setShowDeleteAllExpiredModal(false);
  };

  // Logistics update
  const handleDistrictSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDistrictForm.name.trim() || newDistrictForm.fee <= 0) return;
    addDistrict({
      name: newDistrictForm.name.trim(),
      fee: Number(newDistrictForm.fee),
    });
    setNewDistrictForm({ name: '', fee: 0 });
  };

  // Formulate price quote
  const handleQuoteSubmit = (reqId: string) => {
    if (customQuotePrice <= 0) return;
    updateImportStatus(reqId, 'Quoted', customQuotePrice);
    setActiveQuoteId(null);
    setCustomQuotePrice(0);
  };

  // Computed Dashboard Metrics
  const totalCompletedEarnings = orders
    .filter((o) => ['Delivered', 'Picked Up', 'Ready for Pickup', 'Processing', 'Paid'].includes(o.status))
    .reduce((sum, o) => sum + (o.totalAmount || o.subtotal || 0), 0);

  const activeOrdersCount = orders.filter((o) => ['Pending', 'Paid', 'Processing', 'Ready for Pickup', 'Out for Delivery'].includes(o.status)).length;
  
  // Sourced items stock status
  const outOfStockCount = products.filter((p) => p.quantity === 0).length;

  // Dynamic Revenue Analytics Timeline (Past 5 Months)
  const monthlyTimeline = useMemo(() => {
    const months = Array.from({ length: 5 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (4 - i));
      return {
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
        label: d.toLocaleString('en-US', { month: 'short' }),
      };
    });

    const validOrders = orders.filter((o) => !['Returned', 'Failed'].includes(o.status));

    const monthData = months.map((m) => {
      const monthOrders = validOrders.filter((o) => {
        if (!o.date) return false;
        const oDate = new Date(o.date);
        return oDate.getFullYear() === m.year && oDate.getMonth() === m.monthIndex;
      });
      const revenue = monthOrders.reduce((sum, o) => sum + (o.totalAmount || o.subtotal || 0), 0);
      return {
        ...m,
        revenue,
        orderCount: monthOrders.length,
      };
    });

    const maxRevenue = Math.max(...monthData.map((r) => r.revenue), 1);
    const hasAnyRevenue = monthData.some((r) => r.revenue > 0);

    return { months: monthData, maxRevenue, hasAnyRevenue };
  }, [orders]);

  // Dynamic Top Delivery Districts
  const districtAnalytics = useMemo(() => {
    const deliveryOrders = orders.filter(
      (o) => o.deliveryPath === 'delivery' && o.deliveryDetails?.district
    );
    const totalDeliveryOrders = deliveryOrders.length;

    const counts: Record<string, number> = {};
    deliveryOrders.forEach((o) => {
      const dName = o.deliveryDetails?.district;
      if (dName) {
        counts[dName] = (counts[dName] || 0) + 1;
      }
    });

    const palette = ['bg-orange-700', 'bg-orange-600', 'bg-orange-500', 'bg-orange-400', 'bg-orange-300', 'bg-orange-200'];

    const districtList = districts
      .map((d, idx) => {
        const count = counts[d.name] || 0;
        const ratio = totalDeliveryOrders > 0 ? Math.round((count / totalDeliveryOrders) * 100) : 0;
        return {
          name: d.name,
          ratio: `${ratio}%`,
          ratioNum: ratio,
          count,
          color: palette[idx % palette.length],
          orderCount: `${count} ${count === 1 ? 'order' : 'orders'}`,
        };
      })
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    return { totalDeliveryOrders, districtList };
  }, [orders, districts]);

  // Counts for tabs
  const preOrdersCount = products.filter((p) => p.isPreOrder).length;
  const openComplaintsCount = complaints.filter((c) => c.status === 'Open' || c.status === 'Under Review' || c.status === 'In Progress').length;

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex text-gray-800 font-sans" id="admin-panel-root">
      {/* LEFT STICKY SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-black text-gray-300 flex flex-col fixed inset-y-0 left-0 z-30 border-r border-gray-800" id="admin-sticky-sidebar">
        {/* Admin Header Title */}
        <div className="h-20 flex items-center gap-2.5 px-6 border-b border-gray-800 shrink-0">
          <div className="bg-[#ea580c] text-white p-2 rounded-lg">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white">UK2UG Admin</span>
            <p className="text-[9px] uppercase tracking-wider text-orange-400 font-semibold -mt-1">Workspace Control</p>
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {[
            { id: 'dashboard', label: 'Dashboard Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: 'banner', label: 'Banner & Admin Notices', icon: <ImageIcon className="w-4 h-4" /> },
            { id: 'products', label: 'Products Management', icon: <ShoppingBag className="w-4 h-4" /> },
            { id: 'preorders', label: 'Pre-Order Items', icon: <Clock className="w-4 h-4" />, count: preOrdersCount },
            { id: 'categories', label: 'Category Management', icon: <Tags className="w-4 h-4" /> },
            { id: 'deals', label: 'Flash Deals Scheduler', icon: <Zap className="w-4 h-4" /> },
            { id: 'districts', label: 'District Logistics', icon: <Map className="w-4 h-4" /> },
            { id: 'orders', label: 'Orders & Fulfillment', icon: <ClipboardList className="w-4 h-4" /> },
            { id: 'imports', label: 'Product Requests', icon: <Mail className="w-4 h-4" /> },
            { id: 'customers', label: 'Customer Accounts', icon: <Users className="w-4 h-4" /> },
            { id: 'complaints', label: 'Customer Complaints', icon: <AlertTriangle className="w-4 h-4" />, count: openComplaintsCount, isAlert: openComplaintsCount > 0 },
            { id: 'messages', label: 'Customer Messages', icon: <MessageSquare className="w-4 h-4" /> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as AdminTab);
                setSearchQuery('');
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-bold tracking-wide uppercase transition-colors duration-200 cursor-pointer ${
                activeTab === item.id
                  ? 'bg-[#ea580c] text-white'
                  : 'text-gray-400 hover:bg-gray-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {typeof item.count === 'number' && item.count > 0 && (
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    item.isAlert
                      ? 'bg-amber-500 text-black'
                      : activeTab === item.id
                      ? 'bg-white/20 text-white'
                      : 'bg-orange-900 text-orange-300'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Admin footer profile */}
        <div className="p-3.5 border-t border-gray-800 flex items-center justify-between gap-2 bg-gray-950 shrink-0 text-left">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-purple-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs border border-purple-500/40">
              UA
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">uk2ug admin</p>
              <p className="text-[10px] text-purple-400 font-mono truncate">Role: Administrator</p>
            </div>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              title="Logout from Admin Account"
              className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer shrink-0"
              id="admin-sidebar-logout-btn"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* RIGHT SIDE MAIN CONTENT AREA */}
      <main className="flex-1 pl-64 min-h-screen flex flex-col">
        {/* Sub Header panel */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 shrink-0">
          <div className="text-left">
            <h1 className="text-xl font-bold text-gray-900 capitalize tracking-tight">
              {activeTab === 'deals'
                ? 'Flash Deals Scheduler'
                : activeTab === 'banner'
                ? 'Storefront Hero Banner'
                : activeTab === 'preorders'
                ? 'Pre-Order Management & Sourcing Stages'
                : activeTab === 'complaints'
                ? 'Customer Complaints & Quality Assurance Desk'
                : activeTab} Panel
            </h1>
            <p className="text-xs text-gray-400">UK2UG Retail Portal Ecosystem</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#F8F9FA] px-3.5 py-1.5 rounded-lg border border-gray-100 text-xs font-semibold text-gray-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Secure Admin Console Connected
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                id="admin-header-logout-btn"
                title="Logout from Admin Account"
              >
                <LogOut className="w-3.5 h-3.5 text-red-600" />
                <span>Log Out</span>
              </button>
            )}
          </div>
        </header>

        {/* Content pane depending on active tab */}
        <div className="flex-1 p-8 overflow-y-auto">
          {/* TAB A: DASHBOARD ANALYTICS OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 text-left">
              {/* Metrics cards - Operational Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
                {[
                  { label: 'Cumulative Revenue', val: `UGX ${new Intl.NumberFormat('en-UG').format(totalCompletedEarnings)}`, detail: 'Delivery & Pickup', trend: `${orders.length} orders` },
                  { label: 'Active Pipeline Orders', val: activeOrdersCount, detail: 'Requiring local dispatch', trend: 'Processing stage' },
                  { label: 'Pre-Order Runway', val: preOrdersCount, detail: 'London flights', trend: `${products.filter(p => p.isPreOrder && p.preOrderStatus === 'Taking Pre-Orders').length} open bookings`, badgeColor: 'bg-amber-100 text-amber-900 border-amber-200' },
                  { label: 'Complaints Desk', val: openComplaintsCount, detail: 'Customer tickets', trend: openComplaintsCount > 0 ? `${openComplaintsCount} action required` : 'All resolved', badgeColor: openComplaintsCount > 0 ? 'bg-red-100 text-red-900 border-red-200' : 'bg-emerald-100 text-emerald-900 border-emerald-200' },
                  { label: 'Custom Requests', val: imports.length, detail: 'Direct requests', trend: `${imports.filter(i => i.status === 'Pending').length} pending quote` },
                  { label: 'Out of Stock Items', val: outOfStockCount, detail: 'Need replenishment', trend: outOfStockCount > 0 ? `${outOfStockCount} out of stock` : 'In stock' },
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white border border-gray-100 p-5 rounded-xl shadow-sm space-y-2 flex flex-col justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider truncate">{stat.label}</p>
                      <p className="text-base sm:text-lg font-extrabold text-[#000000] truncate">{stat.val}</p>
                    </div>
                    <div className="pt-2 border-t border-gray-50 text-[10px] flex items-center justify-between">
                      <span className="text-gray-500 font-medium truncate">{stat.detail}</span>
                      <span className="text-[#ea580c] font-bold shrink-0">{stat.trend}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comprehensive Admin Panel Directory & Tab Access Guide */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-[#ea580c] text-white text-[10px] font-black uppercase tracking-wider rounded-md">
                        System Architecture
                      </span>
                      <h3 className="font-bold text-gray-900 text-base">Admin Panel Modules & Access Directory</h3>
                    </div>
                    <p className="text-xs text-gray-500">
                      Overview of all 12 operational modules. How to access: Click any tab in the <strong>Left Sticky Sidebar</strong>, use the <strong>Sandbox Switcher bar</strong> at the bottom of the screen, or click any module below.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-500 font-semibold bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                      12 Active Management Tabs
                    </span>
                  </div>
                </div>

                {/* 12 Tabs Interactive Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[
                    {
                      id: 'dashboard' as AdminTab,
                      name: '1. Dashboard Overview',
                      desc: 'Real-time financial metrics, monthly turnover charts, top dispatch districts, and recent order audit log.',
                      icon: <LayoutDashboard className="w-4 h-4 text-[#ea580c]" />,
                      status: `${orders.length} total orders recorded`,
                    },
                    {
                      id: 'banner' as AdminTab,
                      name: '2. Storefront Banner',
                      desc: 'Configure homepage hero image, promotional headline, tagline, and UK authenticity verification badge.',
                      icon: <ImageIcon className="w-4 h-4 text-purple-600" />,
                      status: 'Live on customer store',
                    },
                    {
                      id: 'products' as AdminTab,
                      name: '3. Products Management',
                      desc: 'Manage inventory, retail prices, discounts, stock quantities, and UK sourcing verification specs.',
                      icon: <ShoppingBag className="w-4 h-4 text-blue-600" />,
                      status: `${products.length} products listed`,
                    },
                    {
                      id: 'preorders' as AdminTab,
                      name: '4. Pre-Order Items',
                      desc: 'Add & manage items on pre-order with real-time flight stages, deposit percentages, and customer ETA updates.',
                      icon: <Clock className="w-4 h-4 text-amber-600" />,
                      status: `${preOrdersCount} active pre-orders`,
                      highlight: true,
                    },
                    {
                      id: 'categories' as AdminTab,
                      name: '5. Category Management',
                      desc: 'Create, organize, and prune sourcing categories (Electronics, Fashion, Health, Gourmet Sweets, etc.).',
                      icon: <Tags className="w-4 h-4 text-emerald-600" />,
                      status: `${categories.length} categories active`,
                    },
                    {
                      id: 'deals' as AdminTab,
                      name: '6. Flash Deals Scheduler',
                      desc: 'Curate limited-time flash deals with countdown timers and promotional discounts for Ugandan shoppers.',
                      icon: <Zap className="w-4 h-4 text-yellow-600" />,
                      status: `${products.filter(p => p.originalPrice && p.originalPrice > p.basePrice).length} discounted deals`,
                    },
                    {
                      id: 'districts' as AdminTab,
                      name: '7. District Logistics',
                      desc: 'Maintain local doorstep delivery fees and delivery boundaries across Kampala, Wakiso, Mukono, and beyond.',
                      icon: <Map className="w-4 h-4 text-indigo-600" />,
                      status: `${districts.length} districts configured`,
                    },
                    {
                      id: 'orders' as AdminTab,
                      name: '8. Orders & Fulfillment',
                      desc: 'Search ordered items by order code, manage dispatch queues, verify 4-digit handover PINs, and track payments.',
                      icon: <ClipboardList className="w-4 h-4 text-orange-600" />,
                      status: `${orders.length} order entries`,
                    },
                    {
                      id: 'imports' as AdminTab,
                      name: '9. Product Requests',
                      desc: 'Customer personal shopper quotes: review UK links, quote prices in UGX, and approve procurement batches.',
                      icon: <Mail className="w-4 h-4 text-sky-600" />,
                      status: `${imports.length} shopper requests`,
                    },
                    {
                      id: 'customers' as AdminTab,
                      name: '10. Customer Accounts',
                      desc: 'Registered shoppers directory: manage verified customer profiles, view purchase histories, and enforce status.',
                      icon: <Users className="w-4 h-4 text-violet-600" />,
                      status: `${customers.length} registered profiles`,
                    },
                    {
                      id: 'complaints' as AdminTab,
                      name: '11. Customer Complaints Desk',
                      desc: 'Quality assurance desk: review complaints (damaged items, delays, wrong products), reply, and resolve issues.',
                      icon: <AlertTriangle className="w-4 h-4 text-red-600" />,
                      status: `${openComplaintsCount} pending tickets`,
                      highlight: true,
                    },
                    {
                      id: 'messages' as AdminTab,
                      name: '12. Customer Messages',
                      desc: 'Two-way live chat with shoppers: answer procurement inquiries, provide flight ETA updates, and advise clients.',
                      icon: <MessageSquare className="w-4 h-4 text-pink-600" />,
                      status: `${messages.length} chat messages`,
                    },
                  ].map((tabItem) => (
                    <div
                      key={tabItem.id}
                      onClick={() => {
                        setActiveTab(tabItem.id);
                        setSearchQuery('');
                      }}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between hover:shadow-md ${
                        tabItem.highlight
                          ? 'bg-amber-50/40 border-amber-200 hover:border-amber-400'
                          : 'bg-gray-50/50 border-gray-150 hover:border-orange-300 hover:bg-white'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-white shadow-2xs border border-gray-100">
                              {tabItem.icon}
                            </div>
                            <h4 className="font-bold text-xs text-gray-900">{tabItem.name}</h4>
                          </div>
                        </div>
                        <p className="text-[11px] text-gray-500 leading-relaxed">{tabItem.desc}</p>
                      </div>
                      <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-[10px]">
                        <span className="font-semibold text-gray-600">{tabItem.status}</span>
                        <span className="font-bold text-[#ea580c] flex items-center gap-0.5">
                          Open <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Revenue Analytics & Top Delivery Districts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Analytics chart */}
                <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm sm:text-base">Revenue Analytics Timeline</h3>
                      <p className="text-xs text-gray-400">Monthly Sourcing Turnover Ratios (UGX)</p>
                    </div>
                    <div className="p-2 bg-orange-50 rounded-lg text-[#ea580c]">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Dynamic Interactive Teal SVG Chart */}
                  <div className="h-56 w-full pt-4">
                    <svg className="w-full h-full" viewBox="0 0 500 200">
                      {/* Grid Lines */}
                      <line x1="40" y1="20" x2="480" y2="20" stroke="#F1F3F5" strokeWidth="1" />
                      <line x1="40" y1="70" x2="480" y2="70" stroke="#F1F3F5" strokeWidth="1" />
                      <line x1="40" y1="120" x2="480" y2="120" stroke="#F1F3F5" strokeWidth="1" />
                      <line x1="40" y1="170" x2="480" y2="170" stroke="#E9ECEF" strokeWidth="1" />

                      {monthlyTimeline.months.map((m, idx) => {
                        const xPositions = [70, 150, 230, 310, 390];
                        const x = xPositions[idx];
                        const barWidth = 35;
                        const maxBarHeight = 130;
                        const baseLineY = 170;

                        const height = m.revenue > 0 ? Math.max(12, Math.round((m.revenue / monthlyTimeline.maxRevenue) * maxBarHeight)) : 4;
                        const y = baseLineY - height;
                        const labelX = x + barWidth / 2;

                        const formatVal = (val: number) => {
                          if (val === 0) return '0';
                          if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
                          if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
                          return `${val}`;
                        };

                        return (
                          <g key={idx} className="group cursor-pointer">
                            <rect
                              x={x}
                              y={y}
                              width={barWidth}
                              height={height}
                              fill={m.revenue > 0 ? '#ea580c' : '#E9ECEF'}
                              rx="4"
                              className={m.revenue > 0 ? 'hover:fill-orange-600 transition-colors' : 'hover:fill-gray-300 transition-colors'}
                            />
                            <text x={labelX} y="190" fontSize="10" textAnchor="middle" fill="#6C757D">
                              {m.label}
                            </text>
                            <text
                              x={labelX}
                              y={m.revenue > 0 ? Math.max(14, y - 6) : baseLineY - 8}
                              fontSize="9"
                              fontWeight="bold"
                              textAnchor="middle"
                              fill={m.revenue > 0 ? '#ea580c' : '#ADB5BD'}
                            >
                              {formatVal(m.revenue)}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                  {!monthlyTimeline.hasAnyRevenue && (
                    <p className="text-center text-[11px] text-gray-400 font-medium">
                      No order revenue recorded for these months yet. Real-time turnover will reflect as orders are completed.
                    </p>
                  )}
                </div>

                {/* Top Delivery Districts pie lists */}
                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-4">
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base">Top Delivery Districts</h3>
                  <p className="text-xs text-gray-400">Logistics volume ratios across Ugandan districts</p>

                  <div className="space-y-4 pt-2">
                    {districtAnalytics.districtList.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">No districts configured.</p>
                    ) : (
                      districtAnalytics.districtList.map((dist, idx) => (
                        <div key={idx} className="space-y-1 text-xs">
                          <div className="flex justify-between font-semibold text-gray-700">
                            <span>{dist.name}</span>
                            <span>{dist.ratio}</span>
                          </div>
                          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`${dist.count > 0 ? dist.color : 'bg-gray-200'} h-full rounded-full transition-all duration-300`}
                              style={{ width: dist.ratio }}
                            />
                          </div>
                          <p className="text-[10px] text-gray-400 text-right">{dist.orderCount}</p>
                        </div>
                      ))
                    )}
                    {districtAnalytics.totalDeliveryOrders === 0 && (
                      <p className="text-center text-[11px] text-gray-400 pt-2 border-t border-gray-50">
                        No delivery orders recorded yet. District logistics volume updates automatically when orders are placed.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: STOREFRONT HERO BANNER MANAGEMENT PANE */}
          {activeTab === 'banner' && (
            <div className="space-y-8 text-left max-w-5xl">
              {/* Banner Header & Action Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-100 p-6 rounded-2xl shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-orange-50 text-[#ea580c] font-bold text-[10px] rounded-md uppercase tracking-wider">
                      Homepage Showcase
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        bannerForm.isActive !== false
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          bannerForm.isActive !== false ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                        }`}
                      />
                      {bannerForm.isActive !== false ? 'Banner Live on Storefront' : 'Banner Paused / Hidden'}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mt-1">Storefront Hero Banner Management</h3>
                  <p className="text-xs text-gray-500 max-w-xl mt-1">
                    Control the prominent hero showcase banner, headline, value propositions, feature tags, and authentic verification badges displayed at the top of the customer storefront.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleResetBanner}
                    className="px-3.5 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-gray-500" /> Reset Default
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveBanner}
                    className="px-5 py-2 bg-[#ea580c] hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
                  >
                    <Check className="w-4 h-4" /> Save & Publish Banner
                  </button>
                </div>
              </div>

              {/* Alert Feedback */}
              {bannerSavedAlert && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-3.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Storefront Hero Banner updated successfully! Changes are published live to the customer home page.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBannerSavedAlert(false)}
                    className="text-emerald-600 hover:text-emerald-800 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {bannerFileError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{bannerFileError}</span>
                </div>
              )}

              {/* Live Preview Box */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-[#ea580c]" /> Live Storefront Preview (Exact Customer Appearance)
                  </span>
                  <span className="text-[11px] text-gray-400">Updates in real time as you edit</span>
                </div>

                <div className="bg-[#000000] rounded-2xl overflow-hidden relative min-h-[380px] flex flex-col md:flex-row items-center p-6 sm:p-8 md:p-10 shadow-xl border border-gray-800 text-left">
                  {/* Overlay elements */}
                  <div className="absolute top-0 right-0 w-80 h-80 bg-[#ea580c]/15 rounded-full filter blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                  <div className="flex-1 text-left space-y-5 z-10">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ea580c]/25 text-[#ea580c] text-[11px] font-semibold tracking-wider uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c] animate-ping" />
                      Premium Retail Delivery
                    </span>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                      {bannerForm.headline || 'Premium Sourced UK Goods in Kampala'}
                    </h1>
                    <p className="text-gray-300 text-xs sm:text-sm max-w-lg leading-relaxed line-clamp-3">
                      {bannerForm.subtitle || "We offer a personal shopper service for products from the UK, ie bags, shoes, body lotions, shower gels, swimming costumes, Mary Kay products, Avon products, Body shop products, multivitamins, supplements, deodorants, perfumes, L'Oreal, clothes, Clarks shoes and lots more."}
                    </p>

                    {/* Features list */}
                    {bannerForm.features && bannerForm.features.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {bannerForm.features.map((feat, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full text-[11px] text-orange-200 font-medium"
                          >
                            <CheckCircle2 className="w-3 h-3 text-[#ea580c]" />
                            {feat}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 pt-2">
                      <span className="px-5 py-2.5 bg-[#ea580c] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-md">
                        {bannerForm.ctaPrimaryText || 'Browse Sourced Catalog'} <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                      <span className="px-5 py-2.5 bg-transparent text-white border border-gray-600 text-xs font-semibold rounded-lg">
                        {bannerForm.ctaSecondaryText || 'Product Request'}
                      </span>
                    </div>
                  </div>

                  {/* Featured Hero Product Image Preview */}
                  <div className="flex-1 flex justify-center items-center mt-6 md:mt-0 relative z-10 w-full max-w-xs md:max-w-sm">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-orange-500 rounded-2xl filter blur-xl opacity-15"></div>
                      <img
                        src={bannerForm.imageUrl || "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=800"}
                        alt={bannerForm.altText || "UK Sourced Showcase Item"}
                        className="rounded-xl shadow-2xl border border-gray-800 object-cover max-h-[240px] sm:max-h-[280px]"
                      />
                      <div className="absolute -bottom-3 -left-3 bg-white/95 backdrop-blur-md border border-gray-100 p-3 rounded-xl shadow-lg flex items-center gap-2.5">
                        <div className="bg-emerald-50 text-emerald-600 p-1.5 rounded-lg">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{bannerForm.badgeTitle || 'Verification'}</p>
                          <p className="text-[11px] font-bold text-gray-900">{bannerForm.badgeText || '100% Authentic UK Sourced'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Banner Configuration Editor */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Panel 1: Headlines & CTA Copy */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs space-y-5">
                  <div className="border-b border-gray-50 pb-3">
                    <h4 className="font-bold text-gray-900 text-sm">1. Headline & Action Buttons</h4>
                    <p className="text-xs text-gray-400 mt-0.5">Primary messages displayed to customers entering the store.</p>
                  </div>

                  <div className="space-y-4">
                    {/* Status Toggle */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <div>
                        <span className="text-xs font-bold text-gray-800">Banner Visibility on Homepage</span>
                        <p className="text-[11px] text-gray-500">Toggle whether this showcase banner is visible to customers.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBannerForm((prev) => ({ ...prev, isActive: prev.isActive === false ? true : false }))}
                        className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                          bannerForm.isActive !== false ? 'bg-[#ea580c]' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            bannerForm.isActive !== false ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Headline Title *</label>
                      <input
                        type="text"
                        required
                        value={bannerForm.headline || ''}
                        onChange={(e) => setBannerForm({ ...bannerForm, headline: e.target.value })}
                        placeholder="e.g. Premium Sourced UK Goods in Kampala"
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-orange-500/10 focus:border-[#ea580c]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Subtitle Description *</label>
                      <textarea
                        rows={3}
                        required
                        value={bannerForm.subtitle || ''}
                        onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                        placeholder="Describe personal shopper services, UK stores, and guarantees..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-orange-500/10 focus:border-[#ea580c]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700">Primary CTA Button</label>
                        <input
                          type="text"
                          value={bannerForm.ctaPrimaryText || ''}
                          onChange={(e) => setBannerForm({ ...bannerForm, ctaPrimaryText: e.target.value })}
                          placeholder="e.g. Browse Sourced Catalog"
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:bg-white focus:border-[#ea580c]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700">Secondary CTA Button</label>
                        <input
                          type="text"
                          value={bannerForm.ctaSecondaryText || ''}
                          onChange={(e) => setBannerForm({ ...bannerForm, ctaSecondaryText: e.target.value })}
                          placeholder="e.g. Product Request"
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:bg-white focus:border-[#ea580c]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Panel 2: Verification Floating Badge */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs space-y-5">
                  <div className="border-b border-gray-50 pb-3">
                    <h4 className="font-bold text-gray-900 text-sm">2. Authenticity Floating Badge</h4>
                    <p className="text-xs text-gray-400 mt-0.5">Appears over the hero product showcase image.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Badge Label / Header</label>
                      <input
                        type="text"
                        value={bannerForm.badgeTitle || ''}
                        onChange={(e) => setBannerForm({ ...bannerForm, badgeTitle: e.target.value })}
                        placeholder="e.g. Verification, Official UK Specs, Harrods Certified"
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:bg-white focus:border-[#ea580c]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Badge Description Text</label>
                      <input
                        type="text"
                        value={bannerForm.badgeText || ''}
                        onChange={(e) => setBannerForm({ ...bannerForm, badgeText: e.target.value })}
                        placeholder="e.g. 100% Authentic UK Sourced, With Till Slips"
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:bg-white focus:border-[#ea580c]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Image Alt Description</label>
                      <input
                        type="text"
                        value={bannerForm.altText || ''}
                        onChange={(e) => setBannerForm({ ...bannerForm, altText: e.target.value })}
                        placeholder="e.g. Apple iPhone 16 Pro Max Sourced"
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:bg-white focus:border-[#ea580c]"
                      />
                    </div>
                  </div>
                </div>

                {/* Panel 3: Banner Selling Feature Tags Manager */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs space-y-5 lg:col-span-2">
                  <div className="border-b border-gray-50 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">3. Storefront Selling Features & Value Propositions</h4>
                      <p className="text-xs text-gray-400 mt-0.5">These feature pills appear directly on the storefront banner to instill customer confidence.</p>
                    </div>
                    <span className="text-xs text-orange-700 font-bold bg-orange-50 px-2.5 py-1 rounded-md border border-orange-150 w-fit">
                      {bannerForm.features?.length || 0} Features Active
                    </span>
                  </div>

                  <div className="space-y-4">
                    {/* Active feature pills */}
                    <div className="flex flex-wrap gap-2 min-h-[42px] p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200 items-center">
                      {bannerForm.features && bannerForm.features.length > 0 ? (
                        bannerForm.features.map((feat, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-orange-200 text-orange-900 text-xs font-semibold rounded-full shadow-2xs group"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#ea580c]" />
                            {feat}
                            <button
                              type="button"
                              onClick={() => handleRemoveBannerFeature(idx)}
                              className="text-gray-400 hover:text-red-600 ml-1 cursor-pointer transition-colors"
                              title="Remove feature"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))
                      ) : (
                        <p className="text-xs text-gray-400 italic">No feature tags added yet. Add custom tags below or click quick suggestions.</p>
                      )}
                    </div>

                    {/* Add Custom Feature Input */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleAddBannerFeature();
                      }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        value={newBannerFeatureInput}
                        onChange={(e) => setNewBannerFeatureInput(e.target.value)}
                        placeholder="Type a new feature (e.g. 1-Year Global Apple Warranty, UK 3-Pin Fused Plugs)..."
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-xs outline-none focus:bg-white focus:border-[#ea580c]"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#ea580c] hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Feature
                      </button>
                    </form>

                    {/* Quick Suggested Features */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Quick Suggestions (Click to add):</span>
                      <div className="flex flex-wrap gap-2">
                        {[
                          'Direct London Sourced',
                          'Official UK Store Receipts',
                          '100% Genuine Guarantee',
                          'UK 3-Pin Fused Plugs (230V)',
                          'Harrods & Boots Oxford St Stock',
                          'Fast Entebbe Air Freight Delivery',
                          '1-Year Global Manufacturer Warranty',
                          'Doorstep Delivery in Kampala & Wakiso'
                        ].map((suggestion, idx) => {
                          const alreadyAdded = bannerForm.features?.includes(suggestion);
                          return (
                            <button
                              key={idx}
                              type="button"
                              disabled={alreadyAdded}
                              onClick={() => handleAddBannerFeature(suggestion)}
                              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-colors cursor-pointer ${
                                alreadyAdded
                                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                  : 'bg-orange-50/60 hover:bg-orange-100 text-orange-800 border-orange-200'
                              }`}
                            >
                              {alreadyAdded ? '✓ Added' : `+ ${suggestion}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Panel 4: Showcase Media Image & Curated Presets */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs space-y-5 lg:col-span-2">
                  <div className="border-b border-gray-50 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">4. Hero Showcase Media & Presets</h4>
                      <p className="text-xs text-gray-400 mt-0.5">Upload a product photo, paste an image URL, or choose from 6 curated showcase presets.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Direct Upload & URL */}
                    <div className="md:col-span-1 space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700">Image Web URL</label>
                        <input
                          type="url"
                          value={bannerForm.imageUrl}
                          onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })}
                          placeholder="https://..."
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:bg-white focus:border-[#ea580c]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700">Or Upload Image File</label>
                        <label className="border-2 border-dashed border-gray-200 hover:border-[#ea580c] rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-gray-50/50 hover:bg-orange-50/30">
                          <Upload className="w-5 h-5 text-gray-400 mb-1" />
                          <span className="text-xs font-bold text-gray-700">Browse Image File</span>
                          <span className="text-[10px] text-gray-400 mt-0.5">PNG, JPG, WebP under 3MB</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleBannerFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Current Image Thumbnail */}
                      {bannerForm.imageUrl && (
                        <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-100">
                          <img
                            src={bannerForm.imageUrl}
                            alt="Current Banner"
                            className="w-12 h-12 object-cover rounded-md border border-gray-200"
                          />
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-gray-500 uppercase">Current Image</span>
                            <p className="text-xs font-mono text-gray-700 truncate">{bannerForm.imageUrl}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Curated Presets Grid */}
                    <div className="md:col-span-2 space-y-2">
                      <span className="text-xs font-bold text-gray-700">6 Curated Showcase Presets (1-Click Switch):</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {BANNER_PRESETS.map((preset, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleSelectBannerPreset(preset)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                              bannerForm.imageUrl === preset.imageUrl
                                ? 'bg-orange-50/80 border-[#ea580c] shadow-xs'
                                : 'bg-gray-50/60 border-gray-200 hover:bg-white hover:border-gray-300'
                            }`}
                          >
                            <img
                              src={preset.imageUrl}
                              alt={preset.name}
                              className="w-14 h-14 rounded-lg object-cover border border-gray-200 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <h5 className="text-xs font-bold text-gray-900 truncate">{preset.name}</h5>
                                {bannerForm.imageUrl === preset.imageUrl && (
                                  <span className="text-[10px] font-bold text-[#ea580c] bg-white px-1.5 py-0.5 rounded border border-orange-200">Active</span>
                                )}
                              </div>
                              <p className="text-[10px] text-gray-500 truncate mt-0.5">{preset.headline}</p>
                              <span className="text-[9px] text-[#ea580c] font-semibold block mt-0.5">
                                {preset.features?.length || 0} features included
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Sticky Action Bar */}
              <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-xs">
                <button
                  type="button"
                  onClick={handleResetBanner}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-gray-500" /> Revert to Default Banner
                </button>
                <button
                  type="button"
                  onClick={handleSaveBanner}
                  className="px-6 py-2.5 bg-[#ea580c] hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
                >
                  <Check className="w-4 h-4" /> Save & Publish Banner to Storefront
                </button>
              </div>
            </div>
          )}

          {/* TAB B: PRODUCT MANAGEMENT PANE */}
          {activeTab === 'products' && (
            <div className="space-y-6 text-left">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Search products by title, brand, or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-xs outline-none focus:ring-1 focus:ring-orange-500 focus:border-[#ea580c]"
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>

                <button
                  onClick={() => {
                    setEditingProduct(null);
                    resetProductForm();
                    setShowProductModal(true);
                  }}
                  className="px-4 py-2 bg-[#ea580c] text-white hover:bg-orange-700 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add Product
                </button>
              </div>

              {/* Products Table list */}
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Product Details</th>
                      <th className="px-6 py-4">Retail Category</th>
                      <th className="px-6 py-4">Price</th>
                      <th className="px-6 py-4">Customer Status</th>
                      <th className="px-6 py-4">Store Stock</th>
                      <th className="px-6 py-4 text-center">Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {products
                      .filter((p) => {
                        const q = searchQuery.toLowerCase();
                        const catName = categories.find((c) => c.id === p.categoryId)?.name.toLowerCase() || '';
                        return (
                          p.title.toLowerCase().includes(q) ||
                          (p.brand && p.brand.toLowerCase().includes(q)) ||
                          p.id.toLowerCase().includes(q) ||
                          catName.includes(q)
                        );
                      })
                      .map((prod) => {
                        const hasDiscount = prod.originalPrice && prod.originalPrice > prod.basePrice;
                        return (
                          <tr key={prod.id} className="hover:bg-gray-50/50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <img src={prod.images[0]} alt="" className="w-11 h-11 rounded-lg object-cover border border-gray-100 shrink-0" />
                                <div className="min-w-0">
                                  <p className="font-bold text-gray-900 truncate max-w-xs">{prod.title}</p>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    {prod.brand && (
                                      <span className="text-[10px] font-medium bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                                        {prod.brand}
                                      </span>
                                    )}
                                    {prod.isFlashDeal && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                                        <Zap className="w-2.5 h-2.5 fill-current" /> Flash Deal
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-500 font-semibold">
                              {categories.find((c) => c.id === prod.categoryId)?.name ?? 'UK Sourced'}
                            </td>
                            <td className="px-6 py-4 font-mono font-bold text-gray-900">
                              <div className="flex flex-col">
                                <span>UGX {new Intl.NumberFormat('en-UG').format(prod.basePrice)}</span>
                                {hasDiscount && (
                                  <span className="text-[10px] text-red-500 line-through">
                                    UGX {new Intl.NumberFormat('en-UG').format(prod.originalPrice!)}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1.5">
                                <select
                                  value={
                                    prod.isPreOrder
                                      ? prod.preOrderStatus || 'Taking Pre-Orders'
                                      : prod.quantity <= 0
                                      ? 'Out of Stock'
                                      : 'In Stock'
                                  }
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === 'In Stock') {
                                      updateProduct({
                                        ...prod,
                                        isPreOrder: false,
                                        quantity: prod.quantity <= 0 ? 5 : prod.quantity,
                                      });
                                    } else if (val === 'Out of Stock') {
                                      updateProduct({
                                        ...prod,
                                        isPreOrder: false,
                                        quantity: 0,
                                      });
                                    } else if (val === 'Ready for Delivery') {
                                      updateProduct({
                                        ...prod,
                                        isPreOrder: false,
                                        preOrderStatus: undefined,
                                        preOrderEstimatedArrival: undefined,
                                        quantity: prod.quantity <= 0 ? 5 : prod.quantity,
                                      });
                                    } else {
                                      // One of the pre-order stages
                                      updateProduct({
                                        ...prod,
                                        isPreOrder: true,
                                        preOrderStatus: val as PreOrderStatus,
                                        preOrderEstimatedArrival: prod.preOrderEstimatedArrival || '10-14 Business Days',
                                      });
                                    }
                                  }}
                                  className={`text-[11px] font-bold px-2 py-1 rounded-md border outline-none cursor-pointer ${
                                    prod.isPreOrder
                                      ? 'bg-purple-50 text-purple-800 border-purple-200'
                                      : prod.quantity <= 0
                                      ? 'bg-red-50 text-red-700 border-red-200'
                                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  }`}
                                >
                                  <optgroup label="Direct Delivery Status">
                                    <option value="In Stock">✓ In Stock (Live)</option>
                                    <option value="Out of Stock">✗ Out of Stock</option>
                                  </optgroup>
                                  <optgroup label="Pre-Order Procurement Stages">
                                    <option value="Taking Pre-Orders">📦 Taking Pre-Orders</option>
                                    <option value="Procuring from UK Store">🛒 Procuring from UK Store</option>
                                    <option value="Air Cargo in Transit">✈️ Air Cargo in Transit</option>
                                    <option value="Customs & Kampala Processing">🏢 Customs & Kampala Processing</option>
                                    <option value="Ready for Delivery">🎉 Ready for Delivery</option>
                                  </optgroup>
                                </select>
                                {prod.isPreOrder && (
                                  <p className="text-[10px] text-purple-600 font-medium">
                                    Arrival: {prod.preOrderEstimatedArrival || '10-14 Days'}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  prod.quantity > 0
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-red-50 text-red-700'
                                }`}
                              >
                                {prod.quantity} units
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleEditProductClick(prod)}
                                  className="p-1.5 text-gray-400 hover:text-orange-700 hover:bg-orange-50 rounded transition-colors"
                                  title="Edit Specs / Override Discount"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteProduct(prod.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Delete Permanent"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: PRE-ORDER ITEMS MANAGEMENT PANE */}
          {activeTab === 'preorders' && (
            <AdminPreOrders
              products={products}
              categories={categories}
              updateProduct={updateProduct}
              addProduct={addProduct}
              deleteProduct={deleteProduct}
              updatePreOrderStatus={updatePreOrderStatus}
              toggleProductPreOrder={toggleProductPreOrder}
            />
          )}

          {/* TAB C: CATEGORY MANAGEMENT PANE */}
          {activeTab === 'categories' && (
            <div className="space-y-6 text-left max-w-2xl">
              <div className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm space-y-4">
                <h3 className="font-bold text-gray-900 text-sm sm:text-base">Define Sourced Categories</h3>
                <form onSubmit={handleCategoryAdd} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gourmet Sweets & Chocolates"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:bg-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#ea580c] text-white hover:bg-orange-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Add Category
                  </button>
                </form>
              </div>

              {/* Categories list table */}
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Category Name</th>
                      <th className="px-6 py-4">Catalog Count</th>
                      <th className="px-6 py-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {categories.map((cat) => {
                      const count = products.filter((p) => p.categoryId === cat.id).length;
                      return (
                        <tr key={cat.id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4 font-bold text-gray-800">{cat.name}</td>
                          <td className="px-6 py-4 font-semibold text-gray-500">{count} products</td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => deleteCategory(cat.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete Permanent"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB D: FLASH DEALS SCHEDULER PANE */}
          {activeTab === 'deals' && (
            <div className="space-y-6 text-left max-w-4xl">
              {/* Feedback Alert */}
              {dealSuccessMsg && (
                <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{dealSuccessMsg}</span>
                  </div>
                  <button onClick={() => setDealSuccessMsg('')} className="text-emerald-600 hover:text-emerald-800 p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Expired Deals Alert Banner */}
              {(() => {
                const expiredCount = products.filter(
                  (p) => p.isFlashDeal && p.flashDealEnd && new Date(p.flashDealEnd).getTime() <= Date.now()
                ).length;
                if (expiredCount === 0) return null;
                return (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-amber-900">
                          {expiredCount} Flash Deal{expiredCount > 1 ? 's' : ''} Expired
                        </h4>
                        <p className="text-[11px] text-amber-700 mt-0.5">
                          These items have passed their promotional deadline. Delete them to restore regular inventory pricing on the customer storefront.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDeleteAllExpiredModal(true)}
                      className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap self-end sm:self-auto transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete All Expired Deals ({expiredCount})
                    </button>
                  </div>
                );
              })()}

              <div className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm space-y-5">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base">Flash Sourcing Markdown Scheduler</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Configure promotional flash deal markdowns with an active discounted price and strikethrough original price.
                  </p>
                </div>

                {dealError && (
                  <div className="p-3 bg-red-50 text-red-700 border border-red-100 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {dealError}
                  </div>
                )}

                <form onSubmit={handleDealSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Target Product */}
                    <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                      <label className="text-xs font-bold text-gray-500">Target Markdown Product *</label>
                      <select
                        id="deal-product-select"
                        value={dealProductId}
                        onChange={(e) => {
                          const pid = e.target.value;
                          setDealProductId(pid);
                          const found = products.find((p) => p.id === pid);
                          if (found) {
                            setDealOriginalPrice(found.originalPrice ?? found.basePrice);
                            setDealDiscountedPrice(found.isFlashDeal ? found.basePrice : Math.round(found.basePrice * 0.8));
                          } else {
                            setDealOriginalPrice('');
                            setDealDiscountedPrice('');
                          }
                        }}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:border-[#ea580c] focus:outline-none"
                        required
                      >
                        <option value="">-- Choose Product --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title} (UGX {new Intl.NumberFormat('en-UG').format(p.basePrice)})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Original Price to be striked through */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-500">Original Price</label>
                        <span className="text-[10px] text-gray-400">Striked through</span>
                      </div>
                      <input
                        id="deal-original-price-input"
                        type="number"
                        min={1}
                        placeholder="e.g. 250,000"
                        value={dealOriginalPrice}
                        onChange={(e) => setDealOriginalPrice(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:border-[#ea580c] focus:outline-none font-mono"
                      />
                    </div>

                    {/* Discounted Price */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-500">Discounted Price *</label>
                        {dealOriginalPrice && dealDiscountedPrice && Number(dealOriginalPrice) > Number(dealDiscountedPrice) && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">
                            -{Math.round(((Number(dealOriginalPrice) - Number(dealDiscountedPrice)) / Number(dealOriginalPrice)) * 100)}%
                          </span>
                        )}
                      </div>
                      <input
                        id="deal-discounted-price-input"
                        type="number"
                        min={1}
                        required
                        placeholder="e.g. 180,000 (Discounted deal price)"
                        value={dealDiscountedPrice}
                        onChange={(e) => setDealDiscountedPrice(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:border-[#ea580c] focus:outline-none font-mono font-bold text-orange-800"
                      />
                    </div>

                    {/* Deal Expiration Date */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-500">Deal Expiration Date *</label>
                        <span className="text-[10px] text-[#ea580c] font-semibold">Future only</span>
                      </div>
                      <input
                        id="deal-end-date-input"
                        type="datetime-local"
                        min={getMinDealDateTime()}
                        value={dealEndDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            const selected = new Date(val).getTime();
                            if (selected <= Date.now()) {
                              setDealError('Invalid timeline: Deal expiration must be set to a future date and time.');
                            } else {
                              setDealError('');
                            }
                          }
                          setDealEndDate(val);
                        }}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:border-[#ea580c] focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <p className="text-[11px] text-gray-400">
                      The original price will be displayed striked through (e.g. <span className="line-through">UGX 250,000</span>) next to the active discounted deal price.
                    </p>
                    <button
                      id="deal-initialize-btn"
                      type="submit"
                      className="py-2.5 px-6 bg-[#ea580c] hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap self-end sm:self-auto"
                    >
                      <Zap className="w-4 h-4" /> Initialize Deal
                    </button>
                  </div>
                </form>
              </div>

              {/* Deals Filter Tabs & Counter */}
              {(() => {
                const allDeals = products.filter((p) => p.isFlashDeal);
                const activeDeals = allDeals.filter(
                  (p) => !p.flashDealEnd || new Date(p.flashDealEnd).getTime() > Date.now()
                );
                const expiredDeals = allDeals.filter(
                  (p) => p.flashDealEnd && new Date(p.flashDealEnd).getTime() <= Date.now()
                );

                const filteredDeals =
                  dealFilter === 'active' ? activeDeals : dealFilter === 'expired' ? expiredDeals : allDeals;

                return (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDealFilter('all')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            dealFilter === 'all'
                              ? 'bg-[#ea580c] text-white shadow-xs'
                              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                          }`}
                        >
                          All Deals ({allDeals.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setDealFilter('active')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            dealFilter === 'active'
                              ? 'bg-emerald-700 text-white shadow-xs'
                              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                          }`}
                        >
                          Active ({activeDeals.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setDealFilter('expired')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            dealFilter === 'expired'
                              ? 'bg-red-600 text-white shadow-xs'
                              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                          }`}
                        >
                          Expired ({expiredDeals.length})
                        </button>
                      </div>

                      {expiredDeals.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowDeleteAllExpiredModal(true)}
                          className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete all expired ({expiredDeals.length})
                        </button>
                      )}
                    </div>

                    {/* Active/Expired deals list */}
                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                          <tr>
                            <th className="px-6 py-4">Markdown Item</th>
                            <th className="px-6 py-4">Price</th>
                            <th className="px-6 py-4">Timeline Expiration</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {filteredDeals.map((prod) => {
                            const isExpired = prod.flashDealEnd
                              ? new Date(prod.flashDealEnd).getTime() <= Date.now()
                              : false;
                            const hasDiscount = prod.originalPrice && prod.originalPrice > prod.basePrice;
                            return (
                              <tr key={prod.id} className="hover:bg-gray-50/50">
                                <td className="px-6 py-4 font-bold text-gray-800">
                                  <div className="flex items-center gap-2.5">
                                    <img
                                      src={prod.images[0]}
                                      alt=""
                                      className="w-9 h-9 rounded-lg object-cover border border-gray-100 shrink-0"
                                    />
                                    <div>
                                      <p className="truncate max-w-xs">{prod.title}</p>
                                      {prod.brand && (
                                        <span className="text-[10px] text-gray-400">
                                          {prod.brand}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 font-mono">
                                  <div className="font-bold text-orange-800">
                                    UGX {new Intl.NumberFormat('en-UG').format(prod.basePrice)}
                                  </div>
                                  {hasDiscount && (
                                    <div className="line-through text-gray-400 text-[11px]">
                                      UGX {new Intl.NumberFormat('en-UG').format(prod.originalPrice!)}
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4 font-mono text-gray-500">
                                  {prod.flashDealEnd ? new Date(prod.flashDealEnd).toLocaleString() : 'N/A'}
                                </td>
                                <td className="px-6 py-4">
                                  {isExpired ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                                      <AlertTriangle className="w-3 h-3" /> Expired
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                      <Zap className="w-3 h-3 fill-current" /> Live on Storefront
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  {isExpired ? (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveDeal(prod)}
                                      className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 mx-auto border border-red-200"
                                      title="Delete expired flash deal and restore standard price"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      Delete Expired Deal
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveDeal(prod)}
                                      className="px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                                      title="Disable flash deal"
                                    >
                                      Disable Deal
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                          {filteredDeals.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                {dealFilter === 'expired'
                                  ? 'No expired flash deals found! All deals are currently active.'
                                  : dealFilter === 'active'
                                  ? 'No active flash deals running. Schedule one above!'
                                  : 'No items designated for flash deals.'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB E: DISTRICT LOGISTICS SETTINGS */}
          {activeTab === 'districts' && (
            <div className="space-y-6 text-left max-w-2xl">
              <div className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm space-y-4">
                <h3 className="font-bold text-gray-900 text-sm sm:text-base">District Routing Configurator</h3>
                <form onSubmit={handleDistrictSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500">Ugandan District Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Masaka"
                      value={newDistrictForm.name}
                      onChange={(e) => setNewDistrictForm({ ...newDistrictForm, name: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500">Delivery Fee (UGX)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 12000"
                      value={newDistrictForm.fee || ''}
                      onChange={(e) => setNewDistrictForm({ ...newDistrictForm, fee: Number(e.target.value) })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-[#ea580c] hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Add Routing Zone
                  </button>
                </form>
              </div>

              {/* District Fee Table list */}
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Delivery District Zone</th>
                      <th className="px-6 py-4">Logistics Routing Fee</th>
                      <th className="px-6 py-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {districts.map((d) => (
                      <tr key={d.name} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 font-bold text-gray-800">{d.name}</td>
                        <td className="px-6 py-4 font-mono font-bold text-gray-900">
                          UGX {new Intl.NumberFormat('en-UG').format(d.fee)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => deleteDistrict(d.name)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete Zone"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB F: ORDERS & FULFILLMENT */}
          {activeTab === 'orders' && (() => {
            const riderOrders = orders.filter((o) => o.deliveryPath === 'delivery');
            const completedRiderOrders = riderOrders.filter((o) => ['Delivered', 'Failed', 'Returned'].includes(o.status));
            const ordersWithPayments = orders.filter((o) => Boolean(o.paymentTransactionRef || o.paymentStatus || (o.paymentMethod && o.paymentMethod !== 'COD')));
            const pendingPaymentsCount = orders.filter((o) => o.paymentStatus === 'Pending Verification').length;
            const pickupOrders = orders.filter((o) => o.deliveryPath === 'pickup');

            const filteredOrders = orders.filter((o) => {
              const query = searchQuery.toLowerCase();
              return (
                o.id.toLowerCase().includes(query) ||
                o.customerName.toLowerCase().includes(query) ||
                (o.customerPhone && o.customerPhone.toLowerCase().includes(query)) ||
                (o.paymentTransactionRef && o.paymentTransactionRef.toLowerCase().includes(query))
              );
            });

            return (
              <div className="space-y-6 text-left">
                {/* SUB-NAVIGATION TABS */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setOrdersSubView('all')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        ordersSubView === 'all'
                          ? 'bg-[#ea580c] text-white shadow-xs'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      <span>All Orders ({orders.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOrdersSubView('items_lookup')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        ordersSubView === 'items_lookup'
                          ? 'bg-[#ea580c] text-white shadow-xs'
                          : 'bg-orange-50 text-[#ea580c] border border-orange-200 hover:bg-orange-100'
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Search Ordered Items by Code</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOrdersSubView('payments')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        ordersSubView === 'payments'
                          ? 'bg-[#ea580c] text-white shadow-xs'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Payment Desk & Txn IDs ({ordersWithPayments.length})</span>
                      {pendingPaymentsCount > 0 && (
                        <span className="px-1.5 py-0.2 bg-amber-400 text-amber-950 font-black rounded-full text-[10px]">
                          {pendingPaymentsCount}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setOrdersSubView('rider_dispatch')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        ordersSubView === 'rider_dispatch'
                          ? 'bg-[#ea580c] text-white shadow-xs'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Rider Route & Dispatch ({riderOrders.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOrdersSubView('pickup')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        ordersSubView === 'pickup'
                          ? 'bg-[#ea580c] text-white shadow-xs'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Store Pickup Desk ({pickupOrders.length})</span>
                    </button>
                  </div>

                  {/* Rider Orders Cleanup Action */}
                  {completedRiderOrders.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowBatchDeleteRiderModal(true)}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                      title="Purge completed past orders from rider route queue"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      <span>Purge Done Rider Orders ({completedRiderOrders.length})</span>
                    </button>
                  )}
                </div>

                {/* NOTICES */}
                {batchDeleteResultNotice && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{batchDeleteResultNotice}</span>
                  </div>
                )}

                {paymentActionFeedback && (
                  <div className="p-3 bg-orange-50 border border-orange-200 text-orange-900 rounded-xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#ea580c] shrink-0" />
                    <span>{paymentActionFeedback}</span>
                  </div>
                )}

                {/* SEARCH & METRIC HEADER */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="relative max-w-sm w-full">
                    <input
                      type="text"
                      placeholder="Search order ID, recipient, or Txn ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-xs outline-none focus:ring-1 focus:ring-orange-500 focus:border-[#ea580c]"
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full font-medium text-[11px]">
                      Displaying: {filteredOrders.length}
                    </span>
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Done Orders: {orders.filter((o) => ['Delivered', 'Picked Up'].includes(o.status)).length}
                    </span>
                  </div>
                </div>

                {/* SUB-VIEW: SEARCH ORDERED ITEMS BY ORDER CODE */}
                {ordersSubView === 'items_lookup' && (() => {
                  const query = orderCodeSearch.trim().toLowerCase();
                  const matchedOrders = query
                    ? orders.filter(
                        (o) =>
                          o.id.toLowerCase().includes(query) ||
                          (o.customerPhone && o.customerPhone.toLowerCase().includes(query)) ||
                          o.customerName.toLowerCase().includes(query)
                      )
                    : [];

                  const exactMatch = orders.find((o) => o.id.toLowerCase() === query);
                  const activeOrder = exactMatch || (matchedOrders.length > 0 ? matchedOrders[0] : null);

                  const totalOrderedQuantity = activeOrder
                    ? activeOrder.items.reduce((sum, it) => sum + (it.quantity || 1), 0)
                    : 0;

                  return (
                    <div className="space-y-6" id="admin-order-items-lookup-section">
                      {/* Search Header Card */}
                      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4 text-left">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-orange-50 text-[#ea580c] rounded-lg">
                                <ShoppingBag className="w-5 h-5" />
                              </div>
                              <h3 className="text-base font-bold text-gray-900">
                                Search Ordered Items by Order Code
                              </h3>
                            </div>
                            <p className="text-xs text-gray-500">
                              Look up any customer's package by their order code to see all items ordered, quantities, sizes, product photos, variations, and pricing.
                            </p>
                          </div>

                          {activeOrder && (
                            <button
                              type="button"
                              onClick={() => {
                                const summaryLines = [
                                  `UK2UG ORDER ITEMS REPORT [${activeOrder.id}]`,
                                  `Customer: ${activeOrder.customerName} (${activeOrder.customerPhone || 'N/A'})`,
                                  `Date: ${activeOrder.date} | Status: ${activeOrder.status}`,
                                  `Fulfillment: ${activeOrder.deliveryPath === 'pickup' ? 'Store Pickup (Thobani Centre)' : `Delivery to ${activeOrder.deliveryDetails?.district || 'Kampala'}`}`,
                                  `Total: UGX ${new Intl.NumberFormat('en-UG').format(activeOrder.totalAmount)}`,
                                  `----------------------------------------`,
                                  `ORDERED ITEMS (${activeOrder.items.length}):`,
                                  ...activeOrder.items.map((it, idx) => {
                                    const varStr = it.variationName ? ` [${it.variationName}]` : it.selectedSize ? ` [Size: ${it.selectedSize}]` : '';
                                    const unitP = it.unitPrice ?? it.price;
                                    return `${idx + 1}. ${it.title}${varStr} - Qty: ${it.quantity} x UGX ${new Intl.NumberFormat('en-UG').format(unitP)} = UGX ${new Intl.NumberFormat('en-UG').format(unitP * it.quantity)}`;
                                  }),
                                ].join('\n');

                                navigator.clipboard.writeText(summaryLines);
                                setCopiedOrderSummary(activeOrder.id);
                                setTimeout(() => setCopiedOrderSummary(null), 3000);
                              }}
                              className="px-3.5 py-2 bg-orange-50 hover:bg-orange-100 text-[#ea580c] border border-orange-200 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>{copiedOrderSummary === activeOrder.id ? 'Copied Items Summary!' : 'Copy Items Summary'}</span>
                            </button>
                          )}
                        </div>

                        {/* Search Input Box */}
                        <div className="space-y-3">
                          <div className="flex flex-col sm:flex-row gap-2.5">
                            <div className="relative flex-1">
                              <input
                                type="text"
                                value={orderCodeSearch}
                                onChange={(e) => setOrderCodeSearch(e.target.value)}
                                placeholder="Enter Order Code (e.g. UK2UG-2026-394850)..."
                                className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-10 py-3 text-xs sm:text-sm font-mono font-bold text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c] transition-all shadow-inner"
                              />
                              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                              {orderCodeSearch && (
                                <button
                                  type="button"
                                  onClick={() => setOrderCodeSearch('')}
                                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 p-0.5 rounded cursor-pointer"
                                  title="Clear Search"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>

                            {orderCodeSearch && (
                              <button
                                type="button"
                                onClick={() => setOrderCodeSearch('')}
                                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                              >
                                Reset Search
                              </button>
                            )}
                          </div>

                          {/* Quick Order Code Suggestions */}
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                              Quick Select Order Code:
                            </span>
                            {orders.slice(0, 6).map((ord) => (
                              <button
                                key={ord.id}
                                type="button"
                                onClick={() => setOrderCodeSearch(ord.id)}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition-all cursor-pointer border ${
                                  orderCodeSearch.trim().toLowerCase() === ord.id.toLowerCase()
                                    ? 'bg-[#ea580c] text-white border-[#ea580c] shadow-xs'
                                    : 'bg-gray-50 hover:bg-orange-50 text-gray-700 hover:text-[#ea580c] border-gray-200'
                                }`}
                              >
                                {ord.id}
                                <span className="text-[9px] font-sans font-normal text-gray-400 ml-1">
                                  ({ord.customerName.split(' ')[0]})
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Multiple Matches Pills (if search matches more than 1 order) */}
                      {matchedOrders.length > 1 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-left space-y-2">
                          <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                            <Info className="w-4 h-4 text-amber-700" />
                            <span>Multiple orders found matching "{orderCodeSearch}" ({matchedOrders.length}). Click one to inspect its items:</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {matchedOrders.map((mo) => (
                              <button
                                key={mo.id}
                                type="button"
                                onClick={() => setOrderCodeSearch(mo.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
                                  activeOrder?.id === mo.id
                                    ? 'bg-amber-800 text-white border-amber-900 shadow-xs'
                                    : 'bg-white hover:bg-amber-100 text-amber-900 border-amber-300'
                                }`}
                              >
                                {mo.id} — {mo.customerName} ({mo.items.length} items)
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* RESULT 1: ACTIVE ORDER FOUND & DISPLAYING ORDERED ITEMS */}
                      {activeOrder ? (
                        <div className="space-y-6 text-left">
                          {/* Order Header / Specs Banner */}
                          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
                            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5">
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#ea580c] block">
                                  Inspecting Order Package
                                </span>
                                <div className="flex items-center gap-2.5">
                                  <h2 className="text-xl sm:text-2xl font-black font-mono text-gray-900 select-all">
                                    {activeOrder.id}
                                  </h2>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(activeOrder.id);
                                      setCopiedOrderSummary(`code-${activeOrder.id}`);
                                      setTimeout(() => setCopiedOrderSummary(null), 2000);
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-[#ea580c] hover:bg-orange-50 rounded-md transition-colors cursor-pointer"
                                    title="Copy Order Code"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                  {activeOrder.deliveryPin && (
                                    <span className="font-mono text-xs font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                                      Handover PIN: {activeOrder.deliveryPin}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-400 flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-[#ea580c]" />
                                  <span>Placed on: <strong>{activeOrder.date}</strong></span>
                                </div>
                              </div>

                              {/* Status and Action Controls */}
                              <div className="flex flex-wrap items-center gap-3">
                                <div className="space-y-1 text-right">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                                    Current Fulfillment Status
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                                        ['Delivered', 'Picked Up'].includes(activeOrder.status)
                                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                          : ['Ready for Pickup', 'Out for Delivery'].includes(activeOrder.status)
                                          ? 'bg-orange-100 text-orange-900 border border-orange-200'
                                          : 'bg-yellow-100 text-yellow-900 border border-yellow-200'
                                      }`}
                                    >
                                      {activeOrder.status}
                                    </span>
                                    <select
                                      value={activeOrder.status}
                                      onChange={(e) => updateOrderStatus(activeOrder.id, e.target.value as any)}
                                      className="bg-gray-50 hover:bg-white border border-gray-300 text-xs font-bold rounded-lg px-2.5 py-1 text-gray-700 outline-none cursor-pointer"
                                    >
                                      <option value="Pending">Pending</option>
                                      <option value="Paid">Paid</option>
                                      <option value="Processing">Processing</option>
                                      <option value="Ready for Pickup">Ready for Pickup</option>
                                      <option value="Out for Delivery">Out for Delivery</option>
                                      <option value="Picked Up">Picked Up</option>
                                      <option value="Delivered">Delivered</option>
                                      <option value="Failed">Failed</option>
                                      <option value="Returned">Returned</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Customer & Fulfillment Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="p-4 bg-gray-50 rounded-xl border border-gray-150 space-y-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                                  Customer Contact
                                </span>
                                <p className="text-sm font-bold text-gray-900">{activeOrder.customerName}</p>
                                <p className="text-xs font-mono text-gray-600 flex items-center gap-1">
                                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                                  {activeOrder.customerPhone || 'No phone provided'}
                                </p>
                                {activeOrder.customerEmail && (
                                  <p className="text-xs text-gray-500 font-mono truncate">{activeOrder.customerEmail}</p>
                                )}
                              </div>

                              <div className="p-4 bg-gray-50 rounded-xl border border-gray-150 space-y-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                                  Fulfillment Channel
                                </span>
                                {activeOrder.deliveryPath === 'pickup' ? (
                                  <div className="space-y-1">
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-800 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                                      <MapPin className="w-3.5 h-3.5 text-[#ea580c]" /> Store Collection Desk
                                    </span>
                                    <p className="text-xs text-gray-600">Thobani Center Shop 16, Ground Floor, Kampala</p>
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                      <Truck className="w-3.5 h-3.5 text-amber-700" /> Doorstep Delivery
                                    </span>
                                    <p className="text-xs text-gray-800 font-medium">
                                      {activeOrder.deliveryDetails?.district || 'Kampala'}, {activeOrder.deliveryDetails?.area || ''}
                                    </p>
                                    {activeOrder.deliveryDetails?.landmark && (
                                      <p className="text-[11px] text-gray-500">Landmark: {activeOrder.deliveryDetails.landmark}</p>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="p-4 bg-gray-50 rounded-xl border border-gray-150 space-y-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                                  Payment & Invoice
                                </span>
                                <p className="text-xs font-bold text-gray-800">
                                  {activeOrder.paymentMethod === 'COD' ? 'Cash on Delivery' : activeOrder.paymentMethod || 'Store Counter'}
                                </p>
                                {activeOrder.paymentTransactionRef && (
                                  <p className="text-[11px] font-mono text-orange-800 bg-orange-50 px-2 py-0.5 rounded border border-orange-200 inline-block">
                                    Txn ID: {activeOrder.paymentTransactionRef}
                                  </p>
                                )}
                                <p className="text-sm font-mono font-black text-gray-900">
                                  UGX {new Intl.NumberFormat('en-UG').format(activeOrder.totalAmount)}
                                </p>
                              </div>
                            </div>

                            {/* ORDERED ITEMS TABLE & CARDS */}
                            <div className="space-y-3 pt-2">
                              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                <div className="flex items-center gap-2">
                                  <ShoppingBag className="w-4 h-4 text-[#ea580c]" />
                                  <h4 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide">
                                    Ordered Items In This Package ({activeOrder.items.length})
                                  </h4>
                                </div>
                                <span className="text-xs font-bold text-orange-800 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                                  {totalOrderedQuantity} Total {totalOrderedQuantity === 1 ? 'Unit' : 'Units'} Ordered
                                </span>
                              </div>

                              <div className="divide-y divide-gray-100 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                                {activeOrder.items.map((item, idx) => {
                                  const prod = products.find((p) => p.id === item.productId);
                                  const itemImg = prod?.images?.[0] || '';
                                  const unitPrice = item.unitPrice ?? item.price;
                                  const lineTotal = (item.totalPrice ?? (unitPrice * item.quantity));

                                  return (
                                    <div
                                      key={idx}
                                      className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50/60 transition-colors"
                                    >
                                      <div className="flex items-start sm:items-center gap-4 min-w-0">
                                        {/* Item Photo */}
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                                          {itemImg ? (
                                            <img
                                              src={itemImg}
                                              alt={item.title}
                                              className="w-full h-full object-cover"
                                              onError={(e) => {
                                                (e.currentTarget as HTMLImageElement).src =
                                                  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80';
                                              }}
                                            />
                                          ) : (
                                            <div className="w-full h-full bg-orange-50 text-[#ea580c] flex flex-col items-center justify-center font-bold text-xs">
                                              <ShoppingBag className="w-6 h-6" />
                                              <span className="text-[10px] mt-0.5">UK2UG</span>
                                            </div>
                                          )}
                                        </div>

                                        {/* Item Info */}
                                        <div className="space-y-1.5 min-w-0">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-mono">
                                              Item #{idx + 1}
                                            </span>
                                            {prod?.sku && (
                                              <span className="text-[10px] font-mono text-gray-400">
                                                SKU: {prod.sku}
                                              </span>
                                            )}
                                            {prod?.brand && (
                                              <span className="text-[10px] font-bold text-[#ea580c] bg-orange-50 px-2 py-0.5 rounded">
                                                {prod.brand}
                                              </span>
                                            )}
                                          </div>

                                          <h5 className="font-extrabold text-sm sm:text-base text-gray-900 leading-snug">
                                            {item.title}
                                          </h5>

                                          {/* Selected Variation or Size Badge */}
                                          <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                            {item.variationName ? (
                                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-orange-50 text-orange-900 border border-orange-200">
                                                <Tag className="w-3 h-3 text-[#ea580c]" />
                                                Selected Variation: {item.variationName}
                                              </span>
                                            ) : item.selectedSize ? (
                                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200">
                                                Size: {item.selectedSize}
                                              </span>
                                            ) : (
                                              <span className="text-[11px] text-gray-400 italic">
                                                Standard Retail Spec
                                              </span>
                                            )}

                                            {/* Catalog Stock Badge */}
                                            {prod && (
                                              <span
                                                className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                                                  prod.quantity > 5
                                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                                    : prod.quantity > 0
                                                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                                    : 'bg-red-50 text-red-800 border border-red-200'
                                                }`}
                                              >
                                                {prod.quantity > 0 ? `${prod.quantity} remaining in stock` : 'Out of stock in catalog'}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Pricing and Quantities */}
                                      <div className="sm:text-right shrink-0 bg-gray-50 sm:bg-transparent p-3 sm:p-0 rounded-xl w-full sm:w-auto flex sm:flex-col justify-between sm:justify-center items-center sm:items-end border sm:border-0 border-gray-150">
                                        <div className="text-left sm:text-right">
                                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                                            Unit Price × Qty
                                          </span>
                                          <span className="font-mono text-xs sm:text-sm font-semibold text-gray-700">
                                            UGX {new Intl.NumberFormat('en-UG').format(unitPrice)} ×{' '}
                                            <strong className="text-gray-900 text-sm font-bold bg-white sm:bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                              {item.quantity}
                                            </strong>
                                          </span>
                                        </div>

                                        <div className="text-right sm:mt-1.5">
                                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                                            Subtotal
                                          </span>
                                          <span className="font-mono text-base sm:text-lg font-black text-gray-900">
                                            UGX {new Intl.NumberFormat('en-UG').format(lineTotal)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Financial Totals Breakdown Bar */}
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="text-xs text-gray-500 space-y-1">
                                <p className="font-bold text-gray-800 flex items-center gap-1.5">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  All {activeOrder.items.length} items logged under Order Code: <span className="font-mono text-[#ea580c]">{activeOrder.id}</span>
                                </p>
                                <p>Authentic UK sourcing verification invoice breakdown.</p>
                              </div>

                              <div className="space-y-1 sm:text-right font-mono text-xs">
                                <div className="flex justify-between sm:justify-end gap-4 text-gray-600">
                                  <span>Items Subtotal:</span>
                                  <span className="font-bold text-gray-900">
                                    UGX {new Intl.NumberFormat('en-UG').format(activeOrder.subtotal || activeOrder.totalAmount)}
                                  </span>
                                </div>
                                {activeOrder.deliveryFee !== undefined && activeOrder.deliveryFee > 0 && (
                                  <div className="flex justify-between sm:justify-end gap-4 text-gray-600">
                                    <span>Fulfillment Fee:</span>
                                    <span className="font-bold text-gray-900">
                                      UGX {new Intl.NumberFormat('en-UG').format(activeOrder.deliveryFee)}
                                    </span>
                                  </div>
                                )}
                                <div className="flex justify-between sm:justify-end gap-4 text-sm font-black text-gray-950 pt-1 border-t border-gray-200">
                                  <span className="font-sans">Grand Total:</span>
                                  <span className="text-orange-900">
                                    UGX {new Intl.NumberFormat('en-UG').format(activeOrder.totalAmount)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : orderCodeSearch.trim() ? (
                        /* RESULT 2: SEARCH CODE ENTERED BUT NO MATCH FOUND */
                        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center space-y-4">
                          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
                            <AlertTriangle className="w-6 h-6" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-base font-bold text-gray-900">
                              No Order Found for Code "{orderCodeSearch}"
                            </h4>
                            <p className="text-xs text-gray-500 max-w-md mx-auto">
                              We couldn't find an order matching that code. Please check the spelling or select from the active orders listed below.
                            </p>
                          </div>
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => setOrderCodeSearch('')}
                              className="px-4 py-2 bg-[#ea580c] text-white text-xs font-bold rounded-lg hover:bg-orange-700 transition-colors cursor-pointer"
                            >
                              Clear Search & Show Recent Orders
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* RESULT 3: EMPTY STATE - PROMPT TO ENTER CODE OR CLICK RECENT */
                        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center space-y-6">
                          <div className="w-14 h-14 bg-orange-50 text-[#ea580c] rounded-2xl flex items-center justify-center mx-auto shadow-xs border border-orange-100">
                            <Search className="w-7 h-7" />
                          </div>
                          <div className="space-y-2 max-w-lg mx-auto">
                            <h4 className="text-lg font-bold text-gray-900">
                              Enter an Order Code to Inspect Ordered Items
                            </h4>
                            <p className="text-xs text-gray-500 leading-relaxed">
                              Type the order code above or click any order below to view the items, item images, quantities, sizes, customer recipient details, and packing status.
                            </p>
                          </div>

                          {/* Recent Orders Grid */}
                          <div className="max-w-2xl mx-auto pt-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-3 text-left">
                              Available Active Orders ({orders.length}):
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                              {orders.slice(0, 8).map((ord) => (
                                <div
                                  key={ord.id}
                                  onClick={() => setOrderCodeSearch(ord.id)}
                                  className="p-3.5 bg-gray-50 hover:bg-orange-50/60 border border-gray-200 hover:border-orange-300 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 group"
                                >
                                  <div className="space-y-1 min-w-0">
                                    <span className="font-mono text-xs font-extrabold text-[#ea580c] group-hover:underline">
                                      {ord.id}
                                    </span>
                                    <p className="text-xs font-bold text-gray-800 truncate">{ord.customerName}</p>
                                    <p className="text-[10px] text-gray-500">{ord.items.length} {ord.items.length === 1 ? 'item' : 'items'} • UGX {new Intl.NumberFormat('en-UG').format(ord.totalAmount)}</p>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#ea580c] group-hover:translate-x-1 transition-all shrink-0" />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* SUB-VIEW 1: PAYMENT VERIFICATION DESK & TXN IDs */}
                {ordersSubView === 'payments' && (
                  <div className="space-y-4">
                    {/* Overview Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-2xs">
                        <div className="text-[11px] text-gray-500 font-bold uppercase">Prepaid Orders</div>
                        <div className="text-xl font-black text-gray-900 mt-1">{ordersWithPayments.length}</div>
                        <div className="text-[10px] text-orange-600 mt-0.5">Mobile Money & Bank</div>
                      </div>
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl shadow-2xs">
                        <div className="text-[11px] text-amber-700 font-bold uppercase">Pending Verification</div>
                        <div className="text-xl font-black text-amber-900 mt-1">{pendingPaymentsCount}</div>
                        <div className="text-[10px] text-amber-700 mt-0.5">Awaiting admin review</div>
                      </div>
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl shadow-2xs">
                        <div className="text-[11px] text-emerald-700 font-bold uppercase">Verified Paid</div>
                        <div className="text-xl font-black text-emerald-900 mt-1">
                          {orders.filter((o) => o.paymentStatus === 'Paid' || o.status === 'Paid').length}
                        </div>
                        <div className="text-[10px] text-emerald-700 mt-0.5">Approved & Cleared</div>
                      </div>
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl shadow-2xs">
                        <div className="text-[11px] text-blue-700 font-bold uppercase">Cash on Delivery</div>
                        <div className="text-xl font-black text-blue-900 mt-1">
                          {orders.filter((o) => o.paymentMethod === 'COD').length}
                        </div>
                        <div className="text-[10px] text-blue-700 mt-0.5">Settled at Handover</div>
                      </div>
                    </div>

                    {/* Payments Table */}
                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                      <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                        <div>
                          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                            <CreditCard className="w-4 h-4 text-[#ea580c]" />
                            Customer Submitted Payment Details & Verification Desk
                          </h3>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            Real-time customer payment submissions. Review transaction IDs, verify customer submissions, and approve payments.
                          </p>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                            <tr>
                              <th className="px-5 py-3">Order Code</th>
                              <th className="px-5 py-3">Customer Information</th>
                              <th className="px-5 py-3">Payment Channel</th>
                              <th className="px-5 py-3">Transaction ID / Ref</th>
                              <th className="px-5 py-3">Invoice Amount</th>
                              <th className="px-5 py-3">Status</th>
                              <th className="px-5 py-3 text-center">Verification Controls</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {filteredOrders
                              .filter((o) => Boolean(o.paymentTransactionRef || o.paymentStatus || (o.paymentMethod && o.paymentMethod !== 'COD')))
                              .map((ord) => {
                                const isPending = ord.paymentStatus === 'Pending Verification';
                                const isPaid = ord.paymentStatus === 'Paid' || ord.status === 'Paid';
                                const isFailed = ord.paymentStatus === 'Failed';
                                const txnRef = ord.paymentTransactionRef || ord.transactionId || 'None submitted';

                                return (
                                  <tr key={ord.id} className="hover:bg-gray-50/60 transition-colors">
                                    <td className="px-5 py-3 font-mono font-bold text-gray-900 whitespace-nowrap">
                                      <div
                                        onClick={() => {
                                          setOrderCodeSearch(ord.id);
                                          setOrdersSubView('items_lookup');
                                        }}
                                        className="cursor-pointer hover:text-[#ea580c] hover:underline flex items-center gap-1"
                                        title="Click to view ordered items"
                                      >
                                        <span>{ord.id}</span>
                                        <Eye className="w-3 h-3 text-orange-600 opacity-60 hover:opacity-100" />
                                      </div>
                                      <div className="text-[10px] text-gray-400 font-sans">{ord.date}</div>
                                    </td>

                                    <td className="px-5 py-3">
                                      <div className="font-bold text-gray-800">{ord.customerName}</div>
                                      <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                                        <Phone className="w-3 h-3 text-gray-400" />
                                        {ord.customerPhone}
                                      </div>
                                    </td>

                                    <td className="px-5 py-3">
                                      <div className="font-bold text-gray-800">{ord.paymentMethod}</div>
                                      {ord.paymentPhone && (
                                        <div className="text-[10px] text-orange-700 font-mono">
                                          Payer: {ord.paymentPhone}
                                        </div>
                                      )}
                                    </td>

                                    <td className="px-5 py-3">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-[11px] border border-gray-200">
                                          {txnRef}
                                        </span>
                                        {ord.paymentTransactionRef && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              navigator.clipboard.writeText(ord.paymentTransactionRef || '');
                                              setPaymentActionFeedback(`Copied Txn ID: ${ord.paymentTransactionRef}`);
                                              setTimeout(() => setPaymentActionFeedback(''), 3000);
                                            }}
                                            className="p-1 text-gray-400 hover:text-orange-700 hover:bg-orange-50 rounded cursor-pointer transition-colors"
                                            title="Copy Transaction ID"
                                          >
                                            <Copy className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                      {ord.paymentSubmittedAt && (
                                        <div className="text-[10px] text-gray-400 mt-0.5 font-mono">
                                          Submitted: {new Date(ord.paymentSubmittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                      )}
                                    </td>

                                    <td className="px-5 py-3 font-mono font-bold text-gray-950 whitespace-nowrap">
                                      UGX {new Intl.NumberFormat('en-UG').format(ord.totalAmount)}
                                    </td>

                                    <td className="px-5 py-3 whitespace-nowrap">
                                      <span
                                        className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                          isPaid
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : isFailed
                                            ? 'bg-red-100 text-red-800'
                                            : isPending
                                            ? 'bg-amber-100 text-amber-900 animate-pulse'
                                            : 'bg-gray-100 text-gray-700'
                                        }`}
                                      >
                                        {ord.paymentStatus || (ord.status === 'Paid' ? 'Paid' : 'Pending Verification')}
                                      </span>
                                    </td>

                                    <td className="px-5 py-3 text-center whitespace-nowrap">
                                      <div className="flex items-center justify-center gap-1.5">
                                        {!isPaid && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (verifyOrderPayment) {
                                                verifyOrderPayment(ord.id, 'Paid');
                                              } else {
                                                updateOrderStatus(ord.id, 'Paid');
                                              }
                                              setPaymentActionFeedback(`Order #${ord.id} marked as Paid. Customer notified!`);
                                              setTimeout(() => setPaymentActionFeedback(''), 4000);
                                            }}
                                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                                            title="Verify and Approve Payment"
                                          >
                                            <CheckCircle2 className="w-3 h-3" />
                                            <span>Approve</span>
                                          </button>
                                        )}

                                        {!isFailed && !isPaid && (
                                          <button
                                            type="button"
                                            onClick={() => setShowFlagPaymentModal(ord)}
                                            className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                                            title="Flag Payment Issue"
                                          >
                                            Flag
                                          </button>
                                        )}

                                        <button
                                          type="button"
                                          onClick={() => setInspectPaymentOrder(ord)}
                                          className="px-2 py-1 bg-gray-100 hover:bg-orange-50 hover:text-orange-800 text-gray-700 rounded text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                                          title="Inspect Payment Details"
                                        >
                                          <Eye className="w-3 h-3" />
                                          <span>Details</span>
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUB-VIEW 2: RIDER ROUTE & DISPATCH */}
                {ordersSubView === 'rider_dispatch' && (
                  <div className="space-y-4">
                    {/* Overview Banner */}
                    <div className="p-4 bg-orange-900 text-white rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-bold flex items-center gap-2">
                          <Truck className="w-4.5 h-4.5 text-orange-300" />
                          Rider Dispatch & Route Management
                        </h3>
                        <p className="text-xs text-orange-200 mt-0.5">
                          Delivery dispatch queues. Admins can clear past completed orders to reduce clutter on the rider's phone and keep the site tidy.
                        </p>
                      </div>

                      {completedRiderOrders.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowBatchDeleteRiderModal(true)}
                          className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Clear Done Rider Orders ({completedRiderOrders.length})</span>
                        </button>
                      )}
                    </div>

                    {/* RIDER PROFILES & FLEET ROSTER (Synced from Rider Portal Logins) */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#ea580c]" />
                          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                            Rider Profiles & Fleet ({riders.length})
                          </h4>
                          <span className="text-[10px] bg-orange-50 text-[#ea580c] border border-orange-200 px-2 py-0.5 rounded-full font-bold">
                            Live Synced from Rider Logins
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAddRiderModal(true)}
                          className="px-2.5 py-1 bg-white hover:bg-orange-50 text-orange-700 border border-orange-200 rounded text-[11px] font-bold cursor-pointer flex items-center gap-1 transition-colors shadow-2xs"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Register Rider Profile</span>
                        </button>
                      </div>

                      {riderActionNotice && (
                        <div className="p-2.5 bg-orange-50 border border-orange-200 text-orange-900 rounded-lg text-xs font-medium flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#ea580c] shrink-0" />
                          <span>{riderActionNotice}</span>
                        </div>
                      )}

                      {riders.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {riders.map((r) => {
                            const activeTaskCount = orders.filter(
                              (o) =>
                                o.assignedRiderId === r.id &&
                                o.deliveryPath === 'delivery' &&
                                !['Delivered', 'Failed', 'Returned'].includes(o.status)
                            ).length;

                            return (
                              <div
                                key={r.id}
                                className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs hover:border-orange-300 transition-all text-left space-y-2.5"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-full bg-orange-800 text-white flex items-center justify-center font-bold text-sm shrink-0">
                                      {r.name
                                        .split(' ')
                                        .map((n) => n[0])
                                        .join('')
                                        .substring(0, 2)
                                        .toUpperCase()}
                                    </div>
                                    <div>
                                      <div className="font-bold text-gray-900 text-xs flex items-center gap-1">
                                        {r.name}
                                        <CheckCircle2 className="w-3 h-3 text-orange-600" />
                                      </div>
                                      <div className="text-[11px] text-gray-600 font-mono flex items-center gap-1 font-semibold">
                                        <Phone className="w-3 h-3 text-gray-400" />
                                        {r.phone}
                                      </div>
                                    </div>
                                  </div>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                                      r.status === 'Active'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : r.status === 'On Delivery'
                                        ? 'bg-blue-100 text-blue-800'
                                        : r.status === 'Off Duty'
                                        ? 'bg-gray-100 text-gray-600'
                                        : 'bg-red-100 text-red-700'
                                    }`}
                                  >
                                    {r.status}
                                  </span>
                                </div>

                                <div className="p-2 bg-gray-50 rounded-lg text-[10px] space-y-1 text-gray-600 border border-gray-100">
                                  <div className="flex items-center justify-between">
                                    <span>Vehicle:</span>
                                    <span className="font-bold text-gray-800">{r.vehicleType || 'Motorcycle (Boda Boda)'}</span>
                                  </div>
                                  {r.plateNumber && (
                                    <div className="flex items-center justify-between">
                                      <span>Number Plate:</span>
                                      <span className="font-mono font-bold text-gray-900 bg-white px-1.5 py-0.2 rounded border border-gray-200">
                                        {r.plateNumber}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex items-center justify-between">
                                    <span>Account Email:</span>
                                    <span className="text-gray-700 font-mono truncate max-w-[140px]">{r.email}</span>
                                  </div>
                                  <div className="flex items-center justify-between pt-1 border-t border-gray-200/60 font-semibold text-gray-700">
                                    <span>Active Orders:</span>
                                    <span className="font-bold text-orange-800">{activeTaskCount} assigned</span>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between gap-1.5 pt-1 text-[11px]">
                                  <a
                                    href={`tel:${r.phone}`}
                                    className="flex-1 py-1 bg-orange-50 hover:bg-orange-100 text-orange-800 rounded font-bold text-center flex items-center justify-center gap-1 transition-colors"
                                  >
                                    <Phone className="w-3 h-3" />
                                    <span>Call Rider</span>
                                  </a>

                                  <select
                                    value={r.status}
                                    onChange={async (e) => {
                                      if (updateRiderStatus) {
                                        await updateRiderStatus(r.id, e.target.value as any);
                                        setRiderActionNotice(`Updated ${r.name}'s status to ${e.target.value}`);
                                        setTimeout(() => setRiderActionNotice(''), 3000);
                                      }
                                    }}
                                    className="bg-white border border-gray-200 rounded px-1.5 py-1 text-[10px] font-bold text-gray-700 cursor-pointer"
                                  >
                                    <option value="Active">Active</option>
                                    <option value="On Delivery">On Delivery</option>
                                    <option value="Off Duty">Off Duty</option>
                                    <option value="Suspended">Suspended</option>
                                  </select>

                                  {deleteRider && (
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        if (confirm(`Remove rider profile for ${r.name}?`)) {
                                          await deleteRider(r.id);
                                          setRiderActionNotice(`Rider ${r.name} removed from fleet.`);
                                          setTimeout(() => setRiderActionNotice(''), 3000);
                                        }
                                      }}
                                      className="p-1 text-gray-400 hover:text-red-600 rounded cursor-pointer transition-colors"
                                      title="Remove Rider Profile"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-6 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-center space-y-2">
                          <Truck className="w-8 h-8 text-gray-400 mx-auto" />
                          <h4 className="text-xs font-bold text-gray-800">No Rider Profiles Registered Yet</h4>
                          <p className="text-[11px] text-gray-500 max-w-md mx-auto">
                            When a rider logs into the platform through the Rider Portal and fills their profile (name, phone number, vehicle type), their details will automatically be seen here.
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowAddRiderModal(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#ea580c] hover:bg-orange-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Register First Rider Profile</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Table of Rider Deliveries */}
                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                            <tr>
                              <th className="px-5 py-3">Tracking Code</th>
                              <th className="px-5 py-3">Handover PIN</th>
                              <th className="px-5 py-3">Recipient & Contact</th>
                              <th className="px-5 py-3">District & Destination</th>
                              <th className="px-5 py-3">Assigned Rider</th>
                              <th className="px-5 py-3">Delivery Status</th>
                              <th className="px-5 py-3 text-center">Rider Queue Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {filteredOrders
                              .filter((o) => o.deliveryPath === 'delivery')
                              .map((ord) => {
                                const isDone = ['Delivered', 'Failed', 'Returned'].includes(ord.status);
                                const pin = ord.deliveryPin || ord.id.replace(/\D/g, '').slice(-4).padStart(4, '0');

                                return (
                                  <tr key={ord.id} className="hover:bg-gray-50/60">
                                    <td className="px-5 py-3 font-mono font-bold text-gray-900">
                                      <div
                                        onClick={() => {
                                          setOrderCodeSearch(ord.id);
                                          setOrdersSubView('items_lookup');
                                        }}
                                        className="cursor-pointer hover:text-[#ea580c] hover:underline flex items-center gap-1"
                                        title="Click to view ordered items"
                                      >
                                        <span>{ord.id}</span>
                                        <Eye className="w-3 h-3 text-orange-600 opacity-60 hover:opacity-100" />
                                      </div>
                                      <div className="text-[10px] text-gray-400 font-sans">{ord.date}</div>
                                    </td>

                                    <td className="px-5 py-3">
                                      <span className="font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-xs">
                                        PIN: {pin}
                                      </span>
                                    </td>

                                    <td className="px-5 py-3">
                                      <div className="font-bold text-gray-800">{ord.customerName}</div>
                                      <div className="text-[10px] text-gray-500 font-mono">{ord.customerPhone}</div>
                                    </td>

                                    <td className="px-5 py-3">
                                      <div className="font-bold text-gray-800">{ord.deliveryDetails?.district || 'Kampala'}</div>
                                      <div className="text-[10px] text-gray-500 truncate max-w-xs">{ord.deliveryDetails?.address}</div>
                                    </td>

                                    <td className="px-5 py-3">
                                      {riders.length > 0 ? (
                                        <select
                                          value={ord.assignedRiderId || ''}
                                          onChange={(e) => {
                                            const rider = riders.find((r) => r.id === e.target.value) || null;
                                            if (assignRiderToOrder) {
                                              assignRiderToOrder(ord.id, rider);
                                            }
                                          }}
                                          className="bg-white border border-gray-200 rounded px-2 py-1 text-xs font-medium"
                                        >
                                          <option value="">Unassigned</option>
                                          {riders.map((r) => (
                                            <option key={r.id} value={r.id}>
                                              {r.name} ({r.phone})
                                            </option>
                                          ))}
                                        </select>
                                      ) : (
                                        <span className="text-gray-500 font-medium">Ivan Kato (Default Rider)</span>
                                      )}
                                    </td>

                                    <td className="px-5 py-3">
                                      <span
                                        className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                          ord.status === 'Delivered'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : ord.status === 'Out for Delivery'
                                            ? 'bg-amber-100 text-amber-900'
                                            : 'bg-gray-100 text-gray-700'
                                        }`}
                                      >
                                        {ord.status}
                                      </span>
                                    </td>

                                    <td className="px-5 py-3 text-center whitespace-nowrap">
                                      {isDone ? (
                                        <button
                                          type="button"
                                          onClick={() => setOrderToDelete(ord)}
                                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 mx-auto shadow-2xs"
                                          title="Delete from Rider Queue & Site"
                                        >
                                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                          <span>Delete from Queue</span>
                                        </button>
                                      ) : (
                                        <span className="text-[10px] text-gray-400 font-medium">Active In-Transit</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUB-VIEW 3: STORE PICKUP DESK & SECURE PIN HANDOVER */}
                {ordersSubView === 'pickup' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-xs font-bold text-orange-950 uppercase tracking-wider flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-[#ea580c]" />
                          Kampala Store Collection Desk — Shop 16, Thobani Centre
                        </h3>
                        <p className="text-[11px] text-orange-800 mt-0.5">
                          Customers collect their packages here. Enter their 4-digit authentication PIN to confirm pickup.
                          The system will dispatch an instant notification to their account and automatically refresh itself for the next customer.
                        </p>
                      </div>
                    </div>

                    {pickupVerifySuccess && (
                      <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{pickupVerifySuccess}</span>
                      </div>
                    )}

                    {pickupVerifyError && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-bold flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                        <span>{pickupVerifyError}</span>
                      </div>
                    )}

                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                            <tr>
                              <th className="px-5 py-3">Order Code</th>
                              <th className="px-5 py-3">Expected PIN</th>
                              <th className="px-5 py-3">Customer Information</th>
                              <th className="px-5 py-3">Invoice Sum</th>
                              <th className="px-5 py-3">Status</th>
                              <th className="px-5 py-3 text-center">Handover Verification Keypad</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {filteredOrders
                              .filter((o) => o.deliveryPath === 'pickup')
                              .map((ord) => {
                                const expectedPin = ord.deliveryPin || ord.id.replace(/\D/g, '').slice(-4).padStart(4, '0');
                                const isPickedUp = ord.status === 'Picked Up';

                                return (
                                  <tr key={ord.id} className="hover:bg-gray-50/60">
                                    <td className="px-5 py-3 font-mono font-bold text-gray-900">
                                      <div
                                        onClick={() => {
                                          setOrderCodeSearch(ord.id);
                                          setOrdersSubView('items_lookup');
                                        }}
                                        className="cursor-pointer hover:text-[#ea580c] hover:underline flex items-center gap-1"
                                        title="Click to view ordered items"
                                      >
                                        <span>{ord.id}</span>
                                        <Eye className="w-3 h-3 text-orange-600 opacity-60 hover:opacity-100" />
                                      </div>
                                      <div className="text-[10px] text-gray-400 font-sans">{ord.date}</div>
                                    </td>

                                    <td className="px-5 py-3">
                                      <span className="font-mono font-bold text-orange-800 bg-orange-50 px-2 py-0.5 rounded border border-orange-200 text-xs">
                                        PIN: {expectedPin}
                                      </span>
                                    </td>

                                    <td className="px-5 py-3">
                                      <div className="font-bold text-gray-800">{ord.customerName}</div>
                                      <div className="text-[10px] text-gray-500 font-mono">{ord.customerPhone}</div>
                                    </td>

                                    <td className="px-5 py-3 font-mono font-bold text-gray-950">
                                      UGX {new Intl.NumberFormat('en-UG').format(ord.totalAmount)}
                                    </td>

                                    <td className="px-5 py-3">
                                      <span
                                        className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                          isPickedUp
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : ord.status === 'Ready for Pickup'
                                            ? 'bg-orange-100 text-orange-900'
                                            : 'bg-yellow-50 text-yellow-800'
                                        }`}
                                      >
                                        {ord.status}
                                      </span>
                                    </td>

                                    <td className="px-5 py-3 text-center whitespace-nowrap">
                                      {isPickedUp ? (
                                        <div className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold text-[11px] border border-emerald-200">
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                          <span>Handover Completed</span>
                                        </div>
                                      ) : (
                                        <form
                                          onSubmit={(e) => {
                                            e.preventDefault();
                                            if (pickupVerifyOrderId !== ord.id || !pickupVerifyPin) {
                                              setPickupVerifyError('Please type the customer 4-digit PIN first.');
                                              return;
                                            }
                                            if (pickupVerifyPin !== expectedPin) {
                                              setPickupVerifyError(`Invalid PIN! Expected ${expectedPin}`);
                                              return;
                                            }
                                            if (confirmOrderHandover) {
                                              confirmOrderHandover(ord.id, pickupVerifyPin, 'pickup');
                                            } else {
                                              updateOrderStatus(ord.id, 'Picked Up');
                                            }
                                            setPickupVerifySuccess(`Order #${ord.id} handover confirmed! Customer received account notification.`);
                                            setPickupVerifyError('');
                                            // Auto-refresh keypad in 3 seconds to allow subsequent digits
                                            setTimeout(() => {
                                              setPickupVerifyPin('');
                                              setPickupVerifyOrderId(null);
                                              setPickupVerifySuccess('');
                                            }, 3000);
                                          }}
                                          className="flex items-center justify-center gap-1.5"
                                        >
                                          <input
                                            type="text"
                                            maxLength={4}
                                            placeholder="4-digit PIN"
                                            value={pickupVerifyOrderId === ord.id ? pickupVerifyPin : ''}
                                            onFocus={() => {
                                              setPickupVerifyOrderId(ord.id);
                                              setPickupVerifyError('');
                                            }}
                                            onChange={(e) => {
                                              setPickupVerifyOrderId(ord.id);
                                              setPickupVerifyPin(e.target.value.replace(/\D/g, ''));
                                            }}
                                            className="w-24 bg-gray-50 border border-gray-300 rounded px-2 py-1 text-center font-mono font-bold text-xs tracking-widest focus:outline-none focus:border-[#ea580c]"
                                          />
                                          <button
                                            type="submit"
                                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer transition-colors"
                                          >
                                            Verify
                                          </button>
                                        </form>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUB-VIEW 4: ALL ORDERS TABLE */}
                {ordersSubView === 'all' && (
                  <div className="space-y-4">
                    {/* Quick Search Ordered Items Bar */}
                    <div className="bg-white border border-orange-200 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-orange-50 text-[#ea580c] rounded-lg shrink-0">
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                            <span>Search Ordered Items by Order Code</span>
                            <span className="text-[10px] bg-orange-100 text-orange-900 font-bold px-1.5 py-0.5 rounded">Inspection Desk</span>
                          </h4>
                          <p className="text-[11px] text-gray-500">
                            Search any order code to see all items ordered, quantities, sizes, variations, and catalog stock.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input
                          type="text"
                          placeholder="Enter Order Code e.g. UK2UG-..."
                          value={orderCodeSearch}
                          onChange={(e) => setOrderCodeSearch(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setOrdersSubView('items_lookup');
                            }
                          }}
                          className="w-full sm:w-64 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-mono font-bold outline-none focus:bg-white focus:border-[#ea580c]"
                        />
                        <button
                          type="button"
                          onClick={() => setOrdersSubView('items_lookup')}
                          className="px-3.5 py-1.5 bg-[#ea580c] hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1 shadow-2xs"
                        >
                          <Search className="w-3.5 h-3.5" />
                          <span>Search Items</span>
                        </button>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                          <tr>
                            <th className="px-5 py-4">Tracking Code</th>
                            <th className="px-5 py-4">Date Logged</th>
                            <th className="px-5 py-4">Recipient</th>
                            <th className="px-5 py-4">Fulfillment Channel</th>
                            <th className="px-5 py-4">Payment & Txn ID</th>
                            <th className="px-5 py-4">Invoice Sum</th>
                            <th className="px-5 py-4">Status Flow</th>
                            <th className="px-5 py-4 text-center">Action Controls</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {filteredOrders.map((ord) => {
                            const isDone = ['Delivered', 'Picked Up'].includes(ord.status);
                            const pin = ord.deliveryPin || ord.id.replace(/\D/g, '').slice(-4).padStart(4, '0');

                            return (
                              <tr key={ord.id} className="hover:bg-gray-50/50">
                                <td className="px-5 py-4 font-mono font-bold text-gray-900 whitespace-nowrap">
                                  <div
                                    onClick={() => {
                                      setOrderCodeSearch(ord.id);
                                      setOrdersSubView('items_lookup');
                                    }}
                                    className="cursor-pointer hover:text-[#ea580c] hover:underline flex items-center gap-1"
                                    title="Click to view ordered items"
                                  >
                                    <span>{ord.id}</span>
                                    <Eye className="w-3 h-3 text-orange-600 opacity-60 hover:opacity-100" />
                                  </div>
                                  <div
                                    className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded inline-block mt-0.5 border border-amber-200"
                                    title="Handover Verification PIN"
                                  >
                                    PIN: {pin}
                                  </div>
                                </td>

                              <td className="px-5 py-4 whitespace-nowrap">
                                <div className="font-bold text-gray-800 text-[11px] flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-[#ea580c] shrink-0" />
                                  {ord.date}
                                </div>
                                <div className="text-[10px] text-gray-400 font-mono">Logged</div>
                              </td>

                              <td className="px-5 py-4">
                                <div className="font-bold text-gray-800">{ord.customerName}</div>
                                <div className="text-[10px] text-gray-400 font-mono">{ord.customerPhone}</div>
                              </td>

                              <td className="px-5 py-4 whitespace-nowrap">
                                {ord.deliveryPath === 'pickup' ? (
                                  <span className="inline-flex items-center gap-1 font-bold text-orange-800 bg-orange-50 px-2 py-0.5 rounded">
                                    <MapPin className="w-3.5 h-3.5 text-[#ea580c]" /> Store Pickup
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                                    <Truck className="w-3.5 h-3.5 text-[#ea580c]" /> Delivery ({ord.deliveryDetails?.district || 'Kampala'})
                                  </span>
                                )}
                              </td>

                              {/* NEW: Payment Details & Txn ID Column */}
                              <td className="px-5 py-4">
                                <div>
                                  <span className="font-bold text-gray-800 text-[11px]">
                                    {ord.paymentMethod === 'COD' ? 'Cash on Delivery' : ord.paymentMethod}
                                  </span>
                                </div>
                                {ord.paymentTransactionRef ? (
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <span className="text-[10px] font-mono text-orange-900 bg-orange-50 border border-orange-200 px-1.5 py-0.2 rounded">
                                      Ref: {ord.paymentTransactionRef}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(ord.paymentTransactionRef || '');
                                        setPaymentActionFeedback(`Copied: ${ord.paymentTransactionRef}`);
                                        setTimeout(() => setPaymentActionFeedback(''), 3000);
                                      }}
                                      className="text-gray-400 hover:text-orange-700 cursor-pointer"
                                      title="Copy Transaction ID"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="text-[10px] text-gray-400">No Txn ID required</div>
                                )}
                              </td>

                              <td className="px-5 py-4 font-mono font-bold text-gray-950 whitespace-nowrap">
                                UGX {new Intl.NumberFormat('en-UG').format(ord.totalAmount)}
                              </td>

                              <td className="px-5 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                    isDone
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : ['Ready for Pickup', 'Out for Delivery'].includes(ord.status)
                                      ? 'bg-orange-50 text-orange-900'
                                      : 'bg-yellow-50 text-yellow-800'
                                  }`}
                                >
                                  {ord.status}
                                </span>
                              </td>

                              <td className="px-5 py-4 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOrderCodeSearch(ord.id);
                                      setOrdersSubView('items_lookup');
                                    }}
                                    className="px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-[#ea580c] border border-orange-200 rounded text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                    title="Inspect Ordered Items"
                                  >
                                    <ShoppingBag className="w-3.5 h-3.5" />
                                    <span>Items ({ord.items.length})</span>
                                  </button>

                                  <select
                                    value={ord.status}
                                    onChange={(e) => updateOrderStatus(ord.id, e.target.value as any)}
                                    className="bg-white border border-gray-200 text-xs rounded p-1 font-semibold"
                                  >
                                    {ord.deliveryPath === 'pickup' ? (
                                      <>
                                        <option value="Pending">Pending</option>
                                        <option value="Paid">Paid</option>
                                        <option value="Ready for Pickup">Ready for Pickup</option>
                                        <option value="Picked Up">Picked Up</option>
                                      </>
                                    ) : (
                                      <>
                                        <option value="Pending">Pending</option>
                                        <option value="Paid">Paid</option>
                                        <option value="Processing">Processing</option>
                                        <option value="Out for Delivery">Out for Delivery</option>
                                        <option value="Delivered">Delivered</option>
                                        <option value="Returned">Returned</option>
                                        <option value="Failed">Failed</option>
                                      </>
                                    )}
                                  </select>

                                  {isDone && (
                                    <button
                                      type="button"
                                      onClick={() => setOrderToDelete(ord)}
                                      className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                      title="Delete Done Order (Admin Privilege)"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Delete</span>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              </div>
            );
          })()}

          {/* TAB G: IMPORT REQUEST DESK PANE */}
          {activeTab === 'imports' && (
            <div className="space-y-6 text-left">
              {/* Sourcing Desk KPI Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Requests</div>
                  <div className="text-xl font-extrabold text-gray-900 mt-1">{imports.length}</div>
                </div>
                <div className="bg-white border border-yellow-100 rounded-xl p-4 shadow-sm bg-yellow-50/20">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-yellow-700">Awaiting Quote</div>
                  <div className="text-xl font-extrabold text-yellow-800 mt-1">
                    {imports.filter((i) => i.status === 'Pending').length}
                  </div>
                </div>
                <div className="bg-white border border-orange-100 rounded-xl p-4 shadow-sm bg-orange-50/20">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#ea580c]">Quotes Sent</div>
                  <div className="text-xl font-extrabold text-[#ea580c] mt-1">
                    {imports.filter((i) => i.status === 'Quoted').length}
                  </div>
                </div>
                <div className="bg-white border border-emerald-100 rounded-xl p-4 shadow-sm bg-emerald-50/20">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Ordered & Fulfilled</div>
                  <div className="text-xl font-extrabold text-emerald-800 mt-1">
                    {imports.filter((i) => ['Ordered', 'Completed'].includes(i.status)).length}
                  </div>
                </div>
              </div>

              {/* Status Filters and Search Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                  {(['All', 'Pending', 'Quoted', 'Ordered', 'Completed'] as const).map((status) => {
                    const count = status === 'All' ? imports.length : imports.filter((i) => i.status === status).length;
                    const isActive = importStatusFilter === status;
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setImportStatusFilter(status)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                          isActive
                            ? 'bg-[#ea580c] text-white shadow-xs'
                            : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-200'
                        }`}
                      >
                        <span>{status === 'Completed' ? 'Done / Completed' : status}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {imports.some((i) => i.status === 'Completed') && (
                  <button
                    type="button"
                    onClick={() => setShowClearAllDoneImportsModal(true)}
                    className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0"
                    title="Delete all fulfilled/completed requests from sourcing desk"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    <span>Delete All Done Requests ({imports.filter((i) => i.status === 'Completed').length})</span>
                  </button>
                )}
              </div>

              {/* Search filter for requests */}
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Search requests by product name, category, or customer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-xs outline-none focus:ring-1 focus:ring-orange-500 focus:border-[#ea580c]"
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-gray-500 hover:text-gray-700 underline cursor-pointer shrink-0"
                  >
                    Clear search
                  </button>
                )}
              </div>

              {/* Request list */}
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Request Ref</th>
                      <th className="px-6 py-4">Date Logged</th>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Sourced Item Parameter</th>
                      <th className="px-6 py-4">Quantity</th>
                      <th className="px-6 py-4">Sourcing Notes</th>
                      <th className="px-6 py-4">Quoted Price</th>
                      <th className="px-6 py-4">Pipeline Status</th>
                      <th className="px-6 py-4 text-center">Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {imports
                      .filter((req) => {
                        if (importStatusFilter !== 'All' && req.status !== importStatusFilter) return false;
                        const q = searchQuery.toLowerCase();
                        return (
                          req.id.toLowerCase().includes(q) ||
                          req.productName.toLowerCase().includes(q) ||
                          (req.customerName && req.customerName.toLowerCase().includes(q)) ||
                          (req.customerEmail && req.customerEmail.toLowerCase().includes(q)) ||
                          (req.customerPhone && req.customerPhone.toLowerCase().includes(q)) ||
                          (req.notes && req.notes.toLowerCase().includes(q)) ||
                          (req.brand && req.brand.toLowerCase().includes(q)) ||
                          (req.model && req.model.toLowerCase().includes(q))
                        );
                      })
                      .length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                          {searchQuery || importStatusFilter !== 'All' ? `No requests found matching criteria.` : 'No product requests submitted yet.'}
                        </td>
                      </tr>
                    ) : (
                      imports
                        .filter((req) => {
                          if (importStatusFilter !== 'All' && req.status !== importStatusFilter) return false;
                          const q = searchQuery.toLowerCase();
                          return (
                            req.id.toLowerCase().includes(q) ||
                            req.productName.toLowerCase().includes(q) ||
                            (req.customerName && req.customerName.toLowerCase().includes(q)) ||
                            (req.customerEmail && req.customerEmail.toLowerCase().includes(q)) ||
                            (req.customerPhone && req.customerPhone.toLowerCase().includes(q)) ||
                            (req.notes && req.notes.toLowerCase().includes(q)) ||
                            (req.brand && req.brand.toLowerCase().includes(q)) ||
                            (req.model && req.model.toLowerCase().includes(q))
                          );
                        })
                        .map((req) => (
                        <tr key={req.id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4">
                            <div className="font-mono font-bold text-gray-900">{req.id}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-bold text-gray-800 text-[11px] flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-[#ea580c] shrink-0" />
                              {req.createdAt
                                ? new Date(req.createdAt).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : req.date || '—'}
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono">UK Sourcing Desk</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900">{req.customerName || 'Anonymous'}</div>
                            <div className="text-[10px] font-mono text-gray-500 mt-0.5">{req.customerPhone || '—'}</div>
                          </td>
                          <td 
                            className="px-6 py-4 cursor-pointer group hover:bg-orange-50/50 transition-colors"
                            onClick={() => {
                              setInspectRequest(req);
                              setInspectActiveImageIdx(0);
                              setInspectQuoteInput(req.quotePrice || '');
                            }}
                            title="Click on sourced item parameter to inspect product images and specs"
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center group-hover:border-[#ea580c] transition-colors shadow-xs">
                                {req.imageUrl ? (
                                  <img
                                    src={req.imageUrl}
                                    alt={req.productName}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80';
                                    }}
                                  />
                                ) : (
                                  <ShoppingBag className="w-5 h-5 text-gray-400" />
                                )}
                                {((req.images && req.images.length > 1) || req.imageUrl2) && (
                                  <span className="absolute bottom-0 right-0 bg-[#ea580c] text-white text-[9px] font-bold px-1 rounded-tl shadow-xs">
                                    2+
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-gray-900 group-hover:text-[#ea580c] flex items-center gap-1.5 transition-colors">
                                  <span>{req.productName}</span>
                                  <Eye className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#ea580c] transition-colors" />
                                </div>
                                <div className="text-[11px] text-gray-500 line-clamp-1 max-w-sm">{req.description}</div>
                                <div className="text-[10px] text-[#ea580c] font-semibold mt-0.5 opacity-80 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                  <Maximize2 className="w-2.5 h-2.5" /> Click to view images & specs
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono font-semibold text-gray-600">{req.quantity}</td>
                          <td className="px-6 py-4 text-gray-600 max-w-xs">
                            <div className="line-clamp-2">{req.notes || '—'}</div>
                          </td>
                          <td className="px-6 py-4">
                            {req.quotePrice ? (
                              <div>
                                <div className="font-mono font-bold text-[#ea580c] text-sm">
                                  UGX {req.quotePrice.toLocaleString()}
                                </div>
                                <span className="inline-block text-[9px] font-semibold text-orange-800 bg-orange-50 px-1.5 py-0.2 rounded border border-orange-100 mt-0.5">
                                  Quoted
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic text-[11px]">Awaiting Quote</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                req.status === 'Completed'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : req.status === 'Quoted'
                                  ? 'bg-orange-50 text-orange-800 border border-orange-100'
                                  : req.status === 'Ordered'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                  : 'bg-yellow-50 text-yellow-800'
                              }`}
                            >
                              {req.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {activeQuoteId === req.id ? (
                              <div className="flex gap-1.5 items-center justify-center">
                                <input
                                  type="number"
                                  placeholder="Quote in UGX"
                                  defaultValue={req.quotePrice || ''}
                                  className="bg-white border border-gray-200 rounded p-1 w-28 text-xs font-mono font-semibold outline-none focus:border-[#ea580c]"
                                  onChange={(e) => setCustomQuotePrice(Number(e.target.value))}
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleQuoteSubmit(req.id)}
                                  className="px-2.5 py-1 bg-[#ea580c] text-white rounded text-[10px] font-bold hover:bg-[#c2410c] transition-colors cursor-pointer"
                                >
                                  Send
                                </button>
                                <button
                                  onClick={() => {
                                    setActiveQuoteId(null);
                                    setCustomQuotePrice(0);
                                  }}
                                  className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-semibold hover:bg-gray-200 transition-colors cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                {req.status === 'Pending' ? (
                                  <button
                                    onClick={() => {
                                      setActiveQuoteId(req.id);
                                      setCustomQuotePrice(req.quotePrice || 0);
                                    }}
                                    className="px-2.5 py-1 bg-orange-50 text-[#ea580c] hover:bg-orange-100 rounded text-[11px] font-bold transition-colors cursor-pointer"
                                  >
                                    Submit Quote
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setActiveQuoteId(req.id);
                                      setCustomQuotePrice(req.quotePrice || 0);
                                    }}
                                    className="px-2 py-1 bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 rounded text-[10px] font-semibold transition-colors cursor-pointer"
                                  >
                                    {req.quotePrice ? 'Update Quote' : 'Set Quote'}
                                  </button>
                                )}
                                <select
                                  value={req.status}
                                  onChange={(e) => updateImportStatus(req.id, e.target.value as any)}
                                  className="bg-white border border-gray-200 text-[10px] font-semibold rounded p-1 cursor-pointer"
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Quoted">Quoted</option>
                                  <option value="Ordered">Ordered</option>
                                  <option value="Completed">Completed (Done)</option>
                                </select>
                                {req.status === 'Completed' ? (
                                  <button
                                    type="button"
                                    onClick={() => setImportToDelete(req)}
                                    className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs shrink-0"
                                    title="Delete Completed / Done Product Request"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                    <span>Delete Done Request</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setImportToDelete(req)}
                                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer shrink-0"
                                    title="Delete Request"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB H: CUSTOMER ACCOUNTS MANAGEMENT PANE */}
          {activeTab === 'customers' && (
            <div className="space-y-6 text-left">
              {/* Customer Accounts KPI Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Registered Customers</div>
                  <div className="text-xl font-extrabold text-gray-900 mt-1">{customers.length}</div>
                </div>
                <div className="bg-white border border-emerald-100 rounded-xl p-4 shadow-sm bg-emerald-50/20">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Active Accounts</div>
                  <div className="text-xl font-extrabold text-emerald-800 mt-1">
                    {customers.filter((c) => c.status === 'Active').length}
                  </div>
                </div>
                <div className="bg-white border border-amber-100 rounded-xl p-4 shadow-sm bg-amber-50/20">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Suspended Accounts</div>
                  <div className="text-xl font-extrabold text-amber-800 mt-1">
                    {customers.filter((c) => c.status === 'Suspended').length}
                  </div>
                </div>
              </div>

              {/* Customer Search Bar */}
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Search customers by name, email, or phone number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-xs outline-none focus:ring-1 focus:ring-orange-500 focus:border-[#ea580c]"
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-gray-500 hover:text-gray-700 underline cursor-pointer shrink-0"
                  >
                    Clear search
                  </button>
                )}
              </div>

              {/* Account controls table */}
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Customer Name</th>
                      <th className="px-6 py-4">Email Address</th>
                      <th className="px-6 py-4">Telephone</th>
                      <th className="px-6 py-4">Date Logged</th>
                      <th className="px-6 py-4">Security Level</th>
                      <th className="px-6 py-4 text-center">Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {customers.filter((c) => {
                      if (!searchQuery.trim()) return true;
                      const q = searchQuery.toLowerCase();
                      return (
                        c.name.toLowerCase().includes(q) ||
                        c.email.toLowerCase().includes(q) ||
                        c.phone.toLowerCase().includes(q)
                      );
                    }).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                          {searchQuery ? `No customer accounts matching "${searchQuery}".` : 'No customer accounts registered yet in this workspace.'}
                        </td>
                      </tr>
                    ) : (
                      customers
                        .filter((c) => {
                          if (!searchQuery.trim()) return true;
                          const q = searchQuery.toLowerCase();
                          return (
                            c.name.toLowerCase().includes(q) ||
                            c.email.toLowerCase().includes(q) ||
                            c.phone.toLowerCase().includes(q)
                          );
                        })
                        .map((cust) => (
                        <tr key={cust.id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2.5">
                              <InitialsBadge name={cust.name} size="sm" />
                              <span className="font-bold text-gray-800">{cust.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600 font-semibold">{cust.email}</td>
                          <td className="px-6 py-4 font-mono font-medium text-gray-500">{cust.phone}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-bold text-gray-800 text-[11px] flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-[#ea580c] shrink-0" />
                              {cust.joinDate}
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono">Registered Account</div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                cust.status === 'Active'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-red-50 text-red-700 border border-red-100'
                              }`}
                            >
                              {cust.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() =>
                                  updateCustomerStatus(cust.id, cust.status === 'Active' ? 'Suspended' : 'Active')
                                }
                                className={`p-1.5 rounded transition-colors ${
                                  cust.status === 'Active'
                                    ? 'text-amber-500 hover:bg-amber-50'
                                    : 'text-emerald-600 hover:bg-emerald-50'
                                }`}
                                title={cust.status === 'Active' ? 'Suspend Account' : 'Activate Account'}
                              >
                                <Power className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteCustomer(cust.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-55/30 rounded transition-colors"
                                title="Delete Account"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: CUSTOMER COMPLAINTS RESOLUTION DESK */}
          {activeTab === 'complaints' && (
            <AdminComplaints
              complaints={complaints}
              orders={orders}
              updateComplaintStatus={updateComplaintStatus}
              deleteComplaint={deleteComplaint}
              sendMessage={sendMessage}
            />
          )}

          {/* TAB I: CUSTOMER MESSAGES COMMUNICATION CENTER */}
          {activeTab === 'messages' && (
            <div className="space-y-6 text-left">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-[#ea580c]" />
                    Customer Direct Messaging Desk
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Two-way communication channel between UK2UG store management and shoppers
                  </p>
                </div>
                <div className="bg-orange-50 text-[#ea580c] border border-orange-100 px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#ea580c] animate-pulse"></span>
                  Live Support Center Active
                </div>
              </div>

              {/* Chat Interface Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm min-h-[550px]">
                {/* Left Column: Customer Conversations List */}
                <div className="lg:col-span-1 border-r border-gray-100 bg-gray-50/50 flex flex-col">
                  <div className="p-4 border-b border-gray-100 bg-white">
                    <p className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">Customer Threads</p>
                    <p className="text-[11px] text-gray-500">Select a customer to view or reply to messages</p>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                    {(() => {
                      // Group messages by customer email or compile unique customer list
                      const uniqueEmails = Array.from(new Set([
                        'kakoozajoel45@gmail.com',
                        ...messages.map(m => m.userEmail),
                        ...customers.map(c => c.email)
                      ]));

                      return uniqueEmails.map(email => {
                        const custMessages = messages.filter(m => m.userEmail === email);
                        const lastMsg = custMessages[custMessages.length - 1];
                        const custInfo = customers.find(c => c.email === email);
                        const custName = custInfo?.name || (lastMsg?.sender === 'customer' ? lastMsg.senderName : 'Customer') || 'Joel Kakooza';
                        const isSelected = activeChatEmail === email;
                        const unreadCount = custMessages.filter(m => m.sender === 'customer' && !m.readByAdmin).length;

                        return (
                          <button
                            key={email}
                            onClick={() => setActiveChatEmail(email)}
                            className={`w-full text-left p-4 transition-all flex items-start gap-3 cursor-pointer ${
                              isSelected
                                ? 'bg-orange-50/80 border-l-4 border-[#ea580c]'
                                : 'hover:bg-gray-100/60 bg-white'
                            }`}
                          >
                            <InitialsBadge name={custName} size="md" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <p className="text-xs font-bold text-gray-900 truncate">{custName}</p>
                                <div className="flex items-center gap-1.5">
                                  {unreadCount > 0 && (
                                    <span className="bg-[#ea580c] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                      {unreadCount}
                                    </span>
                                  )}
                                  {custMessages.length > 0 && (
                                    <span
                                      role="button"
                                      tabIndex={0}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setConversationToDelete({ email, name: custName });
                                      }}
                                      className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                                      title="Delete conversation"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="text-[10px] text-gray-500 truncate font-mono">{email}</p>
                              <p className="text-[11px] text-gray-600 truncate mt-1">
                                {lastMsg ? lastMsg.text : 'No messages yet'}
                              </p>
                            </div>
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Right Column: Chat Window */}
                <div className="lg:col-span-2 flex flex-col bg-white">
                  {/* Selected Customer Header */}
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                    <div className="flex items-center gap-3">
                      <InitialsBadge
                        name={
                          customers.find(c => c.email === activeChatEmail)?.name || 'Joel Kakooza'
                        }
                        size="md"
                      />
                      <div>
                        <h3 className="text-xs font-bold text-gray-900">
                          {customers.find(c => c.email === activeChatEmail)?.name || 'Joel Kakooza'}
                        </h3>
                        <p className="text-[10px] text-gray-500 font-mono">{activeChatEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                        Active Customer
                      </span>
                      {messages.some(m => m.userEmail === activeChatEmail) && (
                        <button
                          type="button"
                          onClick={() => setConversationToDelete({
                            email: activeChatEmail,
                            name: customers.find(c => c.email === activeChatEmail)?.name || 'Customer'
                          })}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-full text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Delete All Messages in This Customer Thread (Admin Privilege)"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete Thread</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Message History Window */}
                  <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[400px] bg-slate-50/30">
                    {(() => {
                      const activeThread = messages.filter(m => m.userEmail === activeChatEmail);

                      if (activeThread.length === 0) {
                        return (
                          <div className="text-center py-12">
                            <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-xs font-semibold text-gray-500">No message history with this customer yet.</p>
                            <p className="text-[11px] text-gray-400 mt-1">Send a welcome message or answer their inquiries below.</p>
                          </div>
                        );
                      }

                      return activeThread.map((msg) => {
                        const isAdmin = msg.sender === 'admin';
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                          >
                            <div className="flex items-center gap-1.5 mb-1 text-[10px] text-gray-400">
                              <span className="font-semibold text-gray-600">
                                {isAdmin ? 'UK2UG Support Admin' : msg.senderName}
                              </span>
                              <span>•</span>
                              <span>{msg.timestamp}</span>
                            </div>
                            <div className="flex items-center gap-1.5 group/msg">
                              <div
                                className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                                  isAdmin
                                    ? 'bg-[#ea580c] text-white rounded-tr-none'
                                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                                }`}
                              >
                                {msg.text}
                              </div>
                              <button
                                type="button"
                                onClick={() => setMessageToDelete(msg.id)}
                                className="opacity-0 group-hover/msg:opacity-100 transition-opacity p-1 text-gray-400 hover:text-red-600 rounded cursor-pointer"
                                title="Delete Customer Message (Admin Privilege)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* Admin Reply Input Bar */}
                  <div className="p-4 border-t border-gray-100 bg-white">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (adminReplyInput.trim() && activeChatEmail) {
                          sendMessage({
                            sender: 'admin',
                            senderName: 'UK2UG Admin Desk',
                            userEmail: activeChatEmail,
                            text: adminReplyInput.trim(),
                            readByCustomer: false,
                            readByAdmin: true,
                          });
                          setAdminReplyInput('');
                        }
                      }}
                      className="flex items-center gap-3"
                    >
                      <input
                        type="text"
                        value={adminReplyInput}
                        onChange={(e) => setAdminReplyInput(e.target.value)}
                        placeholder={`Reply to ${activeChatEmail}...`}
                        className="flex-1 px-4 py-2.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c]"
                      />
                      <button
                        type="submit"
                        disabled={!adminReplyInput.trim()}
                        className="px-5 py-2.5 bg-[#ea580c] text-white text-xs font-semibold rounded-lg hover:bg-[#c2410c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shadow-sm"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Send Reply
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>


      {/* ADMIN DIALOG: ADD/EDIT PRODUCT MULTI-IMAGE DETAILS FORM */}
      {showProductModal && (
        <Modal
          isOpen={showProductModal}
          onClose={() => {
            setShowProductModal(false);
            setEditingProduct(null);
          }}
          title={editingProduct ? 'Edit Product' : 'Add Product'}
          maxWidth="2xl"
        >
          <form onSubmit={handleProductSubmit} className="space-y-4 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-700 uppercase">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apple iPhone 15 Pro Max"
                  value={productForm.title}
                  onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-xs outline-none focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-700 uppercase">Product Brand</label>
                <input
                  type="text"
                  placeholder="e.g. Apple, Mary Kay, Avon, Dyson"
                  value={productForm.brand}
                  onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-xs outline-none focus:bg-white font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-700 uppercase">Category *</label>
                <select
                  value={productForm.categoryId}
                  onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-xs outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-700 uppercase">Price (UGX) *</label>
                <input
                  type="number"
                  required
                  placeholder="Enter price in UGX"
                  value={productForm.basePrice || ''}
                  onChange={(e) => setProductForm({ ...productForm, basePrice: Number(e.target.value) })}
                  className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-xs outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-700 uppercase">Stock Quantity *</label>
                <input
                  type="number"
                  required
                  value={productForm.quantity || ''}
                  onChange={(e) => setProductForm({ ...productForm, quantity: Number(e.target.value) })}
                  className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-xs outline-none font-mono"
                />
              </div>
            </div>

            {/* Customer Display Status Configuration */}
            <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Customer Display Status & Availability</h4>
                  <p className="text-[10px] text-gray-500">
                    Control exactly how this product appears to customers on the storefront.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-orange-800 bg-white px-2 py-0.5 rounded border border-orange-200">
                  Live Customer Visibility
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label
                  className={`p-3 border rounded-lg cursor-pointer flex flex-col gap-1 transition-all ${
                    productForm.customerStatus === 'in_stock'
                      ? 'bg-white border-[#ea580c] ring-1 ring-[#ea580c] shadow-xs'
                      : 'bg-white/60 border-gray-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900">✓ In Stock</span>
                    <input
                      type="radio"
                      name="customerStatus"
                      checked={productForm.customerStatus === 'in_stock'}
                      onChange={() => setProductForm({ ...productForm, customerStatus: 'in_stock' })}
                      className="text-[#ea580c]"
                    />
                  </div>
                  <p className="text-[10px] text-gray-500">Available for immediate Kampala dispatch</p>
                </label>

                <label
                  className={`p-3 border rounded-lg cursor-pointer flex flex-col gap-1 transition-all ${
                    productForm.customerStatus === 'pre_order'
                      ? 'bg-white border-purple-600 ring-1 ring-purple-600 shadow-xs'
                      : 'bg-white/60 border-gray-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-900">📦 Pre-Order</span>
                    <input
                      type="radio"
                      name="customerStatus"
                      checked={productForm.customerStatus === 'pre_order'}
                      onChange={() => setProductForm({ ...productForm, customerStatus: 'pre_order' })}
                      className="text-purple-600"
                    />
                  </div>
                  <p className="text-[10px] text-gray-500">Direct UK sourcing with flight tracking</p>
                </label>

                <label
                  className={`p-3 border rounded-lg cursor-pointer flex flex-col gap-1 transition-all ${
                    productForm.customerStatus === 'out_of_stock'
                      ? 'bg-white border-red-500 ring-1 ring-red-500 shadow-xs'
                      : 'bg-white/60 border-gray-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-red-900">✗ Out of Stock</span>
                    <input
                      type="radio"
                      name="customerStatus"
                      checked={productForm.customerStatus === 'out_of_stock'}
                      onChange={() => setProductForm({ ...productForm, customerStatus: 'out_of_stock' })}
                      className="text-red-500"
                    />
                  </div>
                  <p className="text-[10px] text-gray-500">Marked unavailable until replenished</p>
                </label>
              </div>

              {/* Pre-Order Specific Parameters */}
              {productForm.customerStatus === 'pre_order' && (
                <div className="pt-3 border-t border-orange-100/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-purple-950 uppercase">Pre-Order Stage *</label>
                      <button
                        type="button"
                        onClick={() => setShowAddCustomStatusModal(true)}
                        className="text-[9px] font-bold text-[#ea580c] hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <PlusCircle className="w-3 h-3" /> + New Status
                      </button>
                    </div>
                    <select
                      value={productForm.preOrderStatus}
                      onChange={(e) => setProductForm({ ...productForm, preOrderStatus: e.target.value as PreOrderStatus })}
                      className="w-full bg-white border border-purple-200 rounded p-1.5 text-xs text-purple-900 font-bold outline-none"
                    >
                      {allPreOrderStatuses.map((opt) => (
                        <option key={opt.status} value={opt.status}>
                          {opt.icon} {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-purple-950 uppercase">Estimated Arrival *</label>
                      <button
                        type="button"
                        onClick={() => {
                          const today = new Date();
                          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                          setProductForm({ ...productForm, preOrderEstimatedArrival: todayStr });
                        }}
                        className="text-[9px] font-bold text-purple-700 hover:underline cursor-pointer"
                        title="Set arrival to today to trigger automatic push to cart"
                      >
                        Set Today
                      </button>
                    </div>
                    <div className="flex gap-1">
                      <input
                        type="date"
                        value={productForm.preOrderEstimatedArrival.match(/^\d{4}-\d{2}-\d{2}$/) ? productForm.preOrderEstimatedArrival : ''}
                        onChange={(e) => setProductForm({ ...productForm, preOrderEstimatedArrival: e.target.value })}
                        className="bg-white border border-purple-200 rounded p-1 text-xs outline-none w-32 shrink-0 font-mono"
                      />
                      <input
                        type="text"
                        placeholder="e.g. 10-14 Business Days"
                        value={productForm.preOrderEstimatedArrival}
                        onChange={(e) => setProductForm({ ...productForm, preOrderEstimatedArrival: e.target.value })}
                        className="flex-1 min-w-0 bg-white border border-purple-200 rounded p-1 text-xs outline-none font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-purple-950 uppercase">Stock Quantity *</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={productForm.quantity}
                      onChange={(e) => setProductForm({ ...productForm, quantity: Math.max(1, Number(e.target.value) || 1) })}
                      className="w-full bg-white border border-purple-200 rounded p-1.5 text-xs outline-none font-mono"
                      placeholder="Stock quantity to procure"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-700 uppercase">Product Description *</label>
              <textarea
                required
                rows={3}
                placeholder="Detail the product specification, features, origin, and sourcing benefits..."
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-xs outline-none focus:bg-white resize-none"
              />
            </div>

            {/* Product URL / Preview Link Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-gray-700 uppercase">Product Preview URL / External Reference Link</label>
                {productForm.productUrl && (
                  <a
                    href={productForm.productUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-bold text-[#ea580c] hover:underline flex items-center gap-1"
                  >
                    ↗ Preview how it will look
                  </a>
                )}
              </div>
              <input
                type="url"
                placeholder="https://example.com/product-preview-page or official store link..."
                value={productForm.productUrl}
                onChange={(e) => setProductForm({ ...productForm, productUrl: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-xs outline-none focus:bg-white font-mono"
              />
            </div>

            {/* Images inputs (up to 6) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-700 uppercase">Product Image URLs (Up to 6 Placeholders) *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {productForm.images.map((img, idx) => (
                  <input
                    key={idx}
                    type="url"
                    placeholder={`Product Image URL ${idx + 1}`}
                    value={img}
                    onChange={(e) => {
                      const updated = [...productForm.images];
                      updated[idx] = e.target.value;
                      setProductForm({ ...productForm, images: updated });
                    }}
                    className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-[10px] outline-none font-mono truncate"
                    required={idx === 0}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-700 uppercase">What's in the Box (Comma-separated) *</label>
              <input
                type="text"
                placeholder="iPhone 15 Pro, USB-C Charging cable, Sourcing receipt, Complimentary adapter"
                value={productForm.inTheBox}
                onChange={(e) => setProductForm({ ...productForm, inTheBox: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-xs outline-none"
              />
            </div>

            {/* PRODUCT SIZE VARIATIONS FOR BOTH GARMENTS AND SHOES (ADD PRODUCT TAB) */}
            <div className="bg-gray-50/80 border border-gray-200 rounded-xl p-3.5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#ea580c]" />
                    Product Size Variations (Garments & Shoes)
                  </h4>
                  <p className="text-[10px] text-gray-500">
                    Enable size variations for clothing or shoes. Active sizes appear as small interactive squares for customers.
                  </p>
                </div>
                {(productForm.isGarment || productForm.isFootwear) && (
                  <span className="text-[10px] font-bold text-[#ea580c] bg-orange-50 px-2 py-0.5 rounded border border-orange-200 w-fit">
                    {productForm.sizes.length} Sizes Active
                  </span>
                )}
              </div>

              {/* Toggles for Garments and Shoes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <label className={`p-2.5 border rounded-lg cursor-pointer flex items-center gap-2.5 transition-all ${
                  productForm.isGarment ? 'bg-white border-[#ea580c] ring-1 ring-[#ea580c] shadow-2xs' : 'bg-white/70 border-gray-200 hover:bg-white'
                }`}>
                  <input
                    type="checkbox"
                    checked={productForm.isGarment}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const initialGarmentSizes = checked && productForm.sizes.length === 0 ? ['S', 'M', 'L', 'XL'] : productForm.sizes;
                      setProductForm({ ...productForm, isGarment: checked, sizes: initialGarmentSizes });
                    }}
                    className="w-4 h-4 text-[#ea580c] rounded border-gray-300 focus:ring-[#ea580c]"
                  />
                  <div>
                    <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                      <Shirt className="w-3.5 h-3.5 text-[#ea580c]" />
                      Garments & Apparel Size Variation
                    </span>
                    <p className="text-[9px] text-gray-500">XS, S, M, L, XL, UK 6–18, waist sizes</p>
                  </div>
                </label>

                <label className={`p-2.5 border rounded-lg cursor-pointer flex items-center gap-2.5 transition-all ${
                  productForm.isFootwear ? 'bg-white border-[#ea580c] ring-1 ring-[#ea580c] shadow-2xs' : 'bg-white/70 border-gray-200 hover:bg-white'
                }`}>
                  <input
                    type="checkbox"
                    checked={productForm.isFootwear}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const initialShoeSizes = checked && productForm.sizes.length === 0 ? ['UK 7', 'UK 8', 'UK 9', 'UK 10'] : productForm.sizes;
                      setProductForm({ ...productForm, isFootwear: checked, sizes: initialShoeSizes });
                    }}
                    className="w-4 h-4 text-[#ea580c] rounded border-gray-300 focus:ring-[#ea580c]"
                  />
                  <div>
                    <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                      <Footprints className="w-3.5 h-3.5 text-[#ea580c]" />
                      Shoes & Footwear Size Variation
                    </span>
                    <p className="text-[9px] text-gray-500">UK 3–13, EU 36–46, sneaker & boot sizing</p>
                  </div>
                </label>
              </div>

              {/* Active Small Squares & Preset Pickers */}
              {(productForm.isGarment || productForm.isFootwear) && (
                <div className="space-y-3 pt-2 border-t border-gray-200/60">
                  {/* Small Squares Display / Active Size Variations */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Active Size Squares (Click × to remove):
                    </span>
                    <div className="flex flex-wrap gap-1.5 items-center min-h-[32px]">
                      {productForm.sizes.length === 0 ? (
                        <span className="text-[11px] text-amber-600 font-medium italic">
                          No sizes selected yet. Click preset size squares below or add custom sizes.
                        </span>
                      ) : (
                        productForm.sizes.map((sz) => (
                          <div
                            key={sz}
                            className="group relative w-8 h-8 rounded-lg bg-[#ea580c] text-white border border-orange-700 font-black text-xs font-mono flex items-center justify-center shadow-2xs select-none hover:scale-105 transition-transform"
                          >
                            {sz}
                            <button
                              type="button"
                              onClick={() => setProductForm({ ...productForm, sizes: productForm.sizes.filter((s) => s !== sz) })}
                              className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-red-600 text-white text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              title={`Remove ${sz}`}
                            >
                              ×
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Apparel Preset Squares */}
                  {productForm.isGarment && (
                    <div className="space-y-2 pt-1 border-t border-gray-100">
                      {/* Trouser & Pants Waist Sizes 28 to 36 */}
                      <div className="space-y-1 bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/80">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1">
                            👖 Trouser & Pants Sizes (Waist 28 to 36):
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const trouserSizes = ['28', '29', '30', '31', '32', '33', '34', '35', '36'];
                              const newSizes = Array.from(new Set([...productForm.sizes, ...trouserSizes]));
                              setProductForm({ ...productForm, sizes: newSizes });
                            }}
                            className="text-[10px] font-bold text-orange-800 hover:text-orange-950 underline cursor-pointer"
                          >
                            + Select All Trousers (28–36)
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {['28', '29', '30', '31', '32', '33', '34', '35', '36'].map((sz) => {
                            const isSel = productForm.sizes.includes(sz);
                            return (
                              <button
                                key={sz}
                                type="button"
                                onClick={() => {
                                  if (isSel) {
                                    setProductForm({ ...productForm, sizes: productForm.sizes.filter((s) => s !== sz) });
                                  } else {
                                    setProductForm({ ...productForm, sizes: [...productForm.sizes, sz] });
                                  }
                                }}
                                className={`w-7 h-7 rounded-md font-mono font-bold text-[11px] flex items-center justify-center border transition-all cursor-pointer ${
                                  isSel
                                    ? 'bg-[#ea580c] text-white border-orange-700 shadow-2xs'
                                    : 'bg-white text-gray-700 border-gray-200 hover:border-[#ea580c] hover:text-[#ea580c]'
                                }`}
                              >
                                {sz}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Standard Tops & Apparel */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                          <Shirt className="w-3 h-3 text-[#ea580c]" />
                          Standard Apparel Sizes:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'].map((preset) => {
                            const isSel = productForm.sizes.includes(preset);
                            return (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => {
                                  if (isSel) {
                                    setProductForm({ ...productForm, sizes: productForm.sizes.filter((s) => s !== preset) });
                                  } else {
                                    setProductForm({ ...productForm, sizes: [...productForm.sizes, preset] });
                                  }
                                }}
                                className={`w-7 h-7 rounded-md font-mono font-bold text-[11px] flex items-center justify-center border transition-all cursor-pointer ${
                                  isSel
                                    ? 'bg-[#ea580c] text-white border-orange-700 shadow-2xs'
                                    : 'bg-white text-gray-700 border-gray-200 hover:border-[#ea580c] hover:text-[#ea580c]'
                                }`}
                              >
                                {preset}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* UK Dress Sizes */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                          UK Dress / Women Sizes:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {['UK 6', 'UK 8', 'UK 10', 'UK 12', 'UK 14', 'UK 16', 'UK 18'].map((preset) => {
                            const isSel = productForm.sizes.includes(preset);
                            return (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => {
                                  if (isSel) {
                                    setProductForm({ ...productForm, sizes: productForm.sizes.filter((s) => s !== preset) });
                                  } else {
                                    setProductForm({ ...productForm, sizes: [...productForm.sizes, preset] });
                                  }
                                }}
                                className={`px-1.5 h-7 min-w-[28px] rounded-md font-mono font-bold text-[10px] flex items-center justify-center border transition-all cursor-pointer ${
                                  isSel
                                    ? 'bg-[#ea580c] text-white border-orange-700 shadow-2xs'
                                    : 'bg-white text-gray-700 border-gray-200 hover:border-[#ea580c] hover:text-[#ea580c]'
                                }`}
                              >
                                {preset}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Shoes Preset Squares */}
                  {productForm.isFootwear && (
                    <div className="space-y-2.5 pt-1 border-t border-gray-100">
                      {/* UK Shoe Sizes */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                            <Footprints className="w-3 h-3 text-[#ea580c]" />
                            UK Shoe Sizes:
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const ukStd = ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11'];
                              const newSizes = Array.from(new Set([...productForm.sizes, ...ukStd]));
                              setProductForm({ ...productForm, sizes: newSizes });
                            }}
                            className="text-[10px] font-bold text-orange-800 hover:text-orange-950 underline cursor-pointer"
                          >
                            + Add UK 6–11
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {['UK 3', 'UK 3.5', 'UK 4', 'UK 4.5', 'UK 5', 'UK 5.5', 'UK 6', 'UK 6.5', 'UK 7', 'UK 7.5', 'UK 8', 'UK 8.5', 'UK 9', 'UK 9.5', 'UK 10', 'UK 10.5', 'UK 11', 'UK 11.5', 'UK 12', 'UK 13'].map((preset) => {
                            const isSel = productForm.sizes.includes(preset);
                            return (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => {
                                  if (isSel) {
                                    setProductForm({ ...productForm, sizes: productForm.sizes.filter((s) => s !== preset) });
                                  } else {
                                    setProductForm({ ...productForm, sizes: [...productForm.sizes, preset] });
                                  }
                                }}
                                className={`px-1.5 h-7 min-w-[28px] rounded-md font-mono font-bold text-[10px] flex items-center justify-center border transition-all cursor-pointer ${
                                  isSel
                                    ? 'bg-[#ea580c] text-white border-orange-700 shadow-2xs'
                                    : 'bg-white text-gray-700 border-gray-200 hover:border-[#ea580c] hover:text-[#ea580c]'
                                }`}
                              >
                                {preset}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* EUR Shoe Sizes */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                            <Footprints className="w-3 h-3 text-[#ea580c]" />
                            EUR Shoe Sizes:
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const eurStd = ['EUR 39', 'EUR 40', 'EUR 41', 'EUR 42', 'EUR 43', 'EUR 44', 'EUR 45'];
                              const newSizes = Array.from(new Set([...productForm.sizes, ...eurStd]));
                              setProductForm({ ...productForm, sizes: newSizes });
                            }}
                            className="text-[10px] font-bold text-orange-800 hover:text-orange-950 underline cursor-pointer"
                          >
                            + Add EUR 39–45
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {['EUR 36', 'EUR 37', 'EUR 38', 'EUR 39', 'EUR 40', 'EUR 41', 'EUR 42', 'EUR 43', 'EUR 44', 'EUR 45', 'EUR 46', 'EUR 47', 'EUR 48'].map((preset) => {
                            const isSel = productForm.sizes.includes(preset);
                            return (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => {
                                  if (isSel) {
                                    setProductForm({ ...productForm, sizes: productForm.sizes.filter((s) => s !== preset) });
                                  } else {
                                    setProductForm({ ...productForm, sizes: [...productForm.sizes, preset] });
                                  }
                                }}
                                className={`px-1.5 h-7 min-w-[28px] rounded-md font-mono font-bold text-[10px] flex items-center justify-center border transition-all cursor-pointer ${
                                  isSel
                                    ? 'bg-[#ea580c] text-white border-orange-700 shadow-2xs'
                                    : 'bg-white text-gray-700 border-gray-200 hover:border-[#ea580c] hover:text-[#ea580c]'
                                }`}
                              >
                                {preset}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Dual UK & EUR Shoe Sizes */}
                      <div className="space-y-1 bg-orange-50/50 p-2.5 rounded-lg border border-orange-100">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-orange-950 uppercase tracking-wider">
                            Dual UK & EUR Shoe Sizes:
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const dualStd = ['UK 6 / EUR 40', 'UK 7 / EUR 41', 'UK 8 / EUR 42', 'UK 9 / EUR 43', 'UK 10 / EUR 44', 'UK 11 / EUR 45'];
                              const newSizes = Array.from(new Set([...productForm.sizes, ...dualStd]));
                              setProductForm({ ...productForm, sizes: newSizes });
                            }}
                            className="text-[10px] font-bold text-orange-800 hover:text-orange-950 underline cursor-pointer"
                          >
                            + Add All Dual
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {['UK 6 / EUR 40', 'UK 7 / EUR 41', 'UK 8 / EUR 42', 'UK 9 / EUR 43', 'UK 10 / EUR 44', 'UK 11 / EUR 45', 'UK 12 / EUR 46'].map((preset) => {
                            const isSel = productForm.sizes.includes(preset);
                            return (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => {
                                  if (isSel) {
                                    setProductForm({ ...productForm, sizes: productForm.sizes.filter((s) => s !== preset) });
                                  } else {
                                    setProductForm({ ...productForm, sizes: [...productForm.sizes, preset] });
                                  }
                                }}
                                className={`px-2 h-7 rounded-md font-mono font-bold text-[10px] flex items-center justify-center border transition-all cursor-pointer ${
                                  isSel
                                    ? 'bg-[#ea580c] text-white border-orange-700 shadow-2xs'
                                    : 'bg-white text-gray-700 border-gray-200 hover:border-[#ea580c] hover:text-[#ea580c]'
                                }`}
                              >
                                {preset}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Custom Size Input */}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Add custom size square (e.g. 42R, One Size, US 10.5, Kids 4-5Y)..."
                      value={customSizeInput}
                      onChange={(e) => setCustomSizeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = customSizeInput.trim();
                          if (val && !productForm.sizes.includes(val)) {
                            setProductForm({ ...productForm, sizes: [...productForm.sizes, val] });
                            setCustomSizeInput('');
                          }
                        }
                      }}
                      className="flex-1 bg-white border border-gray-200 rounded-lg p-1.5 text-xs outline-none focus:border-[#ea580c]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = customSizeInput.trim();
                        if (val && !productForm.sizes.includes(val)) {
                          setProductForm({ ...productForm, sizes: [...productForm.sizes, val] });
                          setCustomSizeInput('');
                        }
                      }}
                      disabled={!customSizeInput.trim()}
                      className="px-3 py-1.5 bg-[#ea580c] hover:bg-orange-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      + Add Size Square
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Technical custom verification specs inputs */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-gray-700 uppercase">Sourcing Verification Specifications</label>
                <span className="text-[10px] text-gray-400 font-medium">(Optional - leave blank if not applicable)</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {productForm.sourcingSpecs.map((spec, idx) => (
                  <div key={idx} className="flex gap-1.5 items-center">
                    <span className="font-semibold text-gray-500 shrink-0 w-32 truncate" title={spec.key}>
                      {spec.key === 'Warranty' ? 'Warranty (Optional):' : `${spec.key}:`}
                    </span>
                    <input
                      type="text"
                      placeholder={
                        spec.key.toLowerCase().includes('warranty')
                          ? 'Optional (not mandatory)'
                          : spec.key.toLowerCase().includes('network')
                          ? 'Optional (e.g. 220V / 5G)'
                          : 'Optional detail...'
                      }
                      value={spec.value}
                      onChange={(e) => {
                        const updated = [...productForm.sourcingSpecs];
                        updated[idx].value = e.target.value;
                        setProductForm({ ...productForm, sourcingSpecs: updated });
                      }}
                      className="flex-1 bg-gray-50 border border-gray-200 rounded p-1 text-[11px]"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-50">
              <button
                type="button"
                onClick={() => {
                  setShowProductModal(false);
                  setEditingProduct(null);
                }}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-[#ea580c] hover:bg-orange-700 text-white text-xs font-bold rounded shadow"
              >
                ✓ {editingProduct ? 'Save Specs Changes' : 'Publish Product'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* CONFIRMATION MODAL: DELETE INDIVIDUAL FLASH DEAL */}
      {dealToDelete && (
        <Modal
          isOpen={Boolean(dealToDelete)}
          onClose={() => setDealToDelete(null)}
          title="Confirm Delete Flash Deal"
          maxWidth="md"
        >
          <div className="space-y-4 text-left">
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-red-900">Delete Promotional Markdown Deal</h4>
                <p className="text-[11px] text-red-700 leading-relaxed">
                  Are you sure you want to delete the flash deal for <strong>"{dealToDelete.title}"</strong>?
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">Current Deal Price:</span>
                <span className="font-mono font-bold text-orange-800">
                  UGX {new Intl.NumberFormat('en-UG').format(dealToDelete.basePrice)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Restored Regular Price:</span>
                <span className="font-mono font-bold text-gray-800">
                  UGX {new Intl.NumberFormat('en-UG').format(dealToDelete.originalPrice || dealToDelete.basePrice)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className="font-bold text-red-600">
                  {dealToDelete.flashDealEnd && new Date(dealToDelete.flashDealEnd).getTime() <= Date.now()
                    ? 'Expired'
                    : 'Active'}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDealToDelete(null)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDeleteDeal(dealToDelete)}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Confirm Delete Deal
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRMATION MODAL: DELETE ALL EXPIRED FLASH DEALS */}
      {showDeleteAllExpiredModal && (
        <Modal
          isOpen={showDeleteAllExpiredModal}
          onClose={() => setShowDeleteAllExpiredModal(false)}
          title="Delete All Expired Flash Deals"
          maxWidth="md"
        >
          <div className="space-y-4 text-left">
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-red-900">Bulk Delete Expired Flash Deals</h4>
                <p className="text-[11px] text-red-700 leading-relaxed">
                  This will remove all flash deal markers and restore regular catalog pricing for all expired products that have passed their deadline.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteAllExpiredModal(false)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAllExpired}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Yes, Delete All Expired
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ADMIN DIALOG: SOURCED ITEM PARAMETER & HIGH-RES IMAGES INSPECTION */}
      {currentInspectReq && (
        <Modal
          isOpen={Boolean(currentInspectReq)}
          onClose={() => setInspectRequest(null)}
          title={`Sourced Product Inspection: ${currentInspectReq.productName}`}
          maxWidth="4xl"
        >
          <div className="space-y-6 text-left">
            {/* Top summary row */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-xs bg-white px-2.5 py-1 rounded border border-gray-200 text-gray-800">
                  {currentInspectReq.id}
                </span>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                    currentInspectReq.status === 'Completed'
                      ? 'bg-emerald-50 text-emerald-700'
                      : currentInspectReq.status === 'Quoted'
                      ? 'bg-orange-50 text-orange-800 border border-orange-100'
                      : currentInspectReq.status === 'Ordered'
                      ? 'bg-blue-50 text-blue-700 border border-blue-100'
                      : 'bg-yellow-50 text-yellow-800'
                  }`}
                >
                  {currentInspectReq.status}
                </span>
              </div>
              <div className="text-xs text-gray-500 flex flex-wrap items-center gap-3">
                <span>Customer: <strong className="text-gray-900">{currentInspectReq.customerName || 'Anonymous'}</strong> ({currentInspectReq.customerPhone || 'No phone'})</span>
                <span>Date: <strong className="text-gray-900">{currentInspectReq.date}</strong></span>
              </div>
            </div>

            {/* Main content: Left (Large Image Viewer) | Right (Parameters & Quote formulation) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Image viewer column */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#ea580c]" />
                    Product Images ({inspectImages.length} {inspectImages.length === 1 ? 'Photo' : 'Photos'})
                  </span>
                  {inspectImages[inspectActiveImageIdx] && (
                    <a
                      href={inspectImages[inspectActiveImageIdx]}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#ea580c] hover:underline"
                    >
                      <Maximize2 className="w-3.5 h-3.5" /> Open Full Resolution
                    </a>
                  )}
                </div>

                {/* Main Large Image Display */}
                <div className="relative w-full h-80 sm:h-96 rounded-xl bg-neutral-900 border border-gray-200 overflow-hidden flex items-center justify-center group shadow-inner">
                  {inspectImages.length > 0 ? (
                    <img
                      src={inspectImages[inspectActiveImageIdx] || inspectImages[0]}
                      alt="Product inspection preview"
                      className="w-full h-full object-contain p-2 transition-all"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80';
                      }}
                    />
                  ) : (
                    <div className="text-center text-gray-400 p-8 space-y-2">
                      <ImageIcon className="w-10 h-10 mx-auto opacity-40" />
                      <p className="text-xs">No photo was attached to this product request.</p>
                    </div>
                  )}

                  {/* Previous / Next buttons for images */}
                  {inspectImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setInspectActiveImageIdx((prev) => (prev > 0 ? prev - 1 : inspectImages.length - 1))}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer"
                        title="Previous image"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setInspectActiveImageIdx((prev) => (prev < inspectImages.length - 1 ? prev + 1 : 0))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer"
                        title="Next image"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                        {inspectActiveImageIdx + 1} / {inspectImages.length}
                      </div>
                    </>
                  )}
                </div>

                {/* Thumbnails strip */}
                {inspectImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {inspectImages.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setInspectActiveImageIdx(idx)}
                        className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 bg-neutral-900 transition-all cursor-pointer ${
                          inspectActiveImageIdx === idx
                            ? 'border-[#ea580c] ring-2 ring-[#ea580c]/30'
                            : 'border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 right-0 bg-black/70 text-white text-[8px] font-bold px-1 rounded-tl">
                          #{idx + 1}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sourced Specifications & Quote Formulation Column */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Product Name</span>
                    <h3 className="text-base font-bold text-gray-900 mt-0.5">{currentInspectReq.productName}</h3>
                  </div>

                  {currentInspectReq.productLink && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">External Store Link</span>
                      <div className="mt-0.5">
                        <a
                          href={currentInspectReq.productLink}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-1.5 text-xs text-[#ea580c] font-semibold hover:underline break-all"
                        >
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          View UK Source Webpage
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200/60 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Quantity</span>
                      <p className="font-mono font-bold text-gray-900 mt-0.5 text-sm">{currentInspectReq.quantity} units</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Current Quote</span>
                      <p className="font-mono font-bold text-[#ea580c] mt-0.5 text-sm">
                        {currentInspectReq.quotePrice ? `UGX ${currentInspectReq.quotePrice.toLocaleString()}` : 'Awaiting'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-200/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Sourced Specs & Parameters
                    </span>
                    <div className="mt-1 p-3 bg-white rounded-lg border border-gray-200 text-xs text-gray-800 leading-relaxed font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {currentInspectReq.description || 'No specific parameters provided.'}
                    </div>
                  </div>

                  {currentInspectReq.notes && (
                    <div className="pt-2 border-t border-gray-200/60">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Customer Sourcing Notes</span>
                      <p className="mt-1 text-xs text-gray-700 bg-white p-2.5 rounded-lg border border-gray-200 leading-relaxed">
                        {currentInspectReq.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Inline Quote formulation card */}
                <div className="bg-orange-50/60 border border-orange-100 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-[#ea580c]" />
                      Formulate / Update Sourcing Quote
                    </span>
                    <span className="text-[10px] font-semibold text-orange-800 bg-orange-100 px-2 py-0.5 rounded-full">
                      in UGX
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="e.g. 350000"
                      value={inspectQuoteInput}
                      onChange={(e) => setInspectQuoteInput(e.target.value ? Number(e.target.value) : '')}
                      className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs sm:text-sm font-mono font-bold outline-none focus:border-[#ea580c]"
                    />
                    <button
                      type="button"
                      onClick={handleInspectQuoteSubmit}
                      className="px-4 py-2 bg-[#ea580c] hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm"
                    >
                      {currentInspectReq.quotePrice ? 'Update Quote' : 'Send Quote'}
                    </button>
                  </div>

                  {/* Status switcher and Delete Button */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-orange-100 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 font-medium">Pipeline Status:</span>
                      <select
                        value={currentInspectReq.status}
                        onChange={(e) => updateImportStatus(currentInspectReq.id, e.target.value as any)}
                        className="bg-white border border-gray-200 font-semibold rounded-lg px-2.5 py-1 text-xs outline-none cursor-pointer"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Quoted">Quoted</option>
                        <option value="Ordered">Ordered</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>

                    {currentInspectReq.status === 'Completed' && (
                      <button
                        type="button"
                        onClick={() => setImportToDelete(currentInspectReq)}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                        title="Delete this completed product request"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        <span>Delete Done Request</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: ADMIN ADD CUSTOM PRE-ORDER STATUS */}
      {showAddCustomStatusModal && (
        <Modal
          isOpen={showAddCustomStatusModal}
          onClose={() => setShowAddCustomStatusModal(false)}
          title="Add Custom Pre-Order Status"
          maxWidth="md"
        >
          <div className="space-y-4 text-left">
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#ea580c] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-orange-950">Create New Pre-Order Status</h4>
                <p className="text-[11px] text-orange-800 leading-relaxed">
                  Define a new custom pre-order workflow status. Once added, it will be immediately available in the pre-order dropdowns and shown to customers.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-1 space-y-1">
                  <label className="text-[10px] font-bold text-gray-700 uppercase">Icon / Emoji</label>
                  <input
                    type="text"
                    value={newStatusIconInput}
                    onChange={(e) => setNewStatusIconInput(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-center text-base outline-none focus:bg-white"
                    placeholder="📦"
                  />
                </div>
                <div className="col-span-3 space-y-1">
                  <label className="text-[10px] font-bold text-gray-700 uppercase">Status Name *</label>
                  <input
                    type="text"
                    required
                    value={newStatusInput}
                    onChange={(e) => setNewStatusInput(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-xs outline-none focus:bg-white font-bold"
                    placeholder="e.g. Secured in UK Warehouse"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-700 uppercase">Customer Description</label>
                <input
                  type="text"
                  value={newStatusDescInput}
                  onChange={(e) => setNewStatusDescInput(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-xs outline-none focus:bg-white"
                  placeholder="e.g. Item purchased, packed, and queued for air freight."
                />
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] font-bold text-gray-400 w-full">Quick Icon Suggestions:</span>
                {['📦', '🛒', '✈️', '🏢', '🎉', '🏷️', '🛡️', '⚡', '🚚', '🇬🇧'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewStatusIconInput(emoji)}
                    className={`w-7 h-7 rounded border text-xs flex items-center justify-center cursor-pointer transition-colors ${
                      newStatusIconInput === emoji ? 'bg-[#ea580c] text-white border-orange-700' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowAddCustomStatusModal(false)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newStatusInput.trim()}
                onClick={() => {
                  const val = newStatusInput.trim();
                  if (!val) return;
                  saveCustomPreOrderStatus({
                    status: val,
                    label: val,
                    icon: newStatusIconInput.trim() || '📦',
                    desc: newStatusDescInput.trim() || 'Custom pre-order stage',
                    color: 'bg-orange-100 text-orange-900 border-orange-300'
                  });
                  const updated = getPreOrderStatuses();
                  setAllPreOrderStatuses(updated);
                  setProductForm((prev) => ({ ...prev, preOrderStatus: val as PreOrderStatus }));
                  setShowAddCustomStatusModal(false);
                  setNewStatusInput('');
                  setNewStatusDescInput('');
                }}
                className="flex-1 py-2 bg-[#ea580c] hover:bg-orange-700 disabled:opacity-40 text-white text-xs font-bold rounded-lg cursor-pointer shadow-sm"
              >
                Save & Apply Status
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRMATION MODAL: DELETE DONE ORDER */}
      {orderToDelete && (
        <Modal
          isOpen={Boolean(orderToDelete)}
          onClose={() => setOrderToDelete(null)}
          title={`Delete Completed Order #${orderToDelete.id}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-left">
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-red-900">Permanent Order Deletion</h4>
                <p className="text-[11px] text-red-700 leading-relaxed">
                  Are you sure you want to permanently delete done order <strong>#{orderToDelete.id}</strong> (Status: <strong>{orderToDelete.status}</strong>)?
                </p>
                <div className="text-[10px] text-red-800 font-mono mt-1">
                  Customer: {orderToDelete.customerName} • Phone: {orderToDelete.customerPhone} • Total: UGX {new Intl.NumberFormat('en-UG').format(orderToDelete.totalAmount)}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed">
              This completed order will be completely purged from your database and fulfillment queue.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteOrder && orderToDelete) {
                    deleteOrder(orderToDelete.id);
                  }
                  setOrderToDelete(null);
                }}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Confirm Delete Order
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRMATION MODAL: DELETE DONE PRODUCT REQUEST */}
      {importToDelete && (
        <Modal
          isOpen={Boolean(importToDelete)}
          onClose={() => setImportToDelete(null)}
          title={`Delete Sourced Request #${importToDelete.id}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-left">
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-red-900">Delete Completed Product Request</h4>
                <p className="text-[11px] text-red-700 leading-relaxed">
                  Are you sure you want to permanently delete completed sourcing request <strong>#{importToDelete.id}</strong> for <strong>{importToDelete.productName}</strong>?
                </p>
                <div className="text-[10px] text-red-800 font-mono mt-1">
                  Customer: {importToDelete.customerName || 'Anonymous'} {importToDelete.customerPhone ? `• ${importToDelete.customerPhone}` : ''}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed">
              This will permanently delete this fulfilled product request record from your sourcing desk and database.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setImportToDelete(null)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteImportRequest && importToDelete) {
                    deleteImportRequest(importToDelete.id);
                  }
                  if (currentInspectReq && currentInspectReq.id === importToDelete.id) {
                    setInspectRequest(null);
                  }
                  setImportToDelete(null);
                }}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Confirm Delete Request
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRMATION MODAL: DELETE ALL DONE PRODUCT REQUESTS */}
      {showClearAllDoneImportsModal && (
        <Modal
          isOpen={showClearAllDoneImportsModal}
          onClose={() => setShowClearAllDoneImportsModal(false)}
          title="Delete All Done Product Requests"
          maxWidth="md"
        >
          <div className="space-y-4 text-left">
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-red-900">Purge Completed Product Requests</h4>
                <p className="text-[11px] text-red-700 leading-relaxed">
                  Are you sure you want to permanently delete all <strong>{imports.filter((i) => i.status === 'Completed').length}</strong> completed/fulfilled product sourcing requests from your desk?
                </p>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed">
              This action cannot be undone. All fulfilled sourcing records will be cleared to keep your sourcing dashboard clean.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearAllDoneImportsModal(false)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAllDoneImports}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Yes, Delete All Done ({imports.filter((i) => i.status === 'Completed').length})
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRMATION MODAL: DELETE CUSTOMER CONVERSATION */}
      {conversationToDelete && (
        <Modal
          isOpen={Boolean(conversationToDelete)}
          onClose={() => setConversationToDelete(null)}
          title="Delete Customer Conversation Thread"
          maxWidth="md"
        >
          <div className="space-y-4 text-left">
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-red-900">Delete Conversation History</h4>
                <p className="text-[11px] text-red-700 leading-relaxed">
                  Are you sure you want to delete all messages with <strong>{conversationToDelete.name}</strong> ({conversationToDelete.email})?
                </p>
                <p className="text-[10px] text-red-800 leading-relaxed">
                  This will permanently clear all chat history between this customer and UK2UG support.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConversationToDelete(null)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteConversation && conversationToDelete) {
                    deleteConversation(conversationToDelete.email);
                  }
                  setConversationToDelete(null);
                }}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Yes, Delete Conversation
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRMATION MODAL: DELETE INDIVIDUAL CUSTOMER MESSAGE */}
      {messageToDelete && (
        <Modal
          isOpen={Boolean(messageToDelete)}
          onClose={() => setMessageToDelete(null)}
          title="Delete Customer Message"
          maxWidth="sm"
        >
          <div className="space-y-4 text-left">
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-red-900">Delete Message</h4>
                <p className="text-[11px] text-red-700 leading-relaxed">
                  Are you sure you want to delete this specific message? It will be permanently removed.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMessageToDelete(null)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteMessage && messageToDelete) {
                    deleteMessage(messageToDelete);
                  }
                  setMessageToDelete(null);
                }}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 1: INSPECT PAYMENT DETAILS */}
      {inspectPaymentOrder && (
        <Modal
          isOpen={Boolean(inspectPaymentOrder)}
          onClose={() => setInspectPaymentOrder(null)}
          title={`Payment Verification Details • Order #${inspectPaymentOrder.id}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-left">
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3.5 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-orange-950 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-[#ea580c]" />
                  Incoming Customer Payment Record
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                    inspectPaymentOrder.paymentStatus === 'Paid' || inspectPaymentOrder.status === 'Paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : inspectPaymentOrder.paymentStatus === 'Failed'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {inspectPaymentOrder.paymentStatus || (inspectPaymentOrder.status === 'Paid' ? 'Paid' : 'Pending Verification')}
                </span>
              </div>
              <p className="text-[11px] text-orange-800">
                Direct view of the payment verification details submitted by the customer upon checkout and payment completion.
              </p>
            </div>

            {/* Key Field Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-1">
                <div className="text-[10px] font-bold text-gray-400 uppercase">Customer Information</div>
                <div className="font-bold text-gray-900">{inspectPaymentOrder.customerName}</div>
                <div className="text-[11px] text-gray-600 font-mono flex items-center gap-1">
                  <Phone className="w-3 h-3 text-gray-400" />
                  {inspectPaymentOrder.customerPhone}
                </div>
                {inspectPaymentOrder.customerEmail && (
                  <div className="text-[11px] text-gray-500 truncate">{inspectPaymentOrder.customerEmail}</div>
                )}
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-1">
                <div className="text-[10px] font-bold text-gray-400 uppercase">Transaction ID / Reference</div>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-gray-900 text-sm bg-white px-2 py-0.5 rounded border border-gray-300">
                    {inspectPaymentOrder.paymentTransactionRef || inspectPaymentOrder.transactionId || 'None Provided'}
                  </span>
                  {inspectPaymentOrder.paymentTransactionRef && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(inspectPaymentOrder.paymentTransactionRef || '');
                        setPaymentActionFeedback(`Copied: ${inspectPaymentOrder.paymentTransactionRef}`);
                        setTimeout(() => setPaymentActionFeedback(''), 3000);
                      }}
                      className="px-2 py-1 bg-white hover:bg-gray-100 text-orange-700 border border-gray-300 rounded text-[11px] font-bold cursor-pointer flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  )}
                </div>
                <div className="text-[10px] text-gray-500 mt-1">
                  Channel: <strong className="text-gray-700">{inspectPaymentOrder.paymentMethod}</strong>
                  {inspectPaymentOrder.paymentPhone && ` • Account: ${inspectPaymentOrder.paymentPhone}`}
                </div>
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-1">
                <div className="text-[10px] font-bold text-gray-400 uppercase">Amount Due / Invoiced</div>
                <div className="text-base font-black text-gray-900 font-mono">
                  UGX {new Intl.NumberFormat('en-UG').format(inspectPaymentOrder.totalAmount)}
                </div>
                <div className="text-[10px] text-gray-500">
                  Fulfillment: {inspectPaymentOrder.deliveryPath === 'pickup' ? 'Store Pickup (Thobani Centre)' : `Rider Delivery (${inspectPaymentOrder.deliveryDetails?.district || 'Kampala'})`}
                </div>
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-1">
                <div className="text-[10px] font-bold text-gray-400 uppercase">Submission Timestamp</div>
                <div className="font-mono text-gray-800 text-[11px]">
                  {inspectPaymentOrder.paymentSubmittedAt
                    ? new Date(inspectPaymentOrder.paymentSubmittedAt).toLocaleString()
                    : inspectPaymentOrder.date}
                </div>
                {inspectPaymentOrder.paymentVerifiedAt && (
                  <div className="text-[10px] text-emerald-700 font-mono">
                    Verified: {new Date(inspectPaymentOrder.paymentVerifiedAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            {/* Verification / Flag Notes if any */}
            {inspectPaymentOrder.paymentNotes && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs space-y-1">
                <span className="font-bold text-red-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  Payment / Flagged Verification Notes
                </span>
                <p className="text-red-800 text-[11px] leading-relaxed">
                  {inspectPaymentOrder.paymentNotes}
                </p>
              </div>
            )}

            {/* Ordered Items Breakdown */}
            <div className="space-y-2 border border-gray-200 rounded-xl p-3.5 bg-gray-50/50">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-700 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-[#ea580c]" />
                  Invoiced Items ({inspectPaymentOrder.items.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const summary = `Order #${inspectPaymentOrder.id} • Customer: ${inspectPaymentOrder.customerName} (${inspectPaymentOrder.customerPhone}) • Amount: UGX ${inspectPaymentOrder.totalAmount.toLocaleString()} • Ref: ${inspectPaymentOrder.paymentTransactionRef || inspectPaymentOrder.transactionId || 'None'} • Status: ${inspectPaymentOrder.paymentStatus || inspectPaymentOrder.status}`;
                    navigator.clipboard.writeText(summary);
                    setCopiedPaymentSummary(true);
                    setTimeout(() => setCopiedPaymentSummary(false), 3000);
                  }}
                  className="px-2 py-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedPaymentSummary ? 'Summary Copied!' : 'Copy Payment Summary'}</span>
                </button>
              </div>
              <div className="divide-y divide-gray-200/70 max-h-40 overflow-y-auto pr-1">
                {inspectPaymentOrder.items.map((item, idx) => {
                  const prod = products.find((p) => p.id === item.productId);
                  return (
                    <div key={idx} className="py-2 first:pt-0 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        {prod?.images?.[0] ? (
                          <img src={prod.images[0]} alt={item.title} className="w-8 h-8 rounded object-cover border border-gray-200 shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-orange-100 text-[#ea580c] flex items-center justify-center font-bold text-[10px] shrink-0">UK</div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate max-w-[240px]">{item.title}</p>
                          <p className="text-[10px] text-gray-500">Qty: {item.quantity} × UGX {new Intl.NumberFormat('en-UG').format(item.price)}</p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-gray-900 shrink-0">
                        UGX {new Intl.NumberFormat('en-UG').format(item.price * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setInspectPaymentOrder(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {inspectPaymentOrder.paymentStatus !== 'Failed' && (
                  <button
                    type="button"
                    onClick={() => {
                      const ord = inspectPaymentOrder;
                      setInspectPaymentOrder(null);
                      setShowFlagPaymentModal(ord);
                    }}
                    className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Flag Issue
                  </button>
                )}

                {inspectPaymentOrder.paymentStatus !== 'Paid' && inspectPaymentOrder.status !== 'Paid' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (verifyOrderPayment) {
                        verifyOrderPayment(inspectPaymentOrder.id, 'Paid');
                      } else {
                        updateOrderStatus(inspectPaymentOrder.id, 'Paid');
                      }
                      setPaymentActionFeedback(`Order #${inspectPaymentOrder.id} marked as Paid. Customer notified.`);
                      setInspectPaymentOrder(null);
                      setTimeout(() => setPaymentActionFeedback(''), 4000);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve Payment & Notify Customer</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 2: CONFIRMATION TO BATCH DELETE COMPLETED RIDER ORDERS */}
      {showBatchDeleteRiderModal && (() => {
        const completedRiderOrders = orders.filter(
          (o) => o.deliveryPath === 'delivery' && ['Delivered', 'Failed', 'Returned'].includes(o.status)
        );

        return (
          <Modal
            isOpen={showBatchDeleteRiderModal}
            onClose={() => setShowBatchDeleteRiderModal(false)}
            title="Purge Completed Orders from Rider Route Queue"
            maxWidth="md"
          >
            <div className="space-y-4 text-left">
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-red-900">Purge Past Done Orders from Rider Queue</h4>
                  <p className="text-[11px] text-red-700 leading-relaxed">
                    You are about to permanently delete <strong>{completedRiderOrders.length} completed/past orders</strong> from the rider dispatch queue and database.
                  </p>
                  <p className="text-[10px] text-red-800 leading-relaxed">
                    This will declutter the rider app interface, speed up loading times, and maintain overall site tidiness.
                  </p>
                </div>
              </div>

              {completedRiderOrders.length > 0 ? (
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100 text-xs">
                  {completedRiderOrders.map((ord) => (
                    <div key={ord.id} className="p-2 flex items-center justify-between text-[11px]">
                      <div>
                        <span className="font-mono font-bold text-gray-900">#{ord.id}</span> • {ord.customerName}
                      </div>
                      <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 font-bold rounded text-[10px]">
                        {ord.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">No completed orders found in rider queue.</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBatchDeleteRiderModal(false)}
                  className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={completedRiderOrders.length === 0}
                  onClick={() => {
                    if (batchDeleteCompletedRiderOrders) {
                      const count = batchDeleteCompletedRiderOrders();
                      setBatchDeleteResultNotice(`Successfully purged ${count} completed orders from the rider queue.`);
                    }
                    setShowBatchDeleteRiderModal(false);
                    setTimeout(() => setBatchDeleteResultNotice(''), 5000);
                  }}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirm Purge ({completedRiderOrders.length})</span>
                </button>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* MODAL 3: FLAG PAYMENT ISSUE */}
      {showFlagPaymentModal && (
        <Modal
          isOpen={Boolean(showFlagPaymentModal)}
          onClose={() => {
            setShowFlagPaymentModal(null);
            setFlagIssueNotes('');
          }}
          title={`Flag Payment Issue • Order #${showFlagPaymentModal.id}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-left">
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Notify Customer of Payment Discrepancy
              </p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Flagging this transaction will set the payment status to <strong>Failed</strong> and automatically dispatch a notice to the customer's account so they can resend the correct transaction ID or retry.
              </p>
            </div>

            <div className="space-y-1 text-xs">
              <div className="font-bold text-gray-700">Submitted Transaction Reference:</div>
              <div className="p-2 bg-gray-100 rounded font-mono text-gray-900">
                {showFlagPaymentModal.paymentTransactionRef || 'No reference submitted'}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Reason / Note for Customer <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g., Transaction ID PP2409... could not be found in our MTN MoMo merchant statement. Please verify the 10-digit code."
                value={flagIssueNotes}
                onChange={(e) => setFlagIssueNotes(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg p-3 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setShowFlagPaymentModal(null);
                  setFlagIssueNotes('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (verifyOrderPayment) {
                    verifyOrderPayment(showFlagPaymentModal.id, 'Failed', flagIssueNotes || 'Payment transaction verification failed.');
                  } else {
                    updateOrderStatus(showFlagPaymentModal.id, 'Pending');
                  }
                  setPaymentActionFeedback(`Order #${showFlagPaymentModal.id} payment flagged as Failed. Customer notified.`);
                  setShowFlagPaymentModal(null);
                  setFlagIssueNotes('');
                  setTimeout(() => setPaymentActionFeedback(''), 4500);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
              >
                Flag Payment & Notify
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 4: REGISTER / ADD RIDER PROFILE */}
      {showAddRiderModal && (
        <Modal
          isOpen={showAddRiderModal}
          onClose={() => {
            setShowAddRiderModal(false);
            setNewRiderForm({
              name: '',
              phone: '',
              email: '',
              vehicleType: 'Motorcycle (Boda Boda)',
              plateNumber: '',
            });
          }}
          title="Register Rider Profile"
          maxWidth="md"
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newRiderForm.name.trim() || !newRiderForm.phone.trim()) {
                return;
              }
              if (saveRiderProfile) {
                await saveRiderProfile({
                  name: newRiderForm.name.trim(),
                  phone: newRiderForm.phone.trim(),
                  email: newRiderForm.email.trim() || `rider.${Date.now()}@uk2ug.com`,
                  vehicleType: newRiderForm.vehicleType,
                  plateNumber: newRiderForm.plateNumber.trim(),
                  status: 'Active',
                });
                setRiderActionNotice(`Successfully registered rider profile for ${newRiderForm.name}!`);
                setTimeout(() => setRiderActionNotice(''), 4000);
              }
              setShowAddRiderModal(false);
              setNewRiderForm({
                name: '',
                phone: '',
                email: '',
                vehicleType: 'Motorcycle (Boda Boda)',
                plateNumber: '',
              });
            }}
            className="space-y-4 text-left"
          >
            <div className="p-3 bg-orange-50 border border-orange-200 text-orange-900 rounded-xl text-xs space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#ea580c]" />
                Fleet Courier & Dispatch Setup
              </p>
              <p className="text-[11px] text-orange-800">
                Register a new dispatch courier. Riders can also auto-create this upon their first login into the Rider Portal.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Rider Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ivan Kato or Ronald Mukasa"
                value={newRiderForm.name}
                onChange={(e) => setNewRiderForm({ ...newRiderForm, name: e.target.value })}
                className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+256 700 000000"
                  value={newRiderForm.phone}
                  onChange={(e) => setNewRiderForm({ ...newRiderForm, phone: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-xs text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Account Email
                </label>
                <input
                  type="email"
                  placeholder="rider@uk2ug.com"
                  value={newRiderForm.email}
                  onChange={(e) => setNewRiderForm({ ...newRiderForm, email: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-xs text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Vehicle / Transport
                </label>
                <select
                  value={newRiderForm.vehicleType}
                  onChange={(e) => setNewRiderForm({ ...newRiderForm, vehicleType: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
                >
                  <option value="Motorcycle (Boda Boda)">Motorcycle (Boda Boda)</option>
                  <option value="Delivery Van">Delivery Van</option>
                  <option value="Bicycle">Bicycle</option>
                  <option value="Car / Saloon">Car / Saloon</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Vehicle Plate / Reg No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. UEE 394B"
                  value={newRiderForm.plateNumber}
                  onChange={(e) => setNewRiderForm({ ...newRiderForm, plateNumber: e.target.value.toUpperCase() })}
                  className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-xs text-gray-900 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowAddRiderModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#ea580c] hover:bg-orange-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
              >
                Save Rider Profile
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
