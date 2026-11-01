import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ShoppingBag, Sparkles } from 'lucide-react';
import { formatPKR } from '../utils/currency';
import { productImageUrl } from '../lib/productImage';
import { buildProductPath } from '../utils/urls';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

export default function CompleteTheLookBundle({ currentProduct, recommendations = [] }) {
  const { addToCart } = useCart();
  const companion = recommendations && recommendations.length > 0 ? recommendations[0] : null;

  const [includeCompanion, setIncludeCompanion] = useState(true);
  const [adding, setAdding] = useState(false);

  if (!currentProduct || !companion || !currentProduct.inStock) {
    return null;
  }

  const currentPrice = Number(currentProduct.price) || 0;
  const companionPrice = Number(companion.price) || 0;

  const rawTotal = currentPrice + (includeCompanion ? companionPrice : 0);
  // 10% Bundle Discount if both selected
  const bundleDiscount = includeCompanion ? Math.round(rawTotal * 0.1) : 0;
  const finalTotal = rawTotal - bundleDiscount;

  const handleAddBundle = async () => {
    try {
      setAdding(true);
      await addToCart(currentProduct, 1);
      if (includeCompanion && companion.inStock !== false) {
        await addToCart(companion, 1);
      }
      toast.success(
        includeCompanion
          ? '🎉 Complete the Look Bundle added to your cart with discount!'
          : 'Product added to cart!'
      );
    } catch (e) {
      toast.error('Could not add bundle to cart');
    } finally {
      setAdding(false);
    }
  };

  return (
    <section className="complete-the-look-bundle my-8 p-5 bg-gradient-to-r from-orange-50/70 via-white to-amber-50/60 rounded-2xl border border-orange-200/80 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-orange-600 animate-pulse" />
        <h3 className="text-lg font-bold text-neutral-900 tracking-tight">
          Complete the Look / Perfect Pair
        </h3>
        <span className="ml-auto text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-600 text-white">
          Save 10% on Bundle
        </span>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-6 justify-between">
        {/* Visual Pair */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
          {/* Main Item */}
          <div className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-neutral-200 shadow-xs max-w-[260px]">
            <img
              src={productImageUrl(currentProduct)}
              alt={currentProduct.name}
              className="w-16 h-16 object-cover rounded-lg bg-neutral-100 flex-shrink-0"
            />
            <div className="min-w-0">
              <span className="text-xs font-semibold text-orange-600 uppercase tracking-wide">This Item</span>
              <div className="text-xs font-medium text-neutral-800 line-clamp-2 leading-snug">{currentProduct.name}</div>
              <div className="text-sm font-bold text-neutral-900 mt-0.5">{formatPKR(currentPrice)}</div>
            </div>
          </div>

          <div className="bg-orange-100 text-orange-700 p-1.5 rounded-full">
            <Plus size={18} strokeWidth={2.5} />
          </div>

          {/* Companion Item */}
          <div className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all max-w-[260px] ${includeCompanion ? 'bg-white border-orange-300 shadow-xs ring-1 ring-orange-200' : 'bg-neutral-50/70 border-neutral-200 opacity-60'}`}>
            <img
              src={productImageUrl(companion)}
              alt={companion.name}
              className="w-16 h-16 object-cover rounded-lg bg-neutral-100 flex-shrink-0"
            />
            <div className="min-w-0">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Matching Pair</span>
              <Link to={buildProductPath(companion)} className="text-xs font-medium text-neutral-800 line-clamp-2 leading-snug hover:text-orange-600">
                {companion.name}
              </Link>
              <div className="text-sm font-bold text-neutral-900 mt-0.5">{formatPKR(companionPrice)}</div>
            </div>
          </div>
        </div>

        {/* Action & Total Card */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-center sm:items-end justify-between w-full lg:w-auto gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-orange-100">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-neutral-600">
            <input
              type="checkbox"
              checked={includeCompanion}
              onChange={(e) => setIncludeCompanion(e.target.checked)}
              className="rounded text-orange-600 focus:ring-orange-500 h-4 w-4"
            />
            <span>Include matching pair for bundle discount</span>
          </label>

          <div className="flex items-center gap-4">
            <div className="text-right">
              {bundleDiscount > 0 && (
                <div className="text-xs line-through text-neutral-400 font-medium">
                  {formatPKR(rawTotal)}
                </div>
              )}
              <div className="text-xl font-extrabold text-neutral-900 leading-tight">
                {formatPKR(finalTotal)}
              </div>
            </div>

            <button
              type="button"
              disabled={adding}
              onClick={handleAddBundle}
              className="btn btn-primary px-5 py-2.5 rounded-xl font-bold inline-flex items-center gap-2 shadow-sm hover:shadow-md transition-all"
            >
              <ShoppingBag size={17} />
              {adding ? 'Adding Bundle…' : includeCompanion ? 'Add Both to Cart' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

