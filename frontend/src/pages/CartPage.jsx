import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Tag, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { extractErrorMessage, formatCurrency } from '../utils/format';
import { EmptyState } from '../components/EmptyState';

export function CartPage() {
  const { isAuthenticated } = useAuth();
  const { cart, cartLoading, updateQuantity, removeFromCart, applyCoupon, removeCoupon } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <EmptyState
          icon={ShoppingBag}
          title="Sign in to view your shopping cart"
          description="Your cart items and applied coupons sync securely to your account."
          actionLabel="Sign in"
          actionTo="/login"
        />
      </div>
    );
  }

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    try {
      await applyCoupon(couponCode.trim());
      toast.success('Coupon applied');
      setCouponCode('');
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Invalid coupon code'));
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      await removeCoupon();
      toast.info('Coupon removed');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const items = cart?.items || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="border-b border-zinc-200 pb-4 mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Shopping Cart</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{cart.totalItems || 0} items in your bag</p>
        </div>
        <Link to="/products" className="text-sm font-medium text-emerald-700 hover:underline">
          Continue shopping
        </Link>
      </div>

      {cartLoading && items.length === 0 ? (
        <div className="h-48 rounded-md border border-zinc-200 bg-white animate-pulse" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Browse our catalog to add products to your cart."
          actionLabel="Browse Products"
          actionTo="/products"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Items List */}
          <div className="lg:col-span-8 space-y-4">
            {cart.couponMessage && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
                {cart.couponMessage}
              </div>
            )}

            <div className="rounded-md border border-zinc-200 bg-white divide-y divide-zinc-200">
              {items.map((item) => (
                <div key={item.productId} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5">
                  <Link
                    to={`/products/${item.productSlug}`}
                    className="h-20 w-24 shrink-0 overflow-hidden rounded border border-zinc-200 bg-surface"
                  >
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-zinc-400">No img</div>
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/products/${item.productSlug}`}
                      className="text-sm font-semibold text-zinc-900 hover:text-navy line-clamp-1"
                    >
                      {item.productName}
                    </Link>
                    <p className="text-xs text-zinc-500 mt-0.5 font-mono">SKU: {item.sku}</p>
                    <div className="mt-1.5 flex items-baseline gap-2">
                      <span className="text-sm font-medium text-zinc-900">
                        {formatCurrency(item.unitPrice)}
                      </span>
                      {Number(item.originalPrice) > Number(item.unitPrice) && (
                        <span className="text-xs text-zinc-400 line-through">
                          {formatCurrency(item.originalPrice)}
                        </span>
                      )}
                    </div>
                    {!item.inStock && (
                      <p className="mt-1 text-xs font-medium text-red-600">
                        Only {item.stockQuantity} currently in stock
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="inline-flex items-center rounded border border-zinc-300 bg-white">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="p-1.5 text-zinc-600 hover:text-zinc-900"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= item.stockQuantity}
                        className="p-1.5 text-zinc-600 hover:text-zinc-900 disabled:opacity-40"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="w-24 text-right text-sm font-semibold text-zinc-900">
                      {formatCurrency(item.lineTotal)}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.productId)}
                      className="text-zinc-400 hover:text-red-600"
                      aria-label={`Remove ${item.productName}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-4">
            <div className="rounded-md border border-zinc-200 bg-white p-5 space-y-5 sticky top-24">
              <h2 className="text-base font-semibold text-navy">Order Summary</h2>

              {/* Coupon */}
              {cart.appliedCouponCode ? (
                <div className="flex items-center justify-between rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
                  <span className="inline-flex items-center gap-1.5 font-medium text-emerald-800">
                    <Tag className="h-4 w-4" />
                    {cart.appliedCouponCode} applied
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-emerald-700 hover:text-emerald-900"
                    aria-label="Remove coupon"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Coupon code (e.g. WELCOME10)"
                    className="min-w-0 flex-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm uppercase focus:border-navy focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={applyingCoupon || !couponCode.trim()}
                    className="rounded-md border border-zinc-300 bg-surface px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-200 disabled:opacity-50"
                  >
                    Apply
                  </button>
                </form>
              )}

              <dl className="space-y-2.5 text-sm border-t border-zinc-100 pt-4">
                <div className="flex justify-between text-zinc-600">
                  <dt>Subtotal</dt>
                  <dd className="font-medium text-zinc-900">{formatCurrency(cart.subtotal)}</dd>
                </div>
                {Number(cart.discountAmount) > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <dt>Discount</dt>
                    <dd>-{formatCurrency(cart.discountAmount)}</dd>
                  </div>
                )}
                <div className="flex justify-between text-zinc-600">
                  <dt>Shipping</dt>
                  <dd className="font-medium text-zinc-900">
                    {Number(cart.shippingFee) === 0 ? 'Free' : formatCurrency(cart.shippingFee)}
                  </dd>
                </div>
                {Number(cart.amountToFreeShipping) > 0 && (
                  <p className="text-xs text-zinc-500">
                    Add {formatCurrency(cart.amountToFreeShipping)} more for free shipping.
                  </p>
                )}
                <div className="flex justify-between border-t border-zinc-200 pt-3 text-base font-semibold text-navy">
                  <dt>Total</dt>
                  <dd>{formatCurrency(cart.totalAmount)}</dd>
                </div>
              </dl>

              <button
                type="button"
                onClick={() => navigate('/checkout')}
                className="w-full rounded-md bg-navy py-2.5 text-sm font-medium text-white hover:bg-navy-800 transition-colors"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
