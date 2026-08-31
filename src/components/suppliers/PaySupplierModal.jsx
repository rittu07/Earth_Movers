import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { Wallet, X, DollarSign, Calendar, CreditCard, FileText, Building2 } from 'lucide-react';

const PaySupplierModal = ({ isOpen, onClose, preselectedSupplierId = '' }) => {
  const { suppliers = [], addSupplierPayment, showToast } = useBusiness();

  const [supplierId, setSupplierId] = useState(preselectedSupplierId || (suppliers[0]?.id || ''));
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('UPI');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const selectedSupplier = suppliers.find((s) => s.id === supplierId) || suppliers[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    const payAmt = Number(amount);
    if (!payAmt || payAmt <= 0) {
      showToast('Please enter a valid payment amount');
      return;
    }

    addSupplierPayment({
      supplierId: selectedSupplier ? selectedSupplier.id : supplierId,
      supplierName: selectedSupplier ? selectedSupplier.name : 'Supplier',
      amount: payAmt,
      method,
      date,
      reference,
      notes
    });

    setAmount('');
    setReference('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Pay Supplier</h3>
              <p className="text-[11px] text-slate-500 font-medium">Record payment payout to material vendor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Supplier Select */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Select Supplier *</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-hidden focus:border-emerald-500"
            >
              {suppliers.map((sup) => (
                <option key={sup.id} value={sup.id}>
                  {sup.name} ({sup.phone || 'No phone'})
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Payment Amount (₹) *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-slate-400">₹</span>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 15000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-7 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Payment Method & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-hidden focus:border-emerald-500"
              >
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer / NEFT</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Payment Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Reference / Txn ID */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Reference / Transaction ID</label>
            <input
              type="text"
              placeholder="e.g. UPI-9923841029"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Notes / Remarks</label>
            <input
              type="text"
              placeholder="e.g. Part payment for brick chamber load"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          {/* Submit */}
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
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaySupplierModal;
