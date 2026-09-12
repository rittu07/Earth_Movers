import React, { useState, useEffect } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { X, Fuel, Gauge, Calendar, CreditCard, MapPin } from 'lucide-react';

const AddDieselModal = ({ isOpen, onClose, defaultJcb = 'JCB 1' }) => {
  const { jcbVehicles = [], addDieselLog } = useBusiness();

  const [jcbVehicle, setJcbVehicle] = useState(defaultJcb);
  const [date, setDate] = useState('2026-08-14');
  const [quantity, setQuantity] = useState('40');
  const [pricePerLitre, setPricePerLitre] = useState('95');
  const [totalCost, setTotalCost] = useState('3800');
  const [hourMeterReading, setHourMeterReading] = useState('1257');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [reference, setReference] = useState('');
  const [bunkName, setBunkName] = useState('IOCL Bunk Katpadi');
  const [notes, setNotes] = useState('Tank filled before site work');

  // Sync default vehicle when modal opens
  useEffect(() => {
    if (defaultJcb) {
      setJcbVehicle(defaultJcb);
    }
  }, [defaultJcb, isOpen]);

  // Auto calculate total cost when quantity or price changes
  useEffect(() => {
    const q = parseFloat(quantity) || 0;
    const p = parseFloat(pricePerLitre) || 0;
    setTotalCost((q * p).toString());
  }, [quantity, pricePerLitre]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    const combinedNotes = reference.trim()
      ? `Ref: ${reference.trim()}${notes.trim() ? ' - ' + notes.trim() : ''}`
      : notes;

    addDieselLog({
      jcbVehicle,
      date,
      quantity: Number(quantity) || 0,
      pricePerLitre: Number(pricePerLitre) || 0,
      totalCost: Number(totalCost) || 0,
      hourMeterReading: Number(hourMeterReading) || 0,
      paymentMethod,
      bunkName,
      notes: combinedNotes
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-yellow-500 p-5 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black/10 flex items-center justify-center">
              <Fuel className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Record Diesel Refill ⛽</h2>
              <p className="text-xs text-slate-900/80 font-semibold">
                Store fuel logs & track JCB litres per hour efficiency
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-slate-950" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select JCB Machine *
            </label>
            <select
              value={jcbVehicle}
              onChange={(e) => setJcbVehicle(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-hidden focus:border-amber-500"
              required
            >
              {jcbVehicles.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Refill Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-slate-400" /> Hour Meter (hrs)
              </label>
              <input
                type="number"
                value={hourMeterReading}
                onChange={(e) => setHourMeterReading(e.target.value)}
                placeholder="e.g. 1257"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-amber-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200/60">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Quantity (L)
              </label>
              <input
                type="number"
                step="0.1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="40"
                className="w-full p-2 bg-white border border-amber-200 rounded-xl text-sm font-bold text-amber-900 focus:outline-hidden focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Price / Litre (₹)
              </label>
              <input
                type="number"
                step="0.5"
                value={pricePerLitre}
                onChange={(e) => setPricePerLitre(e.target.value)}
                placeholder="95"
                className="w-full p-2 bg-white border border-amber-200 rounded-xl text-sm font-bold text-amber-900 focus:outline-hidden focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Total Cost (₹)
              </label>
              <input
                type="number"
                value={totalCost}
                onChange={(e) => setTotalCost(e.target.value)}
                className="w-full p-2 bg-white border border-amber-300 rounded-xl text-sm font-black text-rose-600 focus:outline-hidden focus:border-amber-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" /> Payment Mode
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Fuel Station / Bunk
              </label>
              <input
                type="text"
                value={bunkName}
                onChange={(e) => setBunkName(e.target.value)}
                placeholder="e.g. IOCL Katpadi"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {paymentMethod === 'UPI'
                ? 'UPI Reference ID / UTR Number (Optional)'
                : paymentMethod === 'Bank Transfer'
                ? 'Bank Transaction ID / IMPS Ref (Optional)'
                : 'Reference No. (Optional)'}
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder={
                paymentMethod === 'UPI'
                  ? 'e.g. 423456789012 or GPay Ref ID'
                  : paymentMethod === 'Bank Transfer'
                  ? 'e.g. TXN987654321 or IMPS/NEFT Ref'
                  : 'e.g. REF-123456'
              }
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. IOCL Bunk Katpadi receipt # 542"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs shadow-md shadow-yellow-500/20 transition-all flex items-center gap-1.5"
            >
              <Fuel className="w-4 h-4" /> Save Diesel Refill
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDieselModal;
