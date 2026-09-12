import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import PageHeader from '../components/layout/PageHeader';
import { formatCurrency, formatDate } from '../utils/formatCurrency';
import { getLoanCalculatedDetails, getLoanDueDateInfo } from '../utils/loanUtils';
import { exportToPdf } from '../utils/pdfGenerator';
import { isMonthSettled, getFirstUnsettledMonth, buildLoanLedgerEvents } from './Finance';
import { formatFinanceReturnPaymentWhatsApp, openWhatsAppChat } from '../utils/whatsapp';
import WhatsAppModal from '../components/common/WhatsAppModal';
import {
  Phone,
  MapPin,
  PlusCircle,
  Wallet,
  Download,
  Share2,
  ArrowLeft,
  Calendar,
  Clock,
  X
} from 'lucide-react';

const FinanceLoanLedger = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { financeLoans = [], recordReturnPayment } = useBusiness();
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'transactions', 'payments', 'outstanding'

  // Modal State for Return Payment from Ledger Page
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnPayAmount, setReturnPayAmount] = useState('');
  const [returnPayMethod, setReturnPayMethod] = useState('Cash');
  const [returnPayRef, setReturnPayRef] = useState('');
  const [returnPayMonth, setReturnPayMonth] = useState('');
  const [returnPayMonths, setReturnPayMonths] = useState('');
  const [returnPayDate, setReturnPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnPayDiscount, setReturnPayDiscount] = useState('');

  // WhatsApp notification state
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppPhone, setWhatsAppPhone] = useState('');
  const [whatsAppCustName, setWhatsAppCustName] = useState('');
  const [whatsAppText, setWhatsAppText] = useState('');

  const rawLoan = financeLoans.find((l) => l.id === id || l.borrowerName.toLowerCase() === (id || '').toLowerCase());
  const loanCalculated = rawLoan ? getLoanCalculatedDetails(rawLoan) : null;

  if (!loanCalculated) {
    return (
      <div className="py-12 text-center space-y-3 font-sans">
        <h2 className="text-xl font-bold text-slate-800">Finance Loan Record Not Found</h2>
        <p className="text-sm text-slate-500">The requested loan record ID "{id}" does not exist.</p>
        <Link
          to="/finance"
          className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-md"
        >
          ← Back to Finance Ledger
        </Link>
      </div>
    );
  }

  const allEvents = buildLoanLedgerEvents(loanCalculated);
  const filteredEvents = allEvents.filter((ev) => {
    if (activeTab === 'transactions') return ev.type === 'Transaction';
    if (activeTab === 'payments') return ev.type === 'Payment';
    if (activeTab === 'outstanding') return ev.remainingDue > 0;
    return true;
  });

  const totalDuesAccrued = loanCalculated.totalAmount;
  const totalPaidReturned = loanCalculated.returnedAmount || 0;
  const netRemainingDue = loanCalculated.dueAmount;

  // Download Statement PDF
  const handleDownloadPdf = () => {
    exportToPdf({
      title: 'FINANCE LOAN ACCOUNT STATEMENT',
      customerName: loanCalculated.borrowerName,
      phone: loanCalculated.phone,
      subtitle: `Loan ID: ${loanCalculated.id} | Principal: ${formatCurrency(loanCalculated.principal)} @ ${loanCalculated.interestRate}%/mo (${loanCalculated.months} Mo Tenure)`,
      filename: `Loan_Statement_${loanCalculated.borrowerName.replace(/\s+/g, '_')}.pdf`,
      columns: [
        { header: 'Date', key: 'displayDate' },
        { header: 'Type', key: 'type', bold: true },
        { header: 'Payment Method / ID', key: 'methodAndId' },
        { header: 'Description', key: 'description' },
        { header: 'Bill Amount', key: 'formattedBill', align: 'right', bold: true },
        { header: 'Amount Paid', key: 'formattedPaid', align: 'right', color: '#15803d', bold: true },
        { header: 'Remaining Due', key: 'formattedDue', align: 'right', color: '#b91c1c', bold: true }
      ],
      data: filteredEvents.map((ev) => ({
        displayDate: ev.displayDate,
        type: ev.type,
        methodAndId: ev.kind === 'interest' ? '-' : `${ev.paymentMethod || 'Cash'}${ev.reference ? ` (Ref: ${ev.reference})` : ''}`,
        description: ev.description,
        formattedBill: ev.billAmount > 0 ? formatCurrency(ev.billAmount) : '-',
        formattedPaid: ev.paidAmount > 0 ? `+${formatCurrency(ev.paidAmount)}` : '₹0',
        formattedDue: formatCurrency(ev.remainingDue)
      })),
      summary: [
        { label: 'Principal Loan Amount', value: formatCurrency(loanCalculated.principal) },
        { label: 'Total Accrued Dues', value: formatCurrency(loanCalculated.totalAmount), color: '#b45309' },
        { label: 'Total Returned Paid', value: formatCurrency(loanCalculated.returnedAmount || 0), color: '#15803d' },
        { label: 'Net Remaining Due Balance', value: formatCurrency(loanCalculated.dueAmount), color: '#b91c1c' }
      ]
    });
  };

  // Share Statement via WhatsApp
  const handleShareWhatsApp = () => {
    const message = `*🚜 LOGANATHAN FINANCE LOAN STATEMENT*\n\n` +
      `*Borrower:* ${loanCalculated.borrowerName}\n` +
      `*Loan ID:* ${loanCalculated.id}\n` +
      `*Start Date:* ${loanCalculated.startDate}\n` +
      `*Principal Amount:* ${formatCurrency(loanCalculated.principal)}\n` +
      `*Interest Rate:* ${loanCalculated.interestRate}%/mo (${formatCurrency(loanCalculated.monthlyInterest)}/mo)\n` +
      `--------------------------------\n` +
      `*Total Accrued Dues:* ${formatCurrency(loanCalculated.totalAmount)}\n` +
      `*Total Paid / Returned:* ${formatCurrency(loanCalculated.returnedAmount || 0)}\n` +
      `*NET REMAINING DUE:* ${formatCurrency(loanCalculated.dueAmount)}\n` +
      `--------------------------------\n` +
      `Thank you! Contact us for any statement updates.`;

    openWhatsAppChat(loanCalculated.phone, message);
  };

  // Open Return Payment Modal
  const handleOpenReturnModal = () => {
    const firstUnsettled = getFirstUnsettledMonth(loanCalculated);
    const isAllSettled = isMonthSettled(loanCalculated, firstUnsettled);
    setReturnPayAmount((isAllSettled ? loanCalculated.dueAmount : loanCalculated.monthlyInterest || 2000).toString());
    setReturnPayMonths(loanCalculated.months.toString());
    setReturnPayMonth(isAllSettled ? 'Full Settlement' : 'Return Payment');
    setReturnPayDate(new Date().toISOString().split('T')[0]);
    setReturnPayDiscount('');
    setIsReturnModalOpen(true);
  };

  // Submit Return Payment
  const handleReturnSubmit = (e) => {
    e.preventDefault();
    if (!returnPayAmount) return;

    const payAmt = Number(returnPayAmount) || 0;
    const discAmt = Number(returnPayDiscount) || 0;
    const newMonths = Number(returnPayMonths) || loanCalculated.months;

    recordReturnPayment(
      loanCalculated.id,
      payAmt,
      returnPayMonth || 'Return Payment',
      newMonths,
      returnPayMethod,
      returnPayRef,
      returnPayDate,
      discAmt
    );

    const isFullSettlement = returnPayMonth === 'Full Settlement' || (payAmt + discAmt) >= loanCalculated.dueAmount;
    const remDue = isFullSettlement ? 0 : Math.max(0, loanCalculated.dueAmount - (payAmt + discAmt));

    if (sendWhatsApp && loanCalculated.phone) {
      const waMsg = formatFinanceReturnPaymentWhatsApp({
        borrowerName: loanCalculated.borrowerName,
        amount: payAmt,
        discount: discAmt,
        paymentMethod: returnPayMethod,
        reference: returnPayRef,
        remainingDue: remDue
      });

      openWhatsAppChat(loanCalculated.phone, waMsg);
      setWhatsAppPhone(loanCalculated.phone);
      setWhatsAppCustName(loanCalculated.borrowerName);
      setWhatsAppText(waMsg);
      setIsWhatsAppModalOpen(true);
    }

    setIsReturnModalOpen(false);
    setReturnPayRef('');
    setReturnPayDiscount('');
    setReturnPayDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans">
      {/* Top Header Bar matching CustomerLedger */}
      <PageHeader
        title={loanCalculated.borrowerName}
        subtitle={`Loan ID: ${loanCalculated.id} • Mobile: ${loanCalculated.phone || 'No phone'}`}
        backUrl="/finance"
        action={
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {netRemainingDue > 0 && (
              <button
                onClick={handleOpenReturnModal}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <Wallet className="w-3.5 h-3.5" /> Receive Payment
              </button>
            )}

            <button
              onClick={handleShareWhatsApp}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              💬 WhatsApp Share
            </button>

            <button
              onClick={handleDownloadPdf}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" /> Statement
            </button>
          </div>
        }
      />

      {/* Borrower Header Info Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{loanCalculated.borrowerName}</h2>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                netRemainingDue === 0 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}
            >
              {netRemainingDue === 0 ? 'Settled' : 'Active Loan'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-slate-700 pt-1">
            <a
              href={`tel:${loanCalculated.phone}`}
              className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <Phone className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>{loanCalculated.phone || 'No mobile'}</span>
            </a>

            <span className="text-slate-300">•</span>
            <span className="text-slate-600 font-semibold text-xs">
              Start Date: <strong>{loanCalculated.startDate}</strong>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-xs font-bold">
              Interest: {loanCalculated.interestRate}% / mo ({formatCurrency(loanCalculated.monthlyInterest)}/mo)
            </span>
            <span className="text-slate-300">•</span>
            {(() => {
              const dueDateInfo = getLoanDueDateInfo(loanCalculated);
              if (netRemainingDue === 0 || loanCalculated.status === 'Settled') {
                return (
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300 text-xs font-bold">
                    Status: Fully Settled
                  </span>
                );
              }
              return (
                <span className={`px-2 py-0.5 rounded border text-xs font-bold ${
                  dueDateInfo.daysLeft < 0
                    ? 'bg-rose-100 text-rose-900 border-rose-300 font-black'
                    : dueDateInfo.daysLeft === 0
                    ? 'bg-rose-50 text-rose-800 border-rose-300 font-extrabold animate-pulse'
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}>
                  Due: {formatDate(dueDateInfo.dueDateStr)} ({dueDateInfo.daysLeft < 0 ? `${Math.abs(dueDateInfo.daysLeft)}d Overdue` : dueDateInfo.daysLeft === 0 ? 'Due Today' : `${dueDateInfo.daysLeft}d Remaining`})
                </span>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Financial Metrics Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-black text-slate-500 uppercase tracking-wider block">
            Total Business / Sales Dues
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {formatCurrency(totalDuesAccrued)}
          </p>
          <span className="text-[11px] text-slate-400 font-semibold block mt-0.5">
            Principal {formatCurrency(loanCalculated.principal)} + {loanCalculated.months} Mo Interest
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-black text-emerald-600 uppercase tracking-wider block">
            Total Paid / Received
          </span>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {formatCurrency(totalPaidReturned)}
          </p>
          <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">
            {loanCalculated.paymentHistory?.length || 0} Return Payment(s)
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-black text-rose-600 uppercase tracking-wider block">
            Net Outstanding Due
          </span>
          <p className="text-2xl font-black text-rose-600 mt-1">
            {formatCurrency(netRemainingDue)}
          </p>
          <span className="text-[11px] text-rose-700 font-semibold block mt-0.5">
            {netRemainingDue === 0 ? 'Fully Paid' : 'Pending Balance'}
          </span>
        </div>
      </div>

      {/* Tabs & Filter Controls */}
      <div className="border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-6 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-3 transition-all relative whitespace-nowrap cursor-pointer ${
              activeTab === 'all'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            All Activity ({allEvents.length})
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`pb-3 transition-all relative whitespace-nowrap cursor-pointer ${
              activeTab === 'transactions'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`pb-3 transition-all relative whitespace-nowrap cursor-pointer ${
              activeTab === 'payments'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Payments Received
          </button>
          <button
            onClick={() => setActiveTab('outstanding')}
            className={`pb-3 transition-all relative whitespace-nowrap cursor-pointer ${
              activeTab === 'outstanding'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Outstanding Items
          </button>
        </div>
      </div>

      {/* 7-COLUMN TABLE MATCHING USER SCREENSHOT EXACTLY */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">DATE</th>
                <th className="py-3.5 px-4">TYPE</th>
                <th className="py-3.5 px-4">PAYMENT METHOD / ID</th>
                <th className="py-3.5 px-4">DESCRIPTION</th>
                <th className="py-3.5 px-4 text-right">BILL AMOUNT</th>
                <th className="py-3.5 px-4 text-right">AMOUNT PAID</th>
                <th className="py-3.5 px-4 text-right">REMAINING DUE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-900">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400 font-medium">
                    No loan ledger records found.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-slate-600 font-bold whitespace-nowrap">
                      {ev.displayDate}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          ev.type === 'Payment'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-blue-50 text-blue-600 border-blue-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            ev.type === 'Payment' ? 'bg-emerald-500' : 'bg-blue-500'
                          }`}
                        ></span>
                        {ev.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {ev.kind === 'interest' ? (
                        <span className="text-slate-400 font-normal">-</span>
                      ) : (
                        <div>
                          <span className="font-extrabold text-slate-900 text-xs block">
                            {ev.paymentMethod || 'Cash'}
                          </span>
                          {ev.reference ? (
                            <span className="text-[10px] font-mono text-indigo-700 font-bold block">
                              Ref: {ev.reference}
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono text-slate-400 block">
                              {ev.id}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {ev.description}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900 whitespace-nowrap">
                      {ev.billAmount > 0 ? formatCurrency(ev.billAmount) : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-emerald-600 whitespace-nowrap">
                      +{formatCurrency(ev.paidAmount || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-amber-700 whitespace-nowrap">
                      {formatCurrency(ev.remainingDue)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Return Payment Modal */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200 font-sans">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-600" />
                Record Return Payment
              </h3>
              <button
                type="button"
                onClick={() => setIsReturnModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-xs">Payment Date *</label>
                <input
                  type="date"
                  required
                  value={returnPayDate}
                  onChange={(e) => setReturnPayDate(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-xs">Repayment Type *</label>
                <select
                  value={returnPayMonth}
                  onChange={(e) => {
                    const val = e.target.value;
                    setReturnPayMonth(val);
                    if (val === 'Full Settlement') {
                      setReturnPayAmount(loanCalculated.dueAmount.toString());
                    }
                  }}
                  required
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900 text-xs"
                >
                  <option value="Return Payment">Return Payment</option>
                  <option value="Full Settlement">Full Remaining Settlement</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                  <label className="block font-bold text-slate-700 text-xs">Return Amount Paid (₹) *</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setReturnPayAmount(loanCalculated.monthlyInterest.toString())}
                      className="text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer"
                    >
                      Fill Monthly Int ({formatCurrency(loanCalculated.monthlyInterest)})
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setReturnPayAmount(loanCalculated.dueAmount.toString());
                        setReturnPayMonth('Full Settlement');
                      }}
                      className="text-[11px] font-bold text-amber-700 hover:underline cursor-pointer"
                    >
                      Fill Full Due ({formatCurrency(loanCalculated.dueAmount)})
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  required
                  value={returnPayAmount}
                  onChange={(e) => setReturnPayAmount(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-lg text-slate-900"
                />
              </div>

              {/* Discount Input (Rupee Amount) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-xs">
                  Discount Amount (₹) <span className="text-slate-400 font-normal">(Optional, in ₹ amount not %)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 200 (Discount in ₹)"
                  value={returnPayDiscount}
                  onChange={(e) => setReturnPayDiscount(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 text-xs"
                />
                {Number(returnPayDiscount) > 0 && (
                  <p className="text-[11px] font-bold text-emerald-700 mt-1">
                    💡 Net Credit to Loan: {formatCurrency((Number(returnPayAmount) || 0) + (Number(returnPayDiscount) || 0))} (Paid {formatCurrency(Number(returnPayAmount) || 0)} + Discount {formatCurrency(Number(returnPayDiscount) || 0)})
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-xs">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Cash', 'UPI', 'Bank Transfer'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => {
                        setReturnPayMethod(method);
                        if ((method === 'UPI' || method === 'Bank Transfer') && returnPayRef.startsWith('REF-')) {
                          setReturnPayRef('');
                        }
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        returnPayMethod === method
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Reference Input */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-xs">
                  {returnPayMethod === 'UPI'
                    ? 'UPI Reference ID / UTR Number (Optional)'
                    : returnPayMethod === 'Bank Transfer'
                    ? 'Bank Transaction ID / IMPS Ref (Optional)'
                    : 'Reference No. (Optional)'}
                </label>
                <input
                  type="text"
                  value={returnPayRef}
                  onChange={(e) => setReturnPayRef(e.target.value)}
                  placeholder={
                    returnPayMethod === 'UPI'
                      ? 'e.g. 423456789012 or GPay Ref ID'
                      : returnPayMethod === 'Bank Transfer'
                      ? 'e.g. TXN987654321 or IMPS/NEFT Ref'
                      : 'e.g. REF-123456'
                  }
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* WhatsApp Notification Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="sendWhatsAppLedgerReturn"
                  checked={sendWhatsApp}
                  onChange={(e) => setSendWhatsApp(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="sendWhatsAppLedgerReturn" className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1.5">
                  💬 Send WhatsApp Return Payment Receipt
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/30"
                >
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Modal Dialog */}
      <WhatsAppModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        phone={whatsAppPhone}
        customerName={whatsAppCustName}
        messageText={whatsAppText}
      />
    </div>
  );
};

export default FinanceLoanLedger;
