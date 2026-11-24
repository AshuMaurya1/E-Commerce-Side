import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  ShoppingBag,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { catalogService } from '../services/catalogService';

export function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { cartCount, wishlist } = useCart();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    catalogService
      .getCategories()
      .then((data) => {
        if (active) setCategories(data || []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    setMobileOpen(false);
    navigate(trimmed ? `/products?search=${encodeURIComponent(trimmed)}` : '/products');
  };

  const handleLogout = async () => {
    setAccountMenuOpen(false);
    setMobileOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 shrink-0">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-navy text-white text-sm font-semibold">
                S
              </span>
              <span className="text-lg font-semibold tracking-tight text-navy">ShopSphere</span>
            </Link>

            {/* Primary desktop links */}
            <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-zinc-600">
              <Link to="/products" className="hover:text-navy transition-colors">
                All Products
              </Link>
              {categories.slice(0, 4).map((cat) => (
                <Link
                  key={cat.id}
                  to={`/products?category=${encodeURIComponent(cat.slug)}`}
                  className="hover:text-navy transition-colors whitespace-nowrap"
                >
                  {cat.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md items-center">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, brands, or SKU..."
                aria-label="Search products"
                className="w-full rounded-md border border-zinc-300 bg-warmwhite py-1.5 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-navy focus:bg-white focus:outline-none"
              />
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/account?tab=wishlist"
              aria-label="Wishlist"
              className="relative hidden sm:inline-flex items-center justify-center rounded-md p-2 text-zinc-700 hover:bg-surface hover:text-navy transition-colors"
            >
              <Heart className="h-5 w-5" />
              {wishlist.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-zinc-700 px-1 text-[10px] font-semibold text-white">
                  {wishlist.length}
                </span>
              )}
            </Link>

            <Link
              to="/cart"
              aria-label="Shopping Cart"
              className="relative inline-flex items-center justify-center rounded-md p-2 text-zinc-700 hover:bg-surface hover:text-navy transition-colors"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-semibold text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen((o) => !o)}
                  className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-warmwhite px-3 py-1.5 text-sm font-medium text-zinc-800 hover:border-zinc-300"
                >
                  <User className="h-4 w-4 text-zinc-600" />
                  <span className="max-w-[110px] truncate">{user?.fullName?.split(' ')[0]}</span>
                </button>

                {accountMenuOpen && (
                  <div
                    onMouseLeave={() => setAccountMenuOpen(false)}
                    className="absolute right-0 mt-1.5 w-52 rounded-md border border-zinc-200 bg-white py-1 shadow-md"
                  >
                    <div className="border-b border-zinc-100 px-3.5 py-2">
                      <p className="text-xs font-medium text-zinc-900 truncate">{user?.fullName}</p>
                      <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                    </div>
                    <Link
                      to="/account"
                      onClick={() => setAccountMenuOpen(false)}
                      className="block px-3.5 py-2 text-sm text-zinc-700 hover:bg-surface"
                    >
                      My Account
                    </Link>
                    <Link
                      to="/account?tab=orders"
                      onClick={() => setAccountMenuOpen(false)}
                      className="block px-3.5 py-2 text-sm text-zinc-700 hover:bg-surface"
                    >
                      Order History
                    </Link>
                    <Link
                      to="/account?tab=wishlist"
                      onClick={() => setAccountMenuOpen(false)}
                      className="block px-3.5 py-2 text-sm text-zinc-700 hover:bg-surface"
                    >
                      Saved Wishlist
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center gap-2 border-t border-zinc-100 px-3.5 py-2 text-sm font-medium text-emerald-700 hover:bg-surface"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 border-t border-zinc-100 px-3.5 py-2 text-left text-sm text-red-600 hover:bg-surface"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/login"
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-700 hover:text-navy"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="rounded-md bg-navy px-3.5 py-1.5 text-sm font-medium text-white hover:bg-navy-800 transition-colors"
                >
                  Create account
                </Link>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
              className="inline-flex items-center justify-center rounded-md p-2 text-zinc-700 hover:bg-surface lg:hidden"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="border-t border-zinc-200 bg-white px-4 py-4 lg:hidden">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full rounded-md border border-zinc-300 bg-warmwhite py-2 pl-9 pr-3 text-sm"
              />
            </div>
          </form>
          <div className="space-y-1">
            <Link
              to="/products"
              onClick={() => setMobileOpen(false)}
              className="block rounded-md px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-surface"
            >
              All Products
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${encodeURIComponent(cat.slug)}`}
                onClick={() => setMobileOpen(false)}
                className="block rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-surface"
              >
                {cat.name}
              </Link>
            ))}
          </div>
          <div className="mt-4 border-t border-zinc-200 pt-3 space-y-1">
            {isAuthenticated ? (
              <>
                <Link
                  to="/account"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-surface"
                >
                  My Account ({user?.fullName})
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-md px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-surface"
                  >
                    Admin Dashboard
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="block w-full rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-surface"
                >
                  Sign out
                </button>
              </>
            ) : (
              <div className="flex gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 rounded-md border border-zinc-300 py-2 text-center text-sm font-medium text-zinc-800"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 rounded-md bg-navy py-2 text-center text-sm font-medium text-white"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
