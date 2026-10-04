import React, { useState } from 'react';
import { X, Minus, Plus, ShoppingBag, ArrowRight, AlertCircle, Check, Tag, Footprints, Shirt } from 'lucide-react';
import { Product, ProductVariation } from '../types';

interface ProductVariationModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (items: { variation: ProductVariation; quantity: number }[], shouldOpenCart: boolean) => void;
}

// Standard UK to EUR shoe size map for convenient reference and display
const UK_TO_EUR_SHOE_MAP: Record<string, string> = {
  'UK 3': 'EUR 36',
  'UK 3.5': 'EUR 36.5',
  'UK 4': 'EUR 37',
  'UK 4.5': 'EUR 37.5',
  'UK 5': 'EUR 38',
  'UK 5.5': 'EUR 38.5',
  'UK 6': 'EUR 40',
  'UK 6.5': 'EUR 40.5',
  'UK 7': 'EUR 41',
  'UK 7.5': 'EUR 41.5',
  'UK 8': 'EUR 42',
  'UK 8.5': 'EUR 42.5',
  'UK 9': 'EUR 43',
  'UK 9.5': 'EUR 43.5',
  'UK 10': 'EUR 44',
  'UK 10.5': 'EUR 44.5',
  'UK 11': 'EUR 45',
  'UK 11.5': 'EUR 45.5',
  'UK 12': 'EUR 46',
  'UK 13': 'EUR 48',
};

export const ProductVariationModal: React.FC<ProductVariationModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  // Map of variationId -> selected quantity
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [errorNotice, setErrorNotice] = useState<string>('');

  if (!isOpen) return null;

  // Format label for trouser waist sizes or shoe UK & EUR sizes
  const formatVariationDisplayName = (name: string, isTrouser: boolean, isShoe: boolean) => {
    const trimmed = name.trim();
    if (isTrouser) {
      const waistNumbers = ['28', '29', '30', '31', '32', '33', '34', '35', '36'];
      if (waistNumbers.includes(trimmed)) {
        return `Waist ${trimmed}" (Trouser Size)`;
      }
      if (trimmed.toLowerCase().startsWith('waist')) {
        return `${trimmed}"`;
      }
    }
    if (isShoe) {
      if (trimmed.includes('/') || (trimmed.includes('UK') && trimmed.includes('EUR'))) {
        return `${trimmed} (UK & EUR Sizing)`;
      }
      if (trimmed.startsWith('UK')) {
        const matchingEur = UK_TO_EUR_SHOE_MAP[trimmed];
        return matchingEur ? `${trimmed} / ${matchingEur}` : trimmed;
      }
    }
    return trimmed;
  };

  const isTrouserOrGarment = Boolean(
    product.isGarment ||
    product.title.toLowerCase().includes('trouser') ||
    product.title.toLowerCase().includes('pant') ||
    product.title.toLowerCase().includes('chino') ||
    (product.sizes && product.sizes.some((s) => ['28', '29', '30', '31', '32', '33', '34', '35', '36'].includes(s)))
  );

  const isFootwearOrShoe = Boolean(
    product.isFootwear ||
    product.title.toLowerCase().includes('shoe') ||
    product.title.toLowerCase().includes('boot') ||
    product.title.toLowerCase().includes('sneaker') ||
    (product.sizes && product.sizes.some((s) => s.includes('UK') || s.includes('EUR')))
  );

  const variations: ProductVariation[] = product.variations && product.variations.length > 0
    ? product.variations
    : (product.sizes && product.sizes.length > 0
      ? product.sizes.map((sz, idx) => ({
          id: `size-${idx}-${sz.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
          name: formatVariationDisplayName(sz, isTrouserOrGarment, isFootwearOrShoe),
          price: product.basePrice,
          originalPrice: product.originalPrice,
          stock: Math.max(1, Math.min(product.quantity, 10)),
          available: product.quantity > 0,
        }))
      : [
          {
            id: 'standard-default',
            name: 'Standard Option',
            price: product.basePrice,
            originalPrice: product.originalPrice,
            stock: product.quantity || 1,
            available: (product.quantity || 1) > 0,
          },
        ]);

  const handleDecrease = (variationId: string) => {
    setErrorNotice('');
    setQuantities((prev) => {
      const curr = prev[variationId] || 0;
      if (curr <= 1) {
        const next = { ...prev };
        delete next[variationId];
        return next;
      }
      return { ...prev, [variationId]: curr - 1 };
    });
  };

  const handleIncrease = (variation: ProductVariation) => {
    setErrorNotice('');
    if (!variation.available || variation.stock <= 0) return;

    setQuantities((prev) => {
      const curr = prev[variation.id] || 0;
      if (curr >= variation.stock) {
        setErrorNotice(`Maximum stock reached for "${variation.name}" (${variation.stock} units available).`);
        return prev;
      }
      return { ...prev, [variation.id]: curr + 1 };
    });
  };

  const totalSelectedCount = (Object.values(quantities) as number[]).reduce((a: number, b: number) => a + b, 0);

  const calculateSubtotal = (): number => {
    return (Object.entries(quantities) as [string, number][]).reduce((sum: number, [varId, qty]) => {
      const variation = variations.find((v) => v.id === varId);
      if (!variation) return sum;
      return sum + variation.price * Number(qty);
    }, 0);
  };

  const handleConfirm = (shouldOpenCart: boolean) => {
    if (totalSelectedCount === 0) {
      setErrorNotice('Please select a quantity for at least one variation before continuing.');
      return;
    }

    const payload: { variation: ProductVariation; quantity: number }[] = [];
    (Object.entries(quantities) as [string, number][]).forEach(([varId, qty]) => {
      const numericQty = Number(qty);
      if (numericQty > 0) {
        const variation = variations.find((v) => v.id === varId);
        if (variation) {
          payload.push({ variation, quantity: numericQty });
        }
      }
    });

    onAddToCart(payload, shouldOpenCart);
    onClose();
  };

  return (
    <div
      id="product-variation-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="product-variation-modal-dialog"
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-150 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-3.5 sm:p-5 border-b border-gray-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {product.images && product.images[0] ? (
              <img
                src={product.images[0]}
                alt={product.title}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover border border-gray-100 bg-gray-50 shrink-0"
              />
            ) : null}
            <div>
              <h2 className="text-sm sm:text-base font-bold text-gray-900 leading-tight">
                Please select a variation
              </h2>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 max-w-[200px] sm:max-w-xs">
                {product.title}
              </p>
            </div>
          </div>
          <button
            id="close-variation-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice/Error */}
        {errorNotice && (
          <div className="mx-5 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800 animate-in slide-in-from-top-1">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{errorNotice}</span>
          </div>
        )}

        {/* Quick Size Square Shortcuts for Trousers or Shoes */}
        {isTrouserOrGarment && (
          <div className="mx-5 mt-3 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                <Shirt className="w-3.5 h-3.5 text-amber-700" />
                Trouser Waist Sizes (28 to 36):
              </span>
              <span className="text-[10px] text-amber-800 font-medium">Tap square to select</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {variations.map((v) => {
                const qty = quantities[v.id] || 0;
                const isSelected = qty > 0;
                const numberMatch = v.name.match(/\b(2[8-9]|3[0-6])\b/);
                const shortLabel = numberMatch ? `W${numberMatch[0]}` : v.name;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        handleDecrease(v.id);
                      } else {
                        handleIncrease(v);
                      }
                    }}
                    className={`min-w-9 h-9 px-2 rounded-lg font-mono font-bold text-xs flex flex-col items-center justify-center border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#ea580c] text-white border-orange-700 shadow-sm ring-2 ring-orange-300'
                        : 'bg-white text-gray-800 border-gray-200 hover:border-[#ea580c] hover:text-[#ea580c]'
                    }`}
                  >
                    <span>{shortLabel}</span>
                    {isSelected && <span className="text-[8px] leading-none opacity-90">×{qty}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {isFootwearOrShoe && (
          <div className="mx-5 mt-3 p-3 bg-orange-50/70 border border-orange-200/80 rounded-xl space-y-2 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-orange-950 uppercase tracking-wide flex items-center gap-1.5">
                <Footprints className="w-3.5 h-3.5 text-[#ea580c]" />
                UK & EUR Shoe Sizing:
              </span>
              <span className="text-[10px] text-orange-800 font-medium">Tap square to select</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {variations.map((v) => {
                const qty = quantities[v.id] || 0;
                const isSelected = qty > 0;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        handleDecrease(v.id);
                      } else {
                        handleIncrease(v);
                      }
                    }}
                    className={`h-9 px-2.5 rounded-lg font-mono font-bold text-xs flex items-center gap-1.5 border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#ea580c] text-white border-orange-700 shadow-sm ring-2 ring-orange-300'
                        : 'bg-white text-gray-800 border-gray-200 hover:border-[#ea580c] hover:text-[#ea580c]'
                    }`}
                  >
                    <span>{v.name.replace(' (UK & EUR Sizing)', '').replace(' (Trouser Size)', '')}</span>
                    {isSelected && <span className="text-[10px] bg-white/20 px-1 py-0.5 rounded leading-none">×{qty}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Variations List */}
        <div className="p-5 overflow-y-auto space-y-3 divide-y divide-gray-100/80">
          {variations.map((variation) => {
            const isUnavailable = !variation.available || variation.stock <= 0;
            const currentQty = quantities[variation.id] || 0;
            const isMaxReached = currentQty >= variation.stock;

            return (
              <div
                key={variation.id}
                className={`pt-3 first:pt-0 flex items-center justify-between gap-3 ${
                  isUnavailable ? 'opacity-60 bg-gray-50/50 p-2 rounded-xl' : ''
                }`}
              >
                {/* Variation Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-gray-900">
                      {variation.name}
                    </span>
                    {/* Stock Badges */}
                    {isUnavailable ? (
                      <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full border border-gray-200">
                        Currently unavailable
                      </span>
                    ) : variation.stock === 1 ? (
                      <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                        Only 1 left
                      </span>
                    ) : variation.stock <= 5 ? (
                      <span className="text-[10px] font-semibold bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full border border-orange-200">
                        Few units left
                      </span>
                    ) : null}
                  </div>

                  {/* Price & Original Price */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-gray-900 font-mono">
                      UGX {new Intl.NumberFormat('en-UG').format(variation.price)}
                    </span>
                    {variation.originalPrice && variation.originalPrice > variation.price && (
                      <span className="text-[11px] text-gray-400 line-through font-mono">
                        UGX {new Intl.NumberFormat('en-UG').format(variation.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantity Controls [ - ] 0 [ + ] */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={isUnavailable || currentQty === 0}
                    onClick={() => handleDecrease(variation.id)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-colors cursor-pointer ${
                      isUnavailable || currentQty === 0
                        ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95'
                    }`}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <div className="w-8 text-center text-xs font-bold text-gray-900 font-mono">
                    {currentQty}
                  </div>

                  <button
                    type="button"
                    disabled={isUnavailable || isMaxReached}
                    onClick={() => handleIncrease(variation)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-colors cursor-pointer ${
                      isUnavailable || isMaxReached
                        ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                        : 'bg-[#f97316] hover:bg-[#ea580c] text-white shadow-xs active:scale-95'
                    }`}
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Summary & Action Buttons */}
        <div className="p-3.5 sm:p-5 border-t border-gray-100 bg-gray-50/70 space-y-3 sticky bottom-0">
          <div className="flex items-center justify-between text-xs text-gray-600 font-medium">
            <span>Selected Items: <strong className="text-gray-900">{totalSelectedCount}</strong></span>
            <span>
              Total:{' '}
              <strong className="text-gray-900 font-mono text-sm">
                UGX {new Intl.NumberFormat('en-UG').format(calculateSubtotal())}
              </strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <button
              id="variation-continue-shopping-btn"
              type="button"
              disabled={totalSelectedCount === 0}
              onClick={() => handleConfirm(false)}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                totalSelectedCount === 0
                  ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100 active:scale-98 shadow-2xs'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              Continue Shopping
            </button>

            <button
              id="variation-go-to-cart-btn"
              type="button"
              disabled={totalSelectedCount === 0}
              onClick={() => handleConfirm(true)}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                totalSelectedCount === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-[#f97316] hover:bg-[#ea580c] text-white active:scale-98'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Go to Cart
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
