import React, { useRef, useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/layout/PageHeader';
import { Building2, User, Phone, MapPin, Check, Database, CreditCard, LockKeyhole, Eye, EyeOff, Download, Upload } from 'lucide-react';
import { exportBusinessWorkbook, importBusinessWorkbook } from '../utils/excelBackup';
import { DEFAULT_APP_FONT_SETTINGS, loadAppFontSettings, saveAppFontSettings } from '../utils/appSettings';

const Settings = () => {
  const { showToast, syncNow } = useBusiness();
  const { role, changePassword, changeManagerPassword } = useAuth();
  const [profile, setProfile] = useState({
    businessName: 'SRI AMMAN TRADERS & EARTHMOVERS',
    ownerName: 'Admin Owner',
    phone: '9876543210',
    address: 'No. 25, VIT Road, Katpadi, Vellore - 632014'
  });

  const [darkMode, setDarkMode] = useState(false);
  const [fontSettings, setFontSettings] = useState(loadAppFontSettings);
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
  const [backupBusy, setBackupBusy] = useState(false);
  const [backupMessage, setBackupMessage] = useState('');
  const [backupError, setBackupError] = useState('');
  const [backupDialog, setBackupDialog] = useState(null);
  const [backupPassword, setBackupPassword] = useState('');
  const [backupPasswordConfirm, setBackupPasswordConfirm] = useState('');
  const [pendingBackupFile, setPendingBackupFile] = useState(null);
  const importInputRef = useRef(null);

  const updateFontSetting = (device, value) => {
    const nextSettings = { ...fontSettings, [device]: Number(value) };
    setFontSettings(nextSettings);
    saveAppFontSettings(nextSettings);
  };

  const resetFontSettings = () => {
    const defaultSettings = { ...DEFAULT_APP_FONT_SETTINGS };
    setFontSettings(defaultSettings);
    saveAppFontSettings(defaultSettings);
  };

  const handleSave = (e) => {
    e.preventDefault();
    showToast('Settings saved successfully!');
  };

  const openExportBackup = () => {
    setBackupError('');
    setBackupMessage('');
    setBackupPassword('');
    setBackupPasswordConfirm('');
    setBackupDialog('export');
  };

  const handleImportFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBackupError('');
    setBackupMessage('');
    setBackupPassword('');
    setBackupPasswordConfirm('');
    setPendingBackupFile(file);
    setBackupDialog('import');
  };

  const closeBackupDialog = () => {
    setBackupDialog(null);
    setBackupPassword('');
    setBackupPasswordConfirm('');
    setPendingBackupFile(null);
  };

  const handleBackup = async (event) => {
    event?.preventDefault();
    setBackupError('');
    setBackupMessage('');
    if (backupPassword.length < 10) {
      setBackupError('Backup password must be at least 10 characters.');
      return;
    }
    if (backupDialog === 'export' && backupPassword !== backupPasswordConfirm) {
      setBackupError('Backup passwords do not match.');
      return;
    }
    setBackupBusy(true);
    try {
      if (backupDialog === 'export') {
        const rowCount = await exportBusinessWorkbook({ role, password: backupPassword });
        setBackupMessage(`Encrypted backup downloaded with ${rowCount} records.`);
      } else {
        const result = await importBusinessWorkbook(pendingBackupFile, { role, syncNow, password: backupPassword });
        setBackupMessage(`Imported ${result.importedRows} records from the encrypted backup.`);
        showToast('Encrypted backup imported successfully!');
      }
      closeBackupDialog();
    } catch (error) {
      setBackupError(error.message || 'Could not create the Excel backup.');
    } finally {
      setBackupBusy(false);
    }
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

         {/* Appearance */}
         <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
           <div>
             <h3 className="text-base font-bold text-slate-900">Appearance</h3>
             <p className="text-xs text-slate-500 mt-1">Adjust the overall text size independently for desktop and mobile screens.</p>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             {[
               ['desktop', 'Desktop Font Size'],
               ['mobile', 'Mobile Font Size']
             ].map(([device, label]) => (
               <label key={device} className="block">
                 <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">{label}</span>
                 <select
                   value={fontSettings[device]}
                   onChange={(event) => updateFontSetting(device, event.target.value)}
                   className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-indigo-500"
                 >
                   {[14, 15, 16, 17, 18, 20].map((size) => <option key={size} value={size}>{size}px</option>)}
                 </select>
               </label>
             ))}
           </div>
           <div className="flex justify-end">
             <button type="button" onClick={resetFontSettings} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">Reset font sizes</button>
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

         {/* Data & Excel Backup */}
         <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
             <div>
             <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
               <Database className="w-5 h-5 text-indigo-600" /> Excel Business Backup
             </h3>
             <p className="text-xs text-slate-500 mt-0.5">
               Each business table is exported as a separate worksheet. Import uses merge/upsert by record ID.
             </p>
             </div>

             <div className="flex flex-wrap gap-2 shrink-0">
               <button
                 type="button"
                onClick={openExportBackup}
                 disabled={backupBusy}
                 className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
               >
                  <Download className="w-4 h-4" /> Export Secure Backup
               </button>
               <button
                 type="button"
                  onClick={() => importInputRef.current?.click()}
                 disabled={backupBusy}
                 className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
               >
                  <Upload className="w-4 h-4" /> Import Secure Backup
                </button>
                <input ref={importInputRef} type="file" accept=".embackup,application/octet-stream" onChange={handleImportFile} className="hidden" />
             </div>
           </div>
             <p className="text-[11px] text-slate-500">Backups are encrypted with your backup password and cannot be opened in Excel. Authentication, sync metadata, encryption keys, and dashboard totals are excluded. Finance Loans are included for owners only.</p>
           {backupMessage && <p className="text-xs font-bold text-emerald-700">{backupMessage}</p>}
           {backupError && <p className="text-xs font-bold text-rose-700">{backupError}</p>}
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

      {backupDialog && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 space-y-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <LockKeyhole className="w-5 h-5 text-indigo-600" />
                {backupDialog === 'export' ? 'Protect Backup' : 'Unlock Backup'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {backupDialog === 'export'
                  ? 'Use at least 10 characters. This password is required to restore the backup and cannot be recovered.'
                  : `Enter the password used for ${pendingBackupFile?.name || 'this backup'}.`}
              </p>
            </div>
            <input
              type="password"
              autoFocus
              required
              value={backupPassword}
              onChange={(event) => setBackupPassword(event.target.value)}
              placeholder="Backup password"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-indigo-500"
            />
            {backupDialog === 'export' && (
              <input
                type="password"
                required
                value={backupPasswordConfirm}
                onChange={(event) => setBackupPasswordConfirm(event.target.value)}
                placeholder="Confirm backup password"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-indigo-500"
              />
            )}
            {backupError && <p className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">{backupError}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={closeBackupDialog} disabled={backupBusy} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 text-slate-700 font-bold rounded-xl text-xs">
                Cancel
              </button>
              <button type="button" onClick={handleBackup} disabled={backupBusy} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold rounded-xl text-xs">
                {backupBusy ? 'Processing...' : backupDialog === 'export' ? 'Encrypt & Export' : 'Unlock & Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
