import React, { useState, useEffect } from 'react';
import { X, Wallet, DollarSign, PlusCircle } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';

const AddStaffAdvanceModal = ({ isOpen, onClose, selectedStaffMember = null }) => {
  const { staff = [], addStaffAdvance } = useBusiness();

  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (selectedStaffMember) {
      setSelectedStaffId(selectedStaffMember.id);
    } else if (staff.length > 0) {
      setSelectedStaffId(staff[0].id);
    }
    setAdvanceAmount('');
    setNotes('');
  }, [selectedStaffMember, staff, isOpen]);

  if (!isOpen) return null;

  const currentStaff = staff.find((s) => s.id === selectedStaffId);

  const currentAdvanceTotal = currentStaff?.advanceAmount || 0;
  const currentAdvanceRem = currentStaff?.advanceRemaining || 0;
  const addAmt = Number(advanceAmount) || 0;
  const newAdvanceRem = currentAdvanceRem + addAmt;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedStaffId || addAmt <= 0) return;

    addStaffAdvance(selectedStaffId, addAmt, notes.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-amber-600" />
            Give Advance Amount to Staff
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Select Staff Member */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Select Staff Member *</label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full p-2.5 bg-indigo-50 border border-indigo-200 text-indigo-950 font-black rounded-xl focus:outline-hidden cursor-pointer"
            >
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.role}) - Current Remaining Advance: ₹{(s.advanceRemaining || 0).toLocaleString('en-IN')}
                </option>
              ))}
            </select>
          </div>

          {/* Current Advance Status Box */}
          {currentStaff && (
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs space-y-1">
              <div className="flex justify-between font-bold">
                <span className="text-amber-900">Total Upfront Advance Given:</span>
                <span className="text-amber-950">₹{currentAdvanceTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-amber-900">Current Outstanding Balance:</span>
                <span className="text-rose-700 font-black">₹{currentAdvanceRem.toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}

          {/* New Advance Amount Input */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              New Additional Advance Amount (₹) *
            </label>
            <input
              type="number"
              required
              min="1"
              placeholder="e.g. 20000"
              value={advanceAmount}
              onChange={(e) => setAdvanceAmount(e.target.value)}
              className="w-full p-3 bg-white border border-slate-300 rounded-xl text-base font-black text-slate-900 focus:border-amber-500 focus:outline-hidden shadow-2xs"
            />
          </div>

          {/* Updated Balance Calculation Box */}
          {addAmt > 0 && (
            <div className="bg-amber-500 text-white p-3.5 rounded-xl space-y-1 shadow-md shadow-amber-500/20">
              <div className="flex justify-between items-center font-bold text-xs">
                <span>New Balance Remaining:</span>
                <span className="text-sm font-black">₹{newAdvanceRem.toLocaleString('en-IN')}</span>
              </div>
              <p className="text-[10px] opacity-90">
                • ₹{addAmt.toLocaleString('en-IN')} will be recorded as a staff advance expense and added to remaining balance.
              </p>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">Notes / Purpose</label>
            <input
              type="text"
              placeholder="e.g. Emergency festival advance / personal loan"
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
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md shadow-amber-600/20 cursor-pointer flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" /> Add Advance Amount
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStaffAdvanceModal;
