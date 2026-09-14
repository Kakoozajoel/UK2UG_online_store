import React, { useState } from 'react';
import {
  Clock,
  Plus,
  Search,
  Truck,
  Plane,
  CheckCircle2,
  AlertCircle,
  Package,
  Calendar,
  Layers,
  Edit2,
  Trash2,
  Eye,
  ArrowRight,
  ShieldCheck,
  Percent,
  Users,
  Upload,
  Sparkles,
  Tag,
  FileText,
  RefreshCw,
  X
} from 'lucide-react';
import { Product, PreOrderStatus, Category } from '../types';
import { FormatCurrency, Modal } from './CommonUI';

const PRESET_PREORDER_IMAGES = [
  { label: 'AirPods Max / Audio', url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=800' },
  { label: 'iPhone Pro Max', url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=800' },
  { label: 'Luxury Perfume', url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=800' },
  { label: 'Dyson Airwrap', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800' },
  { label: 'Designer Watch', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800' },
  { label: 'UK Designer Footwear', url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=800' },
];

interface AdminPreOrdersProps {
  products: Product[];
  categories: Category[];
  updateProduct: (product: Product) => void;
  addProduct: (product: Product) => void;
  updatePreOrderStatus?: (productId: string, status: PreOrderStatus) => void;
  toggleProductPreOrder?: (productId: string, isPreOrder: boolean, details?: any) => void;
  deleteProduct?: (id: string) => void;
}

const PREORDER_STATUS_OPTIONS: { status: PreOrderStatus; label: string; desc: string; color: string; icon: string }[] = [
  {
    status: 'Taking Pre-Orders',
    label: 'Taking Pre-Orders',
    desc: 'Customer orders are actively open and being logged for the upcoming UK sourcing run.',
    color: 'bg-teal-50 text-[#008080] border-teal-200',
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
    desc: 'Consignment packaged at Heathrow logistics hub and air freight flight is booked.',
    color: 'bg-sky-50 text-sky-800 border-sky-200',
    icon: '✈️'
  },
  {
    status: 'In Transit to Entebbe',
    label: 'In Transit to Entebbe',
    desc: 'Cargo plane is airborne from London Heathrow to Entebbe International Airport.',
    color: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    icon: '🌍'
  },
  {
    status: 'Clearing Customs',
    label: 'Clearing Customs',
    desc: 'Shipment has landed at Entebbe and is undergoing Uganda Revenue Authority customs release.',
    color: 'bg-purple-50 text-purple-800 border-purple-200',
    icon: '🛃'
  },
  {
    status: 'Arrived at Kampala Hub',
    label: 'Arrived at Kampala Hub',
    desc: 'Goods are unpacked at Thobani Center ready for customer pickups and dispatch riders.',
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: '📍'
  },
  {
    status: 'Pre-Orders Closed',
    label: 'Pre-Orders Closed',
    desc: 'Batch quota is filled or order window has elapsed. No new reservations accepted.',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    icon: '🔒'
  }
];

export const AdminPreOrders: React.FC<AdminPreOrdersProps> = ({
  products,
  categories,
  updateProduct,
  addProduct,
  updatePreOrderStatus,
  toggleProductPreOrder,
  deleteProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPreOrder, setEditingPreOrder] = useState<Product | null>(null);

  // In-app deletion and action modals (safe in iframes)
  const [itemToRemovePreOrder, setItemToRemovePreOrder] = useState<Product | null>(null);
  const [itemToDeletePermanent, setItemToDeletePermanent] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  // Add / Convert Pre-Order Form State
  const [mode, setMode] = useState<'convert' | 'new'>('new');
  const [selectedExistingProductId, setSelectedExistingProductId] = useState<string>('');

  const [formData, setFormData] = useState({
    title: '',
    brand: '',
    sku: `UK-PRE-${Math.floor(1000 + Math.random() * 9000)}`,
    description: '',
    basePrice: 0,
    originalPrice: 0,
    categoryId: categories[0]?.id || '',
    imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=800',
    features: [
      'Official UK Retail Store Till Slip & Receipt',
      'UK 3-Pin Power Plug Specification',
      '1-Year Global Manufacturer Warranty',
      'Factory Sealed Retail Packaging'
    ] as string[],
    inTheBox: [
      'Factory Sealed Retail Box',
      'Original UK Retail Store Till Slip',
      'UK2UG Authenticity Certificate'
    ] as string[],
    sourcingOrigin: 'London, UK (Oxford Street / Harrods)',
    warranty: '1 Year Official Manufacturer Warranty',
    preOrderStatus: 'Taking Pre-Orders' as PreOrderStatus,
    preOrderEstimatedArrival: '28 Sep 2026',
    preOrderDepositPercent: 50,
    preOrderTotalSlots: 15,
    preOrderClaimedSlots: 0,
    preOrderBatchNote: 'Batch #04 - London Tech & Lifestyle Runway'
  });

  const [featureInput, setFeatureInput] = useState('');
  const [inclusionInput, setInclusionInput] = useState('');

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, featureInput.trim()]
      }));
      setFeatureInput('');
    }
  };

  const handleRemoveFeature = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== idx)
    }));
  };

  const handleAddInclusion = () => {
    if (inclusionInput.trim()) {
      setFormData(prev => ({
        ...prev,
        inTheBox: [...prev.inTheBox, inclusionInput.trim()]
      }));
      setInclusionInput('');
    }
  };

  const handleRemoveInclusion = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      inTheBox: prev.inTheBox.filter((_, i) => i !== idx)
    }));
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit. Please choose a smaller image.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setFormData(prev => ({ ...prev, imageUrl: dataUrl }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Filtered pre-order products
  const preOrderProducts = products.filter((p) => p.isPreOrder);

  const filteredItems = preOrderProducts.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      p.id.toLowerCase().includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (p.preOrderBatchNote && p.preOrderBatchNote.toLowerCase().includes(q));

    const matchesStatus = filterStatus === 'all' || p.preOrderStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Calculate high-level stats
  const totalSlots = preOrderProducts.reduce((sum, p) => sum + (p.preOrderTotalSlots || 0), 0);
  const totalClaimed = preOrderProducts.reduce((sum, p) => sum + (p.preOrderClaimedSlots || 0), 0);
  const activeSourcingCount = preOrderProducts.filter(
    (p) => p.preOrderStatus === 'Procuring in London' || p.preOrderStatus === 'Taking Pre-Orders'
  ).length;
  const inTransitCount = preOrderProducts.filter(
    (p) =>
      p.preOrderStatus === 'Air Cargo Flight Scheduled' ||
      p.preOrderStatus === 'In Transit to Entebbe' ||
      p.preOrderStatus === 'Clearing Customs'
  ).length;

  const handleOpenAdd = () => {
    const nonPreOrder = products.filter((p) => !p.isPreOrder);
    if (nonPreOrder.length > 0) {
      setSelectedExistingProductId(nonPreOrder[0].id);
      setMode('new'); // default to brand new or convert
    } else {
      setMode('new');
    }

    const randomSku = `UK-PRE-${Math.floor(1000 + Math.random() * 9000)}`;

    setFormData({
      title: '',
      brand: '',
      sku: randomSku,
      description: '',
      basePrice: 0,
      originalPrice: 0,
      categoryId: categories[0]?.id || '',
      imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=800',
      features: [
        'Official UK Retail Store Till Slip & Receipt',
        'UK 3-Pin Power Plug Specification',
        '1-Year Global Manufacturer Warranty',
        'Factory Sealed Retail Packaging'
      ],
      inTheBox: [
        'Factory Sealed Retail Box',
        'Original UK Retail Store Till Slip',
        'UK2UG Authenticity Certificate'
      ],
      sourcingOrigin: 'London, UK (Oxford Street / Harrods)',
      warranty: '1 Year Official Manufacturer Warranty',
      preOrderStatus: 'Taking Pre-Orders',
      preOrderEstimatedArrival: '28 Sep 2026',
      preOrderDepositPercent: 50,
      preOrderTotalSlots: 15,
      preOrderClaimedSlots: 0,
      preOrderBatchNote: 'Batch #04 - London Tech & Lifestyle Sourcing'
    });
    setFeatureInput('');
    setInclusionInput('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingPreOrder(p);
    setFormData({
      title: p.title,
      brand: p.brand || '',
      sku: p.sku || `UK-PRE-${p.id.slice(-4)}`,
      description: p.description,
      basePrice: p.basePrice,
      originalPrice: p.originalPrice || 0,
      categoryId: p.categoryId,
      imageUrl: p.images[0] || 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=800',
      features: p.features && p.features.length > 0 ? p.features : [
        'Official UK Retail Store Till Slip & Receipt',
        'UK 3-Pin Power Plug Specification',
        '1-Year Global Manufacturer Warranty',
        'Factory Sealed Retail Packaging'
      ],
      inTheBox: p.inTheBox && p.inTheBox.length > 0 ? p.inTheBox : [
        'Factory Sealed Retail Box',
        'Original UK Retail Store Till Slip',
        'UK2UG Authenticity Certificate'
      ],
      sourcingOrigin: p.sourcingSpecs?.find(s => s.key === 'Sourced From')?.value || 'London, UK (Oxford Street / Harrods)',
      warranty: p.sourcingSpecs?.find(s => s.key === 'Warranty')?.value || '1 Year Official Manufacturer Warranty',
      preOrderStatus: p.preOrderStatus || 'Taking Pre-Orders',
      preOrderEstimatedArrival: p.preOrderEstimatedArrival || '28 Sep 2026',
      preOrderDepositPercent: p.preOrderDepositPercent || 50,
      preOrderTotalSlots: p.preOrderTotalSlots || 15,
      preOrderClaimedSlots: p.preOrderClaimedSlots || 0,
      preOrderBatchNote: p.preOrderBatchNote || 'Batch #04 - London Direct Run'
    });
    setFeatureInput('');
    setInclusionInput('');
  };

  const handleStatusChange = (product: Product, newStatus: PreOrderStatus) => {
    if (updatePreOrderStatus) {
      updatePreOrderStatus(product.id, newStatus);
    } else {
      updateProduct({
        ...product,
        preOrderStatus: newStatus
      });
    }
  };

  const handleRemoveFromPreOrder = (product: Product) => {
    setItemToRemovePreOrder(product);
  };

  const handleConfirmRemovePreOrder = () => {
    if (!itemToRemovePreOrder) return;
    if (toggleProductPreOrder) {
      toggleProductPreOrder(itemToRemovePreOrder.id, false);
    } else {
      updateProduct({
        ...itemToRemovePreOrder,
        isPreOrder: false
      });
    }
    showToast(`"${itemToRemovePreOrder.title}" reverted to regular inventory.`);
    setItemToRemovePreOrder(null);
  };

  const handleConfirmDeletePermanent = () => {
    if (!itemToDeletePermanent) return;
    if (deleteProduct) {
      deleteProduct(itemToDeletePermanent.id);
      showToast(`Product "${itemToDeletePermanent.title}" has been permanently deleted.`);
    }
    setItemToDeletePermanent(null);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingPreOrder) {
      // Update existing
      updateProduct({
        ...editingPreOrder,
        title: formData.title,
        brand: formData.brand,
        sku: formData.sku || editingPreOrder.sku || `UK-PRE-${editingPreOrder.id.slice(-4)}`,
        description: formData.description,
        basePrice: Number(formData.basePrice),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
        categoryId: formData.categoryId,
        images: [formData.imageUrl || editingPreOrder.images[0] || 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=800'],
        features: formData.features,
        inTheBox: formData.inTheBox,
        sourcingSpecs: [
          { key: 'Sourced From', value: formData.sourcingOrigin },
          { key: 'Warranty', value: formData.warranty },
          { key: 'Product SKU', value: formData.sku || editingPreOrder.sku || `UK-PRE-${editingPreOrder.id.slice(-4)}` }
        ],
        isPreOrder: true,
        preOrderStatus: formData.preOrderStatus,
        preOrderEstimatedArrival: formData.preOrderEstimatedArrival,
        preOrderDepositPercent: Number(formData.preOrderDepositPercent),
        preOrderTotalSlots: Number(formData.preOrderTotalSlots),
        preOrderClaimedSlots: Number(formData.preOrderClaimedSlots),
        preOrderBatchNote: formData.preOrderBatchNote,
      });
      showToast(`Pre-order item "${formData.title}" updated successfully.`);
      setEditingPreOrder(null);
      setShowAddModal(false);
    } else if (mode === 'convert') {
      const target = products.find((p) => p.id === selectedExistingProductId);
      if (target) {
        updateProduct({
          ...target,
          sku: formData.sku || target.sku || `UK-PRE-${target.id.slice(-4)}`,
          features: formData.features.length > 0 ? formData.features : (target.features || ['Official UK Retail Till Slip', 'Factory Sealed']),
          inTheBox: formData.inTheBox.length > 0 ? formData.inTheBox : target.inTheBox,
          isPreOrder: true,
          preOrderStatus: formData.preOrderStatus,
          preOrderEstimatedArrival: formData.preOrderEstimatedArrival,
          preOrderDepositPercent: Number(formData.preOrderDepositPercent),
          preOrderTotalSlots: Number(formData.preOrderTotalSlots),
          preOrderClaimedSlots: Number(formData.preOrderClaimedSlots),
          preOrderBatchNote: formData.preOrderBatchNote,
        });
        showToast(`"${target.title}" successfully converted to Pre-Order!`);
      }
      setShowAddModal(false);
    } else {
      // Create new product directly as pre-order
      const newProd: Product = {
        id: `prod-pre-${Date.now()}`,
        sku: formData.sku || `UK-PRE-${Math.floor(1000 + Math.random() * 9000)}`,
        title: formData.title,
        brand: formData.brand || 'UK Genuine',
        description: formData.description,
        basePrice: Number(formData.basePrice),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
        quantity: 0,
        categoryId: formData.categoryId,
        images: [formData.imageUrl || 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=800'],
        features: formData.features,
        inTheBox: formData.inTheBox,
        sourcingSpecs: [
          { key: 'Sourced From', value: formData.sourcingOrigin },
          { key: 'Warranty', value: formData.warranty },
          { key: 'Product SKU', value: formData.sku || `UK-PRE-${Date.now().toString().slice(-4)}` }
        ],
        rating: 5.0,
        isPreOrder: true,
        preOrderStatus: formData.preOrderStatus,
        preOrderEstimatedArrival: formData.preOrderEstimatedArrival,
        preOrderDepositPercent: Number(formData.preOrderDepositPercent),
        preOrderTotalSlots: Number(formData.preOrderTotalSlots),
        preOrderClaimedSlots: Number(formData.preOrderClaimedSlots),
        preOrderBatchNote: formData.preOrderBatchNote,
      };
      addProduct(newProd);
      showToast(`New pre-order item "${newProd.title}" successfully added and visible to customers!`);
      setShowAddModal(false);
    }
  };

  return (
    <div className="space-y-6 text-left" id="admin-preorders-panel">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="p-3.5 bg-teal-50 border border-teal-200 text-teal-900 rounded-xl text-xs font-bold flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#008080] shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage('')}
            className="text-teal-700 hover:text-teal-950 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Banner & KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Active Pre-Orders</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{preOrderProducts.length}</h3>
            <p className="text-xs text-teal-600 font-semibold mt-1">Direct from UK stores</p>
          </div>
          <div className="p-3 bg-teal-50 text-[#008080] rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Allocations Claimed</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">
              {totalClaimed} <span className="text-sm font-normal text-gray-400">/ {totalSlots || 0}</span>
            </h3>
            <p className="text-xs text-gray-500 mt-1">Customer reservations</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">London Procurement</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{activeSourcingCount}</h3>
            <p className="text-xs text-amber-600 font-semibold mt-1">In shopper shopping cart</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Air Freight & Customs</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{inTransitCount}</h3>
            <p className="text-xs text-sky-600 font-semibold mt-1">Airborne / Entebbe clearance</p>
          </div>
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
            <Plane className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Control Header & Action Bar */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search pre-orders by product number (SKU), title, brand, or batch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#008080] focus:bg-white transition-all"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-semibold text-gray-700 outline-none focus:border-[#008080]"
          >
            <option value="all">All Pre-Order Stages ({preOrderProducts.length})</option>
            {PREORDER_STATUS_OPTIONS.map((opt) => (
              <option key={opt.status} value={opt.status}>
                {opt.label} ({preOrderProducts.filter((p) => p.preOrderStatus === opt.status).length})
              </option>
            ))}
          </select>
        </div>

        {/* Add Pre-Order Button */}
        <button
          onClick={handleOpenAdd}
          className="py-2.5 px-4 bg-[#008080] hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Item on Pre-Order
        </button>
      </div>

      {/* Pre-Orders List or Table */}
      {filteredItems.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center space-y-3">
          <Clock className="w-10 h-10 text-gray-300 mx-auto" />
          <h4 className="text-sm font-bold text-gray-800">No Pre-Order Items Found</h4>
          <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
            {preOrderProducts.length === 0
              ? 'You have not added any items on pre-order yet. Click "+ Add Item on Pre-Order" above to list upcoming London sourcing products.'
              : 'No items match your search filter criteria. Try adjusting the status filter.'}
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-2 px-4 py-2 bg-[#008080] text-white text-xs font-bold rounded-lg hover:bg-teal-700 cursor-pointer"
          >
            Add First Pre-Order Item
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((prod) => {
            const currentOption =
              PREORDER_STATUS_OPTIONS.find((opt) => opt.status === prod.preOrderStatus) ||
              PREORDER_STATUS_OPTIONS[0];

            const slotsTotal = prod.preOrderTotalSlots || 10;
            const slotsClaimed = prod.preOrderClaimedSlots || 0;
            const percentClaimed = Math.min(100, Math.round((slotsClaimed / slotsTotal) * 100));

            return (
              <div
                key={prod.id}
                className="bg-white border border-gray-100 rounded-xl p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5"
              >
                {/* Left: Product preview */}
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-20 h-20 rounded-xl border border-gray-100 bg-gray-50 overflow-hidden shrink-0">
                    <img
                      src={prod.images[0] || 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=800'}
                      alt={prod.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-teal-50 text-[#008080] border border-teal-200">
                        Pre-Order Item
                      </span>
                      {prod.brand && (
                        <span className="text-[10px] font-semibold text-gray-500">
                          {prod.brand}
                        </span>
                      )}
                      {prod.preOrderBatchNote && (
                        <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 truncate max-w-xs">
                          {prod.preOrderBatchNote}
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-sm text-gray-900 truncate">{prod.title}</h4>

                    <div className="flex items-center gap-3 text-xs pt-0.5">
                      <span className="font-mono font-black text-[#008080]">
                        <FormatCurrency value={prod.basePrice} />
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="text-gray-600 text-[11px] flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        Est. Arrival: <strong className="text-gray-800">{prod.preOrderEstimatedArrival || 'End of Month'}</strong>
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="text-[11px] font-semibold text-gray-500">
                        {prod.preOrderDepositPercent || 50}% Deposit Required
                      </span>
                    </div>

                    {/* Progress Bar for Slots */}
                    <div className="pt-1.5 flex items-center gap-3 max-w-xs">
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-[#008080] h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentClaimed}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-gray-600 whitespace-nowrap">
                        {slotsClaimed} / {slotsTotal} Reserved ({percentClaimed}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Live Customer Status Switcher */}
                <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                  {/* Status Dropdown */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block font-sans">
                      Status Customer Sees On Site:
                    </label>
                    <select
                      value={prod.preOrderStatus || 'Taking Pre-Orders'}
                      onChange={(e) => handleStatusChange(prod, e.target.value as PreOrderStatus)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold border outline-none cursor-pointer ${currentOption.color}`}
                    >
                      {PREORDER_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.status} value={opt.status}>
                          {opt.icon} {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto pt-3 sm:pt-4">
                    <button
                      onClick={() => handleOpenEdit(prod)}
                      title="Edit Pre-Order Parameters"
                      className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveFromPreOrder(prod)}
                      title="Remove from Pre-Order (Revert to normal stock)"
                      className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    {deleteProduct && (
                      <button
                        onClick={() => setItemToDeletePermanent(prod)}
                        title="Delete Product Permanently"
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Customer Preview Info Box */}
      <div className="bg-teal-50/70 border border-teal-100 rounded-xl p-4 flex items-start gap-3 text-xs text-teal-800 leading-relaxed">
        <ShieldCheck className="w-5 h-5 text-[#008080] shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">How Customers Experience Pre-Order Items:</strong>
          <p className="text-teal-700 mt-0.5">
            When you mark a product as Pre-Order, the customer storefront displays a distinctive Pre-Order badge along with the real-time sourcing stage timeline (e.g. <em>Procuring in London</em>, <em>Air Cargo Scheduled</em>, or <em>Clearing Customs</em>). Customers can reserve their piece with a guaranteed spot and track the arrival directly.
          </p>
        </div>
      </div>

      {/* ADD / CONVERT PREORDER MODAL */}
      {(showAddModal || editingPreOrder) && (
        <Modal
          isOpen={true}
          onClose={() => {
            setShowAddModal(false);
            setEditingPreOrder(null);
          }}
          title={editingPreOrder ? `Edit Pre-Order Product: ${editingPreOrder.title}` : 'Upload Product on Pre-Order'}
          maxWidth="2xl"
        >
          <form onSubmit={handleSaveModal} className="space-y-5 text-left p-1 max-h-[80vh] overflow-y-auto pr-1">
            {/* Storefront Publishing Notice */}
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs text-teal-900">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#008080] animate-ping" />
                <span className="font-bold">Customer Storefront Publishing Privileges Active</span>
              </div>
              <span className="text-[11px] text-teal-700 hidden sm:inline">
                Immediately live on customer shop & pre-order views
              </span>
            </div>

            {!editingPreOrder && (
              <div className="flex items-center p-1 bg-gray-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setMode('new')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    mode === 'new' ? 'bg-[#008080] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Create Brand New Pre-Order Listing
                </button>
                <button
                  type="button"
                  onClick={() => setMode('convert')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    mode === 'convert' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Convert Existing Product to Pre-Order
                </button>
              </div>
            )}

            {!editingPreOrder && mode === 'convert' && (
              <div className="space-y-1.5 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Select Product to Put on Pre-Order *
                </label>
                <select
                  value={selectedExistingProductId}
                  onChange={(e) => setSelectedExistingProductId(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs outline-none focus:border-[#008080]"
                  required
                >
                  {products
                    .filter((p) => !p.isPreOrder)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} - UGX {new Intl.NumberFormat('en-UG').format(p.basePrice)} ({p.sku || p.id})
                      </option>
                    ))}
                </select>
                {products.filter((p) => !p.isPreOrder).length === 0 && (
                  <p className="text-[11px] text-amber-600">All current products are already in Pre-Order. Switch to "Create Brand New".</p>
                )}
              </div>
            )}

            {(editingPreOrder || mode === 'new') && (
              <div className="space-y-4">
                {/* 1. Identification & Classification */}
                <div className="bg-gray-50/60 border border-gray-200/80 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#008080]" />
                      Product Details & Identification
                    </h5>
                    <span className="text-[11px] text-gray-400 font-mono">Product ID: {editingPreOrder?.id || 'Auto-generated'}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-bold text-gray-700">Product Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dyson Airwrap Multi-Styler Complete Long"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-[#008080]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Brand Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Dyson UK, Apple, Jo Malone"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-[#008080]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-700">Product Number / SKU *</label>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, sku: `UK-PRE-${Math.floor(1000 + Math.random() * 9000)}` })}
                          className="text-[10px] text-[#008080] font-bold hover:underline cursor-pointer"
                        >
                          Auto Generate
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="e.g. UK-TECH-009 or UK-PRE-8421"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-mono font-bold text-gray-800 outline-none focus:border-[#008080]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Category *</label>
                      <select
                        value={formData.categoryId}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-[#008080]"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Pre-Order Price (UGX) *</label>
                      <input
                        type="number"
                        required
                        min={1000}
                        placeholder="e.g. 2950000"
                        value={formData.basePrice || ''}
                        onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-mono font-bold text-gray-900 outline-none focus:border-[#008080]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Original / UK Retail Price (UGX Strikethrough)</label>
                      <input
                        type="number"
                        placeholder="e.g. 3400000"
                        value={formData.originalPrice || ''}
                        onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-mono outline-none focus:border-[#008080]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Product Description *</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Describe authentic UK retail specifications, model details, and sourcing boutique..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-[#008080] resize-none"
                    />
                  </div>
                </div>

                {/* 2. Media / Image Upload & Curated Presets */}
                <div className="bg-gray-50/60 border border-gray-200/80 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-[#008080]" />
                      Product Image & Showcase Media
                    </h5>
                    <span className="text-[11px] text-gray-400">File upload or URL</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    {/* Thumbnail preview */}
                    <div className="w-24 h-24 rounded-xl border border-gray-200 overflow-hidden bg-white shrink-0 shadow-2xs">
                      <img
                        src={formData.imageUrl || 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=800'}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 space-y-2 w-full">
                      <div className="flex items-center gap-2">
                        <label className="px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg text-xs font-bold text-gray-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs">
                          <Upload className="w-3.5 h-3.5 text-[#008080]" />
                          <span>Upload Image File</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageFileUpload}
                            className="hidden"
                          />
                        </label>
                        <span className="text-[11px] text-gray-400">or enter image URL below</span>
                      </div>

                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-[#008080]"
                      />

                      {/* Curated Presets Pills */}
                      <div className="space-y-1 pt-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Quick Presets:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {PRESET_PREORDER_IMAGES.map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => setFormData({ ...formData, imageUrl: preset.url })}
                              className="px-2 py-0.5 bg-white hover:bg-teal-50 border border-gray-200 hover:border-[#008080] rounded text-[10px] font-semibold text-gray-600 transition-all cursor-pointer"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Product Features & Selling Points */}
                <div className="bg-gray-50/60 border border-gray-200/80 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#008080]" />
                      Product Features & Highlights
                    </h5>
                    <span className="text-[11px] text-gray-400">{formData.features.length} features added</span>
                  </div>

                  {/* Feature Tags List */}
                  <div className="flex flex-wrap gap-1.5">
                    {formData.features.map((feat, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-200 text-gray-800 rounded-full text-xs font-medium shadow-2xs"
                      >
                        <CheckCircle2 className="w-3 h-3 text-[#008080]" />
                        {feat}
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(idx)}
                          className="text-gray-400 hover:text-red-500 ml-0.5 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Add Feature Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a product feature (e.g. UK 3-Pin Plug, Apple M3 Pro, 100% Cotton)..."
                      value={featureInput}
                      onChange={(e) => setFeatureInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddFeature();
                        }
                      }}
                      className="flex-1 bg-white border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-[#008080]"
                    />
                    <button
                      type="button"
                      onClick={handleAddFeature}
                      disabled={!featureInput.trim()}
                      className="px-3.5 py-2 bg-[#008080] hover:bg-teal-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Add Feature
                    </button>
                  </div>

                  {/* Inclusions & Specs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-200/60">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Sourcing Origin Boutique</label>
                      <input
                        type="text"
                        value={formData.sourcingOrigin}
                        onChange={(e) => setFormData({ ...formData, sourcingOrigin: e.target.value })}
                        placeholder="e.g. London, UK (Oxford Street & Harrods)"
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-[#008080]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Warranty / Guarantee Coverage</label>
                      <input
                        type="text"
                        value={formData.warranty}
                        onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
                        placeholder="e.g. 1 Year Official Global Manufacturer Warranty"
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-[#008080]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PRE-ORDER SOURCING PARAMETERS & FLIGHT TIMELINE */}
            <div className="bg-teal-50/50 border border-teal-200/80 rounded-xl p-4 space-y-3">
              <h5 className="text-xs font-bold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#008080]" />
                Customer Sourcing Status & Flight Timeline
              </h5>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Pre-Order Sourcing Status (Visible to Customer) *
                </label>
                <select
                  value={formData.preOrderStatus}
                  onChange={(e) => setFormData({ ...formData, preOrderStatus: e.target.value as PreOrderStatus })}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs font-bold text-gray-800 outline-none focus:border-[#008080]"
                >
                  {PREORDER_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.status} value={opt.status}>
                      {opt.icon} {opt.label} — {opt.desc}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Estimated Arrival Date *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 28 Sep 2026 or Early October 2026"
                    value={formData.preOrderEstimatedArrival}
                    onChange={(e) => setFormData({ ...formData, preOrderEstimatedArrival: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-[#008080]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Pre-Order Deposit %</label>
                  <select
                    value={formData.preOrderDepositPercent}
                    onChange={(e) => setFormData({ ...formData, preOrderDepositPercent: Number(e.target.value) })}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-[#008080]"
                  >
                    <option value={30}>30% Deposit (Pay 70% on Kampala Pickup)</option>
                    <option value={50}>50% Deposit (Pay 50% on Kampala Pickup)</option>
                    <option value={100}>100% Full Payment Upfront</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Total Pre-Order Slots Available *</label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    required
                    value={formData.preOrderTotalSlots}
                    onChange={(e) => setFormData({ ...formData, preOrderTotalSlots: Number(e.target.value) })}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-mono outline-none focus:border-[#008080]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Slots Already Claimed / Reserved</label>
                  <input
                    type="number"
                    min={0}
                    max={formData.preOrderTotalSlots}
                    value={formData.preOrderClaimedSlots}
                    onChange={(e) => setFormData({ ...formData, preOrderClaimedSlots: Number(e.target.value) })}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-mono outline-none focus:border-[#008080]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Batch Code or Sourcing Flight Tag</label>
                <input
                  type="text"
                  placeholder="e.g. Batch #04 - London Tech & Harrods Sourcing"
                  value={formData.preOrderBatchNote}
                  onChange={(e) => setFormData({ ...formData, preOrderBatchNote: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-[#008080]"
                />
              </div>
            </div>

            {/* Live Customer Preview Pill Card */}
            <div className="bg-gray-100 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white overflow-hidden shrink-0 border border-gray-200">
                  <img src={formData.imageUrl || 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=800'} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 line-clamp-1">{formData.title || 'Product Title'}</p>
                  <p className="text-[11px] text-gray-500 font-mono">
                    UGX {new Intl.NumberFormat('en-UG').format(formData.basePrice || 0)} • {formData.preOrderStatus}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold shrink-0">
                Ready to Publish
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingPreOrder(null);
                }}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#008080] text-white rounded-lg text-xs font-bold hover:bg-teal-700 transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{editingPreOrder ? 'Save Product Changes' : 'Upload & Publish Pre-Order'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* CONFIRM MODAL: REVERT PRE-ORDER TO REGULAR INVENTORY */}
      {itemToRemovePreOrder && (
        <Modal
          isOpen={true}
          onClose={() => setItemToRemovePreOrder(null)}
          title="Revert to Regular Store Inventory"
          maxWidth="md"
        >
          <div className="space-y-4 text-left p-1">
            <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
              <RefreshCw className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Remove from Pre-Orders</strong>
                <p className="mt-0.5 text-amber-800">
                  Are you sure you want to remove <strong className="font-bold text-gray-900">"{itemToRemovePreOrder.title}"</strong> from the Pre-Order pipeline?
                  It will revert to normal in-stock store inventory and will no longer show the pre-order badge or flight tracking stages to customers.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setItemToRemovePreOrder(null)}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemovePreOrder}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Revert to Regular Stock
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRM MODAL: PERMANENTLY DELETE PRODUCT */}
      {itemToDeletePermanent && (
        <Modal
          isOpen={true}
          onClose={() => setItemToDeletePermanent(null)}
          title="Permanently Delete Product"
          maxWidth="md"
        >
          <div className="space-y-4 text-left p-1">
            <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 leading-relaxed">
              <Trash2 className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Permanent Deletion Warning</strong>
                <p className="mt-0.5 text-red-800">
                  Are you sure you want to permanently delete <strong className="font-bold text-gray-900">"{itemToDeletePermanent.title}"</strong> from the database?
                  This cannot be undone and will permanently remove this item from the store.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setItemToDeletePermanent(null)}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletePermanent}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Permanently Delete Product
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
