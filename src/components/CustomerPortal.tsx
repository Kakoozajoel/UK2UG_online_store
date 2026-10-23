import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  ShoppingBag,
  Heart,
  ChevronRight,
  Info,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  Filter,
  MapPin,
  Truck,
  ArrowRight,
  X,
  Plus,
  Minus,
  Star,
  Check,
  Send,
  UploadCloud,
  CreditCard,
  Eye,
  EyeOff,
  MessageSquare,
  User,
  LogOut,
  MessageCircle,
  CheckCheck,
  Bell,
  Mail,
  LogIn,
  ClipboardList,
  ExternalLink,
  Maximize2,
  Image as ImageIcon,
  Banknote,
  ShieldCheck,
  Zap,
  Shirt,
  Footprints,
  Sliders,
  Sparkles,
  Box,
  Copy,
  FileText,
  Printer,
  Download,
  Store,
  Smartphone,
  Trash2,
  HelpCircle,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import { Product, Category, District, Order, ImportRequest, Review, Customer, CartItem, ChatMessage, StorefrontBanner, DEFAULT_STOREFRONT_BANNER, Complaint, PreOrderStatus, ComplaintCategory, ComplaintPriority, ComplaintStatus, ProductVariation, ADMIN_UID, CustomerNotification, UserRole, AdminNotice } from '../types';
import { determineRole, isAdminUser, isRiderUser } from '../lib/rbac';
import { InitialsBadge, StarRating, FormatCurrency, Modal } from './CommonUI';
import { ProductVariationModal } from './ProductVariationModal';
import { isPreOrderActive } from '../lib/preOrderStatusManager';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { sendCustomerVerificationEmail } from '../lib/emailService';

interface CustomerPortalProps {
  products: Product[];
  categories: Category[];
  districts: District[];
  orders: Order[];
  imports: ImportRequest[];
  reviews: Review[];
  customers: Customer[];
  messages: ChatMessage[];
  cart: CartItem[];
  wishlist: string[];
  currentUser: { name: string; email: string; phone?: string; role: 'customer' | 'admin' | 'driver'; uid?: string } | null;
  setCurrentUser: (user: any) => void;
  addToCart: (product: Product, quantity?: number, selectedSize?: string, variation?: ProductVariation) => void;
  updateCartQty: (productId: string, quantity: number, variationId?: string, selectedSize?: string) => void;
  removeFromCart: (productId: string, variationId?: string, selectedSize?: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  placeOrder: (order: any) => string;
  deleteOrder?: (orderId: string) => void;
  submitImportRequest: (req: any) => string;
  deleteImportRequest?: (reqId: string) => void;
  addReview: (review: any) => void;
  registerCustomer: (name: string, email: string, phone: string) => boolean;
  sendMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  markMessagesAsReadByCustomer?: (userEmail: string) => void;
  banner?: StorefrontBanner;
  complaints?: Complaint[];
  addComplaint?: (complaintData: any) => Complaint;
  notifications?: CustomerNotification[];
  markNotificationAsRead?: (notifId: string) => void;
  markAllNotificationsAsRead?: (customerEmail?: string) => void;
  clearAllNotifications?: (customerEmail?: string) => void;
  deleteNotification?: (notifId: string) => void;
  updateOrderPaymentDetails?: (orderId: string, details: { paymentTransactionRef?: string; transactionId?: string; paymentPhone?: string; paymentMethod?: string }) => void;
  onNavigateToAdmin?: () => void;
  onNavigateToRider?: () => void;
  openAuthModal?: boolean;
  initialAuthEmail?: string;
  onAuthModalClosed?: () => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  products,
  categories,
  districts,
  orders,
  imports,
  reviews,
  customers,
  messages,
  cart,
  wishlist,
  currentUser,
  setCurrentUser,
  addToCart,
  updateCartQty,
  removeFromCart,
  clearCart,
  toggleWishlist,
  placeOrder,
  deleteOrder,
  submitImportRequest,
  deleteImportRequest,
  addReview,
  registerCustomer,
  sendMessage,
  markMessagesAsReadByCustomer,
  banner = DEFAULT_STOREFRONT_BANNER,
  complaints = [],
  addComplaint,
  notifications = [],
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications,
  deleteNotification,
  updateOrderPaymentDetails,
  onNavigateToAdmin,
  onNavigateToRider,
  openAuthModal,
  initialAuthEmail,
  onAuthModalClosed,
}) => {
  // Navigation & Search States
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'home' | 'shop' | 'tracking' | 'imports' | 'wishlist' | 'cart'>('home');
  const [onlyPreOrders, setOnlyPreOrders] = useState<boolean>(false);
  const [showComplaintsModal, setShowComplaintsModal] = useState<boolean>(false);
  const [skuSearchQuery, setSkuSearchQuery] = useState<string>('');

  // Footer active help modal states
  const [activeHelpModal, setActiveHelpModal] = useState<'whatsapp' | 'helpcenter' | 'contact' | 'shipping' | 'pickup' | 'report' | null>(null);
  const [waMessage, setWaMessage] = useState<string>('Hello UK2UG, I have a sourcing question!');
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: 'Inquiry', message: '', customSubject: '' });
  const [contactSuccess, setContactSuccess] = useState(false);
  const [selectedDistrictFee, setSelectedDistrictFee] = useState<string>('Kampala');
  const [reportForm, setReportForm] = useState({ orderId: '', issueType: 'wrong_item', description: '', contactPhone: '' });
  const [mismatchFiles, setMismatchFiles] = useState<{ name: string; url: string }[]>([]);
  const [isDraggingMismatch, setIsDraggingMismatch] = useState<boolean>(false);
  const mismatchFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleProcessMismatchFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles: { name: string; url: string }[] = [];
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        newFiles.push({ name: file.name, url });
      }
    });
    setMismatchFiles((prev) => [...prev, ...newFiles]);
  };
  const [reportSuccessCode, setReportSuccessCode] = useState<string>('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Interactive Product Modal State
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [selectedProductSize, setSelectedProductSize] = useState<string>('');
  const [activeImgIdx, setActiveImgIdx] = useState<number>(0);
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({});
  const [notifyEmail, setNotifyEmail] = useState<string>('');
  const [notifySuccess, setNotifySuccess] = useState<boolean>(false);

  // Review states inside modal
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewSuccess, setReviewSuccess] = useState<boolean>(false);

  // Product Request Wizard States
  const [importStep, setImportStep] = useState<number>(1);
  const [importForm, setImportForm] = useState({
    productName: '',
    productLink: '',
    imageUrl: '',
    imageUrl2: '',
    description: '',
    quantity: 1,
    notes: '',
  });
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importFile2, setImportFile2] = useState<File | null>(null);
  const [importSuccessCode, setImportSuccessCode] = useState<string>('');

  // Cart & Checkout States
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);
  const [checkoutPath, setCheckoutPath] = useState<'pickup' | 'delivery'>('pickup');
  const [checkoutForm, setCheckoutForm] = useState({
    fullName: currentUser?.name ?? '',
    phone: currentUser?.phone ?? '',
    email: currentUser?.email ?? '',
    district: 'Kampala',
    area: '',
    landmark: '',
    notes: '',
    paymentMethod: 'Shop' as 'Shop' | 'Mobile Money' | 'COD',
    paymentPhone: currentUser?.phone ?? '',
    paymentTransactionRef: '',
    cardNumber: '',
    cardHolder: '',
    cardExpiry: '',
    cardCvv: '',
  });
  const [momoNetwork, setMomoNetwork] = useState<'MTN' | 'Airtel'>('MTN');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutSuccessCode, setCheckoutSuccessCode] = useState<string>('');
  const [placedOrderDetails, setPlacedOrderDetails] = useState<Order | null>(null);
  const [variationModalProduct, setVariationModalProduct] = useState<Product | null>(null);
  const [copiedMomoNumber, setCopiedMomoNumber] = useState<boolean>(false);

  // Search & Filter State
  const [priceRange, setPriceRange] = useState<number>(6000000);
  const [sortBy, setSortBy] = useState<'newest' | 'priceAsc' | 'priceDesc'>('newest');

  // Tracking State (Orders & Product Requests & Flagged Issues)
  const [trackingMode, setTrackingMode] = useState<'orders' | 'requests' | 'flagged'>('orders');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [trackError, setTrackError] = useState<string>('');
  const [copiedTrackId, setCopiedTrackId] = useState<string | null>(null);

  // Flagged Issues, Alerts & Customer Deletion Privilege States
  const [showFlaggedIssuesModal, setShowFlaggedIssuesModal] = useState<boolean>(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [requestToDelete, setRequestToDelete] = useState<ImportRequest | null>(null);
  const [fixPaymentOrder, setFixPaymentOrder] = useState<Order | null>(null);
  const [fixPaymentMethod, setFixPaymentMethod] = useState<string>('MTN Mobile Money');
  const [fixPaymentPhone, setFixPaymentPhone] = useState<string>('');
  const [fixPaymentRef, setFixPaymentRef] = useState<string>('');
  const [fixPaymentSuccessMsg, setFixPaymentSuccessMsg] = useState<string>('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState<boolean>(false);
  const [customerActionToast, setCustomerActionToast] = useState<string>('');

  // Order & Request Deletion Privilege Helpers (10 days after execution)
  const isOrderDone = (ord: Order) => ['Delivered', 'Picked Up', 'Cancelled', 'Failed'].includes(ord.status);

  const getOrderExecutionDays = (ord: Order) => {
    const execDateStr = ord.handoverConfirmedAt || (['Delivered', 'Picked Up'].includes(ord.status) ? ord.date : null) || ord.date;
    const execTime = new Date(execDateStr).getTime();
    if (isNaN(execTime)) return 0;
    return Math.floor((Date.now() - execTime) / (1000 * 60 * 60 * 24));
  };

  const isRequestDone = (req: ImportRequest) => req.status === 'Completed';

  const getRequestExecutionDays = (req: ImportRequest) => {
    const execDateStr = req.completedAt || req.updatedAt || req.date;
    const execTime = new Date(execDateStr).getTime();
    if (isNaN(execTime)) return 0;
    return Math.floor((Date.now() - execTime) / (1000 * 60 * 60 * 24));
  };

  // Product Request Tracking State
  const [requestTrackingRef, setRequestTrackingRef] = useState<string>('');
  const [trackedRequest, setTrackedRequest] = useState<ImportRequest | null>(null);
  const [trackedProduct, setTrackedProduct] = useState<Product | null>(null);
  const [requestTrackError, setRequestTrackError] = useState<string>('');
  const [customerLightboxImage, setCustomerLightboxImage] = useState<string | null>(null);

  // My Account and Direct Customer Support Messaging States
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);
  const [showMessagesModal, setShowMessagesModal] = useState<boolean>(false);
  const [chatInputText, setChatInputText] = useState<string>('');

  // Sync currentUser to checkoutForm when available and auto-resume order checkout if items in cart
  useEffect(() => {
    if (currentUser) {
      setCheckoutForm((prev) => ({
        ...prev,
        fullName: prev.fullName || currentUser.name || '',
        phone: prev.phone || currentUser.phone || '',
        email: prev.email || currentUser.email || '',
        paymentPhone: prev.paymentPhone || currentUser.phone || '',
      }));

      // Check if user initiated checkout as guest or has saved browser cart items to complete
      const pendingCheckout = sessionStorage.getItem('uk2ug_pending_checkout') === 'true';
      if (pendingCheckout) {
        sessionStorage.removeItem('uk2ug_pending_checkout');
        setIsCheckingOut(true);
        setActiveTab('cart');
      }
    }
  }, [currentUser]);

  // Mark customer messages as read when messages modal is opened or new messages arrive
  useEffect(() => {
    if (showMessagesModal && currentUser?.email && markMessagesAsReadByCustomer) {
      const hasUnread = messages.some((m) => m.userEmail === currentUser.email && m.sender === 'admin' && !m.readByCustomer);
      if (hasUnread) {
        markMessagesAsReadByCustomer(currentUser.email);
      }
    }
  }, [showMessagesModal, currentUser?.email, messages, markMessagesAsReadByCustomer]);

  // Recently Viewed Items Tracking State
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('uk2ug_recently_viewed') || '[]');
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    if (viewingProduct) {
      if (viewingProduct.sizes && viewingProduct.sizes.length > 0) {
        setSelectedProductSize(viewingProduct.sizes[0]);
      } else {
        setSelectedProductSize('');
      }
      setRecentlyViewedIds((prev) => {
        const filtered = prev.filter((id) => id !== viewingProduct.id);
        const updated = [viewingProduct.id, ...filtered].slice(0, 10);
        try {
          localStorage.setItem('uk2ug_recently_viewed', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    }
  }, [viewingProduct]);

  // Derived list of recently viewed products
  const recentlyViewedProducts = recentlyViewedIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => p !== undefined);

  // Display list for Recently Viewed section (fallback to top products if history is short)
  const displayRecentlyViewed = recentlyViewedProducts.length >= 2
    ? recentlyViewedProducts
    : Array.from(new Set([...recentlyViewedProducts, ...products])).slice(0, 4);

  // Authentication Dialogs
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const [resendVerificationNotice, setResendVerificationNotice] = useState<string>('');
  const [isResendingVerification, setIsResendingVerification] = useState<boolean>(false);
  const [isForgotPassword, setIsForgotPassword] = useState<boolean>(false);
  const [resetEmailSent, setResetEmailSent] = useState<string | null>(null);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState<boolean>(false);
  const [authForm, setAuthForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [authError, setAuthError] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Open auth modal when requested (e.g. after session timeout)
  useEffect(() => {
    if (openAuthModal) {
      setShowAuthModal(true);
      setIsSignUp(false);
      setIsForgotPassword(false);
      setResetEmailSent(null);
      if (initialAuthEmail) {
        setAuthForm((prev) => ({ ...prev, email: initialAuthEmail }));
      }
    }
  }, [openAuthModal, initialAuthEmail]);

  // Google Sign-In with Gmail Verification Link States
  const [showGmailVerificationModal, setShowGmailVerificationModal] = useState<boolean>(false);
  const [verificationPendingEmail, setVerificationPendingEmail] = useState<string>('');
  const [verificationPendingName, setVerificationPendingName] = useState<string>('');
  const [verificationPendingPhone, setVerificationPendingPhone] = useState<string>('');
  const [pendingVerificationUrl, setPendingVerificationUrl] = useState<string>('');
  const [verificationLinkCopied, setVerificationLinkCopied] = useState<boolean>(false);
  const [verificationResendCooldown, setVerificationResendCooldown] = useState<number>(0);
  const [isResendingVerificationLink, setIsResendingVerificationLink] = useState<boolean>(false);

  // Dedicated Personal Notifications Center Drawer / Modal
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState<boolean>(false);
  const [notifFilterTab, setNotifFilterTab] = useState<'all' | 'unread'>('all');

  // Storewide Admin Notices State
  const [selectedAdminNotice, setSelectedAdminNotice] = useState<AdminNotice | null>(null);
  const [dismissedNoticeIds, setDismissedNoticeIds] = useState<string[]>(() => {
    try {
      return JSON.parse(sessionStorage.getItem('uk2ug_dismissed_notices') || '[]');
    } catch {
      return [];
    }
  });

  const handleDismissNotice = (noticeId: string) => {
    const updated = [...dismissedNoticeIds, noticeId];
    setDismissedNoticeIds(updated);
    try {
      sessionStorage.setItem('uk2ug_dismissed_notices', JSON.stringify(updated));
    } catch {}
  };

  // Cooldown countdown for resend verification link
  useEffect(() => {
    if (verificationResendCooldown > 0) {
      const timer = setTimeout(() => setVerificationResendCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [verificationResendCooldown]);

  // Handle URL Query Parameter Gmail Verification Link (?verify_token=...&email=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verifyToken = params.get('verify_token');
    const verifyEmail = params.get('email');

    if (verifyToken && verifyEmail) {
      const processVerificationToken = async () => {
        try {
          let isValid = false;
          let customerName = 'Customer';
          let customerPhone = '0774 540199';

          // 1. Check in Firestore 'verifications' collection
          try {
            if (db) {
              const tokenSnap = await getDoc(doc(db, 'verifications', verifyToken));
              if (tokenSnap.exists()) {
                const data = tokenSnap.data();
                if ((data.email || '').trim().toLowerCase() === verifyEmail.trim().toLowerCase()) {
                  isValid = true;
                  customerName = data.name || customerName;
                  customerPhone = data.phone || customerPhone;
                  // Mark verified in Firestore
                  await setDoc(doc(db, 'verifications', verifyToken), { verified: true, verifiedAt: new Date().toISOString() }, { merge: true });
                }
              }
            }
          } catch (e) {
            console.warn('Firestore verification check note:', e);
          }

          // 2. Check in localStorage fallback
          if (!isValid) {
            try {
              const localPending = JSON.parse(localStorage.getItem('uk2ug_pending_verification') || '{}');
              if (localPending.token === verifyToken && (localPending.email || '').toLowerCase() === verifyEmail.toLowerCase()) {
                isValid = true;
                customerName = localPending.name || customerName;
                customerPhone = localPending.phone || customerPhone;
              }
            } catch (e) {}
          }

          if (isValid) {
            const cleanEmail = verifyEmail.trim().toLowerCase();
            const existingCustomer = customers.find((c) => c.email.toLowerCase() === cleanEmail);
            if (!existingCustomer && registerCustomer) {
              registerCustomer(customerName, cleanEmail, customerPhone);
            }

            const userObj = {
              name: customerName,
              email: cleanEmail,
              phone: customerPhone,
              role: 'customer' as const,
              createdAt: new Date().toISOString(),
            };

            setCurrentUser(userObj);
            localStorage.setItem('uk2ug_clean_user', JSON.stringify(userObj));
            localStorage.removeItem('uk2ug_clean_logged_out');
            localStorage.removeItem('uk2ug_pending_verification');

            // Clean query params from address bar
            window.history.replaceState({}, document.title, window.location.pathname);

            setShowGmailVerificationModal(false);
          } else {
            setCustomerActionToast('Verification link is invalid or expired. Please sign in again.');
            setTimeout(() => setCustomerActionToast(''), 5000);
          }
        } catch (err) {
          console.error('Error during token verification:', err);
        }
      };

      processVerificationToken();
    }
  }, [customers, registerCustomer, setCurrentUser]);

  // Account requirement gate helper for first-time / guest users - loads registration form
  const requireAuth = (featureName?: string, callback?: () => void): boolean => {
    if (!currentUser) {
      setAuthError(featureName ? `Please create an account to ${featureName}.` : 'Please create an account to continue.');
      setIsSignUp(true);
      setIsForgotPassword(false);
      setShowAuthModal(true);
      return false;
    }
    if (callback) callback();
    return true;
  };

  const handleToggleWishlist = (productId: string) => {
    if (!requireAuth('save items to your wishlist')) return;
    toggleWishlist(productId);
  };

  // Sticky navbar shadow and drop
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Profile dropdown state and click outside handler
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Check for unverified users on auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && !user.emailVerified && !user.providerData.some((p) => p.providerId === 'google.com')) {
        const isAdminOrRider = isAdminUser(user.email, user.uid) || isRiderUser(user.email);

        if (isAdminOrRider) return;

        try {
          await sendEmailVerification(user);
        } catch (e) {
          // Verification email already sent or rate limited
        }
        await signOut(auth);
        setVerificationEmail(user.email || '');
        setShowAuthModal(false);
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Update checkout form on auth change
  useEffect(() => {
    if (currentUser) {
      setCheckoutForm((prev) => ({
        ...prev,
        fullName: currentUser.name,
        phone: currentUser.phone,
        paymentPhone: currentUser.phone,
      }));
    }
  }, [currentUser]);

  // Customer order history list (matching account or saved session IDs)
  // Customer order history list (strictly matching active account)
  const myOrdersList = useMemo(() => {
    if (!currentUser) {
      try {
        const savedIds: string[] = JSON.parse(localStorage.getItem('uk2ug_my_order_ids') || '[]');
        return orders.filter((o) => savedIds.includes(o.id));
      } catch {
        return [];
      }
    }

    const userEmail = currentUser.email ? currentUser.email.trim().toLowerCase() : '';
    const userPhoneClean = currentUser.phone ? currentUser.phone.replace(/\D/g, '') : '';

    return orders.filter((o) => {
      // Exclude sample dummy orders unless the customer's email strictly matches
      if (['brenda.k@gmail.com', 'patrick.ochen@yahoo.com', 'jnsubuga@gmail.com'].includes((o.customerEmail || '').toLowerCase())) {
        return userEmail === (o.customerEmail || '').toLowerCase();
      }

      // 1. Strict email matching
      if (userEmail && o.customerEmail && o.customerEmail.trim().toLowerCase() === userEmail) {
        return true;
      }
      // 2. Strict phone matching (minimum 9 digits to prevent partial substring matches)
      if (userPhoneClean && userPhoneClean.length >= 9 && o.customerPhone) {
        const orderPhoneClean = o.customerPhone.replace(/\D/g, '');
        if (orderPhoneClean === userPhoneClean || (orderPhoneClean.length >= 9 && orderPhoneClean.slice(-9) === userPhoneClean.slice(-9))) {
          return true;
        }
      }
      return false;
    });
  }, [orders, currentUser]);

  // Customer product requests list (matching account or saved session IDs)
  const myRequestsList = useMemo(() => {
    return imports.filter((req) => {
      let isLocal = false;
      try {
        const savedIds: string[] = JSON.parse(localStorage.getItem('uk2ug_my_import_ids') || '[]');
        if (savedIds.includes(req.id)) isLocal = true;
      } catch (e) {}

      if (isLocal) return true;

      if (currentUser) {
        // 1. Email matching
        const userEmail = currentUser.email ? currentUser.email.trim().toLowerCase() : '';
        const reqEmail = req.customerEmail ? req.customerEmail.trim().toLowerCase() : '';
        if (userEmail && reqEmail && userEmail === reqEmail) return true;

        // 2. Phone matching
        const userDigits = currentUser.phone ? currentUser.phone.replace(/\D/g, '') : '';
        const reqDigits = req.customerPhone ? req.customerPhone.replace(/\D/g, '') : '';
        if (userDigits && reqDigits) {
          if (userDigits === reqDigits) return true;
          if (userDigits.length >= 7 && reqDigits.length >= 7 && userDigits.slice(-7) === reqDigits.slice(-7)) {
            return true;
          }
        }
      }
      return false;
    });
  }, [imports, currentUser]);

  // Flagged issues and alerts on customer orders & complaints
  const flaggedOrders = useMemo(() => {
    return myOrdersList.filter(
      (o) => o.paymentStatus === 'Failed' || (Boolean(o.paymentNotes) && o.paymentStatus !== 'Pending Verification' && o.paymentStatus !== 'Paid' && !['Delivered', 'Picked Up'].includes(o.status))
    );
  }, [myOrdersList]);

  const customerComplaints = useMemo(() => {
    if (!currentUser || !currentUser.email) return [];
    const userEmail = currentUser.email.trim().toLowerCase();
    const myOrderIds = new Set(myOrdersList.map((o) => o.id));

    return complaints.filter((c) => {
      // Strictly match complaints filed by the customer or referencing their orders
      if (c.customerEmail && c.customerEmail.trim().toLowerCase() === userEmail) return true;
      if (c.orderId && myOrderIds.has(c.orderId)) return true;
      return false;
    });
  }, [complaints, currentUser, myOrdersList]);

  // Customer personal notifications list (strictly matching active customer orders or customer-wide alerts)
  const myNotifications = useMemo(() => {
    if (!currentUser || !currentUser.email) return [];
    const userEmail = currentUser.email.trim().toLowerCase();
    const myOrderIds = new Set(myOrdersList.map((o) => o.id));

    return notifications.filter((n) => {
      // 1. If notification is tied to an order, that order MUST exist in customer's myOrdersList
      if (n.orderId) {
        return myOrderIds.has(n.orderId);
      }
      // 2. If general customer notice without an order ID, match by customerEmail
      if (n.customerEmail && n.customerEmail.trim().toLowerCase() === userEmail) {
        return true;
      }
      return false;
    });
  }, [notifications, currentUser, myOrdersList]);

  const unreadNotifCount = useMemo(() => {
    return myNotifications.filter((n) => !n.read).length;
  }, [myNotifications]);

  const flaggedNotifications = useMemo(() => {
    if (!currentUser || myOrdersList.length === 0) return [];
    return myNotifications.filter(
      (n) =>
        n.type === 'payment_flagged' &&
        !n.read &&
        myOrdersList.some((o) => o.id === n.orderId)
    );
  }, [myNotifications, currentUser, myOrdersList]);

  const totalFlaggedCount =
    flaggedOrders.length +
    customerComplaints.filter((c) => c.status === 'Open' || c.status === 'Under Review' || c.status === 'In Progress').length +
    flaggedNotifications.length;

  const totalCustomerAlertCount = unreadNotifCount + flaggedOrders.length;

  // Active storewide admin announcements and flight cargo dispatches
  const activeAdminNotices = useMemo(() => {
    return (banner?.adminNotices || []).filter(
      (n) =>
        n.isActive !== false &&
        !dismissedNoticeIds.includes(n.id) &&
        n.id !== 'notice-uk-cargo-1' &&
        !n.title.toLowerCase().includes('heathrow')
    );
  }, [banner, dismissedNoticeIds]);

  const handleConfirmDeleteOrder = (ord: Order) => {
    if (deleteOrder) {
      deleteOrder(ord.id);
    }
    try {
      const savedIds: string[] = JSON.parse(localStorage.getItem('uk2ug_my_order_ids') || '[]');
      const updatedIds = savedIds.filter((id) => id !== ord.id);
      localStorage.setItem('uk2ug_my_order_ids', JSON.stringify(updatedIds));
    } catch (e) {}

    if (trackedOrder?.id === ord.id) {
      setTrackedOrder(null);
      setTrackingNumber('');
    }
    setOrderToDelete(null);
    setCustomerActionToast(`Order #${ord.id} record has been permanently deleted.`);
    setTimeout(() => setCustomerActionToast(''), 4000);
  };

  const handleConfirmDeleteRequest = (req: ImportRequest) => {
    if (deleteImportRequest) {
      deleteImportRequest(req.id);
    }
    try {
      const savedIds: string[] = JSON.parse(localStorage.getItem('uk2ug_my_import_ids') || '[]');
      const updatedIds = savedIds.filter((id) => id !== req.id);
      localStorage.setItem('uk2ug_my_import_ids', JSON.stringify(updatedIds));
    } catch (e) {}

    if (trackedRequest?.id === req.id) {
      setTrackedRequest(null);
      setRequestTrackingRef('');
    }
    setRequestToDelete(null);
    setCustomerActionToast(`Product request ${req.id} record has been permanently deleted.`);
    setTimeout(() => setCustomerActionToast(''), 4000);
  };

  const handleResubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fixPaymentOrder) return;
    const cleanRef = (fixPaymentRef || '').trim();
    if (!cleanRef) {
      alert('Please enter your transaction ID or reference number.');
      return;
    }

    setIsSubmittingPayment(true);
    const updatedData = {
      paymentMethod: fixPaymentMethod,
      paymentPhone: (fixPaymentPhone || fixPaymentOrder.customerPhone || '').trim(),
      paymentTransactionRef: cleanRef,
      transactionId: cleanRef,
      paymentStatus: 'Pending Verification' as const,
      paymentNotes: '',
    };

    if (updateOrderPaymentDetails) {
      updateOrderPaymentDetails(fixPaymentOrder.id, updatedData);
    }

    if (trackedOrder && trackedOrder.id === fixPaymentOrder.id) {
      setTrackedOrder({
        ...trackedOrder,
        ...updatedData,
        paymentSubmittedAt: new Date().toISOString(),
      });
    }

    setIsSubmittingPayment(false);
    setFixPaymentSuccessMsg(
      `Payment reference for Order #${fixPaymentOrder.id} successfully updated to "${cleanRef}"! Finance verification in progress.`
    );
    setCustomerActionToast(`Order #${fixPaymentOrder.id} payment reference resubmitted for verification.`);

    setTimeout(() => {
      setFixPaymentOrder(null);
      setFixPaymentSuccessMsg('');
      setFixPaymentRef('');
      setFixPaymentPhone('');
    }, 1800);
  };

  // Real-time update for actively inspected tracked order
  useEffect(() => {
    if (trackedOrder) {
      const updated = orders.find((o) => o.id === trackedOrder.id);
      if (
        updated &&
        (updated.status !== trackedOrder.status ||
          updated.paymentStatus !== trackedOrder.paymentStatus ||
          updated.paymentNotes !== trackedOrder.paymentNotes ||
          updated.paymentTransactionRef !== trackedOrder.paymentTransactionRef)
      ) {
        setTrackedOrder(updated);
      }
    }
  }, [orders, trackedOrder?.id, trackedOrder?.status, trackedOrder?.paymentStatus, trackedOrder?.paymentNotes, trackedOrder?.paymentTransactionRef]);

  // Seamless Customer Navigation Handlers (guarantees correct mode, tab & element focus)
  const navigateToMyOrders = () => {
    setTrackingMode('orders');
    setActiveTab('tracking');
    setTrackedOrder(null);
    setShowProfileMenu(false);
    setShowAccountModal(false);
    setTimeout(() => {
      const elem = document.getElementById('my-orders-history-section');
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        const layout = document.getElementById('tracking-portal-layout');
        if (layout) layout.scrollIntoView({ behavior: 'smooth', block: 'start' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 150);
  };

  const navigateToMyRequests = () => {
    setTrackingMode('requests');
    setActiveTab('tracking');
    setTrackedRequest(null);
    setShowProfileMenu(false);
    setShowAccountModal(false);
    setTimeout(() => {
      const elem = document.getElementById('my-requests-history-section');
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        const layout = document.getElementById('tracking-portal-layout');
        if (layout) layout.scrollIntoView({ behavior: 'smooth', block: 'start' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 150);
  };

  const navigateToFlaggedIssues = () => {
    setTrackingMode('flagged');
    setActiveTab('tracking');
    setShowProfileMenu(false);
    setShowAccountModal(false);
    setTimeout(() => {
      const elem = document.getElementById('flagged-issues-portal-view');
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        const layout = document.getElementById('tracking-portal-layout');
        if (layout) layout.scrollIntoView({ behavior: 'smooth', block: 'start' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 150);
  };

  // Real-time update for actively inspected tracked request
  useEffect(() => {
    if (trackedRequest) {
      const updated = imports.find((i) => i.id === trackedRequest.id);
      if (updated && (updated.status !== trackedRequest.status || updated.quotePrice !== trackedRequest.quotePrice || updated.updatedAt !== trackedRequest.updatedAt)) {
        setTrackedRequest(updated);
      }
    }
  }, [imports, trackedRequest?.id, trackedRequest?.status, trackedRequest?.quotePrice, trackedRequest?.updatedAt]);

  // Active Flash Deals (memoized to prevent recreating array reference on every render)
  const flashDeals = useMemo(() => {
    return products.filter((p) => {
      if (!p.isFlashDeal) return false;
      if (p.flashDealEnd) {
        const end = new Date(p.flashDealEnd).getTime();
        if (!isNaN(end) && end <= Date.now()) {
          return false;
        }
      }
      return true;
    });
  }, [products]);

  // Nearest future expiration timestamp (primitive number for stable effect dependency)
  const earliestFlashEndMs = useMemo(() => {
    const futureEnds = flashDeals
      .map((p) => (p.flashDealEnd ? new Date(p.flashDealEnd).getTime() : null))
      .filter((t): t is number => t !== null && !isNaN(t) && t > Date.now())
      .sort((a, b) => a - b);
    return futureEnds.length > 0 ? futureEnds[0] : null;
  }, [flashDeals]);

  // Flash Deals Carousel & Countdown Timers
  const flashScrollRef = useRef<HTMLDivElement>(null);
  const [activeFlashIndex, setActiveFlashIndex] = useState(0);
  const [isFlashHovered, setIsFlashHovered] = useState(false);

  const [dealTimeLeft, setDealTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 24,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const updateCountdown = () => {
      if (earliestFlashEndMs) {
        const diff = earliestFlashEndMs - Date.now();
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setDealTimeLeft((prev) => {
            if (prev.hours === hours && prev.minutes === minutes && prev.seconds === seconds) {
              return prev;
            }
            return { hours, minutes, seconds };
          });
        } else {
          setDealTimeLeft((prev) => {
            if (prev.hours === 0 && prev.minutes === 0 && prev.seconds === 0) return prev;
            return { hours: 0, minutes: 0, seconds: 0 };
          });
        }
      } else {
        setDealTimeLeft((prev) => {
          if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
          if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
          if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
          return prev;
        });
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [earliestFlashEndMs]);

  // Flash Carousel Navigation
  const handleScrollFlashCarousel = (direction: 'prev' | 'next') => {
    if (!flashScrollRef.current) return;
    const container = flashScrollRef.current;
    const cardWidth = container.firstElementChild ? (container.firstElementChild as HTMLElement).offsetWidth + 20 : 320;
    const scrollAmount = direction === 'next' ? cardWidth : -cardWidth;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const scrollToFlashIndex = (idx: number) => {
    if (!flashScrollRef.current) return;
    const container = flashScrollRef.current;
    const cards = container.children;
    if (cards[idx]) {
      (cards[idx] as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
      setActiveFlashIndex(idx);
    }
  };

  const handleFlashScroll = () => {
    if (!flashScrollRef.current) return;
    const container = flashScrollRef.current;
    const cardWidth = container.firstElementChild ? (container.firstElementChild as HTMLElement).offsetWidth + 20 : 320;
    const newIndex = Math.round(container.scrollLeft / cardWidth);
    if (newIndex >= 0 && newIndex < flashDeals.length && newIndex !== activeFlashIndex) {
      setActiveFlashIndex(newIndex);
    }
  };

  // Auto-advance carousel smoothly when not hovered
  useEffect(() => {
    if (flashDeals.length <= 1 || isFlashHovered) return;
    const autoPlayTimer = setInterval(() => {
      if (!flashScrollRef.current) return;
      const container = flashScrollRef.current;
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (container.scrollLeft >= maxScroll - 25) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
        setActiveFlashIndex(0);
      } else {
        handleScrollFlashCarousel('next');
      }
    }, 4500);

    return () => clearInterval(autoPlayTimer);
  }, [flashDeals.length, isFlashHovered]);

  // Filter & Sort Products
  const filteredProducts = products.filter((prod) => {
    if (onlyPreOrders && !isPreOrderActive(prod)) return false;
    const matchesCategory = selectedCategory === 'all' || prod.categoryId === selectedCategory;
    const matchesSearch = prod.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      Boolean(prod.brand && prod.brand.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPrice = prod.basePrice <= priceRange;
    return matchesCategory && matchesSearch && matchesPrice;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'newest') return 1; // Seed keeps them in ordered timeline
    if (sortBy === 'priceAsc') return a.basePrice - b.basePrice;
    if (sortBy === 'priceDesc') return b.basePrice - a.basePrice;
    return 0;
  });

  // Calculate cart Totals with variation unit prices
  const cartSubtotal = cart.reduce(
    (sum, item) => sum + (item.unitPrice ?? item.product.basePrice) * item.quantity,
    0
  );
  const activeDistrictFee = districts.find((d) => d.name === checkoutForm.district)?.fee ?? 0;
  const deliveryFee = checkoutPath === 'pickup' ? 0 : activeDistrictFee;
  const cartTotal = cartSubtotal + deliveryFee;

  const handleInitiateAddToCart = (product: Product, size?: string) => {
    if (size) {
      const isTrouser = product.isGarment || (product.sizes && product.sizes.some((s) => ['28','29','30','31','32','33','34','35','36'].includes(s)));
      const formattedSizeName = isTrouser && ['28','29','30','31','32','33','34','35','36'].includes(size.trim())
        ? `Waist ${size.trim()}`
        : size;

      const matchedVar = product.variations?.find(
        (v) => v.name.toLowerCase().includes(size.toLowerCase()) || v.name.toLowerCase().includes(formattedSizeName.toLowerCase())
      ) || {
        id: `size-${size.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
        name: formattedSizeName,
        price: product.basePrice,
        originalPrice: product.originalPrice,
        stock: Math.max(1, product.quantity),
        available: true,
      };

      addToCart(product, 1, matchedVar.name, matchedVar);
      setActiveTab('cart');
      return;
    }

    if ((product.variations && product.variations.length > 0) || (product.sizes && product.sizes.length > 0)) {
      setVariationModalProduct(product);
    } else {
      addToCart(product, 1);
      setActiveTab('cart');
    }
  };

  const handleVariationAddToCart = (
    items: { variation: ProductVariation; quantity: number }[],
    shouldOpenCart: boolean
  ) => {
    if (!variationModalProduct) return;
    items.forEach((item) => {
      addToCart(variationModalProduct, item.quantity, item.variation.name, item.variation);
    });
    setVariationModalProduct(null);
    if (shouldOpenCart) {
      setActiveTab('cart');
    }
  };

  // Image Hover Zoom Effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: 'scale(1.8)',
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({
      transformOrigin: 'center',
      transform: 'scale(1)',
    });
  };

  // Submit Review Handlers
  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingProduct) return;
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    
    addReview({
      productId: viewingProduct.id,
      userName: currentUser.name,
      userInitials: currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase(),
      rating: reviewRating,
      comment: reviewComment,
    });

    setReviewComment('');
    setReviewSuccess(true);
    setTimeout(() => setReviewSuccess(false), 4000);
  };

  // Auth Submit Handlers
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const emailToReset = authForm.email.trim();
    if (!emailToReset) {
      setAuthError('Please enter your email address.');
      return;
    }
    setForgotPasswordLoading(true);
    try {
      await sendPasswordResetEmail(auth, emailToReset);
      setResetEmailSent(emailToReset);
    } catch (err: any) {
      let msg = 'Failed to send reset email link.';
      if (err.code === 'auth/user-not-found') {
        msg = 'No account found with this email address.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Invalid email address format.';
      } else if (err.message) {
        msg = err.message;
      }
      setAuthError(msg);
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (isSignUp) {
      if (!authForm.fullName || !authForm.email || !authForm.phone || !authForm.password || !authForm.confirmPassword) {
        setAuthError('Please fill in all registration fields.');
        return;
      }
      if (authForm.password.length < 6) {
        setAuthError('Password must be at least 6 characters long.');
        return;
      }
      if (authForm.password !== authForm.confirmPassword) {
        setAuthError('Passwords do not match.');
        return;
      }

      const emailToVerify = authForm.email.trim();
      const customerName = authForm.fullName.trim();
      const customerPhone = authForm.phone.trim();

      // ALWAYS register customer profile immediately into the database and Admin panel
      registerCustomer(customerName, emailToVerify, customerPhone);

      createUserWithEmailAndPassword(auth, emailToVerify, authForm.password)
        .then(async (userCredential) => {
          if (userCredential.user) {
            try {
              await updateProfile(userCredential.user, {
                displayName: customerName,
              });
            } catch (e) {}

            try {
              await sendEmailVerification(userCredential.user);
            } catch (err: any) {
              console.warn('Email verification send error:', err);
            }

            // Small delay to allow verification request to leave the client
            setTimeout(async () => {
              try {
                await signOut(auth);
              } catch (e) {}
            }, 600);
          }

          setCurrentUser(null);
          setShowAuthModal(true);
          setResendVerificationNotice('');
          setVerificationEmail(emailToVerify);
        })
        .catch((err: any) => {
          console.error('Firebase Auth signup error:', err);
          if (err.code === 'auth/email-already-in-use' || err.code === 'auth/credential-already-in-use') {
            setAuthError('An account with this email already exists. Please switch to Sign In.');
          } else if (err.code === 'auth/weak-password') {
            setAuthError('Password is too weak. Please use at least 6 characters.');
          } else if (err.code === 'auth/invalid-email') {
            setAuthError('Invalid email format. Please enter a valid email address.');
          } else if (err.code === 'auth/operation-not-allowed') {
            setAuthError('Email/Password registration is not enabled in Firebase Auth Console. Your account profile has been saved to the store customer accounts directory. You can also sign in with Google.');
          } else {
            setAuthError(err.message || 'Registration failed. Please check your credentials and try again.');
          }
        });
    } else {
      if (!authForm.email || !authForm.password) {
        setAuthError('PASSWORD OR EMAIL INCORRECT');
        return;
      }

      let emailToAuth = authForm.email;
      let targetPhone = '';
      let targetName = '';
      let targetRole: UserRole = 'customer';

      const isPhoneLogin = authForm.email.startsWith('+') || /^\d+$/.test(authForm.email);

      if (isPhoneLogin) {
        if (!authForm.email.startsWith('+')) {
          setAuthError('PASSWORD OR EMAIL INCORRECT');
          return;
        }

        const customer = customers.find(c => c.phone.replace(/\s+/g, '') === authForm.email.replace(/\s+/g, ''));
        if (!customer) {
          setAuthError('PASSWORD OR EMAIL INCORRECT');
          return;
        }
        emailToAuth = customer.email;
        targetName = customer.name;
        targetPhone = customer.phone;
      }

      targetRole = determineRole(emailToAuth);
      if (targetRole === 'admin') {
        targetName = targetName || 'uk2ug admin';
        targetPhone = targetPhone || '0774 540199';
      } else if (targetRole === 'driver') {
        targetName = targetName || 'Fulfillment Partner';
        targetPhone = targetPhone || '0702 333444';
      } else {
        const customer = customers.find(c => c.email.toLowerCase() === emailToAuth.toLowerCase());
        if (customer) {
          targetName = customer.name;
          targetPhone = customer.phone;
        } else {
          targetName = authForm.fullName || auth.currentUser?.displayName || authForm.email.split('@')[0];
          targetPhone = targetPhone || '';
        }
      }

      signInWithEmailAndPassword(auth, emailToAuth, authForm.password)
        .then(async (userCredential) => {
          const user = userCredential.user;
          const finalRole: UserRole = determineRole(user.email || emailToAuth, user.uid);
          const isAdminOrRider = finalRole === 'admin' || finalRole === 'driver';

          // Verify email status for regular customers
          if (!isAdminOrRider && !user.emailVerified && !user.providerData.some(p => p.providerId === 'google.com')) {
            try {
              await sendEmailVerification(user);
            } catch (e) {}
            await signOut(auth);
            setCurrentUser(null);
            setShowAuthModal(true);
            setVerificationEmail(user.email || emailToAuth);
            return;
          }
          const custName = user.displayName || targetName || user.email?.split('@')[0] || 'Customer';
          const custEmail = user.email || emailToAuth;
          if (finalRole === 'customer') {
            registerCustomer(custName, custEmail, targetPhone || '');
          }

          setCurrentUser({
            name: custName,
            email: custEmail,
            phone: targetPhone,
            role: finalRole,
            uid: user.uid,
          });
          setShowAuthModal(false);
          if (sessionStorage.getItem('uk2ug_pending_checkout') === 'true' || (cart.length > 0 && activeTab === 'cart')) {
            sessionStorage.removeItem('uk2ug_pending_checkout');
            setIsCheckingOut(true);
            setActiveTab('cart');
          }
        })
        .catch((err: any) => {
          if (err.code === 'auth/operation-not-allowed') {
            setCurrentUser({
              name: targetName || emailToAuth.split('@')[0],
              email: emailToAuth,
              phone: targetPhone,
              role: targetRole,
            });
            setShowAuthModal(false);
            if (sessionStorage.getItem('uk2ug_pending_checkout') === 'true' || (cart.length > 0 && activeTab === 'cart')) {
              sessionStorage.removeItem('uk2ug_pending_checkout');
              setIsCheckingOut(true);
              setActiveTab('cart');
            }
            return;
          }
          setAuthError('PASSWORD OR EMAIL INCORRECT');
        });
    }
  };

  const handleGoogleSignIn = () => {
    setAuthError('');
    signInWithPopup(auth, googleProvider)
      .then(async (result) => {
        const user = result.user;
        const targetEmail = (user.email || '').toLowerCase().trim();

        const isRestrictedRole = isAdminUser(targetEmail, user.uid) || isRiderUser(targetEmail);

        // The admin and rider should NOT be able to login to store by clicking the Sign in with Google button
        // It should ONLY be used by normal users or customers.
        if (isRestrictedRole) {
          try {
            await signOut(auth);
          } catch (e) {
            // ignore
          }
          localStorage.removeItem('uk2ug_clean_user');
          localStorage.setItem('uk2ug_clean_logged_out', 'true');
          setCurrentUser(null);
          setAuthError(
            'Google Sign-In is strictly for regular customers. Store administrators and dispatch riders cannot log in using Google. Please use your email and password above.'
          );
          return;
        }

        // Proceed for normal customers only
        let targetName = user.displayName || 'Customer';
        let targetPhone = user.phoneNumber || '';
        const existing = customers.find((c) => c.email.toLowerCase() === targetEmail);
        if (existing) {
          targetName = existing.name;
          targetPhone = existing.phone;
        }

        // GENERATE SECURE VERIFICATION LINK SENT DIRECTLY TO THEIR GMAIL
        const verifyToken =
          'UK2UG-VERIFY-' +
          Math.random().toString(36).substring(2, 8).toUpperCase() +
          '-' +
          Date.now().toString(36).toUpperCase();
        const verificationUrl = `${window.location.origin}${window.location.pathname}?verify_token=${encodeURIComponent(
          verifyToken
        )}&email=${encodeURIComponent(targetEmail)}`;

        // Save token to Firestore & localStorage
        try {
          if (db) {
            await setDoc(doc(db, 'verifications', verifyToken), {
              token: verifyToken,
              email: targetEmail,
              name: targetName,
              phone: targetPhone || '0774 540199',
              uid: user.uid,
              verified: false,
              createdAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            });
          }
        } catch (e) {
          console.warn('Firestore verification record note:', e);
        }

        localStorage.setItem(
          'uk2ug_pending_verification',
          JSON.stringify({
            token: verifyToken,
            email: targetEmail,
            name: targetName,
            phone: targetPhone || '0774 540199',
            verificationUrl,
            uid: user.uid,
            createdAt: Date.now(),
          })
        );

        // Send branded verification link email to customer's Gmail
        await sendCustomerVerificationEmail(targetEmail, targetName, verificationUrl, verifyToken);

        // Also trigger Firebase email verification if available
        try {
          if (user && !user.emailVerified) {
            await sendEmailVerification(user);
          }
        } catch (e) {}

        // Customer MUST use the verification link received on their Gmail to sign into the site
        try {
          await signOut(auth);
        } catch (e) {}
        setCurrentUser(null);
        localStorage.removeItem('uk2ug_clean_user');

        // Close auth modal and present Gmail Verification notification modal
        setShowAuthModal(false);
        setVerificationPendingEmail(targetEmail);
        setVerificationPendingName(targetName);
        setVerificationPendingPhone(targetPhone || '0774 540199');
        setPendingVerificationUrl(verificationUrl);
        setVerificationResendCooldown(30);
        setShowGmailVerificationModal(true);
      })
      .catch((err: any) => {
        let msg = err.message;
        if (err.code === 'auth/popup-closed-by-user') {
          msg = 'Google Sign-in was cancelled. Please try again.';
        }
        setAuthError(msg);
      });
  };

  const handleResendVerificationLink = async () => {
    if (verificationResendCooldown > 0 || !verificationPendingEmail) return;
    setIsResendingVerificationLink(true);
    try {
      const verifyToken =
        'UK2UG-VERIFY-' +
        Math.random().toString(36).substring(2, 8).toUpperCase() +
        '-' +
        Date.now().toString(36).toUpperCase();
      const verificationUrl = `${window.location.origin}${window.location.pathname}?verify_token=${encodeURIComponent(
        verifyToken
      )}&email=${encodeURIComponent(verificationPendingEmail)}`;

      if (db) {
        await setDoc(doc(db, 'verifications', verifyToken), {
          token: verifyToken,
          email: verificationPendingEmail,
          name: verificationPendingName,
          phone: verificationPendingPhone || '0774 540199',
          verified: false,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });
      }

      localStorage.setItem(
        'uk2ug_pending_verification',
        JSON.stringify({
          token: verifyToken,
          email: verificationPendingEmail,
          name: verificationPendingName,
          phone: verificationPendingPhone || '0774 540199',
          verificationUrl,
          createdAt: Date.now(),
        })
      );

      await sendCustomerVerificationEmail(
        verificationPendingEmail,
        verificationPendingName,
        verificationUrl,
        verifyToken
      );

      setPendingVerificationUrl(verificationUrl);
      setVerificationResendCooldown(30);
      setCustomerActionToast(`New verification link sent to ${verificationPendingEmail}`);
      setTimeout(() => setCustomerActionToast(''), 5000);
    } catch (e: any) {
      setCustomerActionToast('Failed to resend verification email. Please try again.');
      setTimeout(() => setCustomerActionToast(''), 4000);
    } finally {
      setIsResendingVerificationLink(false);
    }
  };

  // Import Request Drag-and-drop placeholder
  const [dragActive, setDragActive] = useState<boolean>(false);
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setImportFile(e.dataTransfer.files[0]);
    }
  };

  // Submit product request wizard
  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    const allImages: string[] = [];
    if (importForm.imageUrl) allImages.push(importForm.imageUrl);
    if (importForm.imageUrl2 && !allImages.includes(importForm.imageUrl2)) allImages.push(importForm.imageUrl2);

    const reqId = submitImportRequest({
      productName: importForm.productName,
      productLink: importForm.productLink || undefined,
      imageUrl: importForm.imageUrl || importForm.imageUrl2 || '',
      imageUrl2: importForm.imageUrl2 || '',
      images: allImages,
      description: importForm.description,
      quantity: importForm.quantity,
      targetBudget: 'Pending Quote',
      notes: importForm.notes,
      customerName: currentUser.name,
      customerPhone: currentUser.phone,
    });

    try {
      const existing = JSON.parse(localStorage.getItem('uk2ug_my_import_ids') || '[]');
      if (!existing.includes(reqId)) {
        localStorage.setItem('uk2ug_my_import_ids', JSON.stringify([reqId, ...existing]));
      }
    } catch (e) {}

    setImportSuccessCode(reqId);
    setImportStep(3);
  };

  // Checkout submission
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    if (checkoutForm.paymentMethod === 'Mobile Money') {
      const cleanRef = checkoutForm.paymentTransactionRef.trim().replace(/\D/g, '');
      if (!cleanRef) {
        setCheckoutError('Transaction ID / Reference is mandatory. Please enter your Mobile Money transaction ID.');
        return;
      }
      if (momoNetwork === 'MTN' && cleanRef.length !== 11) {
        setCheckoutError(`MTN Mobile Money Transaction ID must be exactly 11 integer digits (e.g. 10482910394). You have entered ${cleanRef.length} digits.`);
        return;
      }
      if (momoNetwork === 'Airtel' && cleanRef.length !== 12) {
        setCheckoutError(`Airtel Money Transaction ID must be exactly 12 integer digits (e.g. 293847581920). You have entered ${cleanRef.length} digits.`);
        return;
      }
    }
    setCheckoutError(null);

    const customerEmail = checkoutForm.email.trim() || currentUser?.email || undefined;
    const orderItems = cart.map((item) => ({
      productId: item.product.id,
      title: item.product.title,
      price: item.unitPrice ?? item.product.basePrice,
      quantity: item.quantity,
      selectedSize: item.selectedSize,
      variationId: item.variationId,
      variationName: item.variationName,
      isPreOrder: isPreOrderActive(item.product) || !!item.product.isPreOrder,
      preOrderStatus: item.product.preOrderStatus,
      preOrderEstimatedArrival: item.product.preOrderEstimatedArrival,
    }));

    const cleanMomoRef = checkoutForm.paymentTransactionRef.trim().replace(/\D/g, '');

    const orderPayload = {
      customerName: checkoutForm.fullName,
      customerPhone: checkoutForm.phone,
      customerEmail: customerEmail,
      deliveryPath: checkoutPath,
      deliveryType: checkoutPath,
      deliveryDetails: checkoutPath === 'delivery' ? {
        district: checkoutForm.district,
        area: checkoutForm.area,
        landmark: checkoutForm.landmark,
        notes: checkoutForm.notes,
      } : undefined,
      deliveryFee,
      subtotal: cartSubtotal,
      totalAmount: cartTotal,
      paymentMethod: checkoutForm.paymentMethod === 'Mobile Money' ? `Mobile Money (${momoNetwork})` : checkoutForm.paymentMethod,
      paymentPhone: checkoutForm.paymentMethod === 'Mobile Money' ? (checkoutForm.paymentPhone || checkoutForm.phone) : undefined,
      paymentTransactionRef: checkoutForm.paymentMethod === 'Mobile Money' ? `${momoNetwork}: ${cleanMomoRef}` : undefined,
      items: orderItems,
    };

    const orderId = placeOrder(orderPayload as any);

    const completeOrderObj: Order = {
      ...orderPayload,
      id: orderId,
      date: new Date().toISOString(),
      status: 'Pending',
      deliveryPin: orderId.slice(-4),
    } as Order;

    setPlacedOrderDetails(completeOrderObj);
    setCheckoutSuccessCode(orderId);

    try {
      const existing = JSON.parse(localStorage.getItem('uk2ug_my_order_ids') || '[]');
      if (!existing.includes(orderId)) {
        localStorage.setItem('uk2ug_my_order_ids', JSON.stringify([orderId, ...existing]));
      }
    } catch (e) {}
  };

  // Order tracking check
  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError('');
    setTrackedOrder(null);

    const match = orders.find((o) => o.id.trim().toUpperCase() === trackingNumber.trim().toUpperCase());
    if (match) {
      setTrackedOrder(match);
    } else {
      setTrackError('Order tracking number not found. Please try again.');
    }
  };

  // Product Request tracking check
  const handleTrackRequest = (e?: React.FormEvent, explicitRef?: string) => {
    if (e) e.preventDefault();
    setRequestTrackError('');
    const query = (explicitRef || requestTrackingRef).trim().toUpperCase();
    if (!query) {
      setRequestTrackError('Please enter your Product Request Reference (e.g. UK2UG-REQ-XXXXXX).');
      return;
    }

    const match = imports.find((req) => req.id.trim().toUpperCase() === query);
    if (match) {
      setTrackedRequest(match);
      setRequestTrackingRef(match.id);
    } else {
      setTrackedRequest(null);
      setRequestTrackError(`No product request located matching reference "${query}". Please verify your reference code or pick from your submitted requests.`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-800 flex flex-col font-sans" id="customer-portal-root">
      {/* Sticky Header Nav */}
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.05)] border-b border-gray-100'
            : 'bg-white border-b border-gray-100'
        }`}
        id="uk2ug-nav"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-2.5 sm:gap-4">
          {/* Logo */}
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2.5 cursor-pointer shrink-0"
            id="brand-logo"
          >
            <div className="bg-[#ea580c] text-white p-2.5 rounded-lg shadow-sm flex items-center justify-center">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight text-[#000000]">UK2UG</span>
              <p className="text-[10px] uppercase tracking-widest text-[#ea580c] font-semibold -mt-1">UK Sourcing</p>
            </div>
          </div>

          {/* Category selection */}
          <div className="hidden lg:block shrink-0">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setActiveTab('shop');
              }}
              className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 p-2.5 outline-none font-medium transition-colors"
              id="category-dropdown"
            >
              <option value="all">All UK Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Global Search */}
          <div className="flex-1 max-w-md relative" id="search-box">
            <input
              type="text"
              placeholder="Search products by title, brand, or category..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeTab !== 'shop') setActiveTab('shop');
              }}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-orange-500/10 focus:border-[#ea580c] transition-all"
            />
            <Search className="w-4.5 h-4.5 text-gray-400 absolute left-3.5 top-3.5" />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 sm:gap-4 lg:gap-6 shrink-0">
            {/* Product request button */}
            <button
              onClick={() => {
                if (!requireAuth('submit custom UK product import requests')) return;
                setImportStep(1);
                setActiveTab('imports');
              }}
              className="hidden md:flex items-center gap-1.5 px-4 py-2.5 bg-orange-50/80 text-[#ea580c] border border-orange-100 hover:bg-orange-100/80 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              title="Product Sourcing Request"
            >
              <span>Product Request</span>
            </button>

            {/* Track Requests header link */}
            <button
              onClick={() => {
                if (!requireAuth('track your custom product import requests')) return;
                navigateToMyRequests();
              }}
              className="hidden lg:flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-[#ea580c] transition-colors cursor-pointer px-2 py-1 rounded hover:bg-gray-50"
              title="Track Your Product Requests"
            >
              <ClipboardList className="w-3.5 h-3.5 text-[#ea580c]" />
              <span>Track Requests</span>
            </button>

            {/* Wishlist */}
            <button
              onClick={() => {
                if (!requireAuth('access your saved wishlist')) return;
                setActiveTab('wishlist');
              }}
              className="relative p-2 text-gray-600 hover:text-orange-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
              id="nav-wishlist-btn"
            >
              <Heart className="w-5 h-5" />
              {currentUser && wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#ea580c] text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Shopping Cart */}
            <button
              onClick={() => setActiveTab('cart')}
              className="relative p-2 text-gray-600 hover:text-orange-600 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
              id="nav-cart-btn"
              title="View Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cart.length > 0 ? (
                <span className="absolute -top-1 -right-1 bg-[#ea580c] text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center animate-bounce">
                  {cart.reduce((sum, i) => sum + i.quantity, 0)}
                </span>
              ) : null}
            </button>

            {/* Customer Personal Order Notifications Bell */}
            <button
              type="button"
              onClick={() => {
                if (!requireAuth('view personal notifications and order alerts')) return;
                setShowNotificationsDrawer(true);
              }}
              className="relative p-2 text-gray-600 hover:text-[#ea580c] hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
              title="Personal Order Notifications & Updates"
              id="nav-flagged-issues-bell"
            >
              <Bell className="w-5 h-5" />
              {currentUser && unreadNotifCount > 0 ? (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-extrabold rounded-full w-4.5 h-4.5 flex items-center justify-center animate-pulse shadow-sm">
                  {unreadNotifCount}
                </span>
              ) : null}
            </button>

            {/* Direct Admin Console Link if User is Admin */}
            {currentUser && (isAdminUser(currentUser.email, currentUser.uid) || currentUser.role === 'admin') && onNavigateToAdmin && (
              <button
                onClick={onNavigateToAdmin}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold hover:bg-purple-100 transition-colors cursor-pointer shadow-2xs"
                title="Open UK2UG Admin Console"
                id="header-admin-console-btn"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                <span>Admin Console</span>
              </button>
            )}

            {/* Direct Rider Portal Link if User is Rider */}
            {currentUser && (isRiderUser(currentUser.email) || currentUser.role === 'driver') && onNavigateToRider && (
              <button
                onClick={onNavigateToRider}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-[#ea580c] border border-orange-200 text-xs font-bold hover:bg-orange-100 transition-colors cursor-pointer shadow-2xs"
                title="Open UK2UG Rider Portal"
                id="header-rider-portal-btn"
              >
                <Truck className="w-3.5 h-3.5 text-[#ea580c]" />
                <span>Rider Portal</span>
              </button>
            )}

            {/* Tracking menu link - unavailable to people with accounts on the site */}
            {!currentUser && (
              <button
                onClick={() => {
                  setTrackedOrder(null);
                  setTrackingNumber('');
                  setTrackingMode('orders');
                  setActiveTab('tracking');
                }}
                className="hidden sm:inline text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
              >
                Track Order
              </button>
            )}

            {/* User Profile */}
            {currentUser ? (
              <div 
                ref={profileMenuRef}
                className="relative"
              >
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 cursor-pointer outline-none relative p-1 rounded-full hover:bg-gray-100 transition-colors"
                  title="Click to view Account Menu"
                >
                  <InitialsBadge name={currentUser.name} size="sm" />
                  {(() => {
                    const unread = messages.filter(m => m.userEmail === currentUser.email && m.sender === 'admin' && !m.readByCustomer).length;
                    if (unread > 0) {
                      return (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-sm">
                          {unread}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-2xl py-2 transition-all z-50 text-left divide-y divide-gray-50">
                    {/* User Info Header */}
                    <div className="px-4 py-2.5 bg-gray-50/50">
                      <p className="text-xs font-bold text-gray-900 truncate">{currentUser.name}</p>
                      <p className="text-[10px] text-gray-500 truncate font-mono">{currentUser.email}</p>
                      {isAdminUser(currentUser.email, currentUser.uid) || currentUser.role === 'admin' ? (
                        <span className="inline-block mt-1 text-[9px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                          System Administrator
                        </span>
                      ) : isRiderUser(currentUser.email) || currentUser.role === 'driver' ? (
                        <span className="inline-block mt-1 text-[9px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                          Delivery Fleet Rider
                        </span>
                      ) : (
                        <span className="inline-block mt-1 text-[9px] font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                          Verified Customer
                        </span>
                      )}
                    </div>

                    {/* Role Specific Navigation */}
                    {currentUser && (isAdminUser(currentUser.email, currentUser.uid) || currentUser.role === 'admin') && onNavigateToAdmin && (
                      <div className="p-1 bg-purple-50/50 border-b border-purple-100">
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            onNavigateToAdmin();
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 text-xs text-purple-800 hover:bg-purple-100 rounded-lg font-bold transition-colors cursor-pointer"
                          id="profile-dropdown-admin-portal"
                        >
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-purple-700" />
                            <span>Go to Admin Console</span>
                          </div>
                          <span className="text-[9px] bg-purple-700 text-white font-black px-1.5 py-0.5 rounded uppercase">
                            Admin
                          </span>
                        </button>
                      </div>
                    )}

                    {currentUser && (isRiderUser(currentUser.email) || currentUser.role === 'driver') && onNavigateToRider && (
                      <div className="p-1 bg-orange-50/50 border-b border-orange-100">
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            onNavigateToRider();
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 text-xs text-orange-900 hover:bg-orange-100 rounded-lg font-bold transition-colors cursor-pointer"
                          id="profile-dropdown-rider-portal"
                        >
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-orange-600" />
                            <span>Go to Rider Portal</span>
                          </div>
                          <span className="text-[9px] bg-orange-600 text-white font-black px-1.5 py-0.5 rounded uppercase">
                            Rider
                          </span>
                        </button>
                      </div>
                    )}

                    {/* Dropdown Options */}
                    <div className="py-1">
                      <button
                        onClick={navigateToMyOrders}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-gray-700 hover:bg-orange-50/60 hover:text-[#ea580c] font-semibold transition-colors cursor-pointer"
                        id="profile-dropdown-my-orders"
                      >
                        <div className="flex items-center gap-2.5">
                          <ShoppingBag className="w-4 h-4 text-[#ea580c]" />
                          <span>My Orders</span>
                        </div>
                        {myOrdersList.length > 0 ? (
                          <span className="bg-orange-50 text-[#ea580c] border border-orange-100 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {myOrdersList.length}
                          </span>
                        ) : null}
                      </button>

                      <button
                        onClick={navigateToMyRequests}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-gray-700 hover:bg-orange-50/60 hover:text-[#ea580c] font-semibold transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <ClipboardList className="w-4 h-4 text-[#ea580c]" />
                          <span>My Product Requests</span>
                        </div>
                        {myRequestsList.length > 0 ? (
                          <span className="bg-orange-50 text-[#ea580c] border border-orange-100 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {myRequestsList.length}
                          </span>
                        ) : null}
                      </button>

                      <button
                        onClick={() => {
                          setShowAccountModal(true);
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-gray-700 hover:bg-orange-50/60 hover:text-[#ea580c] font-semibold transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <User className="w-4 h-4 text-[#ea580c]" />
                          <span>My Account</span>
                        </div>
                      </button>

                      <button
                        onClick={navigateToFlaggedIssues}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-gray-700 hover:bg-amber-50/60 hover:text-amber-800 font-semibold transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span>Flagged Issues & Alerts</span>
                        </div>
                        {totalFlaggedCount > 0 ? (
                          <span className="bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full animate-pulse">
                            {totalFlaggedCount}
                          </span>
                        ) : null}
                      </button>

                      <button
                        onClick={() => {
                          setShowMessagesModal(true);
                          setShowProfileMenu(false);
                          if (currentUser?.email && markMessagesAsReadByCustomer) {
                            markMessagesAsReadByCustomer(currentUser.email);
                          }
                        }}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-gray-700 hover:bg-orange-50/60 hover:text-[#ea580c] font-semibold transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <MessageSquare className="w-4 h-4 text-[#ea580c]" />
                          <span>Messages</span>
                        </div>
                        {(() => {
                          const unread = messages.filter(m => m.userEmail === currentUser.email && m.sender === 'admin' && !m.readByCustomer).length;
                          return unread > 0 ? (
                            <span className="bg-[#ea580c] text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-bounce">
                              {unread}
                            </span>
                          ) : null;
                        })()}
                      </button>
                    </div>

                    {/* Logout Option */}
                    <div className="pt-1">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          signOut(auth).then(() => {
                            setCurrentUser(null);
                          });
                        }}
                        className="w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span>Logout Account</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsSignUp(false);
                  setShowAuthModal(true);
                }}
                className="px-4 py-2 text-xs font-semibold bg-[#000000] text-white rounded-lg hover:bg-gray-900 transition-all shadow-sm cursor-pointer"
                id="login-trigger"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* STOREWIDE ADMIN NOTICES & FLIGHT DISPATCH NOTIFICATION BANNER */}
      {activeAdminNotices.length > 0 && (
        <aside
          aria-label="Storewide Admin Notices"
          className="w-full bg-linear-to-r from-gray-900 via-gray-950 to-black text-white border-b border-gray-800 shadow-xs relative z-30 transition-all"
          id="storewide-admin-notices-bar"
        >
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              {(() => {
                const notice = activeAdminNotices[0];
                const typeStyles: Record<string, { bg: string; icon: React.ReactNode; label: string }> = {
                  shipping: { bg: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: <Truck className="w-3.5 h-3.5 text-blue-400 shrink-0" />, label: 'AIR FREIGHT' },
                  alert: { bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />, label: 'ADMIN NOTICE' },
                  promotion: { bg: 'bg-orange-500/20 text-orange-300 border-orange-500/30', icon: <Sparkles className="w-3.5 h-3.5 text-orange-400 shrink-0" />, label: 'FLASH PROMO' },
                  info: { bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', icon: <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />, label: 'STORE NOTICE' },
                };
                const config = typeStyles[notice.type] || typeStyles.info;

                return (
                  <>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shrink-0 ${config.bg}`}>
                      {config.icon}
                      <span>{config.label}</span>
                    </span>
                    <div className="min-w-0 flex-1 text-xs">
                      <strong className="text-white font-bold mr-1.5 tracking-tight">{notice.title}:</strong>
                      <span className="text-gray-300 line-clamp-1 sm:line-clamp-none">{notice.message}</span>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {activeAdminNotices.length > 1 && (
                <span className="text-[10px] text-gray-400 font-semibold px-2 py-0.5 bg-white/10 rounded-full hidden sm:inline">
                  {activeAdminNotices.length} active announcements
                </span>
              )}
              <button
                type="button"
                onClick={() => setSelectedAdminNotice(activeAdminNotices[0])}
                className="px-2.5 py-1 text-[11px] font-bold text-orange-400 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Read Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleDismissNotice(activeAdminNotices[0].id)}
                className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
                title="Dismiss this notice for this session"
                aria-label="Dismiss notice"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Categories Sub-nav Bar (Mobile/Tablets) */}
      <nav className="bg-white border-b border-gray-100 py-3 px-4 flex lg:hidden gap-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => {
            setSelectedCategory('all');
            setActiveTab('shop');
          }}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            selectedCategory === 'all' && activeTab === 'shop'
              ? 'bg-[#ea580c] text-white'
              : 'bg-gray-50 text-gray-600'
          }`}
        >
          All Imports
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat.id);
              setActiveTab('shop');
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat.id && activeTab === 'shop'
                ? 'bg-[#ea580c] text-white'
                : 'bg-gray-50 text-gray-600'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* TAB 1: HOME */}
        {activeTab === 'home' && (
          <div className="space-y-12">
            {/* Elegant Hero Showcase */}
            {banner?.isActive !== false && (
              <section className="bg-[#000000] rounded-2xl overflow-hidden relative min-h-[460px] flex flex-col md:flex-row items-center p-8 md:p-12 shadow-xl border border-gray-800">
                {/* Overlay elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#ea580c]/15 rounded-full filter blur-3xl -mr-20 -mt-20"></div>
                
                <div className="flex-1 text-left space-y-6 z-10">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ea580c]/25 text-[#ea580c] text-xs font-semibold tracking-wider uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c] animate-ping" />
                    Premium Retail Delivery
                  </span>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
                    {banner.headline || 'Premium Sourced UK Goods in Kampala'}
                  </h1>
                  <p className="text-gray-300 text-sm md:text-base max-w-lg leading-relaxed">
                    {banner.subtitle || "We offer a personal shopper service for products from the UK, ie bags, shoes, body lotions, shower gels, swimming costumes, Mary Kay products, Avon products, Body shop products, multivitamins, supplements, deodorants, perfumes, L'Oreal, clothes, Clarks shoes and lots more."}
                  </p>
                  {banner.features && banner.features.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {banner.features.map((feat, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/15 backdrop-blur-sm border border-white/15 rounded-full text-xs text-orange-200 font-medium transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#ea580c]" />
                          {feat}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-4 pt-2">
                    <button
                      onClick={() => {
                        setSelectedCategory('all');
                        setActiveTab('shop');
                      }}
                      className="px-6 py-3.5 bg-[#ea580c] text-white text-xs font-semibold rounded-lg hover:bg-orange-700 transition-all flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      {banner.ctaPrimaryText || 'Browse Sourced Catalog'} <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (!requireAuth('submit custom UK product import requests')) return;
                        setImportStep(1);
                        setActiveTab('imports');
                      }}
                      className="px-6 py-3.5 bg-transparent text-white border border-gray-600 text-xs font-semibold rounded-lg hover:bg-white/10 hover:border-white transition-all cursor-pointer"
                    >
                      {banner.ctaSecondaryText || 'Product Request'}
                    </button>
                  </div>
                </div>

                {/* Featured Hero Product Image */}
                <div className="flex-1 flex justify-center items-center mt-8 md:mt-0 relative z-10 w-full max-w-sm md:max-w-md">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-orange-500 rounded-2xl filter blur-2xl opacity-10 group-hover:opacity-20 transition-all"></div>
                    <img
                      src={banner.imageUrl || "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=800"}
                      alt={banner.altText || "UK Sourced Showcase Item"}
                      className="rounded-2xl shadow-2xl border border-gray-800 object-cover max-h-[320px] transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute -bottom-4 -left-4 bg-white/95 backdrop-blur-md border border-gray-100 p-4 rounded-xl shadow-lg flex items-center gap-3">
                      <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{banner.badgeTitle || 'Verification'}</p>
                        <p className="text-xs font-bold text-gray-900">{banner.badgeText || '100% Authentic UK Sourced'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Why Choose UK2UG Grid (No Cargo References) */}
            <section className="space-y-6">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Why Sourcing From UK2UG Matters</h2>
                <p className="text-gray-500 text-xs sm:text-sm">We provide high-end, original items with direct retail purchase receipts from the UK.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    title: 'Authentic UK Products',
                    desc: 'We purchase directly from official UK brand boutiques (Apple, Harrods, Jo Malone, etc.) and supply them with original tags and serial registrations.',
                    icon: <CheckCircle2 className="w-6 h-6 text-[#ea580c]" />
                  },
                  {
                    title: 'Fast Local Delivery',
                    desc: 'Choose premium delivery directly to your home or office address in Kampala, Wakiso, and major surrounding districts with transparent fees.',
                    icon: <Truck className="w-6 h-6 text-[#ea580c]" />
                  },
                  {
                    title: 'In-Store Pickup Available',
                    desc: 'Skip delivery fees completely. Collect your item instantly from our flagship retail space at Thobani Center, Shop 16 Ground Floor, Kampala.',
                    icon: <MapPin className="w-6 h-6 text-[#ea580c]" />
                  },
                  {
                    title: 'Custom Product Request',
                    desc: 'Looking for a specific UK brand product not on our site? Fill in our step-by-step request wizard and let our expert shoppers buy it for you.',
                    icon: <Search className="w-6 h-6 text-[#ea580c]" />
                  }
                ].map((item, idx) => (
                  <div key={idx} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-left space-y-3">
                    <div className="p-2.5 bg-orange-50 rounded-lg w-fit">{item.icon}</div>
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{item.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Flash Deals Carousel Section */}
            {flashDeals.length > 0 && (
              <section
                id="flash-deals-carousel-section"
                onMouseEnter={() => setIsFlashHovered(true)}
                onMouseLeave={() => setIsFlashHovered(false)}
                className="bg-gradient-to-br from-orange-950 via-[#004d40] to-slate-950 text-white rounded-3xl p-5 sm:p-7 shadow-xl border border-orange-800/80 space-y-6 relative overflow-hidden"
              >
                {/* Ambient glow backgrounds */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

                {/* Section Header: Title, Live Countdown & Controls */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10 pb-4 border-b border-orange-800/60">
                  <div className="space-y-1.5 text-left">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-400 to-amber-500 text-orange-950 font-black uppercase text-[10px] rounded-full tracking-wider shadow-sm">
                        <Zap className="w-3.5 h-3.5 fill-orange-950" /> Flash Sale Event
                      </span>
                      <span className="text-xs text-orange-300 font-medium">
                        {flashDeals.length} Exclusive Item{flashDeals.length !== 1 ? 's' : ''} on Sale
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                      Active Sourced Markdown Discounts
                    </h2>
                    <p className="text-orange-200/80 text-xs sm:text-sm max-w-xl leading-relaxed">
                      Authentic high-end UK retail stock at special promotional prices for a limited time.
                    </p>
                  </div>

                  {/* Countdown Timer + Nav Controls */}
                  <div className="flex flex-wrap items-center gap-3.5 self-start lg:self-auto">
                    {/* Countdown Timer */}
                    <div className="flex items-center gap-2.5 bg-black/40 border border-orange-700/50 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-inner">
                      <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <div className="text-center">
                          <span className="font-mono text-base sm:text-lg font-black text-amber-400">
                            {dealTimeLeft.hours.toString().padStart(2, '0')}
                          </span>
                          <span className="block text-[8px] text-orange-300 -mt-1 tracking-tighter uppercase">Hours</span>
                        </div>
                        <span className="text-amber-400 font-bold text-sm">:</span>
                        <div className="text-center">
                          <span className="font-mono text-base sm:text-lg font-black text-amber-400">
                            {dealTimeLeft.minutes.toString().padStart(2, '0')}
                          </span>
                          <span className="block text-[8px] text-orange-300 -mt-1 tracking-tighter uppercase">Mins</span>
                        </div>
                        <span className="text-amber-400 font-bold text-sm">:</span>
                        <div className="text-center">
                          <span className="font-mono text-base sm:text-lg font-black text-amber-400">
                            {dealTimeLeft.seconds.toString().padStart(2, '0')}
                          </span>
                          <span className="block text-[8px] text-orange-300 -mt-1 tracking-tighter uppercase">Secs</span>
                        </div>
                      </div>
                    </div>

                    {/* Carousel Nav Controls */}
                    <div className="flex items-center gap-1.5">
                      <button
                        id="flash-carousel-prev-btn"
                        type="button"
                        onClick={() => handleScrollFlashCarousel('prev')}
                        className="w-9 h-9 rounded-full bg-orange-800/80 hover:bg-orange-700 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 border border-orange-700"
                        title="Previous Flash Deals"
                        aria-label="Previous Flash Deals"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        id="flash-carousel-next-btn"
                        type="button"
                        onClick={() => handleScrollFlashCarousel('next')}
                        className="w-9 h-9 rounded-full bg-orange-800/80 hover:bg-orange-700 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 border border-orange-700"
                        title="Next Flash Deals"
                        aria-label="Next Flash Deals"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Carousel Track */}
                <div className="relative">
                  <div
                    id="flash-carousel-track"
                    ref={flashScrollRef}
                    onScroll={handleFlashScroll}
                    className="flex gap-4 sm:gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-3 pt-1 px-1 -mx-1 scrollbar-none"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {flashDeals.map((prod) => {
                      const hasDiscount = prod.originalPrice && prod.originalPrice > prod.basePrice;
                      const discountPercent = hasDiscount
                        ? Math.round(((prod.originalPrice! - prod.basePrice) / prod.originalPrice!) * 100)
                        : 20;
                      const isOutOfStock = prod.quantity <= 0;
                      const isWishlisted = wishlist.includes(prod.id);
                      const cartItem = cart.find((c) => c.product.id === prod.id);

                      return (
                        <div
                          key={prod.id}
                          id={`flash-deal-card-${prod.id}`}
                          className="w-[85vw] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-14px)] xl:w-[calc(25%-15px)] shrink-0 snap-start bg-white text-gray-900 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group border border-orange-100"
                        >
                          {/* Image Container with Zoom & Tags */}
                          <div
                            className="relative h-52 sm:h-56 bg-gray-50 overflow-hidden cursor-pointer shrink-0"
                            onClick={() => {
                              setActiveImgIdx(0);
                              setViewingProduct(prod);
                            }}
                          >
                            <img
                              src={prod.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'}
                              alt={prod.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />

                            {/* Flash Sale Discount Badge */}
                            <div className="absolute top-3 left-3 z-10">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-red-600 to-amber-600 text-white font-black text-[10px] uppercase tracking-wider rounded-md shadow-md animate-pulse">
                                <Zap className="w-3 h-3 fill-current" />
                                SAVE {discountPercent}%
                              </span>
                            </div>

                            {/* Wishlist Button */}
                            <button
                              type="button"
                              id={`flash-wishlist-${prod.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleWishlist(prod.id);
                              }}
                              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200/70 text-gray-400 hover:text-red-500 hover:bg-white shadow-sm transition-colors cursor-pointer"
                              title="Toggle Wishlist"
                            >
                              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                            </button>

                            {/* Deal Expiration Date Badge */}
                            {prod.flashDealEnd && (
                              <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-black/80 backdrop-blur-md text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center justify-between z-10">
                                <span className="flex items-center gap-1 text-orange-200">
                                  <Clock className="w-3 h-3 text-amber-400" />
                                  Ends:
                                </span>
                                <span className="font-mono text-white font-semibold">
                                  {new Date(prod.flashDealEnd).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Product Info & Pricing */}
                          <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5 text-left bg-white">
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-[#ea580c] uppercase tracking-wider">
                                  {categories.find((c) => c.id === prod.categoryId)?.name ?? 'UK Sourced'}
                                </span>
                                <span className="text-[10px] text-gray-400 font-mono">
                                  Stock: {prod.quantity}
                                </span>
                              </div>

                              <h3
                                onClick={() => {
                                  setActiveImgIdx(0);
                                  setViewingProduct(prod);
                                }}
                                className="font-bold text-sm sm:text-base text-gray-900 line-clamp-2 hover:text-[#ea580c] cursor-pointer transition-colors leading-snug"
                                title={prod.title}
                              >
                                {prod.title}
                              </h3>

                              <div className="flex items-center gap-1.5">
                                <StarRating rating={prod.rating} size={13} />
                                <span className="text-[11px] font-semibold text-gray-500">({prod.rating})</span>
                              </div>
                            </div>

                            <div className="space-y-3 pt-2 border-t border-gray-100">
                              {/* Price */}
                              <div className="flex items-baseline justify-between">
                                <div>
                                  <div className="font-mono text-base sm:text-lg font-black text-[#ea580c]">
                                    UGX {new Intl.NumberFormat('en-UG').format(prod.basePrice)}
                                  </div>
                                  {hasDiscount && (
                                    <span className="font-mono text-xs text-gray-400 line-through">
                                      UGX {new Intl.NumberFormat('en-UG').format(prod.originalPrice!)}
                                    </span>
                                  )}
                                </div>
                                {hasDiscount && (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    -{discountPercent}%
                                  </span>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  id={`flash-details-btn-${prod.id}`}
                                  onClick={() => {
                                    setActiveImgIdx(0);
                                    setViewingProduct(prod);
                                  }}
                                  className="py-2 px-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                                >
                                  <Eye className="w-3.5 h-3.5" /> Details
                                </button>

                                <button
                                  type="button"
                                  id={`flash-add-cart-btn-${prod.id}`}
                                  disabled={isOutOfStock}
                                  onClick={() => handleInitiateAddToCart(prod)}
                                  className={`py-2 px-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs ${
                                    isOutOfStock
                                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                      : 'bg-[#ea580c] hover:bg-orange-700 text-white'
                                  }`}
                                >
                                  <ShoppingBag className="w-3.5 h-3.5" />
                                  {cartItem ? `In Cart (${cartItem.quantity})` : 'Add to Cart'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Carousel Pagination Dots */}
                {flashDeals.length > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-1">
                    {flashDeals.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        id={`flash-carousel-dot-${idx}`}
                        onClick={() => scrollToFlashIndex(idx)}
                        className={`h-2 rounded-full transition-all cursor-pointer ${
                          idx === activeFlashIndex ? 'w-7 bg-amber-400' : 'w-2 bg-orange-800 hover:bg-orange-700'
                        }`}
                        aria-label={`Jump to flash deal slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Featured Sourced Goods Grid */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">Featured UK Sourced Goods</h2>
                  <p className="text-gray-500 text-xs">Direct flagship store items available in stock in Kampala right now.</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setActiveTab('shop');
                  }}
                  className="text-xs font-semibold text-[#ea580c] hover:text-orange-700 flex items-center gap-1 transition-colors"
                >
                  View All Products <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Products Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {products.slice(0, 3).map((prod) => {
                  const hasDiscount = prod.originalPrice && prod.originalPrice > prod.basePrice;
                  const isOutOfStock = prod.quantity <= 0;
                  const discountPercent = hasDiscount ? Math.round(((prod.originalPrice! - prod.basePrice) / prod.originalPrice!) * 100) : 0;

                  return (
                    <div
                      key={prod.id}
                      className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col relative"
                    >
                      {/* Wishlist toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleWishlist(prod.id);
                        }}
                        className="absolute top-3.5 right-3.5 z-10 p-2 rounded-full bg-white/90 backdrop-blur-sm border border-gray-100 text-gray-400 hover:text-red-550 hover:bg-white shadow-sm transition-colors cursor-pointer"
                      >
                        <Heart className={`w-4 h-4 ${wishlist.includes(prod.id) ? 'fill-red-500 text-red-500' : ''}`} />
                      </button>

                      {/* Sale & Pre-Order Badges */}
                      <div className="absolute top-3.5 left-3.5 z-10 flex flex-col gap-1">
                        {isPreOrderActive(prod) && (
                          <div className="flex flex-col gap-1">
                            <span className="px-2.5 py-1 bg-amber-500 text-black text-[10px] font-extrabold uppercase rounded-md tracking-wider flex items-center gap-1 shadow-sm">
                              <Clock className="w-3 h-3" /> Pre-Order
                            </span>
                            {prod.preOrderEstimatedArrival && (
                              <span className="px-2 py-0.5 bg-black/85 backdrop-blur-xs text-amber-300 text-[9px] font-bold rounded flex items-center gap-1 shadow-sm">
                                <Calendar className="w-2.5 h-2.5 text-amber-400" /> Est: {prod.preOrderEstimatedArrival}
                              </span>
                            )}
                          </div>
                        )}
                        {hasDiscount && (
                          <span className="px-2.5 py-1 bg-orange-600 text-white text-[10px] font-bold uppercase rounded-md tracking-wider shadow-sm">
                            SAVE {discountPercent}%
                          </span>
                        )}
                      </div>

                      {/* Image Zoom Hover Container */}
                      <div
                        onClick={() => {
                          setActiveImgIdx(0);
                          setViewingProduct(prod);
                        }}
                        className="relative h-56 bg-gray-50 overflow-hidden cursor-pointer shrink-0"
                      >
                        <img
                          src={prod.images[0]}
                          alt={prod.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>

                      {/* Content details */}
                      <div className="p-5 flex-1 flex flex-col text-left justify-between space-y-4">
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-[#ea580c] uppercase tracking-wider">
                            {categories.find((c) => c.id === prod.categoryId)?.name ?? 'UK Sourced'}
                          </span>
                          <h3
                            onClick={() => {
                              setActiveImgIdx(0);
                              setViewingProduct(prod);
                            }}
                            className="font-bold text-gray-900 text-sm sm:text-base line-clamp-1 hover:text-[#ea580c] cursor-pointer transition-colors"
                          >
                            {prod.title}
                          </h3>
                          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{prod.description}</p>
                          <div className="flex items-center gap-2">
                            <StarRating rating={prod.rating} size={14} />
                            <span className="text-[11px] font-medium text-gray-500">({prod.rating})</span>
                          </div>
                          {isPreOrderActive(prod) && (
                            <div className="bg-amber-50 border border-amber-200/80 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 text-[11px] text-amber-900">
                              <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span className="truncate">
                                Est. Arrival: <strong className="text-amber-950 font-bold">{prod.preOrderEstimatedArrival || '10–14 Days'}</strong>
                              </span>
                            </div>
                          )}

                          {/* Size variations badge preview */}
                          {prod.sizes && prod.sizes.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                              {prod.sizes.some((s) => ['28', '29', '30', '31', '32', '33', '34', '35', '36'].includes(s)) ? (
                                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                                  <Shirt className="w-3 h-3 text-amber-700" /> Waist Sizes: 28–36
                                </span>
                              ) : prod.isFootwear || prod.sizes.some((s) => s.includes('UK') || s.includes('EUR')) ? (
                                <span className="text-[10px] font-bold text-orange-800 bg-orange-50 px-2 py-0.5 rounded border border-orange-200 flex items-center gap-1">
                                  <Footprints className="w-3 h-3 text-[#ea580c]" /> UK & EUR Sizes
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                  {prod.sizes.length} Sizes Active
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="space-y-3 pt-3 border-t border-gray-50">
                          {/* Price Display */}
                          <div className="flex items-baseline gap-2">
                            <FormatCurrency value={prod.basePrice} />
                            {hasDiscount && (
                              <span className="text-xs text-gray-400 line-through">
                                UGX {new Intl.NumberFormat('en-UG').format(prod.originalPrice!)}
                              </span>
                            )}
                          </div>

                          {/* Dynamic Cart action */}
                          {isOutOfStock && !prod.isPreOrder ? (
                            <button
                              onClick={() => {
                                setActiveImgIdx(0);
                                setViewingProduct(prod);
                              }}
                              className="w-full py-2.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                              Notify When Sourced
                            </button>
                          ) : (
                            <button
                              onClick={() => handleInitiateAddToCart(prod)}
                              className="w-full py-2.5 bg-[#ea580c] hover:bg-orange-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              <ShoppingBag className="w-4 h-4" /> Add to Cart
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: SHOP CATALOG */}
        {activeTab === 'shop' && (
          <div className="flex flex-col lg:flex-row gap-8" id="shop-catalog-layout">
            {/* Filters Sidebar */}
            <aside className="w-full lg:w-64 bg-white border border-gray-100 rounded-xl p-6 shadow-sm shrink-0 self-start text-left space-y-6">
              <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                <span className="font-bold text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                  <Filter className="w-4 h-4 text-orange-600" /> Catalog Filters
                </span>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setPriceRange(6000000);
                    setSortBy('newest');
                  }}
                  className="text-[10px] font-semibold text-orange-600 hover:text-orange-800 uppercase tracking-wider"
                >
                  Reset
                </button>
              </div>

              {/* Category selector */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Categories</label>
                <div className="space-y-1.5">
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setOnlyPreOrders(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-between ${
                      selectedCategory === 'all' && !onlyPreOrders
                        ? 'bg-orange-55/60 text-[#ea580c]'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>All Products</span>
                    <span className="bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5 text-[9px] font-bold">
                      {products.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setOnlyPreOrders(!onlyPreOrders)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-between ${
                      onlyPreOrders
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'text-amber-700 bg-amber-50/60 hover:bg-amber-100/50'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      Incoming Pre-Orders
                    </span>
                    <span className="bg-amber-200 text-amber-900 rounded-full px-1.5 py-0.5 text-[9px] font-extrabold">
                      {products.filter((p) => isPreOrderActive(p)).length}
                    </span>
                  </button>
                  {categories.map((cat) => {
                    const count = products.filter((p) => p.categoryId === cat.id).length;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-between ${
                          selectedCategory === cat.id
                            ? 'bg-orange-55/60 text-[#ea580c]'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span className="truncate">{cat.name}</span>
                        <span className="bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5 text-[9px] font-bold">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-3 pt-4 border-t border-gray-50">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Price Threshold</label>
                  <span className="font-mono text-xs font-bold text-[#ea580c]">
                    UGX {new Intl.NumberFormat('en-UG').format(priceRange)}
                  </span>
                </div>
                <input
                  type="range"
                  min="50000"
                  max="6000000"
                  step="50000"
                  value={priceRange}
                  onChange={(e) => setPriceRange(parseInt(e.target.value))}
                  className="w-full accent-[#ea580c] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400 font-semibold font-mono">
                  <span>50k UGX</span>
                  <span>6M UGX</span>
                </div>
              </div>

              {/* Sorting */}
              <div className="space-y-3 pt-4 border-t border-gray-50">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Sort Ordering</label>
                <div className="space-y-1.5">
                  {[
                    { key: 'newest', val: 'Newest Sourced' },
                    { key: 'priceAsc', val: 'Price: Low to High' },
                    { key: 'priceDesc', val: 'Price: High to Low' },
                  ].map((option) => (
                    <button
                      key={option.key}
                      onClick={() => setSortBy(option.key as any)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-between ${
                        sortBy === option.key
                          ? 'bg-orange-55/60 text-[#ea580c]'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {option.val}
                      {sortBy === option.key && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Catalog Grid Area */}
            <div className="flex-1 space-y-6">
              {/* Header stats bar */}
              <div className="bg-white border border-gray-100 rounded-xl px-6 py-4 flex items-center justify-between shadow-sm">
                <p className="text-xs sm:text-sm text-gray-500 font-medium">
                  Showing <span className="text-gray-900 font-bold">{sortedProducts.length}</span> premium items Sourced
                </p>
                {searchQuery && (
                  <span className="text-xs text-gray-400 font-medium truncate max-w-xs">
                    Filtered by "{searchQuery}"
                  </span>
                )}
              </div>

              {sortedProducts.length === 0 ? (
                <div className="bg-white border border-gray-150 rounded-xl py-16 px-4 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center mx-auto">
                    <Info className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="font-bold text-gray-900">No Premium Items Match</h3>
                  <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                    We currently don't have matching items in our store stock. Submit a product request, and our sourcing team will find and procure it for you!
                  </p>
                  <button
                    onClick={() => {
                      if (!requireAuth('submit custom UK product import requests')) return;
                      setImportStep(1);
                      setActiveTab('imports');
                    }}
                    className="px-5 py-2.5 bg-[#ea580c] text-white text-xs font-semibold rounded-lg hover:bg-orange-700 transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
                  >
                    <span>Submit Product Request</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {sortedProducts.map((prod) => {
                    const hasDiscount = prod.originalPrice && prod.originalPrice > prod.basePrice;
                    const isOutOfStock = prod.quantity <= 0;
                    const discountPercent = hasDiscount ? Math.round(((prod.originalPrice! - prod.basePrice) / prod.originalPrice!) * 100) : 0;

                    return (
                      <div
                        key={prod.id}
                        className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col relative"
                      >
                        {/* Wishlist toggle */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleWishlist(prod.id);
                          }}
                          className="absolute top-3.5 right-3.5 z-10 p-2 rounded-full bg-white/90 backdrop-blur-sm border border-gray-100 text-gray-400 hover:text-red-500 hover:bg-white shadow-sm transition-colors cursor-pointer"
                        >
                          <Heart className={`w-4 h-4 ${wishlist.includes(prod.id) ? 'fill-red-500 text-red-500' : ''}`} />
                        </button>

                        {/* Sale & Pre-Order Badges */}
                        <div className="absolute top-3.5 left-3.5 z-10 flex flex-col gap-1">
                          {isPreOrderActive(prod) && (
                            <div className="flex flex-col gap-1">
                              <span className="px-2 py-0.5 bg-amber-500 text-black text-[9px] font-extrabold uppercase rounded tracking-wider flex items-center gap-1 shadow-sm">
                                <Clock className="w-2.5 h-2.5" /> Pre-Order
                              </span>
                              {prod.preOrderEstimatedArrival && (
                                <span className="px-1.5 py-0.5 bg-black/85 backdrop-blur-xs text-amber-300 text-[8.5px] font-bold rounded flex items-center gap-1 shadow-sm">
                                  <Calendar className="w-2.5 h-2.5 text-amber-400" /> Est: {prod.preOrderEstimatedArrival}
                                </span>
                              )}
                            </div>
                          )}
                          {hasDiscount && (
                            <span className="px-2 py-0.5 bg-orange-600 text-white text-[9px] font-bold uppercase rounded tracking-wider shadow-sm">
                              SAVE {discountPercent}%
                            </span>
                          )}
                        </div>

                        {/* Image */}
                        <div
                          onClick={() => {
                            setActiveImgIdx(0);
                            setViewingProduct(prod);
                          }}
                          className="relative h-48 bg-gray-50 overflow-hidden cursor-pointer shrink-0"
                        >
                          <img
                            src={prod.images[0]}
                            alt={prod.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>

                        {/* Details */}
                        <div className="p-4 flex-1 flex flex-col text-left justify-between space-y-4">
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-bold text-[#ea580c] uppercase tracking-wider truncate">
                              {categories.find((c) => c.id === prod.categoryId)?.name ?? 'UK Sourced'}
                              {prod.brand ? ` • ${prod.brand}` : ''}
                            </span>
                            <h3
                              onClick={() => {
                                setActiveImgIdx(0);
                                setViewingProduct(prod);
                              }}
                              className="font-bold text-gray-900 text-sm line-clamp-1 hover:text-[#ea580c] cursor-pointer transition-colors"
                            >
                              {prod.title}
                            </h3>
                            <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">{prod.description}</p>
                            <div className="flex items-center gap-1.5">
                              <StarRating rating={prod.rating} size={12} />
                              <span className="text-[10px] font-medium text-gray-500">({prod.rating})</span>
                            </div>
                            {isPreOrderActive(prod) && (
                              <div className="bg-amber-50 border border-amber-200/80 rounded-md px-2 py-1 flex items-center gap-1 text-[10.5px] text-amber-900">
                                <Calendar className="w-3 h-3 text-amber-600 shrink-0" />
                                <span className="truncate">
                                  Est. Arrival: <strong className="text-amber-950 font-bold">{prod.preOrderEstimatedArrival || '10–14 Days'}</strong>
                                </span>
                              </div>
                            )}

                            {/* Size variations badge preview */}
                            {prod.sizes && prod.sizes.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                {prod.sizes.some((s) => ['28', '29', '30', '31', '32', '33', '34', '35', '36'].includes(s)) ? (
                                  <span className="text-[9.5px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                                    <Shirt className="w-3 h-3 text-amber-700" /> Waist: 28–36
                                  </span>
                                ) : prod.isFootwear || prod.sizes.some((s) => s.includes('UK') || s.includes('EUR')) ? (
                                  <span className="text-[9.5px] font-bold text-orange-800 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200 flex items-center gap-1">
                                    <Footprints className="w-3 h-3 text-[#ea580c]" /> UK & EUR Sizes
                                  </span>
                                ) : (
                                  <span className="text-[9.5px] font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                    {prod.sizes.length} Sizes
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="space-y-3 pt-3 border-t border-gray-50">
                            {/* Price */}
                            <div className="flex items-baseline gap-1.5">
                              <FormatCurrency value={prod.basePrice} />
                              {hasDiscount && (
                                <span className="text-[11px] text-gray-400 line-through">
                                  UGX {new Intl.NumberFormat('en-UG').format(prod.originalPrice!)}
                                </span>
                              )}
                            </div>

                            {/* Cart action */}
                            {isOutOfStock && !prod.isPreOrder ? (
                              <button
                                onClick={() => {
                                  setActiveImgIdx(0);
                                  setViewingProduct(prod);
                                }}
                                className="w-full py-2.5 bg-gray-100 text-gray-600 text-[11px] font-semibold rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                              >
                                Notify When Sourced
                              </button>
                            ) : (
                              <button
                                onClick={() => handleInitiateAddToCart(prod)}
                                className="w-full py-2.5 bg-[#ea580c] hover:bg-orange-700 text-white text-[11px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                              >
                                <ShoppingBag className="w-3.5 h-3.5" /> Add to Cart
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: ORDER & PRODUCT REQUEST TRACKING */}
        {activeTab === 'tracking' && (
          <div className="max-w-2xl mx-auto space-y-6 text-left" id="tracking-portal-layout">
            {/* Tracking Segment Selector */}
            <div className="flex items-center p-1 bg-gray-100 rounded-xl border border-gray-200 gap-1">
              <button
                type="button"
                onClick={() => setTrackingMode('orders')}
                className={`flex-1 py-2.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  trackingMode === 'orders'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-[#ea580c]" />
                <span>Track Orders</span>
              </button>
              <button
                type="button"
                onClick={() => setTrackingMode('requests')}
                className={`flex-1 py-2.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  trackingMode === 'requests'
                    ? 'bg-white text-[#ea580c] shadow-sm'
                    : 'text-gray-500 hover:text-[#ea580c]'
                }`}
              >
                <ClipboardList className="w-4 h-4 text-[#ea580c]" />
                <span>Requests</span>
                {myRequestsList.length > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    trackingMode === 'requests' ? 'bg-orange-50 text-[#ea580c] border border-orange-200' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {myRequestsList.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setTrackingMode('flagged')}
                className={`flex-1 py-2.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  trackingMode === 'flagged'
                    ? 'bg-white text-red-700 shadow-sm'
                    : 'text-gray-500 hover:text-red-700'
                }`}
              >
                <AlertTriangle className={`w-4 h-4 ${totalFlaggedCount > 0 ? 'text-red-600' : 'text-gray-400'}`} />
                <span>Flagged Issues</span>
                {totalFlaggedCount > 0 && (
                  <span className="bg-red-600 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full animate-pulse">
                    {totalFlaggedCount}
                  </span>
                )}
              </button>
            </div>

            {/* 1. ORDER TRACKING MODE - UNAVAILABLE TO PEOPLE WITH ACCOUNTS */}
            {trackingMode === 'orders' && (
              currentUser ? (
                <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-sm animate-fade-in" id="account-holder-tracking-notice">
                  <div className="w-14 h-14 bg-orange-50 text-[#ea580c] rounded-2xl flex items-center justify-center mx-auto border border-orange-100 shadow-inner">
                    <Truck className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900">Order Tracker Unavailable for Account Holders</h3>
                    <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                      Manual order tracking is reserved for guest reference lookups. As an active account holder, all your orders, real-time live dispatches, courier phone contacts, and Safe Handover PINs are automatically tracked directly in your account dashboard.
                    </p>
                  </div>
                  <div className="pt-2 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setShowAccountModal(true)}
                      className="px-5 py-2.5 bg-[#ea580c] hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm flex items-center gap-2"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Open My Orders &amp; Handover PINs</span>
                    </button>
                  </div>
                </div>
              ) : (
              <div className="space-y-8">
                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-4">
              <h2 className="text-xl font-bold tracking-tight text-[#000000]">Secure Order Tracking</h2>
              <p className="text-xs text-gray-500 leading-relaxed">
                Enter your unique reference number structured as <span className="font-mono bg-gray-50 px-1.5 py-0.5 rounded text-gray-700 border border-gray-100">UK2UG-2026-XXXXXX</span> to fetch your real-time processing and delivery status.
              </p>

              <form onSubmit={handleTrackOrder} className="flex gap-2">
                <input
                  type="text"
                  placeholder="UK2UG-2026-XXXXXX"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-mono outline-none focus:bg-white focus:ring-2 focus:ring-[#ea580c]/10 focus:border-[#ea580c] transition-all"
                  required
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#ea580c] text-white text-xs font-semibold rounded-lg hover:bg-orange-700 transition-all cursor-pointer shadow-sm"
                >
                  Fetch Status
                </button>
              </form>

              {trackError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 border border-red-100 rounded-lg text-xs font-medium">
                  <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
                  {trackError}
                </div>
              )}
            </div>

            {trackedOrder && (
              <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-6">
                {/* Header status bar */}
                <div className="flex flex-wrap items-center justify-between border-b border-gray-50 pb-4 gap-2">
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tracking Reference</p>
                    <p className="font-mono text-base font-bold text-[#000000]">{trackedOrder.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Order Status</p>
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                        ['Delivered', 'Picked Up'].includes(trackedOrder.status)
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : ['Processing', 'Ready for Pickup', 'Out for Delivery'].includes(trackedOrder.status)
                          ? 'bg-orange-50 text-orange-800 border border-orange-100'
                          : 'bg-yellow-50 text-yellow-800 border border-yellow-100'
                      }`}
                    >
                      {trackedOrder.status}
                    </span>
                  </div>
                </div>

                {/* Flagged Issue Alert Callout on Tracked Order (Only when Failed or flagged rejection) */}
                {trackedOrder.paymentStatus === 'Failed' && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-red-900 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                        Action Required: Payment Issue Flagged by UK2UG Finance Team
                      </span>
                      <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full font-bold text-[10px] uppercase">
                        Review Needed
                      </span>
                    </div>
                    <p className="text-red-800 text-xs leading-relaxed">
                      {trackedOrder.paymentNotes || 'Your payment reference could not be verified by our finance team. Please update or resubmit your payment details to proceed with dispatch.'}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setFixPaymentOrder(trackedOrder);
                          setFixPaymentMethod(trackedOrder.paymentMethod || 'MTN Mobile Money');
                          setFixPaymentPhone(trackedOrder.paymentPhone || trackedOrder.customerPhone || '');
                          setFixPaymentRef(trackedOrder.paymentTransactionRef || trackedOrder.transactionId || '');
                        }}
                        className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Update Payment Reference</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowMessagesModal(true);
                          setChatInputText(`Hi UK2UG, regarding the flagged payment issue on order #${trackedOrder.id}: `);
                        }}
                        className="px-3.5 py-1.5 bg-white hover:bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-red-600" />
                        <span>Chat with Support</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Pending Verification Notice on Tracked Order */}
                {trackedOrder.paymentStatus === 'Pending Verification' && Boolean(trackedOrder.paymentTransactionRef) && (
                  <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-900 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        Payment Verification Pending
                      </span>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px] uppercase">
                        Pending Verification
                      </span>
                    </div>
                    <p className="text-amber-800 text-xs leading-relaxed">
                      Your payment transaction reference <strong className="font-mono font-bold text-gray-900">({trackedOrder.paymentTransactionRef})</strong> was submitted and is currently being verified by the UK2UG finance desk.
                    </p>
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setFixPaymentOrder(trackedOrder);
                          setFixPaymentMethod(trackedOrder.paymentMethod || 'MTN Mobile Money');
                          setFixPaymentPhone(trackedOrder.paymentPhone || trackedOrder.customerPhone || '');
                          setFixPaymentRef(trackedOrder.paymentTransactionRef || trackedOrder.transactionId || '');
                        }}
                        className="text-[11px] text-amber-700 hover:text-amber-900 font-bold underline cursor-pointer inline-flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Change / Resubmit Reference</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Fulfillment Path Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/70 p-4 rounded-xl border border-gray-100">
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Recipient Details</p>
                    <p className="text-sm font-semibold text-gray-800">{trackedOrder.customerName}</p>
                    <p className="text-xs text-gray-500 font-mono">{trackedOrder.customerPhone}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Fulfillment Path</p>
                    {trackedOrder.deliveryPath === 'pickup' ? (
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-800">
                          <MapPin className="w-3.5 h-3.5 text-[#ea580c]" /> Store Pickup
                        </span>
                        <p className="text-[11px] text-gray-500">
                          Thobani Center Shop 16, Ground Floor, Kampala
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1 text-xs">
                        <span className="inline-flex items-center gap-1 font-bold text-orange-800">
                          <Truck className="w-3.5 h-3.5 text-[#ea580c]" /> Door Delivery
                        </span>
                        <p className="text-gray-600 font-medium">
                          {trackedOrder.deliveryDetails?.district}, {trackedOrder.deliveryDetails?.area}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate">
                          Landmark: {trackedOrder.deliveryDetails?.landmark}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4-Digit Handover Verification PIN Notice */}
                <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left shadow-2xs">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5 uppercase tracking-wider">
                      <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                      {trackedOrder.deliveryPath === 'pickup' ? 'Store Pickup Handover Verification PIN' : 'Doorstep Handover Verification PIN'}
                    </p>
                    <p className="text-xs text-amber-800 leading-relaxed max-w-lg">
                      {trackedOrder.deliveryPath === 'pickup'
                        ? 'Present this automatically generated 4-digit PIN to the Thobani Centre Store Agent upon package collection to authenticate and complete handover.'
                        : 'Provide this automatically generated 4-digit PIN to the UK2UG dispatch courier when they deliver your parcel at your doorstep. This verifies safe package transition.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-xl font-black text-amber-950 tracking-[0.25em] bg-white px-3.5 py-1.5 rounded-lg border border-amber-300 shadow-inner">
                      {trackedOrder.deliveryPin || trackedOrder.id.replace(/\D/g, '').slice(-4)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const pin = trackedOrder.deliveryPin || trackedOrder.id.replace(/\D/g, '').slice(-4);
                        navigator.clipboard.writeText(pin);
                        setCopiedTrackId(`pin-${trackedOrder.id}`);
                        setTimeout(() => setCopiedTrackId(null), 2000);
                      }}
                      className="px-2.5 py-1.5 bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold rounded-lg shadow-2xs cursor-pointer flex items-center gap-1"
                    >
                      {copiedTrackId === `pin-${trackedOrder.id}` ? 'Copied!' : 'Copy PIN'}
                    </button>
                  </div>
                </div>

                {/* Step Flow Indicators */}
                <div className="space-y-4 pt-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Fulfillment Pipeline Timeline</p>
                  <div className="relative">
                    {/* Connection line */}
                    <div className="absolute top-4 left-3 w-0.5 h-[70%] bg-gray-200"></div>

                    {/* Checkpoints based on Path */}
                    {trackedOrder.deliveryPath === 'pickup' ? (
                      <div className="space-y-5 relative">
                        {[
                          { title: 'Order Placed (Pending)', desc: 'Verification check initialized.', stepKeys: ['Pending', 'Paid', 'Ready for Pickup', 'Picked Up'] },
                          { title: 'Payment Secured (Paid)', desc: 'Payment received via secure MTN/Airtel/Card.', stepKeys: ['Paid', 'Ready for Pickup', 'Picked Up'] },
                          { title: 'Ready for Pickup', desc: 'Your item is ready for pickup at our shop located at Thobani Center shop 16 ground floor, Kampala.', stepKeys: ['Ready for Pickup', 'Picked Up'] },
                          { title: 'Picked Up', desc: 'Secure hand-over completed. Thank you for shopping with UK2UG!', stepKeys: ['Picked Up'] },
                        ].map((node, i) => {
                          const isActive = node.stepKeys.includes(trackedOrder.status);
                          return (
                            <div key={i} className="flex gap-4 items-start">
                              <div
                                className={`w-6.5 h-6.5 rounded-full flex items-center justify-center border-2 shrink-0 z-10 ${
                                  isActive
                                    ? 'bg-[#ea580c] border-[#ea580c] text-white shadow-sm'
                                    : 'bg-white border-gray-200 text-gray-300'
                                }`}
                              >
                                {isActive ? <Check className="w-3.5 h-3.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />}
                              </div>
                              <div className="text-left">
                                <p className={`text-xs sm:text-sm font-bold ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                                  {node.title}
                                </p>
                                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{node.desc}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-5 relative">
                        {[
                          { title: 'Order Placed (Pending)', desc: 'Verification check initialized.', stepKeys: ['Pending', 'Paid', 'Processing', 'Out for Delivery', 'Delivered'] },
                          { title: 'Payment Secured (Paid)', desc: 'Payment authenticated.', stepKeys: ['Paid', 'Processing', 'Out for Delivery', 'Delivered'] },
                          { title: 'Processing & Packaged', desc: 'We are preparing your premium items for local dispatch routing.', stepKeys: ['Processing', 'Out for Delivery', 'Delivered'] },
                          { title: 'Out for Delivery', desc: 'Our delivery rider is heading to your designated landmark address.', stepKeys: ['Out for Delivery', 'Delivered'] },
                          { title: 'Delivered Successfully', desc: 'Item hand-over confirmed. Thank you!', stepKeys: ['Delivered'] },
                        ].map((node, i) => {
                          const isActive = node.stepKeys.includes(trackedOrder.status);
                          return (
                            <div key={i} className="flex gap-4 items-start">
                              <div
                                className={`w-6.5 h-6.5 rounded-full flex items-center justify-center border-2 shrink-0 z-10 ${
                                  isActive
                                    ? 'bg-[#ea580c] border-[#ea580c] text-white shadow-sm'
                                    : 'bg-white border-gray-200 text-gray-300'
                                }`}
                              >
                                {isActive ? <Check className="w-3.5 h-3.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />}
                              </div>
                              <div className="text-left">
                                <p className={`text-xs sm:text-sm font-bold ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                                  {node.title}
                                </p>
                                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{node.desc}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Items in tracking order */}
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Order Items Summary</p>
                  <div className="space-y-2.5">
                    {trackedOrder.items.map((item, idx) => {
                      const prod = products.find((p) => p.id === item.productId);
                      const isPreOrder = item.isPreOrder || (prod && isPreOrderActive(prod)) || prod?.isPreOrder;
                      const estArrival = item.preOrderEstimatedArrival || prod?.preOrderEstimatedArrival;
                      return (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between text-xs py-2 border-b border-gray-50 last:border-0 gap-1.5">
                          <div>
                            <p className="text-gray-800 font-semibold line-clamp-1 max-w-[280px]">
                              {item.title} <span className="text-gray-400 font-medium">x{item.quantity}</span>
                            </p>
                            {isPreOrder && (
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                  <Clock className="w-2.5 h-2.5 text-amber-600" /> Pre-Order
                                </span>
                                <span className="text-[10px] font-semibold text-purple-900 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
                                  Est. Arrival: {estArrival || '10–14 Days'}
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="font-mono text-gray-900 font-semibold shrink-0">
                            UGX {new Intl.NumberFormat('en-UG').format(item.price * item.quantity)}
                          </p>
                        </div>
                      );
                    })}
                    <div className="flex justify-between items-center text-sm pt-2 font-bold text-gray-900">
                      <span>Total Invoice</span>
                      <span>UGX {new Intl.NumberFormat('en-UG').format(trackedOrder.totalAmount)}</span>
                    </div>

                    {isOrderDone(trackedOrder) && (
                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-500">Order Record Management:</span>
                        {getOrderExecutionDays(trackedOrder) >= 10 ? (
                          <button
                            type="button"
                            onClick={() => setOrderToDelete(trackedOrder)}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                            title="Executed over 10 days ago — Customer privilege to delete this order record"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                            <span>Delete Order Record</span>
                          </button>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200"
                            title="Customer deletion privilege unlocks 10 days after order execution for warranty and audit safety."
                          >
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span>Deletable in {10 - getOrderExecutionDays(trackedOrder)} day{10 - getOrderExecutionDays(trackedOrder) === 1 ? '' : 's'}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* My Order History Section */}
            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-6" id="my-orders-history-section">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#ea580c]" />
                    My Orders & Tracking History
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    View your order records, purchased products, and product track order numbers.
                  </p>
                </div>
                {myOrdersList.length > 0 && (
                  <span className="px-2.5 py-1 bg-orange-50 text-[#ea580c] font-bold text-xs rounded-full border border-orange-100">
                    {myOrdersList.length} {myOrdersList.length === 1 ? 'Order' : 'Orders'}
                  </span>
                )}
              </div>

              {myOrdersList.length === 0 ? (
                <div className="text-center py-8 bg-gray-50/60 rounded-xl border border-dashed border-gray-200 p-6 space-y-3">
                  <div className="w-12 h-12 bg-white text-gray-400 rounded-full flex items-center justify-center mx-auto shadow-2xs border border-gray-100">
                    <Clock className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-gray-700">No Orders Found</p>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                    {currentUser
                      ? "You haven't placed any orders with this account yet. When you make a purchase, your orders and track numbers will be listed here."
                      : "Sign in or place an order to automatically save your order history and track numbers on this device."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myOrdersList.map((ord) => (
                    <div key={ord.id} className="bg-gray-50/50 hover:bg-gray-50 border border-gray-150 rounded-xl p-4 sm:p-5 transition-all space-y-4">
                      {/* Top Bar: Track Order Number & Status */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200/60 pb-3">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Product Track Order Number</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm sm:text-base font-extrabold text-[#ea580c] bg-orange-50/80 px-2.5 py-1 rounded-md border border-orange-200/70 select-all">
                              {ord.id}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(ord.id);
                                setCopiedTrackId(ord.id);
                                setTimeout(() => setCopiedTrackId(null), 2000);
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-orange-50 text-[#ea580c] border border-orange-200 text-[11px] font-bold rounded-md shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                            >
                              {copiedTrackId === ord.id ? 'Copied!' : 'Copy Number'}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 font-medium">{ord.date}</span>
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              ['Delivered', 'Picked Up'].includes(ord.status)
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : ['Processing', 'Ready for Pickup', 'Out for Delivery'].includes(ord.status)
                                ? 'bg-orange-50 text-orange-800 border border-orange-100'
                                : 'bg-yellow-50 text-yellow-800 border border-yellow-100'
                            }`}
                          >
                            {ord.status}
                          </span>
                        </div>
                      </div>

                      {/* Flagged Issue Alert Callout if payment failed or flagged by admin */}
                      {ord.paymentStatus === 'Failed' && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-red-900 flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                              Issue Flagged by UK2UG Finance & Verification
                            </span>
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full font-bold text-[10px] uppercase">
                              Action Required
                            </span>
                          </div>
                          <p className="text-red-800 text-[11px] leading-relaxed">
                            {ord.paymentNotes || 'Your payment transaction reference could not be verified. Please submit your updated transaction details or contact support.'}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setFixPaymentOrder(ord);
                                setFixPaymentMethod(ord.paymentMethod || 'MTN Mobile Money');
                                setFixPaymentPhone(ord.paymentPhone || ord.customerPhone || '');
                                setFixPaymentRef(ord.paymentTransactionRef || ord.transactionId || '');
                              }}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Update Payment Reference</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowMessagesModal(true);
                                setChatInputText(`Hi UK2UG, regarding the flagged issue on Order #${ord.id}: `);
                              }}
                              className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-700 border border-red-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-red-600" />
                              <span>Chat with Support</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Pending Verification Notice in My Orders List */}
                      {ord.paymentStatus === 'Pending Verification' && Boolean(ord.paymentTransactionRef) && (
                        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-900 flex items-center gap-1.5 text-[11px]">
                              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              Payment Verification in Progress
                            </span>
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[9px] uppercase">
                              Pending Review
                            </span>
                          </div>
                          <p className="text-amber-800 text-[11px] leading-relaxed">
                            Transaction Reference: <strong className="font-mono font-bold text-gray-900">{ord.paymentTransactionRef}</strong> was resubmitted. Verification in progress by Finance.
                          </p>
                          <div className="pt-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                setFixPaymentOrder(ord);
                                setFixPaymentMethod(ord.paymentMethod || 'MTN Mobile Money');
                                setFixPaymentPhone(ord.paymentPhone || ord.customerPhone || '');
                                setFixPaymentRef(ord.paymentTransactionRef || ord.transactionId || '');
                              }}
                              className="text-[10px] text-amber-700 hover:text-amber-900 font-bold underline cursor-pointer"
                            >
                              Edit / Resubmit Reference
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Purchased Items List */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Purchased Products ({ord.items.length})</span>
                        <div className="divide-y divide-gray-100 bg-white rounded-lg border border-gray-100 p-3 space-y-2">
                          {ord.items.map((item, i) => {
                            const prod = products.find(p => p.id === item.productId);
                            const isPreOrder = item.isPreOrder || (prod && isPreOrderActive(prod)) || prod?.isPreOrder;
                            const estArrival = item.preOrderEstimatedArrival || prod?.preOrderEstimatedArrival;
                            return (
                              <div key={i} className="flex items-center justify-between text-xs pt-2 first:pt-0">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {prod?.images?.[0] ? (
                                    <img src={prod.images[0]} alt={item.title} className="w-10 h-10 object-cover rounded border border-gray-100 shrink-0" />
                                  ) : (
                                    <div className="w-10 h-10 bg-orange-50 text-[#ea580c] rounded flex items-center justify-center font-bold text-xs shrink-0">
                                      UK
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <p className="font-semibold text-gray-900 truncate max-w-[200px] sm:max-w-[320px]">{item.title}</p>
                                    <p className="text-[11px] text-gray-400">Qty: {item.quantity} × UGX {new Intl.NumberFormat('en-UG').format(item.price)}</p>
                                    {isPreOrder && (
                                      <p className="text-[10px] text-purple-700 font-semibold flex items-center gap-1 mt-0.5">
                                        <Clock className="w-2.5 h-2.5 text-purple-600" /> Pre-Order • Est. Arrival: {estArrival || '10–14 Days'}
                                      </p>
                                    )}
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

                      {/* Footer Info & Track Action */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-200/50">
                        <div className="text-xs text-gray-500">
                          Total Invoice: <span className="font-bold text-gray-900 font-mono">UGX {new Intl.NumberFormat('en-UG').format(ord.totalAmount)}</span>
                          {ord.deliveryPath === 'pickup' ? (
                            <>
                              <span className="ml-2 text-[11px] text-orange-700 bg-orange-50 px-2 py-0.5 rounded font-semibold">Store Pickup</span>
                              <span className="ml-1.5 inline-flex items-center gap-1 text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-mono font-bold border border-amber-200">
                                <ShieldCheck className="w-3 h-3 text-amber-700" /> Handover PIN: {ord.deliveryPin || ord.id.replace(/\D/g, '').slice(-4)}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="ml-2 text-[11px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded font-semibold">Door Delivery ({ord.deliveryDetails?.district})</span>
                              <span className="ml-1.5 inline-flex items-center gap-1 text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-mono font-bold border border-amber-200">
                                <ShieldCheck className="w-3 h-3 text-amber-700" /> Handover PIN: {ord.deliveryPin || ord.id.replace(/\D/g, '').slice(-4)}
                              </span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {isOrderDone(ord) && (
                            getOrderExecutionDays(ord) >= 10 ? (
                              <button
                                type="button"
                                onClick={() => setOrderToDelete(ord)}
                                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                                title="Executed over 10 days ago — Customer privilege to delete this order record"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                <span>Delete Record</span>
                              </button>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-gray-100 px-2.5 py-1.5 rounded-lg border border-gray-200"
                                title="Customer deletion privilege unlocks 10 days after order execution for warranty and audit safety."
                              >
                                <Clock className="w-3 h-3 text-gray-400" />
                                <span>Deletable in {10 - getOrderExecutionDays(ord)}d</span>
                              </span>
                            )
                          )}

                          {!currentUser ? (
                            <button
                              type="button"
                              onClick={() => {
                                setTrackingNumber(ord.id);
                                setTrackedOrder(ord);
                                setTrackError('');
                                const elem = document.getElementById('tracking-portal-layout');
                                if (elem) elem.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="px-3.5 py-1.5 bg-[#ea580c] hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              Track Order Status <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-[11px] font-bold text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-2xs flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Live Handover Tracking</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          )
        )}

            {/* 2. PRODUCT REQUEST TRACKING MODE */}
            {trackingMode === 'requests' && (
              <div className="space-y-8" id="product-request-tracking-view">
                {/* Search / Lookup Box */}
                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold tracking-tight text-[#000000] flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-[#ea580c]" />
                      Track Product Sourcing Requests
                    </h2>
                    <span className="text-[10px] font-bold bg-orange-50 text-[#ea580c] border border-orange-100 px-2.5 py-1 rounded-full">
                      UK Sourcing Status
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Enter your unique request reference structured as <span className="font-mono bg-gray-50 px-1.5 py-0.5 rounded text-gray-700 border border-gray-100">UK2UG-REQ-XXXXXX</span> to check pricing quotes, verification details, and cargo dispatch.
                  </p>

                  <form onSubmit={(e) => handleTrackRequest(e)} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="UK2UG-REQ-XXXXXX"
                      value={requestTrackingRef}
                      onChange={(e) => setRequestTrackingRef(e.target.value)}
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-mono outline-none focus:bg-white focus:ring-2 focus:ring-[#ea580c]/10 focus:border-[#ea580c] transition-all"
                      required
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#ea580c] text-white text-xs font-semibold rounded-lg hover:bg-orange-700 transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Fetch Status</span>
                    </button>
                  </form>

                  {requestTrackError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 border border-red-100 rounded-lg text-xs font-medium">
                      <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
                      {requestTrackError}
                    </div>
                  )}

                  {/* Quick Select from User's Requests */}
                  {myRequestsList.length > 0 && (
                    <div className="pt-2 border-t border-gray-100 space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Your Recent Requests ({myRequestsList.length}):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {myRequestsList.map((req) => (
                          <button
                            key={req.id}
                            type="button"
                            onClick={() => handleTrackRequest(undefined, req.id)}
                            className={`text-xs px-3 py-1.5 rounded-lg border font-mono transition-all flex items-center gap-2 cursor-pointer ${
                              trackedRequest?.id === req.id
                                ? 'bg-[#ea580c] text-white border-[#ea580c] shadow-xs'
                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-orange-400 hover:bg-orange-50/50'
                            }`}
                          >
                            <span className="font-bold">{req.id}</span>
                            <span className="font-sans text-[11px] text-gray-500 truncate max-w-[120px]">{req.productName}</span>
                            <span className={`text-[9px] font-sans font-bold px-1.5 py-0.2 rounded-full ${
                              trackedRequest?.id === req.id
                                ? 'bg-white/20 text-white'
                                : req.status === 'Quoted'
                                ? 'bg-orange-100 text-orange-800'
                                : req.status === 'Completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {req.status}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tracked Request Detail Card */}
                {trackedRequest && (
                  <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-6">
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-4 gap-2">
                      <div className="space-y-1">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Product Request Reference</p>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-base sm:text-lg font-bold text-[#000000]">{trackedRequest.id}</p>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(trackedRequest.id);
                              setCopiedTrackId(trackedRequest.id);
                              setTimeout(() => setCopiedTrackId(null), 2000);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                            title="Copy reference code"
                          >
                            {copiedTrackId === trackedRequest.id ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <ClipboardList className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Current Pipeline Status</p>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                            trackedRequest.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : trackedRequest.status === 'Quoted'
                              ? 'bg-orange-50 text-orange-800 border border-orange-200'
                              : trackedRequest.status === 'Ordered'
                              ? 'bg-blue-50 text-blue-700 border border-blue-100'
                              : 'bg-yellow-50 text-yellow-800 border border-yellow-100'
                          }`}
                        >
                          {trackedRequest.status === 'Pending' ? 'Reviewing Specifications' : trackedRequest.status}
                        </span>
                      </div>
                    </div>

                    {/* Sourcing Price Quote Banner */}
                    {trackedRequest.quotePrice ? (
                      <div className="bg-orange-50/90 border-2 border-orange-200 rounded-xl p-5 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-800">
                              Official Sourcing Price Quote
                            </span>
                            <div className="font-mono text-2xl font-black text-[#ea580c] mt-0.5">
                              UGX {trackedRequest.quotePrice.toLocaleString()}
                            </div>
                          </div>
                          <span className="text-xs font-bold bg-[#ea580c] text-white px-3 py-1 rounded-full shadow-xs">
                            Quote Ready
                          </span>
                        </div>
                        <p className="text-xs text-orange-900 leading-relaxed">
                          Our UK procurement team has verified this item and calculated the total cost, including UK purchase, air freight logistics, and Uganda customs clearance.
                        </p>
                        <div className="flex flex-wrap gap-2.5 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              const msg = encodeURIComponent(
                                `Hello UK2UG! I am ready to confirm my product request ${trackedRequest.id} for "${trackedRequest.productName}" quoted at UGX ${trackedRequest.quotePrice?.toLocaleString()}.`
                              );
                              window.open(`https://wa.me/256747209772?text=${msg}`, '_blank');
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <MessageCircle className="w-4 h-4" />
                            Accept & Proceed via WhatsApp
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowMessagesModal(true);
                              setChatInputText(`Hi UK2UG, I have a question regarding my quote for request ${trackedRequest.id} (${trackedRequest.productName}).`);
                            }}
                            className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <MessageSquare className="w-4 h-4 text-[#ea580c]" />
                            Message Sourcing Agent
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 flex items-start gap-3">
                        <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-xs">
                          <p className="font-bold text-amber-900">Procurement Assessment in Progress</p>
                          <p className="text-amber-800/80 mt-0.5 leading-relaxed">
                            Our team is checking UK retailer availability, live promotional pricing, and air-cargo space. Your exact UGX price quote will be updated here once verified.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Sourcing Timeline Progress */}
                    <div className="space-y-4 pt-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        Product Request Pipeline Timeline
                      </p>
                      <div className="space-y-5 relative">
                        <div className="absolute top-4 left-3 w-0.5 h-[80%] bg-gray-200"></div>

                        {[
                          {
                            title: '1. Request Received & Logged',
                            desc: `Your item specifications and photos were registered on ${trackedRequest.date}.`,
                            isDone: true,
                          },
                          {
                            title: '2. UK Sourcing & Verification',
                            desc: 'Procurement team evaluates item specifications, genuine UK supplier stock, and weight parameters.',
                            isDone: ['Quoted', 'Ordered', 'Completed'].includes(trackedRequest.status) || trackedRequest.status === 'Pending',
                          },
                          {
                            title: '3. Price Quote Issued',
                            desc: trackedRequest.quotePrice
                              ? `Quote formulated at UGX ${trackedRequest.quotePrice.toLocaleString()}.`
                              : 'Pending final pricing calculation.',
                            isDone: ['Quoted', 'Ordered', 'Completed'].includes(trackedRequest.status),
                          },
                          {
                            title: '4. Procured & In Transit from UK',
                            desc: 'Item purchased from verified UK vendor and booked onto flight to Entebbe/Kampala.',
                            isDone: ['Ordered', 'Completed'].includes(trackedRequest.status),
                          },
                          {
                            title: '5. Ready for Pickup / Out for Delivery',
                            desc: 'Item arrived at Thobani Center Shop 16, Ground Floor, Kampala.',
                            isDone: trackedRequest.status === 'Completed',
                          },
                        ].map((node, i) => (
                          <div key={i} className="flex gap-4 items-start relative z-10">
                            <div
                              className={`w-6.5 h-6.5 rounded-full flex items-center justify-center border-2 shrink-0 ${
                                node.isDone
                                  ? 'bg-[#ea580c] border-[#ea580c] text-white shadow-xs'
                                  : 'bg-white border-gray-200 text-gray-300'
                              }`}
                            >
                              {node.isDone ? <Check className="w-3.5 h-3.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />}
                            </div>
                            <div className="text-left">
                              <p className={`text-xs sm:text-sm font-bold ${node.isDone ? 'text-gray-900' : 'text-gray-400'}`}>
                                {node.title}
                              </p>
                              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{node.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sourced Item Parameters & Product Photos */}
                    <div className="border-t border-gray-100 pt-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                          Sourced Item Specifications
                        </p>
                        <span className="font-mono text-xs font-bold text-gray-700">
                          Quantity: {trackedRequest.quantity} unit{trackedRequest.quantity > 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-150 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-base font-bold text-gray-900">{trackedRequest.productName}</h4>
                          {trackedRequest.productLink && (
                            <a
                              href={trackedRequest.productLink}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="inline-flex items-center gap-1 text-xs text-[#ea580c] font-semibold hover:underline"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              View UK Web Link
                            </a>
                          )}
                        </div>

                        {/* Product Photos (Displaying at least 2 images with zoom) */}
                        {(() => {
                          const photos = [
                            ...(trackedRequest.images || []),
                            trackedRequest.imageUrl,
                            trackedRequest.imageUrl2,
                          ].filter((url, idx, self) => Boolean(url) && self.indexOf(url) === idx) as string[];

                          if (photos.length === 0) return null;

                          return (
                            <div className="space-y-2 pt-2 border-t border-gray-200/60">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1">
                                  <ImageIcon className="w-3.5 h-3.5 text-[#ea580c]" />
                                  Attached Photos ({photos.length})
                                </span>
                                <span className="text-gray-400">Click photo to zoom</span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {photos.map((url, pIdx) => (
                                  <div
                                    key={pIdx}
                                    onClick={() => setCustomerLightboxImage(url)}
                                    className="group relative h-28 sm:h-32 bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer shadow-2xs hover:border-[#ea580c] transition-colors flex items-center justify-center"
                                  >
                                    <img
                                      src={url}
                                      alt={`Photo ${pIdx + 1}`}
                                      className="w-full h-full object-contain p-1.5 group-hover:scale-105 transition-transform"
                                      onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80';
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <Maximize2 className="w-5 h-5 text-white drop-shadow" />
                                    </div>
                                    <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.2 rounded">
                                      #{pIdx + 1}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Specs text */}
                        <div className="pt-2 border-t border-gray-200/60 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            Color, Size, and Model Parameters
                          </span>
                          <p className="text-xs text-gray-800 font-mono bg-white p-3 rounded-lg border border-gray-200 whitespace-pre-wrap leading-relaxed">
                            {trackedRequest.description || 'No specific parameters noted.'}
                          </p>
                        </div>

                        {trackedRequest.notes && (
                          <div className="pt-2 border-t border-gray-200/60 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                              Your Sourcing Notes
                            </span>
                            <p className="text-xs text-gray-700 bg-white p-2.5 rounded-lg border border-gray-200">
                              {trackedRequest.notes}
                            </p>
                          </div>
                        )}

                        {isRequestDone(trackedRequest) && (
                          <div className="pt-3 border-t border-gray-200/60 flex items-center justify-between">
                            <span className="text-xs text-gray-500">Request Record Management:</span>
                            {getRequestExecutionDays(trackedRequest) >= 10 ? (
                              <button
                                type="button"
                                onClick={() => setRequestToDelete(trackedRequest)}
                                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                                title="Executed over 10 days ago — Customer privilege to delete this request record"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                <span>Delete Request Record</span>
                              </button>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200"
                                title="Customer deletion privilege unlocks 10 days after completion."
                              >
                                <Clock className="w-3 h-3 text-gray-400" />
                                <span>Deletable in {10 - getRequestExecutionDays(trackedRequest)} day{10 - getRequestExecutionDays(trackedRequest) === 1 ? '' : 's'}</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* My Product Requests History List */}
                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-6" id="my-requests-history-section">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-[#ea580c]" />
                        My Product Requests & Sourcing History
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        All custom product requests you have submitted to our UK sourcing desk.
                      </p>
                    </div>
                    {myRequestsList.length > 0 && (
                      <span className="px-2.5 py-1 bg-orange-50 text-[#ea580c] font-bold text-xs rounded-full border border-orange-100">
                        {myRequestsList.length} {myRequestsList.length === 1 ? 'Request' : 'Requests'}
                      </span>
                    )}
                  </div>

                  {myRequestsList.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50/60 rounded-xl border border-dashed border-gray-200 p-6 space-y-3">
                      <div className="w-12 h-12 bg-white text-gray-400 rounded-full flex items-center justify-center mx-auto shadow-2xs border border-gray-100">
                        <ClipboardList className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-gray-700">No Product Requests Found</p>
                      <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                        You haven't submitted any custom product sourcing requests yet. Click the button below to request any UK product!
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (!requireAuth('submit custom UK product import requests')) return;
                          setImportStep(1);
                          setActiveTab('imports');
                        }}
                        className="mt-2 px-4 py-2 bg-[#ea580c] text-white text-xs font-bold rounded-lg hover:bg-orange-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
                      >
                        <span>Submit a Product Request</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {myRequestsList.map((req) => (
                        <div key={req.id} className="bg-gray-50/50 hover:bg-gray-50 border border-gray-150 rounded-xl p-4 sm:p-5 transition-all space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200/60 pb-3">
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Request Reference Code</span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm sm:text-base font-extrabold text-[#ea580c] bg-orange-50/80 px-2.5 py-1 rounded-md border border-orange-200/70 select-all">
                                  {req.id}
                                </span>
                                <span className="text-xs text-gray-400 font-medium">({req.date})</span>
                              </div>
                            </div>
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                                req.status === 'Completed'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : req.status === 'Quoted'
                                  ? 'bg-orange-50 text-orange-800 border border-orange-200'
                                  : req.status === 'Ordered'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                  : 'bg-yellow-50 text-yellow-800 border border-yellow-100'
                              }`}
                            >
                              {req.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-white border border-gray-200 shrink-0 flex items-center justify-center shadow-2xs">
                              {req.imageUrl ? (
                                <img
                                  src={req.imageUrl}
                                  alt={req.productName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80';
                                  }}
                                />
                              ) : (
                                <ShoppingBag className="w-5 h-5 text-gray-400" />
                              )}
                              {((req.images && req.images.length > 1) || req.imageUrl2) && (
                                <span className="absolute bottom-0 right-0 bg-[#ea580c] text-white text-[8px] font-bold px-1 rounded-tl">
                                  2+
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-sm text-gray-900 truncate">{req.productName}</h4>
                              <p className="text-[11px] text-gray-500 line-clamp-1">{req.description}</p>
                              <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-0.5">
                                <span>Quantity: <strong className="text-gray-800">{req.quantity}</strong></span>
                                <span>•</span>
                                <span>Quote: <strong className="text-[#ea580c] font-mono">{req.quotePrice ? `UGX ${req.quotePrice.toLocaleString()}` : 'Under Review'}</strong></span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-200/50">
                            <span className="text-[11px] text-gray-500">
                              {req.quotePrice ? (
                                <span className="text-emerald-700 font-bold">Quote finalized — Ready to order</span>
                              ) : (
                                <span>Awaiting pricing evaluation</span>
                              )}
                            </span>
                            <div className="flex items-center gap-2">
                              {isRequestDone(req) && (
                                getRequestExecutionDays(req) >= 10 ? (
                                  <button
                                    type="button"
                                    onClick={() => setRequestToDelete(req)}
                                    className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                                    title="Executed over 10 days ago — Customer privilege to delete this request record"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                    <span>Delete Request</span>
                                  </button>
                                ) : (
                                  <span
                                    className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-gray-100 px-2.5 py-1.5 rounded-lg border border-gray-200"
                                    title="Customer deletion privilege unlocks 10 days after completion."
                                  >
                                    <Clock className="w-3 h-3 text-gray-400" />
                                    <span>Deletable in {10 - getRequestExecutionDays(req)}d</span>
                                  </span>
                                )
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setRequestTrackingRef(req.id);
                                  setTrackedRequest(req);
                                  setRequestTrackError('');
                                  const elem = document.getElementById('tracking-portal-layout');
                                  if (elem) elem.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="px-3.5 py-1.5 bg-[#ea580c] hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                              >
                                Track Request Status <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. FLAGGED ISSUES & QA MODE */}
            {trackingMode === 'flagged' && (
              <div className="space-y-6" id="flagged-issues-portal-view">
                {/* Header Summary */}
                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <h2 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        Flagged Issues, Alerts & Resolution Desk
                      </h2>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Track payment transaction issues flagged by the finance team, delivery exceptions, and review responses to your lodged customer complaints.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveHelpModal('report')}
                      className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>File New Complaint / Report</span>
                    </button>
                  </div>

                  {/* Summary Metric Counters */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                    <div className="p-3 bg-red-50/70 border border-red-200/80 rounded-xl text-center">
                      <p className="text-lg font-bold text-red-700">{flaggedOrders.length}</p>
                      <p className="text-[10px] text-red-600 font-bold uppercase tracking-wider">Flagged Orders</p>
                    </div>
                    <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-center">
                      <p className="text-lg font-bold text-amber-800">
                        {customerComplaints.filter((c) => c.status === 'Open' || c.status === 'Under Review' || c.status === 'In Progress').length}
                      </p>
                      <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">Active Complaints</p>
                    </div>
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-center">
                      <p className="text-lg font-bold text-emerald-800">
                        {customerComplaints.filter((c) => c.status === 'Resolved' || c.status === 'Closed').length}
                      </p>
                      <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Resolved</p>
                    </div>
                  </div>
                </div>

                {/* Section 1: Orders with Flagged Issues */}
                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-red-600" />
                      Orders Requiring Customer Attention ({flaggedOrders.length})
                    </h3>
                  </div>

                  {flaggedOrders.length === 0 ? (
                    <div className="p-5 bg-emerald-50/50 border border-emerald-100 rounded-xl text-center space-y-1">
                      <p className="text-xs font-bold text-emerald-900 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        No Flagged Order Issues
                      </p>
                      <p className="text-[11px] text-emerald-700">
                        All your submitted payments have been verified or are in standard processing.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {flaggedOrders.map((ord) => (
                        <div key={ord.id} className="p-4 bg-red-50/40 border border-red-200 rounded-xl space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-red-100 pb-2.5">
                            <div>
                              <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider block">Order Code</span>
                              <span className="font-mono text-sm font-extrabold text-red-950">#{ord.id}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider block">Status</span>
                              <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[11px] font-bold rounded-full">
                                {ord.paymentStatus || 'Payment Issue'}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1.5 text-xs">
                            <div className="flex items-start gap-2 bg-white p-3 rounded-lg border border-red-200">
                              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                              <div className="space-y-0.5">
                                <span className="font-bold text-red-900 text-xs block">Official Verification Note:</span>
                                <p className="text-red-800 text-[11px] leading-relaxed">
                                  {ord.paymentNotes || 'Your payment transaction reference could not be verified by our finance team. Please resubmit your transaction ID to proceed.'}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-gray-600">
                              <div>
                                <span className="text-gray-400 block text-[10px]">Payment Method:</span>
                                <strong className="text-gray-800">{ord.paymentMethod}</strong>
                              </div>
                              <div>
                                <span className="text-gray-400 block text-[10px]">Submitted Ref:</span>
                                <strong className="font-mono text-gray-800">{ord.paymentTransactionRef || ord.transactionId || 'None'}</strong>
                              </div>
                              <div>
                                <span className="text-gray-400 block text-[10px]">Total Due:</span>
                                <strong className="font-mono text-gray-900">UGX {ord.totalAmount.toLocaleString()}</strong>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-red-100">
                            <span className="text-[11px] text-red-700 font-medium">
                              Prompt resolution ensures your package stays in the priority delivery dispatch schedule.
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setFixPaymentOrder(ord);
                                  setFixPaymentMethod(ord.paymentMethod || 'MTN Mobile Money');
                                  setFixPaymentPhone(ord.paymentPhone || ord.customerPhone || '');
                                  setFixPaymentRef(ord.paymentTransactionRef || ord.transactionId || '');
                                }}
                                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Update / Resubmit Payment</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowMessagesModal(true);
                                  setChatInputText(`Hi UK2UG, regarding the flagged issue on Order #${ord.id}: `);
                                }}
                                className="px-3.5 py-1.5 bg-white hover:bg-red-50 text-red-700 border border-red-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                              >
                                Chat With Support
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section 2: Complaints & Dispute Resolution */}
                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      My Quality Dispute Tickets ({customerComplaints.length})
                    </h3>
                  </div>

                  {customerComplaints.length === 0 ? (
                    <div className="p-5 bg-gray-50 border border-gray-200 rounded-xl text-center space-y-1">
                      <p className="text-xs font-bold text-gray-700">No Quality Complaints Lodged</p>
                      <p className="text-[11px] text-gray-500">
                        If you ever encounter damaged packaging, missing accessories, or delayed couriers, report it here for immediate admin resolution.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customerComplaints.map((c) => {
                        const statusColors: Record<string, string> = {
                          Open: 'bg-amber-100 text-amber-800 border-amber-200',
                          'Under Review': 'bg-blue-100 text-blue-800 border-blue-200',
                          'In Progress': 'bg-purple-100 text-purple-800 border-purple-200',
                          Resolved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                          Closed: 'bg-gray-100 text-gray-700 border-gray-200',
                        };
                        return (
                          <div key={c.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200/70 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-extrabold text-gray-900">{c.id}</span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-800 border border-orange-200">
                                  {c.category}
                                </span>
                                {c.orderId && (
                                  <span className="font-mono text-[10px] text-gray-500">
                                    Ref: #{c.orderId}
                                  </span>
                                )}
                              </div>
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusColors[c.status] || 'bg-gray-100 text-gray-800'}`}>
                                {c.status}
                              </span>
                            </div>

                            <p className="font-bold text-sm text-gray-900">{c.subject}</p>
                            <p className="text-xs text-gray-600 leading-relaxed bg-white p-2.5 rounded-lg border border-gray-100">
                              {c.description}
                            </p>

                            {c.adminResponse && (
                              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  Official Admin Resolution:
                                </span>
                                <p className="text-xs italic leading-relaxed">{c.adminResponse}</p>
                              </div>
                            )}

                            <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
                              <span>Lodged: {new Date(c.createdAt).toLocaleString()}</span>
                              {c.resolvedAt && <span>Resolved: {new Date(c.resolvedAt).toLocaleString()}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PRODUCT REQUEST WIZARD */}
        {activeTab === 'imports' && (
          !currentUser ? (
            <div className="max-w-xl mx-auto bg-white border border-gray-200 rounded-2xl p-8 sm:p-10 shadow-sm text-center space-y-6 animate-fade-in my-8" id="import-auth-gate">
              <div className="w-16 h-16 bg-orange-50 text-[#ea580c] rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-orange-100">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#ea580c] bg-orange-50 px-3 py-1 rounded-full border border-orange-100 inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Account Required • Sourcing Desk
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">Sign In to Request UK Products</h2>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-md mx-auto">
                  Only registered UK2UG account holders can submit custom product procurement requests, receive direct quotes from London shoppers, and track air freight dispatches.
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-150 text-left text-xs space-y-2.5 max-w-md mx-auto">
                <div className="flex items-center gap-2 text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Direct personal shopper service from London stores</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Real-time price quotation within 24 hours</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Official store receipts and guaranteed genuine products</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setShowAuthModal(true);
                  }}
                  className="flex-1 py-3 px-6 bg-[#000000] hover:bg-gray-900 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In to Continue
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setShowAuthModal(true);
                  }}
                  className="flex-1 py-3 px-6 bg-[#ea580c] hover:bg-orange-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  Create Account
                </button>
              </div>
            </div>
          ) : (
          <div className="max-w-2xl mx-auto bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm text-left space-y-8" id="import-desk-wizard">
            <div className="space-y-2 border-b border-gray-50 pb-5">
              <span className="px-2.5 py-1 bg-orange-50 text-[#ea580c] font-bold text-[10px] rounded-md uppercase tracking-wider">Product Sourcing Desk</span>
              <h2 className="text-2xl font-bold tracking-tight text-[#000000]">Product Request</h2>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                Looking for a specific item not in our catalog? Submit a product request with your desired specs and product image. Our sourcing specialists will procure and deliver it directly to you.
              </p>
            </div>

            {/* Stepper Progress bar */}
            <div className="flex items-center justify-between relative px-2 sm:px-6">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-100 -z-10"></div>
              {[
                { step: 1, label: 'Item & Image' },
                { step: 2, label: 'Quantity & Notes' },
                { step: 3, label: 'Submitted' },
              ].map((s) => (
                <div key={s.step} className="flex flex-col items-center bg-white px-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold ${
                      importStep >= s.step
                        ? 'bg-[#ea580c] border-[#ea580c] text-white shadow'
                        : 'bg-white border-gray-200 text-gray-400'
                    }`}
                  >
                    {importStep > s.step ? <Check className="w-4 h-4" /> : s.step}
                  </div>
                  <span className={`text-[10px] mt-1.5 font-bold ${importStep >= s.step ? 'text-[#000000]' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Catalog Item Search & Quick Auto-Fill */}
            {importStep === 1 && (
              <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-4 sm:p-5 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#ea580c] text-white flex items-center justify-center text-xs font-bold">
                      <Search className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-gray-900">
                      Looking for an existing item? Search Catalog by Name or Brand
                    </span>
                  </div>
                  <span className="text-[10px] text-orange-700 bg-white border border-orange-200 px-2 py-0.5 rounded font-sans w-fit">
                    e.g. Dyson, Apple, Jo Malone
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search products by title or brand (e.g. Dyson Airwrap, iPhone, Jo Malone)..."
                    value={skuSearchQuery}
                    onChange={(e) => setSkuSearchQuery(e.target.value)}
                    className="w-full bg-white border border-orange-200 rounded-lg pl-9 pr-8 py-2.5 text-xs sm:text-sm font-sans text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c] transition-all"
                  />
                  <Search className="w-4 h-4 text-orange-600 absolute left-3 top-3" />
                  {skuSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setSkuSearchQuery('')}
                      className="absolute right-2.5 top-2.5 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Search Results Dropdown / Preview */}
                {skuSearchQuery.trim().length > 0 && (
                  <div className="space-y-2 pt-1">
                    {(() => {
                      const query = skuSearchQuery.trim().toLowerCase();
                      const matched = products.filter(
                        (p) =>
                          p.title.toLowerCase().includes(query) ||
                          (p.brand && p.brand.toLowerCase().includes(query)) ||
                          (p.category && p.category.toLowerCase().includes(query))
                      );

                      if (matched.length === 0) {
                        return (
                          <div className="p-3 bg-white rounded-lg border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                            <span className="font-semibold">No product found for "{skuSearchQuery}".</span>
                            <span>No problem! Use the custom product request form below and our London team will procure it.</span>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            Found {matched.length} matching catalog {matched.length === 1 ? 'item' : 'items'}:
                          </p>
                          {matched.map((prod) => (
                            <div
                              key={prod.id}
                              className="bg-white border border-orange-100 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs hover:border-[#ea580c] transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <img
                                  src={prod.images[0]}
                                  alt={prod.title}
                                  className="w-12 h-12 rounded-lg object-cover border border-gray-100 shrink-0"
                                />
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {prod.brand && (
                                      <span className="text-[10px] font-bold bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded border border-orange-200">
                                        {prod.brand}
                                      </span>
                                    )}
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        isPreOrderActive(prod)
                                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      }`}
                                    >
                                      {isPreOrderActive(prod) ? (prod.preOrderStatus || 'Pre-Order') : 'In Stock'}
                                    </span>
                                  </div>
                                  <h4 className="text-xs font-bold text-gray-900 mt-0.5 line-clamp-1">{prod.title}</h4>
                                  <p className="text-[11px] font-semibold text-[#ea580c]">
                                    UGX {new Intl.NumberFormat('en-UG').format(prod.basePrice)}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setImportForm({
                                      ...importForm,
                                      productName: prod.title,
                                      description: [
                                        prod.description,
                                        prod.features && prod.features.length > 0
                                          ? `Key Features:\n• ${prod.features.join('\n• ')}`
                                          : '',
                                      ]
                                        .filter(Boolean)
                                        .join('\n\n'),
                                      imageUrl: prod.images[0] || '',
                                      imageUrl2: prod.images[1] || prod.images[0] || '',
                                    });
                                    setSkuSearchQuery('');
                                  }}
                                  className="flex-1 sm:flex-none px-3 py-1.5 bg-[#ea580c] hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                                >
                                  <Check className="w-3.5 h-3.5" /> Auto-Fill Form
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setViewingProduct(prod);
                                  }}
                                  className="flex-1 sm:flex-none px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                                >
                                  View Item
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Step 1 Form: Title, Product Image, Specs */}
            {importStep === 1 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setImportStep(2);
                }}
                className="space-y-5"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Product Title / Brand *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Marshall Major IV Headphones, Dyson Airwrap, Avon Care Cream"
                    value={importForm.productName}
                    onChange={(e) => setImportForm({ ...importForm, productName: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-xs sm:text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#ea580c]/10 focus:border-[#ea580c] transition-all"
                  />
                </div>

                {/* UK Retailer Link (Optional) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">UK Web Link / Retailer Store Link</label>
                    <span className="text-[10px] text-gray-400 font-semibold">(Optional)</span>
                  </div>
                  <input
                    type="url"
                    placeholder="e.g. https://amazon.co.uk/dp/..., boots.com, argos.co.uk, currys.co.uk"
                    value={importForm.productLink}
                    onChange={(e) => setImportForm({ ...importForm, productLink: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-xs sm:text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#ea580c]/10 focus:border-[#ea580c] transition-all font-mono"
                  />
                </div>

                {/* Dual Product Images Section */}
                <div className="space-y-4 pt-1">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <label className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-[#ea580c]" />
                      Product Photos <span className="text-orange-700 font-bold lowercase">(Upload at least 2 images for accurate sourcing)</span>
                    </label>
                    <span className="text-[10px] bg-orange-50 text-[#ea580c] border border-orange-100 font-bold px-2 py-0.5 rounded-full">
                      2 Image Slots Available
                    </span>
                  </div>

                  {/* Image Placeholder 1: Primary Image */}
                  <div className="border border-gray-200 rounded-xl p-3.5 bg-gray-50/70 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-[#ea580c] text-white text-[10px] font-bold flex items-center justify-center">1</span>
                        Primary Photo <span className="text-gray-400 font-normal text-[11px]">(Front view or main item)</span>
                      </span>
                      {importForm.imageUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setImportForm((p) => ({ ...p, imageUrl: '' }));
                            setImportFile(null);
                          }}
                          className="text-[11px] text-red-500 hover:text-red-700 font-semibold cursor-pointer"
                        >
                          Remove Photo 1
                        </button>
                      )}
                    </div>

                    {importForm.imageUrl ? (
                      <div className="relative rounded-lg border border-gray-200 bg-white p-2.5 flex items-center gap-3">
                        <div className="w-16 h-16 rounded-md overflow-hidden border border-gray-200 bg-gray-50 flex-shrink-0 flex items-center justify-center">
                          <img
                            src={importForm.imageUrl}
                            alt="Primary preview"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80';
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold">
                            <Check className="w-3.5 h-3.5" /> Photo 1 Attached
                          </div>
                          <p className="text-[11px] text-gray-400 truncate mt-0.5">
                            {importForm.imageUrl.startsWith('data:') ? 'Photo uploaded from device' : importForm.imageUrl}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setImportForm((p) => ({ ...p, imageUrl: '' }));
                              setImportFile(null);
                            }}
                            className="mt-1 text-[11px] text-[#ea580c] hover:underline font-semibold cursor-pointer"
                          >
                            Replace Photo 1
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          placeholder="Paste photo 1 URL link..."
                          value={importForm.imageUrl}
                          onChange={(e) => setImportForm({ ...importForm, imageUrl: e.target.value })}
                          className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#ea580c]/10 focus:border-[#ea580c] transition-all"
                        />
                        <label className="px-3.5 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shadow-2xs">
                          <UploadCloud className="w-4 h-4 text-[#ea580c]" />
                          <span>Upload Photo 1</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setImportFile(file);
                                const reader = new FileReader();
                                reader.onload = () => {
                                  if (typeof reader.result === 'string') {
                                    setImportForm((p) => ({ ...p, imageUrl: reader.result as string }));
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Image Placeholder 2: Secondary Image / Specs / Angle */}
                  <div className="border border-gray-200 rounded-xl p-3.5 bg-gray-50/70 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-orange-100 text-[#ea580c] text-[10px] font-bold flex items-center justify-center border border-orange-200">2</span>
                        Secondary Photo <span className="text-gray-400 font-normal text-[11px]">(Barcode, specs label, box, or alternative angle)</span>
                      </span>
                      {importForm.imageUrl2 && (
                        <button
                          type="button"
                          onClick={() => {
                            setImportForm((p) => ({ ...p, imageUrl2: '' }));
                            setImportFile2(null);
                          }}
                          className="text-[11px] text-red-500 hover:text-red-700 font-semibold cursor-pointer"
                        >
                          Remove Photo 2
                        </button>
                      )}
                    </div>

                    {importForm.imageUrl2 ? (
                      <div className="relative rounded-lg border border-gray-200 bg-white p-2.5 flex items-center gap-3">
                        <div className="w-16 h-16 rounded-md overflow-hidden border border-gray-200 bg-gray-50 flex-shrink-0 flex items-center justify-center">
                          <img
                            src={importForm.imageUrl2}
                            alt="Secondary preview"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80';
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold">
                            <Check className="w-3.5 h-3.5" /> Photo 2 Attached
                          </div>
                          <p className="text-[11px] text-gray-400 truncate mt-0.5">
                            {importForm.imageUrl2.startsWith('data:') ? 'Photo uploaded from device' : importForm.imageUrl2}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setImportForm((p) => ({ ...p, imageUrl2: '' }));
                              setImportFile2(null);
                            }}
                            className="mt-1 text-[11px] text-[#ea580c] hover:underline font-semibold cursor-pointer"
                          >
                            Replace Photo 2
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          placeholder="Paste photo 2 URL link..."
                          value={importForm.imageUrl2}
                          onChange={(e) => setImportForm({ ...importForm, imageUrl2: e.target.value })}
                          className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#ea580c]/10 focus:border-[#ea580c] transition-all"
                        />
                        <label className="px-3.5 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shadow-2xs">
                          <UploadCloud className="w-4 h-4 text-[#ea580c]" />
                          <span>Upload Photo 2</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setImportFile2(file);
                                const reader = new FileReader();
                                reader.onload = () => {
                                  if (typeof reader.result === 'string') {
                                    setImportForm((p) => ({ ...p, imageUrl2: reader.result as string }));
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Item Color, Size, and Storage Specs *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide specific parameters, e.g. Color: Brown, Storage: 256GB, Size: UK 8, Skin type, or model number..."
                    value={importForm.description}
                    onChange={(e) => setImportForm({ ...importForm, description: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs sm:text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#ea580c]/10 focus:border-[#ea580c] transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#000000] hover:bg-gray-900 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  Continue to Quantity & Notes <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Step 2 Form: Quantity & Notes */}
            {importStep === 2 && (
              <form onSubmit={handleImportSubmit} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Required Quantity</label>
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50 max-w-[180px]">
                    <button
                      type="button"
                      onClick={() => setImportForm((p) => ({ ...p, quantity: Math.max(1, p.quantity - 1) }))}
                      className="px-4 py-2.5 text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="flex-1 text-center text-sm font-bold text-gray-800">{importForm.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setImportForm((p) => ({ ...p, quantity: p.quantity + 1 }))}
                      className="px-4 py-2.5 text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Additional Sourcing Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. I need it by August 25th, preferred retailer, or special condition..."
                    value={importForm.notes}
                    onChange={(e) => setImportForm({ ...importForm, notes: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-xs sm:text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#ea580c]/10 focus:border-[#ea580c] transition-all"
                  />
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setImportStep(1)}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] py-3 bg-[#ea580c] hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-all shadow cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-4 h-4" /> Submit Product Request
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Success state */}
            {importStep === 3 && (
              <div className="text-center py-12 px-4 space-y-6">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900">Product Request Submitted!</h3>
                  <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                    We have successfully registered your product request. Our sourcing specialist will review your specifications and product image to give you a quote.
                  </p>
                </div>

                <div className="bg-gray-50 border border-gray-150 p-4 rounded-xl max-w-sm mx-auto text-left space-y-2">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Request Reference Code</p>
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-base font-extrabold text-[#ea580c]">{importSuccessCode}</p>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(importSuccessCode);
                        setCopiedTrackId(importSuccessCode);
                        setTimeout(() => setCopiedTrackId(null), 2000);
                      }}
                      className="text-xs text-gray-500 hover:text-gray-900 font-semibold cursor-pointer"
                    >
                      {copiedTrackId === importSuccessCode ? 'Copied!' : 'Copy Code'}
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Use this reference code in the <strong className="text-gray-700">Track Product Requests</strong> tab anytime to check pricing quotes and shipment updates.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const refCode = importSuccessCode;
                      setTrackingMode('requests');
                      setRequestTrackingRef(refCode);
                      handleTrackRequest(undefined, refCode);
                      setActiveTab('tracking');
                      setImportStep(1);
                      setImportForm({
                        productName: '',
                        productLink: '',
                        imageUrl: '',
                        imageUrl2: '',
                        description: '',
                        quantity: 1,
                        notes: '',
                      });
                      setImportFile(null);
                      setImportFile2(null);
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 bg-[#ea580c] text-white text-xs font-bold rounded-lg hover:bg-orange-700 transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <ClipboardList className="w-4 h-4" />
                    Track Request Status Now
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setImportForm({
                        productName: '',
                        productLink: '',
                        imageUrl: '',
                        imageUrl2: '',
                        description: '',
                        quantity: 1,
                        notes: '',
                      });
                      setImportFile(null);
                      setImportFile2(null);
                      setImportStep(1);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    Submit Another Request
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setImportForm({
                        productName: '',
                        productLink: '',
                        imageUrl: '',
                        imageUrl2: '',
                        description: '',
                        quantity: 1,
                        notes: '',
                      });
                      setImportFile(null);
                      setImportFile2(null);
                      setImportStep(1);
                      setActiveTab('home');
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Return to Home
                  </button>
                </div>
              </div>
            )}
          </div>
          )
        )}

        {/* TAB 5: WISHLIST */}
        {activeTab === 'wishlist' && (
          <div className="space-y-6 text-left" id="wishlist-portal-layout">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#000000]">My Sourcing Wishlist</h2>
            {wishlist.length === 0 ? (
              <div className="bg-white border border-gray-150 rounded-xl py-16 px-4 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center mx-auto">
                  <Heart className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-bold text-gray-900">Your Wishlist is Empty</h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                  Keep tabs on luxury electronics, chocolates, and lifestyle brands from London by bookmarking them.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setActiveTab('shop');
                  }}
                  className="px-5 py-2.5 bg-[#ea580c] text-white text-xs font-semibold rounded-lg hover:bg-orange-700 transition-colors shadow-sm cursor-pointer"
                >
                  Explore Catalog
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products
                  .filter((p) => wishlist.includes(p.id))
                  .map((prod) => {
                    const isOutOfStock = prod.quantity <= 0;
                    return (
                      <div
                        key={prod.id}
                        className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm flex flex-col relative"
                      >
                        <button
                          onClick={() => toggleWishlist(prod.id)}
                          className="absolute top-3.5 right-3.5 z-10 p-2 rounded-full bg-white text-red-500 hover:bg-red-50 shadow-sm border border-gray-100 transition-colors cursor-pointer"
                        >
                          <Heart className="w-4 h-4 fill-current" />
                        </button>

                        <div className="relative h-44 bg-gray-50 overflow-hidden shrink-0">
                          <img src={prod.images[0]} alt={prod.title} className="w-full h-full object-cover" />
                        </div>

                        <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-1.5">
                            <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{prod.title}</h3>
                            <p className="text-[11px] text-gray-400 line-clamp-1">{prod.description}</p>
                            <FormatCurrency value={prod.basePrice} />
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                toggleWishlist(prod.id);
                              }}
                              className="px-2.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-semibold cursor-pointer"
                              title="Remove"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            {isOutOfStock ? (
                              <button
                                onClick={() => {
                                  setActiveImgIdx(0);
                                  setViewingProduct(prod);
                                }}
                                className="flex-1 py-2 bg-gray-150 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                              >
                                View Specs
                              </button>
                            ) : (
                              <button
                                onClick={() => handleInitiateAddToCart(prod)}
                                className="flex-1 py-2 bg-[#ea580c] text-white text-xs font-semibold rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <ShoppingBag className="w-3.5 h-3.5" /> Add to Cart
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: SHOPPING CART & CHECKOUT PAGE */}
        {activeTab === 'cart' && (
          <div className="space-y-6 text-left" id="cart-checkout-portal-layout">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#000000]">Cart</h2>
                <span className="px-3 py-1 bg-orange-50 text-[#ea580c] font-bold text-xs sm:text-sm rounded-full border border-orange-100 shadow-2xs">
                  {cart.reduce((sum, i) => sum + i.quantity, 0)} {cart.reduce((sum, i) => sum + i.quantity, 0) === 1 ? 'item' : 'items'}
                </span>
              </div>
              {cart.length > 0 && !isCheckingOut && (
                <button
                  onClick={() => clearCart()}
                  className="text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
                >
                  Clear Cart
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="bg-white border border-gray-150 rounded-xl py-16 px-4 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-bold text-gray-900">Your Cart is Empty</h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                  Your shopping cart currently holds no items. Sourced tech and beauty items are ready for Kampala dispatch.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setActiveTab('shop');
                  }}
                  className="px-5 py-2.5 bg-[#ea580c] text-white text-xs font-semibold rounded-lg hover:bg-orange-700 transition-colors shadow-sm cursor-pointer"
                >
                  Explore Catalog
                </button>
              </div>
            ) : isCheckingOut ? (
              /* CHECKOUT FLOW WIDGET */
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Delivery form options */}
                <div className="lg:col-span-2 space-y-6">
                  {checkoutSuccessCode ? (
                    <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 text-center space-y-6 shadow-sm">
                      <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                        <CheckCircle2 className="w-10 h-10" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Order Placed Successfully!</h3>
                        <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                          Your order has been registered and sent to our London procurement center. Please trace your shipment pipeline using your official tracking number below.
                        </p>
                      </div>

                      {/* Prominent Tracking Order Number Card */}
                      <div className="bg-orange-50/70 border border-orange-100 p-5 rounded-2xl max-w-md mx-auto text-center space-y-3 shadow-2xs">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Your Order Tracking Number</span>
                        <div className="flex items-center justify-center gap-2">
                          <p className="font-mono text-xl sm:text-2xl font-black text-[#ea580c] tracking-wider selection:bg-orange-200">
                            {checkoutSuccessCode}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(checkoutSuccessCode);
                            }}
                            className="px-3 py-1.5 bg-white hover:bg-orange-100/50 border border-orange-200 text-[#ea580c] rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1 shrink-0"
                            title="Copy Order Tracking Number"
                          >
                            Copy
                          </button>
                        </div>
                        <p className="text-[11px] text-orange-800/80 font-medium leading-normal pt-1">
                          Keep this number handy (<span className="font-mono font-bold">{checkoutSuccessCode}</span>) to track live air cargo progress in the <strong>Order Tracking</strong> section.
                        </p>
                      </div>

                      {/* Secure 4-Digit Handover Authentication PIN (Generated Automatically upon Order Completion) */}
                      <div className="bg-amber-50/90 border border-amber-200 p-5 rounded-2xl max-w-md mx-auto text-center space-y-3 shadow-2xs">
                        <div className="flex items-center justify-center gap-1.5 text-amber-900 font-bold text-xs uppercase tracking-wider">
                          <ShieldCheck className="w-4.5 h-4.5 text-amber-700 shrink-0" />
                          <span>Automatically Generated 4-Digit Handover PIN</span>
                        </div>
                        
                        <div className="flex items-center justify-center gap-3">
                          <div className="font-mono text-2xl sm:text-3xl font-black text-amber-950 tracking-[0.25em] bg-white px-5 py-2 rounded-xl border border-amber-300 shadow-inner">
                            {checkoutSuccessCode.replace(/\D/g, '').slice(-4)}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const pin = checkoutSuccessCode.replace(/\D/g, '').slice(-4);
                              navigator.clipboard.writeText(pin);
                            }}
                            className="px-3 py-2 bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1 shrink-0"
                            title="Copy 4-Digit Handover PIN"
                          >
                            Copy PIN
                          </button>
                        </div>

                        <p className="text-[11px] text-amber-900/90 leading-relaxed font-medium text-left bg-amber-100/60 p-3 rounded-lg border border-amber-200/60">
                          <strong>Where to use this:</strong> {checkoutPath === 'delivery' 
                            ? 'When the UK2UG dispatch courier arrives at your doorstep, verify and inspect your parcel. Then share this automatically generated 4-digit PIN with the courier to validate safe package transition.' 
                            : 'When collecting your package at Shop 16, Thobani Centre, Kampala, present this automatically generated 4-digit PIN to the collection desk to authenticate and receive your parcel.'}
                        </p>
                      </div>

                      {/* Pre-Order Estimated Arrival Alert if order contains pre-ordered items */}
                      {placedOrderDetails?.items?.some((i) => i.isPreOrder) && (
                        <div className="bg-purple-50/90 border border-purple-200 p-4 rounded-2xl max-w-md mx-auto text-left space-y-2 shadow-2xs">
                          <div className="flex items-center gap-1.5 text-purple-900 font-bold text-xs uppercase tracking-wider">
                            <Clock className="w-4 h-4 text-purple-700 shrink-0" />
                            <span>Pre-Order Estimated Arrival Notice</span>
                          </div>
                          <p className="text-xs text-purple-950 font-medium leading-relaxed">
                            Your order contains items on pre-order. You will receive real-time updates as your shipment progresses from the UK to Kampala.
                          </p>
                          <div className="space-y-1.5 bg-white/80 p-2.5 rounded-lg border border-purple-100">
                            {placedOrderDetails.items
                              .filter((i) => i.isPreOrder)
                              .map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                                  <span className="text-gray-800 font-semibold truncate max-w-[200px]">{item.title}</span>
                                  <span className="font-bold text-purple-900 shrink-0">
                                    Est. Arrival: {item.preOrderEstimatedArrival || '10–14 Days'}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Payment Method Notice */}
                      {checkoutForm.paymentMethod === 'COD' ? (
                        <div className="bg-amber-50 border border-amber-200 text-amber-950 text-xs rounded-xl p-3.5 max-w-md mx-auto flex items-center justify-between text-left">
                          <div className="flex items-center gap-2">
                            <Banknote className="w-5 h-5 text-amber-700 shrink-0" />
                            <div>
                              <p className="font-bold text-amber-950">Payment Method: Cash on Delivery (COD)</p>
                              <p className="text-[11px] text-amber-800">Pay cash directly to the dispatch courier upon arrival at your doorstep. Inspect your parcel before handover.</p>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-amber-950 text-xs shrink-0 ml-2">
                            UGX {new Intl.NumberFormat('en-UG').format(cartTotal)}
                          </span>
                        </div>
                      ) : checkoutForm.paymentMethod === 'Shop' ? (
                        <div className="bg-orange-50 border border-orange-200 text-orange-900 text-xs rounded-xl p-3.5 max-w-md mx-auto flex items-center justify-between text-left">
                          <div className="flex items-center gap-2">
                            <Store className="w-5 h-5 text-[#ea580c] shrink-0" />
                            <div>
                              <p className="font-bold text-orange-950">Payment at the Shop</p>
                              <p className="text-[11px] text-orange-800">Thobani Center, Shop 16, Ground Floor, Kampala, Uganda. Settle in cash or MoMo upon pickup.</p>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-[#ea580c] text-xs shrink-0 ml-2">
                            UGX {new Intl.NumberFormat('en-UG').format(cartTotal)}
                          </span>
                        </div>
                      ) : (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl p-3.5 max-w-md mx-auto flex items-center justify-between text-left">
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-5 h-5 text-emerald-700 shrink-0" />
                            <div>
                              <p className="font-bold text-emerald-950">Payment via Mobile Money (0774 540199)</p>
                              <p className="text-[11px] text-emerald-700">Please send UGX {new Intl.NumberFormat('en-UG').format(cartTotal)} to 0774 540199 if not yet transferred.</p>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-emerald-800 text-xs shrink-0 ml-2">
                            UGX {new Intl.NumberFormat('en-UG').format(cartTotal)}
                          </span>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <button
                          onClick={() => {
                            setCheckoutSuccessCode('');
                            setIsCheckingOut(false);
                            clearCart();
                            if (currentUser) {
                              setShowAccountModal(true);
                            } else {
                              setActiveTab('tracking');
                              setTrackingNumber(checkoutSuccessCode);
                              const match = orders.find(o => o.id === checkoutSuccessCode);
                              if (match) setTrackedOrder(match);
                            }
                          }}
                          className="px-6 py-2.5 bg-[#ea580c] hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer flex items-center gap-2"
                        >
                          {currentUser ? 'View Order in My Account' : 'Track Fulfillment Status Now'}
                        </button>
                        <button
                          onClick={() => {
                            setCheckoutSuccessCode('');
                            setIsCheckingOut(false);
                            clearCart();
                            setActiveTab('shop');
                          }}
                          className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                        >
                          Continue Shopping
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleCheckoutSubmit} className="bg-white border border-gray-100 rounded-xl p-4 sm:p-6 shadow-sm space-y-6">
                      {/* Psychological Stepper & Trust Progress Bar (Zeigarnik Effect & Chunking) */}
                      <div className="bg-gray-50/80 p-3 sm:p-4 rounded-xl border border-gray-200/70">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="flex flex-col items-center">
                            <span className="w-6 h-6 rounded-full bg-[#ea580c] text-white text-[11px] font-bold flex items-center justify-center mb-1 shadow-xs">
                              1
                            </span>
                            <span className="text-[11px] font-bold text-gray-800">Fulfillment</span>
                            <span className="text-[9px] text-[#ea580c] font-semibold capitalize hidden sm:inline">{checkoutPath}</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="w-6 h-6 rounded-full bg-orange-100 text-[#ea580c] border border-orange-200 text-[11px] font-bold flex items-center justify-center mb-1">
                              2
                            </span>
                            <span className="text-[11px] font-bold text-gray-800">Destination</span>
                            <span className="text-[9px] text-gray-500 hidden sm:inline">Address</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 text-[11px] font-bold flex items-center justify-center mb-1">
                              3
                            </span>
                            <span className="text-[11px] font-bold text-gray-800">Payment</span>
                            <span className="text-[9px] text-gray-500 hidden sm:inline">{checkoutForm.paymentMethod}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900">Step 1: Choose Fulfillment Method</h3>
                        <button
                          type="button"
                          onClick={() => setIsCheckingOut(false)}
                          className="text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                        >
                          Modify Cart Items
                        </button>
                      </div>

                      {/* Fulfillment Tabs Selection */}
                      <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-gray-50/50 p-1">
                        <button
                          type="button"
                          onClick={() => {
                            setCheckoutPath('pickup');
                            if (checkoutForm.paymentMethod === 'COD') {
                              setCheckoutForm(prev => ({ ...prev, paymentMethod: 'Shop' }));
                            }
                          }}
                          className={`flex-1 py-2.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            checkoutPath === 'pickup'
                              ? 'bg-white text-orange-800 shadow'
                              : 'text-gray-500 hover:bg-white/40'
                          }`}
                        >
                          <MapPin className="w-4 h-4" /> Store Pickup (Free)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCheckoutPath('delivery');
                            if (checkoutForm.paymentMethod === 'Shop') {
                              setCheckoutForm(prev => ({ ...prev, paymentMethod: 'Mobile Money' }));
                            }
                          }}
                          className={`flex-1 py-2.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            checkoutPath === 'delivery'
                              ? 'bg-white text-orange-800 shadow'
                              : 'text-gray-500 hover:bg-white/40'
                          }`}
                        >
                          <Truck className="w-4 h-4" /> Door-to-Door Delivery
                        </button>
                      </div>

                      {/* Path Details Form fields */}
                      {checkoutPath === 'pickup' ? (
                        <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-xl space-y-3">
                          <p className="text-xs font-bold text-orange-800 flex items-center gap-1.5">
                            <Info className="w-4.5 h-4.5 text-[#ea580c]" /> Store Pickup Sourcing Info
                          </p>
                          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-semibold">
                            "Your item is ready for pickup at our shop located at Thobani Center shop 16 ground floor, Kampala."
                          </p>
                          <p className="text-xs text-gray-500 leading-relaxed">
                            Operating Hours: Monday – Saturday (9:00 AM – 7:00 PM). Telephone verification: <span className="font-mono text-gray-900 font-bold">0774 540199</span>.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-orange-700">Delivery Location Parameters</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-gray-700">District Boundary Dropdown *</label>
                              <select
                                value={checkoutForm.district}
                                onChange={(e) => setCheckoutForm({ ...checkoutForm, district: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs sm:text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#ea580c]/10 focus:border-[#ea580c] transition-all"
                              >
                                {districts.map((d) => (
                                  <option key={d.name} value={d.name}>
                                    {d.name} (UGX {new Intl.NumberFormat('en-UG').format(d.fee)})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-gray-700">Detailed Area / Neighborhood *</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. Kololo Wampewo Hill"
                                value={checkoutForm.area}
                                onChange={(e) => setCheckoutForm({ ...checkoutForm, area: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-xs sm:text-sm outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-gray-700">Specific Landmark / Nearby Building *</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. Near British High Commission"
                                value={checkoutForm.landmark}
                                onChange={(e) => setCheckoutForm({ ...checkoutForm, landmark: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-xs sm:text-sm outline-none"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-gray-700">Rider Delivery Notes (Optional)</label>
                              <input
                                type="text"
                                placeholder="e.g. Leave at front door of floor 3..."
                                value={checkoutForm.notes}
                                onChange={(e) => setCheckoutForm({ ...checkoutForm, notes: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-xs sm:text-sm outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Recipient Coordinates */}
                      <div className="space-y-4 pt-4 border-t border-gray-50">
                        <p className="text-xs font-bold uppercase tracking-wider text-orange-700">Customer Coordinate Details</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700">Full Recipient Name *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. David Mukasa"
                              value={checkoutForm.fullName}
                              onChange={(e) => setCheckoutForm({ ...checkoutForm, fullName: e.target.value })}
                              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-xs sm:text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#ea580c]/20"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700">Active Mobile Number *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. 0774 000000"
                              value={checkoutForm.phone}
                              onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-xs sm:text-sm outline-none font-mono focus:bg-white focus:ring-2 focus:ring-[#ea580c]/20"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-700">Email Address (For Order Details) *</label>
                          <input
                            type="email"
                            required
                            placeholder="e.g. customer@example.com"
                            value={checkoutForm.email}
                            onChange={(e) => setCheckoutForm({ ...checkoutForm, email: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-xs sm:text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#ea580c]/20"
                          />
                        </div>
                      </div>

                      {/* Payment Processors */}
                      <div className="space-y-4 pt-4 border-t border-gray-50">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold uppercase tracking-wider text-orange-700">Select Payment Method</p>
                          <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                            2 Options Available
                          </span>
                        </div>

                        {checkoutPath === 'delivery' ? (
                          /* Door-to-Door Delivery Payment Options: Mobile Money or Cash on Delivery */
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <button
                              type="button"
                              onClick={() => setCheckoutForm({ ...checkoutForm, paymentMethod: 'Mobile Money' })}
                              className={`p-4 border rounded-xl text-left text-xs font-bold transition-all flex flex-col justify-between cursor-pointer relative ${
                                checkoutForm.paymentMethod === 'Mobile Money'
                                  ? 'border-emerald-600 bg-emerald-50/40 text-emerald-950 ring-2 ring-emerald-600/20 shadow-xs'
                                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1.5">
                                <Smartphone className="w-4 h-4 text-emerald-700" />
                                <span className="text-sm font-bold text-gray-900">Payment using Mobile Money</span>
                              </div>
                              <p className="text-[11px] font-normal text-gray-500 leading-normal">
                                Send payment via MTN MoMo or Airtel Money to <strong>0774 540199</strong>.
                              </p>
                              <span className="text-[9px] text-emerald-800 font-bold mt-2 uppercase tracking-wide bg-emerald-100 inline-block px-2 py-0.5 rounded self-start">
                                Send to 0774 540199
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setCheckoutForm({ ...checkoutForm, paymentMethod: 'COD' })}
                              className={`p-4 border rounded-xl text-left text-xs font-bold transition-all flex flex-col justify-between cursor-pointer relative ${
                                checkoutForm.paymentMethod === 'COD'
                                  ? 'border-amber-600 bg-amber-50/40 text-amber-950 ring-2 ring-amber-600/20 shadow-xs'
                                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1.5">
                                <Banknote className="w-4 h-4 text-amber-700" />
                                <span className="text-sm font-bold text-gray-900">Pay Cash on Delivery</span>
                              </div>
                              <p className="text-[11px] font-normal text-gray-500 leading-normal">
                                Pay cash directly to the dispatch rider upon parcel arrival at your doorstep.
                              </p>
                              <span className="text-[9px] text-amber-800 font-bold mt-2 uppercase tracking-wide bg-amber-100 inline-block px-2 py-0.5 rounded self-start">
                                Cash at Doorstep
                              </span>
                            </button>
                          </div>
                        ) : (
                          /* Store Pickup Payment Options: Payment at the Shop or Mobile Money */
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <button
                              type="button"
                              onClick={() => setCheckoutForm({ ...checkoutForm, paymentMethod: 'Shop' })}
                              className={`p-4 border rounded-xl text-left text-xs font-bold transition-all flex flex-col justify-between cursor-pointer relative ${
                                checkoutForm.paymentMethod === 'Shop'
                                  ? 'border-[#ea580c] bg-orange-50/30 text-orange-950 ring-2 ring-[#ea580c]/20 shadow-xs'
                                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1.5">
                                <Store className="w-4 h-4 text-[#ea580c]" />
                                <span className="text-sm font-bold text-gray-900">Payment at the Shop</span>
                              </div>
                              <p className="text-[11px] font-normal text-gray-500 leading-normal">
                                Pay in cash or Mobile Money when collecting at Thobani Center, Shop 16, Ground Floor, Kampala.
                              </p>
                              <span className="text-[9px] text-[#ea580c] font-bold mt-2 uppercase tracking-wide bg-orange-50 inline-block px-2 py-0.5 rounded self-start">
                                Shop Counter Pickup
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setCheckoutForm({ ...checkoutForm, paymentMethod: 'Mobile Money' })}
                              className={`p-4 border rounded-xl text-left text-xs font-bold transition-all flex flex-col justify-between cursor-pointer relative ${
                                checkoutForm.paymentMethod === 'Mobile Money'
                                  ? 'border-emerald-600 bg-emerald-50/40 text-emerald-950 ring-2 ring-emerald-600/20 shadow-xs'
                                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1.5">
                                <Smartphone className="w-4 h-4 text-emerald-700" />
                                <span className="text-sm font-bold text-gray-900">Payment using Mobile Money</span>
                              </div>
                              <p className="text-[11px] font-normal text-gray-500 leading-normal">
                                Send payment via MTN MoMo or Airtel Money to <strong>0774 540199</strong>.
                              </p>
                              <span className="text-[9px] text-emerald-800 font-bold mt-2 uppercase tracking-wide bg-emerald-100 inline-block px-2 py-0.5 rounded self-start">
                                Send to 0774 540199
                              </span>
                            </button>
                          </div>
                        )}

                        {/* Payment Details for 'Shop' (Pickup Only) */}
                        {checkoutPath === 'pickup' && checkoutForm.paymentMethod === 'Shop' && (
                          <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-200 space-y-3 text-left animate-in fade-in duration-150">
                            <div className="flex items-center justify-between border-b border-orange-100 pb-2">
                              <p className="text-xs font-bold text-orange-900 flex items-center gap-1.5">
                                <Store className="w-4 h-4 text-[#ea580c]" />
                                Payment at the Shop (Kampala Station)
                              </p>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#ea580c] bg-white px-2 py-0.5 rounded border border-orange-200">
                                Cash or MoMo on Site
                              </span>
                            </div>

                            <p className="text-xs text-gray-700 leading-relaxed">
                              Complete your payment in cash or Mobile Money when collecting your parcel at our shop:
                              <br />
                              <strong className="text-gray-900">Thobani Center, Shop 16, Ground Floor, Kampala, Uganda</strong>.
                            </p>

                            <div className="bg-white p-3 rounded-lg border border-orange-100 flex justify-between items-center text-xs">
                              <span className="text-gray-600 font-medium">Total Payable at Counter:</span>
                              <span className="font-mono font-bold text-[#ea580c] text-sm">
                                UGX {new Intl.NumberFormat('en-UG').format(cartTotal)}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Payment Details for 'COD' (Door-to-Door Delivery) */}
                        {checkoutPath === 'delivery' && checkoutForm.paymentMethod === 'COD' && (
                          <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 space-y-3 text-left animate-in fade-in duration-150">
                            <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
                              <p className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                                <Banknote className="w-4 h-4 text-amber-700" />
                                Cash on Delivery (Pay at Doorstep)
                              </p>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-white px-2 py-0.5 rounded border border-amber-200">
                                Cash Handover to Rider
                              </span>
                            </div>

                            <p className="text-xs text-amber-900 leading-relaxed">
                              You will pay cash directly to the dispatch rider upon delivery at your doorstep: <strong className="text-gray-900">{checkoutForm.area ? `${checkoutForm.area}, ${checkoutForm.district}` : checkoutForm.district || 'Your Address'}</strong>. Please inspect your parcel and have the exact cash amount ready upon package arrival.
                            </p>

                            <div className="bg-white p-3 rounded-lg border border-amber-200 flex justify-between items-center text-xs">
                              <span className="text-gray-600 font-medium">Total Payable to Dispatch Rider:</span>
                              <span className="font-mono font-bold text-amber-950 text-sm">
                                UGX {new Intl.NumberFormat('en-UG').format(cartTotal)}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Payment Details for 'Mobile Money' */}
                        {checkoutForm.paymentMethod === 'Mobile Money' && (
                          <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-4 text-left">
                            <div className="flex items-center justify-between border-b border-emerald-150 pb-2">
                              <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                                <Smartphone className="w-4 h-4 text-emerald-700" />
                                Send Payment via Mobile Money
                              </p>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
                                MTN & Airtel Money
                              </span>
                            </div>

                            {/* Prominent Transfer Target Box */}
                            <div className="bg-white p-4 rounded-xl border border-emerald-300 shadow-2xs space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Official Mobile Money Number</span>
                                  <p className="text-xl sm:text-2xl font-mono font-black text-emerald-900 tracking-wider">
                                    0774 540199
                                  </p>
                                  <p className="text-[11px] text-gray-500 font-medium">Recipient: UK2UG Logistics / Thobani Kampala</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText('0774540199');
                                    setCopiedMomoNumber(true);
                                    setTimeout(() => setCopiedMomoNumber(false), 2000);
                                  }}
                                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-center"
                                >
                                  {copiedMomoNumber ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                  {copiedMomoNumber ? 'Copied!' : 'Copy Number'}
                                </button>
                              </div>

                              <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-xs">
                                <span className="text-gray-600 font-medium">Amount to Transfer:</span>
                                <span className="font-mono font-black text-emerald-800 text-sm">
                                  UGX {new Intl.NumberFormat('en-UG').format(cartTotal)}
                                </span>
                              </div>
                            </div>

                            {/* Network Provider Selector */}
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-gray-700 uppercase flex items-center justify-between">
                                <span>Select Mobile Money Network *</span>
                                <span className="text-[10px] font-mono text-emerald-800 font-bold">Mandatory Verification</span>
                              </label>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMomoNetwork('MTN');
                                    setCheckoutError(null);
                                    setCheckoutForm(prev => ({
                                      ...prev,
                                      paymentTransactionRef: prev.paymentTransactionRef.replace(/\D/g, '').slice(0, 11)
                                    }));
                                  }}
                                  className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                    momoNetwork === 'MTN'
                                      ? 'bg-amber-50 border-amber-400 text-amber-950 ring-2 ring-amber-400/30 font-extrabold shadow-2xs'
                                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                                  MTN Mobile Money (11 Digits)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMomoNetwork('Airtel');
                                    setCheckoutError(null);
                                    setCheckoutForm(prev => ({
                                      ...prev,
                                      paymentTransactionRef: prev.paymentTransactionRef.replace(/\D/g, '').slice(0, 12)
                                    }));
                                  }}
                                  className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                    momoNetwork === 'Airtel'
                                      ? 'bg-red-50 border-red-400 text-red-950 ring-2 ring-red-400/30 font-extrabold shadow-2xs'
                                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                                  Airtel Money (12 Digits)
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-700 uppercase">
                                  Your Sending Phone Number / Registered Name *
                                </label>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. 077x xxxxxx (Your Name)"
                                  value={checkoutForm.paymentPhone}
                                  onChange={(e) => setCheckoutForm({ ...checkoutForm, paymentPhone: e.target.value })}
                                  className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-mono outline-none focus:ring-2 focus:ring-emerald-600/20"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <label className="text-[11px] font-bold text-gray-800 uppercase">
                                    {momoNetwork === 'MTN' ? 'MTN Transaction ID *' : 'Airtel Transaction ID *'}
                                  </label>
                                  <span className={`text-[10px] font-mono font-bold ${
                                    checkoutForm.paymentTransactionRef.length === (momoNetwork === 'MTN' ? 11 : 12)
                                      ? 'text-emerald-700'
                                      : 'text-amber-700'
                                  }`}>
                                    {checkoutForm.paymentTransactionRef.length} / {momoNetwork === 'MTN' ? 11 : 12} Digits
                                  </span>
                                </div>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  required
                                  maxLength={momoNetwork === 'MTN' ? 11 : 12}
                                  placeholder={
                                    momoNetwork === 'MTN'
                                      ? "Enter 11-digit MTN ID (e.g. 10482910394)"
                                      : "Enter 12-digit Airtel ID (e.g. 293847581920)"
                                  }
                                  value={checkoutForm.paymentTransactionRef}
                                  onChange={(e) => {
                                    const digitsOnly = e.target.value.replace(/\D/g, '');
                                    const maxLen = momoNetwork === 'MTN' ? 11 : 12;
                                    setCheckoutForm({
                                      ...checkoutForm,
                                      paymentTransactionRef: digitsOnly.slice(0, maxLen),
                                    });
                                    if (checkoutError) setCheckoutError(null);
                                  }}
                                  className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
                                />
                              </div>
                            </div>

                            {/* Distinct Placeholders & Format Reference Box */}
                            <div className="p-3 bg-white rounded-lg border border-emerald-200 text-[11px] space-y-1.5 shadow-2xs">
                              <span className="font-bold text-gray-700 uppercase tracking-wider text-[10px] block">
                                Transaction ID Integer Formats (Mandatory):
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                                <div className={`p-2 rounded border ${momoNetwork === 'MTN' ? 'bg-amber-50/70 border-amber-300 text-amber-950 font-bold' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                                  <div className="text-[10px] font-sans font-bold text-amber-800">MTN Mobile Money:</div>
                                  <div>Placeholder: <span className="underline">10482910394</span> (11 digits)</div>
                                </div>
                                <div className={`p-2 rounded border ${momoNetwork === 'Airtel' ? 'bg-red-50/70 border-red-300 text-red-950 font-bold' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                                  <div className="text-[10px] font-sans font-bold text-red-800">Airtel Money:</div>
                                  <div>Placeholder: <span className="underline">293847581920</span> (12 digits)</div>
                                </div>
                              </div>
                            </div>

                            <p className="text-[11px] text-emerald-900/80 leading-normal">
                              Send <strong>UGX {new Intl.NumberFormat('en-UG').format(cartTotal)}</strong> to <strong>0774 540199</strong>. Once sent, enter your {momoNetwork === 'MTN' ? '11-digit MTN' : '12-digit Airtel'} Transaction ID above to finalize your order.
                            </p>
                          </div>
                        )}
                      </div>

                      {checkoutError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-bold text-red-800 flex items-start gap-2 text-left animate-shake">
                          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                          <div>{checkoutError}</div>
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full py-3 bg-[#ea580c] hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                      >
                        <Check className="w-4 h-4" /> Confirm Order
                      </button>
                    </form>
                  )}
                </div>

                {/* Checkout pricing Totals summary panel */}
                <div className="space-y-6">
                  <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm text-left space-y-4">
                    <p className="font-bold text-gray-900 border-b border-gray-50 pb-3 text-xs sm:text-sm uppercase tracking-wider text-orange-800">
                      Checkout Invoice Totals
                    </p>
                    <div className="space-y-2.5 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>Sourced Subtotal</span>
                        <span className="font-mono text-gray-900 font-semibold">
                          UGX {new Intl.NumberFormat('en-UG').format(cartSubtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fulfillment Fee</span>
                        <span className="font-mono text-gray-900 font-semibold">
                          {deliveryFee === 0 ? 'Free' : `UGX ${new Intl.NumberFormat('en-UG').format(deliveryFee)}`}
                        </span>
                      </div>
                      {checkoutPath === 'delivery' && (
                        <div className="text-[10px] text-gray-400 italic bg-gray-50 p-2 rounded">
                          Fulfillment zone: {checkoutForm.district} District Route Standard
                        </div>
                      )}
                      <div className="border-t border-gray-50 pt-3 flex justify-between items-center text-sm font-bold text-gray-900">
                        <span>Total Due</span>
                        <span className="font-mono text-orange-800">
                          UGX {new Intl.NumberFormat('en-UG').format(cartTotal)}
                        </span>
                      </div>
                    </div>

                    {cart.some((item) => isPreOrderActive(item.product) || item.product.isPreOrder) && (
                      <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3.5 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Pre-Order Arrival Schedule</span>
                        </div>
                        <div className="space-y-1 text-[11px] text-amber-900">
                          {cart
                            .filter((item) => isPreOrderActive(item.product) || item.product.isPreOrder)
                            .map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between gap-1 border-t border-amber-200/60 pt-1 first:border-0 first:pt-0">
                                <span className="truncate max-w-[140px] text-gray-800 font-medium">{item.product.title}</span>
                                <span className="font-bold text-amber-950 shrink-0">
                                  {item.product.preOrderEstimatedArrival || '10–14 Days'}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* CART DETAILS OVERVIEW */
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* List Items */}
                <div className="lg:col-span-2 space-y-4">
                  {cart.map((item) => {
                    const remainingStock = products.find((p) => p.id === item.product.id)?.quantity ?? 0;
                    return (
                      <div
                        key={item.product.id}
                        className="bg-white border border-gray-100 rounded-xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center gap-4 text-left"
                      >
                        <img
                          src={item.product.images[0]}
                          alt={item.product.title}
                          className="w-20 h-20 rounded-lg object-cover bg-gray-50 border border-gray-50 shrink-0"
                        />

                        <div className="flex-1 space-y-1.5 min-w-0">
                          <h4 className="font-bold text-gray-900 text-sm sm:text-base truncate">{item.product.title}</h4>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs text-[#ea580c] font-semibold font-mono">
                              UGX {new Intl.NumberFormat('en-UG').format(item.product.basePrice)}
                            </p>
                            {item.selectedSize && (
                              <span className="text-[10px] font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                Size: {item.selectedSize}
                              </span>
                            )}
                          </div>

                          {/* Inventory stock transparency alert or Pre-Order notice */}
                          <div className="flex items-center gap-2">
                            {isPreOrderActive(item.product) || item.product.isPreOrder ? (
                              <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>Pre-Order • Est. Arrival: <strong className="text-amber-950 font-bold">{item.product.preOrderEstimatedArrival || '10–14 Days'}</strong></span>
                              </span>
                            ) : remainingStock <= 3 ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                                <AlertTriangle className="w-3 h-3" /> Only {remainingStock} items left in stock
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400 font-medium">
                                In Stock ({remainingStock} Sourced available)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quantity management actions */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                            <button
                              onClick={() => updateCartQty(item.product.id, item.quantity - 1)}
                              className="px-2.5 py-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-3 text-xs font-bold text-gray-800">{item.quantity}</span>
                            <button
                              onClick={() => updateCartQty(item.product.id, item.quantity + 1)}
                              className="px-2.5 py-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove item"
                          >
                            <X className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Subtotal summary panel */}
                <div className="space-y-6 bg-white border border-gray-100 rounded-xl p-5 shadow-sm text-left h-fit">
                  <p className="font-bold text-gray-900 border-b border-gray-50 pb-3 text-xs uppercase tracking-wider text-[#ea580c]">
                    Cart Summary
                  </p>
                  <div className="space-y-3.5 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Sourced Items Subtotal</span>
                      <span className="font-mono text-gray-900 font-bold">
                        UGX {new Intl.NumberFormat('en-UG').format(cartSubtotal)}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-normal">
                      Delivery fees are computed dynamically on the checkout page based on the selected Ugandan logistics zone boundaries.
                    </p>

                    <button
                      onClick={() => {
                        if (!currentUser) {
                          sessionStorage.setItem('uk2ug_pending_checkout', 'true');
                          setAuthError('Please create an account or sign in to continue to secure checkout and complete your order.');
                          setIsSignUp(true);
                          setShowAuthModal(true);
                        } else {
                          setIsCheckingOut(true);
                        }
                      }}
                      className="w-full py-3 bg-[#ea580c] hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow"
                    >
                      Continue to Secure Checkout <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* RECENTLY VIEWED ITEMS SECTION */}
            <div className="pt-8 border-t border-gray-150 space-y-4 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#ea580c]" />
                    Recently Viewed
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Items you recently explored in our UK-sourced electronics and beauty store.
                  </p>
                </div>
                {recentlyViewedIds.length > 0 && (
                  <button
                    onClick={() => {
                      setRecentlyViewedIds([]);
                      try {
                        localStorage.removeItem('uk2ug_recently_viewed');
                      } catch (e) {}
                    }}
                    className="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    Clear History
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {displayRecentlyViewed.map((prod) => {
                  const inCart = cart.some((ci) => ci.product.id === prod.id);
                  return (
                    <div
                      key={prod.id}
                      className="bg-white border border-gray-150 hover:border-orange-300 rounded-xl p-3.5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                      <div className="space-y-2 cursor-pointer" onClick={() => setViewingProduct(prod)}>
                        <div className="relative aspect-square bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
                          <img
                            src={prod.images[0]}
                            alt={prod.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute top-2 left-2 text-[9px] font-extrabold uppercase tracking-wider text-[#ea580c] bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded shadow-2xs">
                            {prod.category}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-[#ea580c] transition-colors">
                            {prod.title}
                          </h4>
                          <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-500">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span className="font-bold text-gray-700">{prod.rating.toFixed(1)}</span>
                            <span className="text-gray-400 text-[10px]">({prod.reviewsCount})</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2">
                        <span className="font-mono text-xs sm:text-sm font-extrabold text-[#ea580c]">
                          UGX {new Intl.NumberFormat('en-UG').format(prod.basePrice)}
                        </span>
                        <button
                          onClick={() => handleInitiateAddToCart(prod)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                            inCart
                              ? 'bg-orange-50 text-[#ea580c] border border-orange-200'
                              : 'bg-[#ea580c] hover:bg-orange-700 text-white shadow-2xs'
                          }`}
                          title={inCart ? 'In Cart' : 'Add to Cart'}
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{inCart ? 'In Cart' : 'Add'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* PORTAL MODAL: DETAILED PRODUCT CATALOG PAGE VIEW */}
      {viewingProduct && (
        <Modal
          isOpen={!!viewingProduct}
          onClose={() => {
            setViewingProduct(null);
            setNotifySuccess(false);
            setNotifyEmail('');
          }}
          title={viewingProduct.title}
          maxWidth="4xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left" id="product-detail-modal">
            {/* Left: Images Layout & Zoom Carousel */}
            <div className="space-y-4">
              {/* Active Image with Deep Zoom Effect */}
              <div
                className="relative h-72 sm:h-80 bg-gray-50 border border-gray-100 rounded-xl overflow-hidden cursor-crosshair"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <img
                  src={viewingProduct.images[activeImgIdx]}
                  alt={viewingProduct.title}
                  style={zoomStyle}
                  className="w-full h-full object-cover transition-transform duration-100 ease-out"
                />
              </div>

              {/* Thumbnails list */}
              <div className="grid grid-cols-4 gap-2.5">
                {viewingProduct.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImgIdx(idx)}
                    className={`h-16 rounded-lg border-2 overflow-hidden transition-all bg-gray-50 cursor-pointer ${
                      activeImgIdx === idx ? 'border-[#ea580c] ring-2 ring-orange-100' : 'border-gray-150'
                    }`}
                  >
                    <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Technical specifications list */}
            <div className="space-y-6">
              <div className="space-y-2">
                {/* Stock Status Badges & Brand */}
                <div className="flex flex-wrap items-center gap-2">
                  {isPreOrderActive(viewingProduct) || viewingProduct.isPreOrder ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold uppercase tracking-wider">
                      <Clock className="w-3.5 h-3.5 text-amber-700" /> Pre-Order Item
                    </span>
                  ) : viewingProduct.quantity > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> In Stock ({viewingProduct.quantity} available)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-100 text-[10px] font-bold">
                      <AlertTriangle className="w-3.5 h-3.5" /> Out of Stock Sourced
                    </span>
                  )}

                  {viewingProduct.brand && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800 border border-gray-200 text-[10px] font-bold">
                      Brand: {viewingProduct.brand}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-2 pt-1">
                  <FormatCurrency value={viewingProduct.basePrice} />
                  {viewingProduct.originalPrice && viewingProduct.originalPrice > viewingProduct.basePrice && (
                    <span className="text-sm text-gray-400 line-through">
                      UGX {new Intl.NumberFormat('en-UG').format(viewingProduct.originalPrice!)}
                    </span>
                  )}
                </div>

                {/* Pre-Order Estimated Arrival Banner */}
                {(isPreOrderActive(viewingProduct) || viewingProduct.isPreOrder) && (
                  <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl space-y-1 text-left">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase tracking-wider">
                        <Calendar className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>Estimated Date of Arrival</span>
                      </div>
                      {viewingProduct.preOrderStatus && (
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                          {viewingProduct.preOrderStatus}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-amber-950">
                      {viewingProduct.preOrderEstimatedArrival || '10–14 Business Days'}
                    </p>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      This item is on pre-order. Sourced and scheduled for arrival at our Kampala Hub on this estimated date.
                    </p>
                  </div>
                )}

                <p className="text-xs text-gray-500 leading-relaxed">{viewingProduct.description}</p>

                {/* Multiple Store & Sourcing Links */}
                {(viewingProduct.productUrls?.some(u => u && u.trim()) || viewingProduct.productUrl) && (
                  <div className="pt-2 space-y-1.5">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                      Direct Store & Sourcing Reference Links:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {viewingProduct.productUrls?.filter(u => u && u.trim()).map((url, uIdx) => (
                        <a
                          key={uIdx}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-orange-50 border border-gray-200 hover:border-orange-300 text-gray-700 hover:text-[#ea580c] rounded-lg text-xs font-semibold transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-[#ea580c]" />
                          <span>Store Link #{uIdx + 1}</span>
                        </a>
                      ))}
                      {!viewingProduct.productUrls?.length && viewingProduct.productUrl && (
                        <a
                          href={viewingProduct.productUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#ea580c]/10 hover:bg-[#ea580c]/20 text-[#ea580c] rounded-lg text-xs font-bold transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-[#ea580c]" />
                          <span>↗ View Store Link / Product Preview</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Size Selection (Small Squares for Garments & Footwear) */}
                {viewingProduct.sizes && viewingProduct.sizes.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1.5">
                        {viewingProduct.isFootwear || viewingProduct.sizes.some((s) => s.includes('UK') || s.includes('EUR')) ? (
                          <>
                            <Footprints className="w-3.5 h-3.5 text-[#ea580c]" />
                            Shoe Sizing (UK & EUR Standards):
                          </>
                        ) : viewingProduct.sizes.some((s) => ['28', '29', '30', '31', '32', '33', '34', '35', '36'].includes(s)) || viewingProduct.title.toLowerCase().includes('trouser') || viewingProduct.title.toLowerCase().includes('chino') ? (
                          <>
                            <Shirt className="w-3.5 h-3.5 text-amber-700" />
                            Trouser Waist Sizes (28 to 36):
                          </>
                        ) : (
                          <>
                            <Shirt className="w-3.5 h-3.5 text-[#ea580c]" />
                            Select Garment Size:
                          </>
                        )}
                      </span>
                      {selectedProductSize && (
                        <span className="text-xs font-mono font-bold text-[#ea580c]">
                          Selected: {selectedProductSize}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {viewingProduct.sizes.map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setSelectedProductSize(sz)}
                          className={`min-w-9 h-9 px-2.5 rounded-lg font-mono font-bold text-xs flex items-center justify-center border transition-all cursor-pointer ${
                            selectedProductSize === sz
                              ? 'bg-[#ea580c] text-white border-orange-700 shadow-sm ring-2 ring-orange-200'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-[#ea580c] hover:text-[#ea580c]'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Key Features & Selling Points */}
              {viewingProduct.features && viewingProduct.features.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#ea580c]" />
                    Key Features:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {viewingProduct.features.map((feat, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50/50 border border-orange-200/80 text-orange-900 rounded-lg text-xs font-medium"
                      >
                        <CheckCircle2 className="w-3 h-3 text-[#ea580c]" />
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical Specifications */}
              {((viewingProduct.specs && Object.keys(viewingProduct.specs).length > 0) || (viewingProduct.sourcingSpecs && viewingProduct.sourcingSpecs.filter((s) => s.value && s.value.trim() !== '').length > 0)) && (
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[#ea580c]" />
                    Specifications:
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-gray-50/70 p-3.5 rounded-xl border border-gray-100 text-xs">
                    {Array.isArray(viewingProduct.specs)
                      ? (viewingProduct.specs as any[]).map((spec, idx) => (
                          <div key={`spec-${idx}`} className="space-y-0.5">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase">{spec.key}</span>
                            <p className="text-gray-800 font-semibold">{spec.value}</p>
                          </div>
                        ))
                      : viewingProduct.specs
                      ? Object.entries(viewingProduct.specs).map(([k, v], idx) => (
                          <div key={`spec-${idx}`} className="space-y-0.5">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase">{k}</span>
                            <p className="text-gray-800 font-semibold">{v}</p>
                          </div>
                        ))
                      : null}
                    {(viewingProduct.sourcingSpecs || [])
                      .filter((s) => s.value && s.value.trim() !== '')
                      .map((spec, idx) => (
                        <div key={`source-${idx}`} className="space-y-0.5">
                          <span className="text-[10px] text-gray-400 font-semibold uppercase">{spec.key}</span>
                          <p className="text-gray-800 font-semibold">{spec.value}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* In the Box list */}
              {viewingProduct.inTheBox && viewingProduct.inTheBox.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Box className="w-3.5 h-3.5 text-[#ea580c]" />
                    What's in the Box:
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                    {viewingProduct.inTheBox.map((box, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-orange-600 font-bold shrink-0">•</span>
                        <span>{box}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Buy actions or Notify form */}
              <div className="pt-4 border-t border-gray-100 space-y-3">
                {viewingProduct.quantity > 0 || viewingProduct.isPreOrder ? (
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        handleInitiateAddToCart(viewingProduct, selectedProductSize);
                        setViewingProduct(null);
                      }}
                      className="w-full py-3.5 bg-[#ea580c] hover:bg-orange-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <ShoppingBag className="w-4 h-4" /> Add to Cart {selectedProductSize ? `(Size: ${selectedProductSize})` : ''}
                    </button>
                  </div>
                ) : (
                  /* Notify subscription form */
                  <div className="p-4 bg-gray-50 border border-gray-150 rounded-xl text-left space-y-3">
                    <p className="text-xs font-bold text-gray-700 flex items-center gap-1">
                      <Clock className="w-4 h-4 text-amber-500" /> Notify Me When Sourced
                    </p>
                    <p className="text-[11px] text-gray-500 leading-normal">
                      This premium item is currently out of stock. Leave your coordinate parameters to be notified instantly when sourced from the UK.
                    </p>
                    {notifySuccess ? (
                      <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 p-2.5 rounded font-semibold">
                        ✓ Subscription registered! We will notify you instantly upon UK replenishment.
                      </div>
                    ) : (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          setNotifySuccess(true);
                        }}
                        className="flex gap-2"
                      >
                        <input
                          type="email"
                          required
                          placeholder="name@domain.com"
                          value={notifyEmail}
                          onChange={(e) => setNotifyEmail(e.target.value)}
                          className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[#ea580c]"
                        />
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-[#000000] text-white text-xs font-bold rounded-lg hover:bg-gray-900 transition-colors cursor-pointer"
                        >
                          Subscribe
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>

              {/* Customer Reviews & Form Section */}
              <div className="pt-6 border-t border-gray-100 space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Customer Reviews</h4>
                  <div className="flex items-center gap-1.5">
                    <StarRating rating={viewingProduct.rating} size={14} />
                    <span className="text-xs font-bold text-gray-700">({viewingProduct.rating})</span>
                  </div>
                </div>

                {/* Star Ratings Submission Form */}
                <form onSubmit={handleReviewSubmit} className="space-y-3.5 bg-gray-50 p-4 rounded-xl border border-gray-150">
                  <p className="text-[11px] font-bold text-gray-700 uppercase">Write a Product Review</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Your Rating:</span>
                    <StarRating
                      rating={reviewRating}
                      interactive
                      size={18}
                      onRatingChange={(r) => setReviewRating(r)}
                    />
                  </div>
                  <div className="space-y-2">
                    <textarea
                      required
                      rows={2}
                      placeholder="Comment on your sourcing experience, delivery speeds, and authenticity verification..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs outline-none focus:ring-1 focus:ring-orange-500/30 focus:border-[#ea580c] resize-none"
                    />
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-[#ea580c] text-white text-[11px] font-bold rounded-lg hover:bg-orange-700 transition-colors cursor-pointer w-full sm:w-auto"
                    >
                      Post Review
                    </button>
                  </div>
                  {reviewSuccess && (
                    <p className="text-[11px] text-emerald-700 font-semibold">Review successfully posted!</p>
                  )}
                </form>

                {/* List Reviews with user initials badges instead of photos */}
                <div className="space-y-4 max-h-56 overflow-y-auto pr-1">
                  {reviews
                    .filter((r) => r.productId === viewingProduct.id)
                    .map((rev) => (
                      <div key={rev.id} className="space-y-2 border-b border-gray-50 pb-3 last:border-0">
                        <div className="flex items-center gap-2.5 justify-between">
                          <div className="flex items-center gap-2">
                            <InitialsBadge name={rev.userName} size="sm" />
                            <div className="text-left">
                              <p className="text-xs font-bold text-gray-800">{rev.userName}</p>
                              <span className="text-[10px] text-gray-400 font-mono">{rev.date}</span>
                            </div>
                          </div>
                          <StarRating rating={rev.rating} size={12} />
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed pl-10">{rev.comment}</p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* PORTAL MODAL: SIGN IN / SIGN UP FORMS */}
      {showAuthModal && (
        <Modal
          isOpen={showAuthModal}
          onClose={() => {
            setShowAuthModal(false);
            setAuthError('');
            setIsForgotPassword(false);
            setResetEmailSent(null);
            onAuthModalClosed?.();
          }}
          title={resetEmailSent ? 'Password Reset Sent' : isForgotPassword ? 'Reset Password' : verificationEmail ? 'Verify Email' : isSignUp ? 'Create Sourcing Account' : 'Welcome to UK2UG'}
          maxWidth="sm"
        >
          {resetEmailSent ? (
            <div className="text-center p-4 space-y-6">
              <div className="w-16 h-16 bg-orange-50 text-[#ea580c] rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Mail className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-gray-900">Check Your Email</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  we sent you a password change link to <span className="font-semibold text-gray-900">{resetEmailSent}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAuthForm((prev) => ({ ...prev, email: resetEmailSent, password: '' }));
                  setResetEmailSent(null);
                  setIsForgotPassword(false);
                  setIsSignUp(false);
                  setAuthError('');
                }}
                className="w-full py-3 bg-[#ea580c] hover:bg-orange-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            </div>
          ) : isForgotPassword ? (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 text-left">
              <div className="space-y-1">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Enter your account email address below to receive a password reset link.
                </p>
              </div>

              {authError && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-100 rounded-lg text-xs font-semibold">
                  {authError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-xs sm:text-sm outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={forgotPasswordLoading}
                className="w-full py-2.5 bg-[#ea580c] hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm"
              >
                {forgotPasswordLoading ? 'Sending...' : 'Get reset link'}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setAuthError('');
                  }}
                  className="text-xs font-semibold text-orange-600 hover:text-orange-800 transition-colors cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          ) : verificationEmail ? (
            <div className="text-center p-4 space-y-5">
              <div className="w-16 h-16 bg-orange-50 text-[#ea580c] rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Mail className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-gray-900">Email Verification Required</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  We have dispatched a verification email to <strong className="font-semibold text-gray-900">{verificationEmail}</strong>.
                </p>
              </div>

              {/* Crucial Gmail Spam/Junk guidance callout */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs space-y-1.5 shadow-2xs">
                <p className="font-bold text-amber-950 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  Didn't see the email in your Gmail Inbox?
                </p>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  Automated verification links sent by Google / Firebase often land in your <strong>Spam</strong>, <strong>Junk</strong>, or <strong>Promotions</strong> folder. Please open your Spam folder, look for <em>noreply</em>, and click <strong>"Report not spam"</strong> to activate the link.
                </p>
              </div>

              {resendVerificationNotice && (
                <div className="p-3 bg-orange-50 border border-orange-200 text-orange-900 rounded-xl text-xs font-semibold text-left">
                  {resendVerificationNotice}
                </div>
              )}

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setAuthForm((prev) => ({ ...prev, email: verificationEmail, password: '' }));
                    setVerificationEmail(null);
                    setIsSignUp(false);
                    setAuthError('');
                  }}
                  className="w-full py-3 bg-[#ea580c] hover:bg-orange-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>I've Verified — Proceed to Sign In</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setIsResendingVerification(true);
                    setResendVerificationNotice('');
                    try {
                      if (auth.currentUser) {
                        await sendEmailVerification(auth.currentUser);
                        setResendVerificationNotice('Verification email resent! Please check your Gmail Inbox & Spam folder.');
                      } else {
                        setResendVerificationNotice('To resend, please enter your password on the Sign In tab and click Sign In.');
                        setTimeout(() => {
                          setAuthForm((prev) => ({ ...prev, email: verificationEmail, password: '' }));
                          setVerificationEmail(null);
                          setIsSignUp(false);
                        }, 2500);
                      }
                    } catch (e: any) {
                      setResendVerificationNotice(e.message || 'Check your Spam folder or try signing in.');
                    } finally {
                      setIsResendingVerification(false);
                    }
                  }}
                  disabled={isResendingVerification}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-[#ea580c]" />
                  <span>{isResendingVerification ? 'Sending...' : 'Resend Verification Link'}</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">
            {/* Top segmented tab switcher */}
            <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-xl mb-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setAuthError('');
                }}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  isSignUp
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setAuthError('');
                }}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  !isSignUp
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Sign In
              </button>
            </div>

            {authError && (
              <div className={`p-3 rounded-lg text-xs font-semibold flex items-start gap-2 ${
                authError.toLowerCase().includes('create an account') || authError.toLowerCase().includes('sign up')
                  ? 'bg-orange-50 text-orange-900 border border-orange-200'
                  : 'bg-red-50 text-red-700 border border-red-100'
              }`}>
                {authError.toLowerCase().includes('create an account') || authError.toLowerCase().includes('sign up') ? (
                  <CheckCircle2 className="w-4 h-4 text-[#ea580c] shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <span>{authError}</span>
              </div>
            )}

            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={authForm.fullName}
                  onChange={(e) => setAuthForm({ ...authForm, fullName: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-xs sm:text-sm outline-none"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase">
                {isSignUp ? 'Email Address *' : 'Email Address or Phone Number *'}
              </label>
              <input
                type="text"
                required
                placeholder={isSignUp ? "name@domain.com" : "name@domain.com or +256774540199"}
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-xs sm:text-sm outline-none"
              />
            </div>

            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase">Telephone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +256774540199"
                  value={authForm.phone}
                  onChange={(e) => setAuthForm({ ...authForm, phone: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-xs sm:text-sm outline-none font-mono"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 uppercase">Password *</label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setAuthError('');
                    }}
                    className="text-xs font-semibold text-[#ea580c] hover:underline transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 pr-10 text-xs sm:text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer p-1"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase">Confirm Password *</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={authForm.confirmPassword}
                    onChange={(e) => setAuthForm({ ...authForm, confirmPassword: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 pr-10 text-xs sm:text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer p-1"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-[#ea580c] hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm"
            >
              {isSignUp ? 'Register & Verify' : 'Sign In Securely'}
            </button>

            <div className="relative py-1 flex items-center justify-center">
              <span className="absolute inset-x-0 h-px bg-gray-200"></span>
              <span className="relative bg-white px-2.5 text-[10px] uppercase text-gray-400 font-bold">Or continue with</span>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
              </svg>
              Sign In with Google
            </button>
            <p className="text-[10px] text-gray-400 text-center mt-1.5 font-medium">
              Google Sign-In is strictly for customers. Admins & riders must log in using email & password.
            </p>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setAuthError('');
                  setIsForgotPassword(false);
                  setIsSignUp(!isSignUp);
                }}
                className="text-xs font-semibold text-orange-600 hover:text-orange-800 transition-colors"
              >
                {isSignUp ? 'Already have an account? Sign In' : 'Do not have an account? Sign Up'}
              </button>
            </div>
          </form>
        )}
      </Modal>
      )}

      {/* FOOTER INTERACTIVE MODALS */}
      {activeHelpModal === 'whatsapp' && (
        <Modal
          isOpen={true}
          onClose={() => setActiveHelpModal(null)}
          title="Direct WhatsApp Sourcing Desk"
          maxWidth="md"
        >
          {!currentUser ? (
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-orange-50 text-[#ea580c] rounded-2xl flex items-center justify-center mx-auto border border-orange-100 shadow-inner">
                <MessageCircle className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#ea580c] bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-100">
                  Account Required
                </span>
                <h4 className="text-base font-bold text-gray-900">Sign In to Chat on WhatsApp</h4>
                <p className="text-xs text-gray-600 max-w-sm mx-auto leading-relaxed">
                  Direct WhatsApp communication with our London procurement desk and Kampala dispatches is reserved for verified account holders.
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center max-w-xs mx-auto">
                <button
                  type="button"
                  onClick={() => {
                    setActiveHelpModal(null);
                    setIsSignUp(false);
                    setShowAuthModal(true);
                  }}
                  className="flex-1 py-2.5 px-4 bg-[#000000] text-white text-xs font-bold rounded-lg hover:bg-gray-900 transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveHelpModal(null);
                    setIsSignUp(true);
                    setShowAuthModal(true);
                  }}
                  className="flex-1 py-2.5 px-4 bg-[#ea580c] text-white text-xs font-bold rounded-lg hover:bg-orange-700 transition-colors cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </div>
          ) : (
          <div className="space-y-5 text-left p-1">
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3">
              <span className="p-2 bg-emerald-500 text-white rounded-lg shrink-0">
                <Truck className="w-5 h-5 animate-pulse" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Live UK Procurement Support</h4>
                <p className="text-[11px] text-emerald-700 mt-1 leading-normal">
                  Our live London & Kampala dispatch coordinators are standing by to verify, photograph, and quote your premium UK goods instantly on WhatsApp.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase">Interactive Message Composer</label>
              <textarea
                value={waMessage}
                onChange={(e) => setWaMessage(e.target.value)}
                rows={3}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs outline-none focus:ring-1 focus:ring-orange-500/30 focus:border-[#ea580c] resize-none"
                placeholder="Type your message..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setWaMessage('Hello UK2UG, I want to query a custom tech item from the UK!')}
                className="p-2.5 text-center bg-gray-150 hover:bg-orange-50 hover:text-orange-700 transition-all rounded-lg text-[10px] font-bold text-gray-700 cursor-pointer border border-gray-200/50"
              >
                📱 Custom Tech Quote
              </button>
              <button
                type="button"
                onClick={() => setWaMessage('Hello UK2UG, what is the current transit state of London air freight?')}
                className="p-2.5 text-center bg-gray-150 hover:bg-orange-50 hover:text-orange-700 transition-all rounded-lg text-[10px] font-bold text-gray-700 cursor-pointer border border-gray-200/50"
              >
                ✈️ London Air Freight Timeline
              </button>
              <button
                type="button"
                onClick={() => setWaMessage('Hello UK2UG, I have a dispute regarding my recent Thobani Center pickup.')}
                className="p-2.5 text-center bg-gray-150 hover:bg-orange-50 hover:text-orange-700 transition-all rounded-lg text-[10px] font-bold text-gray-700 cursor-pointer border border-gray-200/50"
              >
                🏪 Thobani Pickup Query
              </button>
            </div>

            <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-left">
                <span className="text-[10px] text-gray-400 font-semibold uppercase font-sans">Official Phone desk</span>
                <p className="text-xs font-bold text-gray-800 font-mono">0774 540199 (Uganda)</p>
              </div>
              <a
                href={`https://wa.me/256774540199?text=${encodeURIComponent(waMessage)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-5 py-2.5 bg-[#ea580c] hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm text-center cursor-pointer"
              >
                <Send className="w-4 h-4" /> Connect to WhatsApp
              </a>
            </div>
          </div>
          )}
        </Modal>
      )}

      {activeHelpModal === 'helpcenter' && (
        <Modal
          isOpen={true}
          onClose={() => setActiveHelpModal(null)}
          title="Ugandan Sourcing Help Center"
          maxWidth="lg"
        >
          <div className="space-y-4 text-left p-1">
            <p className="text-xs text-gray-500 leading-relaxed">
              Find answers regarding UK flagship boutique sourcing, weekly air cargo logistics, tax clearing, and picking up your premium packages at our Kampala Hub.
            </p>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {[
                {
                  q: "How does UK2UG source products from the UK?",
                  a: "We operate a dedicated procurement warehouse in London. Once you place an order, our UK representatives purchase your items directly from brand stores (Apple Store, Currys, Selfridges, etc.) to guarantee 100% authenticity, complete with original retail store receipts."
                },
                {
                  q: "What is the transit, shipping & customs duration?",
                  a: "Our air cargo departs London every week on Friday and lands in Kampala on Monday. Following standard customs clearance, packages are sorted at our Thobani Center Hub and ready for pickup or moto-dispatch in 7 to 14 total business days."
                },
                {
                  q: "Are there additional customs duties or hidden taxes in Uganda?",
                  a: "Absolutely not. The price listed in your cart is fully inclusive of international procurement fees, UK export taxes, air freight charges, Kampala customs clearing, and local warehousing. There are zero hidden fees."
                },
                {
                  q: "How do I track my incoming shipment?",
                  a: "Upon checkout, you receive a unique Order ID (e.g. UK2UG-2026-837492). Enter this ID in our 'Order Tracking' tab in the navigation menu to monitor progress from London warehouse sorting to Kampala arrival and delivery dispatch."
                },
                {
                  q: "Can I source items that are not in your catalog?",
                  a: "Yes! Click the 'Custom Import Request' tab in the main navigation. Submit the UK website link, product description, and quantities, and our agents will issue a custom procurement quote within 24 hours."
                }
              ].map((faq, idx) => (
                <div key={idx} className="border border-gray-150 rounded-lg overflow-hidden bg-white animate-fade-in">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100/50 flex justify-between items-center text-left cursor-pointer transition-colors"
                  >
                    <span className="text-xs font-bold text-gray-800">{faq.q}</span>
                    <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${openFaq === idx ? 'rotate-90' : ''}`} />
                  </button>
                  {openFaq === idx && (
                    <div className="px-4 py-3 border-t border-gray-150 bg-white">
                      <p className="text-xs text-gray-600 leading-relaxed">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {activeHelpModal === 'contact' && (
        <Modal
          isOpen={true}
          onClose={() => setActiveHelpModal(null)}
          title="Official Contact Desk"
          maxWidth="sm"
        >
          {!currentUser ? (
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-orange-50 text-[#ea580c] rounded-2xl flex items-center justify-center mx-auto border border-orange-100 shadow-inner">
                <Mail className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#ea580c] bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-100">
                  Account Required
                </span>
                <h4 className="text-base font-bold text-gray-900">Official Contact Desk Access</h4>
                <p className="text-xs text-gray-600 max-w-sm mx-auto leading-relaxed">
                  Only registered customers can access the official contact desk and submit priority inquiries. Please sign in or create an account to proceed.
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center max-w-xs mx-auto">
                <button
                  type="button"
                  onClick={() => {
                    setActiveHelpModal(null);
                    setIsSignUp(false);
                    setShowAuthModal(true);
                  }}
                  className="flex-1 py-2.5 px-4 bg-[#000000] text-white text-xs font-bold rounded-lg hover:bg-gray-900 transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveHelpModal(null);
                    setIsSignUp(true);
                    setShowAuthModal(true);
                  }}
                  className="flex-1 py-2.5 px-4 bg-[#ea580c] text-white text-xs font-bold rounded-lg hover:bg-orange-700 transition-colors cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </div>
          ) : contactSuccess ? (
            <div className="text-left space-y-4 p-1">
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-center space-y-2">
                <span className="inline-flex p-2 bg-emerald-100 text-emerald-800 rounded-full">
                  <CheckCircle2 className="w-6 h-6 animate-bounce" />
                </span>
                <h4 className="text-sm font-bold text-emerald-800">Inquiry Message Received</h4>
                <p className="text-xs text-emerald-700 leading-normal">
                  Thank you for reaching out. Your inquiry message has been successfully received. A procurement supervisor will review your details and contact you at your email or telephone within 2 hours.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveHelpModal(null)}
                className="w-full py-2 bg-gray-950 text-white text-xs font-bold rounded-lg hover:bg-black cursor-pointer transition-colors"
              >
                Close Desk Window
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setContactSuccess(true);
              }}
              className="space-y-4 text-left p-1"
            >
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wide font-sans">Your Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2 text-xs outline-none focus:border-[#ea580c]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wide font-sans">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2 text-xs outline-none focus:border-[#ea580c]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wide font-sans">Subject of Inquiry</label>
                <select
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2 text-xs outline-none focus:border-[#ea580c]"
                >
                  <option value="Inquiry">General Procurement Inquiry</option>
                  <option value="Custom Quote">Custom Sourcing Quote Request</option>
                  <option value="Shipping Update">Incoming Air Freight Logistics</option>
                  <option value="Corporate Account">Corporate / Wholesale Accounts</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {contactForm.subject === 'Other' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wide font-sans">Specify Other Topic</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter inquiry topic..."
                    value={contactForm.customSubject || ''}
                    onChange={(e) => setContactForm({ ...contactForm, customSubject: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2 text-xs outline-none focus:border-[#ea580c]"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wide font-sans">Message Details</label>
                <textarea
                  required
                  rows={3}
                  placeholder="State the details of your inquiry or specify which UK item you'd like our agents to investigate..."
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs outline-none focus:border-[#ea580c] resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#ea580c] hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Submit Inquiry Message
              </button>
            </form>
          )}
        </Modal>
      )}

      {activeHelpModal === 'shipping' && (
        <Modal
          isOpen={true}
          onClose={() => setActiveHelpModal(null)}
          title="Shipping & Local Dispatch Desk"
          maxWidth="md"
        >
          <div className="space-y-5 text-left p-1">
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-start gap-3">
              <span className="p-2 bg-[#ea580c] text-white rounded-lg shrink-0">
                <Truck className="w-5 h-5 animate-pulse" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-orange-800 uppercase tracking-wide">Kampala Hub Sourcing Fees</h4>
                <p className="text-[11px] text-orange-700 mt-1 leading-normal">
                  We clear customs and deliver packages to all districts across Uganda. Pickup at our Thobani Ground Floor Desk is always 100% free. For home/office deliveries, see the district fee index below.
                </p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-150">
              <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wide block font-sans">Interactive Shipping Fee Estimator</label>
              <div className="space-y-2">
                <span className="text-[11px] text-gray-500">Select Ugandan Delivery District:</span>
                <select
                  value={selectedDistrictFee}
                  onChange={(e) => setSelectedDistrictFee(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#ea580c]"
                >
                  {districts.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedDistrictFee && (
                <div className="pt-2.5 border-t border-gray-200 grid grid-cols-2 gap-y-2 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 font-semibold uppercase font-sans">Dispatch Point</span>
                    <p className="text-gray-800 font-bold">Thobani Center, Kampala</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-semibold uppercase font-sans">Est. Local Delivery Time</span>
                    <p className="text-gray-800 font-bold">
                      {selectedDistrictFee === 'Kampala' ? 'Same-day Dispatch (Within 4 Hrs)' : '24 - 48 Hours via Moto Courier'}
                    </p>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-gray-150 flex items-center justify-between">
                    <span className="text-gray-700 font-bold text-xs uppercase font-sans">Rider Surcharge Fee:</span>
                    <span className="text-[#ea580c] font-bold text-sm">
                      <FormatCurrency value={districts.find((d) => d.name === selectedDistrictFee)?.fee ?? 0} />
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="text-[11px] text-gray-500 bg-gray-50/50 p-3 rounded-lg border border-gray-100 leading-normal">
              💡 <strong>Note</strong>: All packages imported from the UK are packaged with double bubble-wrap layer and sealed in anti-tamper security bags to guarantee safety during final transit.
            </div>
          </div>
        </Modal>
      )}

      {activeHelpModal === 'pickup' && (
        <Modal
          isOpen={true}
          onClose={() => setActiveHelpModal(null)}
          title="Thobani Ground-Floor Pickup Station"
          maxWidth="md"
        >
          <div className="space-y-5 text-left p-1">
            <div className="relative h-40 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center">
              {/* Nice graphical mockup representing Kampala City Map Pin */}
              <div className="absolute inset-0 bg-orange-500/10 flex flex-col items-center justify-center text-center p-4">
                <MapPin className="w-12 h-12 text-[#ea580c] animate-bounce" />
                <h5 className="font-bold text-gray-800 mt-2 text-xs">UK2UG Physical Pickup & Sourcing Office</h5>
                <p className="text-[10px] text-gray-500 font-sans">Shop 16, Ground Floor, Thobani Center, Kampala</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide font-sans">Pickup Station Operating Guidelines</h4>
              <ul className="text-xs text-gray-600 space-y-2.5 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <li className="flex items-start gap-2">
                  <span className="text-[#ea580c] font-bold shrink-0">✓</span>
                  <span><strong>Operating Hours:</strong> Monday through Saturday from 8:30 AM to 7:30 PM. (Closed on Sundays).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#ea580c] font-bold shrink-0">✓</span>
                  <span><strong>Zero Fees:</strong> Pickups at Thobani Center are completely free of logistics surcharges.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#ea580c] font-bold shrink-0">✓</span>
                  <span><strong>Required Security Check:</strong> Please bring your original <strong>UK2UG Order ID</strong> and your secret <strong>4-digit Delivery PIN</strong> (sent to your phone upon arrival).</span>
                </li>
              </ul>
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>Have problems finding the shop?</span>
              <span className="font-mono font-bold text-gray-800">Phone Desk: 0774 540199</span>
            </div>
          </div>
        </Modal>
      )}

      {activeHelpModal === 'report' && (
        <Modal
          isOpen={true}
          onClose={() => setActiveHelpModal(null)}
          title="Report Sourcing / Quality Mismatch"
          maxWidth="md"
        >
          {reportSuccessCode ? (
            <div className="text-left space-y-4 p-1">
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-center space-y-2.5">
                <span className="inline-flex p-2 bg-amber-100 text-amber-800 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-amber-600 animate-bounce" />
                </span>
                <h4 className="text-sm font-bold text-amber-800">Mismatch Case Lodged</h4>
                <p className="text-xs text-amber-700 leading-normal">
                  Your ticket was successfully submitted to our quality verification coordinators. A review panel has been assigned to compare the original London retail boutique checkout parameters with your reported package state.
                </p>
                <div className="bg-white border border-amber-200/50 p-3 rounded-lg mt-1 font-mono">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold font-sans">Priority Case Code</span>
                  <p className="text-xs font-bold text-gray-800">{reportSuccessCode}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveHelpModal(null)}
                className="w-full py-2.5 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-black cursor-pointer transition-colors"
              >
                Close Ticket Window
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const categoryMapping: Record<string, ComplaintCategory> = {
                  wrong_item: 'Wrong Item Model',
                  transit_damage: 'Damaged / Broken Item',
                  missing_accessories: 'Missing Accessories',
                  function_issue: 'Quality Discrepancy',
                };
                if (addComplaint) {
                  const comp = addComplaint({
                    orderId: reportForm.orderId.trim(),
                    customerName: currentUser?.name || 'Valued Customer',
                    customerEmail: currentUser?.email || 'customer@uk2ug.com',
                    customerPhone: reportForm.contactPhone.trim(),
                    category: categoryMapping[reportForm.issueType] || 'Quality Discrepancy',
                    priority: 'High',
                    subject: `Quality Issue: ${reportForm.issueType.replace('_', ' ').toUpperCase()} on Order #${reportForm.orderId.trim()}`,
                    description: reportForm.description.trim(),
                    images: mismatchFiles.map((f) => f.url),
                  });
                  setReportSuccessCode(comp.id);
                } else {
                  setReportSuccessCode('UK2UG-CMP-' + Math.floor(100000 + Math.random() * 900000));
                }
              }}
              className="space-y-4 text-left p-1"
            >
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-[11px] text-red-700 leading-normal flex items-start gap-2">
                <span className="font-bold">⚠️ Notice:</span>
                <span>All items sourced from Uk2Ug are 100% verified. Submit this form if there is any missmatch.</span>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wide font-sans">UK2UG Order ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UK2UG-2026-394850"
                  value={reportForm.orderId}
                  onChange={(e) => setReportForm({ ...reportForm, orderId: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2 text-xs outline-none focus:border-red-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wide font-sans">Mismatch Category *</label>
                  <select
                    value={reportForm.issueType}
                    onChange={(e) => setReportForm({ ...reportForm, issueType: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2 text-xs outline-none focus:border-red-500"
                  >
                    <option value="wrong_item">Wrong Product Model</option>
                    <option value="transit_damage">Transit Damage (Scratches/Cracks)</option>
                    <option value="missing_accessories">Missing Parts/Accessories</option>
                    <option value="function_issue">Electronic Malfunction</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wide font-sans">Contact Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 0774 540199"
                    value={reportForm.contactPhone}
                    onChange={(e) => setReportForm({ ...reportForm, contactPhone: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2 text-xs outline-none focus:border-red-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wide font-sans">Discrepancy Details *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide precise details about the quality mismatch or damage..."
                  value={reportForm.description}
                  onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs outline-none focus:border-red-500 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wide font-sans">Attach Mismatch Evidence (Optional)</label>
                <input
                  type="file"
                  ref={mismatchFileInputRef}
                  accept="image/png, image/jpeg, image/webp"
                  multiple
                  onChange={(e) => handleProcessMismatchFiles(e.target.files)}
                  className="hidden"
                />
                <div
                  onClick={() => mismatchFileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingMismatch(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDraggingMismatch(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingMismatch(false);
                    handleProcessMismatchFiles(e.dataTransfer.files);
                  }}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                    isDraggingMismatch
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-red-300 bg-gray-50/50'
                  }`}
                >
                  <UploadCloud className={`w-6 h-6 mx-auto mb-1 ${isDraggingMismatch ? 'text-red-500 scale-110' : 'text-gray-400'} transition-all`} />
                  <p className="text-[10px] font-medium text-gray-600">
                    {isDraggingMismatch ? 'Drop images here...' : 'Drag & drop or click to upload phone photos (PNG/JPG)'}
                  </p>
                </div>

                {mismatchFiles.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {mismatchFiles.map((file, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-100 aspect-video flex items-center justify-center">
                        <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMismatchFiles((prev) => prev.filter((_, i) => i !== idx));
                          }}
                          className="absolute top-1 right-1 bg-black/70 hover:bg-red-600 text-white rounded-full p-1 text-xs cursor-pointer transition-colors shadow-sm"
                          title="Remove photo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] px-1 py-0.5 truncate text-center">
                          {file.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm"
              >
                Submit Quality Discrepancy Ticket
              </button>
            </form>
          )}
        </Modal>
      )}

      {/* MY ACCOUNT MODAL */}
      {showAccountModal && currentUser && (
        <Modal
          isOpen={showAccountModal}
          onClose={() => setShowAccountModal(false)}
          title="My Account"
          maxWidth="lg"
        >
          <div className="space-y-6 text-left p-1">
            {/* Header Badge Card */}
            <div className="flex items-center gap-4 bg-orange-50/60 border border-orange-100/80 p-4 rounded-xl">
              <InitialsBadge name={currentUser.name} size="lg" />
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-gray-900 truncate">{currentUser.name}</h3>
                <p className="text-xs text-gray-500 font-mono truncate">{currentUser.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-semibold text-orange-700 bg-white px-2.5 py-0.5 rounded-full border border-orange-200">
                    Phone: {currentUser.phone || '0774 540199'}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            {(() => {
              const myComplaints = complaints.filter(
                (c) => c.customerEmail === currentUser.email || c.customerPhone === currentUser.phone
              );
              return (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <button
                      type="button"
                      onClick={navigateToMyOrders}
                      className="p-3 bg-gray-50 hover:bg-orange-50/60 border border-gray-100 rounded-xl text-center transition-colors cursor-pointer"
                      title="Click to view order history"
                    >
                      <p className="text-lg font-bold text-gray-900">
                        {myOrdersList.length}
                      </p>
                      <p className="text-[10px] text-gray-500 font-semibold uppercase">Total Orders</p>
                    </button>
                    <button
                      type="button"
                      onClick={navigateToMyRequests}
                      className="p-3 bg-gray-50 hover:bg-orange-50/60 border border-gray-100 rounded-xl text-center transition-colors cursor-pointer"
                      title="Click to view product requests"
                    >
                      <p className="text-lg font-bold text-[#ea580c]">
                        {myRequestsList.length}
                      </p>
                      <p className="text-[10px] text-gray-500 font-semibold uppercase">Requests</p>
                    </button>
                    <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-center">
                      <p className="text-lg font-bold text-gray-900">
                        {wishlist.length}
                      </p>
                      <p className="text-[10px] text-gray-500 font-semibold uppercase">Wishlist</p>
                    </div>
                    <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl text-center">
                      <p className="text-lg font-bold text-amber-900">
                        {myComplaints.length}
                      </p>
                      <p className="text-[10px] text-amber-700 font-semibold uppercase">Complaints</p>
                    </div>
                  </div>

                  {/* Account Details */}
                  <div className="space-y-3 bg-white border border-gray-100 p-4 rounded-xl">
                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Account Specifications</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-400 font-medium text-[11px]">Primary Email</span>
                        <p className="font-semibold text-gray-800 font-mono mt-0.5">{currentUser.email}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 font-medium text-[11px]">Contact Line</span>
                        <p className="font-semibold text-gray-800 font-mono mt-0.5">{currentUser.phone || '0774 540199'}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 font-medium text-[11px]">Preferred Delivery Hub</span>
                        <p className="font-semibold text-gray-800 mt-0.5">Thobani Center, Kampala</p>
                      </div>
                      <div>
                        <span className="text-gray-400 font-medium text-[11px]">Account Status</span>
                        <p className="font-semibold text-orange-700 mt-0.5">Verified UK2UG Customer</p>
                      </div>
                    </div>
                  </div>

                  {/* My Lodged Complaints / Quality Disputes */}
                  <div className="space-y-3 bg-white border border-gray-150 p-4 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          My Quality Complaints & Reports
                        </h4>
                        <p className="text-[10px] text-gray-500">Track dispute reviews and admin resolutions</p>
                      </div>
                      <button
                        onClick={() => {
                          setShowAccountModal(false);
                          setActiveHelpModal('report');
                        }}
                        className="px-2.5 py-1 text-[10px] font-bold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
                      >
                        + File New Complaint
                      </button>
                    </div>

                    {myComplaints.length === 0 ? (
                      <p className="text-xs text-gray-400 py-2 italic text-center bg-gray-50 rounded-lg">
                        No quality complaints or mismatch tickets lodged.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {myComplaints.map((c) => {
                          const statusColors: Record<string, string> = {
                            Open: 'bg-amber-100 text-amber-800 border-amber-200',
                            'Under Review': 'bg-blue-100 text-blue-800 border-blue-200',
                            'In Progress': 'bg-purple-100 text-purple-800 border-purple-200',
                            Resolved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                            Rejected: 'bg-rose-100 text-rose-800 border-rose-200',
                          };
                          return (
                            <div key={c.id} className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg space-y-1.5 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-[10px] font-bold text-gray-800">{c.id}</span>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusColors[c.status] || 'bg-gray-100 text-gray-800'}`}>
                                  {c.status}
                                </span>
                              </div>
                              <p className="font-semibold text-gray-900 text-xs">{c.subject}</p>
                              <div className="flex items-center justify-between text-[10px] text-gray-500">
                                <span>Category: <strong className="text-gray-700">{c.category}</strong></span>
                                {c.orderId && <span>Order: <strong className="font-mono text-gray-700">#{c.orderId}</strong></span>}
                              </div>
                              {c.adminResponse && (
                                <div className="mt-1.5 p-2 bg-emerald-50 border border-emerald-200/80 rounded text-[11px] text-emerald-900">
                                  <span className="font-bold text-[9px] uppercase tracking-wide text-emerald-700 block">Admin Official Response:</span>
                                  {c.adminResponse}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}

            {/* Navigation Shortcuts */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              <button
                onClick={navigateToMyOrders}
                className="w-full py-2.5 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-black transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>My Orders ({myOrdersList.length})</span>
              </button>
              <button
                onClick={navigateToFlaggedIssues}
                className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Flagged Issues</span>
                {totalFlaggedCount > 0 && (
                  <span className="bg-red-600 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full">
                    {totalFlaggedCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  setShowAccountModal(false);
                  setShowMessagesModal(true);
                }}
                className="w-full py-2.5 bg-[#ea580c] text-white text-xs font-semibold rounded-lg hover:bg-[#c2410c] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Support Chat
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MESSAGES & CUSTOMER SUPPORT MODAL */}
      {showMessagesModal && currentUser && (
        <Modal
          isOpen={showMessagesModal}
          onClose={() => setShowMessagesModal(false)}
          title="UK2UG Direct Messaging Desk"
          maxWidth="2xl"
        >
          <div className="space-y-4 text-left p-1">
            {/* Modal Subheader */}
            <div className="flex items-center justify-between bg-orange-50 border border-orange-100 p-3 rounded-xl">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#ea580c] text-white rounded-lg">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Direct Admin & Customer Desk</h4>
                  <p className="text-[10px] text-gray-500">Live conversation with Kampala & London logistics team</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-[#ea580c] bg-white px-2.5 py-1 rounded-full border border-orange-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c] animate-pulse"></span>
                Admin Desk Online
              </span>
            </div>

            {/* Message Thread History */}
            <div className="bg-slate-50 border border-gray-100 rounded-xl p-4 h-[350px] overflow-y-auto space-y-3">
              {(() => {
                const userMessages = messages.filter(
                  m => m.userEmail === currentUser.email || m.userPhone === currentUser.phone
                );

                if (userMessages.length === 0) {
                  return (
                    <div className="text-center py-16 space-y-2">
                      <MessageSquare className="w-10 h-10 text-gray-300 mx-auto" />
                      <p className="text-xs font-semibold text-gray-600">No messages yet with UK2UG Support.</p>
                      <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
                        Type a message below to ask about your UK import orders, custom sourcing quotes, or delivery schedules.
                      </p>
                    </div>
                  );
                }

                return userMessages.map((msg) => {
                  const isAdmin = msg.sender === 'admin';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] text-gray-400">
                        <span className="font-semibold text-gray-600">
                          {isAdmin ? 'UK2UG Admin Desk' : 'You'}
                        </span>
                        <span>•</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm ${
                          isAdmin
                            ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                            : 'bg-[#ea580c] text-white rounded-tr-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Quick Suggestion Chips */}
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Quick Assistance Prompts</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  '📦 What is the current status of my order?',
                  '🛬 When is the next London air freight arriving?',
                  '🏷️ How do I request a custom UK sourcing quote?',
                  '🏬 What are the Thobani Center pickup hours?',
                ].map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setChatInputText(prompt)}
                    className="text-[10px] bg-gray-100 hover:bg-orange-50 hover:text-[#ea580c] hover:border-orange-200 text-gray-700 px-2.5 py-1 rounded-full border border-gray-200 transition-colors cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Send Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (chatInputText.trim()) {
                  sendMessage({
                    sender: 'customer',
                    senderName: currentUser.name,
                    userEmail: currentUser.email,
                    userPhone: currentUser.phone,
                    text: chatInputText.trim(),
                    readByCustomer: true,
                    readByAdmin: false,
                  });
                  setChatInputText('');
                }
              }}
              className="flex items-center gap-2 pt-1"
            >
              <input
                type="text"
                value={chatInputText}
                onChange={(e) => setChatInputText(e.target.value)}
                placeholder="Write your message to UK2UG Admin..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#ea580c] focus:bg-white transition-all"
              />
              <button
                type="submit"
                disabled={!chatInputText.trim()}
                className="px-5 py-2.5 bg-[#ea580c] text-white text-xs font-semibold rounded-xl hover:bg-[#c2410c] transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                Send
              </button>
            </form>
          </div>
        </Modal>
      )}

      {/* CUSTOMER PRODUCT PHOTO LIGHTBOX MODAL */}
      {customerLightboxImage && (
        <Modal
          isOpen={Boolean(customerLightboxImage)}
          onClose={() => setCustomerLightboxImage(null)}
          title="Sourced Item Photo Preview"
          maxWidth="2xl"
        >
          <div className="space-y-3 text-center p-2">
            <div className="bg-gray-100 rounded-xl overflow-hidden max-h-[70vh] flex items-center justify-center p-2 border border-gray-200">
              <img
                src={customerLightboxImage}
                alt="Enlarged preview"
                className="max-h-[65vh] w-auto max-w-full object-contain rounded"
              />
            </div>
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] text-gray-500">Customer Sourced Item Reference Photo</span>
              <a
                href={customerLightboxImage}
                target="_blank"
                rel="noreferrer noopener"
                className="text-xs text-[#ea580c] font-bold hover:underline inline-flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Full Size
              </a>
            </div>
          </div>
        </Modal>
      )}

      {/* PRODUCT VARIATION SELECTION MODAL */}
      {variationModalProduct && (
        <ProductVariationModal
          product={variationModalProduct}
          isOpen={Boolean(variationModalProduct)}
          onClose={() => setVariationModalProduct(null)}
          onAddToCart={handleVariationAddToCart}
        />
      )}

      {/* MODAL: CONFIRM ORDER RECORD DELETION */}
      {orderToDelete && (
        <Modal
          isOpen={Boolean(orderToDelete)}
          onClose={() => setOrderToDelete(null)}
          title={`Delete Order Record • #${orderToDelete.id}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-left">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-bold text-amber-900">10-Day Execution Retention Policy</p>
                <p className="text-amber-800 leading-relaxed text-[11px]">
                  This order was executed {getOrderExecutionDays(orderToDelete)} days ago and has passed the 10-day retention period. You are eligible to permanently delete this record from your history.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-gray-900">#{orderToDelete.id}</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] border border-emerald-100">
                  {orderToDelete.status}
                </span>
              </div>
              <p className="text-gray-600 text-[11px]">
                Items: {orderToDelete.items.map((i) => `${i.title} (x${i.quantity})`).join(', ')}
              </p>
              <p className="font-mono font-bold text-gray-900">
                Total: UGX {new Intl.NumberFormat('en-UG').format(orderToDelete.totalAmount)}
              </p>
            </div>

            <p className="text-xs text-red-600 font-medium">
              Warning: This action is permanent and cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDeleteOrder(orderToDelete)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Permanently Delete</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: CONFIRM PRODUCT REQUEST DELETION */}
      {requestToDelete && (
        <Modal
          isOpen={Boolean(requestToDelete)}
          onClose={() => setRequestToDelete(null)}
          title={`Delete Sourcing Request • ${requestToDelete.id}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-left">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-bold text-amber-900">10-Day Execution Retention Policy</p>
                <p className="text-amber-800 leading-relaxed text-[11px]">
                  This product sourcing request was completed {getRequestExecutionDays(requestToDelete)} days ago and is now eligible for deletion from your active sourcing history.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900">{requestToDelete.productName}</span>
                <span className="font-mono text-[10px] text-gray-500">{requestToDelete.id}</span>
              </div>
              <p className="text-gray-500 text-[11px] line-clamp-1">{requestToDelete.description}</p>
            </div>

            <p className="text-xs text-red-600 font-medium">
              Warning: Permanently removing this request will clear its details and image records.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setRequestToDelete(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDeleteRequest(requestToDelete)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete Request</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: RESUBMIT / CORRECT PAYMENT REFERENCE */}
      {fixPaymentOrder && (
        <Modal
          isOpen={Boolean(fixPaymentOrder)}
          onClose={() => {
            setFixPaymentOrder(null);
            setFixPaymentSuccessMsg('');
          }}
          title={`Correct Payment Reference • Order #${fixPaymentOrder.id}`}
          maxWidth="md"
        >
          <form onSubmit={handleResubmitPayment} className="space-y-4 text-left">
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl space-y-1 text-xs">
              <span className="font-bold text-red-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Reason Flagged by Finance
              </span>
              <p className="text-red-800 text-[11px] leading-relaxed">
                {fixPaymentOrder.paymentNotes || 'Your payment reference could not be verified on the mobile money / banking ledger. Please enter the correct transaction reference code below.'}
              </p>
            </div>

            {fixPaymentSuccessMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{fixPaymentSuccessMsg}</span>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">Payment Method Channel</label>
                  <select
                    value={fixPaymentMethod}
                    onChange={(e) => setFixPaymentMethod(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs outline-none focus:ring-2 focus:ring-[#ea580c]/10 focus:border-[#ea580c]"
                  >
                    <option value="MTN Mobile Money">MTN Mobile Money (*165#)</option>
                    <option value="Airtel Money">Airtel Money (*185#)</option>
                    <option value="Visa / Mastercard">Visa / Mastercard Card Settlement</option>
                    <option value="Bank Transfer">Bank Transfer (Stanbic / Centenary)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">Payment Mobile Number / Payer Name</label>
                  <input
                    type="text"
                    value={fixPaymentPhone}
                    onChange={(e) => setFixPaymentPhone(e.target.value)}
                    placeholder="e.g. 0774 540199 or Payer Name"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs font-mono outline-none focus:ring-2 focus:ring-[#ea580c]/10 focus:border-[#ea580c]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">
                    New Transaction Reference / ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fixPaymentRef}
                    onChange={(e) => setFixPaymentRef(e.target.value)}
                    placeholder="e.g. 3829104829 or MTN / Airtel Ref Code"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs font-mono outline-none focus:ring-2 focus:ring-[#ea580c]/10 focus:border-[#ea580c]"
                    required
                    autoFocus
                  />
                  <p className="text-[10px] text-gray-400">
                    Find this transaction ID in the SMS confirmation sent by MTN (*165#) or Airtel (*185#).
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setFixPaymentOrder(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPayment}
                    className="px-4 py-2 bg-[#ea580c] hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-60"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSubmittingPayment ? "animate-spin" : ""}`} />
                    <span>{isSubmittingPayment ? "Submitting..." : "Resubmit for Verification"}</span>
                  </button>
                </div>
              </>
            )}
          </form>
        </Modal>
      )}

      {/* CUSTOMER PERSONAL NOTIFICATIONS & ORDER ALERTS MODAL */}
      {showNotificationsDrawer && (
        <Modal
          isOpen={showNotificationsDrawer}
          onClose={() => setShowNotificationsDrawer(false)}
          title="Order Notifications & Handover Alerts"
          maxWidth="2xl"
        >
          <div className="space-y-4 text-left p-1" id="customer-notifications-drawer-panel">
            {/* Header controls bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50/80 p-3 sm:p-4 rounded-xl border border-gray-150">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#ea580c] flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                    {unreadNotifCount > 0 ? `${unreadNotifCount} Unread Alert${unreadNotifCount > 1 ? 's' : ''}` : 'All Caught Up'}
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    London Heathrow cargo flight arrivals, customs clearance &amp; 4-Digit Handover PINs
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {unreadNotifCount > 0 && markAllNotificationsAsRead && (
                  <button
                    type="button"
                    onClick={() => {
                      markAllNotificationsAsRead(currentUser?.email);
                    }}
                    className="px-2.5 py-1.5 text-[11px] font-bold text-[#ea580c] hover:bg-orange-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-orange-200 shadow-2xs"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
                {myNotifications.length > 0 && clearAllNotifications && (
                  <button
                    type="button"
                    onClick={() => {
                      clearAllNotifications(currentUser?.email);
                    }}
                    className="px-2.5 py-1.5 text-[11px] font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear all</span>
                  </button>
                )}
              </div>
            </div>

            {/* Notification items */}
            {myNotifications.length === 0 ? (
              <div className="text-center py-10 px-4 space-y-3 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h5 className="text-sm font-bold text-gray-900">No active notifications</h5>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                    You have no active order notifications. When you place an order or your package reaches Kampala for pickup, updates and your 4-digit Handover PIN will appear here.
                  </p>
                </div>
                {myOrdersList.length === 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotificationsDrawer(false);
                      setActiveTab('shop');
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#ea580c] hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Explore UK Products</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
                {myNotifications.map((notif) => {
                  const isFlagged = notif.type === 'payment_flagged';
                  const isRead = notif.read;
                  const matchingOrder = myOrdersList.find((o) => o.id === notif.orderId);

                  return (
                    <div
                      key={notif.id}
                      className={`p-3.5 sm:p-4 rounded-xl border transition-all relative ${
                        isFlagged
                          ? 'bg-red-50/70 border-red-200 text-red-950'
                          : isRead
                          ? 'bg-white border-gray-200 text-gray-800'
                          : 'bg-orange-50/40 border-orange-200/80 text-gray-900 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div
                            className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                              isFlagged
                                ? 'bg-red-100 text-red-700'
                                : isRead
                                ? 'bg-gray-100 text-gray-500'
                                : 'bg-[#ea580c]/10 text-[#ea580c]'
                            }`}
                          >
                            {isFlagged ? (
                              <AlertTriangle className="w-4 h-4" />
                            ) : (notif.type === 'handover_store' || notif.type === 'handover_rider') ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <Truck className="w-4 h-4" />
                            )}
                          </div>

                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h5 className="text-xs sm:text-sm font-bold text-gray-900">{notif.title}</h5>
                              {!isRead && (
                                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-[#ea580c] text-white">
                                  NEW
                                </span>
                              )}
                              {notif.orderId && (
                                <span className="font-mono text-[10px] px-2 py-0.5 bg-gray-100 text-gray-700 font-bold rounded-md">
                                  #{notif.orderId}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-gray-600 leading-relaxed font-sans">{notif.message}</p>

                            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-gray-400">
                              <span className="flex items-center gap-1 font-mono">
                                <Clock className="w-3 h-3" />
                                {new Date(notif.createdAt).toLocaleString('en-UG', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>

                              {matchingOrder && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowNotificationsDrawer(false);
                                    setTrackedOrder(matchingOrder);
                                    setTrackingNumber(matchingOrder.id);
                                    navigateToMyOrders();
                                  }}
                                  className="text-[#ea580c] hover:underline font-bold cursor-pointer"
                                >
                                  View Order & PIN &rarr;
                                </button>
                              )}

                              {isFlagged && matchingOrder && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowNotificationsDrawer(false);
                                    setFixPaymentOrder(matchingOrder);
                                    setFixPaymentPhone(matchingOrder.paymentPhone || matchingOrder.customerPhone || '');
                                    setFixPaymentRef(matchingOrder.paymentTransactionRef || '');
                                    setFixPaymentMethod(matchingOrder.paymentMethod || 'MTN Mobile Money');
                                  }}
                                  className="text-red-700 hover:underline font-bold cursor-pointer flex items-center gap-1"
                                >
                                  <CreditCard className="w-3 h-3" />
                                  <span>Update Payment Details &rarr;</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {!isRead && markNotificationAsRead && (
                            <button
                              type="button"
                              onClick={() => markNotificationAsRead(notif.id)}
                              className="p-1.5 text-gray-400 hover:text-[#ea580c] hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                              title="Mark as read"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {deleteNotification && (
                            <button
                              type="button"
                              onClick={() => deleteNotification(notif.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete notification"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* CUSTOMER ACTION TOAST */}
      {customerActionToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-medium border border-gray-700 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{customerActionToast}</span>
        </div>
      )}

      {/* Corporate Grid Footer Architecture */}
      <footer className="bg-[#000000] text-white border-t border-gray-800 py-12 mt-16 shrink-0" id="uk2ug-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="space-y-4">
              <span className="text-xl font-bold tracking-tight text-[#ea580c]">UK2UG</span>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed max-w-sm font-sans">
                "UK Quality, Delivered to Uganda" — The premium sourcing portal to buy and import authentic products from London's retail flagship boutiques.
              </p>
            </div>

            <div className="space-y-3.5">
              <h4 className="text-xs uppercase tracking-widest text-[#ea580c] font-bold flex items-center gap-1.5">
                <span>Need Sourcing Help?</span>
              </h4>
              <ul className="space-y-2 text-xs text-gray-400">
                <li>
                  <button
                    onClick={() => {
                      if (!requireAuth('chat with our UK & Uganda dispatch coordinators on WhatsApp')) return;
                      setActiveHelpModal('whatsapp');
                      setWaMessage('Hello UK2UG, I have a sourcing question!');
                    }}
                    className="hover:text-white transition-colors cursor-pointer text-left flex items-center gap-1.5"
                  >
                    <span>Chat with us on WhatsApp</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      if (!requireAuth('access the Ugandan Sourcing Help Center')) return;
                      setActiveHelpModal('helpcenter');
                    }}
                    className="hover:text-white transition-colors cursor-pointer text-left flex items-center gap-1.5"
                  >
                    <span>Ugandan Sourcing Help Center</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      if (!requireAuth('access our official contact desk')) return;
                      setActiveHelpModal('contact');
                      setContactSuccess(false);
                    }}
                    className="hover:text-white transition-colors cursor-pointer text-left flex items-center gap-1.5"
                  >
                    <span>Official Contact Desk</span>
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-3.5">
              <h4 className="text-xs uppercase tracking-widest text-[#ea580c] font-bold flex items-center gap-1.5">
                <span>Useful Sourcing Links</span>
              </h4>
              <ul className="space-y-2 text-xs text-gray-400">
                <li>
                  <button
                    onClick={() => {
                      if (!requireAuth('place an order and access the checkout catalog')) return;
                      setActiveTab('shop');
                    }}
                    className="hover:text-white transition-colors cursor-pointer text-left flex items-center gap-1.5"
                  >
                    <span>Place an order</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setActiveTab('cart');
                    }}
                    className="hover:text-white transition-colors cursor-pointer text-left flex items-center gap-1.5"
                  >
                    <span>Pay for your order</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      if (!requireAuth('view shipping logistics and dispatch specifications')) return;
                      setActiveHelpModal('shipping');
                    }}
                    className="hover:text-white transition-colors cursor-pointer text-left flex items-center gap-1.5"
                  >
                    <span>Shipping & Local Dispatch</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      if (!requireAuth('access Thobani Pickup Station protocols and coordinates')) return;
                      setActiveHelpModal('pickup');
                    }}
                    className="hover:text-white transition-colors cursor-pointer text-left flex items-center gap-1.5"
                  >
                    <span>Thobani Pickup Station</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      if (!requireAuth('report a product quality discrepancy ticket')) return;
                      setActiveHelpModal('report');
                      setReportSuccessCode('');
                    }}
                    className="hover:text-white transition-colors cursor-pointer text-left flex items-center gap-1.5"
                  >
                    <span>Report product quality mismatch</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400 text-left">
            <p>Shop: Thobani Center, Shop 16, Ground Floor, Kampala, Uganda</p>
            <div className="flex items-center gap-4">
              <span className="text-gray-500 hidden sm:inline">Official Retailer Verification & Secure Handover PIN Enabled</span>
              <button
                type="button"
                onClick={() => {
                  if (!requireAuth('connect to the official customer phone desk')) return;
                }}
                className="font-mono text-gray-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                title="Customer Desk: 0774 540199"
              >
                <span>Customer Desk: 0774 540199</span>
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
