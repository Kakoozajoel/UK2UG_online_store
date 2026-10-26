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
  Percent,
  Users,
  Upload,
  Sparkles,
  Tag,
  FileText,
  RefreshCw,
  X,
  Link as LinkIcon,
  ExternalLink,
  Shirt,
  Footprints,
  PlusCircle,
  Sliders,
  Box
} from 'lucide-react';
import { Product, PreOrderStatus, Category } from '../types';
import { FormatCurrency, Modal } from './CommonUI';
import { getPreOrderStatuses, saveCustomPreOrderStatus, isEstimatedArrivalReached } from '../lib/preOrderStatusManager';

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

  // Statuses dynamically loaded from preOrderStatusManager
  const [allStatusOptions, setAllStatusOptions] = useState(getPreOrderStatuses());
  const [showAddCustomStatusModal, setShowAddCustomStatusModal] = useState<boolean>(false);
  const [newStatusInput, setNewStatusInput] = useState<string>('');
  const [newStatusDescInput, setNewStatusDescInput] = useState<string>('');
  const [newStatusIconInput, setNewStatusIconInput] = useState<string>('📦');

  const [formData, setFormData] = useState({
    title: '',
    brand: '',
    sku: `UK-PRE-${Math.floor(1000 + Math.random() * 9000)}`,
    description: '',
    basePrice: 0,
    originalPrice: 0,
    categoryId: categories[0]?.id || '',
    imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=800',
    productUrls: ['', '', '', '', ''] as string[],
    features: [
      'Official UK Retail Store Till Slip & Receipt',
      'UK 3-Pin Power Plug Specification',
      '1-Year Global Manufacturer Warranty',
      'Factory Sealed Retail Packaging'
    ] as string[],
    specs: [
      { key: 'Sourced From', value: 'London, UK (Oxford Street / Harrods)' },
      { key: 'Warranty Coverage', value: '1 Year Official Global Manufacturer Warranty' },
      { key: 'Power Specification', value: 'UK 3-Pin Fused BS 1363 (220–240V)' },
      { key: 'Packaging Condition', value: 'Brand New Factory Sealed UK Retail Box' }
    ] as { key: string; value: string }[],
    inTheBox: [
      'Factory Sealed Retail Box',
      'Original UK Retail Store Till Slip',
      'UK2UG Authenticity Certificate'
    ] as string[],
    isGarment: false,
    isFootwear: false,
    sizes: ['S', 'M', 'L', 'XL'] as string[],
    sourcingOrigin: 'London, UK (Oxford Street / Harrods)',
    warranty: '1 Year Official Manufacturer Warranty',
    preOrderStatus: 'Taking Pre-Orders' as PreOrderStatus,
    preOrderEstimatedArrival: '28 Sep 2026',
    quantity: 15,
  });

  const [featureInput, setFeatureInput] = useState('');
  const [inclusionInput, setInclusionInput] = useState('');
  const [specKeyInput, setSpecKeyInput] = useState('');
  const [specValueInput, setSpecValueInput] = useState('');
  const [customSizeInput, setCustomSizeInput] = useState('');

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

  const handleAddSpec = () => {
    if (specKeyInput.trim() && specValueInput.trim()) {
      setFormData(prev => ({
        ...prev,
        specs: [...prev.specs, { key: specKeyInput.trim(), value: specValueInput.trim() }]
      }));
      setSpecKeyInput('');
      setSpecValueInput('');
    }
  };

  const handleRemoveSpec = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      specs: prev.specs.filter((_, i) => i !== idx)
    }));
  };

  const handleAddCustomSize = () => {
    if (customSizeInput.trim()) {
      const normalized = customSizeInput.trim();
      if (!formData.sizes.includes(normalized)) {
        setFormData(prev => ({
          ...prev,
          sizes: [...prev.sizes, normalized]
        }));
      }
      setCustomSizeInput('');
    }
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

  // Filtered pre-order products (exclude items where pre-orders are closed)
  const preOrderProducts = products.filter(
    (p) => p.isPreOrder && p.preOrderStatus !== 'Pre-Orders Closed' && p.preOrderStatus !== 'Closed'
  );

  const filteredItems = preOrderProducts.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      p.id.toLowerCase().includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q));

    const matchesStatus = filterStatus === 'all' || p.preOrderStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Calculate high-level stats (Units in stock instead of slots)
  const totalStock = preOrderProducts.reduce((sum, p) => sum + (p.quantity || 0), 0);
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
      productUrls: ['', '', '', '', ''],
      features: [
        'Official UK Retail Store Till Slip & Receipt',
        'UK 3-Pin Power Plug Specification',
        '1-Year Global Manufacturer Warranty',
        'Factory Sealed Retail Packaging'
      ],
      specs: [
        { key: 'Sourced From', value: 'London, UK (Oxford Street / Harrods)' },
        { key: 'Warranty Coverage', value: '1 Year Official Global Manufacturer Warranty' },
        { key: 'Power Specification', value: 'UK 3-Pin Fused BS 1363 (220–240V)' },
        { key: 'Packaging Condition', value: 'Brand New Factory Sealed UK Retail Box' }
      ],
      inTheBox: [
        'Factory Sealed Retail Box',
        'Original UK Retail Store Till Slip',
        'UK2UG Authenticity Certificate'
      ],
      isGarment: false,
      isFootwear: false,
      sizes: ['S', 'M', 'L', 'XL'],
      sourcingOrigin: 'London, UK (Oxford Street / Harrods)',
      warranty: '1 Year Official Manufacturer Warranty',
      preOrderStatus: 'Taking Pre-Orders',
      preOrderEstimatedArrival: '28 Sep 2026',
      quantity: 15,
    });
    setFeatureInput('');
    setInclusionInput('');
    setSpecKeyInput('');
    setSpecValueInput('');
    setCustomSizeInput('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingPreOrder(p);

    // Ensure at least 4 link placeholders
    const existingUrls = p.productUrls && p.productUrls.length > 0
      ? [...p.productUrls]
      : (p.productUrl ? [p.productUrl] : []);
    while (existingUrls.length < 4) {
      existingUrls.push('');
    }

    const defaultSpecs = [
      { key: 'Sourced From', value: p.sourcingSpecs?.find(s => s.key === 'Sourced From')?.value || 'London, UK (Oxford Street / Harrods)' },
      { key: 'Warranty Coverage', value: p.sourcingSpecs?.find(s => s.key === 'Warranty' || s.key === 'Warranty Coverage')?.value || '' }
    ];

    setFormData({
      title: p.title,
      brand: p.brand || '',
      sku: '',
      description: p.description,
      basePrice: p.basePrice,
      originalPrice: p.originalPrice || 0,
      categoryId: p.categoryId,
      imageUrl: p.images[0] || 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=800',
      productUrls: existingUrls,
      features: p.features && p.features.length > 0 ? p.features : [
        'Official UK Retail Store Till Slip & Receipt',
        'UK 3-Pin Power Plug Specification',
        '1-Year Global Manufacturer Warranty',
        'Factory Sealed Retail Packaging'
      ],
      specs: p.sourcingSpecs && p.sourcingSpecs.length > 0 ? p.sourcingSpecs : defaultSpecs,
      inTheBox: p.inTheBox && p.inTheBox.length > 0 ? p.inTheBox : [
        'Factory Sealed Retail Box',
        'Original UK Retail Store Till Slip',
        'UK2UG Authenticity Certificate'
      ],
      isGarment: Boolean(p.isGarment),
      isFootwear: Boolean(p.isFootwear),
      sizes: p.sizes && p.sizes.length > 0 ? p.sizes : ['S', 'M', 'L', 'XL'],
      sourcingOrigin: p.sourcingSpecs?.find(s => s.key === 'Sourced From')?.value || 'London, UK (Oxford Street / Harrods)',
      warranty: p.sourcingSpecs?.find(s => s.key === 'Warranty' || s.key === 'Warranty Coverage')?.value || '1 Year Official Manufacturer Warranty',
      preOrderStatus: p.preOrderStatus || 'Taking Pre-Orders',
      preOrderEstimatedArrival: p.preOrderEstimatedArrival || '28 Sep 2026',
      quantity: p.quantity !== undefined ? p.quantity : 15,
    });
    setFeatureInput('');
    setInclusionInput('');
    setSpecKeyInput('');
    setSpecValueInput('');
    setCustomSizeInput('');
  };

  const handleStatusChange = (product: Product, newStatus: PreOrderStatus) => {
    if (newStatus === 'Pre-Orders Closed' || newStatus === 'Closed') {
      if (toggleProductPreOrder) {
        toggleProductPreOrder(product.id, false, { preOrderStatus: 'Pre-Orders Closed' });
      } else if (updatePreOrderStatus) {
        updatePreOrderStatus(product.id, 'Pre-Orders Closed');
      } else {
        updateProduct({
          ...product,
          isPreOrder: false,
          preOrderStatus: 'Pre-Orders Closed'
        });
      }
      showToast(`Pre-order closed for "${product.title}". Item removed from active pre-orders panel.`);
      return;
    }

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

    const cleanUrls = formData.productUrls.map(u => u.trim()).filter(Boolean);
    const primaryUrl = cleanUrls[0] || '';
    const isSized = formData.isGarment || formData.isFootwear;

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
        productUrl: primaryUrl,
        productUrls: cleanUrls,
        features: formData.features,
        inTheBox: formData.inTheBox,
        sourcingSpecs: formData.specs,
        isGarment: Boolean(formData.isGarment),
        isFootwear: Boolean(formData.isFootwear),
        sizes: isSized ? formData.sizes : [],
        isPreOrder: true,
        preOrderStatus: formData.preOrderStatus,
        preOrderEstimatedArrival: formData.preOrderEstimatedArrival,
        quantity: Math.max(1, Number(formData.quantity) || 1),
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
          productUrl: primaryUrl || target.productUrl,
          productUrls: cleanUrls.length > 0 ? cleanUrls : (target.productUrls || []),
          features: formData.features.length > 0 ? formData.features : (target.features || ['Official UK Retail Till Slip', 'Factory Sealed']),
          inTheBox: formData.inTheBox.length > 0 ? formData.inTheBox : target.inTheBox,
          sourcingSpecs: formData.specs.length > 0 ? formData.specs : target.sourcingSpecs,
          isGarment: Boolean(formData.isGarment),
          isFootwear: Boolean(formData.isFootwear),
          sizes: isSized ? formData.sizes : (target.sizes || []),
          isPreOrder: true,
          preOrderStatus: formData.preOrderStatus,
          preOrderEstimatedArrival: formData.preOrderEstimatedArrival,
          quantity: Math.max(1, Number(formData.quantity) || target.quantity || 1),
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
        quantity: Math.max(1, Number(formData.quantity) || 1),
        categoryId: formData.categoryId,
        images: [formData.imageUrl || 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=800'],
        productUrl: primaryUrl,
        productUrls: cleanUrls,
        features: formData.features,
        inTheBox: formData.inTheBox,
        sourcingSpecs: formData.specs,
        isGarment: Boolean(formData.isGarment),
        isFootwear: Boolean(formData.isFootwear),
        sizes: isSized ? formData.sizes : [],
        rating: 5.0,
        isPreOrder: true,
        preOrderStatus: formData.preOrderStatus,
        preOrderEstimatedArrival: formData.preOrderEstimatedArrival,
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
        <div className="p-3.5 bg-orange-50 border border-orange-200 text-orange-900 rounded-xl text-xs font-bold flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#ea580c] shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage('')}
            className="text-orange-700 hover:text-orange-950 p-1 cursor-pointer"
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
            <p className="text-xs text-orange-600 font-semibold mt-1">Direct from UK stores</p>
          </div>
          <div className="p-3 bg-orange-50 text-[#ea580c] rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Pre-Order Stock</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">
              {totalStock || 0} <span className="text-sm font-normal text-gray-400">Units in Stock</span>
            </h3>
            <p className="text-xs text-orange-600 font-semibold mt-1">Available inventory quantity</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Layers className="w-6 h-6" />
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
                placeholder="Search pre-orders by title, brand, or batch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#ea580c] focus:bg-white transition-all"
              />
            </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-semibold text-gray-700 outline-none focus:border-[#ea580c]"
          >
            <option value="all">All Pre-Order Stages ({preOrderProducts.length})</option>
            {allStatusOptions.map((opt) => (
              <option key={opt.status} value={opt.status}>
                {opt.label} ({preOrderProducts.filter((p) => p.preOrderStatus === opt.status).length})
              </option>
            ))}
          </select>

          {/* Button to add custom pre-order status */}
          <button
            type="button"
            onClick={() => setShowAddCustomStatusModal(true)}
            className="px-3 py-2 bg-orange-50 hover:bg-orange-100 text-[#ea580c] border border-orange-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
            title="Create a new custom pre-order workflow status"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            + Custom Status
          </button>
        </div>

        {/* Add Pre-Order Button */}
        <button
          onClick={handleOpenAdd}
          className="py-2.5 px-4 bg-[#ea580c] hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shrink-0"
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
            className="mt-2 px-4 py-2 bg-[#ea580c] text-white text-xs font-bold rounded-lg hover:bg-orange-700 cursor-pointer"
          >
            Add First Pre-Order Item
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((prod) => {
            const currentOption =
              allStatusOptions.find((opt) => opt.status === prod.preOrderStatus) ||
              allStatusOptions[0] || { status: prod.preOrderStatus, label: prod.preOrderStatus, color: 'bg-orange-50 text-[#ea580c] border-orange-200', icon: '📦' };

            const stockTotal = prod.quantity !== undefined ? prod.quantity : 10;

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
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-orange-50 text-[#ea580c] border border-orange-200">
                        Pre-Order Item
                      </span>
                      {prod.brand && (
                        <span className="text-[10px] font-semibold text-gray-500">
                          {prod.brand}
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-sm text-gray-900 truncate">{prod.title}</h4>

                    <div className="flex items-center gap-3 text-xs pt-0.5 flex-wrap">
                      <span className="font-mono font-black text-[#ea580c]">
                        <FormatCurrency value={prod.basePrice} />
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="text-gray-600 text-[11px] flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-[#ea580c]" />
                        Est. Arrival: <strong className="text-gray-800">{prod.preOrderEstimatedArrival || '10–14 Days'}</strong>
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="text-[11px] font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                        {stockTotal} Units Stock
                      </span>
                      {((prod.productUrls && prod.productUrls.length > 0) || prod.productUrl) && (
                        <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200 flex items-center gap-1">
                          <LinkIcon className="w-2.5 h-2.5" />
                          {(prod.productUrls && prod.productUrls.length > 0) ? prod.productUrls.length : 1} Product Links
                        </span>
                      )}
                      {prod.sourcingSpecs && prod.sourcingSpecs.length > 0 && (
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 flex items-center gap-1">
                          <Sliders className="w-2.5 h-2.5" />
                          {prod.sourcingSpecs.length} Specs
                        </span>
                      )}
                    </div>

                    {/* Small Squares for Garment & Shoe Sizes */}
                    {(prod.isGarment || prod.isFootwear || (prod.sizes && prod.sizes.length > 0)) && prod.sizes && prod.sizes.length > 0 && (
                      <div className="flex items-center gap-1.5 pt-1.5">
                        <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                          {prod.isFootwear ? <Footprints className="w-3 h-3 text-[#ea580c]" /> : <Shirt className="w-3 h-3 text-[#ea580c]" />}
                          {prod.isFootwear ? 'Shoe Sizes:' : 'Sizes:'}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {prod.sizes.map((sz) => (
                            <span
                              key={sz}
                              className="w-6 h-6 rounded bg-orange-50 border border-orange-200 text-[#ea580c] font-black text-[9px] flex items-center justify-center font-mono shadow-2xs"
                              title={`Size ${sz}`}
                            >
                              {sz}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
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
                      className={`px-3 py-2 rounded-lg text-xs font-bold border outline-none cursor-pointer ${currentOption.color || 'bg-orange-50 text-[#ea580c] border-orange-200'}`}
                    >
                      {allStatusOptions.map((opt) => (
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
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs text-orange-900">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ea580c] animate-ping" />
                <span className="font-bold">Customer Storefront Publishing Privileges Active</span>
              </div>
              <span className="text-[11px] text-orange-700 hidden sm:inline">
                Immediately live on customer shop & pre-order views
              </span>
            </div>

            {!editingPreOrder && (
              <div className="flex items-center p-1 bg-gray-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setMode('new')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    mode === 'new' ? 'bg-[#ea580c] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
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
                  className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs outline-none focus:border-[#ea580c]"
                  required
                >
                  {products
                    .filter((p) => !p.isPreOrder)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} - UGX {new Intl.NumberFormat('en-UG').format(p.basePrice)}
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
                      <Tag className="w-3.5 h-3.5 text-[#ea580c]" />
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
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-[#ea580c]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Brand Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Dyson UK, Apple, Jo Malone"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-[#ea580c]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Category *</label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-[#ea580c]"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
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
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-mono font-bold text-gray-900 outline-none focus:border-[#ea580c]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Original / UK Retail Price (UGX Strikethrough)</label>
                      <input
                        type="number"
                        placeholder="e.g. 3400000"
                        value={formData.originalPrice || ''}
                        onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-mono outline-none focus:border-[#ea580c]"
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
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-[#ea580c] resize-none"
                    />
                  </div>
                </div>

                {/* 2. Media / Image Upload & Curated Presets */}
                <div className="bg-gray-50/60 border border-gray-200/80 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-[#ea580c]" />
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
                          <Upload className="w-3.5 h-3.5 text-[#ea580c]" />
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
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-[#ea580c]"
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
                              className="px-2 py-0.5 bg-white hover:bg-orange-50 border border-gray-200 hover:border-[#ea580c] rounded text-[10px] font-semibold text-gray-600 transition-all cursor-pointer"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Product Store & Sourcing Links (At least 4 placeholders) */}
                <div className="bg-gray-50/60 border border-gray-200/80 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5 text-[#ea580c]" />
                      Product Store Links ({formData.productUrls.length} Placeholders)
                    </h5>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, productUrls: [...prev.productUrls, ''] }))}
                      className="text-[11px] font-bold text-[#ea580c] hover:text-orange-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add Another Link Placeholder
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Add official UK retailer, boutique, or manufacturer URLs for reference and price tracking.
                  </p>

                  <div className="space-y-2">
                    {formData.productUrls.map((url, idx) => {
                      const placeholders = [
                        'Link 1: e.g. https://www.amazon.co.uk/dp/... (Amazon UK)',
                        'Link 2: e.g. https://www.johnlewis.com/... (John Lewis & Partners)',
                        'Link 3: e.g. https://www.currys.co.uk/... (Currys PC World UK)',
                        'Link 4: e.g. https://www.harrods.com/... (Harrods / Selfridges)',
                        'Link 5: e.g. https://www.apple.com/uk/... (Official Brand Store)'
                      ];
                      return (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-gray-200 text-gray-700 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </span>
                          <input
                            type="url"
                            value={url}
                            onChange={(e) => {
                              const updated = [...formData.productUrls];
                              updated[idx] = e.target.value;
                              setFormData(prev => ({ ...prev, productUrls: updated }));
                            }}
                            placeholder={placeholders[idx] || `Link ${idx + 1}: e.g. https://...`}
                            className="flex-1 bg-white border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-[#ea580c]"
                          />
                          {formData.productUrls.length > 4 && (
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  productUrls: prev.productUrls.filter((_, i) => i !== idx)
                                }));
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded-md cursor-pointer"
                              title="Remove Link"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Specifications Section */}
                <div className="bg-gray-50/60 border border-gray-200/80 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-[#ea580c]" />
                      Product Specifications
                    </h5>
                    <span className="text-[11px] text-gray-400">{formData.specs.length} specs defined</span>
                  </div>

                  {/* Existing Specs Table */}
                  {formData.specs.length > 0 && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white divide-y divide-gray-100 text-xs">
                      {formData.specs.map((spec, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 hover:bg-gray-50/80 transition-colors">
                          <div className="grid grid-cols-1 sm:grid-cols-2 flex-1 gap-2">
                            <span className="font-bold text-gray-800">{spec.key}</span>
                            <span className="text-gray-600 font-mono text-[11px]">{spec.value}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSpec(idx)}
                            className="p-1 text-gray-400 hover:text-red-500 rounded ml-2 cursor-pointer"
                            title="Remove Specification"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Spec Row */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Spec Name (e.g. Sourced From, Material, Voltage, Capacity)..."
                      value={specKeyInput}
                      onChange={(e) => setSpecKeyInput(e.target.value)}
                      className="sm:w-1/3 bg-white border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-[#ea580c]"
                    />
                    <input
                      type="text"
                      placeholder="Spec Value (e.g. London, UK, 100% Organic Wool, 220V UK Plug)..."
                      value={specValueInput}
                      onChange={(e) => setSpecValueInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSpec();
                        }
                      }}
                      className="flex-1 bg-white border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-[#ea580c]"
                    />
                    <button
                      type="button"
                      onClick={handleAddSpec}
                      disabled={!specKeyInput.trim() || !specValueInput.trim()}
                      className="px-3.5 py-2 bg-[#ea580c] hover:bg-orange-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0"
                    >
                      Add Spec
                    </button>
                  </div>

                  {/* Preset Spec Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Quick Add:</span>
                    {[
                      { k: 'Material', v: 'Premium UK Sourced' },
                      { k: 'Colorway', v: 'Classic British Navy' },
                      { k: 'Warranty', v: '1 Year Manufacturer Guarantee' },
                      { k: 'Power Plug', v: 'UK 3-Pin Fused Plug (220-240V)' }
                    ].map((pre) => (
                      <button
                        key={pre.k}
                        type="button"
                        onClick={() => {
                          if (!formData.specs.some(s => s.key.toLowerCase() === pre.k.toLowerCase())) {
                            setFormData(prev => ({
                              ...prev,
                              specs: [...prev.specs, { key: pre.k, value: pre.v }]
                            }));
                          }
                        }}
                        className="px-2 py-0.5 bg-white hover:bg-orange-50 border border-gray-200 hover:border-orange-300 rounded text-[10px] font-medium text-gray-600 transition-colors cursor-pointer"
                      >
                        + {pre.k}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Key Features Section */}
                <div className="bg-gray-50/60 border border-gray-200/80 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#ea580c]" />
                      Key Features
                    </h5>
                    <span className="text-[11px] text-gray-400">{formData.features.length} features</span>
                  </div>

                  {/* Feature Tags List */}
                  <div className="flex flex-wrap gap-1.5">
                    {formData.features.map((feat, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-200 text-gray-800 rounded-full text-xs font-medium shadow-2xs"
                      >
                        <CheckCircle2 className="w-3 h-3 text-[#ea580c]" />
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
                      placeholder="Add key feature (e.g. UK Store Till Slip, Factory Sealed Packaging, Active Noise Cancelling)..."
                      value={featureInput}
                      onChange={(e) => setFeatureInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddFeature();
                        }
                      }}
                      className="flex-1 bg-white border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-[#ea580c]"
                    />
                    <button
                      type="button"
                      onClick={handleAddFeature}
                      disabled={!featureInput.trim()}
                      className="px-3.5 py-2 bg-[#ea580c] hover:bg-orange-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Add Feature
                    </button>
                  </div>
                </div>

                {/* 6. What's in the Box Section */}
                <div className="bg-gray-50/60 border border-gray-200/80 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Box className="w-3.5 h-3.5 text-[#ea580c]" />
                      What's in the Box
                    </h5>
                    <span className="text-[11px] text-gray-400">{formData.inTheBox.length} items</span>
                  </div>

                  {/* Box Items List */}
                  <div className="flex flex-wrap gap-1.5">
                    {formData.inTheBox.map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 text-gray-800 rounded-lg text-xs font-medium shadow-2xs"
                      >
                        <Box className="w-3 h-3 text-[#ea580c]" />
                        {item}
                        <button
                          type="button"
                          onClick={() => handleRemoveInclusion(idx)}
                          className="text-gray-400 hover:text-red-500 ml-0.5 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Add In the Box Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add item in the box (e.g. Original UK Retail Store Till Slip, UK Power Adapter, USB-C Cable)..."
                      value={inclusionInput}
                      onChange={(e) => setInclusionInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddInclusion();
                        }
                      }}
                      className="flex-1 bg-white border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-[#ea580c]"
                    />
                    <button
                      type="button"
                      onClick={handleAddInclusion}
                      disabled={!inclusionInput.trim()}
                      className="px-3.5 py-2 bg-[#ea580c] hover:bg-orange-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Add Box Item
                    </button>
                  </div>
                </div>

                {/* 7. Size Variations (Apparel & Footwear Small Squares) */}
                <div className="bg-gray-50/60 border border-gray-200/80 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                      Size Variations & Small Squares
                    </span>
                    {(formData.isGarment || formData.isFootwear) && (
                      <span className="text-[11px] font-bold text-[#ea580c] bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                        {formData.sizes.length} Sizes Active
                      </span>
                    )}
                  </div>

                  {/* Dual Toggles for Garment and Footwear */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <label className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer select-none transition-all ${
                      formData.isGarment ? 'bg-orange-50/80 border-[#ea580c] text-orange-950 font-bold' : 'bg-white border-gray-200 text-gray-700'
                    }`}>
                      <input
                        type="checkbox"
                        checked={formData.isGarment}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData(prev => ({
                            ...prev,
                            isGarment: checked,
                            sizes: checked && prev.sizes.length === 0 ? ['S', 'M', 'L', 'XL'] : prev.sizes
                          }));
                        }}
                        className="w-4 h-4 text-[#ea580c] rounded border-gray-300 focus:ring-[#ea580c]"
                      />
                      <Shirt className="w-4 h-4 text-[#ea580c] shrink-0" />
                      <span className="text-xs">Garment / Apparel Sizes</span>
                    </label>

                    <label className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer select-none transition-all ${
                      formData.isFootwear ? 'bg-orange-50/80 border-[#ea580c] text-orange-950 font-bold' : 'bg-white border-gray-200 text-gray-700'
                    }`}>
                      <input
                        type="checkbox"
                        checked={formData.isFootwear}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData(prev => ({
                            ...prev,
                            isFootwear: checked,
                            sizes: checked && prev.sizes.length === 0 ? ['UK 7', 'UK 8', 'UK 9', 'UK 10'] : prev.sizes
                          }));
                        }}
                        className="w-4 h-4 text-[#ea580c] rounded border-gray-300 focus:ring-[#ea580c]"
                      />
                      <Footprints className="w-4 h-4 text-[#ea580c] shrink-0" />
                      <span className="text-xs">Footwear / Shoe Sizes</span>
                    </label>
                  </div>

                  {formData.isGarment || formData.isFootwear ? (
                    <div className="space-y-3 pt-2 border-t border-gray-200/60">
                      <p className="text-[11px] text-gray-500">
                        Toggle quick size squares below or add custom sizes. Active sizes display as small selectable squares for customers:
                      </p>

                      {/* Small Squares Display / Active Size Variations */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          Active Size Squares:
                        </span>
                        <div className="flex flex-wrap gap-2 items-center">
                          {formData.sizes.length === 0 ? (
                            <span className="text-xs text-amber-600 font-medium italic">
                              No sizes selected yet. Click quick size squares below or add custom sizes.
                            </span>
                          ) : (
                            formData.sizes.map((sz) => (
                              <div
                                key={sz}
                                className="group relative min-w-8 h-8 px-2 rounded-lg bg-[#ea580c] text-white border border-orange-700 font-black text-xs font-mono flex items-center justify-center shadow-xs select-none transition-transform hover:scale-105"
                              >
                                {sz}
                                <button
                                  type="button"
                                  onClick={() => setFormData(prev => ({ ...prev, sizes: prev.sizes.filter(s => s !== sz) }))}
                                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm"
                                  title={`Remove size ${sz}`}
                                >
                                  ×
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Standard Garment Size Presets */}
                      {formData.isGarment && (
                        <div className="space-y-2 pt-1 border-t border-gray-100">
                          {/* Trouser & Pants Waist Sizes 28 to 36 */}
                          <div className="space-y-1 bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/80">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1">
                                👖 Trouser & Pants Sizes (Waist 28 to 36):
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const trouserSizes = ['28', '29', '30', '31', '32', '33', '34', '35', '36'];
                                  const newSizes = Array.from(new Set([...formData.sizes, ...trouserSizes]));
                                  setFormData(prev => ({ ...prev, sizes: newSizes }));
                                }}
                                className="text-[10px] font-bold text-orange-800 hover:text-orange-950 underline cursor-pointer"
                              >
                                + Select All Trousers (28–36)
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {['28', '29', '30', '31', '32', '33', '34', '35', '36'].map((sz) => {
                                const isSelected = formData.sizes.includes(sz);
                                return (
                                  <button
                                    key={sz}
                                    type="button"
                                    onClick={() => {
                                      if (isSelected) {
                                        setFormData(prev => ({ ...prev, sizes: prev.sizes.filter(s => s !== sz) }));
                                      } else {
                                        setFormData(prev => ({ ...prev, sizes: [...prev.sizes, sz] }));
                                      }
                                    }}
                                    className={`w-7 h-7 rounded-md font-mono font-bold text-[11px] flex items-center justify-center border transition-all cursor-pointer ${
                                      isSelected
                                        ? 'bg-[#ea580c] text-white border-orange-700 shadow-xs'
                                        : 'bg-white text-gray-700 border-gray-200 hover:border-[#ea580c] hover:text-[#ea580c]'
                                    }`}
                                  >
                                    {sz}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Standard Apparel Sizes */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                              <Shirt className="w-3 h-3 text-[#ea580c]" />
                              Standard Apparel Sizes:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'].map((presetSize) => {
                                const isSelected = formData.sizes.includes(presetSize);
                                return (
                                  <button
                                    key={presetSize}
                                    type="button"
                                    onClick={() => {
                                      if (isSelected) {
                                        setFormData(prev => ({ ...prev, sizes: prev.sizes.filter(s => s !== presetSize) }));
                                      } else {
                                        setFormData(prev => ({ ...prev, sizes: [...prev.sizes, presetSize] }));
                                      }
                                    }}
                                    className={`w-7 h-7 rounded-md font-mono font-bold text-[11px] flex items-center justify-center border transition-all cursor-pointer ${
                                      isSelected
                                        ? 'bg-[#ea580c] text-white border-orange-700 shadow-xs'
                                        : 'bg-white text-gray-700 border-gray-200 hover:border-[#ea580c] hover:text-[#ea580c]'
                                    }`}
                                  >
                                    {presetSize}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* UK Dress Sizes */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                              UK Dress / Women Sizes:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {['UK 6', 'UK 8', 'UK 10', 'UK 12', 'UK 14', 'UK 16', 'UK 18'].map((presetSize) => {
                                const isSelected = formData.sizes.includes(presetSize);
                                return (
                                  <button
                                    key={presetSize}
                                    type="button"
                                    onClick={() => {
                                      if (isSelected) {
                                        setFormData(prev => ({ ...prev, sizes: prev.sizes.filter(s => s !== presetSize) }));
                                      } else {
                                        setFormData(prev => ({ ...prev, sizes: [...prev.sizes, presetSize] }));
                                      }
                                    }}
                                    className={`px-1.5 h-7 min-w-[28px] rounded-md font-mono font-bold text-[10px] flex items-center justify-center border transition-all cursor-pointer ${
                                      isSelected
                                        ? 'bg-[#ea580c] text-white border-orange-700 shadow-xs'
                                        : 'bg-white text-gray-700 border-gray-200 hover:border-[#ea580c] hover:text-[#ea580c]'
                                    }`}
                                  >
                                    {presetSize}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Standard Footwear Size Presets */}
                      {formData.isFootwear && (
                        <div className="space-y-2.5 pt-1 border-t border-gray-100">
                          {/* UK Shoe Sizes */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                                <Footprints className="w-3 h-3 text-[#ea580c]" />
                                UK Shoe Sizes:
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const ukStd = ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11'];
                                  const newSizes = Array.from(new Set([...formData.sizes, ...ukStd]));
                                  setFormData(prev => ({ ...prev, sizes: newSizes }));
                                }}
                                className="text-[10px] font-bold text-orange-800 hover:text-orange-950 underline cursor-pointer"
                              >
                                + Add UK 6–11
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {['UK 3', 'UK 3.5', 'UK 4', 'UK 4.5', 'UK 5', 'UK 5.5', 'UK 6', 'UK 6.5', 'UK 7', 'UK 7.5', 'UK 8', 'UK 8.5', 'UK 9', 'UK 9.5', 'UK 10', 'UK 10.5', 'UK 11', 'UK 11.5', 'UK 12', 'UK 13'].map((shoeSize) => {
                                const isSelected = formData.sizes.includes(shoeSize);
                                return (
                                  <button
                                    key={shoeSize}
                                    type="button"
                                    onClick={() => {
                                      if (isSelected) {
                                        setFormData(prev => ({ ...prev, sizes: prev.sizes.filter(s => s !== shoeSize) }));
                                      } else {
                                        setFormData(prev => ({ ...prev, sizes: [...prev.sizes, shoeSize] }));
                                      }
                                    }}
                                    className={`px-1.5 h-7 min-w-[28px] rounded-md font-mono font-bold text-[10px] flex items-center justify-center border transition-all cursor-pointer ${
                                      isSelected
                                        ? 'bg-[#ea580c] text-white border-orange-700 shadow-xs'
                                        : 'bg-white text-gray-700 border-gray-200 hover:border-[#ea580c] hover:text-[#ea580c]'
                                    }`}
                                  >
                                    {shoeSize}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* EUR Shoe Sizes */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                                <Footprints className="w-3 h-3 text-[#ea580c]" />
                                EUR Shoe Sizes:
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const eurStd = ['EUR 39', 'EUR 40', 'EUR 41', 'EUR 42', 'EUR 43', 'EUR 44', 'EUR 45'];
                                  const newSizes = Array.from(new Set([...formData.sizes, ...eurStd]));
                                  setFormData(prev => ({ ...prev, sizes: newSizes }));
                                }}
                                className="text-[10px] font-bold text-orange-800 hover:text-orange-950 underline cursor-pointer"
                              >
                                + Add EUR 39–45
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {['EUR 36', 'EUR 37', 'EUR 38', 'EUR 39', 'EUR 40', 'EUR 41', 'EUR 42', 'EUR 43', 'EUR 44', 'EUR 45', 'EUR 46', 'EUR 47', 'EUR 48'].map((shoeSize) => {
                                const isSelected = formData.sizes.includes(shoeSize);
                                return (
                                  <button
                                    key={shoeSize}
                                    type="button"
                                    onClick={() => {
                                      if (isSelected) {
                                        setFormData(prev => ({ ...prev, sizes: prev.sizes.filter(s => s !== shoeSize) }));
                                      } else {
                                        setFormData(prev => ({ ...prev, sizes: [...prev.sizes, shoeSize] }));
                                      }
                                    }}
                                    className={`px-1.5 h-7 min-w-[28px] rounded-md font-mono font-bold text-[10px] flex items-center justify-center border transition-all cursor-pointer ${
                                      isSelected
                                        ? 'bg-[#ea580c] text-white border-orange-700 shadow-xs'
                                        : 'bg-white text-gray-700 border-gray-200 hover:border-[#ea580c] hover:text-[#ea580c]'
                                    }`}
                                  >
                                    {shoeSize}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Dual UK & EUR Shoe Sizes */}
                          <div className="space-y-1 bg-orange-50/50 p-2.5 rounded-lg border border-orange-100">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-orange-950 uppercase tracking-wider">
                                Dual UK & EUR Shoe Sizes:
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const dualStd = ['UK 6 / EUR 40', 'UK 7 / EUR 41', 'UK 8 / EUR 42', 'UK 9 / EUR 43', 'UK 10 / EUR 44', 'UK 11 / EUR 45'];
                                  const newSizes = Array.from(new Set([...formData.sizes, ...dualStd]));
                                  setFormData(prev => ({ ...prev, sizes: newSizes }));
                                }}
                                className="text-[10px] font-bold text-orange-800 hover:text-orange-950 underline cursor-pointer"
                              >
                                + Add All Dual
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {['UK 6 / EUR 40', 'UK 7 / EUR 41', 'UK 8 / EUR 42', 'UK 9 / EUR 43', 'UK 10 / EUR 44', 'UK 11 / EUR 45', 'UK 12 / EUR 46'].map((shoeSize) => {
                                const isSelected = formData.sizes.includes(shoeSize);
                                return (
                                  <button
                                    key={shoeSize}
                                    type="button"
                                    onClick={() => {
                                      if (isSelected) {
                                        setFormData(prev => ({ ...prev, sizes: prev.sizes.filter(s => s !== shoeSize) }));
                                      } else {
                                        setFormData(prev => ({ ...prev, sizes: [...prev.sizes, shoeSize] }));
                                      }
                                    }}
                                    className={`px-2 h-7 rounded-md font-mono font-bold text-[10px] flex items-center justify-center border transition-all cursor-pointer ${
                                      isSelected
                                        ? 'bg-[#ea580c] text-white border-orange-700 shadow-xs'
                                        : 'bg-white text-gray-700 border-gray-200 hover:border-[#ea580c] hover:text-[#ea580c]'
                                    }`}
                                  >
                                    {shoeSize}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Custom Size Input */}
                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          placeholder="Add custom size (e.g. 42R, 4-5 Yrs, US 10.5)..."
                          value={customSizeInput}
                          onChange={(e) => setCustomSizeInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomSize();
                            }
                          }}
                          className="flex-1 bg-white border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-[#ea580c]"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomSize}
                          disabled={!customSizeInput.trim()}
                          className="px-3.5 py-2 bg-[#ea580c] hover:bg-orange-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          Add Size Square
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400">
                      Check either box above if this item has garment apparel sizes or footwear shoe sizes.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* PRE-ORDER SOURCING PARAMETERS & FLIGHT TIMELINE */}
            <div className="bg-orange-50/50 border border-orange-200/80 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-orange-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#ea580c]" />
                  Customer Sourcing Status & Timeline
                </h5>
                <button
                  type="button"
                  onClick={() => setShowAddCustomStatusModal(true)}
                  className="text-[11px] font-bold text-[#ea580c] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  + Add Custom Status
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Pre-Order Sourcing Status (Visible to Customer) *
                </label>
                <select
                  value={formData.preOrderStatus}
                  onChange={(e) => setFormData({ ...formData, preOrderStatus: e.target.value as PreOrderStatus })}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs font-bold text-gray-800 outline-none focus:border-[#ea580c]"
                >
                  {allStatusOptions.map((opt) => (
                    <option key={opt.status} value={opt.status}>
                      {opt.icon} {opt.label} — {opt.desc}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700">Estimated Arrival Date *</label>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        const day = String(now.getDate()).padStart(2, '0');
                        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        const month = months[now.getMonth()];
                        const year = now.getFullYear();
                        setFormData((prev) => ({ ...prev, preOrderEstimatedArrival: `${day} ${month} ${year}` }));
                      }}
                      className="text-[10px] font-bold text-[#ea580c] hover:underline cursor-pointer"
                      title="Set estimated arrival date to today"
                    >
                      ⚡ Set Today
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 28 Sep 2026 or Early October 2026"
                    value={formData.preOrderEstimatedArrival}
                    onChange={(e) => setFormData({ ...formData, preOrderEstimatedArrival: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-[#ea580c]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Stock Quantity (Units) *</label>
                  <input
                    type="number"
                    min={1}
                    max={5000}
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-mono outline-none focus:border-[#ea580c]"
                    placeholder="Available units in batch..."
                  />
                </div>
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
                className="px-5 py-2.5 bg-[#ea580c] text-white rounded-lg text-xs font-bold hover:bg-orange-700 transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
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
      {/* ADD CUSTOM PRE-ORDER STATUS MODAL */}
      {showAddCustomStatusModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowAddCustomStatusModal(false)}
          title="Add Custom Pre-Order Sourcing Status"
          maxWidth="md"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newStatusInput.trim()) return;
              const statusObj = {
                status: newStatusInput.trim(),
                label: newStatusInput.trim(),
                desc: newStatusDescInput.trim() || 'Custom London procurement & flight stage',
                color: 'bg-purple-50 text-purple-700 border-purple-200',
                icon: newStatusIconInput || '✈️'
              };
              const updatedList = saveCustomPreOrderStatus(statusObj);
              setAllStatusOptions(updatedList);
              setFormData((prev) => ({ ...prev, preOrderStatus: statusObj.status }));
              setNewStatusInput('');
              setNewStatusDescInput('');
              setShowAddCustomStatusModal(false);
              showToast(`Custom pre-order status "${statusObj.label}" added successfully!`);
            }}
            className="space-y-4 text-left p-1"
          >
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-900 leading-relaxed">
              <p className="font-bold flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-[#ea580c]" />
                Define a New Pipeline Milestone
              </p>
              <p className="text-orange-800 mt-0.5">
                Create new tracking statuses for London sourcing, customs, cargo, or arrival stages. Customers and admins will see this status across the store.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Status Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Sourced at Harrods London, Sorting in Heathrow Hub..."
                value={newStatusInput}
                onChange={(e) => setNewStatusInput(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs outline-none focus:border-[#ea580c]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Description / Customer Tooltip</label>
              <input
                type="text"
                placeholder="e.g. Item procured in London flagship, packaging verified"
                value={newStatusDescInput}
                onChange={(e) => setNewStatusDescInput(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs outline-none focus:border-[#ea580c]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowAddCustomStatusModal(false)}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#ea580c] hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                Save & Use Status
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
