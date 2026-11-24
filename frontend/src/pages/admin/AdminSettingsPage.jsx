import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { accountService } from '../../services/orderService';
import { extractErrorMessage } from '../../utils/format';

export function AdminSettingsPage() {
  const { user, refreshProfile } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
  });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await accountService.updateProfile(profile);
      await refreshProfile();
      toast.success('Administrator profile updated');
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
      await accountService.changePassword(passwords);
      setPasswords({ currentPassword: '', newPassword: '' });
      toast.success('Administrator password updated');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Settings</h1>
        <p className="text-sm text-zinc-500">Administrator account preferences and store configuration overview.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSaveProfile} className="rounded-sm border border-zinc-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-navy">Admin Account</h2>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Email</label>
            <input
              disabled
              value={user?.email || ''}
              className="w-full rounded-sm border border-zinc-200 bg-surface px-3 py-2 text-sm text-zinc-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Full Name</label>
            <input
              required
              value={profile.fullName}
              onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
              className="w-full rounded-sm border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Phone</label>
            <input
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="w-full rounded-sm border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={savingProfile}
            className="rounded-sm bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-50"
          >
            {savingProfile ? 'Saving...' : 'Save Profile'}
          </button>
        </form>

        <form onSubmit={handleChangePassword} className="rounded-sm border border-zinc-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-navy">Update Password</h2>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              className="w-full rounded-sm border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">New Password</label>
            <input
              type="password"
              required
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              className="w-full rounded-sm border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={savingPw}
            className="rounded-sm bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-50"
          >
            {savingPw ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </div>

      <div className="rounded-sm border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-navy mb-3">Platform Rules</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="rounded bg-surface p-3.5">
            <dt className="text-xs text-zinc-500">Free Shipping Threshold</dt>
            <dd className="mt-1 font-semibold text-navy">₹999</dd>
          </div>
          <div className="rounded bg-surface p-3.5">
            <dt className="text-xs text-zinc-500">Flat Shipping Fee</dt>
            <dd className="mt-1 font-semibold text-navy">₹79</dd>
          </div>
          <div className="rounded bg-surface p-3.5">
            <dt className="text-xs text-zinc-500">Unpaid Order Expiry</dt>
            <dd className="mt-1 font-semibold text-navy">15 minutes</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
