import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import App from './App.jsx';
import { authService } from './services/authService';
import { catalogService } from './services/catalogService';

vi.mock('./services/authService', () => ({
  authService: {
    refresh: vi.fn().mockRejectedValue(new Error('No session')),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock('./services/catalogService', () => ({
  catalogService: {
    getCategories: vi.fn().mockResolvedValue([
      { id: 1, name: 'Audio & Tech', slug: 'audio-tech', productCount: 3 },
    ]),
    getProducts: vi.fn().mockResolvedValue({
      items: [
        {
          id: 10,
          name: 'Studio ANC Wireless Headphones',
          slug: 'studio-anc-headphones',
          sku: 'SS-AUD-001',
          shortDescription: 'Over-ear ANC headphones',
          price: 8999,
          discountPrice: 7499,
          effectivePrice: 7499,
          stockQuantity: 12,
          lowStockThreshold: 5,
          inStock: true,
          averageRating: 4.5,
          reviewCount: 4,
          categoryName: 'Audio & Tech',
          categorySlug: 'audio-tech',
          primaryImageUrl: 'https://example.com/headphones.jpg',
        },
      ],
      page: 0,
      totalPages: 1,
      totalElements: 1,
    }),
    subscribeNewsletter: vi.fn().mockResolvedValue({ message: 'Subscribed' }),
  },
}));

describe('App', () => {
  it('renders ShopSphere storefront and catalog products', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getAllByText('ShopSphere').length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(screen.getAllByText('Studio ANC Wireless Headphones').length).toBeGreaterThan(0);
    });
    expect(catalogService.getCategories).toHaveBeenCalled();
    expect(authService.refresh).toHaveBeenCalled();
  });
});
