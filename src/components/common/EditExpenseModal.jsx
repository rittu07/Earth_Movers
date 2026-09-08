import React, { useState, useEffect } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { X, Save, Tag, Calendar, CreditCard, Building2 } from 'lucide-react';

const EditExpenseModal = ({ isOpen, onClose, expense }) => {
  const { updateExpense, businesses = [] } = useBusiness();
  const [formData, setFormData] = useState({
    businessId: 'sand',
    category: 'Other',
    description: '',
    amount: 0,
    method: 'Cash',
    date: '',
    notes: ''
  });

  useEffect(() => {
    if (expense) {
      setFormData({
        businessId: expense.businessId || 'sand',
        category: expense.category || 'Other',
        description: expense.description || '',
        amount: expense.amount || 0,
        method: expense.method || 'Cash',
        date: expense.date || new Date().toISOString().split('T')[0],
        notes: expense.notes || ''
      });
    }
  }, [expense]);

  if (!isOpen || !expense) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateExpense(expense.id, formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div>
            <span className="text-[10px] font-black tracking-wider text-rose-600 uppercase">
              Edit Expense Entry
            </span>
            <h3 className="text-lg font-black text-slate-900 leading-tight">
              EXP: {expense.id}
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
              <label className="block text-slate-700 font-bold mb-1">Business Unit</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <select
                  name="businessId"
                  value={formData.businessId}
                  onChange={handleChange}
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:border-rose-500 focus:outline-hidden"
                >
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Expense Category</label>
              <div className="relative">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:border-rose-500 focus:outline-hidden"
                >
                  <option value="Diesel">Diesel / Fuel</option>
                  <option value="Driver Bata">Driver Bata / Salary</option>
                  <option value="Vehicle Maintenance">Vehicle Repair & Maintenance</option>
                  <option value="Raw Material">Raw Material / Bricks Purchase</option>
                  <option value="Outsourced Material Purchase">Outsourced Material Purchase</option>
                  <option value="Office & Utilities">Office & Utilities</option>
                  <option value="Tea & Snacks">Tea & Food Snacks</option>
                  <option value="Supplier Payment">Supplier Payment</option>
                  <option value="Other">Other Expense</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Description / Particulars</label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:border-rose-500 focus:outline-hidden"
            />
          </div>

          <div className="bg-rose-50/60 p-4 rounded-2xl border border-rose-200">
            <label className="block text-rose-950 font-black mb-1">Expense Amount (₹)</label>
            <input
              type="number"
              step="any"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-rose-700 font-black text-lg focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Payment Method</label>
              <select
                name="method"
                value={formData.method}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:border-rose-500 focus:outline-hidden"
              >
                <option value="Cash">Cash</option>
                <option value="PhonePe/UPI">PhonePe / GPay / UPI</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Date</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:border-rose-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Notes / Remarks</label>
            <textarea
              name="notes"
              rows="2"
              value={formData.notes}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:border-rose-500 focus:outline-hidden"
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
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl transition-all shadow-md shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" /> Save Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditExpenseModal;
