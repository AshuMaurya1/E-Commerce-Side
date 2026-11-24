import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Heart, MapPin, Package, Plus, Trash2, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { accountService, orderService } from '../services/orderService';
import { extractErrorMessage, formatCurrency, formatDate } from '../utils/format';
import { ProductCard } from '../components/ProductCard';
import { OrderStatusBadge, PaymentStatusBadge } from '../components/OrderStatusBadge';
import { EmptyState } from '../components/EmptyState';
import { Pagination } from '../components/Pagination';

export function AccountPage() {
  const { user, refreshProfile } = useAuth();
  const { wishlist } = useCart();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'orders';

  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [savingPw, setSavingPw] = useState(false);

  const [addresses, setAddresses] = useState([]);
  const [addrForm, setAddrForm] = useState({
    recipientName: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    label: 'Home',
    defaultAddress: false,
  });
  const [showAddrForm, setShowAddrForm] = useState(false);

  const [ordersData, setOrdersData] = useState({ items: [], page: 0, totalPages: 0 });
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({ fullName: user.fullName || '', phone: user.phone || '' });
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'addresses') {
      accountService.getAddresses().then(setAddresses).catch(() => {});
    } else if (activeTab === 'orders') {
      loadOrders(0);
    }
  }, [activeTab]);

  const loadOrders = async (page) => {
    setOrdersLoading(true);
    try {
      const data = await orderService.listOrders(page, 8);
      setOrdersData(data);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await accountService.updateProfile(profileForm);
      await refreshProfile();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSavingPw(true);
    try {
      await accountService.changePassword(pwForm);
      toast.success('Password changed');
      setPwForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSavingPw(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      await accountService.createAddress(addrForm);
      setAddresses(await accountService.getAddresses());
      setShowAddrForm(false);
      setAddrForm({
        recipientName: '',
        phone: '',
        line1: '',
        line2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        label: 'Home',
        defaultAddress: false,
      });
      toast.success('Address added');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      await accountService.deleteAddress(id);
      setAddresses(await accountService.getAddresses());
      toast.info('Address deleted');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await accountService.setDefaultAddress(id);
      setAddresses(await accountService.getAddresses());
      toast.success('Default address updated');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const tabs = [
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'wishlist', label: `Wishlist (${wishlist.length})`, icon: Heart },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'profile', label: 'Profile & Security', icon: User },
  ];

  return (
    <div className="bg-white min-h-[70vh]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="pb-4">
          <h1 className="text-2xl font-semibold tracking-tight text-navy">My Account</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{user?.email}</p>
        </div>

        {/* Underline Tabs */}
        <div className="flex flex-wrap gap-6 border-b border-zinc-200 mb-8">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSearchParams({ tab: id })}
              className={`inline-flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors -mb-px ${
                activeTab === id
                  ? 'border-navy text-navy'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              {label}
            </button>
          ))}
        </div>

        {/* Orders */}
        {activeTab === 'orders' && (
          <div>
            {ordersLoading ? (
              <div className="h-40 rounded-sm border border-zinc-200 bg-surface animate-pulse" />
            ) : ordersData.items.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No orders yet"
                description="Once you place an order, you can track its status and request returns here."
                actionLabel="Shop Catalog"
                actionTo="/products"
              />
            ) : (
              <>
                <div className="border-t border-b border-zinc-200 divide-y divide-zinc-200">
                  {ordersData.items.map((order) => (
                    <div
                      key={order.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 sm:py-5"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <Link
                            to={`/orders/${order.orderNumber}`}
                            className="font-mono text-sm font-semibold text-navy hover:underline"
                          >
                            {order.orderNumber}
                          </Link>
                          <OrderStatusBadge status={order.status} />
                          <PaymentStatusBadge status={order.paymentStatus} />
                        </div>
                        <p className="tabular-nums text-xs text-zinc-500 mt-1">
                          Placed {formatDate(order.createdAt)} &middot; {order.itemCount}{' '}
                          {order.itemCount === 1 ? 'item' : 'items'} &middot; {order.paymentMethod}
                        </p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <span className="tabular-nums text-sm font-semibold text-zinc-900">
                          {formatCurrency(order.totalAmount)}
                        </span>
                        <Link
                          to={`/orders/${order.orderNumber}`}
                          className="rounded-sm border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-surface"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                <Pagination
                  page={ordersData.page}
                  totalPages={ordersData.totalPages}
                  onPageChange={loadOrders}
                />
              </>
            )}
          </div>
        )}

        {/* Wishlist */}
        {activeTab === 'wishlist' && (
          <div>
            {wishlist.length === 0 ? (
              <EmptyState
                icon={Heart}
                title="Your wishlist is empty"
                description="Save products while browsing to keep track of them for later."
                actionLabel="Discover Products"
                actionTo="/products"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-8">
                {wishlist.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Addresses */}
        {activeTab === 'addresses' && (
          <div className="space-y-5">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowAddrForm((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-sm bg-navy px-3.5 py-2 text-sm font-medium text-white hover:bg-navy-800"
              >
                <Plus className="h-4 w-4" />
                {showAddrForm ? 'Cancel' : 'Add Address'}
              </button>
            </div>

            {showAddrForm && (
              <form onSubmit={handleAddAddress} className="rounded-sm border border-zinc-200 bg-warmwhite p-5 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    required
                    placeholder="Recipient name"
                    value={addrForm.recipientName}
                    onChange={(e) => setAddrForm({ ...addrForm, recipientName: e.target.value })}
                    className="rounded-sm border border-zinc-300 bg-white px-3 py-2 text-sm"
                  />
                  <input
                    required
                    placeholder="Phone"
                    value={addrForm.phone}
                    onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })}
                    className="rounded-sm border border-zinc-300 bg-white px-3 py-2 text-sm"
                  />
                  <input
                    required
                    placeholder="Address line 1"
                    value={addrForm.line1}
                    onChange={(e) => setAddrForm({ ...addrForm, line1: e.target.value })}
                    className="sm:col-span-2 rounded-sm border border-zinc-300 bg-white px-3 py-2 text-sm"
                  />
                  <input
                    placeholder="Line 2 (optional)"
                    value={addrForm.line2}
                    onChange={(e) => setAddrForm({ ...addrForm, line2: e.target.value })}
                    className="sm:col-span-2 rounded-sm border border-zinc-300 bg-white px-3 py-2 text-sm"
                  />
                  <input
                    required
                    placeholder="City"
                    value={addrForm.city}
                    onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                    className="rounded-sm border border-zinc-300 bg-white px-3 py-2 text-sm"
                  />
                  <input
                    required
                    placeholder="State"
                    value={addrForm.state}
                    onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })}
                    className="rounded-sm border border-zinc-300 bg-white px-3 py-2 text-sm"
                  />
                  <input
                    required
                    placeholder="Postal code"
                    value={addrForm.postalCode}
                    onChange={(e) => setAddrForm({ ...addrForm, postalCode: e.target.value })}
                    className="rounded-sm border border-zinc-300 bg-white px-3 py-2 text-sm"
                  />
                  <input
                    placeholder="Label (Home, Work)"
                    value={addrForm.label}
                    onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })}
                    className="rounded-sm border border-zinc-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-sm bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-800"
                >
                  Save Address
                </button>
              </form>
            )}

            {addresses.length === 0 ? (
              <EmptyState
                icon={MapPin}
                title="No saved addresses"
                description="Add a delivery address for faster checkout."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div key={addr.id} className="rounded-sm border border-zinc-200 bg-white p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                          {addr.label}
                        </span>
                        {addr.defaultAddress && (
                          <span className="rounded-sm bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm font-semibold text-zinc-900">{addr.recipientName}</p>
                      <p className="text-sm text-zinc-600 mt-0.5">
                        {addr.line1}
                        {addr.line2 ? `, ${addr.line2}` : ''}
                      </p>
                      <p className="text-sm text-zinc-600">
                        {addr.city}, {addr.state} - {addr.postalCode}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">Phone: {addr.phone}</p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3">
                      {!addr.defaultAddress ? (
                        <button
                          type="button"
                          onClick={() => handleSetDefault(addr.id)}
                          className="text-xs font-medium text-emerald-700 hover:underline"
                        >
                          Set as default
                        </button>
                      ) : (
                        <span />
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-zinc-400 hover:text-red-600"
                        aria-label="Delete address"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <form onSubmit={handleSaveProfile} className="rounded-sm border border-zinc-200 bg-warmwhite p-6 space-y-4">
              <h2 className="text-base font-semibold text-navy">Personal Details</h2>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Full name</label>
                <input
                  required
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  className="w-full rounded-sm border border-zinc-300 bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Phone</label>
                <input
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full rounded-sm border border-zinc-300 bg-white px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={savingProfile}
                className="rounded-sm bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-50"
              >
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </form>

            <form onSubmit={handleChangePassword} className="rounded-sm border border-zinc-200 bg-warmwhite p-6 space-y-4">
              <h2 className="text-base font-semibold text-navy">Change Password</h2>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Current password</label>
                <input
                  type="password"
                  required
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  className="w-full rounded-sm border border-zinc-300 bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">New password</label>
                <input
                  type="password"
                  required
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  placeholder="Min 8 chars, upper, lower, number"
                  className="w-full rounded-sm border border-zinc-300 bg-white px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={savingPw}
                className="rounded-sm bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-50"
              >
                {savingPw ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
