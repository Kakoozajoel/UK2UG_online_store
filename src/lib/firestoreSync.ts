import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Product, Category, District, Order, ImportRequest, Review, Customer, ChatMessage, StorefrontBanner, DEFAULT_STOREFRONT_BANNER, Complaint, Rider, CustomerNotification } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore Error Context:', JSON.stringify(errInfo));
  return errInfo;
}
import {
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_DISTRICTS,
  INITIAL_ORDERS,
  INITIAL_IMPORTS,
  INITIAL_REVIEWS,
  INITIAL_CUSTOMERS,
  INITIAL_MESSAGES,
  INITIAL_COMPLAINTS,
  INITIAL_RIDERS,
} from '../data/seedData';

// Helper to sanitize objects by removing undefined properties for Firestore
function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

// Firestore collection sync helper
export function setupFirestoreListeners(callbacks: {
  onProducts: (products: Product[]) => void;
  onCategories: (categories: Category[]) => void;
  onDistricts: (districts: District[]) => void;
  onOrders: (orders: Order[]) => void;
  onImports: (imports: ImportRequest[]) => void;
  onReviews: (reviews: Review[]) => void;
  onCustomers: (customers: Customer[]) => void;
  onMessages: (messages: ChatMessage[]) => void;
  onComplaints?: (complaints: Complaint[]) => void;
  onBanner?: (banner: StorefrontBanner) => void;
  onRiders?: (riders: Rider[]) => void;
  onNotifications?: (notifications: CustomerNotification[]) => void;
}) {
  // Products
  const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
    if (snapshot.empty) {
      // Seed initial products if collection is completely empty
      INITIAL_PRODUCTS.forEach((p) => {
        setDoc(doc(db, 'products', p.id), sanitizeForFirestore(p)).catch(() => {});
      });
    } else {
      const items = snapshot.docs.map((doc) => doc.data() as Product);
      callbacks.onProducts(items);
    }
  }, (err) => {
    console.warn('Firestore products listener fallback to local:', err);
  });

  // Categories
  const unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
    if (snapshot.empty) {
      INITIAL_CATEGORIES.forEach((c) => {
        setDoc(doc(db, 'categories', c.id), sanitizeForFirestore(c)).catch(() => {});
      });
    } else {
      const items = snapshot.docs.map((doc) => doc.data() as Category);
      callbacks.onCategories(items);
    }
  }, (err) => {
    console.warn('Firestore categories listener fallback:', err);
  });

  // Districts
  const unsubDistricts = onSnapshot(collection(db, 'districts'), (snapshot) => {
    if (snapshot.empty) {
      INITIAL_DISTRICTS.forEach((d) => {
        setDoc(doc(db, 'districts', d.name.replace(/[^a-zA-Z0-9]/g, '_')), sanitizeForFirestore(d)).catch(() => {});
      });
    } else {
      const items = snapshot.docs.map((doc) => doc.data() as District);
      callbacks.onDistricts(items);
    }
  }, (err) => {
    console.warn('Firestore districts listener fallback:', err);
  });

  // Orders
  const unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
    if (snapshot.empty) {
      INITIAL_ORDERS.forEach((o) => {
        setDoc(doc(db, 'orders', o.id), sanitizeForFirestore(o)).catch(() => {});
      });
    } else {
      const items = snapshot.docs.map((doc) => doc.data() as Order);
      callbacks.onOrders(items);
    }
  }, (err) => {
    console.warn('Firestore orders listener fallback:', err);
  });

  // Imports
  const unsubImports = onSnapshot(collection(db, 'imports'), (snapshot) => {
    if (snapshot.empty) {
      INITIAL_IMPORTS.forEach((imp) => {
        setDoc(doc(db, 'imports', imp.id), sanitizeForFirestore(imp)).catch(() => {});
      });
    } else {
      const items = snapshot.docs.map((doc) => doc.data() as ImportRequest);
      callbacks.onImports(items);
    }
  }, (err) => {
    console.warn('Firestore imports listener fallback:', err);
  });

  // Reviews
  const unsubReviews = onSnapshot(collection(db, 'reviews'), (snapshot) => {
    if (snapshot.empty) {
      INITIAL_REVIEWS.forEach((rev) => {
        setDoc(doc(db, 'reviews', rev.id), sanitizeForFirestore(rev)).catch(() => {});
      });
    } else {
      const items = snapshot.docs.map((doc) => doc.data() as Review);
      callbacks.onReviews(items);
    }
  }, (err) => {
    console.warn('Firestore reviews listener fallback:', err);
  });

  // Customers
  const unsubCustomers = onSnapshot(collection(db, 'customers'), (snapshot) => {
    if (snapshot.empty) {
      if (INITIAL_CUSTOMERS.length > 0) {
        INITIAL_CUSTOMERS.forEach((cust) => {
          setDoc(doc(db, 'customers', cust.id), sanitizeForFirestore(cust)).catch(() => {});
        });
      } else {
        callbacks.onCustomers([]);
      }
    } else {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Customer));
      callbacks.onCustomers(items);
    }
  }, (err) => {
    console.warn('Firestore customers listener fallback:', err);
  });

  // Messages
  const unsubMessages = onSnapshot(collection(db, 'messages'), (snapshot) => {
    if (snapshot.empty) {
      INITIAL_MESSAGES.forEach((msg) => {
        setDoc(doc(db, 'messages', msg.id), sanitizeForFirestore(msg)).catch(() => {});
      });
    } else {
      const items = snapshot.docs.map((doc) => doc.data() as ChatMessage);
      callbacks.onMessages(items);
    }
  }, (err) => {
    console.warn('Firestore messages listener fallback:', err);
  });

  // Complaints
  const unsubComplaints = onSnapshot(collection(db, 'complaints'), (snapshot) => {
    if (snapshot.empty) {
      const hasSeeded = typeof window !== 'undefined' ? localStorage.getItem('uk2ug_complaints_seeded') : null;
      if (!hasSeeded) {
        if (typeof window !== 'undefined') localStorage.setItem('uk2ug_complaints_seeded', 'true');
        INITIAL_COMPLAINTS.forEach((cmp) => {
          setDoc(doc(db, 'complaints', cmp.id), sanitizeForFirestore(cmp)).catch(() => {});
        });
      } else if (callbacks.onComplaints) {
        callbacks.onComplaints([]);
      }
    } else if (callbacks.onComplaints) {
      if (typeof window !== 'undefined') localStorage.setItem('uk2ug_complaints_seeded', 'true');
      const items = snapshot.docs.map((doc) => doc.data() as Complaint);
      callbacks.onComplaints(items);
    }
  }, (err) => {
    console.warn('Firestore complaints listener fallback:', err);
  });

  // Storefront Banner Configuration
  const unsubBanner = onSnapshot(doc(db, 'settings', 'storefrontBanner'), (docSnap) => {
    if (docSnap.exists() && callbacks.onBanner) {
      callbacks.onBanner(docSnap.data() as StorefrontBanner);
    }
  }, (err) => {
    console.warn('Firestore banner listener fallback:', err);
  });

  // Riders
  const unsubRiders = onSnapshot(collection(db, 'riders'), (snapshot) => {
    if (snapshot.empty) {
      INITIAL_RIDERS.forEach((r) => {
        setDoc(doc(db, 'riders', r.id), sanitizeForFirestore(r)).catch(() => {});
      });
      if (callbacks.onRiders) {
        callbacks.onRiders(INITIAL_RIDERS);
      }
    } else if (callbacks.onRiders) {
      const items = snapshot.docs.map((doc) => doc.data() as Rider);
      callbacks.onRiders(items);
    }
  }, (err) => {
    console.warn('Firestore riders listener fallback:', err);
  });

  // Notifications
  const unsubNotifications = onSnapshot(collection(db, 'notifications'), (snapshot) => {
    if (callbacks.onNotifications) {
      const items = snapshot.docs.map((doc) => doc.data() as CustomerNotification);
      callbacks.onNotifications(items);
    }
  }, (err) => {
    console.warn('Firestore notifications listener fallback:', err);
  });

  return () => {
    unsubProducts();
    unsubCategories();
    unsubDistricts();
    unsubOrders();
    unsubImports();
    unsubReviews();
    unsubCustomers();
    unsubMessages();
    unsubComplaints();
    unsubBanner();
    unsubRiders();
    unsubNotifications();
  };
}

// Save Storefront Banner Settings
export async function saveStorefrontBannerToFirestore(banner: StorefrontBanner) {
  try {
    await setDoc(doc(db, 'settings', 'storefrontBanner'), sanitizeForFirestore(banner));
  } catch (e) {
    console.error('Failed to save storefront banner to Firestore:', e);
  }
}

// Firestore write utilities
export async function saveMessageToFirestore(message: ChatMessage) {
  try {
    await setDoc(doc(db, 'messages', message.id), sanitizeForFirestore(message));
  } catch (e) {
    console.error('Failed to save message to Firestore:', e);
  }
}

// Firestore write utilities
export async function saveProductToFirestore(product: Product) {
  try {
    await setDoc(doc(db, 'products', product.id), sanitizeForFirestore(product));
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `products/${product.id}`);
  }
}

export async function deleteProductFromFirestore(id: string) {
  try {
    await deleteDoc(doc(db, 'products', id));
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, `products/${id}`);
  }
}

export async function saveOrderToFirestore(order: Order) {
  try {
    await setDoc(doc(db, 'orders', order.id), sanitizeForFirestore(order));
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `orders/${order.id}`);
  }
}

export async function saveImportToFirestore(req: ImportRequest) {
  try {
    await setDoc(doc(db, 'imports', req.id), sanitizeForFirestore(req));
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `imports/${req.id}`);
  }
}

export async function saveReviewToFirestore(review: Review) {
  try {
    await setDoc(doc(db, 'reviews', review.id), sanitizeForFirestore(review));
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `reviews/${review.id}`);
  }
}

export async function saveCategoryToFirestore(category: Category) {
  try {
    await setDoc(doc(db, 'categories', category.id), sanitizeForFirestore(category));
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `categories/${category.id}`);
  }
}

export async function deleteCategoryFromFirestore(id: string) {
  try {
    await deleteDoc(doc(db, 'categories', id));
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, `categories/${id}`);
  }
}

export async function saveDistrictToFirestore(district: District) {
  try {
    const docId = district.name.replace(/[^a-zA-Z0-9]/g, '_');
    await setDoc(doc(db, 'districts', docId), sanitizeForFirestore(district));
  } catch (e) {
    console.error('Failed to save district to Firestore:', e);
  }
}

export async function deleteDistrictFromFirestore(name: string) {
  try {
    const docId = name.replace(/[^a-zA-Z0-9]/g, '_');
    await deleteDoc(doc(db, 'districts', docId));
  } catch (e) {
    console.error('Failed to delete district from Firestore:', e);
  }
}

export async function saveCustomerToFirestore(customer: Customer) {
  try {
    await setDoc(doc(db, 'customers', customer.id), sanitizeForFirestore(customer));
  } catch (e) {
    console.error('Failed to save customer to Firestore:', e);
  }
}

export async function deleteCustomerFromFirestore(id: string) {
  try {
    await deleteDoc(doc(db, 'customers', id));
  } catch (e) {
    console.error('Failed to delete customer from Firestore:', e);
  }
}

export async function saveComplaintToFirestore(complaint: Complaint) {
  try {
    await setDoc(doc(db, 'complaints', complaint.id), sanitizeForFirestore(complaint));
  } catch (e) {
    console.error('Failed to save complaint to Firestore:', e);
  }
}

export async function deleteComplaintFromFirestore(id: string) {
  try {
    await deleteDoc(doc(db, 'complaints', id));
  } catch (e) {
    console.error('Failed to delete complaint from Firestore:', e);
  }
}

export async function deleteOrderFromFirestore(id: string) {
  try {
    await deleteDoc(doc(db, 'orders', id));
  } catch (e) {
    console.error('Failed to delete order from Firestore:', e);
  }
}

export async function deleteImportFromFirestore(id: string) {
  try {
    await deleteDoc(doc(db, 'imports', id));
  } catch (e) {
    console.error('Failed to delete import from Firestore:', e);
  }
}

export async function deleteMessageFromFirestore(id: string) {
  try {
    await deleteDoc(doc(db, 'messages', id));
  } catch (e) {
    console.error('Failed to delete message from Firestore:', e);
  }
}

export async function saveRiderToFirestore(rider: Rider) {
  try {
    await setDoc(doc(db, 'riders', rider.id), sanitizeForFirestore(rider));
  } catch (e) {
    console.error('Failed to save rider to Firestore:', e);
  }
}

export async function deleteRiderFromFirestore(id: string) {
  try {
    await deleteDoc(doc(db, 'riders', id));
  } catch (e) {
    console.error('Failed to delete rider from Firestore:', e);
  }
}

export async function saveNotificationToFirestore(notification: CustomerNotification) {
  try {
    await setDoc(doc(db, 'notifications', notification.id), sanitizeForFirestore(notification));
  } catch (e) {
    console.error('Failed to save notification to Firestore:', e);
  }
}

export async function deleteNotificationFromFirestore(id: string) {
  try {
    await deleteDoc(doc(db, 'notifications', id));
  } catch (e) {
    console.error('Failed to delete notification from Firestore:', e);
  }
}



