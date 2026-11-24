import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Star } from 'lucide-react';
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
    <div className="group flex flex-col justify-between rounded-md border border-zinc-200 bg-white overflow-hidden hover:border-zinc-300 transition-colors">
      <div>
        <Link to={`/products/${product.slug}`} className="relative block aspect-[4/3] bg-surface overflow-hidden">
          {product.primaryImageUrl ? (
            <img
              src={product.primaryImageUrl}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
              No image
            </div>
          )}

          {hasDiscount && (
            <span className="absolute left-2.5 top-2.5 rounded bg-navy px-2 py-0.5 text-[11px] font-medium text-white">
              -{discountPct}%
            </span>
          )}

          <button
            type="button"
            onClick={handleWishlist}
            aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
            className={`absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full border bg-white/95 transition-colors ${
              isSaved
                ? 'border-red-200 text-red-600'
                : 'border-zinc-200 text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </Link>

        <div className="p-4">
          <div className="flex items-center justify-between gap-2 text-xs text-zinc-500">
            <span className="truncate">{product.categoryName}</span>
            {product.reviewCount > 0 && (
              <span className="inline-flex items-center gap-1 text-zinc-700 shrink-0">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {Number(product.averageRating).toFixed(1)} ({product.reviewCount})
              </span>
            )}
          </div>

          <Link
            to={`/products/${product.slug}`}
            className="mt-1.5 block text-sm font-semibold text-zinc-900 hover:text-navy line-clamp-1"
          >
            {product.name}
          </Link>

          {product.shortDescription && (
            <p className="mt-1 text-xs text-zinc-500 line-clamp-2 min-h-[2rem]">
              {product.shortDescription}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-zinc-100 px-4 py-3">
        <div>
          <div className="flex items-baseline gap-1.5">
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
            <span className="text-[11px] font-medium text-red-600">Out of stock</span>
          ) : product.stockQuantity <= product.lowStockThreshold ? (
            <span className="text-[11px] font-medium text-amber-700">
              Only {product.stockQuantity} left
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={!product.inStock || adding}
          className="inline-flex items-center gap-1.5 rounded-md bg-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-navy-800 disabled:bg-zinc-200 disabled:text-zinc-500 disabled:cursor-not-allowed transition-colors"
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          {adding ? 'Adding' : product.inStock ? 'Add' : 'Sold out'}
        </button>
      </div>
    </div>
  );
}
