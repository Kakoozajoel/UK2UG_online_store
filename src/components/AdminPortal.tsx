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
  Check
} from 'lucide-react';
import { Product, Category, District, Order, ImportRequest, Review, Customer, ChatMessage, StorefrontBanner, DEFAULT_STOREFRONT_BANNER, Complaint, PreOrderStatus, ComplaintStatus } from '../types';
import { InitialsBadge, StarRating, FormatCurrency, Modal } from './CommonUI';
import { AdminPreOrders } from './AdminPreOrders';
import { AdminComplaints } from './AdminComplaints';

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
  updateImportStatus: (reqId: string, status: ImportRequest['status'], quotePrice?: number) => void;
  updateCustomerStatus: (id: string, status: 'Active' | 'Suspended') => void;
  deleteCustomer: (id: string) => void;
  sendMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  markMessagesAsReadByAdmin?: (userEmail: string) => void;
  banner?: StorefrontBanner;
  updateBanner?: (banner: StorefrontBanner) => void;
  addComplaint?: (complaintData: any) => void;
  updateComplaintStatus?: (id: string, status: ComplaintStatus, adminResponse?: string) => void;
  deleteComplaint?: (id: string) => void;
  updatePreOrderStatus?: (productId: string, status: PreOrderStatus) => void;
  toggleProductPreOrder?: (productId: string, isPreOrder: boolean, details?: any) => void;
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
  updateImportStatus,
  updateCustomerStatus,
  deleteCustomer,
  sendMessage,
  markMessagesAsReadByAdmin,
  banner,
  updateBanner,
  addComplaint,
  updateComplaintStatus,
  deleteComplaint,
  updatePreOrderStatus,
  toggleProductPreOrder,
}) => {

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

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
    preOrderDepositPercent: 30,
    preOrderTotalSlots: 20,
    preOrderClaimedSlots: 0,
    preOrderBatchNote: 'Direct Air Cargo from London Heathrows',
    sourcingSpecs: [
      { key: 'Sourced From', value: '' },
      { key: 'Specifications', value: '' },
      { key: 'Warranty', value: '' },
      { key: 'Network / Power', value: '' }
    ]
  });

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
    const quantity = productForm.customerStatus === 'out_of_stock' ? 0 : Number(productForm.quantity);

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
      preOrderDepositPercent: isPreOrder ? Number(productForm.preOrderDepositPercent) : undefined,
      preOrderTotalSlots: isPreOrder ? Number(productForm.preOrderTotalSlots) : undefined,
      preOrderClaimedSlots: isPreOrder ? Number(productForm.preOrderClaimedSlots) : undefined,
      preOrderBatchNote: isPreOrder ? productForm.preOrderBatchNote : undefined,
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
      preOrderDepositPercent: 30,
      preOrderTotalSlots: 20,
      preOrderClaimedSlots: 0,
      preOrderBatchNote: 'Direct Air Cargo from London Heathrows',
      sourcingSpecs: [
        { key: 'Sourced From', value: '' },
        { key: 'Specifications', value: '' },
        { key: 'Warranty', value: '' },
        { key: 'Network / Power', value: '' }
      ]
    });
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
      preOrderDepositPercent: prod.preOrderDepositPercent || 30,
      preOrderTotalSlots: prod.preOrderTotalSlots || 20,
      preOrderClaimedSlots: prod.preOrderClaimedSlots || 0,
      preOrderBatchNote: prod.preOrderBatchNote || 'Direct Air Cargo from London Heathrows',
      sourcingSpecs: mergedSpecs,
    });
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

    const palette = ['bg-teal-700', 'bg-teal-600', 'bg-teal-500', 'bg-teal-400', 'bg-teal-300', 'bg-teal-200'];

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
          <div className="bg-[#008080] text-white p-2 rounded-lg">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white">UK2UG Admin</span>
            <p className="text-[9px] uppercase tracking-wider text-teal-400 font-semibold -mt-1">Workspace Control</p>
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {[
            { id: 'dashboard', label: 'Dashboard Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: 'banner', label: 'Storefront Banner', icon: <ImageIcon className="w-4 h-4" /> },
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
                  ? 'bg-[#008080] text-white'
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
                      : 'bg-teal-900 text-teal-300'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Admin footer profile */}
        <div className="p-4 border-t border-gray-800 flex items-center gap-3 bg-gray-950 shrink-0 text-left">
          <div className="w-9 h-9 rounded-full bg-teal-800 text-white flex items-center justify-center font-bold text-xs">
            SM
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">Store Manager</p>
            <p className="text-[10px] text-gray-500 font-mono truncate">Role: Administrator</p>
          </div>
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
          </div>
        </header>

        {/* Content pane depending on active tab */}
        <div className="flex-1 p-8 overflow-y-auto">
          {/* TAB A: DASHBOARD ANALYTICS OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 text-left">
              {/* Metrics cards - 6 Operational Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {[
                  { label: 'Cumulative Sourced Revenue', val: `UGX ${new Intl.NumberFormat('en-UG').format(totalCompletedEarnings)}`, detail: 'Delivery & Pickup Turnover', trend: `${orders.length} orders` },
                  { label: 'Active Pipeline Orders', val: activeOrdersCount, detail: 'Requiring local dispatch', trend: 'Processing stage' },
                  { label: 'Pre-Order Runway', val: preOrdersCount, detail: 'London procurement flights', trend: `${products.filter(p => p.isPreOrder && p.preOrderStatus === 'Taking Pre-Orders').length} open bookings`, badgeColor: 'bg-amber-100 text-amber-900 border-amber-200' },
                  { label: 'Customer Complaints Desk', val: openComplaintsCount, detail: 'Customer tickets requiring resolution', trend: openComplaintsCount > 0 ? `${openComplaintsCount} action required` : 'All resolved', badgeColor: openComplaintsCount > 0 ? 'bg-red-100 text-red-900 border-red-200' : 'bg-emerald-100 text-emerald-900 border-emerald-200' },
                  { label: 'Custom Sourcing Requests', val: imports.length, detail: 'Direct requests under negotiation', trend: `${imports.filter(i => i.status === 'Pending').length} pending quote` },
                  { label: 'Out of Stock Replenishment', val: outOfStockCount, detail: 'Products needing active sourcing', trend: outOfStockCount > 0 ? `${outOfStockCount} out of stock` : 'In stock' },
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white border border-gray-100 p-5 rounded-xl shadow-sm space-y-2 flex flex-col justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider truncate">{stat.label}</p>
                      <p className="text-base sm:text-lg font-extrabold text-[#000000] truncate">{stat.val}</p>
                    </div>
                    <div className="pt-2 border-t border-gray-50 text-[10px] flex items-center justify-between">
                      <span className="text-gray-500 font-medium truncate">{stat.detail}</span>
                      <span className="text-[#008080] font-bold shrink-0">{stat.trend}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comprehensive Admin Panel Directory & Tab Access Guide */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-[#008080] text-white text-[10px] font-black uppercase tracking-wider rounded-md">
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
                      icon: <LayoutDashboard className="w-4 h-4 text-[#008080]" />,
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
                      desc: 'Live dispatch board: update order fulfillment, verify customer 4-digit handover PINs, and track payments.',
                      icon: <ClipboardList className="w-4 h-4 text-teal-600" />,
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
                          : 'bg-gray-50/50 border-gray-150 hover:border-teal-300 hover:bg-white'
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
                        <span className="font-bold text-[#008080] flex items-center gap-0.5">
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
                    <div className="p-2 bg-teal-50 rounded-lg text-[#008080]">
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
                              fill={m.revenue > 0 ? '#008080' : '#E9ECEF'}
                              rx="4"
                              className={m.revenue > 0 ? 'hover:fill-teal-600 transition-colors' : 'hover:fill-gray-300 transition-colors'}
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
                              fill={m.revenue > 0 ? '#008080' : '#ADB5BD'}
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
                    <span className="px-2.5 py-1 bg-teal-50 text-[#008080] font-bold text-[10px] rounded-md uppercase tracking-wider">
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
                    className="px-5 py-2 bg-[#008080] hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
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
                    <Eye className="w-4 h-4 text-[#008080]" /> Live Storefront Preview (Exact Customer Appearance)
                  </span>
                  <span className="text-[11px] text-gray-400">Updates in real time as you edit</span>
                </div>

                <div className="bg-[#000000] rounded-2xl overflow-hidden relative min-h-[380px] flex flex-col md:flex-row items-center p-6 sm:p-8 md:p-10 shadow-xl border border-gray-800 text-left">
                  {/* Overlay elements */}
                  <div className="absolute top-0 right-0 w-80 h-80 bg-[#008080]/15 rounded-full filter blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                  <div className="flex-1 text-left space-y-5 z-10">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#008080]/25 text-[#008080] text-[11px] font-semibold tracking-wider uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#008080] animate-ping" />
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
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full text-[11px] text-teal-200 font-medium"
                          >
                            <CheckCircle2 className="w-3 h-3 text-[#008080]" />
                            {feat}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 pt-2">
                      <span className="px-5 py-2.5 bg-[#008080] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-md">
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
                      <div className="absolute inset-0 bg-teal-500 rounded-2xl filter blur-xl opacity-15"></div>
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
                          bannerForm.isActive !== false ? 'bg-[#008080]' : 'bg-gray-300'
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
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/10 focus:border-[#008080]"
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
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/10 focus:border-[#008080]"
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
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:bg-white focus:border-[#008080]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700">Secondary CTA Button</label>
                        <input
                          type="text"
                          value={bannerForm.ctaSecondaryText || ''}
                          onChange={(e) => setBannerForm({ ...bannerForm, ctaSecondaryText: e.target.value })}
                          placeholder="e.g. Product Request"
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:bg-white focus:border-[#008080]"
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
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:bg-white focus:border-[#008080]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Badge Description Text</label>
                      <input
                        type="text"
                        value={bannerForm.badgeText || ''}
                        onChange={(e) => setBannerForm({ ...bannerForm, badgeText: e.target.value })}
                        placeholder="e.g. 100% Authentic UK Sourced, With Till Slips"
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:bg-white focus:border-[#008080]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Image Alt Description</label>
                      <input
                        type="text"
                        value={bannerForm.altText || ''}
                        onChange={(e) => setBannerForm({ ...bannerForm, altText: e.target.value })}
                        placeholder="e.g. Apple iPhone 16 Pro Max Sourced"
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:bg-white focus:border-[#008080]"
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
                    <span className="text-xs text-teal-700 font-bold bg-teal-50 px-2.5 py-1 rounded-md border border-teal-150 w-fit">
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
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-teal-200 text-teal-900 text-xs font-semibold rounded-full shadow-2xs group"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#008080]" />
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
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-xs outline-none focus:bg-white focus:border-[#008080]"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#008080] hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
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
                                  : 'bg-teal-50/60 hover:bg-teal-100 text-teal-800 border-teal-200'
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
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:bg-white focus:border-[#008080]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700">Or Upload Image File</label>
                        <label className="border-2 border-dashed border-gray-200 hover:border-[#008080] rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-gray-50/50 hover:bg-teal-50/30">
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
                                ? 'bg-teal-50/80 border-[#008080] shadow-xs'
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
                                  <span className="text-[10px] font-bold text-[#008080] bg-white px-1.5 py-0.5 rounded border border-teal-200">Active</span>
                                )}
                              </div>
                              <p className="text-[10px] text-gray-500 truncate mt-0.5">{preset.headline}</p>
                              <span className="text-[9px] text-[#008080] font-semibold block mt-0.5">
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
                  className="px-6 py-2.5 bg-[#008080] hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
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
                    placeholder="Search products by title, product number (SKU), or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-xs outline-none focus:ring-1 focus:ring-teal-500 focus:border-[#008080]"
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>

                <button
                  onClick={() => {
                    setEditingProduct(null);
                    resetProductForm();
                    setShowProductModal(true);
                  }}
                  className="px-4 py-2 bg-[#008080] text-white hover:bg-teal-700 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add Product
                </button>
              </div>

              {/* Products Table list */}
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Product Details & SKU</th>
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
                          (p.sku && p.sku.toLowerCase().includes(q)) ||
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
                                    <span className="text-[10px] font-mono font-bold bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded border border-teal-200">
                                      {prod.sku || prod.id}
                                    </span>
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
                                    } else {
                                      // One of the pre-order stages
                                      updateProduct({
                                        ...prod,
                                        isPreOrder: true,
                                        preOrderStatus: val as PreOrderStatus,
                                        preOrderEstimatedArrival: prod.preOrderEstimatedArrival || '10-14 Business Days',
                                        preOrderDepositPercent: prod.preOrderDepositPercent || 30,
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
                                  className="p-1.5 text-gray-400 hover:text-teal-700 hover:bg-teal-50 rounded transition-colors"
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
                    className="px-4 py-2 bg-[#008080] text-white hover:bg-teal-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
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
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:border-[#008080] focus:outline-none"
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
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:border-[#008080] focus:outline-none font-mono"
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
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:border-[#008080] focus:outline-none font-mono font-bold text-teal-800"
                      />
                    </div>

                    {/* Deal Expiration Date */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-500">Deal Expiration Date *</label>
                        <span className="text-[10px] text-[#008080] font-semibold">Future only</span>
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
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:border-[#008080] focus:outline-none"
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
                      className="py-2.5 px-6 bg-[#008080] hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap self-end sm:self-auto"
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
                              ? 'bg-[#008080] text-white shadow-xs'
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
                                      <span className="text-[10px] font-mono text-gray-400">
                                        {prod.sku || prod.id}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 font-mono">
                                  <div className="font-bold text-teal-800">
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
                    className="w-full py-2 bg-[#008080] hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
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
          {activeTab === 'orders' && (
            <div className="space-y-6 text-left">
              <div className="relative max-w-sm">
                <input
                  type="text"
                  placeholder="Search order tracking ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-xs outline-none focus:ring-1 focus:ring-teal-500 focus:border-[#008080]"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>

              {/* Orders table list */}
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Tracking Code</th>
                      <th className="px-6 py-4">Recipient</th>
                      <th className="px-6 py-4">Fulfillment Channel</th>
                      <th className="px-6 py-4">Invoice Sum</th>
                      <th className="px-6 py-4">Status Flow</th>
                      <th className="px-6 py-4 text-center">Action Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {orders
                      .filter((o) => o.id.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((ord) => (
                        <tr key={ord.id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4 font-mono font-bold text-gray-900">
                            <div>{ord.id}</div>
                            {ord.deliveryPath === 'delivery' && (
                              <div className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded inline-block mt-0.5 border border-amber-200" title="Handover Verification PIN">
                                PIN: {ord.deliveryPin || ord.id.replace(/\D/g, '').slice(-4)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-800">{ord.customerName}</div>
                            <div className="text-[10px] text-gray-400 font-mono">{ord.customerPhone}</div>
                          </td>
                          <td className="px-6 py-4">
                            {ord.deliveryPath === 'pickup' ? (
                              <span className="inline-flex items-center gap-1 font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                                <MapPin className="w-3.5 h-3.5 text-[#008080]" /> Store Pickup
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                                <Truck className="w-3.5 h-3.5 text-[#008080]" /> Delivery ({ord.deliveryDetails?.district})
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-gray-950">
                            <div>UGX {new Intl.NumberFormat('en-UG').format(ord.totalAmount)}</div>
                            <div className="text-[10px] font-sans font-medium mt-0.5">
                              {ord.paymentMethod === 'COD' ? (
                                <span className="inline-block text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold border border-emerald-200">
                                  Pay on Delivery
                                </span>
                              ) : (
                                <span className="text-gray-400">Prepaid: {ord.paymentMethod}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                ['Delivered', 'Picked Up'].includes(ord.status)
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : ['Ready for Pickup', 'Out for Delivery'].includes(ord.status)
                                  ? 'bg-teal-55/60 text-teal-900'
                                  : 'bg-yellow-50 text-yellow-800'
                              }`}
                            >
                              {ord.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
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
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
                <div className="bg-white border border-teal-100 rounded-xl p-4 shadow-sm bg-teal-50/20">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#008080]">Quotes Sent</div>
                  <div className="text-xl font-extrabold text-[#008080] mt-1">
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

              {/* Search filter for requests */}
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Search requests by product name, product number (SKU), or customer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-xs outline-none focus:ring-1 focus:ring-teal-500 focus:border-[#008080]"
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
                        <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                          {searchQuery ? `No requests found matching "${searchQuery}".` : 'No product requests submitted yet.'}
                        </td>
                      </tr>
                    ) : (
                      imports
                        .filter((req) => {
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
                            {req.createdAt && (
                              <div className="text-[10px] text-gray-400 mt-0.5">
                                {new Date(req.createdAt).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900">{req.customerName || 'Anonymous'}</div>
                            <div className="text-[10px] font-mono text-gray-500 mt-0.5">{req.customerPhone || '—'}</div>
                          </td>
                          <td 
                            className="px-6 py-4 cursor-pointer group hover:bg-teal-50/50 transition-colors"
                            onClick={() => {
                              setInspectRequest(req);
                              setInspectActiveImageIdx(0);
                              setInspectQuoteInput(req.quotePrice || '');
                            }}
                            title="Click on sourced item parameter to inspect product images and specs"
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center group-hover:border-[#008080] transition-colors shadow-xs">
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
                                  <span className="absolute bottom-0 right-0 bg-[#008080] text-white text-[9px] font-bold px-1 rounded-tl shadow-xs">
                                    2+
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-gray-900 group-hover:text-[#008080] flex items-center gap-1.5 transition-colors">
                                  <span>{req.productName}</span>
                                  <Eye className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#008080] transition-colors" />
                                </div>
                                <div className="text-[11px] text-gray-500 line-clamp-1 max-w-sm">{req.description}</div>
                                <div className="text-[10px] text-[#008080] font-semibold mt-0.5 opacity-80 group-hover:opacity-100 transition-opacity flex items-center gap-1">
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
                                <div className="font-mono font-bold text-[#008080] text-sm">
                                  UGX {req.quotePrice.toLocaleString()}
                                </div>
                                <span className="inline-block text-[9px] font-semibold text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-100 mt-0.5">
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
                                  ? 'bg-teal-50 text-teal-800 border border-teal-100'
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
                                  className="bg-white border border-gray-200 rounded p-1 w-28 text-xs font-mono font-semibold outline-none focus:border-[#008080]"
                                  onChange={(e) => setCustomQuotePrice(Number(e.target.value))}
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleQuoteSubmit(req.id)}
                                  className="px-2.5 py-1 bg-[#008080] text-white rounded text-[10px] font-bold hover:bg-[#006666] transition-colors cursor-pointer"
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
                                    className="px-2.5 py-1 bg-teal-50 text-[#008080] hover:bg-teal-100 rounded text-[11px] font-bold transition-colors cursor-pointer"
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
                                  <option value="Completed">Completed</option>
                                </select>
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
              {/* Account controls table */}
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Customer Name</th>
                      <th className="px-6 py-4">Email Address</th>
                      <th className="px-6 py-4">Telephone</th>
                      <th className="px-6 py-4">Join Timeline</th>
                      <th className="px-6 py-4">Security Level</th>
                      <th className="px-6 py-4 text-center">Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {customers.map((cust) => (
                      <tr key={cust.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <InitialsBadge name={cust.name} size="sm" />
                            <span className="font-bold text-gray-800">{cust.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 font-semibold">{cust.email}</td>
                        <td className="px-6 py-4 font-mono font-medium text-gray-500">{cust.phone}</td>
                        <td className="px-6 py-4 text-gray-500 font-semibold">{cust.joinDate}</td>
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
                    ))}
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
                    <MessageSquare className="w-5 h-5 text-[#008080]" />
                    Customer Direct Messaging Desk
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Two-way communication channel between UK2UG store management and shoppers
                  </p>
                </div>
                <div className="bg-teal-50 text-[#008080] border border-teal-100 px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#008080] animate-pulse"></span>
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
                                ? 'bg-teal-50/80 border-l-4 border-[#008080]'
                                : 'hover:bg-gray-100/60 bg-white'
                            }`}
                          >
                            <InitialsBadge name={custName} size="md" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <p className="text-xs font-bold text-gray-900 truncate">{custName}</p>
                                {unreadCount > 0 && (
                                  <span className="bg-[#008080] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    {unreadCount}
                                  </span>
                                )}
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
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                      Active Customer
                    </span>
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
                            <div
                              className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                                isAdmin
                                  ? 'bg-[#008080] text-white rounded-tr-none'
                                  : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                              }`}
                            >
                              {msg.text}
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
                        className="flex-1 px-4 py-2.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#008080] focus:ring-1 focus:ring-[#008080]"
                      />
                      <button
                        type="submit"
                        disabled={!adminReplyInput.trim()}
                        className="px-5 py-2.5 bg-[#008080] text-white text-xs font-semibold rounded-lg hover:bg-[#006666] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shadow-sm"
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
                  placeholder="e.g. Apple, Mary Kay, Avon"
                  value={productForm.brand}
                  onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-xs outline-none focus:bg-white font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-700 uppercase">Product Number / SKU</label>
                <input
                  type="text"
                  placeholder="e.g. UK-TECH-009"
                  value={productForm.sku}
                  onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-xs outline-none focus:bg-white font-mono"
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
            <div className="p-4 bg-teal-50/50 border border-teal-100 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Customer Display Status & Availability</h4>
                  <p className="text-[10px] text-gray-500">
                    Control exactly how this product appears to customers on the storefront.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-teal-800 bg-white px-2 py-0.5 rounded border border-teal-200">
                  Live Customer Visibility
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label
                  className={`p-3 border rounded-lg cursor-pointer flex flex-col gap-1 transition-all ${
                    productForm.customerStatus === 'in_stock'
                      ? 'bg-white border-[#008080] ring-1 ring-[#008080] shadow-xs'
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
                      className="text-[#008080]"
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
                <div className="pt-3 border-t border-teal-100/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-purple-950 uppercase">Pre-Order Stage *</label>
                    <select
                      value={productForm.preOrderStatus}
                      onChange={(e) => setProductForm({ ...productForm, preOrderStatus: e.target.value as PreOrderStatus })}
                      className="w-full bg-white border border-purple-200 rounded p-1.5 text-xs text-purple-900 font-bold outline-none"
                    >
                      <option value="Taking Pre-Orders">📦 Taking Pre-Orders</option>
                      <option value="Procuring from UK Store">🛒 Procuring from UK Store</option>
                      <option value="Air Cargo in Transit">✈️ Air Cargo in Transit</option>
                      <option value="Customs & Kampala Processing">🏢 Customs & Kampala Processing</option>
                      <option value="Ready for Delivery">🎉 Ready for Delivery</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-purple-950 uppercase">Estimated Arrival *</label>
                    <input
                      type="text"
                      placeholder="e.g. 10-14 Business Days"
                      value={productForm.preOrderEstimatedArrival}
                      onChange={(e) => setProductForm({ ...productForm, preOrderEstimatedArrival: e.target.value })}
                      className="w-full bg-white border border-purple-200 rounded p-1.5 text-xs outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-purple-950 uppercase">Deposit Required (%)</label>
                    <input
                      type="number"
                      min={10}
                      max={100}
                      value={productForm.preOrderDepositPercent}
                      onChange={(e) => setProductForm({ ...productForm, preOrderDepositPercent: Number(e.target.value) })}
                      className="w-full bg-white border border-purple-200 rounded p-1.5 text-xs outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-purple-950 uppercase">Total Slots</label>
                    <input
                      type="number"
                      min={1}
                      value={productForm.preOrderTotalSlots}
                      onChange={(e) => setProductForm({ ...productForm, preOrderTotalSlots: Number(e.target.value) })}
                      className="w-full bg-white border border-purple-200 rounded p-1.5 text-xs outline-none font-mono"
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
                    className="text-[10px] font-bold text-[#008080] hover:underline flex items-center gap-1"
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

            {/* Technical custom verification specs inputs */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-gray-700 uppercase">Sourcing Verification Specifications</label>
                <span className="text-[10px] text-gray-400 font-medium">(Optional - leave blank if not applicable)</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {productForm.sourcingSpecs.map((spec, idx) => (
                  <div key={idx} className="flex gap-1.5 items-center">
                    <span className="font-semibold text-gray-500 shrink-0 w-28 truncate" title={spec.key}>{spec.key}:</span>
                    <input
                      type="text"
                      placeholder={spec.key.toLowerCase().includes('network') ? 'Optional (e.g. 220V / 5G)' : 'Optional detail...'}
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
                className="flex-1 py-2 bg-[#008080] hover:bg-teal-700 text-white text-xs font-bold rounded shadow"
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
                <span className="font-mono font-bold text-teal-800">
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
                      ? 'bg-teal-50 text-teal-800 border border-teal-100'
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
                    <ImageIcon className="w-4 h-4 text-[#008080]" />
                    Product Images ({inspectImages.length} {inspectImages.length === 1 ? 'Photo' : 'Photos'})
                  </span>
                  {inspectImages[inspectActiveImageIdx] && (
                    <a
                      href={inspectImages[inspectActiveImageIdx]}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#008080] hover:underline"
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
                            ? 'border-[#008080] ring-2 ring-[#008080]/30'
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
                          className="inline-flex items-center gap-1.5 text-xs text-[#008080] font-semibold hover:underline break-all"
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
                      <p className="font-mono font-bold text-[#008080] mt-0.5 text-sm">
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
                <div className="bg-teal-50/60 border border-teal-100 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-[#008080]" />
                      Formulate / Update Sourcing Quote
                    </span>
                    <span className="text-[10px] font-semibold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full">
                      in UGX
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="e.g. 350000"
                      value={inspectQuoteInput}
                      onChange={(e) => setInspectQuoteInput(e.target.value ? Number(e.target.value) : '')}
                      className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs sm:text-sm font-mono font-bold outline-none focus:border-[#008080]"
                    />
                    <button
                      type="button"
                      onClick={handleInspectQuoteSubmit}
                      className="px-4 py-2 bg-[#008080] hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm"
                    >
                      {currentInspectReq.quotePrice ? 'Update Quote' : 'Send Quote'}
                    </button>
                  </div>

                  {/* Status switcher */}
                  <div className="flex items-center justify-between pt-2 border-t border-teal-100 text-xs">
                    <span className="text-gray-500 font-medium">Pipeline Status:</span>
                    <select
                      value={currentInspectReq.status}
                      onChange={(e) => updateImportStatus(currentInspectReq.id, e.target.value as any)}
                      className="bg-white border border-gray-200 font-semibold rounded-lg px-2.5 py-1 text-xs outline-none"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Quoted">Quoted</option>
                      <option value="Ordered">Ordered</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
