import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { Fuel, PlusCircle, Gauge, DollarSign, X, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

const JCBDieselSummary = ({ onOpenAddDieselModal }) => {
  const { dieselLogs = [], jcbVehicles = [], addDieselLog } = useBusiness();
  const [filterJcb, setFilterJcb] = useState('All');

  // Modal State for Recording Diesel Refill
  const [isRefillModalOpen, setIsRefillModalOpen] = useState(false);
  const [refillJcbVehicle, setRefillJcbVehicle] = useState('JCB 1');
  const [refillDate, setRefillDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [refillQuantity, setRefillQuantity] = useState('');
  const [refillPricePerLitre, setRefillPricePerLitre] = useState('95');
  const [refillHourMeter, setRefillHourMeter] = useState('');
  const [refillBunkName, setRefillBunkName] = useState('IOCL Bunk');
  const [refillPaymentMethod, setRefillPaymentMethod] = useState('Cash');
  const [refillNotes, setRefillNotes] = useState('');

  const openRefillModal = (vehicleCode = 'JCB 1') => {
    const matchedVehicle = jcbVehicles.find(v => v.includes(vehicleCode) || vehicleCode.includes(v)) || vehicleCode;
    setRefillJcbVehicle(matchedVehicle);
    setRefillDate(new Date().toISOString().split('T')[0]);
    setRefillQuantity('');
    setRefillPricePerLitre('95');
    setRefillHourMeter('');
    setRefillBunkName('IOCL Bunk');
    setRefillPaymentMethod('Cash');
    setRefillNotes('');
    setIsRefillModalOpen(true);

    if (onOpenAddDieselModal && typeof onOpenAddDieselModal === 'function') {
      onOpenAddDieselModal(vehicleCode);
    }
  };

  const handleRefillSubmit = (e) => {
    e.preventDefault();
    const qty = Number(refillQuantity) || 0;
    const price = Number(refillPricePerLitre) || 95;
    const totalCost = qty * price;

    addDieselLog({
      jcbVehicle: refillJcbVehicle,
      date: refillDate,
      quantity: qty,
      pricePerLitre: price,
      totalCost: totalCost,
      hourMeterReading: Number(refillHourMeter) || 0,
      bunkName: refillBunkName.trim(),
      paymentMethod: refillPaymentMethod,
      notes: refillNotes.trim()
    });

    setIsRefillModalOpen(false);
  };

  // Real-time Date Metrics
  const todayStr = new Date().toISOString().split('T')[0];

  const todayDieselCost = dieselLogs
    .filter((log) => log.date === todayStr)
    .reduce((sum, log) => sum + (Number(log.totalCost) || 0), 0);

  const todayDieselLitres = dieselLogs
    .filter((log) => log.date === todayStr)
    .reduce((sum, log) => sum + (Number(log.quantity) || 0), 0);

  const totalDieselSpent = dieselLogs.reduce((sum, log) => sum + (Number(log.totalCost) || 0), 0);
  const totalDieselLitres = dieselLogs.reduce((sum, log) => sum + (Number(log.quantity) || 0), 0);

  // Filter logs if vehicle selected
  const filteredLogs = filterJcb === 'All'
    ? dieselLogs
    : dieselLogs.filter((log) => log.jcbVehicle && log.jcbVehicle.includes(filterJcb));

  // Machine-wise Real Diesel Refill Breakdown
  const jcbList = jcbVehicles.length ? jcbVehicles : ['JCB 1', 'JCB 2', 'JCB 3', 'JCB 4', 'JCB 5', 'H85', 'Tata A33'];
  const jcbEfficiencyList = jcbList.map((vehicleStr) => {
    const shortCode = vehicleStr.split(' ')[0] + (vehicleStr.split(' ')[1] ? ` ${vehicleStr.split(' ')[1]}` : '');

    const machineLogs = dieselLogs.filter((log) => log.jcbVehicle && log.jcbVehicle.includes(shortCode));
    const totalLitres = machineLogs.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0);
    const totalCost = machineLogs.reduce((sum, l) => sum + (Number(l.totalCost) || 0), 0);

    const latestLog = machineLogs[0];

    return {
      vehicle: vehicleStr,
      shortCode,
      totalLitres,
      totalCost,
      lastRefill: latestLog ? latestLog.displayDate || latestLog.date : 'No Refills Yet',
      meterReading: latestLog ? latestLog.hourMeterReading || 0 : 0
    };
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Action Button */}
      <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 rounded-3xl p-6 text-slate-950 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-black/10 rounded-2xl">
              <Fuel className="w-6 h-6 text-slate-950" />
            </span>
            <h2 className="text-xl font-black tracking-tight">Diesel Management & Analytics ⛽</h2>
          </div>
          <p className="text-xs text-slate-900/80 font-bold max-w-xl">
            Track fuel refills, daily expenditure, bunk receipts, and machine hour meter readings in real time.
          </p>
        </div>

        <button
          onClick={() => openRefillModal('JCB 1')}
          className="px-5 py-3 bg-slate-950 hover:bg-slate-900 text-amber-400 font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xl hover:scale-102 transition-all shrink-0 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 text-amber-400" /> Record Diesel Refill
        </button>
      </div>

      {/* 3 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block font-sans">
            Today's Diesel Cost
          </span>
          <p className="text-2xl font-black text-rose-600 mt-1">
            {formatCurrency(todayDieselCost)}
          </p>
          <span className="text-[11px] text-slate-500 font-bold mt-1 block font-sans">
            {todayDieselLitres > 0 ? `Today's Refills: ${todayDieselLitres} Litres` : 'No refills logged today'}
          </span>
          <div className="absolute right-4 top-4 text-rose-100">
            <Fuel className="w-10 h-10" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block font-sans">
            Total Diesel Spent
          </span>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {formatCurrency(totalDieselSpent)}
          </p>
          <span className="text-[11px] text-slate-500 font-bold mt-1 block font-sans">
            Total Refilled: {totalDieselLitres} L
          </span>
          <div className="absolute right-4 top-4 text-amber-100">
            <DollarSign className="w-10 h-10" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block font-sans">
            Total Diesel Entries
          </span>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {dieselLogs.length} Records
          </p>
          <span className="text-[11px] text-emerald-700 font-bold mt-1 block font-sans">
            Real-time synced log history
          </span>
          <div className="absolute right-4 top-4 text-emerald-100">
            <Gauge className="w-10 h-10" />
          </div>
        </div>
      </div>

      {/* Machine-wise Diesel Refill Breakdown */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Gauge className="w-5 h-5 text-amber-500" />
              Machine-wise Diesel Summary
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Fuel consumption and latest meter readings per machine
            </p>
          </div>
        </div>

        {/* Machine Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-mono">
          {jcbEfficiencyList.map((m) => (
            <div
              key={m.shortCode}
              className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 hover:border-amber-400 transition-all"
            >
              <div className="flex items-center justify-between font-sans">
                <span className="font-extrabold text-slate-900 text-sm">{m.shortCode}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[11px]">
                  {m.totalLitres} L Total
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Diesel Filled:</span>
                  <span className="font-bold text-amber-700">{m.totalLitres} Litres</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Meter Reading:</span>
                  <span className="font-bold text-slate-800">{m.meterReading > 0 ? `${m.meterReading} hrs` : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Refill Date:</span>
                  <span className="font-bold text-slate-700">{m.lastRefill}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span>Total Diesel Cost:</span>
                  <span className="font-black text-rose-600">{formatCurrency(m.totalCost)}</span>
                </div>
              </div>

              <button
                onClick={() => openRefillModal(m.shortCode)}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer font-sans"
              >
                + Refill {m.shortCode}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Diesel Expense Tracking Log Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 font-sans">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Fuel className="w-5 h-5 text-yellow-500" />
            Diesel Expense Tracking Log
          </h3>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Filter JCB:</span>
            <select
              value={filterJcb}
              onChange={(e) => setFilterJcb(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
            >
              <option value="All">All Machines</option>
              <option value="JCB 1">JCB 1</option>
              <option value="JCB 2">JCB 2</option>
              <option value="JCB 3">JCB 3</option>
              <option value="JCB 4">JCB 4</option>
              <option value="JCB 5">JCB 5</option>
              <option value="H85">H85</option>
              <option value="Tata A33">Tata A33</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-black uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">JCB Vehicle</th>
                <th className="py-3.5 px-4 text-right">Quantity (L)</th>
                <th className="py-3.5 px-4 text-right">Price / Litre</th>
                <th className="py-3.5 px-4 text-right">Total Cost</th>
                <th className="py-3.5 px-4 text-center">Meter Reading</th>
                <th className="py-3.5 px-4">Fuel Station</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-400 font-bold font-sans">
                    No diesel records logged yet. Click <span className="text-amber-600 font-black cursor-pointer" onClick={() => openRefillModal('JCB 1')}>[ + Record Diesel Refill ]</span> to add one.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-800">{log.displayDate || log.date}</td>
                    <td className="py-3.5 px-4 font-black text-amber-700">
                      {log.jcbVehicle}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900">
                      {log.quantity} Litres
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-600">
                      ₹{log.pricePerLitre}/L
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-rose-600 text-sm">
                      {formatCurrency(log.totalCost)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                      <span className="px-2 py-0.5 bg-slate-100 rounded-md">
                        {log.hourMeterReading || 0} hrs
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{log.bunkName || 'IOCL Bunk'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / RECORD DIESEL REFILL MODAL */}
      {isRefillModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200 font-sans">
          <div className="bg-white text-slate-900 border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Fuel className="w-5 h-5 text-amber-600" />
                Record Diesel Refill
              </h3>
              <button
                onClick={() => setIsRefillModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRefillSubmit} className="space-y-4 text-xs sm:text-sm font-black font-mono">
              <div>
                <label className="block text-slate-800 mb-1.5">JCB Machine</label>
                <select
                  value={refillJcbVehicle}
                  onChange={(e) => setRefillJcbVehicle(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-black text-slate-900 text-base"
                >
                  <option value="JCB 1">JCB 1</option>
                  <option value="JCB 2">JCB 2</option>
                  <option value="JCB 3">JCB 3</option>
                  <option value="JCB 4">JCB 4</option>
                  <option value="JCB 5">JCB 5</option>
                  <option value="H85">H85</option>
                  <option value="Tata A33">Tata A33</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-800 mb-1.5">Date</label>
                  <input
                    type="date"
                    required
                    value={refillDate}
                    onChange={(e) => setRefillDate(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl font-black text-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 mb-1.5">Quantity (Litres)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    required
                    placeholder="e.g. 40"
                    value={refillQuantity}
                    onChange={(e) => setRefillQuantity(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl font-black text-slate-900 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-800 mb-1.5">Price / Litre (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 95"
                    value={refillPricePerLitre}
                    onChange={(e) => setRefillPricePerLitre(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl font-black text-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 mb-1.5">Hour Meter (hrs)</label>
                  <input
                    type="number"
                    placeholder="e.g. 4528"
                    value={refillHourMeter}
                    onChange={(e) => setRefillHourMeter(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl font-black text-slate-900 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-800 mb-1.5">Fuel Bunk / Station Name</label>
                <input
                  type="text"
                  placeholder="e.g. IOCL Bunk"
                  value={refillBunkName}
                  onChange={(e) => setRefillBunkName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl font-black text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-800 mb-1.5">Payment Method</label>
                <select
                  value={refillPaymentMethod}
                  onChange={(e) => setRefillPaymentMethod(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl font-black text-slate-900 text-sm"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Credit">Fuel Credit / Account</option>
                </select>
              </div>

              {/* Total Cost Display */}
              <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 flex justify-between items-center text-sm font-black text-amber-900">
                <span>Total Cost Preview:</span>
                <span className="text-base text-rose-700">
                  {formatCurrency((Number(refillQuantity) || 0) * (Number(refillPricePerLitre) || 95))}
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 font-sans">
                <button
                  type="button"
                  onClick={() => setIsRefillModalOpen(false)}
                  className="px-5 py-3 bg-slate-100 text-slate-800 font-black rounded-2xl cursor-pointer hover:bg-slate-200 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-2xl shadow-md shadow-amber-600/20 cursor-pointer text-sm"
                >
                  Save Refill Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JCBDieselSummary;
