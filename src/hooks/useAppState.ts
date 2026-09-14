import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Product, Category, District, Order, ImportRequest, Review, Customer, CartItem, ChatMessage, StorefrontBanner, DEFAULT_STOREFRONT_BANNER, Complaint, ComplaintStatus, PreOrderStatus } from '../types';
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
} from '../data/seedData';
import {
  setupFirestoreListeners,
  saveProductToFirestore,
  deleteProductFromFirestore,
  saveOrderToFirestore,
  saveImportToFirestore,
  saveReviewToFirestore,
  saveCategoryToFirestore,
  deleteCategoryFromFirestore,
  saveDistrictToFirestore,
  deleteDistrictFromFirestore,
  saveCustomerToFirestore,
  deleteCustomerFromFirestore,
  saveMessageToFirestore,
  saveStorefrontBannerToFirestore,
  saveComplaintToFirestore,
  deleteComplaintFromFirestore,
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
      orders: getOrSeed('uk2ug_clean_orders', INITIAL_ORDERS),
      imports: getOrSeed('uk2ug_clean_imports', INITIAL_IMPORTS),
      reviews: getOrSeed('uk2ug_clean_reviews', INITIAL_REVIEWS),
      customers: getOrSeed('uk2ug_clean_customers', INITIAL_CUSTOMERS),
      messages: getOrSeed('uk2ug_clean_messages', INITIAL_MESSAGES),
      complaints: getOrSeed('uk2ug_clean_complaints', INITIAL_COMPLAINTS),
      cart: getOrSeed<CartItem[]>('uk2ug_clean_cart', []),
      wishlist: getOrSeed<string[]>('uk2ug_clean_wishlist', []),
      banner: getOrSeed<StorefrontBanner>('uk2ug_clean_banner', DEFAULT_STOREFRONT_BANNER),
    };
  });


  const determineRole = (email?: string | null): 'admin' | 'driver' | 'customer' => {
    if (!email) return 'customer';
    const lower = email.toLowerCase();
    const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || 'kakoozajoel45@gmail.com').toLowerCase();
    if (lower === adminEmail || lower.includes('admin')) return 'admin';
    if (lower.includes('driver')) return 'driver';
    return 'customer';
  };

  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    phone?: string;
    role: 'customer' | 'admin' | 'driver';
  } | null>(() => {
    if (auth.currentUser) {
      return {
        name: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Customer',
        email: auth.currentUser.email || '',
        phone: auth.currentUser.phoneNumber || '',
        role: determineRole(auth.currentUser.email),
      };
    }
    const isLoggedOut = localStorage.getItem('uk2ug_clean_logged_out') === 'true';
    if (isLoggedOut) {
      return null;
    }

    const stored = localStorage.getItem('uk2ug_clean_user');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  });

  // Listen to Firebase auth changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const isGoogle = fbUser.providerData.some((p) => p.providerId === 'google.com');
        if (fbUser.emailVerified || isGoogle) {
          const userObj = {
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Customer',
            email: fbUser.email || '',
            phone: fbUser.phoneNumber || '',
            role: determineRole(fbUser.email),
          };
          setCurrentUser(userObj);
          localStorage.setItem('uk2ug_clean_user', JSON.stringify(userObj));
          localStorage.removeItem('uk2ug_clean_logged_out');

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
      onBanner: (banner) => setState((prev) => ({ ...prev, banner })),
    });
    return () => unsubscribe();
  }, []);

  // Sync state to local storage when it changes
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
    if (currentUser) {
      localStorage.setItem('uk2ug_clean_user', JSON.stringify(currentUser));
      localStorage.removeItem('uk2ug_clean_logged_out');
    } else {
      localStorage.removeItem('uk2ug_clean_user');
      localStorage.setItem('uk2ug_clean_logged_out', 'true');
    }
  }, [currentUser]);

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
  const addToCart = (product: Product, quantity: number = 1) => {
    setState((prev) => {
      const existing = prev.cart.find((item) => item.product.id === product.id);
      // Double check stock
      const currentStock = prev.products.find((p) => p.id === product.id)?.quantity ?? 0;
      const requestedQty = existing ? existing.quantity + quantity : quantity;
      
      if (requestedQty > currentStock) {
        // limit to available stock
        const finalQty = currentStock;
        if (finalQty <= 0) return prev;
        if (existing) {
          return {
            ...prev,
            cart: prev.cart.map((item) =>
              item.product.id === product.id ? { ...item, quantity: finalQty } : item
            ),
          };
        } else {
          return {
            ...prev,
            cart: [...prev.cart, { product, quantity: finalQty }],
          };
        }
      }

      if (existing) {
        return {
          ...prev,
          cart: prev.cart.map((item) =>
            item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
          ),
        };
      }
      return {
        ...prev,
        cart: [...prev.cart, { product, quantity }],
      };
    });
  };

  const updateCartQty = (productId: string, quantity: number) => {
    setState((prev) => {
      const currentStock = prev.products.find((p) => p.id === productId)?.quantity ?? 0;
      const targetQty = Math.max(1, Math.min(quantity, currentStock));
      return {
        ...prev,
        cart: prev.cart.map((item) =>
          item.product.id === productId ? { ...item, quantity: targetQty } : item
        ),
      };
    });
  };

  const removeFromCart = (productId: string) => {
    setState((prev) => ({
      ...prev,
      cart: prev.cart.filter((item) => item.product.id !== productId),
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

    setState((prev) => {
      // Deduct stock levels for items ordered!
      const updatedProducts = prev.products.map((p) => {
        const orderedItem = orderData.items.find((item) => item.productId === p.id);
        if (orderedItem) {
          const updated = {
            ...p,
            quantity: Math.max(0, p.quantity - orderedItem.quantity),
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
          updatedOrder = { ...o, status };
          return updatedOrder;
        }
        return o;
      }),
    }));
    if (updatedOrder) saveOrderToFirestore(updatedOrder);
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
          updatedReq = { ...req, status, ...(quotePrice !== undefined ? { quotePrice } : {}) };
          return updatedReq;
        }
        return req;
      }),
    }));
    if (updatedReq) saveImportToFirestore(updatedReq);
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
    const isExisting = state.customers.some((c) => c.email.toLowerCase() === email.toLowerCase());
    if (isExisting) return false;

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name,
      email,
      phone,
      status: 'Active',
      joinDate: new Date().toISOString().split('T')[0],
    };

    saveCustomerToFirestore(newCust);

    setState((prev) => ({
      ...prev,
      customers: [...prev.customers, newCust],
    }));

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
    setState((prev) => ({ ...prev, banner }));
    localStorage.setItem('uk2ug_clean_banner', JSON.stringify(banner));
    saveStorefrontBannerToFirestore(banner);
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
          const mod: Product = {
            ...p,
            preOrderStatus: status,
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
      preOrderDepositPercent?: number;
      preOrderTotalSlots?: number;
      preOrderClaimedSlots?: number;
      preOrderBatchNote?: string;
    }
  ) => {
    setState((prev) => {
      const updated = prev.products.map((p) => {
        if (p.id === productId) {
          const mod: Product = {
            ...p,
            isPreOrder,
            ...(details || {}),
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

  return {
    ...state,
    currentUser,
    setCurrentUser,
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
    submitImportRequest,
    updateImportStatus,
    addReview,
    registerCustomer,
    updateCustomerStatus,
    deleteCustomer,
    sendMessage,
    markMessagesAsReadByCustomer,
    markMessagesAsReadByAdmin,
    updateStorefrontBanner,
    addComplaint,
    updateComplaintStatus,
    deleteComplaint,
    updatePreOrderStatus,
    toggleProductPreOrder,
  };
}
