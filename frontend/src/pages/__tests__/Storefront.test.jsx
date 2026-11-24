import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import App from '../../App.jsx';
import { authService } from '../../services/authService';
import { cartService, wishlistService } from '../../services/cartService';

vi.mock('../../services/authService', () => ({
  authService: {
    refresh: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock('../../services/catalogService', () => ({
  catalogService: {
    getCategories: vi.fn().mockResolvedValue([]),
    getProducts: vi.fn().mockResolvedValue({ items: [], page: 0, totalPages: 0, totalElements: 0 }),
  },
}));

vi.mock('../../services/cartService', () => ({
  cartService: {
    getCart: vi.fn(),
    addItem: vi.fn(),
    updateQuantity: vi.fn(),
    removeItem: vi.fn(),
    applyCoupon: vi.fn(),
    removeCoupon: vi.fn(),
  },
  wishlistService: {
    getWishlist: vi.fn().mockResolvedValue([]),
    add: vi.fn(),
    remove: vi.fn(),
  },
}));

describe('Auth, Protected Routes, and Cart interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authService.refresh.mockRejectedValue(new Error('Unauthenticated'));
  });

  it('redirects unauthenticated users from /admin to /login', async () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Sign in to ShopSphere')).toBeInTheDocument();
    });
  });

  it('validates registration password strength before submitting', async () => {
    render(
      <MemoryRouter initialEntries={['/register']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Create your account')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Full name/i), { target: { value: 'Priya' } });
    fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'priya@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'weak' } });
    fireEvent.change(screen.getByLabelText(/Confirm password/i), { target: { value: 'weak' } });
    fireEvent.click(screen.getByRole('button', { name: /Create account/i }));

    expect(
      await screen.findByText(/Password must be 8\+ characters/i)
    ).toBeInTheDocument();
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('renders authenticated cart items and supports coupon application', async () => {
    authService.refresh.mockResolvedValue({
      accessToken: 'fake-jwt',
      user: { id: 2, fullName: 'Aarav', email: 'aarav@example.com', role: 'CUSTOMER' },
    });
    cartService.getCart.mockResolvedValue({
      id: 1,
      items: [
        {
          productId: 5,
          productName: 'Merino Overshirt',
          productSlug: 'merino-overshirt',
          sku: 'SS-APP-002',
          imageUrl: '',
          unitPrice: 3499,
          originalPrice: 3999,
          quantity: 1,
          stockQuantity: 10,
          inStock: true,
          lineTotal: 3499,
        },
      ],
      totalItems: 1,
      subtotal: 3499,
      appliedCouponCode: null,
      discountAmount: 0,
      shippingFee: 0,
      totalAmount: 3499,
      freeShippingThreshold: 999,
      amountToFreeShipping: 0,
    });
    cartService.applyCoupon.mockResolvedValue({
      id: 1,
      items: [
        {
          productId: 5,
          productName: 'Merino Overshirt',
          productSlug: 'merino-overshirt',
          sku: 'SS-APP-002',
          imageUrl: '',
          unitPrice: 3499,
          originalPrice: 3999,
          quantity: 1,
          stockQuantity: 10,
          inStock: true,
          lineTotal: 3499,
        },
      ],
      totalItems: 1,
      subtotal: 3499,
      appliedCouponCode: 'WELCOME10',
      discountAmount: 350,
      shippingFee: 0,
      totalAmount: 3149,
      freeShippingThreshold: 999,
      amountToFreeShipping: 0,
    });

    render(
      <MemoryRouter initialEntries={['/cart']}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText('Merino Overshirt')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/Coupon code/i), { target: { value: 'WELCOME10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(await screen.findByText(/WELCOME10 applied/i)).toBeInTheDocument();
    expect(wishlistService.getWishlist).toHaveBeenCalled();
  });
});
