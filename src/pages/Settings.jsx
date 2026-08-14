import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import PageHeader from '../components/layout/PageHeader';
import { Building2, User, Phone, MapPin, Check, Database, Moon, Sun, CreditCard } from 'lucide-react';

const Settings = () => {
  const { showToast } = useBusiness();
  const [profile, setProfile] = useState({
    businessName: 'SRI AMMAN TRADERS & EARTHMOVERS',
    ownerName: 'Admin Owner',
    phone: '9876543210',
    address: 'No. 25, VIT Road, Katpadi, Vellore - 632014'
  });

  const [darkMode, setDarkMode] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    showToast('Settings saved successfully!');
  };

  const handleBackup = () => {
    showToast('Local database backup created successfully!');
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
      </form>
    </div>
  );
};

export default Settings;
