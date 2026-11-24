import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App.jsx';

describe('App', () => {
  it('renders ShopSphere heading', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('ShopSphere')).toBeInTheDocument();
  });
});
