import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/layout/PageHeader';
import { Building2, User, Phone, MapPin, Check, Database, CreditCard, LockKeyhole, Eye, EyeOff } from 'lucide-react';

const Settings = () => {
  const { showToast } = useBusiness();
  const { role, changePassword, changeManagerPassword } = useAuth();
  const [profile, setProfile] = useState({
    businessName: 'SRI AMMAN TRADERS & EARTHMOVERS',
    ownerName: 'Admin Owner',
    phone: '9876543210',
    address: 'No. 25, VIT Road, Katpadi, Vellore - 632014'
  });

  const [darkMode, setDarkMode] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [visiblePasswords, setVisiblePasswords] = useState({ current: false, next: false, confirm: false });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [managerPasswords, setManagerPasswords] = useState({ current: '', next: '', confirm: '' });
  const [visibleManagerPasswords, setVisibleManagerPasswords] = useState({ current: false, next: false, confirm: false });
  const [managerPasswordError, setManagerPasswordError] = useState('');
  const [managerPasswordSuccess, setManagerPasswordSuccess] = useState('');
  const [savingManagerPassword, setSavingManagerPassword] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    showToast('Settings saved successfully!');
  };

  const handleBackup = () => {
    showToast('Local database backup created successfully!');
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordSuccess('');
    if (passwords.next !== passwords.confirm) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (passwords.next.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }

    setSavingPassword(true);
    try {
      await changePassword(passwords.current, passwords.next);
      setPasswords({ current: '', next: '', confirm: '' });
      setPasswordSuccess('Password changed successfully.');
    } catch (error) {
      setPasswordError(error.message);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleManagerPasswordChange = async () => {
    setManagerPasswordError('');
    setManagerPasswordSuccess('');
    if (managerPasswords.next !== managerPasswords.confirm) {
      setManagerPasswordError('New manager passwords do not match.');
      return;
    }
    if (managerPasswords.next.length < 8) {
      setManagerPasswordError('New manager password must be at least 8 characters.');
      return;
    }

    setSavingManagerPassword(true);
    try {
      await changeManagerPassword(managerPasswords.current, managerPasswords.next);
      setManagerPasswords({ current: '', next: '', confirm: '' });
      setManagerPasswordSuccess('Manager password changed. The manager must sign in again.');
    } catch (error) {
      setManagerPasswordError(error.message);
    } finally {
      setSavingManagerPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      <PageHeader
        title="Portal Settings"
        subtitle="Configure business profile, payment modes, units and local database backups"
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Business Profile */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" /> Business Profile
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Business Name
              </label>
              <input
                type="text"
                value={profile.businessName}
                onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Owner Name
              </label>
              <input
                type="text"
                value={profile.ownerName}
                onChange={(e) => setProfile({ ...profile, ownerName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Registered Address
              </label>
              <input
                type="text"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Business Units */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-base font-bold text-slate-900">Configured Business Units</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['Water Supply', 'Bricks Supply', 'JCB Rental', 'Jalli Service'].map((unit) => (
              <div
                key={unit}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800"
              >
                <span>{unit}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-600" /> Accepted Payment Methods
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['Cash', 'UPI (GPay / PhonePe)', 'Bank Transfer (NEFT)', 'Cheque'].map((method) => (
              <div
                key={method}
                className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-xs font-semibold text-emerald-900 flex items-center gap-2"
              >
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{method}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Data & Local Backup */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" /> Local SQLite Backup
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Export all customer, transaction and ledger data to local JSON/SQLite format.
            </p>
          </div>

          <button
            type="button"
            onClick={handleBackup}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shrink-0"
          >
            Create Backup
          </button>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/30 transition-all"
          >
            Save All Changes
          </button>
        </div>

        {role === 'owner' && <>
        {/* Danger Zone */}
        <div className="bg-rose-50 rounded-2xl p-6 border border-rose-200 shadow-xs space-y-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-rose-600">Danger Zone</p>
            <h3 className="text-base font-bold text-rose-950 flex items-center gap-2 mt-1">
              <LockKeyhole className="w-5 h-5 text-rose-600" /> Change Password
            </h3>
            <p className="text-xs text-rose-700 mt-1">Changing your password will invalidate other active sessions.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              ['current', 'Current Password'],
              ['next', 'New Password'],
              ['confirm', 'Confirm New Password']
            ].map(([key, label]) => (
              <div key={key}>
                <label className="block text-xs font-bold text-rose-900 uppercase tracking-wider mb-1">
                  {label}
                </label>
                <div className="relative">
                  <input
                    type={visiblePasswords[key] ? 'text' : 'password'}
                    value={passwords[key]}
                    onChange={(event) => setPasswords({ ...passwords, [key]: event.target.value })}
                    className="w-full px-3.5 py-2.5 pr-10 bg-white border border-rose-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-rose-500"
                  />
                  <button
                    type="button"
                    onClick={() => setVisiblePasswords({ ...visiblePasswords, [key]: !visiblePasswords[key] })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-400 hover:text-rose-700"
                    aria-label={visiblePasswords[key] ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
                  >
                    {visiblePasswords[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {passwordError && <p className="text-xs font-bold text-rose-700">{passwordError}</p>}
          {passwordSuccess && <p className="text-xs font-bold text-emerald-700">{passwordSuccess}</p>}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handlePasswordChange}
              disabled={savingPassword}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-bold rounded-xl text-xs"
            >
              {savingPassword ? 'Updating...' : 'Change Password'}
            </button>
          </div>
        </div>
        </>}

        {role === 'owner' ? (
          <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200 shadow-xs space-y-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-amber-700">Owner Control</p>
              <h3 className="text-base font-bold text-amber-950 flex items-center gap-2 mt-1">
                <LockKeyhole className="w-5 h-5 text-amber-600" /> Change Manager Password
              </h3>
              <p className="text-xs text-amber-800 mt-1">Set a new password for the manager account. Existing manager sessions will be signed out.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                ['current', 'Your Current Password'],
                ['next', 'New Manager Password'],
                ['confirm', 'Confirm Manager Password']
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs font-bold text-amber-950 uppercase tracking-wider mb-1">{label}</label>
                  <div className="relative">
                    <input
                      type={visibleManagerPasswords[key] ? 'text' : 'password'}
                      value={managerPasswords[key]}
                      onChange={(event) => setManagerPasswords({ ...managerPasswords, [key]: event.target.value })}
                      className="w-full px-3.5 py-2.5 pr-10 bg-white border border-amber-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setVisibleManagerPasswords({ ...visibleManagerPasswords, [key]: !visibleManagerPasswords[key] })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500 hover:text-amber-800"
                      aria-label={visibleManagerPasswords[key] ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
                    >
                      {visibleManagerPasswords[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {managerPasswordError && <p className="text-xs font-bold text-rose-700">{managerPasswordError}</p>}
            {managerPasswordSuccess && <p className="text-xs font-bold text-emerald-700">{managerPasswordSuccess}</p>}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleManagerPasswordChange}
                disabled={savingManagerPassword}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-bold rounded-xl text-xs"
              >
                {savingManagerPassword ? 'Updating...' : 'Change Manager Password'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900">Password Changes</h3>
            <p className="text-xs text-slate-600 mt-1">Password changes are controlled by the owner. Please ask the owner to update your manager password.</p>
          </div>
        )}
      </form>
    </div>
  );
};

export default Settings;
