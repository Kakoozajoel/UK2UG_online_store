import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import { Product, Category, District, Order, ImportRequest, Review, Customer, ChatMessage, StorefrontBanner, DEFAULT_STOREFRONT_BANNER, Complaint } from '../types';
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
      INITIAL_CUSTOMERS.forEach((cust) => {
        setDoc(doc(db, 'customers', cust.id), sanitizeForFirestore(cust)).catch(() => {});
      });
    } else {
      const items = snapshot.docs.map((doc) => doc.data() as Customer);
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
    console.error('Failed to save product to Firestore:', e);
  }
}

export async function deleteProductFromFirestore(id: string) {
  try {
    await deleteDoc(doc(db, 'products', id));
  } catch (e) {
    console.error('Failed to delete product from Firestore:', e);
  }
}

export async function saveOrderToFirestore(order: Order) {
  try {
    await setDoc(doc(db, 'orders', order.id), sanitizeForFirestore(order));
  } catch (e) {
    console.error('Failed to save order to Firestore:', e);
  }
}

export async function saveImportToFirestore(req: ImportRequest) {
  try {
    await setDoc(doc(db, 'imports', req.id), sanitizeForFirestore(req));
  } catch (e) {
    console.error('Failed to save import to Firestore:', e);
  }
}

export async function saveReviewToFirestore(review: Review) {
  try {
    await setDoc(doc(db, 'reviews', review.id), sanitizeForFirestore(review));
  } catch (e) {
    console.error('Failed to save review to Firestore:', e);
  }
}

export async function saveCategoryToFirestore(category: Category) {
  try {
    await setDoc(doc(db, 'categories', category.id), sanitizeForFirestore(category));
  } catch (e) {
    console.error('Failed to save category to Firestore:', e);
  }
}

export async function deleteCategoryFromFirestore(id: string) {
  try {
    await deleteDoc(doc(db, 'categories', id));
  } catch (e) {
    console.error('Failed to delete category from Firestore:', e);
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

