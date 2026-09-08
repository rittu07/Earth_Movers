import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../../context/BusinessContext';
import { Plus, Trash2, Save, User, Calendar, CreditCard, Layers, MessageSquare } from 'lucide-react';
import { formatTransactionWhatsApp, openWhatsAppChat } from '../../utils/whatsapp';

const getTodayString = () => new Date().toISOString().split('T')[0];

const businessList = [
  { id: 'bricks', name: 'Bricks Supply' },
  { id: 'jcb', name: 'JCB Rental' },
  { id: 'water', name: 'Water Supply' },
  { id: 'jalli', name: 'Jalli Service' },
  { id: 'sand', name: 'Sand Supply' }
];

const defaultDriversList = [
  { id: 'd1', name: 'Driver Perumal', phone: '9876543210' },
  { id: 'd2', name: 'Driver Murugan', phone: '9876543211' },
  { id: 'd3', name: 'Driver Kumar', phone: '9876543212' },
  { id: 'd4', name: 'Driver Raja', phone: '9876543213' },
  { id: 'd5', name: 'Driver Selvam', phone: '9876543214' }
];

const calcHoursFromTime = (startStr, endStr) => {
  if (!startStr || !endStr) return null;
  const [sH, sM] = startStr.split(':').map(Number);
  const [eH, eM] = endStr.split(':').map(Number);
  if (isNaN(sH) || isNaN(sM) || isNaN(eH) || isNaN(eM)) return null;

  let startMin = sH * 60 + sM;
  let endMin = eH * 60 + eM;
  if (endMin < startMin) {
    endMin += 24 * 60;
  }
  const diffHours = (endMin - startMin) / 60;
  return Number(diffHours.toFixed(1));
};

const createEmptyTxRow = (defaultBusId = 'bricks') => ({
  id: Date.now() + Math.random(),
  date: getTodayString(),
  businessId: defaultBusId,
  customerId: '',
  customerName: '',
  customerPhone: '',
  isNewCustomer: false,
  itemService: defaultBusId === 'jcb' ? 'JCB Earthmoving' : defaultBusId === 'water' ? 'Water Tanker' : defaultBusId === 'jalli' ? '20mm Jalli' : defaultBusId === 'sand' ? 'M-Sand' : 'Red Bricks',
  quantity: '5',
  unit: defaultBusId === 'jcb' ? 'Hours' : defaultBusId === 'water' ? 'Loads' : 'Lorry',
  rate: '',
  paid: '',
  paymentMethod: 'Cash',
  reference: '',
  notes: '',
  sourcingType: 'local',
  supplierId: '',
  supplierName: '',
  supplierPhone: '',
  isNewSupplier: false,
  supplierCost: '',
  supplierPaid: '',
  jcbVehicle: 'JCB-01 (TN-23-AX-1234)',
  driverName: 'Driver Perumal',
  driverPhone: '9876543210',
  isNewDriver: false,
  driverAmount: '',
  startTime: '09:00',
  endTime: '14:00',
  waterSource: 'Own Borewell (Plant 1)',
  deliveryPlace: '',
  isCustomWaterSource: false
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
  const { customers, businesses, suppliers, addCustomer, addSupplier, addTransaction, addExpense, showToast } = useBusiness();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(initialMode);
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const initialBusId = defaultBusinessId || 'bricks';

  const [txRows, setTxRows] = useState([createEmptyTxRow(initialBusId)]);
  const [expRows, setExpRows] = useState([createEmptyExpRow(defaultBusinessId || 'jcb')]);

  // Row edit handlers
  const handleTxChange = (id, field, value) => {
    setTxRows((prev) =>
      prev.map((row) => {
        if (row.id === id) {
          const updated = { ...row, [field]: value };

          if (field === 'startTime' || field === 'endTime') {
            const sTime = field === 'startTime' ? value : updated.startTime;
            const eTime = field === 'endTime' ? value : updated.endTime;
            const calculatedHrs = calcHoursFromTime(sTime, eTime);
            if (calculatedHrs !== null && calculatedHrs > 0) {
              updated.quantity = calculatedHrs.toString();
            }
          }

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
              updated.waterSource = updated.waterSource || 'Own Borewell (Plant 1)';
            } else if (value === 'jalli') {
              updated.itemService = '20mm Jalli';
              updated.unit = 'Lorry';
            } else if (value === 'sand') {
              updated.itemService = 'M-Sand';
              updated.unit = 'Lorry';
            }
          }

          if (field === 'supplierId') {
            if (value === '__new__') {
              updated.isNewSupplier = true;
              updated.supplierId = '';
              updated.supplierName = '';
              updated.supplierPhone = '';
            } else {
              updated.isNewSupplier = false;
              if (value) {
                const foundSupplier = suppliers.find((s) => s.id === value);
                if (foundSupplier) {
                  updated.supplierName = foundSupplier.name;
                  updated.supplierPhone = foundSupplier.phone || '';
                }
              }
            }
          }

          return updated;
        }
        return row;
      })
    );
  };

  const addTxRow = () => {
    setTxRows((prev) => {
      const lastRow = prev.length > 0 ? prev[prev.length - 1] : null;
      const busIdToUse = lastRow ? lastRow.businessId : initialBusId;
      const newRow = createEmptyTxRow(busIdToUse);

      if (lastRow) {
        // Automatically keep/carry over customer selected from Line 1 / previous row
        newRow.customerId = lastRow.customerId || '';
        newRow.customerName = lastRow.customerName || '';
        newRow.customerPhone = lastRow.customerPhone || '';
        newRow.isNewCustomer = lastRow.isNewCustomer || false;

        // Carry over date & business sector metadata
        newRow.date = lastRow.date || getTodayString();
        if (lastRow.businessId === 'water') {
          newRow.waterSource = lastRow.waterSource || 'Own Borewell (Plant 1)';
          newRow.deliveryPlace = lastRow.deliveryPlace || '';
        } else if (lastRow.businessId === 'jcb') {
          newRow.jcbVehicle = lastRow.jcbVehicle || 'JCB-01 (TN-23-AX-1234)';
          newRow.driverName = lastRow.driverName || 'Driver Perumal';
          newRow.driverPhone = lastRow.driverPhone || '9876543210';
        }
      }

      return [...prev, newRow];
    });
  };

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

      let supName = r.supplierName || '';
      let supPhone = r.supplierPhone || '';
      if (r.sourcingType === 'outsourced' && r.isNewSupplier && r.supplierName.trim()) {
        const newSup = addSupplier({
          name: r.supplierName.trim(),
          phone: r.supplierPhone.trim() || ''
        });
        supName = newSup.name;
        supPhone = newSup.phone;
      } else if (r.sourcingType === 'outsourced' && r.supplierId) {
        const foundSup = suppliers.find((s) => s.id === r.supplierId);
        if (foundSup) {
          supName = foundSup.name;
          supPhone = foundSup.phone || '';
        }
      }

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
        reference: r.reference || '',
        date: r.date || getTodayString(),
        notes: r.notes || '',
        isOutsourced: r.sourcingType === 'outsourced',
        outsourcedSupplier: supName,
        outsourcedPhone: supPhone,
        outsourcedCost: Number(r.supplierCost) || Number(r.supplierPaid) || 0,
        outsourcedPaid: Number(r.supplierPaid) || 0,
        outsourcedDue: Math.max(0, (Number(r.supplierCost) || Number(r.supplierPaid) || 0) - (Number(r.supplierPaid) || 0)),
        jcbVehicle: r.businessId === 'jcb' ? (r.jcbVehicle || 'JCB-01 (TN-23-AX-1234)') : '',
        driverName: r.businessId === 'jcb' ? (r.driverName || 'Driver Perumal') : (r.driverName || ''),
        driverPhone: r.businessId === 'jcb' ? (r.driverPhone || '') : '',
        driverAmount: r.businessId === 'jcb' ? (Number(r.driverAmount) || 0) : (Number(r.driverAmount) || 0),
        startTime: r.businessId === 'jcb' ? (r.startTime || '') : '',
        endTime: r.businessId === 'jcb' ? (r.endTime || '') : '',
        waterSource: r.businessId === 'water' ? (r.waterSource || 'Own Borewell (Plant 1)') : '',
        deliveryPlace: r.businessId === 'water' ? (r.deliveryPlace || '') : ''
      });
      count++;
    });

    showToast(`Saved ${count} transactions!`);

    if (sendWhatsApp) {
      validRows.forEach((r) => {
        const foundCust = customers.find((c) => c.id === r.customerId);
        const targetPhone = r.customerPhone || (foundCust ? foundCust.phone : '');
        if (targetPhone && targetPhone !== '0000000000') {
          const qty = Number(r.quantity) || 1;
          const rate = Number(r.rate) || 0;
          const totalAmount = qty * rate;
          const paid = Number(r.paid) || 0;
          const due = Math.max(0, totalAmount - paid);
          const selBus = businesses.find((b) => b.id === r.businessId) || businesses[0];

          const waMsg = formatTransactionWhatsApp({
            customerName: r.customerName || (foundCust ? foundCust.name : 'Customer'),
            serviceName: r.itemService || selBus.name,
            businessName: selBus.name,
            quantity: qty,
            unit: r.unit || 'Units',
            rate,
            amount: totalAmount,
            paid,
            due,
            date: r.date || getTodayString(),
            jcbVehicle: r.businessId === 'jcb' ? (r.jcbVehicle || 'JCB-01 (TN-23-AX-1234)') : '',
            driverName: r.businessId === 'jcb' ? (r.driverName || 'Driver Perumal') : (r.driverName || ''),
            driverPhone: r.businessId === 'jcb' ? (r.driverPhone || '') : '',
            driverAmount: r.businessId === 'jcb' ? (Number(r.driverAmount) || 0) : (Number(r.driverAmount) || 0),
            startTime: r.businessId === 'jcb' ? (r.startTime || '') : '',
            endTime: r.businessId === 'jcb' ? (r.endTime || '') : ''
          });
          openWhatsAppChat(targetPhone, waMsg);
        }
      });
    }

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
                <div className="flex flex-wrap items-center justify-between gap-3 text-base pb-1 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-black text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200 text-base shadow-2xs">
                      #{idx + 1}
                    </span>

                    {/* Sector Picker - BIG & PROMINENT */}
                    <select
                      value={row.businessId}
                      onChange={(e) => handleTxChange(row.id, 'businessId', e.target.value)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm sm:text-base rounded-xl px-4 py-2.5 border-2 border-indigo-700 cursor-pointer shadow-md shadow-indigo-600/20 focus:outline-hidden transition-all"
                    >
                      {businessList.map((b) => (
                        <option key={b.id} value={b.id} className="bg-white text-slate-900 font-extrabold text-sm">
                          {b.name}
                        </option>
                      ))}
                    </select>

                    {/* Date Picker - PROMINENT & BIG */}
                    <input
                      type="date"
                      value={row.date}
                      onChange={(e) => handleTxChange(row.id, 'date', e.target.value)}
                      className="bg-slate-100 border border-slate-300 text-slate-900 text-sm sm:text-base font-extrabold px-3.5 py-2 rounded-xl cursor-pointer shadow-2xs focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteTxRow(row.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                    title="Delete row"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Form Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 pt-1">
                  {/* Customer (4 cols) */}
                  <div className="sm:col-span-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-black text-slate-800">Customer *</label>
                      <button
                        type="button"
                        onClick={() => handleTxChange(row.id, 'isNewCustomer', !row.isNewCustomer)}
                        className="text-xs text-indigo-600 font-extrabold hover:underline"
                      >
                        {row.isNewCustomer ? 'Select Existing' : '+ New Customer'}
                      </button>
                    </div>

                    {!row.isNewCustomer ? (
                      <select
                        value={row.customerId}
                        onChange={(e) => handleTxChange(row.id, 'customerId', e.target.value)}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-base font-extrabold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden shadow-2xs"
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
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={row.customerName}
                          onChange={(e) => handleTxChange(row.id, 'customerName', e.target.value)}
                          placeholder="Name *"
                          className="w-full p-3.5 bg-white border border-slate-300 rounded-2xl text-base font-bold text-slate-900 focus:outline-hidden shadow-2xs"
                        />
                        <input
                          type="tel"
                          value={row.customerPhone}
                          onChange={(e) => handleTxChange(row.id, 'customerPhone', e.target.value)}
                          placeholder="Phone"
                          className="w-full p-3.5 bg-white border border-slate-300 rounded-2xl text-base font-semibold text-slate-900 focus:outline-hidden shadow-2xs"
                        />
                      </div>
                    )}
                  </div>

                  {/* Material Source + Supplier (bricks/jalli/sand) */}
                  {['bricks', 'jalli', 'sand'].includes(row.businessId) ? (
                    <div className="sm:col-span-4">
                      {row.businessId === 'sand' ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-sm font-black text-slate-800">
                              🏖️ Sand Type & Source *
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                if (row.sourcingType !== 'outsourced') {
                                  handleTxChange(row.id, 'sourcingType', 'outsourced');
                                  handleTxChange(row.id, 'isNewSupplier', true);
                                } else {
                                  handleTxChange(row.id, 'isNewSupplier', !row.isNewSupplier);
                                }
                              }}
                              className="text-xs text-indigo-600 font-extrabold hover:underline cursor-pointer"
                            >
                              {row.sourcingType === 'outsourced' && row.isNewSupplier ? 'Select Existing Supplier' : '+ New Supplier'}
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {/* P-Sand or M-Sand Selection */}
                            <select
                              value={['M-Sand', 'P-Sand', 'River Sand', 'Fine P-Sand'].includes(row.itemService) ? row.itemService : 'M-Sand'}
                              onChange={(e) => handleTxChange(row.id, 'itemService', e.target.value)}
                              className="w-full p-3.5 bg-blue-50 border-2 border-blue-400 rounded-2xl text-base font-black text-blue-950 focus:bg-white focus:outline-hidden shadow-2xs cursor-pointer"
                            >
                              <option value="M-Sand">M-Sand</option>
                              <option value="P-Sand">P-Sand</option>
                              <option value="River Sand">River Sand</option>
                              <option value="Fine P-Sand">Fine P-Sand</option>
                            </select>

                            {/* Sourcing Type */}
                            <select
                              value={row.sourcingType}
                              onChange={(e) => {
                                if (e.target.value === 'outsourced_new') {
                                  handleTxChange(row.id, 'sourcingType', 'outsourced');
                                  handleTxChange(row.id, 'isNewSupplier', true);
                                } else {
                                  handleTxChange(row.id, 'sourcingType', e.target.value);
                                }
                              }}
                              className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-extrabold text-slate-900 focus:bg-white focus:outline-hidden shadow-2xs cursor-pointer"
                            >
                              <option value="local">Local (Own Production)</option>
                              <option value="outsourced">Outsourced Supplier</option>
                              <option value="outsourced_new">+ Add New Supplier</option>
                            </select>
                          </div>

                          {/* Supplier details when outsourced */}
                          {row.sourcingType === 'outsourced' && (
                            <div className="pt-1 space-y-2">
                              {!row.isNewSupplier ? (
                                <select
                                  value={row.supplierId}
                                  onChange={(e) => handleTxChange(row.id, 'supplierId', e.target.value)}
                                  className="w-full p-3.5 bg-amber-50 border-2 border-amber-300 rounded-2xl text-base font-extrabold text-amber-950 focus:bg-white focus:border-indigo-500 focus:outline-hidden shadow-2xs cursor-pointer"
                                >
                                  <option value="">-- Choose Supplier --</option>
                                  <option value="__new__">+ Add New Supplier</option>
                                  {suppliers.map((s) => (
                                    <option key={s.id} value={s.id}>
                                      {s.name} {s.phone ? `(${s.phone})` : ''}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <div className="grid grid-cols-2 gap-2">
                                  <input
                                    type="text"
                                    value={row.supplierName}
                                    onChange={(e) => handleTxChange(row.id, 'supplierName', e.target.value)}
                                    placeholder="Supplier Name *"
                                    className="w-full p-3.5 bg-white border border-slate-300 rounded-2xl text-base font-bold text-slate-900 focus:outline-hidden shadow-2xs"
                                  />
                                  <input
                                    type="tel"
                                    value={row.supplierPhone}
                                    onChange={(e) => handleTxChange(row.id, 'supplierPhone', e.target.value)}
                                    placeholder="Supplier Phone"
                                    className="w-full p-3.5 bg-white border border-slate-300 rounded-2xl text-base font-semibold text-slate-900 focus:outline-hidden shadow-2xs"
                                  />
                                </div>
                              )}

                              {/* Amount Paid to Supplier & Cost */}
                              <div className="grid grid-cols-2 gap-2 bg-amber-50/70 p-2 rounded-2xl border border-amber-200">
                                <div>
                                  <label className="block text-[11px] font-black text-amber-900 uppercase mb-1">
                                    💳 Paid to Supplier (₹)
                                  </label>
                                  <input
                                    type="number"
                                    value={row.supplierPaid}
                                    onChange={(e) => handleTxChange(row.id, 'supplierPaid', e.target.value)}
                                    placeholder="0"
                                    className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-base font-black text-emerald-700 focus:outline-hidden shadow-2xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-black text-amber-900 uppercase mb-1">
                                    💰 Supplier Cost (₹)
                                  </label>
                                  <input
                                    type="number"
                                    value={row.supplierCost}
                                    onChange={(e) => handleTxChange(row.id, 'supplierCost', e.target.value)}
                                    placeholder="Cost"
                                    className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-base font-extrabold text-slate-900 focus:outline-hidden shadow-2xs"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-sm font-black text-slate-800">
                              {row.sourcingType === 'outsourced' ? (row.isNewSupplier ? 'Supplier Details *' : 'Supplier *') : 'Material Source'}
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                if (row.sourcingType !== 'outsourced') {
                                  handleTxChange(row.id, 'sourcingType', 'outsourced');
                                  handleTxChange(row.id, 'isNewSupplier', true);
                                } else {
                                  handleTxChange(row.id, 'isNewSupplier', !row.isNewSupplier);
                                }
                              }}
                              className="text-xs text-indigo-600 font-extrabold hover:underline cursor-pointer"
                            >
                              {row.sourcingType === 'outsourced' && row.isNewSupplier ? 'Select Existing Supplier' : '+ New Supplier'}
                            </button>
                          </div>

                          {row.sourcingType !== 'outsourced' ? (
                            <select
                              value={row.sourcingType}
                              onChange={(e) => {
                                if (e.target.value === 'outsourced_new') {
                                  handleTxChange(row.id, 'sourcingType', 'outsourced');
                                  handleTxChange(row.id, 'isNewSupplier', true);
                                } else {
                                  handleTxChange(row.id, 'sourcingType', e.target.value);
                                }
                              }}
                              className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-base font-extrabold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden shadow-2xs cursor-pointer"
                            >
                              <option value="local">Local (Own Production)</option>
                              <option value="outsourced">Outsourced Supplier</option>
                              <option value="outsourced_new">+ Add New Supplier</option>
                            </select>
                          ) : !row.isNewSupplier ? (
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <select
                                  value={row.supplierId}
                                  onChange={(e) => handleTxChange(row.id, 'supplierId', e.target.value)}
                                  className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-base font-extrabold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden shadow-2xs cursor-pointer"
                                >
                                  <option value="">-- Choose Supplier --</option>
                                  <option value="__new__">+ Add New Supplier</option>
                                  {suppliers.map((s) => (
                                    <option key={s.id} value={s.id}>
                                      {s.name} {s.phone ? `(${s.phone})` : ''}
                                    </option>
                                  ))}
                                </select>
                                <select
                                  value={row.sourcingType}
                                  onChange={(e) => handleTxChange(row.id, 'sourcingType', e.target.value)}
                                  className="w-full p-3.5 bg-amber-50 border border-amber-300 rounded-2xl text-sm font-black text-amber-800 focus:bg-white focus:border-amber-400 focus:outline-hidden shadow-2xs cursor-pointer"
                                >
                                  <option value="outsourced">Outsourced</option>
                                  <option value="local">Switch to Local</option>
                                </select>
                              </div>
                              <div className="grid grid-cols-2 gap-2 bg-amber-50/70 p-2 rounded-2xl border border-amber-200">
                                <div>
                                  <label className="block text-[11px] font-black text-amber-900 uppercase mb-1">
                                    💳 Paid to Supplier (₹)
                                  </label>
                                  <input
                                    type="number"
                                    value={row.supplierPaid}
                                    onChange={(e) => handleTxChange(row.id, 'supplierPaid', e.target.value)}
                                    placeholder="0"
                                    className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-base font-black text-emerald-700 focus:outline-hidden shadow-2xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-black text-amber-900 uppercase mb-1">
                                    💰 Supplier Cost (₹)
                                  </label>
                                  <input
                                    type="number"
                                    value={row.supplierCost}
                                    onChange={(e) => handleTxChange(row.id, 'supplierCost', e.target.value)}
                                    placeholder="Cost"
                                    className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-base font-extrabold text-slate-900 focus:outline-hidden shadow-2xs"
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="grid grid-cols-2 gap-2 flex-1">
                                  <input
                                    type="text"
                                    value={row.supplierName}
                                    onChange={(e) => handleTxChange(row.id, 'supplierName', e.target.value)}
                                    placeholder="Supplier Name *"
                                    className="w-full p-3.5 bg-white border border-slate-300 rounded-2xl text-base font-bold text-slate-900 focus:outline-hidden shadow-2xs"
                                  />
                                  <input
                                    type="tel"
                                    value={row.supplierPhone}
                                    onChange={(e) => handleTxChange(row.id, 'supplierPhone', e.target.value)}
                                    placeholder="Phone"
                                    className="w-full p-3.5 bg-white border border-slate-300 rounded-2xl text-base font-semibold text-slate-900 focus:outline-hidden shadow-2xs"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleTxChange(row.id, 'sourcingType', 'local');
                                    handleTxChange(row.id, 'isNewSupplier', false);
                                  }}
                                  className="px-3 py-3.5 text-xs font-black text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-2xl border border-amber-300 transition-all shadow-2xs cursor-pointer shrink-0"
                                  title="Switch back to Local Production"
                                >
                                  Local
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-2 bg-amber-50/70 p-2 rounded-2xl border border-amber-200">
                                <div>
                                  <label className="block text-[11px] font-black text-amber-900 uppercase mb-1">
                                    💳 Paid to Supplier (₹)
                                  </label>
                                  <input
                                    type="number"
                                    value={row.supplierPaid}
                                    onChange={(e) => handleTxChange(row.id, 'supplierPaid', e.target.value)}
                                    placeholder="0"
                                    className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-base font-black text-emerald-700 focus:outline-hidden shadow-2xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-black text-amber-900 uppercase mb-1">
                                    💰 Supplier Cost (₹)
                                  </label>
                                  <input
                                    type="number"
                                    value={row.supplierCost}
                                    onChange={(e) => handleTxChange(row.id, 'supplierCost', e.target.value)}
                                    placeholder="Cost"
                                    className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-base font-extrabold text-slate-900 focus:outline-hidden shadow-2xs"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : row.businessId === 'water' ? (
                    <div className="sm:col-span-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm font-black text-blue-950 flex items-center gap-1">
                          💧 Water Source & Site *
                        </label>
                        <button
                          type="button"
                          onClick={() => handleTxChange(row.id, 'isCustomWaterSource', !row.isCustomWaterSource)}
                          className="text-xs text-blue-600 font-extrabold hover:underline cursor-pointer"
                        >
                          {row.isCustomWaterSource ? 'Select Preset Source' : '+ Custom Source'}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {!row.isCustomWaterSource ? (
                          <select
                            value={row.waterSource || 'Own Borewell (Plant 1)'}
                            onChange={(e) => {
                              if (e.target.value === '__custom__') {
                                handleTxChange(row.id, 'isCustomWaterSource', true);
                                handleTxChange(row.id, 'waterSource', '');
                              } else {
                                handleTxChange(row.id, 'waterSource', e.target.value);
                              }
                            }}
                            className="w-full p-3.5 bg-blue-50 border-2 border-blue-400 rounded-2xl text-sm font-black text-blue-950 focus:bg-white focus:outline-hidden shadow-2xs cursor-pointer"
                          >
                            <option value="Own Borewell (Plant 1)">Own Borewell (Plant 1)</option>
                            <option value="Own Borewell (Plant 2)">Own Borewell (Plant 2)</option>
                            <option value="Panchayat Well Sourcing">Panchayat Well Sourcing</option>
                            <option value="River Water Source">River Water Source</option>
                            <option value="Quarry Water Sourcing">Quarry Water Sourcing</option>
                            <option value="Outsourced Tanker Supplier">Outsourced Tanker Supplier</option>
                            <option value="__custom__">+ Custom Water Source...</option>
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={row.waterSource || ''}
                            onChange={(e) => handleTxChange(row.id, 'waterSource', e.target.value)}
                            placeholder="Enter Water Source *"
                            className="w-full p-3.5 bg-white border-2 border-blue-400 rounded-2xl text-sm font-bold text-slate-900 focus:outline-hidden shadow-2xs"
                          />
                        )}

                        <input
                          type="text"
                          value={row.deliveryPlace || ''}
                          onChange={(e) => handleTxChange(row.id, 'deliveryPlace', e.target.value)}
                          placeholder="Delivery Site / Location"
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-hidden shadow-2xs"
                        />
                      </div>
                    </div>
                  ) : (
                    /* Item Description (4 cols) for non-bricks */
                    <div className="sm:col-span-4">
                      <label className="block text-sm font-black text-slate-800 mb-1.5">Item / Details</label>
                      <input
                        type="text"
                        value={row.itemService}
                        onChange={(e) => handleTxChange(row.id, 'itemService', e.target.value)}
                        placeholder="Details"
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-base font-extrabold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden shadow-2xs"
                      />
                    </div>
                  )}

                  {/* Qty (1 col) */}
                  <div className="sm:col-span-1">
                    <label className="block text-sm font-black text-slate-800 mb-1.5">Qty</label>
                    <input
                      type="number"
                      step="0.5"
                      value={row.quantity}
                      onChange={(e) => handleTxChange(row.id, 'quantity', e.target.value)}
                      placeholder="1"
                      className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-base sm:text-lg font-black text-center text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden shadow-2xs"
                    />
                  </div>

                  {/* Rate (2 cols) */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-black text-slate-800 mb-1.5">Rate (₹) *</label>
                    <input
                      type="number"
                      value={row.rate}
                      onChange={(e) => handleTxChange(row.id, 'rate', e.target.value)}
                      placeholder="0"
                      className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-base sm:text-lg font-black text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden shadow-2xs"
                    />
                  </div>

                  {/* Amount Paid (2 cols) */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-black text-slate-800 mb-1.5">Paid (₹)</label>
                    <input
                      type="number"
                      value={row.paid}
                      onChange={(e) => handleTxChange(row.id, 'paid', e.target.value)}
                      placeholder="0"
                      className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-base sm:text-lg font-black text-emerald-700 focus:bg-white focus:border-indigo-500 focus:outline-hidden shadow-2xs"
                    />
                  </div>
                </div>

                {/* JCB Specific Details (Machine Picker, Driver Picker with Name/Phone, Driver Bata, Start/End Time) */}
                {row.businessId === 'jcb' && (
                  <div className="bg-amber-50/90 p-4 rounded-2xl border-2 border-amber-300/90 space-y-4 animate-in fade-in shadow-2xs">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                      {/* Select JCB Machine (4 cols) */}
                      <div className="sm:col-span-4">
                        <label className="block text-xs font-black text-amber-950 uppercase tracking-wider mb-1.5">
                          🚜 Select JCB Machine *
                        </label>
                        <select
                          value={row.jcbVehicle || 'JCB-01 (TN-23-AX-1234)'}
                          onChange={(e) => handleTxChange(row.id, 'jcbVehicle', e.target.value)}
                          className="w-full p-3 bg-white border border-amber-400 rounded-xl text-sm font-black text-slate-900 focus:outline-hidden shadow-2xs"
                        >
                          <option value="JCB-01 (TN-23-AX-1234)">JCB-01 (TN-23-AX-1234)</option>
                          <option value="JCB-02 (TN-23-BY-5678)">JCB-02 (TN-23-BY-5678)</option>
                          <option value="JCB-03 (TN-23-CZ-9012)">JCB-03 (TN-23-CZ-9012)</option>
                          <option value="JCB-04 (TN-23-DW-3456)">JCB-04 (TN-23-DW-3456)</option>
                          <option value="JCB-05 (TN-23-EV-7890)">JCB-05 (TN-23-EV-7890)</option>
                          <option value="JCB-06 (TN-23-FU-2468)">JCB-06 (TN-23-FU-2468)</option>
                        </select>
                      </div>

                      {/* Select Driver with Name & Phone (5 cols) */}
                      <div className="sm:col-span-5">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-black text-amber-950 uppercase tracking-wider">
                            👤 Select Driver *
                          </label>
                          <button
                            type="button"
                            onClick={() => handleTxChange(row.id, 'isNewDriver', !row.isNewDriver)}
                            className="text-xs text-indigo-700 font-extrabold hover:underline cursor-pointer"
                          >
                            {row.isNewDriver ? 'Select Existing Driver' : '+ Add New Driver'}
                          </button>
                        </div>

                        {!row.isNewDriver ? (
                          <select
                            value={defaultDriversList.find((d) => d.name === row.driverName)?.id || (row.driverName ? 'custom' : '')}
                            onChange={(e) => {
                              if (e.target.value === '__new__') {
                                handleTxChange(row.id, 'isNewDriver', true);
                                handleTxChange(row.id, 'driverName', '');
                                handleTxChange(row.id, 'driverPhone', '');
                              } else {
                                const found = defaultDriversList.find((d) => d.id === e.target.value);
                                if (found) {
                                  handleTxChange(row.id, 'driverName', found.name);
                                  handleTxChange(row.id, 'driverPhone', found.phone);
                                }
                              }
                            }}
                            className="w-full p-3 bg-white border border-amber-400 rounded-xl text-sm font-black text-slate-900 focus:outline-hidden shadow-2xs"
                          >
                            <option value="">-- Choose Driver --</option>
                            <option value="__new__">+ Add New Driver (Name & Phone)</option>
                            {defaultDriversList.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.name} ({d.phone})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={row.driverName}
                              onChange={(e) => handleTxChange(row.id, 'driverName', e.target.value)}
                              placeholder="Driver Name *"
                              className="w-full p-3 bg-white border border-amber-400 rounded-xl text-sm font-bold text-slate-900 focus:outline-hidden shadow-2xs"
                            />
                            <input
                              type="tel"
                              value={row.driverPhone}
                              onChange={(e) => handleTxChange(row.id, 'driverPhone', e.target.value)}
                              placeholder="Phone Number *"
                              className="w-full p-3 bg-white border border-amber-400 rounded-xl text-sm font-bold text-slate-900 focus:outline-hidden shadow-2xs"
                            />
                          </div>
                        )}
                      </div>

                      {/* Driver Bata (₹) (3 cols) */}
                      <div className="sm:col-span-3">
                        <label className="block text-xs font-black text-amber-950 uppercase tracking-wider mb-1.5">
                          💵 Driver Bata (₹)
                        </label>
                        <input
                          type="number"
                          value={row.driverAmount || ''}
                          onChange={(e) => handleTxChange(row.id, 'driverAmount', e.target.value)}
                          placeholder="Bata Amount"
                          className="w-full p-3 bg-white border border-amber-400 rounded-xl text-sm font-black text-amber-950 focus:outline-hidden shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Subtotal Footer line */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-base pt-2 border-t border-slate-100">
                  <span className="text-slate-700 font-extrabold">
                    Subtotal: <strong className="text-slate-950 font-black text-xl ml-1">₹{totalAmt.toLocaleString('en-IN')}</strong>
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-slate-700 font-extrabold flex items-center gap-1.5">
                      Method: 
                      <select
                        value={row.paymentMethod}
                        onChange={(e) => handleTxChange(row.id, 'paymentMethod', e.target.value)}
                        className="bg-slate-100 border border-slate-300 text-slate-900 text-sm sm:text-base font-extrabold px-3 py-1.5 rounded-xl cursor-pointer focus:outline-hidden shadow-2xs"
                      >
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                      </select>
                    </span>

                    <input
                      type="text"
                      value={row.reference || ''}
                      onChange={(e) => handleTxChange(row.id, 'reference', e.target.value)}
                      placeholder={
                        row.paymentMethod === 'UPI'
                          ? 'UPI Ref / UTR (Optional)'
                          : row.paymentMethod === 'Bank Transfer'
                          ? 'Bank Txn ID / IMPS (Optional)'
                          : 'Payment ID / Ref (Optional)'
                      }
                      className="p-1.5 px-3 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-mono text-slate-800 placeholder:font-sans placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden shadow-2xs w-48 sm:w-60"
                    />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          expRows.map((row, idx) => (
            <div
              key={row.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4 shadow-2xs"
            >
              <div className="flex items-center justify-between gap-3 text-base pb-1 border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-black text-rose-700 bg-rose-50 px-3.5 py-1.5 rounded-xl border border-rose-200 text-base shadow-2xs">
                    #{idx + 1}
                  </span>
                  <select
                    value={row.businessId}
                    onChange={(e) => handleExpChange(row.id, 'businessId', e.target.value)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm sm:text-base rounded-xl px-4 py-2.5 border-2 border-indigo-700 cursor-pointer shadow-md shadow-indigo-600/20 focus:outline-hidden transition-all"
                  >
                    {businessList.map((b) => (
                      <option key={b.id} value={b.id} className="bg-white text-slate-900 font-extrabold text-sm">
                        {b.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={row.category}
                    onChange={(e) => handleExpChange(row.id, 'category', e.target.value)}
                    className="bg-rose-50 font-black text-sm sm:text-base text-rose-900 rounded-xl px-4 py-2.5 border-2 border-rose-300 cursor-pointer shadow-2xs focus:outline-hidden"
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
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                  title="Delete line"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 pt-1">
                <div className="sm:col-span-7">
                  <label className="block text-xs sm:text-sm font-black text-slate-800 mb-1.5">
                    Expense Description *
                  </label>
                  <input
                    type="text"
                    value={row.description}
                    onChange={(e) => handleExpChange(row.id, 'description', e.target.value)}
                    placeholder="Expense Description (e.g. Diesel, Labour wages) *"
                    className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-base sm:text-lg font-bold text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-hidden shadow-2xs"
                  />
                </div>

                <div className="sm:col-span-5">
                  <label className="block text-xs sm:text-sm font-black text-slate-800 mb-1.5">
                    Amount Spent (₹) *
                  </label>
                  <input
                    type="number"
                    value={row.amount}
                    onChange={(e) => handleExpChange(row.id, 'amount', e.target.value)}
                    placeholder="Amount Spent (₹) *"
                    className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-base sm:text-xl font-black text-rose-700 focus:bg-white focus:border-rose-500 focus:outline-hidden shadow-2xs"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 w-full max-w-full overflow-hidden">
        <button
          type="button"
          onClick={activeTab === 'transaction' ? addTxRow : addExpRow}
          className="px-3.5 sm:px-5 py-2.5 sm:py-3 bg-white hover:bg-slate-50 text-slate-900 font-black rounded-2xl border-2 border-slate-300 text-xs sm:text-base flex items-center gap-1.5 sm:gap-2 shadow-2xs transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 sm:w-5 h-4 sm:h-5 text-indigo-600 stroke-[3]" /> + Add Line
        </button>

        {activeTab === 'transaction' ? (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
            <label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-black text-slate-800 bg-emerald-50 px-2.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl border border-emerald-300 cursor-pointer hover:bg-emerald-100/80 transition-colors shadow-2xs shrink-0">
              <input
                type="checkbox"
                checked={sendWhatsApp}
                onChange={(e) => setSendWhatsApp(e.target.checked)}
                className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-emerald-600 rounded focus:ring-emerald-500 accent-emerald-600"
              />
              <MessageSquare className="w-4 sm:w-4.5 h-4 sm:h-4.5 text-emerald-600 shrink-0" />
              <span className="hidden sm:inline">Send Receipt on WhatsApp 📲</span>
              <span className="sm:hidden">WhatsApp</span>
            </label>

            <button
              type="button"
              onClick={handleSaveTransactions}
              className="px-3.5 sm:px-6 py-2.5 sm:py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-md text-xs sm:text-base flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer shrink-0"
            >
              <Save className="w-4 sm:w-5 h-4 sm:h-5" />
              <span className="hidden md:inline">Save Transactions</span>
              <span className="md:hidden">Save</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleSaveExpenses}
            className="px-4 sm:px-7 py-2.5 sm:py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl shadow-md text-xs sm:text-base flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer shrink-0"
          >
            <Save className="w-4 sm:w-5 h-4 sm:h-5" />
            <span className="hidden md:inline">Save Expenses</span>
            <span className="md:hidden">Save</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ExcelQuickEntry;
