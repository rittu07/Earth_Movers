import React, { useState, useEffect } from 'react';
import { X, Wallet, DollarSign, Calculator, CheckCircle2, Zap } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';

const PayStaffSalaryModal = ({ isOpen, onClose, selectedStaffMember = null }) => {
  const {
    staff = [],
    jcbJobs = [],
    transactions = [],
    driverMonthlyReports = [],
    payStaffSalary,
    showToast
  } = useBusiness();

  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [monthlySalary, setMonthlySalary] = useState(0);
  const [monthlyDeduction, setMonthlyDeduction] = useState(0);
  const [bataUnits, setBataUnits] = useState('');
  const [bataRate, setBataRate] = useState(0);
  const [bataUnitType, setBataUnitType] = useState('Per Hour');
  const [customBataAmount, setCustomBataAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (selectedStaffMember) {
      setSelectedStaffId(selectedStaffMember.id);
    } else if (staff.length > 0) {
      setSelectedStaffId(staff[0].id);
    }
  }, [selectedStaffMember, staff, isOpen]);

  useEffect(() => {
    const current = staff.find((s) => s.id === selectedStaffId);
    if (current) {
      setMonthlySalary(current.monthlySalary || 0);
      setMonthlyDeduction(current.monthlyDeduction || 0);
      setBataRate(current.bataRate || 0);
      setBataUnitType(current.bataUnit || 'Per Hour');
      setBataUnits('');
      setCustomBataAmount('');
    }
  }, [selectedStaffId, staff]);

  if (!isOpen) return null;

  const currentStaff = staff.find((s) => s.id === selectedStaffId);

  const getJcbLoggedHours = (staffMember) => {
    if (!staffMember) return 0;
    const rawName = staffMember.name.toLowerCase().trim();
    const firstName = rawName.split(' ')[0].replace('driver', '').trim() || rawName;

    // Sum hours from JCB transactions
    const trxHours = transactions
      .filter(
        (t) =>
          t.businessId === 'jcb' &&
          t.driverName &&
          t.driverName.toLowerCase().includes(firstName)
      )
      .reduce((sum, t) => sum + (Number(t.quantity) || 0), 0);

    // Sum hours from JCB jobs
    const jobHours = jcbJobs
      .filter(
        (j) => j.driverName && j.driverName.toLowerCase().includes(firstName)
      )
      .reduce((sum, j) => sum + (Number(j.duration) || Number(j.quantity) || 0), 0);

    // Get hours from driver monthly reports
    const reportObj = driverMonthlyReports.find(
      (r) => r.driverName && r.driverName.toLowerCase().includes(firstName)
    );
    const reportHours = reportObj ? Number(reportObj.monthlyHours) || 0 : 0;

    return Math.max(trxHours, jobHours, reportHours);
  };

  const loggedJcbHours = getJcbLoggedHours(currentStaff);

  const calculatedBata = customBataAmount !== ''
    ? Number(customBataAmount) || 0
    : (Number(bataUnits) || 0) * bataRate;

  const netFixedSalary = Math.max(0, monthlySalary - monthlyDeduction);
  const totalPayout = netFixedSalary + calculatedBata;
  const advanceRemainingAfter = Math.max(0, (currentStaff?.advanceRemaining || 0) - monthlyDeduction);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedStaffId) return;

    payStaffSalary({
      staffId: selectedStaffId,
      monthlySalary,
      monthlyDeduction,
      bataAmount: calculatedBata,
      paymentMethod,
      date,
      notes: notes.trim()
    });

    onClose();
  };

  const handleFetchJcbHours = () => {
    if (loggedJcbHours > 0) {
      setBataUnits(loggedJcbHours.toString());
      setCustomBataAmount('');
      if (showToast) showToast(`Fetched ${loggedJcbHours} hours directly from JCB Log for ${currentStaff?.name}!`);
    } else {
      alert(`No logged hours found in JCB logs for ${currentStaff?.name || 'this driver'}. You can type bata hours manually.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
            Pay Salary & Bata to Staff
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Select Staff */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Select Staff Member *</label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full p-2.5 bg-indigo-50 border border-indigo-200 text-indigo-950 font-black rounded-xl focus:outline-hidden cursor-pointer"
            >
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.role}) - Fixed: ₹{s.monthlySalary?.toLocaleString('en-IN')}
                </option>
              ))}
            </select>
          </div>

          {currentStaff && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between font-bold">
                <span className="text-slate-600">Upfront Advance Given:</span>
                <span className="text-slate-900">₹{(currentStaff.advanceAmount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-slate-600">Current Remaining Advance:</span>
                <span className="text-amber-700 font-extrabold">₹{(currentStaff.advanceRemaining || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}

          {/* Fixed Salary Breakdown */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Fixed Monthly Salary (₹)</label>
              <input
                type="number"
                value={monthlySalary}
                onChange={(e) => setMonthlySalary(Number(e.target.value) || 0)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-rose-700 mb-1">Advance Deduction (₹)</label>
              <input
                type="number"
                value={monthlyDeduction}
                onChange={(e) => setMonthlyDeduction(Number(e.target.value) || 0)}
                className="w-full p-2.5 bg-rose-50 border border-rose-200 rounded-xl font-bold text-rose-800 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Bata Section with JCB Log Fetch Button */}
          <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-1.5">
              <h4 className="font-extrabold text-emerald-950 text-xs">
                🚜 Bata Calculation ({bataRate ? `₹${bataRate}/${bataUnitType}` : 'No Bata'})
              </h4>
              <button
                type="button"
                onClick={handleFetchJcbHours}
                className="text-[11px] font-black text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                title="Fetch total operating hours directly from JCB job logs"
              >
                <Zap className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
                Fetch from JCB Log {loggedJcbHours > 0 ? `(${loggedJcbHours} hrs)` : ''}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-emerald-900 text-[11px] mb-1">
                  Bata Units ({bataUnitType})
                </label>
                <input
                  type="number"
                  placeholder="e.g. 50"
                  value={bataUnits}
                  onChange={(e) => {
                    setBataUnits(e.target.value);
                    setCustomBataAmount('');
                  }}
                  className="w-full p-2 bg-white border border-emerald-300 rounded-xl font-bold text-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-emerald-900 text-[11px] mb-1">
                  Total Bata (₹)
                </label>
                <input
                  type="number"
                  placeholder={bataRate * (Number(bataUnits) || 0) || '0'}
                  value={customBataAmount !== '' ? customBataAmount : calculatedBata || ''}
                  onChange={(e) => setCustomBataAmount(e.target.value)}
                  className="w-full p-2 bg-white border border-emerald-300 rounded-xl font-black text-emerald-800 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Net Calculation Highlight Box */}
          <div className="bg-indigo-600 text-white p-3.5 rounded-2xl space-y-1.5 shadow-md shadow-indigo-600/20">
            <div className="flex justify-between items-center text-xs opacity-90 font-medium">
              <span>Net Fixed Salary (₹{monthlySalary} - ₹{monthlyDeduction}):</span>
              <span className="font-bold">₹{netFixedSalary.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center text-xs opacity-90 font-medium">
              <span>Bata Amount:</span>
              <span className="font-bold">₹{calculatedBata.toLocaleString('en-IN')}</span>
            </div>
            <div className="border-t border-indigo-500 pt-1.5 flex justify-between items-center font-black text-sm">
              <span>Net Total Payout:</span>
              <span className="text-base text-yellow-300">₹{totalPayout.toLocaleString('en-IN')}</span>
            </div>
            {monthlyDeduction > 0 && (
              <p className="text-[10px] text-indigo-200 pt-0.5">
                • Remaining advance will reduce to ₹{advanceRemainingAfter.toLocaleString('en-IN')} after payout.
              </p>
            )}
          </div>

          {/* Date & Payment Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden cursor-pointer"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI / GPay</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Notes</label>
            <input
              type="text"
              placeholder="e.g. August 2026 Monthly Salary Payout"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Record Salary Payout
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PayStaffSalaryModal;
