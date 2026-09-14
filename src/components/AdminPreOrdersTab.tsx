import React, { useState } from 'react';
import {
  Clock,
  Plus,
  Search,
  Filter,
  Plane,
  Package,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Edit3,
  ExternalLink,
  Percent,
  Layers,
  ArrowRight,
  Sparkles,
  Truck,
  RotateCcw,
  X,
  Trash2,
  Box,
  MapPin,
} from 'lucide-react';
import { Product, Category, PreOrderStatus } from '../types';
import { FormatCurrency, Modal } from './CommonUI';

interface AdminPreOrdersTabProps {
  products: Product[];
  categories: Category[];
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
}

export const PRE_ORDER_STATUS_SEQUENCE: { status: PreOrderStatus; label: string; icon: string; description: string; color: string }[] = [
  {
    status: 'Taking Pre-Orders',
    label: 'Taking Pre-Orders',
    icon: '🟢',
    description: 'Open for customer reservations on storefront',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    status: 'Procuring in London',
    label: 'Procuring in London',
    icon: '🇬🇧',
    description: 'Personal shoppers purchasing from authorized UK stores',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    status: 'Air Cargo Flight Scheduled',
    label: 'Flight Scheduled',
    icon: '🛫',
    description: 'Pallet booked with British Airways/Qatar Heathrow cargo',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    status: 'In Transit to Entebbe',
    label: 'In Flight to Entebbe',
    icon: '✈️',
    description: 'Air freight plane en route to Entebbe Airport',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    status: 'Clearing Customs',
    label: 'Clearing Customs',
    icon: '🛃',
    description: 'Uganda Revenue Authority inspection & duties at Entebbe',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    status: 'Arrived at Kampala Hub',
    label: 'At Kampala Hub',
    icon: '🏁',
    description: 'Ready for rider delivery dispatch or Thobani Center pickup',
    color: 'bg-teal-50 text-teal-800 border-teal-200',
  },
  {
    status: 'Pre-Orders Closed',
    label: 'Pre-Orders Closed',
    icon: '🔒',
    description: 'Batch allocations filled or sourcing window closed',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
  },
];

export const AdminPreOrdersTab: React.FC<AdminPreOrdersTabProps> = ({
  products,
  categories,
  addProduct,
  updateProduct,
  deleteProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [editingPreOrderProduct, setEditingPreOrderProduct] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Pre-Order items list
  const preOrderProducts = products.filter((p) => p.isPreOrder);

  // Filtered by status and search
  const filteredItems = preOrderProducts.filter((p) => {
    const matchesStatus = selectedStatusFilter === 'all' || p.preOrderStatus === selectedStatusFilter;
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.preOrderBatchNote && p.preOrderBatchNote.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Non-preorder products for conversion
  const nonPreOrderProducts = products.filter((p) => !p.isPreOrder);

  // Add Pre-Order Form State
  const [addForm, setAddForm] = useState({
    title: '',
    brand: '',
    categoryId: categories[0]?.id || 'cat-tech',
    basePrice: '',
    originalPrice: '',
    description: '',
    imagesText: '',
    preOrderStatus: 'Taking Pre-Orders' as PreOrderStatus,
    preOrderEstimatedArrival: '2026-09-28',
    preOrderDepositPercent: 50,
    preOrderTotalSlots: 10,
    preOrderClaimedSlots: 0,
    preOrderBatchNote: 'London Heathrow Air Cargo. Authentic UK Store stock with original VAT receipts.',
  });

  // Quick Inline Status Changer
  const handleQuickStatusChange = (product: Product, newStatus: PreOrderStatus) => {
    const updated: Product = {
      ...product,
      preOrderStatus: newStatus,
    };
    updateProduct(updated);
    showToast(`Status updated to "${newStatus}" for ${product.title}`);
  };

  // Handle Add Pre-Order Submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const imgs = addForm.imagesText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const defaultImg =
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800';

    const newProd: Product = {
      id: `preorder-${Date.now()}`,
      title: addForm.title,
      brand: addForm.brand || 'UK Direct',
      categoryId: addForm.categoryId,
      basePrice: Number(addForm.basePrice) || 500000,
      originalPrice: addForm.originalPrice ? Number(addForm.originalPrice) : undefined,
      quantity: Number(addForm.preOrderTotalSlots) || 10,
      description: addForm.description || 'Authentic product sourced directly from UK retail authorized outlets.',
      images: imgs.length > 0 ? imgs : [defaultImg],
      inTheBox: ['Original UK Retail Sealed Unit', 'UK 3-Pin Power Cable or Adapter', 'Manufacturer 1-Year Guarantee'],
      sourcingSpecs: [
        { key: 'Sourcing Hub', value: 'London, United Kingdom' },
        { key: 'Dispatch Airport', value: 'London Heathrow (LHR)' },
        { key: 'Arrival Hub', value: 'Entebbe International Airport (EBB)' },
        { key: 'Warranty', value: '100% Genuine UK Guarantee' },
      ],
      rating: 5.0,
      isPreOrder: true,
      preOrderStatus: addForm.preOrderStatus,
      preOrderEstimatedArrival: addForm.preOrderEstimatedArrival,
      preOrderDepositPercent: Number(addForm.preOrderDepositPercent) || 50,
      preOrderTotalSlots: Number(addForm.preOrderTotalSlots) || 10,
      preOrderClaimedSlots: Number(addForm.preOrderClaimedSlots) || 0,
      preOrderBatchNote: addForm.preOrderBatchNote,
    };

    addProduct(newProd);
    setShowAddModal(false);
    showToast(`Pre-order item "${newProd.title}" successfully added!`);
    setAddForm({
      title: '',
      brand: '',
      categoryId: categories[0]?.id || 'cat-tech',
      basePrice: '',
      originalPrice: '',
      description: '',
      imagesText: '',
      preOrderStatus: 'Taking Pre-Orders',
      preOrderEstimatedArrival: '2026-09-28',
      preOrderDepositPercent: 50,
      preOrderTotalSlots: 10,
      preOrderClaimedSlots: 0,
      preOrderBatchNote: 'London Heathrow Air Cargo. Authentic UK Store stock with original VAT receipts.',
    });
  };

  // Convert Existing Product State
  const [convertProductId, setConvertProductId] = useState('');
  const [convertStatus, setConvertStatus] = useState<PreOrderStatus>('Taking Pre-Orders');
  const [convertArrival, setConvertArrival] = useState('2026-09-28');
  const [convertSlots, setConvertSlots] = useState(10);
  const [convertClaimed, setConvertClaimed] = useState(0);
  const [convertDeposit, setConvertDeposit] = useState(50);
  const [convertNote, setConvertNote] = useState('Upcoming UK shipment batch allocation.');

  const handleConvertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = products.find((p) => p.id === convertProductId);
    if (!target) return;

    const updated: Product = {
      ...target,
      isPreOrder: true,
      preOrderStatus: convertStatus,
      preOrderEstimatedArrival: convertArrival,
      preOrderTotalSlots: Number(convertSlots),
      preOrderClaimedSlots: Number(convertClaimed),
      preOrderDepositPercent: Number(convertDeposit),
      preOrderBatchNote: convertNote,
    };

    updateProduct(updated);
    setShowConvertModal(false);
    showToast(`"${target.title}" converted to Pre-Order!`);
  };

  // Handle Edit Save
  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPreOrderProduct) return;
    updateProduct(editingPreOrderProduct);
    setEditingPreOrderProduct(null);
    showToast(`Pre-order item "${editingPreOrderProduct.title}" updated!`);
  };

  // Remove from Pre-Order (Revert to Regular Product)
  const handleRevertToRegular = (prod: Product) => {
    const updated: Product = {
      ...prod,
      isPreOrder: false,
    };
    updateProduct(updated);
    showToast(`"${prod.title}" reverted to regular catalog product.`);
  };

  // Telemetry KPIs
  const totalPreOrders = preOrderProducts.length;
  const takingOrdersCount = preOrderProducts.filter((p) => p.preOrderStatus === 'Taking Pre-Orders').length;
  const inTransitOrCustomsCount = preOrderProducts.filter(
    (p) => p.preOrderStatus === 'In Transit to Entebbe' || p.preOrderStatus === 'Clearing Customs'
  ).length;
  const arrivedCount = preOrderProducts.filter((p) => p.preOrderStatus === 'Arrived at Kampala Hub').length;
  const totalSlotsBooked = preOrderProducts.reduce((sum, p) => sum + (p.preOrderClaimedSlots || 0), 0);

  return (
    <div className="space-y-6 text-left" id="admin-preorders-panel">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-fade-in border border-gray-700">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-50 text-[#008080]">
              <Plane className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-gray-900">Pre-Orders & Cargo Batches</h2>
          </div>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">
            Configure upcoming UK air freight items, assign customer-facing procurement and transit statuses, and track reservation quotas for London shipments.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {nonPreOrderProducts.length > 0 && (
            <button
              onClick={() => setShowConvertModal(true)}
              className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Convert Existing Item
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-[#008080] hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Pre-Order Item
          </button>
        </div>
      </div>

      {/* Telemetry KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Pre-Orders</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{totalPreOrders}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Active London batches</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Taking Pre-Orders</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{takingOrdersCount}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Open for reservations</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">In Flight / Customs</p>
          <p className="text-2xl font-black text-purple-700 mt-1">{inTransitOrCustomsCount}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">En route or Entebbe</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">Arrived Kampala</p>
          <p className="text-2xl font-black text-teal-800 mt-1">{arrivedCount}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Ready for dispatch</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm col-span-2 lg:col-span-1">
          <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Slots Reserved</p>
          <p className="text-2xl font-black text-indigo-700 mt-1">{totalSlotsBooked}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Customer allocations</p>
        </div>
      </div>

      {/* Customer Status Lifecycle Pipeline Explainer Card */}
      <div className="bg-gray-900 text-white rounded-2xl p-5 border border-gray-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
              Customer-Facing Pipeline Stages
            </span>
          </div>
          <span className="text-[11px] text-gray-400 font-medium">
            Status selected here immediately updates on the customer product page
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
          {PRE_ORDER_STATUS_SEQUENCE.map((stage, idx) => (
            <div
              key={stage.status}
              className="bg-gray-800/80 border border-gray-700/60 rounded-xl p-2.5 flex flex-col justify-between space-y-1 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{stage.icon}</span>
                <span className="text-[10px] font-bold text-gray-300 truncate">{stage.label}</span>
              </div>
              <p className="text-[9px] text-gray-400 line-clamp-2 leading-tight">{stage.description}</p>
              <div className="text-[8px] font-mono text-gray-500 uppercase tracking-wider">Stage {idx + 1}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search pre-order title, brand, batch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#008080] transition-colors"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <button
            onClick={() => setSelectedStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              selectedStatusFilter === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Pre-Orders ({preOrderProducts.length})
          </button>
          {PRE_ORDER_STATUS_SEQUENCE.map((stage) => {
            const count = preOrderProducts.filter((p) => p.preOrderStatus === stage.status).length;
            if (count === 0 && selectedStatusFilter !== stage.status) return null;
            return (
              <button
                key={stage.status}
                onClick={() => setSelectedStatusFilter(stage.status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                  selectedStatusFilter === stage.status
                    ? 'bg-[#008080] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{stage.icon}</span>
                <span>{stage.label}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pre-Order Items List */}
      {filteredItems.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-teal-50 text-[#008080] flex items-center justify-center mx-auto">
            <Plane className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">No Pre-Order Items Found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              {preOrderProducts.length === 0
                ? 'You do not have any items on pre-order yet. Add new products or convert existing items to announce London flight shipments.'
                : 'No pre-orders match your search criteria. Try selecting another status filter.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-[#008080] hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add First Pre-Order
            </button>
            {nonPreOrderProducts.length > 0 && (
              <button
                onClick={() => setShowConvertModal(true)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Convert Existing Product
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredItems.map((product) => {
            const currentStageIdx = PRE_ORDER_STATUS_SEQUENCE.findIndex((s) => s.status === product.preOrderStatus);
            const stageConfig = PRE_ORDER_STATUS_SEQUENCE.find((s) => s.status === product.preOrderStatus) || PRE_ORDER_STATUS_SEQUENCE[0];
            const claimedSlots = product.preOrderClaimedSlots || 0;
            const totalSlots = product.preOrderTotalSlots || product.quantity || 10;
            const slotsPercent = Math.min(100, Math.round((claimedSlots / totalSlots) * 100));

            return (
              <div
                key={product.id}
                className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Thumbnail & Info */}
                  <div className="flex items-start gap-4">
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-20 h-20 rounded-xl object-cover border border-gray-100 bg-gray-50 shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-100 uppercase tracking-wider">
                          PRE-ORDER ITEM
                        </span>
                        {product.brand && (
                          <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                            {product.brand}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400">
                          Category: {categories.find((c) => c.id === product.categoryId)?.name || 'General'}
                        </span>
                      </div>

                      <h3 className="font-bold text-gray-900 text-sm">{product.title}</h3>

                      <div className="flex items-center gap-3 text-xs">
                        <span className="font-extrabold text-gray-900">
                          UGX {new Intl.NumberFormat('en-UG').format(product.basePrice)}
                        </span>
                        {product.originalPrice && (
                          <span className="text-gray-400 line-through text-[11px]">
                            UGX {new Intl.NumberFormat('en-UG').format(product.originalPrice)}
                          </span>
                        )}
                        {product.preOrderDepositPercent && (
                          <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                            {product.preOrderDepositPercent}% Deposit
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Live Status Dropdown and Actions */}
                  <div className="flex flex-wrap items-center gap-3 self-end lg:self-center">
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                        Customer Visible Status:
                      </label>
                      <select
                        value={product.preOrderStatus || 'Taking Pre-Orders'}
                        onChange={(e) => handleQuickStatusChange(product, e.target.value as PreOrderStatus)}
                        className={`text-xs font-bold px-3 py-2 rounded-xl border outline-none cursor-pointer transition-colors shadow-sm ${stageConfig.color}`}
                      >
                        {PRE_ORDER_STATUS_SEQUENCE.map((stage) => (
                          <option key={stage.status} value={stage.status} className="bg-white text-gray-800">
                            {stage.icon} {stage.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5 pt-4 lg:pt-0">
                      <button
                        onClick={() => setEditingPreOrderProduct(product)}
                        title="Edit Pre-Order Parameters"
                        className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl border border-gray-200 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleRevertToRegular(product)}
                        title="Revert to standard inventory product"
                        className="px-2.5 py-2 bg-gray-50 hover:bg-amber-50 text-gray-600 hover:text-amber-700 rounded-xl border border-gray-200 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Revert to In-Stock
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Delete product "${product.title}"?`)) {
                            deleteProduct(product.id);
                            showToast(`Deleted ${product.title}`);
                          }
                        }}
                        title="Delete Product"
                        className="p-2 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl border border-gray-200 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress Bar through London -> Kampala Pipeline */}
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-gray-700">
                    <span className="flex items-center gap-1 text-teal-700">
                      <span>{stageConfig.icon}</span>
                      <span>Active Stage: <strong>{stageConfig.label}</strong></span>
                    </span>
                    {product.preOrderEstimatedArrival && (
                      <span className="flex items-center gap-1 text-gray-500">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>Estimated Arrival: <strong className="text-gray-800">{product.preOrderEstimatedArrival}</strong></span>
                      </span>
                    )}
                  </div>

                  {/* 6-step visual track */}
                  <div className="grid grid-cols-6 gap-1">
                    {PRE_ORDER_STATUS_SEQUENCE.slice(0, 6).map((stage, sIdx) => {
                      const isComplete = currentStageIdx >= sIdx;
                      const isCurrent = currentStageIdx === sIdx;

                      return (
                        <div key={stage.status} className="space-y-1">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              isCurrent
                                ? 'bg-teal-600 ring-2 ring-teal-200'
                                : isComplete
                                ? 'bg-teal-500'
                                : 'bg-gray-200'
                            }`}
                          />
                          <p className={`text-[9px] font-medium truncate ${isCurrent ? 'text-teal-800 font-bold' : isComplete ? 'text-gray-600' : 'text-gray-400'}`}>
                            {stage.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom details & quota bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 text-xs">
                  {/* Slots quota meter */}
                  <div className="bg-gray-50/70 rounded-xl p-3 border border-gray-100 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-500 font-medium">Reservation Slots:</span>
                      <span className="font-bold text-gray-900">
                        {claimedSlots} / {totalSlots} claimed ({totalSlots - claimedSlots} remaining)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#008080] h-full rounded-full transition-all"
                        style={{ width: `${slotsPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Batch Note */}
                  <div className="bg-gray-50/70 rounded-xl p-3 border border-gray-100 col-span-2 space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Flight & Sourcing Batch Note:
                    </span>
                    <p className="text-xs text-gray-700 line-clamp-2">
                      {product.preOrderBatchNote || 'Standard UK personal shopper sourcing via London Heathrow cargo.'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: ADD PRE-ORDER ITEM */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add Item on Pre-Order"
          maxWidth="2xl"
        >
          <form onSubmit={handleAddSubmit} className="space-y-4 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apple iPhone 16 Pro Max 256GB"
                  value={addForm.title}
                  onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-[#008080]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Brand</label>
                <input
                  type="text"
                  placeholder="e.g. Apple, Dyson, Sony, Creed"
                  value={addForm.brand}
                  onChange={(e) => setAddForm({ ...addForm, brand: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-[#008080]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Category *</label>
                <select
                  value={addForm.categoryId}
                  onChange={(e) => setAddForm({ ...addForm, categoryId: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-[#008080]"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Price in UGX *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 5200000"
                  value={addForm.basePrice}
                  onChange={(e) => setAddForm({ ...addForm, basePrice: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs outline-none font-mono focus:border-[#008080]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Original / Strike Price</label>
                <input
                  type="number"
                  placeholder="e.g. 5800000"
                  value={addForm.originalPrice}
                  onChange={(e) => setAddForm({ ...addForm, originalPrice: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs outline-none font-mono focus:border-[#008080]"
                />
              </div>
            </div>

            {/* PRE-ORDER PARAMETERS */}
            <div className="p-4 bg-teal-50/50 border border-teal-100 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-[#008080]">
                <Plane className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wide">Pre-Order Flight & Status Config</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Initial Pre-Order Status *</label>
                  <select
                    value={addForm.preOrderStatus}
                    onChange={(e) => setAddForm({ ...addForm, preOrderStatus: e.target.value as PreOrderStatus })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold outline-none focus:border-[#008080]"
                  >
                    {PRE_ORDER_STATUS_SEQUENCE.map((stage) => (
                      <option key={stage.status} value={stage.status}>
                        {stage.icon} {stage.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Estimated Arrival Date *</label>
                  <input
                    type="date"
                    required
                    value={addForm.preOrderEstimatedArrival}
                    onChange={(e) => setAddForm({ ...addForm, preOrderEstimatedArrival: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-[#008080]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Deposit Required (%)</label>
                  <select
                    value={addForm.preOrderDepositPercent}
                    onChange={(e) => setAddForm({ ...addForm, preOrderDepositPercent: Number(e.target.value) })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-[#008080]"
                  >
                    <option value={30}>30% Deposit</option>
                    <option value={50}>50% Deposit (Standard)</option>
                    <option value={70}>70% Deposit</option>
                    <option value={100}>100% Full Payment</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Total Slots Quota</label>
                  <input
                    type="number"
                    min={1}
                    value={addForm.preOrderTotalSlots}
                    onChange={(e) => setAddForm({ ...addForm, preOrderTotalSlots: Number(e.target.value) })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs outline-none font-mono focus:border-[#008080]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Initial Claimed Slots</label>
                  <input
                    type="number"
                    min={0}
                    value={addForm.preOrderClaimedSlots}
                    onChange={(e) => setAddForm({ ...addForm, preOrderClaimedSlots: Number(e.target.value) })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs outline-none font-mono focus:border-[#008080]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Flight Batch Note</label>
                <input
                  type="text"
                  placeholder="e.g. Heathrow Air Cargo Flight BA063 - Procured from Regent St Apple Store"
                  value={addForm.preOrderBatchNote}
                  onChange={(e) => setAddForm({ ...addForm, preOrderBatchNote: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-[#008080]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Image URLs (one per line)</label>
              <textarea
                rows={2}
                placeholder="https://images.unsplash.com/photo-..."
                value={addForm.imagesText}
                onChange={(e) => setAddForm({ ...addForm, imagesText: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs outline-none focus:border-[#008080]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Item Description</label>
              <textarea
                rows={2}
                placeholder="Detailed specifications, UK warranty info..."
                value={addForm.description}
                onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs outline-none focus:border-[#008080]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#008080] hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow"
              >
                Publish Pre-Order Item
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 2: CONVERT EXISTING PRODUCT */}
      {showConvertModal && (
        <Modal
          isOpen={showConvertModal}
          onClose={() => setShowConvertModal(false)}
          title="Convert Catalog Item to Pre-Order"
          maxWidth="md"
        >
          <form onSubmit={handleConvertSubmit} className="space-y-4 text-left">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Select Item from Catalog *</label>
              <select
                required
                value={convertProductId}
                onChange={(e) => setConvertProductId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#008080]"
              >
                <option value="">-- Choose a product --</option>
                {nonPreOrderProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} (UGX {new Intl.NumberFormat('en-UG').format(p.basePrice)})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Customer-Visible Pre-Order Status *</label>
              <select
                value={convertStatus}
                onChange={(e) => setConvertStatus(e.target.value as PreOrderStatus)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-[#008080]"
              >
                {PRE_ORDER_STATUS_SEQUENCE.map((stage) => (
                  <option key={stage.status} value={stage.status}>
                    {stage.icon} {stage.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Estimated Arrival</label>
                <input
                  type="date"
                  required
                  value={convertArrival}
                  onChange={(e) => setConvertArrival(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-[#008080]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Deposit (%)</label>
                <select
                  value={convertDeposit}
                  onChange={(e) => setConvertDeposit(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-[#008080]"
                >
                  <option value={30}>30%</option>
                  <option value={50}>50% (Standard)</option>
                  <option value={100}>100% Full</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Total Slots</label>
                <input
                  type="number"
                  min={1}
                  value={convertSlots}
                  onChange={(e) => setConvertSlots(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs outline-none font-mono focus:border-[#008080]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Claimed Slots</label>
                <input
                  type="number"
                  min={0}
                  value={convertClaimed}
                  onChange={(e) => setConvertClaimed(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs outline-none font-mono focus:border-[#008080]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Batch Sourcing Note</label>
              <input
                type="text"
                value={convertNote}
                onChange={(e) => setConvertNote(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-[#008080]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowConvertModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!convertProductId}
                className="px-5 py-2 bg-[#008080] hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow"
              >
                Convert to Pre-Order
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 3: EDIT PRE-ORDER PARAMETERS */}
      {editingPreOrderProduct && (
        <Modal
          isOpen={!!editingPreOrderProduct}
          onClose={() => setEditingPreOrderProduct(null)}
          title={`Edit Pre-Order: ${editingPreOrderProduct.title}`}
          maxWidth="lg"
        >
          <form onSubmit={handleEditSave} className="space-y-4 text-left">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Customer-Facing Status *</label>
              <select
                value={editingPreOrderProduct.preOrderStatus || 'Taking Pre-Orders'}
                onChange={(e) =>
                  setEditingPreOrderProduct({
                    ...editingPreOrderProduct,
                    preOrderStatus: e.target.value as PreOrderStatus,
                  })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-[#008080]"
              >
                {PRE_ORDER_STATUS_SEQUENCE.map((stage) => (
                  <option key={stage.status} value={stage.status}>
                    {stage.icon} {stage.label} — {stage.description}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Estimated Arrival</label>
                <input
                  type="date"
                  value={editingPreOrderProduct.preOrderEstimatedArrival || ''}
                  onChange={(e) =>
                    setEditingPreOrderProduct({
                      ...editingPreOrderProduct,
                      preOrderEstimatedArrival: e.target.value,
                    })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-[#008080]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Deposit (%)</label>
                <select
                  value={editingPreOrderProduct.preOrderDepositPercent || 50}
                  onChange={(e) =>
                    setEditingPreOrderProduct({
                      ...editingPreOrderProduct,
                      preOrderDepositPercent: Number(e.target.value),
                    })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-[#008080]"
                >
                  <option value={30}>30%</option>
                  <option value={50}>50%</option>
                  <option value={70}>70%</option>
                  <option value={100}>100% Full</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Total Slots</label>
                <input
                  type="number"
                  min={1}
                  value={editingPreOrderProduct.preOrderTotalSlots || editingPreOrderProduct.quantity || 10}
                  onChange={(e) =>
                    setEditingPreOrderProduct({
                      ...editingPreOrderProduct,
                      preOrderTotalSlots: Number(e.target.value),
                    })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs outline-none font-mono focus:border-[#008080]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Claimed Slots</label>
                <input
                  type="number"
                  min={0}
                  value={editingPreOrderProduct.preOrderClaimedSlots || 0}
                  onChange={(e) =>
                    setEditingPreOrderProduct({
                      ...editingPreOrderProduct,
                      preOrderClaimedSlots: Number(e.target.value),
                    })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs outline-none font-mono focus:border-[#008080]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Flight Batch Note</label>
              <textarea
                rows={2}
                value={editingPreOrderProduct.preOrderBatchNote || ''}
                onChange={(e) =>
                  setEditingPreOrderProduct({
                    ...editingPreOrderProduct,
                    preOrderBatchNote: e.target.value,
                  })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs outline-none focus:border-[#008080]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEditingPreOrderProduct(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#008080] hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
