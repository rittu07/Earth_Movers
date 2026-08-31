import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import PageHeader from '../components/layout/PageHeader';
import AddDieselModal from '../components/businesses/AddDieselModal';
import ExcelQuickEntry from '../components/common/ExcelQuickEntry';
import { formatCurrency } from '../utils/formatCurrency';
import { Tag, CreditCard, Fuel, FileSpreadsheet, FileText } from 'lucide-react';

const AddExpense = () => {
  const { businesses, addExpense } = useBusiness();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedBusiness = searchParams.get('business') || 'jcb';

  // Default to Standard Form view (unless ?mode=excel is specified in URL)
  const [isExcelMode, setIsExcelMode] = useState(searchParams.get('mode') === 'excel');
  const [isDieselModalOpen, setIsDieselModalOpen] = useState(false);
  const [businessId, setBusinessId] = useState(preselectedBusiness);
  const [category, setCategory] = useState('Diesel');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Cash');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    addExpense({
      businessId,
      category,
      description,
      amount: Number(amount) || 0,
      method,
      date,
      notes
    });

    navigate('/expenses');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      <PageHeader
        title="Add Expense"
        subtitle="Log operational costs, raw material buys, diesel or wages"
        backUrl="/expenses"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Business Unit *
                </label>
                <select
                  value={businessId}
                  onChange={(e) => setBusinessId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  required
                >
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Expense Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  required
                >
                  <option value="Diesel">Diesel</option>
                  <option value="Labour">Labour</option>
                  <option value="Transport">Transport</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Purchase">Purchase</option>
                  <option value="Salary">Salary</option>
                  <option value="Rent">Rent</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Description *
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Labour loading charges, oil change"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-hidden focus:border-indigo-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Amount Spent (₹) *
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-rose-600 focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Method
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Expense Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Vendor / Additional Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Receipt # 4921"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => navigate('/expenses')}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition-all"
              >
                Save Expense
              </button>
            </div>
          </form>
        </div>

        {/* Expense Summary Card */}
        <div className="bg-rose-950 text-white rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
              <Tag className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-rose-300">
              Expense Entry
            </h3>

            <div className="mt-6 space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-rose-800">
                <span className="text-rose-200">Category</span>
                <span className="font-bold text-white">{category}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-rose-800">
                <span className="text-rose-200">Payment Mode</span>
                <span className="font-bold text-white">{method}</span>
              </div>

              <div className="p-3 bg-rose-900/80 rounded-xl border border-rose-700 flex justify-between items-center">
                <span className="font-bold text-rose-200">Total Deducted</span>
                <span className="text-lg font-extrabold text-rose-300">
                  {formatCurrency(amount)}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-6 text-[11px] text-rose-300/80">
            Directly subtracts from today's net profit.
          </div>
        </div>
      </div>

      {/* Diesel Management Helper Card */}
      {category === 'Diesel' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Fuel className="w-5 h-5 text-amber-600" />
            <div>
              <span className="text-xs font-bold text-amber-900 block">
                Logging JCB Diesel Refill?
              </span>
              <span className="text-[11px] text-amber-700 font-medium">
                Use the dedicated Diesel Tracking form to record litres, price/L, hour meter reading & track Litres per Hour efficiency!
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsDieselModalOpen(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-xs transition-all shrink-0"
          >
            Open Diesel Refill Form ⛽
          </button>
        </div>
      )}

      {/* Modal Dialog */}
      <AddDieselModal
        isOpen={isDieselModalOpen}
        onClose={() => setIsDieselModalOpen(false)}
      />
    </div>
  );
};

export default AddExpense;
