import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { catalogService } from '../services/catalogService';
import { useToast } from '../context/ToastContext';
import { extractErrorMessage } from '../utils/format';

export function Footer() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const res = await catalogService.subscribeNewsletter(email.trim());
      toast.success(res.message || 'Subscribed to ShopSphere updates');
      setEmail('');
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Could not subscribe right now'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="border-t border-zinc-200 bg-white mt-20">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-navy text-white text-[11px] font-semibold">
                S
              </span>
              <span className="text-sm font-semibold tracking-tight text-navy">ShopSphere</span>
            </div>
            <p className="text-sm text-zinc-600 leading-relaxed max-w-xs">
              Everyday objects across audio, home, apparel, and carry — built with honest materials and straightforward pricing.
            </p>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900">Shop</h4>
            <ul className="mt-3.5 space-y-2.5 text-sm text-zinc-600">
              <li><Link to="/products" className="hover:text-navy transition-colors">All Products</Link></li>
              <li><Link to="/products?featured=true" className="hover:text-navy transition-colors">Featured Picks</Link></li>
              <li><Link to="/products?trending=true" className="hover:text-navy transition-colors">Trending Now</Link></li>
              <li><Link to="/products?sort=popularity" className="hover:text-navy transition-colors">Best Sellers</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900">Account</h4>
            <ul className="mt-3.5 space-y-2.5 text-sm text-zinc-600">
              <li><Link to="/account" className="hover:text-navy transition-colors">My Account</Link></li>
              <li><Link to="/account?tab=orders" className="hover:text-navy transition-colors">Order History</Link></li>
              <li><Link to="/account?tab=addresses" className="hover:text-navy transition-colors">Saved Addresses</Link></li>
              <li><Link to="/cart" className="hover:text-navy transition-colors">Shopping Cart</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900">Newsletter</h4>
            <p className="mt-3.5 text-sm text-zinc-600">
              Product restocks, seasonal releases, and subscriber offers.
            </p>
            <form onSubmit={handleSubscribe} className="mt-3.5 flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="Newsletter email"
                className="min-w-0 flex-1 rounded-sm border border-zinc-300 bg-warmwhite px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-navy focus:bg-white focus:outline-none"
              />
              <button
                type="submit"
                disabled={submitting}
                className="rounded-sm bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-50 transition-colors"
              >
                {submitting ? '...' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between border-t border-zinc-200 pt-6 text-xs text-zinc-500 gap-2">
          <p>&copy; {new Date().getFullYear()} ShopSphere Commerce. Free shipping on orders above ₹999.</p>
          <p>Verified Razorpay Test Mode &amp; Cash on Delivery</p>
        </div>
      </div>
    </footer>
  );
}
