import React, { useState, useEffect } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { X, Save, DollarSign, Calendar, FileText, User, Phone, MapPin } from 'lucide-react';

const EditTransactionModal = ({ isOpen, onClose, transaction }) => {
  const { updateTransaction } = useBusiness();
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    itemService: '',
    quantity: 1,
    unit: 'Units',
    rate: 0,
    amount: 0,
    paid: 0,
    paymentMethod: 'Cash',
    date: '',
    deliveryPlace: '',
    notes: ''
  });

  useEffect(() => {
    if (transaction) {
      setFormData({
        customerName: transaction.customerName || '',
        phone: transaction.phone || '',
        itemService: transaction.itemService || '',
        quantity: transaction.quantity || 1,
        unit: transaction.unit || 'Units',
        rate: transaction.rate || 0,
        amount: transaction.amount || 0,
        paid: transaction.paid || 0,
        paymentMethod: transaction.paymentMethod || 'Cash',
        date: transaction.date || new Date().toISOString().split('T')[0],
        deliveryPlace: transaction.deliveryPlace || '',
        notes: transaction.notes || ''
      });
    }
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'quantity' || name === 'rate') {
        const qty = Number(name === 'quantity' ? value : prev.quantity) || 0;
        const rt = Number(name === 'rate' ? value : prev.rate) || 0;
        if (qty > 0 && rt > 0) {
          updated.amount = qty * rt;
        }
      }
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateTransaction(transaction.id, formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div>
            <span className="text-[10px] font-black tracking-wider text-indigo-600 uppercase">
              Edit Transaction Entry
            </span>
            <h3 className="text-lg font-black text-slate-900 leading-tight">
              TRX: {transaction.id}
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
              <label className="block text-slate-700 font-bold mb-1">Customer Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:border-indigo-500 focus:outline-hidden"
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
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Item / Service Details</label>
            <input
              type="text"
              name="itemService"
              value={formData.itemService}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Quantity</label>
              <input
                type="number"
                step="any"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Unit</label>
              <input
                type="text"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Rate (₹)</label>
              <input
                type="number"
                step="any"
                name="rate"
                value={formData.rate}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100">
            <div>
              <label className="block text-indigo-900 font-black mb-1">Total Bill Amount (₹)</label>
              <input
                type="number"
                step="any"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-slate-900 font-black focus:outline-hidden text-sm"
              />
            </div>
            <div>
              <label className="block text-emerald-800 font-black mb-1">Amount Paid (₹)</label>
              <input
                type="number"
                step="any"
                name="paid"
                value={formData.paid}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-emerald-800 font-black focus:outline-hidden text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Payment Method</label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:border-indigo-500 focus:outline-hidden"
              >
                <option value="Cash">Cash</option>
                <option value="PhonePe/UPI">PhonePe / GPay / UPI</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                <option value="Cheque">Cheque</option>
                <option value="Credit">Credit / Account Due</option>
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
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Site / Delivery Location</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                name="deliveryPlace"
                value={formData.deliveryPlace}
                onChange={handleChange}
                placeholder="e.g. Site address or landmark"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Notes</label>
            <textarea
              name="notes"
              rows="2"
              value={formData.notes}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:border-indigo-500 focus:outline-hidden"
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
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTransactionModal;
