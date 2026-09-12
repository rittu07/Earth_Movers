import React, { useState, useEffect, useMemo } from 'react';
import { X, Wallet, DollarSign, Calculator, CheckCircle2, Zap, Calendar, Info, Clock, Check } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';

const PayStaffSalaryModal = ({ isOpen, onClose, selectedStaffMember = null }) => {
  const {
    staff = [],
    jcbJobs = [],
    transactions = [],
    drivingHours = [],
    driverMonthlyReports = [],
    payStaffSalary,
    getStaffSalaryPaidForMonth,
    showToast
  } = useBusiness();

  // Generate salary months list (past 5 months, current, next month)
  const salaryMonths = useMemo(() => {
    const list = [];
    const now = new Date();
    for (let i = -5; i <= 1; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      list.push({ key, label });
    }
    return list.reverse();
  }, []);

  // Default to previous month if first 10 days of current month, else current month
  const getDefaultSalaryMonth = () => {
    const now = new Date();
    const targetDate = now.getDate() <= 10
      ? new Date(now.getFullYear(), now.getMonth() - 1, 1)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    return `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
  };

  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [salaryMonth, setSalaryMonth] = useState(getDefaultSalaryMonth());
  const [salaryPaidNow, setSalaryPaidNow] = useState('');
  const [monthlyDeduction, setMonthlyDeduction] = useState(0);

  // Bata fields (owner enters amount/rate, data fetched from driver JCB log)
  const [bataUnits, setBataUnits] = useState('');
  const [bataRate, setBataRate] = useState(0);
  const [bataUnitType, setBataUnitType] = useState('Per Hour');
  const [totalBataAmount, setTotalBataAmount] = useState(0);

  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [userEditedNotes, setUserEditedNotes] = useState(false);

  useEffect(() => {
    if (selectedStaffMember) {
      setSelectedStaffId(selectedStaffMember.id);
    } else if (staff.length > 0 && !selectedStaffId) {
      setSelectedStaffId(staff[0].id);
    }
  }, [selectedStaffMember, staff, isOpen]);

  const currentStaff = staff.find((s) => s.id === selectedStaffId);
  const selectedMonthObj = salaryMonths.find((m) => m.key === salaryMonth) || { key: salaryMonth, label: salaryMonth };

  // Calculate already paid for this staff member in this month
  const alreadyPaidForMonth = useMemo(() => {
    if (!selectedStaffId || !salaryMonth || !getStaffSalaryPaidForMonth) return 0;
    return getStaffSalaryPaidForMonth(selectedStaffId, salaryMonth);
  }, [selectedStaffId, salaryMonth, getStaffSalaryPaidForMonth]);

  const fullMonthlySalary = currentStaff?.monthlySalary || 0;
  const remainingSalaryForMonth = Math.max(0, fullMonthlySalary - alreadyPaidForMonth);
  const halfSalary = Math.round(fullMonthlySalary / 2);

  // Sync state when staff or selected month changes
  useEffect(() => {
    if (currentStaff) {
      setMonthlyDeduction(currentStaff.monthlyDeduction || 0);
      const staffRate = currentStaff.bataRate || 0;
      setBataRate(staffRate);
      setBataUnitType(currentStaff.bataUnit || 'Per Hour');
      setBataUnits('');
      setTotalBataAmount(0);
      // Default amount paying now to remaining salary for the month
      setSalaryPaidNow(remainingSalaryForMonth > 0 ? remainingSalaryForMonth : fullMonthlySalary);
      setUserEditedNotes(false);
    }
  }, [selectedStaffId, salaryMonth, remainingSalaryForMonth, fullMonthlySalary]);

  // Update default notes automatically if user hasn't manually edited them
  useEffect(() => {
    if (!userEditedNotes && selectedMonthObj) {
      const numNow = Number(salaryPaidNow) || 0;
      if (numNow > 0 && numNow < remainingSalaryForMonth) {
        setNotes(`${selectedMonthObj.label} Mid-Month / Partial Salary`);
      } else {
        setNotes(`${selectedMonthObj.label} Salary Payout`);
      }
    }
  }, [salaryPaidNow, remainingSalaryForMonth, selectedMonthObj, userEditedNotes]);

  // Driver JCB Log Fetcher
  const driverJcbLogData = useMemo(() => {
    if (!currentStaff) return null;
    const rawName = currentStaff.name.toLowerCase().trim();
    const firstName = rawName.split(' ')[0].replace('driver', '').trim() || rawName;
    const monthKey = selectedMonthObj?.key || '';
    const monthLabel = selectedMonthObj?.label || '';

    const matchingDrivingHours = drivingHours.filter((record) => {
      const sameDriver = record.staffId === currentStaff.id || (record.driverName || '').toLowerCase().includes(firstName);
      return sameDriver && String(record.date || '').startsWith(monthKey);
    });
    const recordedHours = matchingDrivingHours.reduce((sum, record) => sum + (Number(record.duration) || 0), 0);

    // Transactions
    const matchingTrxs = transactions.filter((t) => {
      if (t.businessId !== 'jcb') return false;
      const dName = (t.driverName || '').toLowerCase();
      const nameMatch = dName.includes(firstName) || firstName.includes(dName.split(' ')[0]);
      if (!nameMatch) return false;
      if (monthKey && t.date && !t.date.startsWith(monthKey)) return false;
      return true;
    });

    const trxHours = matchingTrxs.reduce((sum, t) => sum + (Number(t.quantity) || 0), 0);
    const trxBata = matchingTrxs.reduce((sum, t) => sum + (Number(t.driverAmount) || 0), 0);

    // Jobs
    const matchingJobs = jcbJobs.filter((j) => {
      const dName = (j.driverName || '').toLowerCase();
      const nameMatch = dName.includes(firstName) || firstName.includes(dName.split(' ')[0]);
      return nameMatch && (!j.date || j.date.startsWith(monthKey));
    });

    const jobHours = matchingJobs.reduce((sum, j) => sum + (Number(j.duration) || Number(j.quantity) || 0), 0);
    const jobBata = matchingJobs.reduce((sum, j) => sum + (Number(j.driverAmount) || 0), 0);

    // Driver Monthly Reports
    const matchingReport = driverMonthlyReports.find((r) => {
      const dName = (r.driverName || '').toLowerCase();
      const nameMatch = dName.includes(firstName) || firstName.includes(dName.split(' ')[0]);
      if (!nameMatch) return false;
      if (r.month && monthLabel && r.month.toLowerCase().includes(monthLabel.toLowerCase().split(' ')[0])) return true;
      return true;
    });

    const reportHours = matchingReport ? Number(matchingReport.monthlyHours) || 0 : 0;
    const totalHours = Math.max(recordedHours, reportHours, trxHours, jobHours);
    const totalBataFromLog = trxBata + jobBata;
    const vehicle = matchingReport?.jcbVehicle || matchingTrxs[0]?.jcbVehicle || matchingJobs[0]?.jcbVehicle || '';

    if (totalHours === 0 && totalBataFromLog === 0 && !matchingReport) return null;

    return {
      hours: totalHours,
      loggedBata: totalBataFromLog,
      workingDays: matchingReport?.workingDays,
      vehicle,
      matchingJobsCount: matchingJobs.length + matchingTrxs.length
    };
  }, [currentStaff, selectedMonthObj, transactions, jcbJobs, drivingHours, driverMonthlyReports]);

  if (!isOpen) return null;

  const currentPayingSalary = Number(salaryPaidNow) || 0;
  const netFixedSalary = Math.max(0, currentPayingSalary - monthlyDeduction);
  const bataPayout = Number(totalBataAmount) || 0;
  const totalPayout = netFixedSalary + bataPayout;
  const advanceRemainingAfter = Math.max(0, (currentStaff?.advanceRemaining || 0) - monthlyDeduction);
  const remainingSalaryAfterPayout = Math.max(0, remainingSalaryForMonth - currentPayingSalary);
  const isPartialPayment = currentPayingSalary < remainingSalaryForMonth && currentPayingSalary > 0;

  const handleFetchJcbData = () => {
    if (driverJcbLogData && (driverJcbLogData.hours > 0 || driverJcbLogData.loggedBata > 0)) {
      const fetchedHours = driverJcbLogData.hours || 0;
      setBataUnits(fetchedHours > 0 ? fetchedHours.toString() : '');

      // Calculate or set total bata amount
      const currentRate = Number(bataRate) || 0;
      if (currentRate > 0 && fetchedHours > 0) {
        setTotalBataAmount(fetchedHours * currentRate);
      } else if (driverJcbLogData.loggedBata > 0) {
        setTotalBataAmount(driverJcbLogData.loggedBata);
      } else {
        setTotalBataAmount(0);
      }

      if (showToast) {
        showToast(`Fetched ${fetchedHours} hrs from JCB Log for ${currentStaff?.name}!`);
      }
    } else {
      alert(`No logged records found in JCB logs for ${currentStaff?.name || 'this driver'} in ${selectedMonthObj.label}. You can enter the rate and amount manually.`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedStaffId) return;

    payStaffSalary({
      staffId: selectedStaffId,
      salaryPaidNow: currentPayingSalary,
      monthlySalary: fullMonthlySalary,
      remainingBeforePayout: remainingSalaryForMonth,
      remainingSalaryForMonth: remainingSalaryAfterPayout,
      monthlyDeduction: Number(monthlyDeduction) || 0,
      bataAmount: bataPayout,
      salaryMonth: salaryMonth,
      salaryMonthLabel: selectedMonthObj.label,
      isPartialSalary: isPartialPayment,
      paymentMethod,
      date,
      notes: notes.trim()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-600" />
              Pay Salary & Bata to Staff
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Full settlement, half amount, or mid-month interim payment in a single view
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Select Staff & Salary Month */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Salary For Month *
              </label>
              <div className="relative">
                <select
                  value={salaryMonth}
                  onChange={(e) => setSalaryMonth(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 text-slate-900 font-bold rounded-xl focus:outline-hidden cursor-pointer"
                >
                  {salaryMonths.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Upfront Advance Overview if applicable */}
          {currentStaff && (currentStaff.advanceRemaining > 0 || currentStaff.advanceAmount > 0) && (
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
              <span className="text-slate-600 font-medium">Upfront Advance Balance:</span>
              <span className="text-amber-700 font-extrabold">
                ₹{(currentStaff.advanceRemaining || 0).toLocaleString('en-IN')}
              </span>
            </div>
          )}

          {/* Month Status & Salary Payment Section */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
            {/* Month Breakdown Bar */}
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/80">
              <div>
                <span className="text-[11px] text-slate-500 font-semibold block">Monthly Base</span>
                <span className="font-extrabold text-slate-900">₹{fullMonthlySalary.toLocaleString('en-IN')}</span>
              </div>
              {alreadyPaidForMonth > 0 ? (
                <div className="text-center">
                  <span className="text-[11px] text-amber-700 font-semibold block">Already Paid</span>
                  <span className="font-extrabold text-amber-700">₹{alreadyPaidForMonth.toLocaleString('en-IN')}</span>
                </div>
              ) : null}
              <div className="text-right">
                <span className="text-[11px] text-emerald-700 font-semibold block">Remaining Unpaid</span>
                <span className="font-black text-emerald-700">₹{remainingSalaryForMonth.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Salary Amount to Pay Now + Advance Deduction */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Salary Amount to Pay (₹)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={salaryPaidNow}
                  onChange={(e) => setSalaryPaidNow(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-black text-slate-900 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-rose-700 mb-1">
                  Advance Deduction (₹)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={monthlyDeduction}
                  onChange={(e) => setMonthlyDeduction(Number(e.target.value) || 0)}
                  className="w-full p-2.5 bg-rose-50/70 border border-rose-200 rounded-xl font-bold text-rose-800 focus:outline-hidden focus:border-rose-400"
                />
              </div>
            </div>

            {/* Quick 1-Click Amount Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[11px] text-slate-500 font-bold mr-1">Quick:</span>
              <button
                type="button"
                onClick={() => setSalaryPaidNow(remainingSalaryForMonth)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                  Number(salaryPaidNow) === remainingSalaryForMonth && remainingSalaryForMonth > 0
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                Full Remaining (₹{remainingSalaryForMonth.toLocaleString('en-IN')})
              </button>

              <button
                type="button"
                onClick={() => setSalaryPaidNow(halfSalary)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                  Number(salaryPaidNow) === halfSalary
                    ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                Half / 50% (₹{halfSalary.toLocaleString('en-IN')})
              </button>
            </div>

            {/* Dynamic Real-Time Status Pill */}
            {currentPayingSalary > 0 && (
              <div className="pt-1">
                {isPartialPayment ? (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                    <span>
                      Mid-Month / In-between Payment • <strong>₹{remainingSalaryAfterPayout.toLocaleString('en-IN')}</strong> will remain unpaid for {selectedMonthObj.label}
                    </span>
                  </div>
                ) : currentPayingSalary >= remainingSalaryForMonth ? (
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    <span>
                      Full Settlement • {selectedMonthObj.label} base salary will be fully cleared!
                    </span>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Bata Section with Owner Amount & Fetch from Driver JCB Log */}
          <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-1.5">
              <div>
                <h4 className="font-extrabold text-emerald-950 text-xs flex items-center gap-1.5">
                  🚜 Driver Bata Calculation
                </h4>
                <p className="text-[10px] text-emerald-700 font-medium">
                  Set bata rate/amount or fetch directly from driver's JCB Log
                </p>
              </div>

              <button
                type="button"
                onClick={handleFetchJcbData}
                className="text-[11px] font-black text-indigo-700 bg-white hover:bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                title="Fetch operating hours directly from JCB job logs"
              >
                <Zap className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
                Fetch from JCB Log {driverJcbLogData?.hours ? `(${driverJcbLogData.hours} hrs)` : ''}
              </button>
            </div>

            {/* JCB Log Live Info Badge if data exists */}
            {driverJcbLogData && (
              <div className="bg-white/90 p-2 rounded-xl border border-emerald-200 text-[11px] flex items-center justify-between flex-wrap gap-1.5">
                <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>JCB Log ({selectedMonthObj.label}):</span>
                  <strong className="text-indigo-900 font-black">{driverJcbLogData.hours} hrs</strong>
                  {driverJcbLogData.vehicle && (
                    <span className="text-slate-500 text-[10px]">({driverJcbLogData.vehicle.split(' ')[0]})</span>
                  )}
                </div>
                {bataUnits !== driverJcbLogData.hours?.toString() && (
                  <button
                    type="button"
                    onClick={handleFetchJcbData}
                    className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 underline cursor-pointer"
                  >
                    Use {driverJcbLogData.hours} hrs
                  </button>
                )}
              </div>
            )}

            {/* Bata Fields: Rate, Units, and Owner Total Amount */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-bold text-emerald-900 text-[11px] mb-1">
                  Rate (₹/{bataUnitType.toLowerCase().replace('per ', '')})
                </label>
                <input
                  type="number"
                  placeholder="e.g. 100"
                  value={bataRate}
                  onChange={(e) => {
                    const newRate = Number(e.target.value) || 0;
                    setBataRate(newRate);
                    const units = Number(bataUnits) || 0;
                    setTotalBataAmount(newRate * units);
                  }}
                  className="w-full p-2 bg-white border border-emerald-300 rounded-xl font-bold text-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-emerald-900 text-[11px] mb-1">
                  Units ({bataUnitType})
                </label>
                <input
                  type="number"
                  placeholder="e.g. 138"
                  value={bataUnits}
                  onChange={(e) => {
                    const newUnits = e.target.value;
                    setBataUnits(newUnits);
                    const rate = Number(bataRate) || 0;
                    setTotalBataAmount((Number(newUnits) || 0) * rate);
                  }}
                  className="w-full p-2 bg-white border border-emerald-300 rounded-xl font-bold text-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-emerald-900 text-[11px] mb-1">
                  Total Bata (₹) *
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={totalBataAmount}
                  onChange={(e) => setTotalBataAmount(e.target.value === '' ? '' : Number(e.target.value) || 0)}
                  className="w-full p-2 bg-white border border-emerald-400 rounded-xl font-black text-emerald-900 focus:outline-hidden focus:border-emerald-600 shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Net Calculation Highlight Box */}
          <div className="bg-indigo-600 text-white p-3.5 rounded-2xl space-y-1.5 shadow-md shadow-indigo-600/20">
            <div className="flex justify-between items-center text-xs opacity-90 font-medium">
              <span>Salary Paying Now:</span>
              <span className="font-bold">₹{currentPayingSalary.toLocaleString('en-IN')}</span>
            </div>
            {monthlyDeduction > 0 && (
              <div className="flex justify-between items-center text-xs opacity-90 font-medium text-rose-200">
                <span>Advance Deduction:</span>
                <span className="font-bold">-₹{monthlyDeduction.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-xs opacity-90 font-medium">
              <span>Bata Amount:</span>
              <span className="font-bold">₹{bataPayout.toLocaleString('en-IN')}</span>
            </div>
            <div className="border-t border-indigo-500 pt-1.5 flex justify-between items-center font-black text-sm">
              <span>Net Total Payout:</span>
              <span className="text-base text-yellow-300">₹{totalPayout.toLocaleString('en-IN')}</span>
            </div>

            {isPartialPayment && (
              <p className="text-[10px] text-amber-200 pt-0.5 font-semibold">
                • Mid-month partial payment. Remaining balance for {selectedMonthObj.label}: ₹{remainingSalaryAfterPayout.toLocaleString('en-IN')}
              </p>
            )}
            {monthlyDeduction > 0 && (
              <p className="text-[10px] text-indigo-200 pt-0.5">
                • Upfront advance will reduce to ₹{advanceRemainingAfter.toLocaleString('en-IN')} after payout.
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

          {/* Notes */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Notes</label>
            <input
              type="text"
              placeholder={`e.g. ${selectedMonthObj.label} Salary Payout`}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setUserEditedNotes(true);
              }}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden"
            />
          </div>

          {/* Form Actions */}
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
