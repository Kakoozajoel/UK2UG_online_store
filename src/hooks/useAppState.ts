import { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Product, Category, District, Order, ImportRequest, Review, Customer, CartItem, ChatMessage, StorefrontBanner, DEFAULT_STOREFRONT_BANNER, Complaint, ComplaintStatus, PreOrderStatus, ProductVariation, ADMIN_UID, Rider, CustomerNotification, UserRole } from '../types';
import { determineRole, isAdminUser, isRiderUser, getAdminEmails, getRiderEmails } from '../lib/rbac';
import { isEstimatedArrivalReached } from '../lib/preOrderStatusManager';
import {
  INITIAL_CATEGORIES,
  INITIAL_DISTRICTS,
  INITIAL_PRODUCTS,
  INITIAL_REVIEWS,
  INITIAL_ORDERS,
  INITIAL_IMPORTS,
  INITIAL_CUSTOMERS,
  INITIAL_MESSAGES,
  INITIAL_COMPLAINTS,
  INITIAL_RIDERS,
} from '../data/seedData';
import {
  setupFirestoreListeners,
  saveProductToFirestore,
  deleteProductFromFirestore,
  saveOrderToFirestore,
  deleteOrderFromFirestore,
  saveImportToFirestore,
  deleteImportFromFirestore,
  saveReviewToFirestore,
  saveCategoryToFirestore,
  deleteCategoryFromFirestore,
  saveDistrictToFirestore,
  deleteDistrictFromFirestore,
  saveCustomerToFirestore,
  deleteCustomerFromFirestore,
  saveMessageToFirestore,
  deleteMessageFromFirestore,
  saveStorefrontBannerToFirestore,
  saveComplaintToFirestore,
  deleteComplaintFromFirestore,
  saveRiderToFirestore,
  deleteRiderFromFirestore,
  saveNotificationToFirestore,
  deleteNotificationFromFirestore,
  getStoredDeletedOrderIds,
  recordDeletedOrderId,
} from '../lib/firestoreSync';

export interface AppState {
  products: Product[];
  categories: Category[];
  districts: District[];
  orders: Order[];
  imports: ImportRequest[];
  reviews: Review[];
  customers: Customer[];
  messages: ChatMessage[];
  complaints: Complaint[];
  riders: Rider[];
  notifications: CustomerNotification[];
  cart: CartItem[];
  wishlist: string[];
  banner: StorefrontBanner;
}


export function useAppState() {
  const [state, setState] = useState<AppState>(() => {
    const getOrSeed = <T>(key: string, seed: T): T => {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return seed;
        }
      }
      localStorage.setItem(key, JSON.stringify(seed));
      return seed;
    };

    return {
      products: getOrSeed('uk2ug_clean_products', INITIAL_PRODUCTS),
      categories: getOrSeed('uk2ug_clean_categories', INITIAL_CATEGORIES),
      districts: getOrSeed('uk2ug_clean_districts', INITIAL_DISTRICTS),
      orders: (() => {
        const deletedIds = getStoredDeletedOrderIds();
        const loaded = getOrSeed<Order[]>('uk2ug_clean_orders', INITIAL_ORDERS);
        return (Array.isArray(loaded) ? loaded : []).filter((o: Order) => !deletedIds.has(o.id));
      })(),
      imports: getOrSeed('uk2ug_clean_imports', INITIAL_IMPORTS),
      reviews: getOrSeed('uk2ug_clean_reviews', INITIAL_REVIEWS),
      customers: getOrSeed('uk2ug_clean_customers', INITIAL_CUSTOMERS),
      messages: getOrSeed('uk2ug_clean_messages', INITIAL_MESSAGES),
      complaints: getOrSeed('uk2ug_clean_complaints', INITIAL_COMPLAINTS),
      riders: getOrSeed('uk2ug_clean_riders', INITIAL_RIDERS),
      notifications: getOrSeed<CustomerNotification[]>('uk2ug_clean_notifications', []),
      cart: getOrSeed<CartItem[]>('uk2ug_clean_cart', []).filter((item) => !item.autoAddedOnArrival),
      wishlist: getOrSeed<string[]>('uk2ug_clean_wishlist', []),
      banner: (() => {
        const stored = getOrSeed<StorefrontBanner>('uk2ug_clean_banner', DEFAULT_STOREFRONT_BANNER);
        const filteredNotices = (stored?.adminNotices || []).filter(
          (n) => n.id !== 'notice-uk-cargo-1' && !n.title.toLowerCase().includes('heathrow')
        );
        const bannerObj = {
          ...DEFAULT_STOREFRONT_BANNER,
          ...stored,
          adminNotices: filteredNotices,
          isActive: stored?.isActive !== undefined ? stored.isActive : true,
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem('uk2ug_clean_banner', JSON.stringify(bannerObj));
        }
        return bannerObj;
      })(),
    };
  });

  // Session inactivity timeout: 20 minutes (1,200,000 ms)
  const INACTIVITY_TIMEOUT_MS = 20 * 60 * 1000;

  const [sessionTimedOut, setSessionTimedOut] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('uk2ug_session_timed_out') === 'true';
    } catch {
      return false;
    }
  });
  const [timedOutEmail, setTimedOutEmail] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('uk2ug_timed_out_email') || null;
    } catch {
      return null;
    }
  });

  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    phone?: string;
    role: UserRole;
    uid?: string;
    createdAt?: string;
  } | null>(() => {
    try {
      const stored = sessionStorage.getItem('uk2ug_session_user');
      const lastActiveStr = sessionStorage.getItem('uk2ug_session_last_active');
      if (stored && lastActiveStr) {
        const lastActive = parseInt(lastActiveStr, 10);
        if (!isNaN(lastActive) && Date.now() - lastActive >= INACTIVITY_TIMEOUT_MS) {
          // Inactive for 20 minutes before tab refresh
          const parsed = JSON.parse(stored);
          sessionStorage.removeItem('uk2ug_session_user');
          sessionStorage.removeItem('uk2ug_session_last_active');
          sessionStorage.setItem('uk2ug_session_timed_out', 'true');
          sessionStorage.setItem('uk2ug_timed_out_email', parsed?.email || '');
          return null;
        }
        // Valid active session - stay logged in and refresh active time
        sessionStorage.setItem('uk2ug_session_last_active', String(Date.now()));
        return JSON.parse(stored);
      }
    } catch {}

    if (auth.currentUser) {
      const role = determineRole(auth.currentUser.email, auth.currentUser.uid);
      const userObj = {
        name: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Customer',
        email: auth.currentUser.email || '',
        phone: auth.currentUser.phoneNumber || '',
        role,
        uid: auth.currentUser.uid,
        createdAt: auth.currentUser.metadata?.creationTime || new Date().toISOString(),
      };
      sessionStorage.setItem('uk2ug_session_user', JSON.stringify(userObj));
      sessionStorage.setItem('uk2ug_session_last_active', String(Date.now()));
      return userObj;
    }
    return null;
  });

  // Track user activity silently for 20-minute inactivity timeout (No timer UI)
  const lastActivityRecordedRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!currentUser) return;

    if (!sessionStorage.getItem('uk2ug_session_last_active')) {
      sessionStorage.setItem('uk2ug_session_last_active', String(Date.now()));
    }

    const checkInactivity = () => {
      const lastActiveStr = sessionStorage.getItem('uk2ug_session_last_active');
      if (!lastActiveStr) return;
      const lastActive = parseInt(lastActiveStr, 10);
      if (isNaN(lastActive)) return;

      const elapsed = Date.now() - lastActive;
      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        const userEmail = currentUser?.email || '';
        setTimedOutEmail(userEmail);
        setSessionTimedOut(true);
        sessionStorage.setItem('uk2ug_session_timed_out', 'true');
        sessionStorage.setItem('uk2ug_timed_out_email', userEmail);
        logout();
      }
    };

    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastActivityRecordedRef.current > 3000) {
        lastActivityRecordedRef.current = now;
        sessionStorage.setItem('uk2ug_session_last_active', String(now));
      }
    };

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    const intervalId = setInterval(checkInactivity, 5000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkInactivity();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser]);

  // Listen to Firebase auth changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // If an account was just registered and pending manual login, do not auto-login
        if (sessionStorage.getItem('uk2ug_signup_pending_signin') === 'true') {
          return;
        }

        const isGoogle = fbUser.providerData.some((p) => p.providerId === 'google.com');
        const userRole = determineRole(fbUser.email, fbUser.uid);

        // Directly authenticate user without email verification requirement
        const userObj = {
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Customer',
          email: fbUser.email || '',
          phone: fbUser.phoneNumber || '',
          role: userRole,
          uid: fbUser.uid,
          createdAt: fbUser.metadata?.creationTime || new Date().toISOString(),
        };
        setCurrentUser(userObj);
        sessionStorage.setItem('uk2ug_session_user', JSON.stringify(userObj));
        sessionStorage.setItem('uk2ug_session_last_active', String(Date.now()));
        sessionStorage.removeItem('uk2ug_session_timed_out');
        localStorage.setItem('uk2ug_clean_user', JSON.stringify(userObj));
        localStorage.removeItem('uk2ug_clean_logged_out');
        try {
          localStorage.removeItem('uk2ug_my_order_ids');
          localStorage.removeItem('uk2ug_my_import_ids');
        } catch (e) {}

        // Auto-sync customer to database collection if role is customer
        if (userObj.role === 'customer' && userObj.email) {
          setState((prev) => {
            const exists = prev.customers.some((c) => c.email.toLowerCase() === userObj.email.toLowerCase());
            if (!exists) {
              const newCust: Customer = {
                id: `cust-${Date.now()}`,
                name: userObj.name,
                email: userObj.email,
                phone: userObj.phone || 'N/A',
                status: 'Active',
                joinDate: new Date().toISOString().split('T')[0],
              };
              saveCustomerToFirestore(newCust);
              return {
                ...prev,
                customers: [...prev.customers, newCust],
              };
            }
            return prev;
          });
        }
      } else {
        if (!sessionStorage.getItem('uk2ug_session_user')) {
          setCurrentUser(null);
          localStorage.removeItem('uk2ug_clean_user');
        }
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Attach Firestore real-time listeners for database collections
  useEffect(() => {
    const unsubscribe = setupFirestoreListeners({
      onProducts: (products) => setState((prev) => ({ ...prev, products })),
      onCategories: (categories) => setState((prev) => ({ ...prev, categories })),
      onDistricts: (districts) => setState((prev) => ({ ...prev, districts })),
      onOrders: (orders) => setState((prev) => ({ ...prev, orders })),
      onImports: (imports) => setState((prev) => ({ ...prev, imports })),
      onReviews: (reviews) => setState((prev) => ({ ...prev, reviews })),
      onCustomers: (customers) => setState((prev) => ({ ...prev, customers })),
      onMessages: (messages) => setState((prev) => ({ ...prev, messages })),
      onComplaints: (complaints) => setState((prev) => ({ ...prev, complaints })),
      onBanner: (banner) => {
        if (!banner) return;
        const rawNotices = banner.adminNotices ?? [];
        const cleanedNotices = (rawNotices || []).filter(
          (n) => n.id !== 'notice-uk-cargo-1' && !n.title.toLowerCase().includes('heathrow')
        );
        const hasLegacyCargoNotice = (rawNotices || []).some(
          (n) => n.id === 'notice-uk-cargo-1' || n.title.toLowerCase().includes('heathrow')
        );
        const normalized = {
          ...DEFAULT_STOREFRONT_BANNER,
          ...banner,
          adminNotices: cleanedNotices,
          isActive: banner.isActive !== undefined ? banner.isActive : true,
        };
        if (hasLegacyCargoNotice) {
          saveStorefrontBannerToFirestore(normalized);
        }
        setState((prev) => ({
          ...prev,
          banner: normalized,
        }));
      },
      onRiders: (riders) => setState((prev) => ({ ...prev, riders })),
      onNotifications: (notifications) => setState((prev) => ({ ...prev, notifications })),
    });
    return () => unsubscribe();
  }, []);

  // Sync state to local storage when it changes
  useEffect(() => {
    localStorage.setItem('uk2ug_clean_notifications', JSON.stringify(state.notifications));
  }, [state.notifications]);

  useEffect(() => {
    localStorage.setItem('uk2ug_clean_riders', JSON.stringify(state.riders));
  }, [state.riders]);

  useEffect(() => {
    localStorage.setItem('uk2ug_clean_complaints', JSON.stringify(state.complaints));
  }, [state.complaints]);

  useEffect(() => {
    localStorage.setItem('uk2ug_clean_messages', JSON.stringify(state.messages));
  }, [state.messages]);

  // Sync state to local storage when it changes
  useEffect(() => {
    localStorage.setItem('uk2ug_clean_products', JSON.stringify(state.products));
  }, [state.products]);

  useEffect(() => {
    localStorage.setItem('uk2ug_clean_categories', JSON.stringify(state.categories));
  }, [state.categories]);

  useEffect(() => {
    localStorage.setItem('uk2ug_clean_districts', JSON.stringify(state.districts));
  }, [state.districts]);

  useEffect(() => {
    localStorage.setItem('uk2ug_clean_orders', JSON.stringify(state.orders));
  }, [state.orders]);

  useEffect(() => {
    localStorage.setItem('uk2ug_clean_imports', JSON.stringify(state.imports));
  }, [state.imports]);

  useEffect(() => {
    localStorage.setItem('uk2ug_clean_reviews', JSON.stringify(state.reviews));
  }, [state.reviews]);

  useEffect(() => {
    localStorage.setItem('uk2ug_clean_customers', JSON.stringify(state.customers));
  }, [state.customers]);

  useEffect(() => {
    localStorage.setItem('uk2ug_clean_cart', JSON.stringify(state.cart));
  }, [state.cart]);

  useEffect(() => {
    localStorage.setItem('uk2ug_clean_wishlist', JSON.stringify(state.wishlist));
  }, [state.wishlist]);

  useEffect(() => {
    localStorage.setItem('uk2ug_clean_banner', JSON.stringify(state.banner));
  }, [state.banner]);

  useEffect(() => {
    localStorage.setItem('uk2ug_clean_riders', JSON.stringify(state.riders));
  }, [state.riders]);

  useEffect(() => {
    localStorage.setItem('uk2ug_clean_notifications', JSON.stringify(state.notifications));
  }, [state.notifications]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('uk2ug_clean_user', JSON.stringify(currentUser));
      localStorage.removeItem('uk2ug_clean_logged_out');
    } else {
      localStorage.removeItem('uk2ug_clean_user');
      localStorage.setItem('uk2ug_clean_logged_out', 'true');
    }
  }, [currentUser]);

  // AUTOMATED PRE-ORDER COMPLETION (Updates catalog status when arrived, NEVER auto-adds to user cart):
  const arrivalCheckedRef = useRef(false);
  useEffect(() => {
    if (arrivalCheckedRef.current) return;
    arrivalCheckedRef.current = true;

    setState((prev) => {
      let productsModified = false;

      const updatedProducts = prev.products.map((prod) => {
        const isDone = prod.isPreOrder && (
          isEstimatedArrivalReached(prod) ||
          prod.preOrderStatus === 'Arrived at Kampala Hub' ||
          prod.preOrderStatus === 'Ready for Delivery'
        );

        if (isDone) {
          productsModified = true;
          return {
            ...prod,
            isPreOrder: false,
            preOrderStatus: undefined,
            preOrderEstimatedArrival: undefined,
          };
        }
        return prod;
      });

      // Filter out any legacy auto-added items to ensure cart is strictly user-added
      const filteredCart = prev.cart.filter((item) => !item.autoAddedOnArrival);
      const cartModified = filteredCart.length !== prev.cart.length;

      if (cartModified || productsModified) {
        return {
          ...prev,
          cart: filteredCart,
          products: productsModified ? updatedProducts : prev.products,
        };
      }
      return prev;
    });
  }, []);

  // Product Actions
  const addProduct = (product: Product) => {
    setState((prev) => ({ ...prev, products: [product, ...prev.products] }));
    saveProductToFirestore(product);
  };

  const updateProduct = (updated: Product) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.map((p) => (p.id === updated.id ? updated : p)),
    }));
    saveProductToFirestore(updated);
  };

  const deleteProduct = (id: string) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== id),
      // Clean from cart/wishlist
      cart: prev.cart.filter((item) => item.product.id !== id),
      wishlist: prev.wishlist.filter((pid) => pid !== id),
    }));
    deleteProductFromFirestore(id);
  };

  // Category Actions
  const addCategory = (category: Category) => {
    setState((prev) => ({ ...prev, categories: [...prev.categories, category] }));
    saveCategoryToFirestore(category);
  };

  const deleteCategory = (id: string) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== id),
    }));
    deleteCategoryFromFirestore(id);
  };

  // District Actions
  const addDistrict = (district: District) => {
    setState((prev) => {
      // Avoid duplicates
      if (prev.districts.some((d) => d.name.toLowerCase() === district.name.toLowerCase())) {
        return prev;
      }
      return { ...prev, districts: [...prev.districts, district] };
    });
    saveDistrictToFirestore(district);
  };

  const updateDistrictFee = (name: string, fee: number) => {
    let updatedDist: District | undefined;
    setState((prev) => ({
      ...prev,
      districts: prev.districts.map((d) => {
        if (d.name === name) {
          updatedDist = { ...d, fee };
          return updatedDist;
        }
        return d;
      }),
    }));
    if (updatedDist) saveDistrictToFirestore(updatedDist);
  };

  const deleteDistrict = (name: string) => {
    setState((prev) => ({
      ...prev,
      districts: prev.districts.filter((d) => d.name !== name),
    }));
    deleteDistrictFromFirestore(name);
  };


  // Cart Actions
  const addToCart = (
    product: Product,
    quantity: number = 1,
    selectedSize?: string,
    variation?: ProductVariation
  ) => {
    setState((prev) => {
      const variationId = variation?.id;
      const variationName = variation?.name;
      const unitPrice = variation ? variation.price : product.basePrice;
      const originalPrice = variation ? variation.originalPrice : product.originalPrice;

      const existing = prev.cart.find((item) =>
        item.product.id === product.id &&
        item.selectedSize === selectedSize &&
        item.variationId === variationId
      );

      const maxStock = variation?.stock !== undefined
        ? variation.stock
        : (!product.isPreOrder
          ? (prev.products.find((p) => p.id === product.id)?.quantity ?? 999)
          : 999);

      const currentQty = existing ? existing.quantity : 0;
      const newQty = Math.min(maxStock, currentQty + quantity);
      if (newQty <= 0 && maxStock > 0) return prev;

      const finalQty = Math.max(1, newQty);

      const cleanProduct: Product = {
        ...product,
        isPreOrder: false,
        preOrderStatus: undefined,
        preOrderEstimatedArrival: undefined,
      };

      if (existing) {
        return {
          ...prev,
          cart: prev.cart.map((item) =>
            item.product.id === product.id &&
            item.selectedSize === selectedSize &&
            item.variationId === variationId
              ? {
                  ...item,
                  product: cleanProduct,
                  autoAddedOnArrival: false,
                  userAdded: true,
                  quantity: finalQty,
                  unitPrice,
                  originalPrice,
                  totalPrice: unitPrice * finalQty,
                }
              : item
          ),
        };
      }
      return {
        ...prev,
        cart: [
          ...prev.cart,
          {
            product: cleanProduct,
            quantity: finalQty,
            selectedSize,
            variationId,
            variationName,
            unitPrice,
            originalPrice,
            totalPrice: unitPrice * finalQty,
            autoAddedOnArrival: false,
            userAdded: true,
          },
        ],
      };
    });
  };

  const updateCartQty = (
    productId: string,
    quantity: number,
    variationId?: string,
    selectedSize?: string
  ) => {
    setState((prev) => {
      return {
        ...prev,
        cart: prev.cart.map((item) => {
          const isTarget =
            item.product.id === productId &&
            (variationId === undefined || item.variationId === variationId) &&
            (selectedSize === undefined || item.selectedSize === selectedSize);

          if (!isTarget) return item;

          const maxStock = item.variationId && item.product.variations
            ? (item.product.variations.find((v) => v.id === item.variationId)?.stock ?? 999)
            : (item.product.isPreOrder ? 999 : (prev.products.find((p) => p.id === productId)?.quantity ?? 999));

          const targetQty = Math.max(1, Math.min(quantity, maxStock));
          const unitPrice = item.unitPrice ?? item.product.basePrice;

          return {
            ...item,
            quantity: targetQty,
            totalPrice: unitPrice * targetQty,
          };
        }),
      };
    });
  };

  const removeFromCart = (
    productId: string,
    variationId?: string,
    selectedSize?: string
  ) => {
    setState((prev) => ({
      ...prev,
      cart: prev.cart.filter((item) => {
        if (variationId !== undefined || selectedSize !== undefined) {
          return !(
            item.product.id === productId &&
            (variationId === undefined || item.variationId === variationId) &&
            (selectedSize === undefined || item.selectedSize === selectedSize)
          );
        }
        return item.product.id !== productId;
      }),
    }));
  };

  const clearCart = () => {
    setState((prev) => ({ ...prev, cart: [] }));
  };

  // Wishlist Actions
  const toggleWishlist = (productId: string) => {
    setState((prev) => {
      const isWishlisted = prev.wishlist.includes(productId);
      return {
        ...prev,
        wishlist: isWishlisted
          ? prev.wishlist.filter((id) => id !== productId)
          : [...prev.wishlist, productId],
      };
    });
  };

  // Order Actions (Checkout)
  const placeOrder = (orderData: Omit<Order, 'id' | 'date' | 'status'>) => {
    const randomized = Math.floor(100000 + Math.random() * 900000);
    const orderId = `UK2UG-2026-${randomized}`;
    const deliveryPin = String(randomized).slice(-4);
    
    const newOrder: Order = {
      ...orderData,
      id: orderId,
      deliveryPin,
      date: new Date().toISOString(),
      status: 'Pending',
    };

    saveOrderToFirestore(newOrder);

    // Create in-app order confirmation notification
    const orderNotif: CustomerNotification = {
      id: `UK2UG-NOTIF-${Math.floor(100000 + Math.random() * 900000)}`,
      customerEmail: newOrder.customerEmail,
      customerPhone: newOrder.customerPhone,
      orderId: orderId,
      title: `Order #${orderId} Confirmed`,
      message: `Your order for UGX ${new Intl.NumberFormat('en-UG').format(newOrder.totalAmount)} has been placed successfully. Your automatically generated 4-Digit Handover Verification PIN is ${deliveryPin}.`,
      type: 'order_update',
      createdAt: new Date().toISOString(),
      read: false,
    };
    saveNotificationToFirestore(orderNotif);

    setState((prev) => {
      // Deduct stock levels for items ordered!
      const updatedProducts = prev.products.map((p) => {
        const orderedItems = orderData.items.filter((item) => item.productId === p.id);
        if (orderedItems.length > 0) {
          let updatedVariations = p.variations;
          let totalDeducted = 0;

          orderedItems.forEach((ordItem) => {
            totalDeducted += ordItem.quantity;
            if (ordItem.variationId && updatedVariations) {
              updatedVariations = updatedVariations.map((v) =>
                v.id === ordItem.variationId
                  ? {
                      ...v,
                      stock: Math.max(0, v.stock - ordItem.quantity),
                      available: Math.max(0, v.stock - ordItem.quantity) > 0,
                    }
                  : v
              );
            }
          });

          const updated = {
            ...p,
            quantity: Math.max(0, p.quantity - totalDeducted),
            variations: updatedVariations,
          };
          saveProductToFirestore(updated);
          return updated;
        }
        return p;
      });

      return {
        ...prev,
        products: updatedProducts,
        orders: [newOrder, ...prev.orders],
        notifications: [orderNotif, ...prev.notifications],
        cart: [], // Empty cart on successful order
      };
    });

    return orderId;
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    let updatedOrder: Order | undefined;
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) => {
        if (o.id === orderId) {
          const isDone = ['Delivered', 'Picked Up', 'Cancelled', 'Failed'].includes(status);
          const nowIso = new Date().toISOString();
          updatedOrder = {
            ...o,
            status,
            ...(isDone && !o.handoverConfirmedAt ? { handoverConfirmedAt: nowIso } : {}),
          };
          return updatedOrder;
        }
        return o;
      }),
    }));
    if (updatedOrder) saveOrderToFirestore(updatedOrder);
  };

  const deleteOrder = (orderId: string) => {
    recordDeletedOrderId(orderId);
    // Delete associated notifications in Firestore as well to prevent ghost alerts
    const relatedNotifs = state.notifications.filter((n) => n.orderId === orderId);
    relatedNotifs.forEach((n) => {
      deleteNotificationFromFirestore(n.id);
    });

    setState((prev) => {
      const remainingOrders = prev.orders.filter((o) => o.id !== orderId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('uk2ug_clean_orders', JSON.stringify(remainingOrders));
      }
      return {
        ...prev,
        orders: remainingOrders,
        notifications: prev.notifications.filter((n) => n.orderId !== orderId),
      };
    });
    deleteOrderFromFirestore(orderId);
  };

  const updateOrderPaymentDetails = (
    orderId: string,
    details: {
      paymentMethod?: string;
      paymentPhone?: string;
      paymentTransactionRef?: string;
      paymentNotes?: string;
      paymentStatus?: Order['paymentStatus'];
    }
  ) => {
    let updated: Order | undefined;
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) => {
        if (o.id === orderId) {
          updated = {
            ...o,
            ...details,
            paymentSubmittedAt: new Date().toISOString(),
            paymentStatus: details.paymentStatus || 'Pending Verification',
            paymentNotes: details.paymentNotes !== undefined ? details.paymentNotes : '',
          };
          return updated;
        }
        return o;
      }),
    }));
    if (updated) {
      saveOrderToFirestore(updated);
    }
  };

  const verifyOrderPayment = (orderId: string, status: 'Paid' | 'Failed', notes?: string) => {
    let updated: Order | undefined;
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) => {
        if (o.id === orderId) {
          updated = {
            ...o,
            paymentStatus: status,
            status: status === 'Paid' ? (o.status === 'Pending' ? 'Paid' : o.status) : o.status,
            paymentVerifiedAt: new Date().toISOString(),
            paymentVerifiedBy: 'Admin (Joel K.)',
            paymentNotes: notes || o.paymentNotes,
          };
          return updated;
        }
        return o;
      }),
    }));
    if (updated) {
      saveOrderToFirestore(updated);

      // Notify customer of payment outcome
      const notifId = `UK2UG-NOTIF-${Math.floor(100000 + Math.random() * 900000)}`;
      const title = status === 'Paid' ? 'Payment Verified & Confirmed' : 'Payment Verification Issue';
      const message = status === 'Paid'
        ? `Your payment of UGX ${new Intl.NumberFormat('en-UG').format(updated.totalAmount)} for order #${updated.id} via ${updated.paymentMethod} (Txn Ref: ${updated.paymentTransactionRef || 'Verified'}) has been approved.`
        : `We could not verify payment for order #${updated.id}. Note: ${notes || 'Please check your transaction reference ID.'}`;

      const newNotif: CustomerNotification = {
        id: notifId,
        customerEmail: updated.customerEmail,
        customerPhone: updated.customerPhone,
        orderId: updated.id,
        title,
        message,
        type: status === 'Paid' ? 'payment_verified' : 'payment_flagged',
        createdAt: new Date().toISOString(),
        read: false,
      };
      saveNotificationToFirestore(newNotif);

      setState((prev) => ({
        ...prev,
        notifications: [newNotif, ...prev.notifications],
      }));
    }
  };

  const confirmOrderHandover = (orderId: string, pin: string, handoverMethod: 'pickup' | 'rider_delivery') => {
    let targetOrder: Order | undefined;
    const newStatus: Order['status'] = handoverMethod === 'pickup' ? 'Picked Up' : 'Delivered';

    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) => {
        if (o.id === orderId) {
          targetOrder = {
            ...o,
            status: newStatus,
            handoverConfirmedAt: new Date().toISOString(),
            handoverMethod,
            handoverNotificationSent: true,
          };
          return targetOrder;
        }
        return o;
      }),
    }));

    if (targetOrder) {
      saveOrderToFirestore(targetOrder);

      // Create Customer Notification
      const notifId = `UK2UG-NOTIF-${Math.floor(100000 + Math.random() * 900000)}`;
      const title = handoverMethod === 'pickup' ? 'Package Picked Up from Store' : 'Package Delivered & Received';
      const message = handoverMethod === 'pickup'
        ? `Your order #${targetOrder.id} has been successfully picked up by you from the UK2UG store (Shop 16, Thobani Centre, Kampala) after 4-digit PIN verification (${pin}). Thank you for shopping with UK2UG!`
        : `Your order #${targetOrder.id} has been successfully received by you after giving your 4-digit PIN (${pin}) to our dispatch rider. Thank you for shopping with UK2UG!`;

      const newNotif: CustomerNotification = {
        id: notifId,
        customerEmail: targetOrder.customerEmail,
        customerPhone: targetOrder.customerPhone,
        orderId: targetOrder.id,
        title,
        message,
        type: handoverMethod === 'pickup' ? 'handover_store' : 'handover_rider',
        createdAt: new Date().toISOString(),
        read: false,
        pinUsed: pin,
        location: handoverMethod === 'pickup' ? 'Shop 16, Thobani Centre, Kampala' : `${targetOrder.deliveryDetails?.district || ''}, ${targetOrder.deliveryDetails?.area || ''}`,
      };

      saveNotificationToFirestore(newNotif);

      // Also send system message to customer's chat desk
      const systemChatMessage: ChatMessage = {
        id: `SYS-${Date.now()}`,
        sender: 'admin',
        senderName: 'UK2UG Dispatch Desk',
        userEmail: targetOrder.customerEmail || 'customer@uk2ug.com',
        userPhone: targetOrder.customerPhone,
        text: `📦 [Handover Confirmed] ${title}: ${message}`,
        timestamp: new Date().toISOString(),
        readByCustomer: false,
        readByAdmin: true,
        relatedOrderId: targetOrder.id,
      };
      saveMessageToFirestore(systemChatMessage);

      setState((prev) => ({
        ...prev,
        notifications: [newNotif, ...prev.notifications],
        messages: [...prev.messages, systemChatMessage],
      }));
    }
  };

  const batchDeleteCompletedRiderOrders = () => {
    const ordersToDelete = state.orders.filter(
      (o) => o.deliveryPath === 'delivery' && ['Delivered', 'Picked Up', 'Failed', 'Returned'].includes(o.status)
    );
    const orderIdsToDelete = new Set(ordersToDelete.map((o) => o.id));
    ordersToDelete.forEach((o) => {
      recordDeletedOrderId(o.id);
      deleteOrderFromFirestore(o.id);
    });
    setState((prev) => {
      const remainingOrders = prev.orders.filter(
        (o) => !(o.deliveryPath === 'delivery' && ['Delivered', 'Picked Up', 'Failed', 'Returned'].includes(o.status))
      );
      if (typeof window !== 'undefined') {
        localStorage.setItem('uk2ug_clean_orders', JSON.stringify(remainingOrders));
      }
      return {
        ...prev,
        orders: remainingOrders,
        notifications: prev.notifications.filter((n) => !orderIdsToDelete.has(n.orderId)),
      };
    });
    return ordersToDelete.length;
  };

  const addNotification = (notifData: Omit<CustomerNotification, 'id' | 'createdAt' | 'read'>) => {
    const newNotif: CustomerNotification = {
      ...notifData,
      id: `UK2UG-NOTIF-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    saveNotificationToFirestore(newNotif);
    setState((prev) => ({
      ...prev,
      notifications: [newNotif, ...prev.notifications],
    }));
    return newNotif.id;
  };

  const markNotificationAsRead = (id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
    const notif = state.notifications.find((n) => n.id === id);
    if (notif) {
      saveNotificationToFirestore({ ...notif, read: true });
    }
  };

  const deleteNotification = (id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.filter((n) => n.id !== id),
    }));
    deleteNotificationFromFirestore(id);
  };

  const markAllNotificationsAsRead = (customerEmail?: string) => {
    const emailFilter = customerEmail ? customerEmail.trim().toLowerCase() : '';
    setState((prev) => {
      const updated = prev.notifications.map((n) => {
        const notifEmail = (n.customerEmail || '').trim().toLowerCase();
        if (!emailFilter || notifEmail === emailFilter) {
          if (!n.read) {
            saveNotificationToFirestore({ ...n, read: true });
            return { ...n, read: true };
          }
        }
        return n;
      });
      return { ...prev, notifications: updated };
    });
  };

  const clearAllNotifications = (customerEmail?: string) => {
    const emailFilter = customerEmail ? customerEmail.trim().toLowerCase() : '';
    const toDelete = state.notifications.filter((n) => {
      const notifEmail = (n.customerEmail || '').trim().toLowerCase();
      return !emailFilter || notifEmail === emailFilter;
    });

    toDelete.forEach((n) => {
      deleteNotificationFromFirestore(n.id);
    });

    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.filter((n) => {
        const notifEmail = (n.customerEmail || '').trim().toLowerCase();
        return emailFilter ? notifEmail !== emailFilter : false;
      }),
    }));
  };

  // Import Request Actions
  const submitImportRequest = (req: Omit<ImportRequest, 'id' | 'date' | 'status'>) => {
    const randomized = Math.floor(1000 + Math.random() * 9000);
    const reqId = `UK2UG-REQ-${randomized}`;
    
    const newReq: ImportRequest = {
      ...req,
      id: reqId,
      date: new Date().toISOString().split('T')[0],
      status: 'Pending',
    };

    saveImportToFirestore(newReq);

    setState((prev) => ({
      ...prev,
      imports: [newReq, ...prev.imports],
    }));

    return reqId;
  };

  const updateImportStatus = (reqId: string, status: ImportRequest['status'], quotePrice?: number) => {
    let updatedReq: ImportRequest | undefined;
    setState((prev) => ({
      ...prev,
      imports: prev.imports.map((req) => {
        if (req.id === reqId) {
          const nowIso = new Date().toISOString();
          updatedReq = {
            ...req,
            status,
            updatedAt: nowIso,
            ...(status === 'Completed' && !req.completedAt ? { completedAt: nowIso } : {}),
            ...(quotePrice !== undefined ? { quotePrice } : {}),
          };
          return updatedReq;
        }
        return req;
      }),
    }));
    if (updatedReq) saveImportToFirestore(updatedReq);
  };

  const deleteImportRequest = (reqId: string) => {
    setState((prev) => ({
      ...prev,
      imports: prev.imports.filter((req) => req.id !== reqId),
    }));
    deleteImportFromFirestore(reqId);
  };

  // Review Actions
  const addReview = (review: Omit<Review, 'id' | 'date'>) => {
    const newReview: Review = {
      ...review,
      id: `rev-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
    };

    saveReviewToFirestore(newReview);

    setState((prev) => {
      const updatedReviews = [newReview, ...prev.reviews];
      // Recalculate average rating for that product
      const productReviews = updatedReviews.filter((r) => r.productId === review.productId);
      const avgRating = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
      
      const updatedProducts = prev.products.map((p) => {
        if (p.id === review.productId) {
          const updated = { ...p, rating: parseFloat(avgRating.toFixed(1)) };
          saveProductToFirestore(updated);
          return updated;
        }
        return p;
      });

      return {
        ...prev,
        reviews: updatedReviews,
        products: updatedProducts,
      };
    });
  };

  // Customer Management
  const registerCustomer = (name: string, email: string, phone: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim() || cleanEmail.split('@')[0];
    const cleanPhone = phone.trim() || 'N/A';
    const stableId = `cust-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;

    let targetCust: Customer = {
      id: stableId,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      status: 'Active',
      joinDate: new Date().toISOString().split('T')[0],
    };

    setState((prev) => {
      const existingIdx = prev.customers.findIndex((c) => c.email.trim().toLowerCase() === cleanEmail);
      if (existingIdx >= 0) {
        const updated = [...prev.customers];
        updated[existingIdx] = {
          ...updated[existingIdx],
          name: cleanName,
          phone: cleanPhone,
          status: 'Active',
        };
        targetCust = updated[existingIdx];
        return {
          ...prev,
          customers: updated,
        };
      }
      return {
        ...prev,
        customers: [targetCust, ...prev.customers],
      };
    });

    saveCustomerToFirestore(targetCust);
    return true;
  };

  const updateCustomerStatus = (id: string, status: 'Active' | 'Suspended') => {
    let updatedCust: Customer | undefined;
    setState((prev) => ({
      ...prev,
      customers: prev.customers.map((c) => {
        if (c.id === id) {
          updatedCust = { ...c, status };
          return updatedCust;
        }
        return c;
      }),
    }));
    if (updatedCust) saveCustomerToFirestore(updatedCust);
  };

  const deleteCustomer = (id: string) => {
    setState((prev) => ({
      ...prev,
      customers: prev.customers.filter((c) => c.id !== id),
    }));
    deleteCustomerFromFirestore(id);
  };

  const sendMessage = (msgData: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMsg: ChatMessage = {
      ...msgData,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    };

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, newMsg],
    }));

    saveMessageToFirestore(newMsg);
  };

  const deleteMessage = (msgId: string) => {
    setState((prev) => ({
      ...prev,
      messages: prev.messages.filter((m) => m.id !== msgId),
    }));
    deleteMessageFromFirestore(msgId);
  };

  const deleteConversation = (userEmail: string) => {
    setState((prev) => {
      const remaining = prev.messages.filter((m) => m.userEmail.toLowerCase() !== userEmail.toLowerCase());
      const toDelete = prev.messages.filter((m) => m.userEmail.toLowerCase() === userEmail.toLowerCase());
      toDelete.forEach((m) => deleteMessageFromFirestore(m.id));
      return { ...prev, messages: remaining };
    });
  };

  const markMessagesAsReadByCustomer = (userEmail: string) => {
    setState((prev) => {
      let changed = false;
      const updated = prev.messages.map((m) => {
        if (m.userEmail === userEmail && m.sender === 'admin' && !m.readByCustomer) {
          changed = true;
          const msg = { ...m, readByCustomer: true };
          saveMessageToFirestore(msg);
          return msg;
        }
        return m;
      });
      return changed ? { ...prev, messages: updated } : prev;
    });
  };

  const markMessagesAsReadByAdmin = (userEmail: string) => {
    setState((prev) => {
      let changed = false;
      const updated = prev.messages.map((m) => {
        if (m.userEmail === userEmail && m.sender === 'customer' && !m.readByAdmin) {
          changed = true;
          const msg = { ...m, readByAdmin: true };
          saveMessageToFirestore(msg);
          return msg;
        }
        return m;
      });
      return changed ? { ...prev, messages: updated } : prev;
    });
  };

  const updateStorefrontBanner = (banner: StorefrontBanner) => {
    const normalized: StorefrontBanner = {
      ...DEFAULT_STOREFRONT_BANNER,
      ...banner,
      adminNotices: banner.adminNotices ?? DEFAULT_STOREFRONT_BANNER.adminNotices,
      isActive: banner.isActive !== undefined ? banner.isActive : true,
    };
    setState((prev) => ({ ...prev, banner: normalized }));
    localStorage.setItem('uk2ug_clean_banner', JSON.stringify(normalized));
    saveStorefrontBannerToFirestore(normalized);
  };

  const addComplaint = (complaintData: Omit<Complaint, 'id' | 'createdAt' | 'status'> & { id?: string; status?: ComplaintStatus }) => {
    const newComplaint: Complaint = {
      id: complaintData.id || `UK2UG-CMP-${Math.floor(100000 + Math.random() * 900000)}`,
      customerName: complaintData.customerName,
      customerEmail: complaintData.customerEmail,
      customerPhone: complaintData.customerPhone,
      orderId: complaintData.orderId,
      category: complaintData.category,
      priority: complaintData.priority || 'Medium',
      subject: complaintData.subject,
      description: complaintData.description,
      images: complaintData.images || [],
      status: complaintData.status || 'Open',
      adminResponse: complaintData.adminResponse,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      complaints: [newComplaint, ...prev.complaints],
    }));

    saveComplaintToFirestore(newComplaint);
    return newComplaint;
  };

  const updateComplaintStatus = (id: string, status: ComplaintStatus, adminResponse?: string) => {
    setState((prev) => {
      const updated = prev.complaints.map((c) => {
        if (c.id === id) {
          const mod: Complaint = {
            ...c,
            status,
            ...(adminResponse !== undefined ? { adminResponse } : {}),
            ...(status === 'Resolved' ? { resolvedAt: new Date().toISOString() } : {}),
            updatedAt: new Date().toISOString(),
          };
          saveComplaintToFirestore(mod);
          return mod;
        }
        return c;
      });
      return { ...prev, complaints: updated };
    });
  };

  const deleteComplaint = (id: string) => {
    setState((prev) => ({
      ...prev,
      complaints: prev.complaints.filter((c) => c.id !== id),
    }));
    deleteComplaintFromFirestore(id);
  };

  const updatePreOrderStatus = (productId: string, status: PreOrderStatus) => {
    setState((prev) => {
      const updated = prev.products.map((p) => {
        if (p.id === productId) {
          const isDone =
            status === 'Arrived at Kampala Hub' ||
            status === 'Ready for Delivery' ||
            status === 'Pre-Orders Closed' ||
            status === 'Closed';
          const mod: Product = {
            ...p,
            preOrderStatus: status,
            isPreOrder: isDone ? false : p.isPreOrder,
            preOrderEstimatedArrival: isDone ? undefined : p.preOrderEstimatedArrival,
          };
          saveProductToFirestore(mod);
          return mod;
        }
        return p;
      });
      return { ...prev, products: updated };
    });
  };

  const toggleProductPreOrder = (
    productId: string,
    isPreOrder: boolean,
    details?: {
      preOrderStatus?: PreOrderStatus;
      preOrderEstimatedArrival?: string;
      quantity?: number;
      preOrderTotalSlots?: number;
    }
  ) => {
    setState((prev) => {
      const updated = prev.products.map((p) => {
        if (p.id === productId) {
          const mod: Product = {
            ...p,
            isPreOrder,
            ...(details || {}),
            quantity: details?.quantity !== undefined ? details.quantity : p.quantity,
            preOrderStatus: details?.preOrderStatus || (isPreOrder ? 'Taking Pre-Orders' : undefined),
          };
          saveProductToFirestore(mod);
          return mod;
        }
        return p;
      });
      return { ...prev, products: updated };
    });
  };

  const saveRiderProfile = async (riderData: Partial<Rider> & { name: string; phone: string; email: string }) => {
    try {
      const existing = state.riders.find(
        (r) =>
          (riderData.id && r.id === riderData.id) ||
          (riderData.email && r.email.toLowerCase() === riderData.email.toLowerCase())
      );

      const riderId = existing?.id || riderData.id || `rider-${Date.now()}`;
      const savedRider: Rider = {
        id: riderId,
        name: riderData.name.trim(),
        phone: riderData.phone.trim(),
        email: (riderData.email || existing?.email || 'uk1ug@rider.com').trim(),
        vehicleType: riderData.vehicleType || existing?.vehicleType || 'Motorcycle (Boda Boda)',
        plateNumber: riderData.plateNumber?.trim() || existing?.plateNumber || '',
        status: riderData.status || existing?.status || 'Active',
        registeredDate: existing?.registeredDate || new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString(),
        completedDeliveries: existing?.completedDeliveries ?? 0,
        nationalIdOrPermit: riderData.nationalIdOrPermit?.trim() || existing?.nationalIdOrPermit || '',
        notes: riderData.notes ?? existing?.notes,
      };

      try {
        await saveRiderToFirestore(savedRider);
      } catch (err) {
        console.warn('saveRiderToFirestore note:', err);
      }

      setState((prev) => {
        const exists = prev.riders.some((r) => r.id === riderId);
        const updatedRiders = exists
          ? prev.riders.map((r) => (r.id === riderId ? savedRider : r))
          : [...prev.riders, savedRider];
        if (typeof window !== 'undefined') {
          localStorage.setItem('uk2ug_clean_riders', JSON.stringify(updatedRiders));
        }
        return { ...prev, riders: updatedRiders };
      });

      // If the active current user is this rider, update their local currentUser as well
      if (currentUser && (currentUser.email.toLowerCase() === savedRider.email.toLowerCase() || currentUser.role === 'driver')) {
        const updatedUser = {
          ...currentUser,
          name: savedRider.name,
          phone: savedRider.phone,
        };
        setCurrentUser(updatedUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('uk2ug_clean_user', JSON.stringify(updatedUser));
          sessionStorage.setItem('uk2ug_session_user', JSON.stringify(updatedUser));
        }
      }

      return savedRider;
    } catch (e) {
      console.error('Error saving rider profile:', e);
      throw e;
    }
  };

  const updateRiderStatus = async (riderId: string, status: Rider['status']) => {
    const rider = state.riders.find((r) => r.id === riderId);
    if (!rider) return;
    const updated: Rider = { ...rider, status, updatedAt: new Date().toISOString() };
    await saveRiderToFirestore(updated);
    setState((prev) => ({
      ...prev,
      riders: prev.riders.map((r) => (r.id === riderId ? updated : r)),
    }));
  };

  const deleteRider = async (riderId: string) => {
    await deleteRiderFromFirestore(riderId);
    setState((prev) => ({
      ...prev,
      riders: prev.riders.filter((r) => r.id !== riderId),
    }));
  };

  const assignRiderToOrder = async (orderId: string, rider: Rider | null) => {
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return;
    const updatedOrder: Order = {
      ...order,
      assignedRiderId: rider ? rider.id : undefined,
      assignedRiderName: rider ? rider.name : undefined,
      assignedRiderPhone: rider ? rider.phone : undefined,
    };
    await saveOrderToFirestore(updatedOrder);
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) => (o.id === orderId ? updatedOrder : o)),
    }));
  };

  const logout = async () => {
    sessionStorage.removeItem('uk2ug_session_user');
    sessionStorage.removeItem('uk2ug_session_last_active');
    localStorage.setItem('uk2ug_clean_logged_out', 'true');
    localStorage.removeItem('uk2ug_clean_user');
    setCurrentUser(null);
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Sign out error:', e);
    }
  };

  const dismissSessionTimeout = () => {
    setSessionTimedOut(false);
    setTimedOutEmail(null);
    sessionStorage.removeItem('uk2ug_session_timed_out');
    sessionStorage.removeItem('uk2ug_timed_out_email');
  };

  return {
    ...state,
    currentUser,
    setCurrentUser,
    sessionTimedOut,
    timedOutEmail,
    dismissSessionTimeout,
    logout,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    deleteCategory,
    addDistrict,
    updateDistrictFee,
    deleteDistrict,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    toggleWishlist,
    placeOrder,
    updateOrderStatus,
    deleteOrder,
    updateOrderPaymentDetails,
    verifyOrderPayment,
    confirmOrderHandover,
    batchDeleteCompletedRiderOrders,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
    deleteNotification,
    submitImportRequest,
    updateImportStatus,
    deleteImportRequest,
    addReview,
    registerCustomer,
    updateCustomerStatus,
    deleteCustomer,
    sendMessage,
    deleteMessage,
    deleteConversation,
    markMessagesAsReadByCustomer,
    markMessagesAsReadByAdmin,
    updateStorefrontBanner,
    addComplaint,
    updateComplaintStatus,
    deleteComplaint,
    updatePreOrderStatus,
    toggleProductPreOrder,
    saveRiderProfile,
    updateRiderStatus,
    deleteRider,
    assignRiderToOrder,
  };
}
