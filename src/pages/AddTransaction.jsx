import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import PageHeader from '../components/layout/PageHeader';
import { calculateTotal, calculateOutstanding, calculateJCBDuration } from '../utils/calculations';
import { formatCurrency } from '../utils/formatCurrency';
import { formatTransactionWhatsApp, openWhatsAppChat } from '../utils/whatsapp';
import WhatsAppModal from '../components/common/WhatsAppModal';
import { PlusCircle, Clock, UserPlus, Phone, User, MapPin, Truck, Boxes, Droplets, UserCheck, Building, MessageSquare, Send } from 'lucide-react';

const AddTransaction = () => {
  const { customers, businesses, addTransaction, addCustomer, jcbVehicles = [] } = useBusiness();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const preselectedCustomer = searchParams.get('customer') || '';
  const preselectedBusiness = searchParams.get('business') || 'bricks';

  const [businessId, setBusinessId] = useState(preselectedBusiness);
  const [customerId, setCustomerId] = useState(preselectedCustomer || (customers[0]?.id || ''));

  // Inline "New Customer" mode state
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  // Common inputs
  const [itemService, setItemService] = useState('Red Bricks');
  const [quantity, setQuantity] = useState('2');
  const [unit, setUnit] = useState('Lorry');
  const [rate, setRate] = useState('8000');
  const [additionalCharge, setAdditionalCharge] = useState('0');
  const [paymentReceived, setPaymentReceived] = useState('10000');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [date, setDate] = useState('2026-08-11');
  const [notes, setNotes] = useState('Delivery at construction site');

  // JCB-specific inputs (Driver Details & Driver Amount)
  const [jcbVehicle, setJcbVehicle] = useState('JCB-01 (TN-23-AX-1234)');
  const [driverName, setDriverName] = useState('Murugan (Driver)');
  const [driverPhone, setDriverPhone] = useState('9845012345');
  const [driverAmount, setDriverAmount] = useState('500');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('12:00');
  const [duration, setDuration] = useState(2);

  // Bricks-specific inputs (Outsourced toggle, supplier name, cost)
  const [isOutsourced, setIsOutsourced] = useState(false);
  const [outsourcedSupplier, setOutsourcedSupplier] = useState('Sri Lakshmi Brick Chamber');
  const [outsourcedCost, setOutsourcedCost] = useState('12000');

  // Water-specific inputs (Water Source & Delivery Place)
  const [waterSource, setWaterSource] = useState('Deep Potable Borewell (Katpadi Plant)');
  const [deliveryPlace, setDeliveryPlace] = useState('Velachery Commercial Building Site');

  // WhatsApp notification state
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppPhone, setWhatsAppPhone] = useState('');
  const [whatsAppCustName, setWhatsAppCustName] = useState('');
  const [whatsAppText, setWhatsAppText] = useState('');
  const [savedTargetCustId, setSavedTargetCustId] = useState('');

  // Update defaults when business changes
  useEffect(() => {
    if (businessId === 'bricks') {
      setItemService('Red Bricks');
      setUnit('Lorry');
      setRate('8000');
      setQuantity('2');
      setPaymentReceived('10000');
    } else if (businessId === 'jcb') {
      setItemService('JCB Earthmoving');
      setUnit('Hours');
      setRate('1000');
      setQuantity('2');
      setPaymentReceived('2000');
    } else if (businessId === 'water') {
      setItemService('Water Tanker Load (12,000L)');
      setUnit('Loads');
      setRate('1000');
      setQuantity('5');
      setPaymentReceived('5000');
    } else if (businessId === 'jalli') {
      setItemService('20mm Blue Metal Jalli');
      setUnit('Lorry');
      setRate('5500');
      setQuantity('1');
      setPaymentReceived('5500');
    }
  }, [businessId]);

  // Recalculate JCB duration
  useEffect(() => {
    if (businessId === 'jcb') {
      const dur = calculateJCBDuration(startTime, endTime);
      setDuration(dur);
      setQuantity(dur.toString());
    }
  }, [startTime, endTime, businessId]);

  const totalAmount = calculateTotal(quantity, rate, additionalCharge);
  const outstandingAmount = calculateOutstanding(totalAmount, paymentReceived);

  const handleSubmit = (e) => {
    e.preventDefault();

    let targetCustId = customerId;
    let targetCustName = '';
    let targetCustPhone = '';

    if (isNewCustomer) {
      if (!newCustName.trim() || !newCustPhone.trim()) {
        alert('Please provide both Customer Name and Phone Number');
        return;
      }
      const createdCust = addCustomer({
        name: newCustName.trim(),
        phone: newCustPhone.trim(),
        address: newCustAddress.trim()
      });
      targetCustId = createdCust.id;
      targetCustName = createdCust.name;
      targetCustPhone = createdCust.phone;
    } else {
      const existingCust = customers.find((c) => c.id === customerId);
      if (!existingCust) {
        alert('Please select a valid customer');
        return;
      }
      targetCustName = existingCust.name;
      targetCustPhone = existingCust.phone;
    }

    const selectedBusObj = businesses.find((b) => b.id === businessId);

    addTransaction({
      customerId: targetCustId,
      customerName: targetCustName,
      phone: targetCustPhone,
      businessId: selectedBusObj.id,
      businessName: selectedBusObj.name,
      itemService,
      quantity,
      unit,
      rate,
      amount: totalAmount,
      paid: paymentReceived,
      due: outstandingAmount,
      paymentMethod,
      date,
      notes,
      jcbVehicle,
      driverName,
      driverPhone,
      driverAmount,
      startTime,
      endTime,
      duration,
      isOutsourced,
      outsourcedSupplier,
      outsourcedCost,
      waterSource,
      deliveryPlace
    });

    if (sendWhatsApp && targetCustPhone) {
      const waMessage = formatTransactionWhatsApp({
        customerName: targetCustName,
        serviceName: selectedBusObj.name,
        quantity,
        unit,
        amount: totalAmount,
        paid: paymentReceived,
        due: outstandingAmount
      });

      // Directly open WhatsApp Chat window
      openWhatsAppChat(targetCustPhone, waMessage);

      setWhatsAppPhone(targetCustPhone);
      setWhatsAppCustName(targetCustName);
      setWhatsAppText(waMessage);
      setSavedTargetCustId(targetCustId);
      setIsWhatsAppModalOpen(true);
    } else {
      navigate(`/customers/${targetCustId}`);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      <PageHeader
        title="Add Transaction"
        subtitle="Record a new sale or service entry with dynamic business-specific fields"
        backUrl="/transactions"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Business Selection Pills */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Select Business Unit *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {businesses.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBusinessId(b.id)}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                      businessId === b.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{b.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Customer Section with "+ Add New Customer" option */}
            {!isNewCustomer ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Customer *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsNewCustomer(true)}
                    className="text-xs text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-1 transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> + Add New Customer
                  </button>
                </div>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  required
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — Phone: {c.phone}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              /* Dedicated Separate New Customer Inputs Section */
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-indigo-200/80 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-indigo-600" /> New Customer Details
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsNewCustomer(false)}
                    className="text-xs text-indigo-600 font-bold hover:underline"
                  >
                    Select Existing Customer
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Customer Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={newCustName}
                        onChange={(e) => setNewCustName(e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:border-indigo-500"
                        required={isNewCustomer}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={newCustPhone}
                        onChange={(e) => setNewCustPhone(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:border-indigo-500"
                        required={isNewCustomer}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Delivery / Site Address
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={newCustAddress}
                      onChange={(e) => setNewCustAddress(e.target.value)}
                      placeholder="e.g. No. 25, VIT Road, Katpadi, Vellore"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 1. JCB SPECIFIC: DRIVER DETAILS & DRIVER BATA AMOUNT */}
            {businessId === 'jcb' && (
              <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-4">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                  <Truck className="w-4 h-4 text-amber-600" /> JCB Machine & Driver Details
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">JCB Vehicle</label>
                    <select
                      value={jcbVehicle}
                      onChange={(e) => setJcbVehicle(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                    >
                      {jcbVehicles.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">End Time</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-amber-200/60">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Driver Name *</label>
                    <input
                      type="text"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      placeholder="e.g. Murugan (Driver)"
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Driver Phone</label>
                    <input
                      type="tel"
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      placeholder="e.g. 9845012345"
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Driver Bata / Amount (₹) *</label>
                    <input
                      type="number"
                      value={driverAmount}
                      onChange={(e) => setDriverAmount(e.target.value)}
                      placeholder="e.g. 500"
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-amber-700"
                    />
                  </div>
                </div>
                <p className="text-xs font-bold text-amber-800">
                  Calculated Hours: {duration} Hours • Driver Wage: {formatCurrency(driverAmount)}
                </p>
              </div>
            )}

            {/* 2. BRICKS SPECIFIC: OUTSOURCED OPTION & SUPPLIER */}
            {businessId === 'bricks' && (
              <div className="p-4 bg-orange-50/70 rounded-2xl border border-orange-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-900 flex items-center gap-1.5">
                    <Boxes className="w-4 h-4 text-orange-600" /> Sourcing & Production Type
                  </span>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isOutsourced}
                      onChange={(e) => setIsOutsourced(e.target.checked)}
                      className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-xs font-bold text-orange-900">Is Outsourced Supply?</span>
                  </label>
                </div>

                {isOutsourced && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-orange-200/60">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Outsourced Chamber / Supplier Name *
                      </label>
                      <input
                        type="text"
                        value={outsourcedSupplier}
                        onChange={(e) => setOutsourcedSupplier(e.target.value)}
                        placeholder="e.g. Sri Lakshmi Brick Chamber"
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Purchase Cost from Supplier (₹)
                      </label>
                      <input
                        type="number"
                        value={outsourcedCost}
                        onChange={(e) => setOutsourcedCost(e.target.value)}
                        placeholder="e.g. 12000"
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-rose-600"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. WATER SPECIFIC: WATER SOURCE & DELIVERY PLACE */}
            {businessId === 'water' && (
              <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-blue-600" /> Water Supply Location & Source
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Water Source *
                    </label>
                    <select
                      value={waterSource}
                      onChange={(e) => setWaterSource(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                    >
                      <option value="Deep Potable Borewell (Katpadi Plant)">Deep Potable Borewell (Katpadi Plant)</option>
                      <option value="Municipal Water Tank">Municipal Water Tank</option>
                      <option value="Commercial Treatment Well">Commercial Treatment Well</option>
                      <option value="River Water Station">River Water Station</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Delivery Place / Customer Site Location *
                    </label>
                    <input
                      type="text"
                      value={deliveryPlace}
                      onChange={(e) => setDeliveryPlace(e.target.value)}
                      placeholder="e.g. Velachery Commercial Building Site"
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Item / Service Description
                </label>
                <input
                  type="text"
                  value={itemService}
                  onChange={(e) => setItemService(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:border-indigo-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Rate per Unit (₹)
                </label>
                <input
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Transport / Delivery Fee (₹)
                </label>
                <input
                  type="number"
                  value={additionalCharge}
                  onChange={(e) => setAdditionalCharge(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Received Now (₹)
                </label>
                <input
                  type="number"
                  value={paymentReceived}
                  onChange={(e) => setPaymentReceived(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI (GPay / PhonePe)</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT / IMPS)</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Transaction Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Delivery location details, site supervisor name..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            {/* WhatsApp Notification Checkbox */}
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-emerald-950 block">Customer WhatsApp Notification</span>
                  <span className="text-[11px] text-emerald-700 font-medium">Send transaction summary & due balance directly to WhatsApp</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={sendWhatsApp}
                onChange={(e) => setSendWhatsApp(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded-sm border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => navigate('/transactions')}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" /> Save & Send WhatsApp 💬
              </button>
            </div>
          </form>
        </div>

        {/* Live Calculation Summary Sidebar Card */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-4">
              Calculation Summary
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400">Rate × Quantity</span>
                <span className="font-mono text-slate-200">
                  {quantity} × {formatCurrency(rate)}
                </span>
              </div>

              {Number(additionalCharge) > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-400">Additional Charges</span>
                  <span className="font-mono text-slate-200">+{formatCurrency(additionalCharge)}</span>
                </div>
              )}

              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="font-bold text-white text-sm">Total Bill Amount</span>
                <span className="text-lg font-extrabold text-white">{formatCurrency(totalAmount)}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-800 text-emerald-400">
                <span>Payment Received</span>
                <span className="font-bold">{formatCurrency(paymentReceived)}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 flex justify-between items-center">
                <span className="font-bold text-amber-400">Remaining Balance</span>
                <span className="text-base font-extrabold text-amber-400">
                  {formatCurrency(outstandingAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Live WhatsApp Preview Box */}
          {sendWhatsApp && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 uppercase tracking-wider">
                <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Customer Preview
              </span>
              <div className="text-[11px] font-sans text-slate-300 bg-slate-900 p-3 rounded-lg border border-slate-800 leading-relaxed whitespace-pre-wrap">
                Hello {isNewCustomer ? newCustName || 'Customer' : customers.find(c => c.id === customerId)?.name || 'Customer'} 👋{"\n\n"}
                Your {businesses.find(b => b.id === businessId)?.name || 'Service'} transaction has been recorded.{"\n\n"}
                🚜 {businesses.find(b => b.id === businessId)?.name || 'Service'}: {quantity} {unit}{"\n"}
                💰 Total: ₹{Number(totalAmount).toLocaleString('en-IN')}{"\n"}
                ✅ Paid: ₹{Number(paymentReceived).toLocaleString('en-IN')}{"\n"}
                ⏳ Remaining: ₹{Number(outstandingAmount).toLocaleString('en-IN')}{"\n\n"}
                Thank you for choosing Loganathan Earth Movers.
              </div>
            </div>
          )}

          <div className="pt-2 text-[11px] text-slate-400">
            ✓ Updates Customer Ledger, JCB/Driver Working Hours, Revenue & Reports automatically.
          </div>
        </div>
      </div>

      {/* WhatsApp Modal Dialog */}
      <WhatsAppModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => {
          setIsWhatsAppModalOpen(false);
          if (savedTargetCustId) {
            navigate(`/customers/${savedTargetCustId}`);
          }
        }}
        phone={whatsAppPhone}
        customerName={whatsAppCustName}
        messageText={whatsAppText}
      />
    </div>
  );
};

export default AddTransaction;
