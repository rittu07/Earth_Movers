import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../../context/BusinessContext';
import { Plus, Trash2, Save, User, Calendar, CreditCard, Layers } from 'lucide-react';

const getTodayString = () => new Date().toISOString().split('T')[0];

const businessList = [
  { id: 'bricks', name: 'Bricks Supply' },
  { id: 'jcb', name: 'JCB Rental' },
  { id: 'water', name: 'Water Supply' },
  { id: 'jalli', name: 'Jalli Service' },
  { id: 'sand', name: 'Sand Supply' }
];

const createEmptyTxRow = (defaultBusId = 'bricks') => ({
  id: Date.now() + Math.random(),
  date: getTodayString(),
  businessId: defaultBusId,
  customerId: '',
  customerName: '',
  customerPhone: '',
  isNewCustomer: false,
  itemService: defaultBusId === 'jcb' ? 'JCB Earthmoving' : defaultBusId === 'water' ? 'Water Tanker' : defaultBusId === 'jalli' ? '20mm Jalli' : 'Red Bricks',
  quantity: '1',
  unit: defaultBusId === 'jcb' ? 'Hours' : defaultBusId === 'water' ? 'Loads' : 'Lorry',
  rate: '',
  paid: '',
  paymentMethod: 'Cash',
  notes: ''
});

const createEmptyExpRow = (defaultBusId = 'jcb') => ({
  id: Date.now() + Math.random(),
  date: getTodayString(),
  businessId: defaultBusId,
  category: 'Diesel',
  description: '',
  amount: '',
  method: 'Cash',
  notes: ''
});

const ExcelQuickEntry = ({ initialMode = 'transaction', defaultBusinessId = null }) => {
  const { customers, businesses, addTransaction, addExpense, showToast } = useBusiness();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(initialMode);
  const initialBusId = defaultBusinessId || 'bricks';

  const [txRows, setTxRows] = useState([createEmptyTxRow(initialBusId)]);
  const [expRows, setExpRows] = useState([createEmptyExpRow(defaultBusinessId || 'jcb')]);

  // Row edit handlers
  const handleTxChange = (id, field, value) => {
    setTxRows((prev) =>
      prev.map((row) => {
        if (row.id === id) {
          const updated = { ...row, [field]: value };

          if (field === 'customerId') {
            if (value === '__new__') {
              updated.isNewCustomer = true;
              updated.customerId = '';
              updated.customerName = '';
              updated.customerPhone = '';
            } else {
              updated.isNewCustomer = false;
              const foundCust = customers.find((c) => c.id === value);
              if (foundCust) {
                updated.customerName = foundCust.name;
                updated.customerPhone = foundCust.phone || '';
              }
            }
          }

          if (field === 'businessId') {
            if (value === 'bricks') {
              updated.itemService = 'Red Bricks';
              updated.unit = 'Lorry';
            } else if (value === 'jcb') {
              updated.itemService = 'JCB Earthmoving';
              updated.unit = 'Hours';
            } else if (value === 'water') {
              updated.itemService = 'Water Tanker Load';
              updated.unit = 'Loads';
            } else if (value === 'jalli') {
              updated.itemService = '20mm Jalli';
              updated.unit = 'Lorry';
            } else if (value === 'sand') {
              updated.itemService = 'Sand Supply';
              updated.unit = 'Lorry';
            }
          }

          return updated;
        }
        return row;
      })
    );
  };

  const addTxRow = () => setTxRows((prev) => [...prev, createEmptyTxRow(initialBusId)]);
  const deleteTxRow = (id) => {
    if (txRows.length <= 1) {
      setTxRows([createEmptyTxRow(initialBusId)]);
      return;
    }
    setTxRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleExpChange = (id, field, value) => {
    setExpRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const addExpRow = () => setExpRows((prev) => [...prev, createEmptyExpRow(defaultBusinessId || 'jcb')]);
  const deleteExpRow = (id) => {
    if (expRows.length <= 1) {
      setExpRows([createEmptyExpRow(defaultBusinessId || 'jcb')]);
      return;
    }
    setExpRows((prev) => prev.filter((r) => r.id !== id));
  };

  // Save Handlers
  const handleSaveTransactions = () => {
    const validRows = txRows.filter(
      (r) => (r.customerId !== '' || r.customerName.trim() !== '') && (Number(r.rate) > 0 || Number(r.quantity) > 0)
    );

    if (validRows.length === 0) {
      alert('Please select a customer and enter Qty / Rate for at least one row.');
      return;
    }

    let count = 0;
    validRows.forEach((r) => {
      let custId = r.customerId;
      let custName = r.customerName;
      let phone = r.customerPhone || '';

      if (r.isNewCustomer && r.customerName.trim()) {
        const newCust = addCustomer({
          name: r.customerName.trim(),
          phone: r.customerPhone.trim() || '0000000000',
          address: ''
        });
        custId = newCust.id;
        custName = newCust.name;
        phone = newCust.phone;
      } else {
        const found = customers.find((c) => c.id === r.customerId);
        if (found) {
          custName = found.name;
          phone = found.phone;
        }
      }

      const qty = Number(r.quantity) || 1;
      const rate = Number(r.rate) || 0;
      const totalAmount = qty * rate;
      const paid = Number(r.paid) || 0;
      const selBus = businesses.find((b) => b.id === r.businessId) || businesses[0];

      addTransaction({
        customerId: custId,
        customerName: custName,
        phone,
        businessId: selBus.id,
        businessName: selBus.name,
        itemService: r.itemService || 'General Order',
        quantity: qty,
        unit: r.unit || 'Units',
        rate,
        amount: totalAmount,
        paid,
        due: Math.max(0, totalAmount - paid),
        paymentMethod: r.paymentMethod || 'Cash',
        date: r.date || getTodayString(),
        notes: r.notes || ''
      });
      count++;
    });

    showToast(`Saved ${count} transactions!`);
    navigate('/transactions');
  };

  const handleSaveExpenses = () => {
    const validRows = expRows.filter(
      (r) => r.description.trim() !== '' && Number(r.amount) > 0
    );

    if (validRows.length === 0) {
      alert('Please enter Description & Amount for at least one expense row.');
      return;
    }

    let count = 0;
    validRows.forEach((r) => {
      addExpense({
        businessId: r.businessId || 'jcb',
        category: r.category || 'Other',
        description: r.description,
        amount: Number(r.amount) || 0,
        method: r.method || 'Cash',
        date: r.date || getTodayString(),
        notes: r.notes || ''
      });
      count++;
    });

    showToast(`Saved ${count} expenses!`);
    navigate('/expenses');
  };

  const totalTxAmount = txRows.reduce(
    (sum, r) => sum + (Number(r.quantity) || 0) * (Number(r.rate) || 0),
    0
  );
  const totalExpAmount = expRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  return (
    <div className="space-y-4 font-sans">
      {/* Top Header Controls - Crisp White Minimal Bar */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 flex items-center justify-between gap-3">
        {/* Tab Selector */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('transaction')}
            className={`px-4 py-2 rounded-lg text-sm font-extrabold transition-all cursor-pointer ${
              activeTab === 'transaction'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Sales Transactions ({txRows.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('expense')}
            className={`px-4 py-2 rounded-lg text-sm font-extrabold transition-all cursor-pointer ${
              activeTab === 'expense'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Expenses ({expRows.length})
          </button>
        </div>

        {/* Total Badge */}
        <div className="text-sm font-bold text-slate-700 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
          Total: <span className="text-indigo-600 font-black text-base">₹{activeTab === 'transaction' ? totalTxAmount.toLocaleString('en-IN') : totalExpAmount.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Clean Table Cards List */}
      <div className="space-y-3.5">
        {activeTab === 'transaction' ? (
          txRows.map((row, idx) => {
            const qtyNum = Number(row.quantity) || 0;
            const rateNum = Number(row.rate) || 0;
            const totalAmt = qtyNum * rateNum;

            return (
              <div
                key={row.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4 shadow-2xs"
              >
                {/* Row Top Line */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="font-black text-slate-400 text-sm">#{idx + 1}</span>

                    {/* Sector Picker */}
                    <select
                      value={row.businessId}
                      onChange={(e) => handleTxChange(row.id, 'businessId', e.target.value)}
                      className="bg-slate-100 font-extrabold text-xs text-slate-900 rounded-lg px-2.5 py-1.5 border border-slate-200 cursor-pointer focus:outline-hidden"
                    >
                      {businessList.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>

                    <input
                      type="date"
                      value={row.date}
                      onChange={(e) => handleTxChange(row.id, 'date', e.target.value)}
                      className="bg-transparent border-0 text-slate-500 text-xs font-bold cursor-pointer"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteTxRow(row.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                    title="Delete row"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Form Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  {/* Customer (4 cols) */}
                  <div className="sm:col-span-4">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-extrabold text-slate-700">Customer *</label>
                      <button
                        type="button"
                        onClick={() => handleTxChange(row.id, 'isNewCustomer', !row.isNewCustomer)}
                        className="text-xs text-indigo-600 font-bold hover:underline"
                      >
                        {row.isNewCustomer ? 'Select Existing' : '+ New Customer'}
                      </button>
                    </div>

                    {!row.isNewCustomer ? (
                      <select
                        value={row.customerId}
                        onChange={(e) => handleTxChange(row.id, 'customerId', e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                      >
                        <option value="">-- Choose Customer --</option>
                        <option value="__new__">+ Add New Customer</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.phone ? `(${c.phone})` : ''}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="text"
                          value={row.customerName}
                          onChange={(e) => handleTxChange(row.id, 'customerName', e.target.value)}
                          placeholder="Name *"
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-hidden"
                        />
                        <input
                          type="tel"
                          value={row.customerPhone}
                          onChange={(e) => handleTxChange(row.id, 'customerPhone', e.target.value)}
                          placeholder="Phone"
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden"
                        />
                      </div>
                    )}
                  </div>

                  {/* Item Description (3 cols) */}
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">Item / Details</label>
                    <input
                      type="text"
                      value={row.itemService}
                      onChange={(e) => handleTxChange(row.id, 'itemService', e.target.value)}
                      placeholder="Details"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Qty (1 col) */}
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">Qty</label>
                    <input
                      type="number"
                      step="0.5"
                      value={row.quantity}
                      onChange={(e) => handleTxChange(row.id, 'quantity', e.target.value)}
                      placeholder="1"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-center text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Rate (2 cols) */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">Rate (₹) *</label>
                    <input
                      type="number"
                      value={row.rate}
                      onChange={(e) => handleTxChange(row.id, 'rate', e.target.value)}
                      placeholder="0"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Amount Paid (2 cols) */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">Paid (₹)</label>
                    <input
                      type="number"
                      value={row.paid}
                      onChange={(e) => handleTxChange(row.id, 'paid', e.target.value)}
                      placeholder="0"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-emerald-700 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Subtotal Footer line */}
                <div className="flex items-center justify-between text-sm pt-1 border-t border-slate-100">
                  <span className="text-slate-600 font-semibold">Subtotal: <strong className="text-slate-950 font-black text-base">₹{totalAmt.toLocaleString('en-IN')}</strong></span>
                  <span className="text-slate-600 font-bold">
                    Method: 
                    <select
                      value={row.paymentMethod}
                      onChange={(e) => handleTxChange(row.id, 'paymentMethod', e.target.value)}
                      className="ml-1 bg-transparent text-slate-900 font-extrabold cursor-pointer focus:outline-hidden"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          expRows.map((row, idx) => (
            <div
              key={row.id}
              className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-2.5"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-400">#{idx + 1}</span>
                  <select
                    value={row.businessId}
                    onChange={(e) => handleExpChange(row.id, 'businessId', e.target.value)}
                    className="bg-slate-100 font-bold text-xs text-slate-800 rounded-lg px-2 py-1 border border-slate-200 cursor-pointer"
                  >
                    {businessList.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={row.category}
                    onChange={(e) => handleExpChange(row.id, 'category', e.target.value)}
                    className="bg-rose-50 font-bold text-xs text-rose-800 rounded-lg px-2 py-1 border border-rose-200 cursor-pointer"
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="Labour">Labour</option>
                    <option value="Transport">Transport</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => deleteExpRow(row.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-7">
                  <input
                    type="text"
                    value={row.description}
                    onChange={(e) => handleExpChange(row.id, 'description', e.target.value)}
                    placeholder="Expense Description (e.g. Diesel, Labour wages) *"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-5">
                  <input
                    type="number"
                    value={row.amount}
                    onChange={(e) => handleExpChange(row.id, 'amount', e.target.value)}
                    placeholder="Amount Spent (₹) *"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-rose-700 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={activeTab === 'transaction' ? addTxRow : addExpRow}
          className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-xl border border-slate-300 text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 text-indigo-600" /> + Add Line
        </button>

        {activeTab === 'transaction' ? (
          <button
            type="button"
            onClick={handleSaveTransactions}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" /> Save Transactions
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSaveExpenses}
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" /> Save Expenses
          </button>
        )}
      </div>
    </div>
  );
};

export default ExcelQuickEntry;
