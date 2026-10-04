import React, { useState, useEffect, useRef } from 'react';
import {
  Truck,
  Clock,
  Navigation,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Phone,
  BookOpen,
  KeyRound,
  ShieldCheck,
  Map,
  ChevronRight,
  Info,
  Calendar,
  LogOut,
  User,
  RotateCcw,
  Sparkles,
  Delete,
  Trash2,
  Banknote,
} from 'lucide-react';
import { Order, Rider } from '../types';
import { InitialsBadge, FormatCurrency, Modal } from './CommonUI';

interface DriverPortalProps {
  orders: Order[];
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  confirmOrderHandover?: (orderId: string, pin: string, handoverMethod: 'pickup' | 'rider_delivery') => void;
  deleteOrder?: (orderId: string) => void;
  currentDriver?: any;
  saveRiderProfile?: (riderData: Partial<Rider> & { name: string; phone: string; email: string }) => Promise<Rider>;
  riders?: Rider[];
  onLogout?: () => void;
}

export const DriverPortal: React.FC<DriverPortalProps> = ({
  orders,
  updateOrderStatus,
  confirmOrderHandover,
  deleteOrder,
  currentDriver,
  saveRiderProfile,
  riders = [],
  onLogout,
}) => {
  // Filter only door delivery orders (Store pickup is picked up by customers directly in shop)
  const deliveryOrders = orders.filter((o) => o.deliveryPath === 'delivery');

  // Queue filter: all vs active vs delivered
  const [queueFilter, setQueueFilter] = useState<'all' | 'active' | 'delivered'>('all');
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [showClearAllDeliveredModal, setShowClearAllDeliveredModal] = useState<boolean>(false);
  const [deleteSuccessNotice, setDeleteSuccessNotice] = useState<string>('');

  // Currently viewing order route details
  const [activeOrderId, setActiveOrderId] = useState<string | null>(() => {
    const activeOnes = deliveryOrders.filter((o) => ['Processing', 'Out for Delivery'].includes(o.status));
    return activeOnes[0]?.id ?? deliveryOrders[0]?.id ?? null;
  });

  // Secure pickup verification pin states
  const [verificationPin, setVerificationPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [pinSuccess, setPinSuccess] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [forceKeypadOpen, setForceKeypadOpen] = useState<boolean>(false);
  const pinInputRef = useRef<HTMLInputElement>(null);

  // Rider Profile Modal States
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [profileForm, setProfileForm] = useState({
    name: currentDriver?.name || '',
    phone: currentDriver?.phone || '',
    vehicleType: 'Motorcycle (Boda Boda)',
    plateNumber: '',
  });
  const [profileSavedNotice, setProfileSavedNotice] = useState<boolean>(false);

  // Auto prompt rider profile if name or phone is generic or missing
  useEffect(() => {
    if (currentDriver) {
      const isMissingDetails = !currentDriver.name || currentDriver.name === 'Delivery Rider' || !currentDriver.phone;
      if (isMissingDetails && !localStorage.getItem('uk2ug_rider_profile_dismissed')) {
        setShowProfileModal(true);
      }
      setProfileForm((prev) => ({
        ...prev,
        name: currentDriver.name || prev.name,
        phone: currentDriver.phone || prev.phone,
      }));
    }
  }, [currentDriver]);

  const activeOrder = deliveryOrders.find((o) => o.id === activeOrderId);

  // Status computation for metrics
  const assignedCount = deliveryOrders.length;
  const pendingCount = deliveryOrders.filter((o) => o.status === 'Pending' || o.status === 'Paid').length;
  const inTransitCount = deliveryOrders.filter((o) => o.status === 'Out for Delivery' || o.status === 'Processing').length;
  const completedCount = deliveryOrders.filter((o) => o.status === 'Delivered').length;
  const failedCount = deliveryOrders.filter((o) => o.status === 'Failed' || o.status === 'Returned').length;

  const filteredDeliveryOrders = deliveryOrders.filter((ord) => {
    if (queueFilter === 'active') return ['Pending', 'Paid', 'Processing', 'Out for Delivery'].includes(ord.status);
    if (queueFilter === 'delivered') return ord.status === 'Delivered';
    return true;
  });

  const handleConfirmDeleteOrder = (order: Order) => {
    if (deleteOrder) {
      deleteOrder(order.id);
    }
    if (activeOrderId === order.id) {
      const remaining = deliveryOrders.filter((o) => o.id !== order.id);
      setActiveOrderId(remaining[0]?.id || null);
    }
    setOrderToDelete(null);
    setDeleteSuccessNotice(`Delivered order #${order.id} has been permanently deleted from your rider panel.`);
    setTimeout(() => setDeleteSuccessNotice(''), 4000);
  };

  const handleConfirmClearAllDelivered = () => {
    const deliveredOnes = deliveryOrders.filter((o) => o.status === 'Delivered');
    if (deleteOrder) {
      deliveredOnes.forEach((o) => deleteOrder(o.id));
    }
    if (activeOrder && activeOrder.status === 'Delivered') {
      const remaining = deliveryOrders.filter((o) => o.status !== 'Delivered');
      setActiveOrderId(remaining[0]?.id || null);
    }
    setShowClearAllDeliveredModal(false);
    setDeleteSuccessNotice(`All ${deliveredOnes.length} delivered orders have been removed from your rider panel queue.`);
    setTimeout(() => setDeleteSuccessNotice(''), 4000);
  };
  
  // Verification PIN formula: uses order.deliveryPin or last 4 digits of order ID
  const getExpectedPin = (order: Order) => {
    if (order.deliveryPin) return order.deliveryPin;
    const numbersOnly = order.id.replace(/\D/g, '');
    return numbersOnly.substring(numbersOnly.length - 4);
  };

  const handleKeypadDigit = (digit: string) => {
    setPinError('');
    setPinSuccess(false);
    setVerificationPin((prev) => {
      if (prev.length < 4) {
        return prev + digit;
      }
      return prev;
    });
    setTimeout(() => {
      pinInputRef.current?.focus();
    }, 20);
  };

  const handleKeypadBackspace = () => {
    setPinError('');
    setVerificationPin((prev) => prev.slice(0, -1));
    setTimeout(() => {
      pinInputRef.current?.focus();
    }, 20);
  };

  const handleResetPinKeypad = () => {
    setVerificationPin('');
    setPinError('');
    setPinSuccess(false);
    setSuccessMessage('');
    setForceKeypadOpen(true);
    setTimeout(() => {
      pinInputRef.current?.focus();
    }, 50);
  };

  const executePinVerification = () => {
    setPinError('');
    setPinSuccess(false);

    if (!activeOrder) return;

    const enteredPin = verificationPin.trim();
    if (enteredPin.length !== 4) {
      setPinError(`Please enter all 4 digits of the client security PIN (entered ${enteredPin.length}/4).`);
      return;
    }

    const expected = getExpectedPin(activeOrder);

    if (enteredPin === expected) {
      // 1. Trigger Handover Confirmation with real-time customer account notification!
      if (confirmOrderHandover) {
        confirmOrderHandover(activeOrder.id, enteredPin, 'rider_delivery');
      } else {
        updateOrderStatus(activeOrder.id, 'Delivered');
      }

      setPinSuccess(true);
      setSuccessMessage(
        `✓ Handover verified! Customer account notified that their order #${activeOrder.id} has been safely received. Keypad refreshed for next entry.`
      );

      // 2. Clear input field to allow next digits or new entry
      setVerificationPin('');
      setForceKeypadOpen(true);

      // 3. System auto-clears success toast after 4s
      setTimeout(() => {
        setPinSuccess(false);
      }, 4000);
    } else {
      setPinError(`Incorrect verification security PIN "${enteredPin}". (Expected 4-digit PIN: "${expected}").`);
    }
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    executePinVerification();
  };

  const handleSaveRiderProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name.trim() || !profileForm.phone.trim()) {
      return;
    }
    if (saveRiderProfile) {
      await saveRiderProfile({
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
        email: currentDriver?.email || 'rider@uk2ug.com',
        vehicleType: profileForm.vehicleType,
        plateNumber: profileForm.plateNumber.trim(),
      });
    }
    setProfileSavedNotice(true);
    setTimeout(() => {
      setProfileSavedNotice(false);
      setShowProfileModal(false);
      localStorage.setItem('uk2ug_rider_profile_dismissed', 'true');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-[#E0E0E0] flex flex-col font-sans" id="driver-portal-root">
      {/* Dark Mode Header */}
      <header className="h-20 bg-[#1E1E1E] border-b border-gray-800 flex items-center justify-between px-6 sm:px-8 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-[#ea580c] text-white p-2.5 rounded-lg flex items-center justify-center">
            <Truck className="w-5.5 h-5.5" />
          </div>
          <div className="text-left">
            <span className="text-lg font-bold tracking-tight text-white uppercase">UK2UG Rider</span>
            <p className="text-[10px] text-orange-400 font-semibold tracking-wider">Local Dispatch Route Manager</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-orange-850 bg-[#161616] hover:bg-orange-950/40 text-orange-300 text-xs font-bold transition-all cursor-pointer shadow-xs"
            id="rider-profile-open-btn"
            title="Update Rider Profile"
          >
            <User className="w-3.5 h-3.5 text-orange-400" />
            <span>{currentDriver?.name || 'Rider Profile'}</span>
          </button>

          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-400 bg-orange-950/60 px-3 py-1.5 rounded-full border border-orange-900">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            <span className="hidden md:inline">Rider</span> Online
          </span>

          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-900/70 bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
              id="rider-header-logout-btn"
              title="Logout from Rider Account"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span>Log Out</span>
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 p-6 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Logistics metrics grid */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: 'Assigned Deliveries', val: assignedCount, icon: <Truck className="text-orange-400 w-5 h-5" />, onClick: () => setQueueFilter('all') },
            { label: 'Pending Dispatches', val: pendingCount, icon: <Clock className="text-yellow-400 w-5 h-5" />, onClick: () => setQueueFilter('active') },
            { label: 'In Transit Route', val: inTransitCount, icon: <Navigation className="text-orange-400 w-5 h-5" />, onClick: () => setQueueFilter('active') },
            { 
              label: 'Completed Sourced', 
              val: completedCount, 
              icon: <CheckCircle2 className="text-emerald-400 w-5 h-5" />,
              actionBadge: 'View & Delete',
              onClick: () => setQueueFilter('delivered'),
            },
            { label: 'Failed Handover', val: failedCount, icon: <XCircle className="text-red-400 w-5 h-5" />, onClick: () => setQueueFilter('all') },
          ].map((card, idx) => (
            <div
              key={idx}
              onClick={card.onClick}
              className={`bg-[#1E1E1E] border border-gray-800 p-4 rounded-xl flex flex-col justify-between space-y-2 text-left cursor-pointer hover:border-gray-700 transition-all ${
                card.label === 'Completed Sourced' && queueFilter === 'delivered' ? 'ring-2 ring-emerald-500/50 border-emerald-600' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 truncate">{card.label}</span>
                {card.icon}
              </div>
              <div className="flex items-baseline justify-between">
                <p className="text-base sm:text-lg font-extrabold text-white">
                  {card.val}
                </p>
                {card.actionBadge && (
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-900/60">
                    {card.actionBadge}
                  </span>
                )}
              </div>
            </div>
          ))}
        </section>

        {/* Driver Core Layout: Left Orders List, Right Details Map */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left panel: Assigned Orders List */}
          <div className="space-y-4 lg:col-span-1">
            {deleteSuccessNotice && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{deleteSuccessNotice}</span>
              </div>
            )}

            {/* Guide on where to delete delivered orders */}
            <div className="p-3 bg-gradient-to-r from-red-950/30 via-[#1A1A1A] to-[#161616] border border-red-900/40 rounded-xl text-left space-y-1 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-red-300 uppercase tracking-wide flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  Where to Delete Delivered Orders:
                </span>
                <button
                  type="button"
                  onClick={() => setQueueFilter('delivered')}
                  className="text-[10px] text-orange-300 hover:text-white underline cursor-pointer font-bold"
                >
                  Go to Delivered ({completedCount})
                </button>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Click the <strong className="text-white">"DELIVERED"</strong> tab to see all completed orders, then tap the red <strong className="text-red-400 font-bold">🗑️ Delete</strong> button on each order card, or open any order to delete it directly.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Assigned Dispatch Queue</p>
              <div className="flex items-center gap-1">
                {(['all', 'active', 'delivered'] as const).map((tab) => {
                  const count = tab === 'all' ? deliveryOrders.length : tab === 'active' ? (inTransitCount + pendingCount) : completedCount;
                  const isActive = queueFilter === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setQueueFilter(tab)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#ea580c] text-white shadow-2xs'
                          : 'bg-[#181818] text-gray-400 hover:text-gray-200 border border-gray-800'
                      }`}
                    >
                      {tab} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick bulk action bar when viewing delivered orders tab */}
            {queueFilter === 'delivered' && (
              <div className="flex items-center justify-between p-2.5 bg-red-950/30 border border-red-900/50 rounded-xl text-left">
                <span className="text-[11px] font-bold text-red-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Showing {completedCount} Delivered Order{completedCount === 1 ? '' : 's'}
                </span>
                {completedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowClearAllDeliveredModal(true)}
                    className="px-2.5 py-1 bg-red-600/90 hover:bg-red-600 text-white rounded-lg text-[10px] font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear All Delivered</span>
                  </button>
                )}
              </div>
            )}

            <div className="space-y-3.5 max-h-[580px] overflow-y-auto pr-1">
              {filteredDeliveryOrders.map((ord) => {
                const isSelected = ord.id === activeOrderId;
                const payStatus = ord.paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : 'Paid via Mobile money';
                
                return (
                  <div
                    key={ord.id}
                    onClick={() => {
                      setActiveOrderId(ord.id);
                      setVerificationPin('');
                      setPinError('');
                    }}
                    className={`border rounded-xl p-4 cursor-pointer text-left transition-all ${
                      isSelected
                        ? 'bg-[#1E1E1E] border-[#ea580c] shadow-[0_4px_15px_rgba(234,88,12,0.15)]'
                        : 'bg-[#151515] border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-mono text-xs font-bold text-white">{ord.id}</span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${
                            ord.status === 'Delivered'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/40'
                              : ord.status === 'Out for Delivery'
                              ? 'bg-orange-950 text-orange-300 border border-orange-900/40'
                              : 'bg-yellow-950 text-yellow-400 border border-yellow-900/40'
                          }`}
                        >
                          {ord.status}
                        </span>
                        {ord.status === 'Delivered' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOrderToDelete(ord);
                            }}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/80 hover:bg-red-800 text-red-300 hover:text-white border border-red-800/80 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="Delete delivered order from rider panel"
                          >
                            <Trash2 className="w-3 h-3 text-red-400" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-2.5 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-gray-400">
                        <span className="font-bold text-gray-300 text-xs">{ord.customerName}</span>
                        <span className="flex items-center gap-1 font-mono text-gray-400 bg-black/40 px-1.5 py-0.5 rounded border border-gray-800">
                          <Calendar className="w-2.5 h-2.5 text-[#ea580c]" />
                          {ord.date ? new Date(ord.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—'}
                        </span>
                      </div>
                      <a
                        href={`tel:${ord.customerPhone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[11px] font-bold text-orange-400 flex items-center gap-1 hover:underline font-mono"
                      >
                        <Phone className="w-3 h-3 text-[#ea580c]" /> {ord.customerPhone}
                      </a>
                      <p className="text-[11px] text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#ea580c]" /> {ord.deliveryDetails?.district}, {ord.deliveryDetails?.area}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-gray-800 flex items-center justify-between text-[11px] text-gray-400">
                      <span className="text-orange-400 font-semibold flex items-center gap-1">
                        <Truck className="w-3 h-3 text-[#ea580c]" /> Doorstep Dispatch
                      </span>
                      <span className="text-[10px] font-semibold text-gray-400 italic truncate max-w-[150px]" title={payStatus}>
                        {payStatus}
                      </span>
                    </div>
                  </div>
                );
              })}

              {deliveryOrders.length === 0 && (
                <div className="bg-[#1E1E1E] border border-gray-800 rounded-xl p-8 text-center text-gray-500 text-xs">
                  No door-to-door deliveries currently assigned to this rider route.
                </div>
              )}
            </div>

            {/* Rider profile & session controls */}
            <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-3.5 flex items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-orange-850 text-orange-200 border border-orange-700/50 flex items-center justify-center font-bold text-xs shrink-0">
                  RP
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">Fulfillment Partner</p>
                  <p className="text-[10px] text-orange-400 font-mono truncate">Role: Dispatch Rider</p>
                </div>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="px-2.5 py-1.5 bg-red-950/50 hover:bg-red-900/60 border border-red-900/60 text-red-300 hover:text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                  id="rider-sidebar-logout-btn"
                  title="Logout from Rider Account"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-400" />
                  <span>Logout</span>
                </button>
              )}
            </div>
          </div>

          {/* Right panel: Route Map & Verification actions */}
          <div className="lg:col-span-2 space-y-6 text-left">
            {activeOrder ? (
              <div className="bg-[#1E1E1E] border border-gray-800 rounded-2xl p-6 space-y-6">
                {/* Header detail */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Active Sourcing Dispatch</p>
                      <span className="text-[10px] font-mono text-[#ea580c] bg-orange-950/60 px-2 py-0.5 rounded border border-orange-900/60 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#ea580c]" /> Logged: {activeOrder.date ? new Date(activeOrder.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </span>
                    </div>
                    <h3 className="font-mono text-base font-extrabold text-white">{activeOrder.id}</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-200">{activeOrder.customerName}</p>
                      <p className="font-mono text-xs font-bold text-orange-400">{activeOrder.customerPhone}</p>
                    </div>
                    <a
                      href={`tel:${activeOrder.customerPhone}`}
                      className="px-4 py-2 bg-[#ea580c] hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center gap-2 text-xs font-bold shadow-sm"
                    >
                      <Phone className="w-4 h-4" /> Call Client ({activeOrder.customerPhone})
                    </a>
                  </div>
                </div>

                {/* DELIVERED ORDER TOP BANNER WITH DIRECT DELETE ACTION */}
                {activeOrder.status === 'Delivered' && (
                  <div className="p-4 bg-gradient-to-r from-red-950/60 via-red-900/30 to-[#181818] border border-red-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left shadow-lg" id="rider-top-delivered-delete-card">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded bg-red-900/80 text-red-300">
                          <Trash2 className="w-4 h-4" />
                        </span>
                        <p className="text-xs font-bold text-red-200 uppercase tracking-wider">
                          Delivered Order Management
                        </p>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-900 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Handover Complete
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        Order <strong className="text-white font-mono font-bold">#{activeOrder.id}</strong> has been successfully handed over and verified. You can permanently delete this delivered record from your rider queue.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOrderToDelete(activeOrder)}
                      className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
                      id="rider-delete-delivered-order-top-btn"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Delivered Order</span>
                    </button>
                  </div>
                )}

                {/* Logistics Route Map details pane */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#161616] p-4 rounded-xl border border-gray-850">
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                      <Phone className="w-4.5 h-4.5" /> Customer Contact & Destination
                    </p>
                    <div className="space-y-1 text-xs">
                      <p className="text-gray-200 font-bold text-sm">{activeOrder.customerName}</p>
                      <p className="text-orange-400 font-bold font-mono text-xs flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" /> {activeOrder.customerPhone}
                      </p>
                      <p className="text-gray-300 font-semibold pt-1">District: {activeOrder.deliveryDetails?.district}</p>
                      <p className="text-gray-400 font-semibold">Area: {activeOrder.deliveryDetails?.area}</p>
                      <p className="text-gray-400">Landmark: {activeOrder.deliveryDetails?.landmark}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                      <BookOpen className="w-4.5 h-4.5" /> Dispatch notes
                    </p>
                    <p className="text-xs text-gray-400 italic leading-relaxed bg-[#1D1D1D] p-2.5 rounded border border-gray-800">
                      "{activeOrder.deliveryDetails?.notes || 'No specific notes detailed by the customer.'}"
                    </p>
                  </div>
                </div>

                {/* Sourcing Order Items Checklist */}
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Package Contents checklist</p>
                  <div className="space-y-2 bg-[#161616] p-4 rounded-xl border border-gray-850 text-xs">
                    {activeOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between py-1.5 border-b border-gray-850 last:border-0">
                        <span className="text-gray-300 font-semibold">
                          {item.title} <span className="text-gray-500 font-bold">x{item.quantity}</span>
                        </span>
                        <span className="font-mono font-bold text-gray-400">
                          UGX {new Intl.NumberFormat('en-UG').format(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                    {activeOrder.paymentMethod === 'COD' ? (
                      <div className="mt-3 p-3.5 bg-amber-950/40 border-2 border-amber-500/80 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                            <Banknote className="w-4 h-4 text-amber-400" /> CASH ON DELIVERY (COD)
                          </span>
                          <span className="px-2 py-0.5 bg-amber-500 text-black text-[10px] font-black rounded uppercase">
                            Collect Money
                          </span>
                        </div>
                        <div className="flex justify-between items-baseline pt-1 border-t border-amber-900/60">
                          <span className="text-xs text-amber-200/90 font-medium">Exact Amount to Collect:</span>
                          <span className="font-mono text-lg font-black text-amber-300">
                            UGX {new Intl.NumberFormat('en-UG').format(activeOrder.totalAmount)}
                          </span>
                        </div>
                        <p className="text-[10px] text-amber-300/80 leading-tight">
                          ⚠️ Collect this cash or mobile money from the customer prior to handing over the package.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3 p-3 bg-orange-950/40 border border-orange-800/80 rounded-xl flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-orange-300 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-orange-400" /> Pre-Paid ({activeOrder.paymentMethod})
                          </span>
                          <p className="text-[10px] text-orange-400/80">Payment already settled. Handover package without collecting funds.</p>
                        </div>
                        <span className="font-mono text-xs font-bold text-orange-200 bg-orange-900/60 px-2 py-1 rounded">
                          UGX {new Intl.NumberFormat('en-UG').format(activeOrder.totalAmount)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* STEP STATUS TIMELINE CONTROLS */}
                <div className="space-y-3.5 pt-2 border-t border-gray-850">
                  <p className="text-xs font-bold uppercase tracking-wider text-orange-400">Fulfillment Status Workflow Tracker</p>
                  <div className="flex flex-wrap gap-2.5">
                    {[
                      { label: 'Picked from Store', targetStatus: 'Processing' },
                      { label: 'On the Way (Out for Delivery)', targetStatus: 'Out for Delivery' },
                    ].map((step) => {
                      const isActive = activeOrder.status === step.targetStatus;
                      return (
                        <button
                          key={step.targetStatus}
                          onClick={() => updateOrderStatus(activeOrder.id, step.targetStatus as any)}
                          className={`px-4 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                            isActive
                              ? 'bg-[#ea580c] text-white ring-2 ring-orange-500/30'
                              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          {step.label}
                        </button>
                      );
                    })}

                    {/* Quick failure actions */}
                    <button
                      onClick={() => updateOrderStatus(activeOrder.id, 'Failed')}
                      className={`px-4 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                        activeOrder.status === 'Failed'
                          ? 'bg-red-600 text-white'
                          : 'bg-red-950/40 text-red-400 border border-red-900/40 hover:bg-red-950/80'
                      }`}
                    >
                      Rider Failed Handover
                    </button>
                    <button
                      onClick={() => updateOrderStatus(activeOrder.id, 'Returned')}
                      className={`px-4 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                        activeOrder.status === 'Returned'
                          ? 'bg-amber-600 text-white'
                          : 'bg-amber-950/40 text-amber-400 border border-amber-900/40 hover:bg-amber-950/80'
                      }`}
                    >
                      Returned to Shop 16
                    </button>
                  </div>
                </div>

                {/* PIN HANDOVER CONFIRMATION SYSTEM */}
                <div className="pt-6 border-t border-gray-850 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4.5 h-4.5" /> Secure Handover Verification PIN
                    </p>
                    <button
                      type="button"
                      onClick={handleResetPinKeypad}
                      className="text-[11px] text-gray-400 hover:text-orange-300 flex items-center gap-1 cursor-pointer bg-gray-900 px-2 py-1 rounded border border-gray-800"
                      title="Reset Keypad to enter other digits"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Refresh Keypad</span>
                    </button>
                  </div>

                  <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-3.5 space-y-2">
                    <p className="text-xs text-gray-300 leading-normal">
                      To confirm physical handover, please ask the client for their <strong className="text-orange-400">secure 4-digit authentication PIN</strong>. This verifies safe package transition.
                    </p>
                    <div className="text-[11px] text-gray-400 space-y-1">
                      <p>
                        💡 <span className="text-gray-300 font-medium">Where the client gets this code:</span> Generated at checkout, displayed in the client's <strong>Order Tracking timeline</strong>, and shown in their <strong>Order History</strong>.
                      </p>
                      <p className="text-gray-500 font-mono text-[10px]">
                        Order PIN: <span className="text-orange-400 font-bold bg-gray-850 px-1.5 py-0.5 rounded border border-gray-750">{getExpectedPin(activeOrder)}</span>
                      </p>
                    </div>
                  </div>

                  {pinSuccess && (
                    <div className="p-3.5 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-xl text-xs font-semibold flex items-start gap-2.5 shadow-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-bold text-white">Handover Confirmed & Notification Dispatched!</p>
                        <p className="text-[11px] text-emerald-300">{successMessage}</p>
                      </div>
                    </div>
                  )}

                  {pinError && (
                    <div className="p-3 bg-red-950/60 border border-red-900/40 text-red-400 rounded-lg text-xs font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{pinError}</span>
                    </div>
                  )}

                  {/* Status Notice if current active order is already delivered */}
                  {activeOrder.status === 'Delivered' && (
                    <div className="space-y-3">
                      <div className="p-3 bg-emerald-950/40 border border-emerald-800/80 rounded-xl flex items-center justify-between gap-3 text-left">
                        <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Handover Status: Delivered & Verified</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleResetPinKeypad}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-[#ea580c] hover:bg-orange-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-all shrink-0"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Enter New 4 Digits</span>
                        </button>
                      </div>

                      {/* Delete Delivered Order Card for Rider */}
                      <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-red-300 flex items-center gap-1.5 uppercase tracking-wider">
                            <Trash2 className="w-4 h-4 text-red-400" />
                            Delete Delivered Order from Rider Panel
                          </p>
                          <p className="text-[11px] text-gray-400 leading-relaxed">
                            Handover for order <strong className="text-gray-200 font-mono">#{activeOrder.id}</strong> is completed and verified. You can permanently delete this delivered order record from your rider queue.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setOrderToDelete(activeOrder)}
                          className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
                          id="rider-delete-delivered-order-btn"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Delivered Order</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ALWAYS-ACTIVE 4-DIGIT PIN KEYPAD AREA */}
                  <div className="bg-[#181818] border border-gray-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg text-left" id="rider-handover-keypad-card">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                      <div>
                        <p className="text-xs font-bold text-white flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-orange-400" />
                          <span>Client 4-Digit Handover Keypad</span>
                        </p>
                        <p className="text-[11px] text-gray-400">
                          Type digits directly below or tap the on-screen keypad
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetPinKeypad}
                        className="px-3 py-1.5 bg-gray-850 hover:bg-[#ea580c] active:scale-95 text-orange-300 hover:text-white text-xs font-bold rounded-lg border border-gray-750 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                        title="Clear digits and refresh keypad for new entry"
                        id="rider-keypad-refresh-btn"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Refresh Keypad</span>
                      </button>
                    </div>

                    {/* Direct visible input field for physical keyboard & screen reader accessibility */}
                    <div className="flex flex-col items-center gap-2 pt-1">
                      <div className="relative w-full max-w-[280px]">
                        <input
                          ref={pinInputRef}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={4}
                          placeholder="••••"
                          value={verificationPin}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                            setVerificationPin(val);
                            setPinError('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              executePinVerification();
                            }
                          }}
                          className="w-full text-center font-mono text-2xl sm:text-3xl font-extrabold tracking-[0.5em] text-orange-300 bg-[#121212] border-2 border-orange-500/80 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-4 focus:ring-orange-500/30 focus:border-orange-400 placeholder:text-gray-700 shadow-inner"
                          id="rider-pin-direct-input"
                        />
                      </div>
                    </div>

                    {/* 4 Large Digit Slot Indicators */}
                    <div
                      onClick={() => pinInputRef.current?.focus()}
                      className="flex justify-center items-center gap-2.5 sm:gap-3 cursor-pointer py-1"
                      title="Click to enter digits"
                    >
                      {[0, 1, 2, 3].map((index) => {
                        const digit = verificationPin[index];
                        const isCurrent = verificationPin.length === index;
                        return (
                          <div
                            key={index}
                            className={`w-11 h-13 sm:w-13 sm:h-15 rounded-xl border-2 flex items-center justify-center font-mono text-2xl sm:text-3xl font-black transition-all ${
                              digit
                                ? 'bg-orange-950/80 border-orange-500 text-orange-200 shadow-md shadow-orange-950/50 scale-105'
                                : isCurrent
                                ? 'bg-[#222222] border-orange-400 text-orange-400 ring-2 ring-orange-400/20 animate-pulse'
                                : 'bg-[#141414] border-gray-800 text-gray-600'
                            }`}
                          >
                            {digit ? digit : isCurrent ? '•' : '—'}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-400 px-1">
                      <span>Digits entered: <strong className="text-orange-400 font-mono">{verificationPin.length}</strong> / 4</span>
                      <button
                        type="button"
                        onClick={handleResetPinKeypad}
                        className="text-orange-400 hover:underline cursor-pointer text-[11px] font-semibold"
                      >
                        Reset / Clear
                      </button>
                    </div>

                    {/* Interactive On-Screen Touch Keypad */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-2.5 max-w-[280px] mx-auto pt-1">
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handleKeypadDigit(num)}
                            className="h-12 bg-[#222222] hover:bg-orange-900/60 active:scale-95 text-white font-mono text-xl font-bold rounded-xl border border-gray-800 hover:border-orange-600 transition-all flex items-center justify-center cursor-pointer shadow-sm select-none"
                          >
                            {num}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={handleResetPinKeypad}
                          className="h-12 bg-gray-900 hover:bg-gray-800 active:scale-95 text-orange-400 font-bold rounded-xl border border-gray-800 transition-all flex flex-col items-center justify-center cursor-pointer gap-0.5 select-none"
                          title="Refresh Keypad"
                        >
                          <RotateCcw className="w-4 h-4 text-orange-400" />
                          <span className="text-[9px] uppercase tracking-wider font-mono">Refresh</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleKeypadDigit('0')}
                          className="h-12 bg-[#222222] hover:bg-orange-900/60 active:scale-95 text-white font-mono text-xl font-bold rounded-xl border border-gray-800 hover:border-orange-600 transition-all flex items-center justify-center cursor-pointer shadow-sm select-none"
                        >
                          0
                        </button>
                        <button
                          type="button"
                          onClick={handleKeypadBackspace}
                          className="h-12 bg-gray-900 hover:bg-red-950/60 active:scale-95 text-gray-300 hover:text-red-300 font-bold rounded-xl border border-gray-800 hover:border-red-900/50 transition-all flex flex-col items-center justify-center cursor-pointer gap-0.5 select-none"
                          title="Backspace"
                        >
                          <Delete className="w-4 h-4 text-gray-400" />
                          <span className="text-[9px] uppercase tracking-wider font-mono">Back</span>
                        </button>
                      </div>

                      {/* Verify Action Button */}
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={executePinVerification}
                          disabled={verificationPin.length !== 4}
                          className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                            verificationPin.length === 4
                              ? 'bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white ring-2 ring-emerald-400/30'
                              : 'bg-gray-850 text-gray-500 border border-gray-800 cursor-not-allowed'
                          }`}
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>
                            {verificationPin.length === 4
                              ? `Verify 4-Digit Handover (${verificationPin})`
                              : `Enter ${4 - verificationPin.length} More Digit${4 - verificationPin.length > 1 ? 's' : ''} to Verify`}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
            ) : (
              <div className="bg-[#1E1E1E] border border-gray-800 rounded-2xl p-12 text-center text-gray-500 space-y-3">
                <div className="w-12 h-12 rounded-full bg-orange-950 flex items-center justify-center text-orange-400 mx-auto">
                  <Info className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-white text-sm">Select Dispatch Order</h4>
                <p className="text-xs max-w-xs mx-auto">
                  Please click an assigned order card from the left queue to trace destinations, route landmarks and inputs secure handover validation parameters.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* RIDER PROFILE SETUP MODAL */}
      <Modal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title="Rider Dispatcher Profile Setup"
      >
        <form onSubmit={handleSaveRiderProfileSubmit} className="space-y-4 text-left">
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3.5 text-xs text-orange-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-[#ea580c]" />
              Official Rider Information for UK2UG Dispatch
            </p>
            <p className="text-[11px] text-orange-800 leading-relaxed">
              Upon logging in, your full name, direct Uganda phone number, and vehicle details are registered and instantly visible to the UK2UG Admin console for route assignments.
            </p>
          </div>

          {profileSavedNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Rider profile saved successfully! Visible to Admin.</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Rider Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Ivan Kato"
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Phone Number (WhatsApp / Direct Call) <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              placeholder="e.g., +256 700 123 456"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
            />
            <p className="text-[10px] text-gray-500 mt-1">This number is displayed to customers for delivery coordination.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Vehicle Type</label>
              <select
                value={profileForm.vehicleType}
                onChange={(e) => setProfileForm({ ...profileForm, vehicleType: e.target.value })}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
              >
                <option value="Motorcycle (Boda Boda)">Motorcycle (Boda Boda)</option>
                <option value="Delivery Van">Delivery Van</option>
                <option value="Car">Car</option>
                <option value="Bicycle">Bicycle</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Number Plate</label>
              <input
                type="text"
                placeholder="e.g., UFL 892K"
                value={profileForm.plateNumber}
                onChange={(e) => setProfileForm({ ...profileForm, plateNumber: e.target.value })}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 uppercase focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowProfileModal(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#ea580c] hover:bg-orange-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
            >
              Save Profile
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Delivered Order Confirmation Modal */}
      {orderToDelete && (
        <Modal
          isOpen={!!orderToDelete}
          onClose={() => setOrderToDelete(null)}
          title="Delete Delivered Order from Rider Panel"
          maxWidth="md"
        >
          <div className="space-y-4 text-left p-1">
            <div className="p-3.5 bg-red-950/40 border border-red-900/60 rounded-xl space-y-1.5">
              <p className="text-xs font-bold text-red-300 flex items-center gap-1.5 uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                Permanent Removal Notice
              </p>
              <p className="text-xs text-red-200/90 leading-relaxed">
                Are you sure you want to delete delivered order <strong className="font-mono text-white">#{orderToDelete.id}</strong> from your rider panel queue?
              </p>
            </div>

            <div className="bg-[#1A1A1A] p-3.5 rounded-xl border border-gray-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Customer Name:</span>
                <span className="font-semibold text-white">{orderToDelete.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Phone Number:</span>
                <span className="font-mono text-orange-400 font-bold">{orderToDelete.customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Delivery Area:</span>
                <span className="text-gray-300">{orderToDelete.deliveryDetails?.district}, {orderToDelete.deliveryDetails?.area}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Handover Status:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Delivered & Verified
                </span>
              </div>
              <div className="flex justify-between items-start pt-1 border-t border-gray-850">
                <span className="text-gray-400">Package Items:</span>
                <span className="text-gray-300 font-medium truncate max-w-[200px] text-right">
                  {orderToDelete.items.map(i => `${i.title} (x${i.quantity})`).join(', ')}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 italic">
              Note: This action clears the delivered record from this rider dispatch queue.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDeleteOrder(orderToDelete)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete Order Record</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Clear All Delivered Orders Modal */}
      {showClearAllDeliveredModal && (
        <Modal
          isOpen={showClearAllDeliveredModal}
          onClose={() => setShowClearAllDeliveredModal(false)}
          title="Clear All Delivered Orders from Queue"
          maxWidth="md"
        >
          <div className="space-y-4 text-left p-1">
            <div className="p-3.5 bg-red-950/40 border border-red-900/60 rounded-xl space-y-1.5">
              <p className="text-xs font-bold text-red-300 flex items-center gap-1.5 uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                Bulk Deletion Confirmation
              </p>
              <p className="text-xs text-red-200/90 leading-relaxed">
                Are you sure you want to permanently delete all <strong className="text-white font-bold">{completedCount}</strong> delivered order records from your rider queue?
              </p>
            </div>

            <p className="text-xs text-gray-400">
              This will remove all orders with "Delivered" status from your queue, keeping your panel clean and focused on active dispatches.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setShowClearAllDeliveredModal(false)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAllDelivered}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete All Delivered ({completedCount})</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
