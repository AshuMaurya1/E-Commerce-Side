import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { extractErrorMessage } from '../utils/format';

export function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.fullName.trim().length < 2) {
      setError('Full name must be at least 2 characters.');
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(form.password)) {
      setError('Password must be 8+ characters and include uppercase, lowercase, and a number.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        password: form.password,
      });
      toast.success('Account created successfully');
      navigate('/', { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err, 'Registration failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <div className="rounded-sm border border-zinc-200 bg-white p-7 sm:p-8">
        <h1 className="text-xl font-semibold tracking-tight text-navy">Create your account</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Join ShopSphere to save items and track orders.
        </p>

        {error && (
          <div className="mt-4 rounded-sm border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="reg-name" className="block text-xs font-medium text-zinc-800 mb-1.5">
              Full name
            </label>
            <input
              id="reg-name"
              type="text"
              required
              value={form.fullName}
              onChange={handleChange('fullName')}
              placeholder="Aarav Mehta"
              className="w-full rounded-sm border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-navy focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-xs font-medium text-zinc-800 mb-1.5">
              Email address
            </label>
            <input
              id="reg-email"
              type="email"
              required
              value={form.email}
              onChange={handleChange('email')}
              placeholder="you@example.com"
              className="w-full rounded-sm border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-navy focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="reg-phone" className="block text-xs font-medium text-zinc-800 mb-1.5">
              Phone (optional)
            </label>
            <input
              id="reg-phone"
              type="tel"
              value={form.phone}
              onChange={handleChange('phone')}
              placeholder="9876543210"
              className="w-full rounded-sm border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-navy focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="reg-password" className="block text-xs font-medium text-zinc-800 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={form.password}
                onChange={handleChange('password')}
                placeholder="Min 8 chars (A-Z, a-z, 0-9)"
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

          <div>
            <label htmlFor="reg-confirm" className="block text-xs font-medium text-zinc-800 mb-1.5">
              Confirm password
            </label>
            <input
              id="reg-confirm"
              type={showPassword ? 'text' : 'password'}
              required
              value={form.confirmPassword}
              onChange={handleChange('confirmPassword')}
              placeholder="Repeat password"
              className="w-full rounded-sm border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-navy focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-sm bg-navy py-2.5 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 border-t border-zinc-100 pt-5 text-center text-sm text-zinc-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-emerald-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
