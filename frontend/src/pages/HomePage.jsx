import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import { catalogService } from '../services/catalogService';
import { ProductCard } from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/Skeletons';

export function HomePage() {
  const [categories, setCategories] = useState([]);
  const [trending, setTrending] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [cats, trendRes, newRes, bestRes] = await Promise.all([
          catalogService.getCategories(),
          catalogService.getProducts({ trending: true, size: 4 }),
          catalogService.getProducts({ sort: 'newest', size: 4 }),
          catalogService.getProducts({ sort: 'popularity', size: 4 }),
        ]);
        if (!active) return;
        setCategories(cats || []);
        setTrending(trendRes?.items || []);
        setNewArrivals(newRes?.items || []);
        setBestSellers(bestRes?.items || []);
      } catch {
        if (active) setError('Unable to load storefront catalog right now.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-6 space-y-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
                Everyday Essentials
              </p>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-navy leading-tight">
                Thoughtfully designed gear for home, work, and travel.
              </h1>
              <p className="text-base text-zinc-600 max-w-xl leading-relaxed">
                Explore curated audio, minimalist workspace essentials, and durable carry goods crafted with honest materials and transparent pricing.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 rounded-md bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-800 transition-colors"
                >
                  Shop Catalog
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/products?featured=true"
                  className="inline-flex items-center rounded-md border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-surface transition-colors"
                >
                  Featured Picks
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="aspect-[16/10] overflow-hidden rounded-md border border-zinc-200 bg-surface">
                <img
                  src="https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=1200&q=80"
                  alt="Curated workspace and audio essentials"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Trust strip */}
          <div className="mt-10 grid grid-cols-1 gap-4 border-t border-zinc-100 pt-6 sm:grid-cols-3">
            <div className="flex items-center gap-3 text-sm text-zinc-700">
              <Truck className="h-4 w-4 text-emerald-700 shrink-0" />
              <span>Free shipping on orders above ₹999</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-zinc-700">
              <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0" />
              <span>Verified checkout with Razorpay &amp; COD</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-zinc-700">
              <RefreshCw className="h-4 w-4 text-emerald-700 shrink-0" />
              <span>Easy returns &amp; real-time order tracking</span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-14 py-12">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Categories */}
        {categories.length > 0 && (
          <section>
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="text-xl font-semibold text-navy">Shop by Category</h2>
              <Link to="/products" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
                View all
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {categories.slice(0, 5).map((cat) => (
                <Link
                  key={cat.id}
                  to={`/products?category=${encodeURIComponent(cat.slug)}`}
                  className="group rounded-md border border-zinc-200 bg-white overflow-hidden hover:border-zinc-300 transition-colors"
                >
                  <div className="aspect-[4/3] bg-surface overflow-hidden">
                    {cat.imageUrl ? (
                      <img
                        src={cat.imageUrl}
                        alt={cat.name}
                        loading="lazy"
                        className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs text-zinc-400">
                        {cat.name}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-zinc-900">{cat.name}</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">{cat.productCount} items</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Trending */}
        <section>
          <div className="flex items-baseline justify-between mb-5">
            <div>
              <h2 className="text-xl font-semibold text-navy">Trending Products</h2>
              <p className="text-sm text-zinc-500 mt-0.5">Popular picks across our catalog this week.</p>
            </div>
            <Link
              to="/products?trending=true"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
            >
              See all
            </Link>
          </div>
          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {trending.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>

        {/* Promotional Banner */}
        <section className="rounded-md border border-zinc-200 bg-navy px-6 py-8 sm:px-10 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Limited Offer
            </p>
            <h3 className="mt-1 text-xl font-semibold">
              Take 10% off your first order with code <span className="font-mono">WELCOME10</span>
            </h3>
            <p className="mt-1 text-sm text-zinc-300">
              Valid on orders over ₹500 (up to ₹500 discount). Applied directly in your cart.
            </p>
          </div>
          <Link
            to="/products"
            className="shrink-0 rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            Explore Catalog
          </Link>
        </section>

        {/* New Arrivals */}
        <section>
          <div className="flex items-baseline justify-between mb-5">
            <div>
              <h2 className="text-xl font-semibold text-navy">New Arrivals</h2>
              <p className="text-sm text-zinc-500 mt-0.5">Recently added products ready to ship.</p>
            </div>
            <Link
              to="/products?sort=newest"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
            >
              Browse newest
            </Link>
          </div>
          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {newArrivals.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>

        {/* Best Sellers */}
        <section>
          <div className="flex items-baseline justify-between mb-5">
            <div>
              <h2 className="text-xl font-semibold text-navy">Best Selling</h2>
              <p className="text-sm text-zinc-500 mt-0.5">Customer favorites backed by verified orders.</p>
            </div>
            <Link
              to="/products?sort=popularity"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
            >
              View best sellers
            </Link>
          </div>
          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {bestSellers.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
