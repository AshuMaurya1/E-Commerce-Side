import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PackageSearch, SlidersHorizontal, X } from 'lucide-react';
import { catalogService } from '../services/catalogService';
import { ProductCard } from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/Skeletons';
import { EmptyState } from '../components/EmptyState';
import { Pagination } from '../components/Pagination';
import { useDebounce } from '../hooks/useDebounce';

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [categories, setCategories] = useState([]);
  const [data, setData] = useState({ items: [], page: 0, totalPages: 0, totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const category = searchParams.get('category') || '';
  const urlSearch = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'newest';
  const featured = searchParams.get('featured') === 'true';
  const trending = searchParams.get('trending') === 'true';
  const inStock = searchParams.get('inStock') === 'true';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const page = Number(searchParams.get('page') || 0);

  const [searchInput, setSearchInput] = useState(urlSearch);
  const debouncedSearch = useDebounce(searchInput, 350);

  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    if (debouncedSearch !== urlSearch) {
      updateParam('search', debouncedSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    catalogService.getCategories().then((c) => setCategories(c || [])).catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    async function fetchProducts() {
      setLoading(true);
      setError('');
      try {
        const res = await catalogService.getProducts({
          category: category || undefined,
          search: urlSearch || undefined,
          minPrice: minPrice || undefined,
          maxPrice: maxPrice || undefined,
          featured: featured ? true : undefined,
          trending: trending ? true : undefined,
          inStock: inStock ? true : undefined,
          sort,
          page,
          size: 12,
        });
        if (active) setData(res);
      } catch {
        if (active) setError('Failed to load products. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchProducts();
    return () => {
      active = false;
    };
  }, [category, urlSearch, minPrice, maxPrice, featured, trending, inStock, sort, page]);

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value === '' || value === false || value === null || value === undefined) {
      next.delete(key);
    } else {
      next.set(key, String(value));
    }
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  }

  function clearAllFilters() {
    setSearchInput('');
    setSearchParams({});
  }

  const filterPanel = (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 mb-3">
          Categories
        </h3>
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => updateParam('category', '')}
            className={`block w-full text-left rounded px-2.5 py-1.5 text-sm ${
              !category ? 'bg-navy text-white font-medium' : 'text-zinc-700 hover:bg-surface'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => updateParam('category', cat.slug)}
              className={`flex w-full items-center justify-between rounded px-2.5 py-1.5 text-sm ${
                category === cat.slug
                  ? 'bg-navy text-white font-medium'
                  : 'text-zinc-700 hover:bg-surface'
              }`}
            >
              <span>{cat.name}</span>
              <span className="text-xs opacity-75">{cat.productCount}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-zinc-200 pt-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 mb-3">
          Price Range (₹)
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min="0"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => updateParam('minPrice', e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm"
          />
          <input
            type="number"
            min="0"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => updateParam('maxPrice', e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm"
          />
        </div>
      </div>

      <div className="border-t border-zinc-200 pt-5 space-y-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 mb-2">
          Availability &amp; Highlights
        </h3>
        <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => updateParam('inStock', e.target.checked)}
            className="rounded border-zinc-300 text-navy"
          />
          In stock only
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => updateParam('featured', e.target.checked)}
            className="rounded border-zinc-300 text-navy"
          />
          Featured picks
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
          <input
            type="checkbox"
            checked={trending}
            onChange={(e) => updateParam('trending', e.target.checked)}
            className="rounded border-zinc-300 text-navy"
          />
          Trending now
        </label>
      </div>

      <button
        type="button"
        onClick={clearAllFilters}
        className="w-full rounded-md border border-zinc-300 bg-white py-2 text-xs font-medium text-zinc-700 hover:bg-surface"
      >
        Reset All Filters
      </button>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Product Catalog</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {data.totalElements} {data.totalElements === 1 ? 'product' : 'products'} found
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Filter by keyword..."
            className="w-full sm:w-56 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm focus:border-navy focus:outline-none"
          />

          <select
            value={sort}
            onChange={(e) => updateParam('sort', e.target.value)}
            aria-label="Sort products"
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-800 focus:border-navy focus:outline-none"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="popularity">Best Selling</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>

          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </button>
        </div>
      </div>

      {filtersOpen && (
        <div className="mb-6 rounded-md border border-zinc-200 bg-white p-4 lg:hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-zinc-900">Filter Catalog</span>
            <button type="button" onClick={() => setFiltersOpen(false)}>
              <X className="h-4 w-4 text-zinc-500" />
            </button>
          </div>
          {filterPanel}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="hidden lg:block lg:col-span-3">
          <div className="rounded-md border border-zinc-200 bg-white p-5 sticky top-24">
            {filterPanel}
          </div>
        </aside>

        <div className="lg:col-span-9">
          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : loading ? (
            <ProductGridSkeleton count={6} />
          ) : data.items.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="No matching products"
              description="Try clearing a filter or searching for a broader product term."
              actionLabel="Clear Filters"
              onAction={clearAllFilters}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {data.items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                onPageChange={(nextPage) => updateParam('page', nextPage)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
