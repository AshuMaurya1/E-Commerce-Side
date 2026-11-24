import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Plus, Star } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export function ProductCard({ product }) {
  const { isAuthenticated } = useAuth();
  const { addToCart, toggleWishlist, wishlistIds } = useCart();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);

  const isSaved = wishlistIds.has(product.id);
  const hasDiscount = product.discountPrice != null && Number(product.discountPrice) < Number(product.price);
  const discountPct = hasDiscount
    ? Math.round(((Number(product.price) - Number(product.discountPrice)) / Number(product.price)) * 100)
    : 0;

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setAdding(true);
    await addToCart(product.id, 1);
    setAdding(false);
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    await toggleWishlist(product.id);
  };

  return (
    <article className="group flex flex-col justify-between">
      <div>
        <div className="relative aspect-[4/5] bg-surface overflow-hidden rounded-sm border border-zinc-200/80">
          <Link to={`/products/${product.slug}`} className="block h-full w-full">
            {product.primaryImageUrl ? (
              <img
                src={product.primaryImageUrl}
                alt={product.name}
                loading="lazy"
                className="h-full w-full object-cover transition-opacity duration-200 group-hover:opacity-95"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
                No image
              </div>
            )}
          </Link>

          {hasDiscount && (
            <span className="tabular-nums pointer-events-none absolute left-2.5 top-2.5 bg-white/95 px-2 py-0.5 text-[11px] font-medium text-navy border border-zinc-200">
              -{discountPct}%
            </span>
          )}

          <button
            type="button"
            onClick={handleWishlist}
            aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
            className={`absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-sm bg-white/90 border border-zinc-200/80 transition-colors ${
              isSaved ? 'text-red-600' : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} strokeWidth={1.75} />
          </button>
        </div>

        <div className="pt-3 space-y-1">
          <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-wider text-zinc-500">
            <span className="truncate">{product.categoryName}</span>
            {product.reviewCount > 0 && (
              <span className="tabular-nums inline-flex items-center gap-1 text-zinc-700 normal-case tracking-normal shrink-0">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {Number(product.averageRating).toFixed(1)}
              </span>
            )}
          </div>

          <Link
            to={`/products/${product.slug}`}
            className="block text-sm font-medium text-zinc-900 hover:text-navy line-clamp-1"
          >
            {product.name}
          </Link>

          <div className="flex items-baseline justify-between gap-2 pt-0.5">
            <div className="tabular-nums flex items-baseline gap-2">
              <span className="text-sm font-semibold text-zinc-900">
                {formatCurrency(product.effectivePrice)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-zinc-400 line-through">
                  {formatCurrency(product.price)}
                </span>
              )}
            </div>

            {!product.inStock ? (
              <span className="text-[11px] font-medium text-red-600">Sold out</span>
            ) : product.stockQuantity <= product.lowStockThreshold ? (
              <span className="text-[11px] font-medium text-amber-700">
                {product.stockQuantity} left
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={!product.inStock || adding}
        className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-sm border border-zinc-300 bg-white py-2 text-xs font-medium text-zinc-900 hover:border-navy hover:bg-navy hover:text-white disabled:border-zinc-200 disabled:bg-surface disabled:text-zinc-400 disabled:cursor-not-allowed transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        {adding ? 'Adding...' : product.inStock ? 'Add to bag' : 'Out of stock'}
      </button>
    </article>
  );
}
