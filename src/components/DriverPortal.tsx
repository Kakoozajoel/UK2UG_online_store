import React, { useState } from 'react';
import {
  Truck,
  Clock,
  Navigation,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Coins,
  Phone,
  BookOpen,
  KeyRound,
  ShieldCheck,
  Map,
  ChevronRight,
  Info
} from 'lucide-react';
import { Order } from '../types';
import { InitialsBadge, FormatCurrency } from './CommonUI';

interface DriverPortalProps {
  orders: Order[];
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
}

export const DriverPortal: React.FC<DriverPortalProps> = ({ orders, updateOrderStatus }) => {
  // Filter only door delivery orders (Store pickup is picked up by customers directly in shop)
  const deliveryOrders = orders.filter((o) => o.deliveryPath === 'delivery');

  // Currently viewing order route details
  const [activeOrderId, setActiveOrderId] = useState<string | null>(() => {
    const activeOnes = deliveryOrders.filter((o) => ['Processing', 'Out for Delivery'].includes(o.status));
    return activeOnes[0]?.id ?? deliveryOrders[0]?.id ?? null;
  });

  // Secure pickup verification pin states
  const [verificationPin, setVerificationPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [pinSuccess, setPinSuccess] = useState<boolean>(false);

  const activeOrder = deliveryOrders.find((o) => o.id === activeOrderId);

  // Status computation for metrics
  const assignedCount = deliveryOrders.length;
  const pendingCount = deliveryOrders.filter((o) => o.status === 'Pending' || o.status === 'Paid').length;
  const inTransitCount = deliveryOrders.filter((o) => o.status === 'Out for Delivery' || o.status === 'Processing').length;
  const completedCount = deliveryOrders.filter((o) => o.status === 'Delivered').length;
  const failedCount = deliveryOrders.filter((o) => o.status === 'Failed' || o.status === 'Returned').length;
  
  // Today's delivery fee earnings (UGX)
  const todayEarnings = deliveryOrders
    .filter((o) => o.status === 'Delivered')
    .reduce((sum, o) => sum + o.deliveryFee, 0);

  // Verification PIN formula: uses order.deliveryPin or last 4 digits of order ID
  const getExpectedPin = (order: Order) => {
    if (order.deliveryPin) return order.deliveryPin;
    const numbersOnly = order.id.replace(/\D/g, '');
    return numbersOnly.substring(numbersOnly.length - 4);
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    setPinSuccess(false);

    if (!activeOrder) return;

    const expected = getExpectedPin(activeOrder);
    if (verificationPin === expected) {
      updateOrderStatus(activeOrder.id, 'Delivered');
      setPinSuccess(true);
      setVerificationPin('');
      setTimeout(() => setPinSuccess(false), 4000);
    } else {
      setPinError(`Incorrect verification security pin. (Hint: the client's PIN for this order is "${expected}").`);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-[#E0E0E0] flex flex-col font-sans" id="driver-portal-root">
      {/* Dark Mode Header */}
      <header className="h-20 bg-[#1E1E1E] border-b border-gray-800 flex items-center justify-between px-6 sm:px-8 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-[#008080] text-white p-2.5 rounded-lg flex items-center justify-center">
            <Truck className="w-5.5 h-5.5" />
          </div>
          <div className="text-left">
            <span className="text-lg font-bold tracking-tight text-white uppercase">UK2UG Rider</span>
            <p className="text-[10px] text-teal-400 font-semibold tracking-wider">Local Dispatch Route Manager</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-400 bg-teal-950/60 px-3 py-1 rounded-full border border-teal-900">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            Rider Online
          </span>
        </div>
      </header>

      <div className="flex-1 p-6 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
        {/* Logistics metrics grid */}
        <section className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[
            { label: 'Assigned Deliveries', val: assignedCount, icon: <Truck className="text-teal-400 w-5 h-5" /> },
            { label: 'Pending Dispatches', val: pendingCount, icon: <Clock className="text-yellow-400 w-5 h-5" /> },
            { label: 'In Transit Route', val: inTransitCount, icon: <Navigation className="text-teal-400 w-5 h-5" /> },
            { label: 'Completed Sourced', val: completedCount, icon: <CheckCircle2 className="text-emerald-400 w-5 h-5" /> },
            { label: 'Failed Handover', val: failedCount, icon: <XCircle className="text-red-400 w-5 h-5" /> },
            { label: 'Rider Earnings', val: `UGX ${new Intl.NumberFormat('en-UG').format(todayEarnings)}`, icon: <Coins className="text-yellow-400 w-5 h-5" />, highlight: true },
          ].map((card, idx) => (
            <div
              key={idx}
              className={`bg-[#1E1E1E] border p-4 rounded-xl flex flex-col justify-between space-y-2 text-left ${
                card.highlight ? 'border-yellow-500/20 shadow-md' : 'border-gray-800'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 truncate">{card.label}</span>
                {card.icon}
              </div>
              <p className={`text-base sm:text-lg font-extrabold ${card.highlight ? 'text-yellow-400' : 'text-white'}`}>
                {card.val}
              </p>
            </div>
          ))}
        </section>

        {/* Driver Core Layout: Left Orders List, Right Details Map */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left panel: Assigned Orders List */}
          <div className="space-y-4 lg:col-span-1">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 text-left">Assigned Dispatch Queue</p>
            <div className="space-y-3.5 max-h-[580px] overflow-y-auto pr-1">
              {deliveryOrders.map((ord) => {
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
                        ? 'bg-[#1E1E1E] border-[#008080] shadow-[0_4px_15px_rgba(0,128,128,0.15)]'
                        : 'bg-[#151515] border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-mono text-xs font-bold text-white">{ord.id}</span>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${
                          ord.status === 'Delivered'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/40'
                            : ord.status === 'Out for Delivery'
                            ? 'bg-teal-950 text-teal-300 border border-teal-900/40'
                            : 'bg-yellow-950 text-yellow-400 border border-yellow-900/40'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>

                    <div className="mt-2.5 space-y-1">
                      <p className="text-xs font-bold text-gray-300">{ord.customerName}</p>
                      <a
                        href={`tel:${ord.customerPhone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[11px] font-bold text-teal-400 flex items-center gap-1 hover:underline font-mono"
                      >
                        <Phone className="w-3 h-3 text-[#008080]" /> {ord.customerPhone}
                      </a>
                      <p className="text-[11px] text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#008080]" /> {ord.deliveryDetails?.district}, {ord.deliveryDetails?.area}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-gray-800 flex items-center justify-between text-[11px] text-gray-400">
                      <span className="font-mono text-[#008080] font-bold">
                        Fee: UGX {new Intl.NumberFormat('en-UG').format(ord.deliveryFee)}
                      </span>
                      <span className="text-[10px] font-semibold text-gray-500 italic truncate max-w-[130px]" title={payStatus}>
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
          </div>

          {/* Right panel: Route Map & Verification actions */}
          <div className="lg:col-span-2 space-y-6 text-left">
            {activeOrder ? (
              <div className="bg-[#1E1E1E] border border-gray-800 rounded-2xl p-6 space-y-6">
                {/* Header detail */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-4">
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Active Sourcing Dispatch</p>
                    <h3 className="font-mono text-base font-extrabold text-white">{activeOrder.id}</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-200">{activeOrder.customerName}</p>
                      <p className="font-mono text-xs font-bold text-teal-400">{activeOrder.customerPhone}</p>
                    </div>
                    <a
                      href={`tel:${activeOrder.customerPhone}`}
                      className="px-4 py-2 bg-[#008080] hover:bg-teal-700 text-white rounded-lg transition-colors flex items-center gap-2 text-xs font-bold shadow-sm"
                    >
                      <Phone className="w-4 h-4" /> Call Client ({activeOrder.customerPhone})
                    </a>
                  </div>
                </div>

                {/* Logistics Route Map details pane */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#161616] p-4 rounded-xl border border-gray-850">
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                      <Phone className="w-4.5 h-4.5" /> Customer Contact & Destination
                    </p>
                    <div className="space-y-1 text-xs">
                      <p className="text-gray-200 font-bold text-sm">{activeOrder.customerName}</p>
                      <p className="text-teal-400 font-bold font-mono text-xs flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" /> {activeOrder.customerPhone}
                      </p>
                      <p className="text-gray-300 font-semibold pt-1">District: {activeOrder.deliveryDetails?.district}</p>
                      <p className="text-gray-400 font-semibold">Area: {activeOrder.deliveryDetails?.area}</p>
                      <p className="text-gray-400">Landmark: {activeOrder.deliveryDetails?.landmark}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
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
                    <div className="flex justify-between items-center text-sm pt-2 font-bold text-teal-400">
                      <span>Total Cash Collectible</span>
                      <span className="font-mono">
                        UGX {new Intl.NumberFormat('en-UG').format(activeOrder.totalAmount)}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 italic text-right">
                      Payment Mode:{' '}
                      <span className={`font-bold uppercase ${activeOrder.paymentMethod === 'COD' ? 'text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800' : 'text-teal-400'}`}>
                        {activeOrder.paymentMethod === 'COD' ? 'Payment on Delivery (Collect Cash / MoMo)' : activeOrder.paymentMethod}
                      </span>
                    </div>
                  </div>
                </div>

                {/* STEP STATUS TIMELINE CONTROLS */}
                <div className="space-y-3.5 pt-2 border-t border-gray-850">
                  <p className="text-xs font-bold uppercase tracking-wider text-teal-400">Fulfillment Status Workflow Tracker</p>
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
                              ? 'bg-[#008080] text-white ring-2 ring-teal-500/30'
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
                  <p className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4.5 h-4.5" /> Secure Handover Verification PIN
                  </p>
                  <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-3.5 space-y-2">
                    <p className="text-xs text-gray-300 leading-normal">
                      To confirm physical handover, please ask the client for their <strong className="text-teal-400">secure 4-digit authentication PIN</strong>. This verifies safe package transition.
                    </p>
                    <div className="text-[11px] text-gray-400 space-y-1">
                      <p>
                        💡 <span className="text-gray-300 font-medium">Where the client gets this code:</span> Generated at checkout, displayed in the client's <strong>Order Tracking timeline</strong>, and shown in their <strong>Order History</strong>.
                      </p>
                      <p className="text-gray-500 font-mono text-[10px]">
                        Order PIN: <span className="text-teal-400 font-bold bg-gray-850 px-1.5 py-0.5 rounded border border-gray-750">{getExpectedPin(activeOrder)}</span>
                      </p>
                    </div>
                  </div>

                  {pinSuccess && (
                    <div className="p-3 bg-emerald-950 border border-emerald-900 text-emerald-400 rounded-lg text-xs font-semibold">
                      ✓ Handover verified! Order status updated to Delivered. Sourcing loop closed.
                    </div>
                  )}

                  {pinError && (
                    <div className="p-3 bg-red-950/60 border border-red-900/40 text-red-400 rounded-lg text-xs font-semibold">
                      {pinError}
                    </div>
                  )}

                  {activeOrder.status === 'Delivered' ? (
                    <div className="p-4 bg-emerald-950/30 border border-emerald-900/30 rounded-xl text-center text-xs font-bold text-emerald-400">
                      ✓ Package Successfully Delivered and Handover PIN Validated!
                    </div>
                  ) : (
                    <form onSubmit={handleVerifyPin} className="flex gap-2.5 max-w-sm">
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="4-digit PIN"
                        value={verificationPin}
                        onChange={(e) => setVerificationPin(e.target.value.replace(/\D/g, ''))}
                        className="flex-1 bg-[#161616] border border-gray-800 rounded-lg px-4 py-2 text-xs font-mono text-center text-white focus:outline-none focus:border-[#008080]"
                        required
                      />
                      <button
                        type="submit"
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Verify Handover
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-[#1E1E1E] border border-gray-800 rounded-2xl p-12 text-center text-gray-500 space-y-3">
                <div className="w-12 h-12 rounded-full bg-teal-950 flex items-center justify-center text-teal-400 mx-auto">
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
    </div>
  );
};
