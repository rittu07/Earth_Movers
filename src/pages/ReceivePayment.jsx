import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import PageHeader from '../components/layout/PageHeader';
import { formatCurrency } from '../utils/formatCurrency';
import { formatPaymentWhatsApp, openWhatsAppChat } from '../utils/whatsapp';
import WhatsAppModal from '../components/common/WhatsAppModal';
import { Wallet, UserPlus, User, Phone, MapPin, MessageSquare, Send } from 'lucide-react';

const ReceivePayment = () => {
  const { customers, addPayment, addCustomer } = useBusiness();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const preselectedCustomer = searchParams.get('customer') || '';

  const [customerId, setCustomerId] = useState(preselectedCustomer || (customers[0]?.id || ''));

  // Inline "New Customer" mode state
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Cash');
  const [reference, setReference] = useState(`REF-${Math.floor(100000 + Math.random() * 900000)}`);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // WhatsApp notification state
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppPhone, setWhatsAppPhone] = useState('');
  const [whatsAppCustName, setWhatsAppCustName] = useState('');
  const [whatsAppText, setWhatsAppText] = useState('');
  const [savedTargetCustId, setSavedTargetCustId] = useState('');

  const selectedCustObj = customers.find((c) => c.id === customerId);

  useEffect(() => {
    if (selectedCustObj && !isNewCustomer) {
      setAmount(selectedCustObj.outstanding > 0 ? selectedCustObj.outstanding.toString() : '1000');
    }
  }, [customerId, isNewCustomer]);

  const currentOutstanding = isNewCustomer ? 0 : (selectedCustObj?.outstanding || 0);
  const payVal = Number(amount) || 0;
  const remaining = Math.max(0, currentOutstanding - payVal);

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
      if (!selectedCustObj) {
        alert('Please select a valid customer');
        return;
      }
      targetCustName = selectedCustObj.name;
      targetCustPhone = selectedCustObj.phone;
    }

    addPayment({
      customerId: targetCustId,
      customerName: targetCustName,
      phone: targetCustPhone,
      amount: payVal,
      method,
      reference,
      date,
      notes
    });

    if (sendWhatsApp && targetCustPhone) {
      const waMsg = formatPaymentWhatsApp({
        customerName: targetCustName,
        amount: payVal,
        reference,
        remainingOutstanding: remaining
      });

      // Directly open WhatsApp Chat window
      openWhatsAppChat(targetCustPhone, waMsg);

      setWhatsAppPhone(targetCustPhone);
      setWhatsAppCustName(targetCustName);
      setWhatsAppText(waMsg);
      setSavedTargetCustId(targetCustId);
      setIsWhatsAppModalOpen(true);
    } else {
      navigate(`/customers/${targetCustId}`);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      <PageHeader
        title="Receive Payment"
        subtitle="Record cash, UPI, or bank payment received from a customer"
        backUrl="/payments"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Customer Section with "+ Add New Customer" option */}
            {!isNewCustomer ? (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Select Customer *
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
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  required
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — Phone: {c.phone} (Due: {formatCurrency(c.outstanding)})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              /* Dedicated Separate New Customer Inputs Section */
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-emerald-600" /> New Customer Details
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsNewCustomer(false)}
                    className="text-xs text-emerald-700 font-bold hover:underline"
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
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:border-emerald-500"
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
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:border-emerald-500"
                        required={isNewCustomer}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Address
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={newCustAddress}
                      onChange={(e) => setNewCustAddress(e.target.value)}
                      placeholder="e.g. No. 25, VIT Road, Katpadi"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Amount Received (₹) *
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Method
                </label>
                <select
                  value={method}
                  onChange={(e) => {
                    const newMethod = e.target.value;
                    setMethod(newMethod);
                    if ((newMethod === 'UPI' || newMethod === 'Bank Transfer' || newMethod === 'Cheque') && reference.startsWith('REF-')) {
                      setReference('');
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT / RTGS / IMPS)</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {method === 'UPI'
                    ? 'UPI Reference ID / UTR Number (Optional)'
                    : method === 'Bank Transfer'
                    ? 'Bank Transaction ID / IMPS Ref (Optional)'
                    : method === 'Cheque'
                    ? 'Cheque Number (Optional)'
                    : 'Reference No. (Optional)'}
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder={
                    method === 'UPI'
                      ? 'e.g. 423456789012 or GPay Ref ID'
                      : method === 'Bank Transfer'
                      ? 'e.g. TXN987654321 or IMPS/NEFT Ref'
                      : method === 'Cheque'
                      ? 'e.g. CHQ-987654'
                      : 'e.g. REF-123456'
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-700 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Notes
              </label>
              <textarea
                rows="2"
                placeholder="Additional details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            {/* WhatsApp Checkbox */}
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-emerald-950 block">Customer WhatsApp Payment Receipt</span>
                  <span className="text-[11px] text-emerald-700 font-medium">Send payment receipt & remaining balance via WhatsApp</span>
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
                onClick={() => navigate('/payments')}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" /> Save & Send Receipt 💬
              </button>
            </div>
          </form>
        </div>

        {/* Live Outstanding Calculation Card */}
        <div className="bg-emerald-900 text-white rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-4">
              <Wallet className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-300">
              Payment Summary
            </h3>

            <div className="mt-6 space-y-4 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-emerald-800">
                <span className="text-emerald-200">Current Outstanding</span>
                <span className="font-bold text-white text-sm">
                  {formatCurrency(currentOutstanding)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-emerald-800">
                <span className="text-emerald-200">Payment Receiving</span>
                <span className="font-extrabold text-emerald-300 text-base">
                  -{formatCurrency(payVal)}
                </span>
              </div>

              <div className="p-3 bg-emerald-950/80 rounded-xl border border-emerald-700 flex justify-between items-center">
                <span className="font-bold text-emerald-200">Remaining Balance</span>
                <span className="text-lg font-extrabold text-white">
                  {formatCurrency(remaining)}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-6 text-[11px] text-emerald-300/80">
            Automatically updates ledger statement.
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

export default ReceivePayment;
