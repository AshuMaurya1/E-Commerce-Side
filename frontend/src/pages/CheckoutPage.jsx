import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Check, CreditCard, MapPin, Plus, ShieldCheck, Truck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { accountService, orderService } from '../services/orderService';
import { extractErrorMessage, formatCurrency } from '../utils/format';
import { PageSpinner } from '../components/Skeletons';

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function CheckoutPage() {
  const { user } = useAuth();
  const { cart, refreshCart, clearLocalCart } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const directItem = location.state?.directItem || null;

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('RAZORPAY');
  const [customerNote, setCustomerNote] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  // Inline new address form
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [savingAddr, setSavingAddr] = useState(false);
  const [addrForm, setAddrForm] = useState({
    recipientName: user?.fullName || '',
    phone: user?.phone || '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    label: 'Home',
    defaultAddress: true,
  });

  // Simulated local Razorpay test modal state
  const [simPayment, setSimPayment] = useState(null);
  const [simBusy, setSimBusy] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const list = await accountService.getAddresses();
        if (!active) return;
        setAddresses(list || []);
        if (list && list.length > 0) {
          const def = list.find((a) => a.defaultAddress) || list[0];
          setSelectedAddressId(def.id);
        } else {
          setShowNewAddress(true);
        }
      } catch (err) {
        toast.error(extractErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
  }, [toast]);

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setSavingAddr(true);
    try {
      const created = await accountService.createAddress(addrForm);
      const updatedList = await accountService.getAddresses();
      setAddresses(updatedList);
      setSelectedAddressId(created.id);
      setShowNewAddress(false);
      toast.success('Delivery address saved');
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Could not save address'));
    } finally {
      setSavingAddr(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast.error('Please select or add a delivery address');
      return;
    }

    setPlacing(true);
    try {
      const order = await orderService.placeOrder({
        addressId: selectedAddressId,
        paymentMethod,
        couponCode: directItem ? couponInput.trim() || null : cart.appliedCouponCode || null,
        customerNote: customerNote.trim() || null,
        directItems: directItem
          ? [{ productId: directItem.productId, quantity: directItem.quantity }]
          : null,
      });

      if (!directItem) {
        clearLocalCart();
      }

      if (paymentMethod === 'COD') {
        toast.success(`Order ${order.orderNumber} placed!`);
        await refreshCart();
        navigate(`/orders/${order.orderNumber}`, { replace: true });
        return;
      }

      // Initialize Razorpay order
      const payData = await orderService.createRazorpayOrder(order.orderNumber);
      if (payData.mode === 'SIMULATED') {
        setSimPayment({ order, payData });
        setPlacing(false);
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Unable to load Razorpay checkout script');
        navigate(`/orders/${order.orderNumber}`);
        return;
      }

      const options = {
        key: payData.keyId,
        amount: payData.amountInPaise,
        currency: payData.currency,
        name: 'ShopSphere',
        description: `Order ${order.orderNumber}`,
        order_id: payData.razorpayOrderId,
        prefill: {
          name: user?.fullName,
          email: user?.email,
          contact: user?.phone || '',
        },
        handler: async (response) => {
          try {
            await orderService.verifyRazorpayPayment({
              orderNumber: order.orderNumber,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success('Payment verified and order placed!');
            await refreshCart();
            navigate(`/orders/${order.orderNumber}`, { replace: true });
          } catch (verifyErr) {
            toast.error(extractErrorMessage(verifyErr, 'Payment verification failed'));
            navigate(`/orders/${order.orderNumber}`, { replace: true });
          }
        },
        modal: {
          ondismiss: async () => {
            await orderService.reportPaymentFailure(
              order.orderNumber,
              payData.razorpayOrderId,
              'Checkout dismissed by user'
            );
            toast.info('Payment was cancelled');
            navigate(`/orders/${order.orderNumber}`, { replace: true });
          },
        },
        theme: { color: '#0F172A' },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', async (resp) => {
        await orderService.reportPaymentFailure(
          order.orderNumber,
          payData.razorpayOrderId,
          resp.error?.description || 'Payment failed'
        );
        toast.error(resp.error?.description || 'Payment failed');
        navigate(`/orders/${order.orderNumber}`, { replace: true });
      });
      rzp.open();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Checkout failed'));
    } finally {
      setPlacing(false);
    }
  };

  const handleSimulatedSuccess = async () => {
    if (!simPayment) return;
    setSimBusy(true);
    try {
      await orderService.simulateTestPayment(simPayment.order.orderNumber);
      toast.success('Test payment verified and order placed!');
      await refreshCart();
      navigate(`/orders/${simPayment.order.orderNumber}`, { replace: true });
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSimBusy(false);
    }
  };

  const handleSimulatedFailure = async () => {
    if (!simPayment) return;
    setSimBusy(true);
    try {
      await orderService.reportPaymentFailure(
        simPayment.order.orderNumber,
        simPayment.payData.razorpayOrderId,
        'Test payment declined'
      );
      toast.info('Payment failed — reserved stock released');
      navigate(`/orders/${simPayment.order.orderNumber}`, { replace: true });
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSimBusy(false);
    }
  };

  if (loading) return <PageSpinner />;

  const itemsToShow = directItem
    ? [
        {
          productId: directItem.productId,
          productName: directItem.productName,
          imageUrl: directItem.imageUrl,
          quantity: directItem.quantity,
          lineTotal: Number(directItem.unitPrice) * directItem.quantity,
        },
      ]
    : cart.items || [];

  if (itemsToShow.length === 0 && !simPayment) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-14 text-center">
        <h1 className="text-xl font-semibold text-navy">Nothing to check out</h1>
        <p className="mt-1 text-sm text-zinc-600">Add products to your cart before proceeding to checkout.</p>
        <Link
          to="/products"
          className="mt-5 inline-flex rounded-md bg-navy px-4 py-2 text-sm font-medium text-white"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  const displaySubtotal = directItem
    ? Number(directItem.unitPrice) * directItem.quantity
    : Number(cart.subtotal || 0);
  const displayDiscount = directItem ? 0 : Number(cart.discountAmount || 0);
  const displayShipping = directItem
    ? displaySubtotal >= 999
      ? 0
      : 79
    : Number(cart.shippingFee || 0);
  const displayTotal = Math.max(displaySubtotal - displayDiscount, 0) + displayShipping;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-navy border-b border-zinc-200 pb-4 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {/* Delivery Address */}
          <section className="rounded-md border border-zinc-200 bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-navy" />
                <h2 className="text-base font-semibold text-navy">1. Delivery Address</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowNewAddress((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                {showNewAddress ? 'Cancel' : 'Add new address'}
              </button>
            </div>

            {addresses.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {addresses.map((addr) => {
                  const selected = selectedAddressId === addr.id;
                  return (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`text-left rounded-md border p-3.5 transition-colors ${
                        selected
                          ? 'border-navy bg-warmwhite ring-1 ring-navy'
                          : 'border-zinc-200 bg-white hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                          {addr.label}
                        </span>
                        {selected && <Check className="h-4 w-4 text-navy" />}
                      </div>
                      <p className="mt-1 text-sm font-semibold text-zinc-900">{addr.recipientName}</p>
                      <p className="text-xs text-zinc-600 mt-0.5">
                        {addr.line1}
                        {addr.line2 ? `, ${addr.line2}` : ''}
                      </p>
                      <p className="text-xs text-zinc-600">
                        {addr.city}, {addr.state} - {addr.postalCode}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">Phone: {addr.phone}</p>
                    </button>
                  );
                })}
              </div>
            )}

            {showNewAddress && (
              <form onSubmit={handleSaveAddress} className="border-t border-zinc-200 pt-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    required
                    placeholder="Recipient full name"
                    value={addrForm.recipientName}
                    onChange={(e) => setAddrForm({ ...addrForm, recipientName: e.target.value })}
                    className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  />
                  <input
                    required
                    placeholder="Phone number"
                    value={addrForm.phone}
                    onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })}
                    className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  />
                  <input
                    required
                    placeholder="Address line 1"
                    value={addrForm.line1}
                    onChange={(e) => setAddrForm({ ...addrForm, line1: e.target.value })}
                    className="sm:col-span-2 rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  />
                  <input
                    placeholder="Apartment, suite, landmark (optional)"
                    value={addrForm.line2}
                    onChange={(e) => setAddrForm({ ...addrForm, line2: e.target.value })}
                    className="sm:col-span-2 rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  />
                  <input
                    required
                    placeholder="City"
                    value={addrForm.city}
                    onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                    className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  />
                  <input
                    required
                    placeholder="State"
                    value={addrForm.state}
                    onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })}
                    className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  />
                  <input
                    required
                    placeholder="Postal code"
                    value={addrForm.postalCode}
                    onChange={(e) => setAddrForm({ ...addrForm, postalCode: e.target.value })}
                    className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  />
                  <input
                    placeholder="Label (Home, Work)"
                    value={addrForm.label}
                    onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })}
                    className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingAddr}
                  className="rounded-md bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-50"
                >
                  {savingAddr ? 'Saving...' : 'Save Delivery Address'}
                </button>
              </form>
            )}
          </section>

          {/* Payment Method */}
          <section className="rounded-md border border-zinc-200 bg-white p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-navy" />
              <h2 className="text-base font-semibold text-navy">2. Payment Method</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('RAZORPAY')}
                className={`text-left rounded-md border p-4 ${
                  paymentMethod === 'RAZORPAY'
                    ? 'border-navy bg-warmwhite ring-1 ring-navy'
                    : 'border-zinc-200 hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-900">Razorpay Online</span>
                  <ShieldCheck className="h-4 w-4 text-emerald-700" />
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  Cards, UPI, Netbanking (Test Mode verified)
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('COD')}
                className={`text-left rounded-md border p-4 ${
                  paymentMethod === 'COD'
                    ? 'border-navy bg-warmwhite ring-1 ring-navy'
                    : 'border-zinc-200 hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-900">Cash on Delivery</span>
                  <Truck className="h-4 w-4 text-zinc-600" />
                </div>
                <p className="mt-1 text-xs text-zinc-500">Pay via cash or UPI upon delivery</p>
              </button>
            </div>

            {directItem && (
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Promo Code (optional)
                </label>
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="WELCOME10"
                  className="w-full sm:w-64 rounded-md border border-zinc-300 px-3 py-1.5 text-sm uppercase"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Order Note (optional)
              </label>
              <input
                type="text"
                maxLength={500}
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                placeholder="Delivery instructions for the courier..."
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
          </section>
        </div>

        {/* Summary */}
        <div className="lg:col-span-4">
          <div className="rounded-md border border-zinc-200 bg-white p-5 space-y-4 sticky top-24">
            <h2 className="text-base font-semibold text-navy">Order Summary</h2>
            <div className="divide-y divide-zinc-100 max-h-72 overflow-y-auto">
              {itemsToShow.map((item) => (
                <div key={item.productId} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-900 truncate">{item.productName}</p>
                    <p className="text-xs text-zinc-500">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-medium text-zinc-900 shrink-0">
                    {formatCurrency(item.lineTotal)}
                  </span>
                </div>
              ))}
            </div>

            <dl className="space-y-2 border-t border-zinc-200 pt-3 text-sm">
              <div className="flex justify-between text-zinc-600">
                <dt>Subtotal</dt>
                <dd>{formatCurrency(displaySubtotal)}</dd>
              </div>
              {displayDiscount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <dt>Coupon ({cart.appliedCouponCode})</dt>
                  <dd>-{formatCurrency(displayDiscount)}</dd>
                </div>
              )}
              <div className="flex justify-between text-zinc-600">
                <dt>Shipping</dt>
                <dd>{displayShipping === 0 ? 'Free' : formatCurrency(displayShipping)}</dd>
              </div>
              <div className="flex justify-between border-t border-zinc-200 pt-2.5 text-base font-semibold text-navy">
                <dt>Total Payable</dt>
                <dd>{formatCurrency(displayTotal)}</dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={placing || !selectedAddressId}
              className="w-full rounded-md bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {placing
                ? 'Processing...'
                : paymentMethod === 'RAZORPAY'
                ? 'Proceed to Payment'
                : 'Place Order'}
            </button>
          </div>
        </div>
      </div>

      {/* Local Test Mode Payment Simulation Modal */}
      {simPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-md w-full rounded-md border border-zinc-200 bg-white p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-semibold text-navy">Razorpay Test Checkout</h3>
                <p className="text-xs text-zinc-500">Local simulation (Razorpay keys not configured)</p>
              </div>
              <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                Test Mode
              </span>
            </div>

            <div className="rounded bg-surface p-3.5 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-600">Order</span>
                <span className="font-mono font-medium">{simPayment.order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Amount</span>
                <span className="font-semibold text-navy">{formatCurrency(simPayment.order.totalAmount)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                disabled={simBusy}
                onClick={handleSimulatedSuccess}
                className="w-full rounded-md bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {simBusy ? 'Confirming...' : 'Complete Test Payment'}
              </button>
              <button
                type="button"
                disabled={simBusy}
                onClick={handleSimulatedFailure}
                className="w-full rounded-md border border-red-200 bg-white py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Simulate Payment Failure
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
