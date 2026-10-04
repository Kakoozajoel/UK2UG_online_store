import { PreOrderStatus, Product } from '../types';

export interface PreOrderStatusOption {
  status: string;
  label: string;
  desc: string;
  color: string;
  icon: string;
}

export const DEFAULT_PREORDER_STATUS_OPTIONS: PreOrderStatusOption[] = [
  {
    status: 'Taking Pre-Orders',
    label: 'Taking Pre-Orders',
    desc: 'Customer pre-orders are open and being logged for the upcoming UK sourcing run.',
    color: 'bg-orange-50 text-[#ea580c] border-orange-200',
    icon: '📝'
  },
  {
    status: 'Procuring in London',
    label: 'Procuring in London',
    desc: 'UK personal shoppers are actively purchasing items from London retail stores/boutiques.',
    color: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: '🛍️'
  },
  {
    status: 'Air Cargo Flight Scheduled',
    label: 'Flight Scheduled',
    desc: 'Consignment packaged at London logistics depot; air cargo freight flight is booked.',
    color: 'bg-sky-50 text-sky-800 border-sky-200',
    icon: '✈️'
  },
  {
    status: 'In Transit to Entebbe',
    label: 'In Transit to Entebbe',
    desc: 'Cargo plane is airborne from London Heathrow to Entebbe International Airport.',
    color: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    icon: '🛫'
  },
  {
    status: 'Clearing Customs',
    label: 'Clearing Customs',
    desc: 'Consignment landed at Entebbe Airport; undergoing URA customs clearance.',
    color: 'bg-orange-50 text-orange-800 border-orange-200',
    icon: '🛃'
  },
  {
    status: 'Arrived at Kampala Hub',
    label: 'Arrived at Kampala Hub',
    desc: 'Packages unpacked and verified at Kampala Central Hub; ready for customer collection/delivery.',
    color: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    icon: '🏢'
  },
  {
    status: 'Ready for Delivery',
    label: 'Ready for Delivery',
    desc: 'Boda boda dispatch and courier delivery ready across Kampala and all Uganda districts.',
    color: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    icon: '🛵'
  },
  {
    status: 'Pre-Orders Closed',
    label: 'Pre-Orders Closed',
    desc: 'Pre-order window for this batch is concluded. Next batch announcement coming soon.',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    icon: '🔒'
  }
];

const LOCAL_STORAGE_KEY = 'uk2ug_custom_preorder_statuses';

export function getPreOrderStatuses(): PreOrderStatusOption[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed: PreOrderStatusOption[] = JSON.parse(raw);
      const combined = [...DEFAULT_PREORDER_STATUS_OPTIONS];
      parsed.forEach((custom) => {
        if (!combined.some((c) => c.status === custom.status)) {
          combined.push(custom);
        }
      });
      return combined;
    }
  } catch (err) {
    console.error('Failed to load custom pre-order statuses', err);
  }
  return DEFAULT_PREORDER_STATUS_OPTIONS;
}

export function saveCustomPreOrderStatus(newStatus: PreOrderStatusOption): PreOrderStatusOption[] {
  try {
    const current = getPreOrderStatuses();
    const exists = current.some((s) => s.status.toLowerCase() === newStatus.status.toLowerCase());
    let updated: PreOrderStatusOption[];
    if (exists) {
      updated = current.map((s) => (s.status.toLowerCase() === newStatus.status.toLowerCase() ? newStatus : s));
    } else {
      updated = [...current, newStatus];
    }
    
    // Save only non-defaults or all custom
    const customList = updated.filter(
      (s) => !DEFAULT_PREORDER_STATUS_OPTIONS.some((d) => d.status === s.status && d.desc === s.desc)
    );
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(customList));
    return updated;
  } catch (err) {
    console.error('Failed to save custom pre-order status', err);
    return DEFAULT_PREORDER_STATUS_OPTIONS;
  }
}

export function getStatusBadgeConfig(statusStr?: string): PreOrderStatusOption {
  if (!statusStr) return DEFAULT_PREORDER_STATUS_OPTIONS[0];
  const all = getPreOrderStatuses();
  const match = all.find((s) => s.status.toLowerCase() === statusStr.toLowerCase());
  if (match) return match;
  return {
    status: statusStr,
    label: statusStr,
    desc: `Current Pre-Order Status: ${statusStr}`,
    color: 'bg-purple-50 text-purple-800 border-purple-200',
    icon: '📦'
  };
}

/**
 * Checks if the estimated arrival date of a product has been reached or passed today.
 * Supports ISO dates ('2026-09-15'), standard dates ('15 Sep 2026'), and status checks.
 */
export function isEstimatedArrivalReached(product: Product): boolean {
  if (!product.isPreOrder) return false;

  // If status is arrived or ready
  if (
    product.preOrderStatus === 'Arrived at Kampala Hub' ||
    product.preOrderStatus === 'Ready for Delivery'
  ) {
    return true;
  }

  if (!product.preOrderEstimatedArrival) return false;

  const raw = product.preOrderEstimatedArrival.trim();
  if (raw.toLowerCase().includes('today') || raw.toLowerCase().includes('arrived')) {
    return true;
  }

  // Attempt date parsing
  const parsed = Date.parse(raw);
  if (!isNaN(parsed)) {
    const targetDate = new Date(parsed);
    const now = new Date();
    // Compare date components (start of day)
    const targetDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return today >= targetDay;
  }

  return false;
}

/**
 * Checks whether a pre-order is still actively running.
 * Once a pre-order gets done (arrived at hub, ready for delivery, or arrival date reached),
 * it is finished and should not display any pre-order badge or indicator.
 */
export function isPreOrderActive(product?: Product | null): boolean {
  if (!product || !product.isPreOrder) return false;
  if (
    product.preOrderStatus === 'Arrived at Kampala Hub' ||
    product.preOrderStatus === 'Ready for Delivery' ||
    product.preOrderStatus === 'Pre-Orders Closed'
  ) {
    return false;
  }
  if (isEstimatedArrivalReached(product)) {
    return false;
  }
  return true;
}
