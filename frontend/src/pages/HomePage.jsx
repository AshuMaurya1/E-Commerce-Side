import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, RefreshCw, ShieldCheck, Truck } from 'lucide-react';
import { catalogService } from '../services/catalogService';
import { ProductCard } from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/Skeletons';
import { ErrorState } from '../components/ErrorState';

export function HomePage() {
  const [categories, setCategories] = useState([]);
  const [trending, setTrending] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadTick, setReloadTick] = useState(0);

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
  }, [reloadTick]);

  return (
    <div className="bg-white">
      {/* Editorial Hero */}
      <section className="bg-warmwhite border-b border-zinc-200">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-6 space-y-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                Seasonal Collection
              </p>
              <h1 className="text-3xl sm:text-[42px] font-semibold tracking-tight text-navy leading-[1.12]">
                Thoughtfully built essentials for work, home, and carry.
              </h1>
              <p className="text-base text-zinc-600 max-w-lg leading-relaxed">
                Functional audio, minimalist lighting, heavyweight apparel, and weather-resistant bags crafted for daily reliability.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 rounded-sm bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-800 transition-colors"
                >
                  Shop Catalog
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/products?featured=true"
                  className="inline-flex items-center rounded-sm border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-800 hover:border-navy hover:text-navy transition-colors"
                >
                  Featured Picks
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="aspect-[16/10] overflow-hidden rounded-sm bg-surface">
                <img
                  src="https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=1200&q=80"
                  alt="Curated workspace and audio essentials"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 border-t border-zinc-200 pt-6 sm:grid-cols-3">
            <div className="flex items-center gap-3 text-[13px] text-zinc-700">
              <Truck className="h-4 w-4 text-emerald-700 shrink-0" strokeWidth={1.75} />
              <span>Complimentary delivery on orders above ₹999</span>
            </div>
            <div className="flex items-center gap-3 text-[13px] text-zinc-700">
              <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0" strokeWidth={1.75} />
              <span>Verified checkout with Razorpay &amp; Cash on Delivery</span>
            </div>
            <div className="flex items-center gap-3 text-[13px] text-zinc-700">
              <RefreshCw className="h-4 w-4 text-emerald-700 shrink-0" strokeWidth={1.75} />
              <span>Straightforward returns &amp; live order tracking</span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16 py-14">
        {error && (
          <ErrorState
            message={error}
            retryAction="Retry"
            onRetry={() => setReloadTick((n) => n + 1)}
          />
        )}

        {/* Categories */}
        {categories.length > 0 && (
          <section>
            <div className="flex items-baseline justify-between border-b border-zinc-200 pb-3 mb-6">
              <h2 className="text-lg font-semibold tracking-tight text-navy">Shop by Category</h2>
              <Link to="/products" className="text-xs font-medium uppercase tracking-wider text-zinc-600 hover:text-navy">
                View all &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
              {categories.slice(0, 5).map((cat) => (
                <Link
                  key={cat.id}
                  to={`/products?category=${encodeURIComponent(cat.slug)}`}
                  className="group block"
                >
                  <div className="aspect-[4/3] rounded-sm bg-surface overflow-hidden border border-zinc-200/70">
                    {cat.imageUrl ? (
                      <img
                        src={cat.imageUrl}
                        alt={cat.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-opacity duration-200 group-hover:opacity-90"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs text-zinc-400">
                        {cat.name}
                      </div>
                    )}
                  </div>
                  <div className="pt-2.5 flex items-baseline justify-between gap-2">
                    <h3 className="text-sm font-medium text-zinc-900 group-hover:text-navy truncate">
                      {cat.name}
                    </h3>
                    <span className="tabular-nums text-xs text-zinc-500 shrink-0">{cat.productCount}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Trending */}
        <section>
          <div className="flex items-baseline justify-between border-b border-zinc-200 pb-3 mb-6">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-navy">Trending Products</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Popular essentials across our catalog.</p>
            </div>
            <Link
              to="/products?trending=true"
              className="text-xs font-medium uppercase tracking-wider text-zinc-600 hover:text-navy"
            >
              See all &rarr;
            </Link>
          </div>
          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-8">
              {trending.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>

        {/* Promotional Band */}
        <section className="rounded-sm bg-navy px-6 py-8 sm:px-10 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-400">
              Shop ShopSphere
            </p>
            <h3 className="mt-1.5 text-xl font-semibold tracking-tight">
              Find considered essentials for everyday use.
            </h3>
            <p className="mt-1 text-sm text-zinc-300">
              Browse the current catalog and see live availability.
            </p>
          </div>
          <Link
            to="/products"
            className="shrink-0 rounded-sm bg-white px-5 py-2.5 text-sm font-medium text-navy hover:bg-zinc-100 transition-colors"
          >
            Browse Catalog
          </Link>
        </section>

        {/* New Arrivals */}
        <section>
          <div className="flex items-baseline justify-between border-b border-zinc-200 pb-3 mb-6">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-navy">New Arrivals</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Recently added products ready to ship.</p>
            </div>
            <Link
              to="/products?sort=newest"
              className="text-xs font-medium uppercase tracking-wider text-zinc-600 hover:text-navy"
            >
              Browse newest &rarr;
            </Link>
          </div>
          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-8">
              {newArrivals.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>

        {/* Best Sellers */}
        <section>
          <div className="flex items-baseline justify-between border-b border-zinc-200 pb-3 mb-6">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-navy">Best Selling</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Customer favorites backed by verified orders.</p>
            </div>
            <Link
              to="/products?sort=popularity"
              className="text-xs font-medium uppercase tracking-wider text-zinc-600 hover:text-navy"
            >
              View best sellers &rarr;
            </Link>
          </div>
          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-8">
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
