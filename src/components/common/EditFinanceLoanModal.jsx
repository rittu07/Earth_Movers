import React, { useState, useEffect } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { X, Save, User, Phone, Landmark, Calendar, CreditCard, FileText } from 'lucide-react';

const EditFinanceLoanModal = ({ isOpen, onClose, loan }) => {
  const { updateFinanceLoan } = useBusiness();
  const [formData, setFormData] = useState({
    borrowerName: '',
    phone: '',
    principal: 100000,
    interestRate: 2,
    startDate: '',
    paymentMethod: 'Cash',
    reference: '',
    notes: ''
  });

  useEffect(() => {
    if (loan) {
      setFormData({
        borrowerName: loan.borrowerName || '',
        phone: loan.phone || '',
        principal: loan.principal || 100000,
        interestRate: loan.interestRate || 2,
        startDate: loan.startDate || new Date().toISOString().split('T')[0],
        paymentMethod: loan.paymentMethod || 'Cash',
        reference: loan.reference || '',
        notes: loan.notes || ''
      });
    }
  }, [loan]);

  if (!isOpen || !loan) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateFinanceLoan(loan.id, formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div>
            <span className="text-[10px] font-black tracking-wider text-emerald-600 uppercase">
              Edit Finance Loan Record
            </span>
            <h3 className="text-lg font-black text-slate-900 leading-tight">
              LOAN ID: {loan.id}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-semibold">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Borrower Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  name="borrowerName"
                  value={formData.borrowerName}
                  onChange={handleChange}
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Mobile Phone</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200">
            <div>
              <label className="block text-emerald-950 font-black mb-1">Principal Given (₹)</label>
              <input
                type="number"
                step="any"
                name="principal"
                value={formData.principal}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-emerald-800 font-black text-base focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-emerald-950 font-black mb-1">Interest Rate (% / mo)</label>
              <input
                type="number"
                step="any"
                name="interestRate"
                value={formData.interestRate}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-emerald-800 font-black text-base focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Start / Loan Date</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Disbursement Method</label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:border-emerald-500 focus:outline-hidden"
              >
                <option value="Cash">Cash</option>
                <option value="PhonePe/UPI">PhonePe / GPay / UPI</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Reference / Cheque / UPI Ref</label>
            <input
              type="text"
              name="reference"
              value={formData.reference}
              onChange={handleChange}
              placeholder="e.g. Cheque No, Bank Ref ID"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:border-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Notes / Terms</label>
            <textarea
              name="notes"
              rows="2"
              value={formData.notes}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:border-emerald-500 focus:outline-hidden"
            ></textarea>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" /> Save Loan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditFinanceLoanModal;
