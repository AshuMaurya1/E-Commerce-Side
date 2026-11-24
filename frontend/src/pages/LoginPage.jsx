import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { extractErrorMessage } from '../utils/format';

export function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setSubmitting(true);
    try {
      const user = await login({ email: email.trim(), password });
      toast.success(`Welcome back, ${user.fullName.split(' ')[0]}`);
      if (user.role === 'ADMIN' && from === '/') {
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Invalid email or password'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:py-20">
      <div className="rounded-sm border border-zinc-200 bg-white p-7 sm:p-8">
        <h1 className="text-xl font-semibold tracking-tight text-navy">Sign in to ShopSphere</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Access your orders, saved addresses, and wishlist.
        </p>

        {error && (
          <div className="mt-4 rounded-sm border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs font-medium text-zinc-800 mb-1.5">
              Email address
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-sm border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-navy focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-xs font-medium text-zinc-800 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-sm border border-zinc-300 bg-white px-3 py-2 pr-10 text-sm focus:border-navy focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-sm bg-navy py-2.5 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 border-t border-zinc-100 pt-5 text-center text-sm text-zinc-600">
          New to ShopSphere?{' '}
          <Link to="/register" className="font-medium text-emerald-700 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
