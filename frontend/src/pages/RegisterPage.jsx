import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-md border border-zinc-200 bg-white p-7">
        <h1 className="text-xl font-semibold text-navy">Create your account</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Join ShopSphere to save items and track orders.
        </p>

        {error && (
          <div className="mt-4 rounded border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="reg-name" className="block text-sm font-medium text-zinc-800 mb-1">
              Full name
            </label>
            <input
              id="reg-name"
              type="text"
              required
              value={form.fullName}
              onChange={handleChange('fullName')}
              placeholder="Aarav Mehta"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-navy focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-zinc-800 mb-1">
              Email address
            </label>
            <input
              id="reg-email"
              type="email"
              required
              value={form.email}
              onChange={handleChange('email')}
              placeholder="you@example.com"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-navy focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="reg-phone" className="block text-sm font-medium text-zinc-800 mb-1">
              Phone (optional)
            </label>
            <input
              id="reg-phone"
              type="tel"
              value={form.phone}
              onChange={handleChange('phone')}
              placeholder="9876543210"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-navy focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium text-zinc-800 mb-1">
              Password
            </label>
            <input
              id="reg-password"
              type="password"
              required
              value={form.password}
              onChange={handleChange('password')}
              placeholder="Minimum 8 chars (A-Z, a-z, 0-9)"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-navy focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="reg-confirm" className="block text-sm font-medium text-zinc-800 mb-1">
              Confirm password
            </label>
            <input
              id="reg-confirm"
              type="password"
              required
              value={form.confirmPassword}
              onChange={handleChange('confirmPassword')}
              placeholder="Repeat password"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-navy focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-navy py-2.5 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-emerald-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
