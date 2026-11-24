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
    <footer className="border-t border-zinc-200 bg-white mt-16">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-navy text-white text-xs font-semibold">
                S
              </span>
              <span className="text-base font-semibold text-navy">ShopSphere</span>
            </div>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Curated everyday tech, home goods, and carry essentials built for durability and clean utility.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900">Catalog</h4>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600">
              <li><Link to="/products" className="hover:text-navy">All Products</Link></li>
              <li><Link to="/products?featured=true" className="hover:text-navy">Featured Picks</Link></li>
              <li><Link to="/products?trending=true" className="hover:text-navy">Trending Now</Link></li>
              <li><Link to="/products?sort=popularity" className="hover:text-navy">Best Sellers</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900">Customer Care</h4>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600">
              <li><Link to="/account" className="hover:text-navy">My Account</Link></li>
              <li><Link to="/account?tab=orders" className="hover:text-navy">Track Orders</Link></li>
              <li><Link to="/account?tab=addresses" className="hover:text-navy">Saved Addresses</Link></li>
              <li><Link to="/cart" className="hover:text-navy">Shopping Cart</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900">Newsletter</h4>
            <p className="mt-3 text-sm text-zinc-600">
              Receive new arrival alerts and seasonal offers.
            </p>
            <form onSubmit={handleSubscribe} className="mt-3 flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="Newsletter email"
                className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-warmwhite px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-navy focus:bg-white focus:outline-none"
              />
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-navy px-3.5 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-50"
              >
                {submitting ? '...' : 'Join'}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between border-t border-zinc-100 pt-6 text-xs text-zinc-500 gap-2">
          <p>&copy; {new Date().getFullYear()} ShopSphere Commerce. Free shipping on orders over ₹999.</p>
          <p>Secure payments via Razorpay Test Mode &amp; Cash on Delivery</p>
        </div>
      </div>
    </footer>
  );
}
