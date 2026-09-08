import React, { useState, useEffect } from 'react';
import { X, UserCheck, DollarSign, Wallet } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';

const STAFF_ROLES = [
  'JCB Driver',
  'Lorry Driver',
  'Manager',
  'Supervisor',
  'JCB Operator',
  'Helper',
  'Mechanic',
  'Other'
];

const AddEditStaffModal = ({ isOpen, onClose, staffToEdit = null }) => {
  const { addStaff, updateStaff } = useBusiness();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('JCB Driver');
  const [monthlySalary, setMonthlySalary] = useState('');
  const [bataRate, setBataRate] = useState('');
  const [bataUnit, setBataUnit] = useState('Per Hour');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [monthlyDeduction, setMonthlyDeduction] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (staffToEdit) {
      setName(staffToEdit.name || '');
      setPhone(staffToEdit.phone || '');
      setRole(staffToEdit.role || 'JCB Driver');
      setMonthlySalary(staffToEdit.monthlySalary ? staffToEdit.monthlySalary.toString() : '');
      setBataRate(staffToEdit.bataRate ? staffToEdit.bataRate.toString() : '');
      setBataUnit(staffToEdit.bataUnit || 'Per Hour');
      setAdvanceAmount(staffToEdit.advanceAmount ? staffToEdit.advanceAmount.toString() : '');
      setMonthlyDeduction(staffToEdit.monthlyDeduction ? staffToEdit.monthlyDeduction.toString() : '');
      setNotes(staffToEdit.notes || '');
    } else {
      setName('');
      setPhone('');
      setRole('JCB Driver');
      setMonthlySalary('25000');
      setBataRate('100');
      setBataUnit('Per Hour');
      setAdvanceAmount('0');
      setMonthlyDeduction('0');
      setNotes('');
    }
  }, [staffToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const salNum = Number(monthlySalary) || 0;
    const dedNum = Number(monthlyDeduction) || 0;
    const advNum = Number(advanceAmount) || 0;

    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      role,
      monthlySalary: salNum,
      bataRate: Number(bataRate) || 0,
      bataUnit,
      advanceAmount: advNum,
      monthlyDeduction: dedNum,
      advanceRemaining: staffToEdit ? staffToEdit.advanceRemaining : advNum,
      notes: notes.trim()
    };

    if (staffToEdit) {
      updateStaff(staffToEdit.id, payload);
    } else {
      addStaff(payload);
    }

    onClose();
  };

  const calculatedNetSalary = Math.max(0, (Number(monthlySalary) || 0) - (Number(monthlyDeduction) || 0));

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            {staffToEdit ? 'Edit Staff Member' : 'Add New Staff / Driver'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Staff Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Driver Perumal"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Mobile Phone *</label>
              <input
                type="tel"
                required
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Role / Designation *</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-2.5 bg-indigo-50 border border-indigo-200 text-indigo-950 font-black rounded-xl focus:outline-hidden cursor-pointer"
            >
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Salary & Bata Box */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" /> Fixed Monthly Salary & Bata
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Monthly Salary (₹)</label>
                <input
                  type="number"
                  placeholder="25000"
                  value={monthlySalary}
                  onChange={(e) => setMonthlySalary(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bata Rate (₹)</label>
                <input
                  type="number"
                  placeholder="100"
                  value={bataRate}
                  onChange={(e) => setBataRate(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bata Unit</label>
                <select
                  value={bataUnit}
                  onChange={(e) => setBataUnit(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-hidden cursor-pointer"
                >
                  <option value="Per Hour">Per Hour</option>
                  <option value="Per Day">Per Day</option>
                  <option value="Per Trip">Per Trip</option>
                </select>
              </div>
            </div>
          </div>

          {/* Advance & Monthly Deduction Box */}
          <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200 space-y-3">
            <h4 className="font-extrabold text-amber-900 text-xs flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-amber-700" /> Upfront Advance & Monthly Reduction
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-amber-900 mb-1">Upfront Advance Loan (₹)</label>
                <input
                  type="number"
                  placeholder="100000"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  className="w-full p-2.5 bg-white border border-amber-300 rounded-xl font-bold text-slate-900 focus:outline-hidden"
                />
                <span className="text-[10px] text-amber-700 font-medium">Initial lump sum advance given</span>
              </div>

              <div>
                <label className="block font-bold text-amber-900 mb-1">Monthly Salary Deduction (₹)</label>
                <input
                  type="number"
                  placeholder="10000"
                  value={monthlyDeduction}
                  onChange={(e) => setMonthlyDeduction(e.target.value)}
                  className="w-full p-2.5 bg-white border border-amber-300 rounded-xl font-bold text-rose-700 focus:outline-hidden"
                />
                <span className="text-[10px] text-amber-700 font-medium">Deducted from monthly salary</span>
              </div>
            </div>

            {/* Calculated Monthly Take-home */}
            <div className="bg-white p-3 rounded-xl border border-amber-200 flex items-center justify-between">
              <span className="font-bold text-slate-700">Net Monthly Salary Payout:</span>
              <span className="font-black text-sm text-emerald-700">
                ₹{calculatedNetSalary.toLocaleString('en-IN')}{' '}
                <span className="text-[10px] font-normal text-slate-500">(₹{Number(monthlySalary) || 0} - ₹{Number(monthlyDeduction) || 0})</span>
              </span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Notes / Remarks</label>
            <input
              type="text"
              placeholder="e.g. License details, heavy vehicle operator"
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
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              {staffToEdit ? 'Save Changes' : 'Save Staff Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditStaffModal;
