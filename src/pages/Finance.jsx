import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import PageHeader from '../components/layout/PageHeader';
import StatCard from '../components/dashboard/StatCard';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import QuickActions from '../components/dashboard/QuickActions';
import { formatCurrency, formatDate } from '../utils/formatCurrency';
import { getLoanCalculatedDetails, calculateElapsedMonths, getLoanDueDateInfo } from '../utils/loanUtils';
import { exportToPdf } from '../utils/pdfGenerator';
import { formatFinanceLoanWhatsApp, formatFinanceReturnPaymentWhatsApp, openWhatsAppChat } from '../utils/whatsapp';
import WhatsAppModal from '../components/common/WhatsAppModal';
import EditFinanceLoanModal from '../components/common/EditFinanceLoanModal';
import {
  Landmark,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  Wallet,
  Trash2,
  X,
  Search,
  Plus,
  Minus,
  Info,
  Calendar,
  Download,
  Pencil
} from 'lucide-react';

export const isMonthSettled = (loanCalculated, monthNum) => {
  if (!loanCalculated) return false;
  const history = loanCalculated.paymentHistory || [];

  // 1. Explicit check in paymentHistory for Month X
  const hasMonthRecord = history.some((p) => {
    if (!p || !p.month) return false;
    const regex = new RegExp(`\\bMonth\\s*${monthNum}\\b`, 'i');
    return regex.test(p.month);
  });
  if (hasMonthRecord) return true;

  // 2. Check if Full Settlement was recorded
  const hasFullSettlement = history.some((p) => {
    if (!p || !p.month) return false;
    return p.month.toLowerCase().includes('settlement') || p.month.toLowerCase().includes('full');
  });
  if (hasFullSettlement) return true;

  // 3. Amount-based check against the compound interest accrued through this month.
  //    Only interest-tagged payments count toward the settled check, so a partial
  //    principal return does not silently mark interest months as settled.
  const monthInterest = loanCalculated.monthBreakdown?.[monthNum - 1]?.interestAccrued || 0;
  if (monthInterest <= 0) return false;

  const interestPaid = history.reduce((sum, p) => {
    if (!p) return sum;
    const label = (p.month || '').toLowerCase();
    if (label.includes('principal') || label.includes('settlement') || label.includes('full')) {
      return sum;
    }
    return sum + (Number(p.amount) || 0) + (Number(p.discount) || 0);
  }, 0);

  const interestDueThroughMonth = (loanCalculated.monthBreakdown || [])
    .slice(0, monthNum)
    .reduce((sum, month) => sum + (Number(month.interestAccrued) || 0), 0);
  if (interestPaid >= interestDueThroughMonth) {
    return true;
  }

  return false;
};

const getCompoundTotal = (principal, rate, months) => Math.round(
  (Number(principal) || 0) * Math.pow(1 + ((Number(rate) || 0) / 100), Math.max(1, Number(months) || 1))
);

export const getFirstUnsettledMonth = (loanCalculated) => {
  if (!loanCalculated) return 1;
  const totalMonths = loanCalculated.months || 1;
  for (let m = 1; m <= totalMonths; m++) {
    if (!isMonthSettled(loanCalculated, m)) {
      return m;
    }
  }
  return totalMonths;
};

export const buildLoanLedgerEvents = (loan) => {
  if (!loan) return [];

  const events = [];
  const startDateStr = loan.startDate || new Date().toISOString().split('T')[0];
  const start = new Date(startDateStr);

  // 1. Initial Principal Loan Disbursement
  events.push({
    id: `loan-init-${loan.id}`,
    date: startDateStr,
    displayDate: formatDate(startDateStr),
    rawTimestamp: isNaN(start.getTime()) ? 0 : start.getTime(),
    type: 'Transaction',
    business: 'Finance Loan',
    paymentMethod: loan.paymentMethod || 'Cash',
    reference: loan.reference || '',
    description: `Principal Loan Given (${formatCurrency(loan.principal)}) @ ${loan.interestRate}%/mo`,
    billAmount: loan.principal,
    paidAmount: 0,
    kind: 'disbursement'
  });

  // 2. Monthly Interest Accruals (Month 1 to Month N)
  const totalMonths = loan.months || 1;
  const monthBreakdown = loan.monthBreakdown || [];

  for (let m = 1; m <= totalMonths; m++) {
    const cycleDate = new Date(start);
    if (!isNaN(start.getTime())) {
      cycleDate.setMonth(cycleDate.getMonth() + (m - 1));
    }
    const dateStr = !isNaN(cycleDate.getTime()) ? cycleDate.toISOString().split('T')[0] : startDateStr;
    const mInterest = monthBreakdown[m - 1] ? monthBreakdown[m - 1].interestAccrued : (loan.monthlyInterest || 0);

    events.push({
      id: `loan-interest-${loan.id}-m${m}`,
      date: dateStr,
      displayDate: formatDate(dateStr),
      rawTimestamp: !isNaN(cycleDate.getTime()) ? cycleDate.getTime() + m : m,
      type: 'Transaction',
      business: 'Finance Loan',
      paymentMethod: '-',
      reference: '',
      description: `Month ${m} Interest Accrued (${loan.interestRate}%/mo Compounding)`,
      billAmount: mInterest,
      paidAmount: 0,
      kind: 'interest',
      monthNum: m
    });
  }

  // 3. Return Payments recorded
  (loan.paymentHistory || []).forEach((pmt, idx) => {
    const pmtDateStr = pmt.date || startDateStr;
    const pmtDate = new Date(pmtDateStr);

    events.push({
      id: `loan-pmt-${loan.id}-${idx}`,
      date: pmtDateStr,
      displayDate: formatDate(pmtDateStr),
      rawTimestamp: !isNaN(pmtDate.getTime()) ? pmtDate.getTime() + 1000 + idx : Date.now() + idx,
      type: 'Payment',
      business: 'Finance Loan',
      paymentMethod: pmt.method || 'Cash',
      reference: pmt.reference || '',
      description: `Return Payment${pmt.month && !pmt.month.startsWith('Month ') ? ` (${pmt.month})` : ''}`,
      billAmount: 0,
      paidAmount: Number(pmt.amount) || 0,
      kind: 'payment'
      ,paymentId: pmt.id || `${loan.id}-return-${idx}`
    });
  });

  // Sort chronologically (oldest first) to accurately calculate running balance
  events.sort((a, b) => a.rawTimestamp - b.rawTimestamp);

  let runningDue = 0;
  events.forEach((ev) => {
    runningDue += (ev.billAmount || 0) - (ev.paidAmount || 0);
    ev.remainingDue = Math.max(0, runningDue);
  });

  // Return in reverse chronological order (newest first, matching user screenshot!)
  return events.reverse();
};

const Finance = () => {
  const {
    overviewMetrics,
    financeLoans = [],
    addFinanceLoan,
    updateFinanceLoanMonths,
    resetFinanceLoanAutoMonths,
    recordReturnPayment,
    updateReturnPayment,
    deleteReturnPayment,
    settleFinanceLoan,
    deleteFinanceLoan
  } = useBusiness();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Active', 'Settled'

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [returnPayAmount, setReturnPayAmount] = useState('');
  const [returnPayMethod, setReturnPayMethod] = useState('Cash');
  const [returnPayRef, setReturnPayRef] = useState('');
  const [returnPayMonth, setReturnPayMonth] = useState('');
  const [returnPayMonths, setReturnPayMonths] = useState('');
  const [returnPayDate, setReturnPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnPayDiscount, setReturnPayDiscount] = useState('');
  const [editingReturnPayment, setEditingReturnPayment] = useState(null);

  // WhatsApp notification state
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppPhone, setWhatsAppPhone] = useState('');
  const [whatsAppCustName, setWhatsAppCustName] = useState('');
  const [whatsAppText, setWhatsAppText] = useState('');

  // Borrower Ledger Modal State & Filter
  const [selectedLedgerLoan, setSelectedLedgerLoan] = useState(null);
  const [ledgerTab, setLedgerTab] = useState('All'); // 'All', 'Transactions', 'Payments'

  // Confirmation Modal State (Settle / Delete)
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null, // 'settle' | 'delete'
    loan: null
  });

  const handleRequestSettle = (loan) => {
    setConfirmModal({
      isOpen: true,
      type: 'settle',
      loan
    });
  };

  const handleRequestDelete = (loan) => {
    setConfirmModal({
      isOpen: true,
      type: 'delete',
      loan
    });
  };

  const handleConfirmAction = () => {
    if (!confirmModal.loan || !confirmModal.type) return;
    if (confirmModal.type === 'settle') {
      settleFinanceLoan(confirmModal.loan.id);
    } else if (confirmModal.type === 'delete') {
      deleteFinanceLoan(confirmModal.loan.id);
    }
    setConfirmModal({ isOpen: false, type: null, loan: null });
  };

  // New Loan Form State
  const [newBorrowerName, setNewBorrowerName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPrincipal, setNewPrincipal] = useState('100000');
  const [newRate, setNewRate] = useState('2');
  const [newMonths, setNewMonths] = useState('1');
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [newMethod, setNewMethod] = useState('Cash');
  const [newReference, setNewReference] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Process loans with dynamic variable month calculations
  const processedLoans = financeLoans.map((loan) => getLoanCalculatedDetails(loan));

  // Filtered loans list
  const filteredLoans = processedLoans.filter((loan) => {
    const matchesSearch =
      loan.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.phone.includes(searchTerm);
    if (statusFilter === 'All') return matchesSearch;
    return matchesSearch && loan.status === statusFilter;
  });

  // Summary Metrics
  const activeLoans = processedLoans.filter((l) => l.status === 'Active');
  const upcomingDueBorrowers = activeLoans.filter((l) => l.dueAmount > 0);
  const totalPrincipalGiven = processedLoans.reduce((sum, l) => sum + l.principal, 0);
  const totalMonthlyInterest = activeLoans.reduce((sum, l) => sum + l.monthlyInterest, 0);
  const totalReturnedAmount = processedLoans.reduce((sum, l) => sum + l.returnedAmount, 0);
  const totalRemainingDue = processedLoans.reduce((sum, l) => sum + l.dueAmount, 0);
  const totalInterestAccrued = processedLoans.reduce((sum, l) => sum + (l.totalInterest || 0), 0);

  // Quick Month Increment / Decrement
  const handleMonthIncrement = (loanId, currentMonths, delta) => {
    const nextMonths = Math.max(1, (currentMonths || 1) + delta);
    updateFinanceLoanMonths(loanId, nextMonths);
  };

  // Handle Add Loan Form Submit
  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newBorrowerName.trim()) return;

    const p = Number(newPrincipal) || 0;
    const r = Number(newRate) || 0;
    const m = 1;
    const monthlyInt = Math.round((p * r) / 100);
    const totAmt = getCompoundTotal(p, r, m);

    addFinanceLoan({
      borrowerName: newBorrowerName,
      phone: newPhone,
      principal: p,
      interestRate: r,
      months: m,
      startDate: newStartDate,
      paymentMethod: newMethod,
      reference: newReference,
      notes: newNotes
    });

    if (sendWhatsApp && newPhone.trim()) {
      const waMsg = formatFinanceLoanWhatsApp({
        borrowerName: newBorrowerName.trim(),
        principal: p,
        interestRate: r,
        monthlyInterest: monthlyInt,
        months: m,
        startDate: newStartDate,
        paymentMethod: newMethod,
        reference: newReference,
        totalAmount: totAmt
      });

      openWhatsAppChat(newPhone.trim(), waMsg);
      setWhatsAppPhone(newPhone.trim());
      setWhatsAppCustName(newBorrowerName.trim());
      setWhatsAppText(waMsg);
      setIsWhatsAppModalOpen(true);
    }

    // Reset Form & Close Modal
    setNewBorrowerName('');
    setNewPhone('');
    setNewNotes('');
    setNewMethod('Cash');
    setNewReference('');
    setIsAddModalOpen(false);
  };

  // Handle Return Payment Submit
  const handleReturnSubmit = (e) => {
    e.preventDefault();
    if (!selectedLoan || !returnPayAmount) return;

    const payAmt = Number(returnPayAmount) || 0;
    const discAmt = Number(returnPayDiscount) || 0;
    const newMonths = Number(returnPayMonths) || selectedLoan.months;

    if (editingReturnPayment) {
      updateReturnPayment(selectedLoan.id, editingReturnPayment.id, {
        amount: payAmt,
        discount: discAmt,
        month: returnPayMonth || 'Return Payment',
        method: returnPayMethod,
        reference: returnPayRef,
        date: returnPayDate
      });
    } else {
      recordReturnPayment(selectedLoan.id, payAmt, returnPayMonth || 'Return Payment', newMonths, returnPayMethod, returnPayRef, returnPayDate, discAmt);
    }

    const currentCalc = getLoanCalculatedDetails(selectedLoan);
    const isFullSettlement = returnPayMonth === 'Full Settlement' || (payAmt + discAmt) >= currentCalc.dueAmount;
    const remDue = isFullSettlement ? 0 : Math.max(0, currentCalc.dueAmount - (payAmt + discAmt));

    if (sendWhatsApp && selectedLoan.phone) {
      const waMsg = formatFinanceReturnPaymentWhatsApp({
        borrowerName: selectedLoan.borrowerName,
        amount: payAmt,
        discount: discAmt,
        paymentMethod: returnPayMethod,
        reference: returnPayRef,
        remainingDue: remDue
      });

      openWhatsAppChat(selectedLoan.phone, waMsg);
      setWhatsAppPhone(selectedLoan.phone);
      setWhatsAppCustName(selectedLoan.borrowerName);
      setWhatsAppText(waMsg);
      setIsWhatsAppModalOpen(true);
    }

    setIsReturnModalOpen(false);
    setSelectedLoan(null);
    setReturnPayAmount('');
    setReturnPayDiscount('');
    setReturnPayMonth('');
    setReturnPayMonths('');
    setReturnPayRef('');
    setReturnPayDate(new Date().toISOString().split('T')[0]);
    setEditingReturnPayment(null);
  };

  // When selected loan changes for return payment modal, calculate dynamic view
  const currentSelectedLoanCalculated = selectedLoan ? getLoanCalculatedDetails(selectedLoan) : null;
  const currentSelectedLedgerLoanCalculated = selectedLedgerLoan
    ? processedLoans.find((l) => l.id === selectedLedgerLoan.id) || getLoanCalculatedDetails(selectedLedgerLoan)
    : null;

  const handleDownloadFinanceStatement = () => {
    exportToPdf({
      title: 'FINANCE LOANS LEDGER STATEMENT',
      subtitle: `Total Principal: ${formatCurrency(totalPrincipalGiven)} | Active Loans: ${activeLoans.length}`,
      filename: `Finance_Loans_Statement_${new Date().toISOString().split('T')[0]}.pdf`,
      columns: [
        { header: 'ID', key: 'id' },
        { header: 'Borrower Name', key: 'borrowerName', bold: true },
        { header: 'Phone', key: 'phone' },
        { header: 'Principal', key: 'formattedPrincipal', align: 'right', bold: true },
        { header: 'Rate/mo', key: 'formattedRate', align: 'center' },
        { header: 'Tenure', key: 'formattedMonths', align: 'center' },
        { header: 'Total Payable', key: 'formattedPayable', align: 'right', bold: true },
        { header: 'Returned', key: 'formattedReturned', align: 'right', color: '#15803d' },
        { header: 'Remaining Due', key: 'formattedDue', align: 'right', color: '#b91c1c', bold: true }
      ],
      data: processedLoans.map((l) => ({
        id: l.id,
        borrowerName: l.borrowerName,
        phone: l.phone || 'N/A',
        formattedPrincipal: formatCurrency(l.principal),
        formattedRate: `${l.interestRate}%/mo`,
        formattedMonths: `Month ${l.months}`,
        formattedPayable: formatCurrency(l.totalAmount),
        formattedReturned: `+${formatCurrency(l.returnedAmount || 0)}`,
        formattedDue: formatCurrency(l.dueAmount)
      })),
      summary: [
        { label: 'Total Principal Given', value: formatCurrency(totalPrincipalGiven) },
        { label: 'Total Monthly Interest', value: formatCurrency(totalMonthlyInterest) },
        { label: 'Total Returned Paid', value: formatCurrency(totalReturnedAmount), color: '#15803d' },
        { label: 'Net Remaining Balance Due', value: formatCurrency(totalRemainingDue), color: '#b91c1c' }
      ]
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header & Top Summary KPI Cards (Desktop View) */}
      <div className="hidden md:block space-y-5">
        <PageHeader
          title="Finance"
          subtitle="Loan ledger, dynamic compounding monthly interest tracking & variable tenure returns"
          action={
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadFinanceStatement}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <Download className="w-4 h-4 text-emerald-600" /> Statement PDF
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" /> + Give New Loan
              </button>
            </div>
          }
        />

        {/* 4 Summary KPI Cards Grid (Desktop View) */}
        <div className="grid grid-cols-4 gap-4 font-sans">
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-black text-slate-600 uppercase tracking-wider block">
              TOTAL OUTSTANDING
            </span>
            <p className="text-2xl font-black text-amber-700 mt-1 tracking-tight">
              {formatCurrency(totalRemainingDue)}
            </p>
            <span className="text-xs text-slate-500 font-extrabold block mt-1">
              Net Pending Balance
            </span>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-black text-slate-600 uppercase tracking-wider block">
              UPCOMING PEOPLE DUE
            </span>
            <p className="text-2xl font-black text-rose-700 mt-1 tracking-tight">
              {upcomingDueBorrowers.length} Borrower(s)
            </p>
            <span className="text-xs text-rose-700 font-black block mt-1 truncate">
              {upcomingDueBorrowers.length > 0
                ? upcomingDueBorrowers.map((b) => b.borrowerName).slice(0, 3).join(', ')
                : 'All Loans Cleared'}
            </span>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-black text-slate-600 uppercase tracking-wider block">
              ACTIVE LOANS
            </span>
            <p className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
              {activeLoans.length} Active
            </p>
            <span className="text-xs text-slate-600 font-extrabold block mt-1">
              Principal {formatCurrency(totalPrincipalGiven)}
            </span>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-black text-slate-600 uppercase tracking-wider block">
              TOTAL RETURNED PAID
            </span>
            <p className="text-2xl font-black text-emerald-700 mt-1 tracking-tight">
              {formatCurrency(totalReturnedAmount)}
            </p>
            <span className="text-xs text-emerald-800 font-black block mt-1">
              Interest Accrued: {formatCurrency(totalInterestAccrued)}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Finance View Section (Ultra Mobile Optimized) */}
      <div className="md:hidden space-y-5 font-sans">
        {/* Mobile Page Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Finance</h2>
            <p className="text-xs font-bold text-slate-500">Compounding Interest Loan Tracker</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" /> + Give Loan
          </button>
        </div>

        {/* 4 Summary KPI Cards (Bold Light Mode Grid) */}
        <div className="grid grid-cols-2 gap-3 font-sans">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
              OUTSTANDING DUE
            </span>
            <p className="text-xl sm:text-2xl font-black text-amber-700 mt-1 tracking-tight">
              {formatCurrency(totalRemainingDue)}
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
              UPCOMING DUE
            </span>
            <p className="text-xl sm:text-2xl font-black text-rose-700 mt-1 tracking-tight">
              {upcomingDueBorrowers.length} People
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
              ACTIVE LOANS
            </span>
            <p className="text-xl sm:text-2xl font-black text-emerald-800 mt-1 tracking-tight">
              {activeLoans.length} Active
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
              TOTAL RETURNED
            </span>
            <p className="text-xl sm:text-2xl font-black text-emerald-800 mt-1 tracking-tight">
              {formatCurrency(totalReturnedAmount)}
            </p>
          </div>
        </div>

        {/* Mobile Finance Loan Records Section */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between font-sans">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              FINANCE LOAN RECORDS
            </h3>
          </div>

          {/* Search & Filter bar for mobile */}
          <div className="space-y-2.5 font-mono">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search person or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-amber-600 w-full shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl w-full">
              {['All', 'Active', 'Settled'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all text-center cursor-pointer ${
                    statusFilter === tab
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Pure White Light Mode Loan Cards */}
          <div className="space-y-4 pt-1">
            {filteredLoans.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-xs font-mono font-bold shadow-xs">
                No finance loan records match search.
              </div>
            ) : (
              filteredLoans.map((loan) => {
                const returned = loan.returnedAmount || 0;
                const due = loan.dueAmount;
                const progressPct = Math.min(100, Math.round((returned / (loan.totalAmount || 1)) * 100));

                return (
                  <div
                    key={loan.id}
                    className="bg-white text-slate-900 rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3 font-sans"
                  >
                    {/* Clean Card Top: Name & Phone on Left, Total Payable on Right */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link
                          to={`/finance/ledger/${loan.id}`}
                          className="text-lg font-black text-slate-900 hover:text-emerald-700 leading-tight block text-left"
                        >
                          {loan.borrowerName}
                        </Link>
                        <a
                          href={`tel:${loan.phone}`}
                          className="text-xs text-slate-500 font-semibold block mt-0.5"
                        >
                          📞 {loan.phone || 'No phone'}
                        </a>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">
                          TOTAL PAYABLE
                        </span>
                        <span className="text-lg font-black text-emerald-600 block">
                          {formatCurrency(loan.totalAmount)}
                        </span>
                        {due > 0 && (
                          <span className="text-xs font-extrabold text-rose-600 block">
                            Due: {formatCurrency(due)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    {due > 0 ? (
                      <div className="flex items-center gap-2 pt-1 font-mono">
                        <button
                          onClick={() => {
                            const calculated = getLoanCalculatedDetails(loan);
                            const firstUnsettled = getFirstUnsettledMonth(calculated);
                            const allSettled = isMonthSettled(calculated, firstUnsettled);
                            setSelectedLoan(loan);
                            setReturnPayAmount(
                              (allSettled ? calculated.dueAmount : calculated.monthlyInterest || 2000).toString()
                            );
                            setReturnPayDiscount('');
                            setReturnPayMonths(calculated.months.toString());
                            setReturnPayMonth(allSettled ? 'Full Settlement' : 'Return Payment');
                            setReturnPayDate(new Date().toISOString().split('T')[0]);
                            setIsReturnModalOpen(true);
                          }}
                          className="flex-1 py-2.5 px-3 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-mono font-black text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>💰</span> Record Return
                        </button>
                        <button
                          onClick={() => setEditingLoan(loan)}
                          className="py-2.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 font-mono font-black text-xs rounded-xl border border-amber-200 transition-all flex items-center justify-center gap-1 cursor-pointer"
                          title="Edit Loan Details"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleRequestSettle(loan)}
                          className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono font-black text-xs rounded-xl border border-slate-300 transition-all cursor-pointer"
                        >
                          Settle
                        </button>
                        <button
                          onClick={() => handleRequestDelete(loan)}
                          className="p-2.5 bg-slate-100 hover:bg-rose-100 text-rose-600 rounded-xl border border-slate-300 transition-colors cursor-pointer"
                          title="Delete Loan Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-900 text-xs font-bold">
                        <span>🎉 Fully Settled!</span>
                        <button
                          onClick={() => handleRequestDelete(loan)}
                          className="text-rose-700 hover:underline text-[11px] font-bold cursor-pointer"
                        >
                          Remove Record
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Finance Loan & Return Records Directory (Desktop View) */}
      <div className="hidden md:block space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-emerald-600" />
                Finance Loan & Return Ledger
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Dynamic monthly interest loan ledger — month advances automatically or manually adds dues if unpaid
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer shrink-0"
              >
                <PlusCircle className="w-4 h-4" /> + Give New Loan
              </button>

              {/* Search Input */}
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search person or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:border-emerald-500 w-full"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {['All', 'Active', 'Settled'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      statusFilter === tab
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Finance Records Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-3">Person / Borrower</th>
                  <th className="py-3 px-3 text-right">Principal Amount</th>
                  <th className="py-3 px-3 text-center">Interest Rate</th>
                  <th className="py-3 px-3 text-center">Days to Due Date</th>
                  <th className="py-3 px-3 text-right">Total Payable</th>
                  <th className="py-3 px-3 text-right">Returned Paid</th>
                  <th className="py-3 px-3 text-right">Remaining Due</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredLoans.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400 font-medium">
                      No finance loan records found.
                    </td>
                  </tr>
                ) : (
                  filteredLoans.map((loan) => {
                    const returned = loan.returnedAmount || 0;
                    const due = loan.dueAmount;

                    return (
                      <tr key={loan.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <Link
                            to={`/finance/ledger/${loan.id}`}
                            className="font-black text-slate-900 text-base sm:text-lg hover:text-emerald-700 hover:underline flex items-center gap-1.5 cursor-pointer text-left group"
                            title="Click to view full borrower ledger statement & payment history"
                          >
                            <span>{loan.borrowerName}</span>
                          </Link>
                          <div className="text-xs text-slate-500 font-medium">{loan.phone || loan.id}</div>
                          <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <span>Start: {loan.startDate}</span>
                            {loan.autoElapsed > 1 && (
                              <span className="bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded text-[10px] border border-amber-300">
                                {loan.autoElapsed} Mo Elapsed
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right font-black text-slate-900 text-sm sm:text-base">
                          {formatCurrency(loan.principal)}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 font-bold text-xs sm:text-sm">
                            {loan.interestRate}% / mo
                          </span>
                          <span className="block text-xs text-amber-700 font-medium mt-0.5">
                            ({formatCurrency(loan.monthlyInterest)}/mo)
                          </span>
                        </td>

                        {/* Days Remaining to Due Date Column */}
                        <td className="py-3 px-3 text-center font-bold">
                          {(() => {
                            const dueDateInfo = getLoanDueDateInfo(loan);
                            if (due === 0 || loan.status === 'Settled') {
                              return (
                                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-[11px]">
                                  Settled
                                </span>
                              );
                            }
                            return (
                              <>
                                <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${
                                  dueDateInfo.daysLeft < 0
                                    ? 'bg-rose-100 text-rose-900 border-rose-300 font-black'
                                    : dueDateInfo.daysLeft === 0
                                    ? 'bg-rose-50 text-rose-800 border-rose-300 font-extrabold animate-pulse'
                                    : 'bg-amber-50 text-amber-900 border-amber-300'
                                }`}>
                                  {dueDateInfo.daysLeft < 0
                                    ? `${Math.abs(dueDateInfo.daysLeft)}d Overdue`
                                    : dueDateInfo.daysLeft === 0
                                    ? 'Due Today'
                                    : `${dueDateInfo.daysLeft}d Remaining`}
                                </span>
                                <span className="block text-[10px] text-slate-500 font-medium mt-0.5">
                                  Due: {formatDate(dueDateInfo.dueDateStr)}
                                </span>
                              </>
                            );
                          })()}
                        </td>

                        <td className="py-3 px-3 text-right font-black text-emerald-600 text-sm sm:text-base">
                          {formatCurrency(loan.totalAmount)}
                        </td>

                        <td className="py-3 px-3 text-right font-black text-emerald-600 text-sm sm:text-base">
                          {formatCurrency(returned)}
                        </td>

                        <td className="py-3 px-3 text-right font-black text-rose-600 text-sm sm:text-base">
                          {formatCurrency(due)}
                        </td>



                        <td className="py-3 px-3 text-center space-x-1 whitespace-nowrap">
                          {due > 0 && (
                            <>
                              <button
                                onClick={() => {
                                  const calculated = getLoanCalculatedDetails(loan);
                                  const firstUnsettled = getFirstUnsettledMonth(calculated);
                                  const allSettled = isMonthSettled(calculated, firstUnsettled);
                                  setSelectedLoan(loan);
                                  setReturnPayAmount(
                                    (allSettled ? calculated.dueAmount : calculated.monthlyInterest || 2000).toString()
                                  );
                                  setReturnPayMonths(calculated.months.toString());
                                  setReturnPayMonth(allSettled ? 'Full Settlement' : 'Return Payment');
                                  setIsReturnModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-[11px] border border-emerald-200 transition-all cursor-pointer"
                                title="Record Money Returned by Person"
                              >
                                + Record Return
                              </button>
                              <button
                                onClick={() => handleRequestSettle(loan)}
                                className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-[11px] border border-indigo-200 transition-all cursor-pointer"
                                title="Settle Full Loan"
                              >
                                Settle
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setEditingLoan(loan)}
                            className="p-1 text-amber-600 hover:text-amber-800 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer inline-flex items-center"
                            title="Edit Loan Record"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRequestDelete(loan)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer inline-flex items-center"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Full-Screen Modal: Give New Loan */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col animate-in fade-in duration-200">
          {/* Top Bar */}
          <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-emerald-600" />
                Give New Loan
              </h3>
            </div>
            <button
              type="submit"
              form="add-loan-form"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 text-sm cursor-pointer"
            >
              Save Loan
            </button>
          </div>

          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <form id="add-loan-form" onSubmit={handleAddSubmit} className="max-w-lg mx-auto space-y-5 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Person / Borrower Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh"
                    value={newBorrowerName}
                    onChange={(e) => setNewBorrowerName(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-emerald-500 text-base"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-emerald-500 text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Principal (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="100000"
                    value={newPrincipal}
                    onChange={(e) => setNewPrincipal(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-emerald-500 text-base"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Interest % / mo *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="2"
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-amber-600 focus:outline-hidden focus:border-emerald-500 text-base"
                  />
                </div>
              </div>

              {/* Auto calculation explanation */}
              <div className="bg-emerald-50/90 p-4 rounded-xl border border-emerald-200 space-y-2.5">
                <div className="flex justify-between font-bold text-emerald-900 text-sm">
                  <span>Monthly Interest (Each Month):</span>
                  <span>
                    {formatCurrency(
                       Math.round(((Number(newPrincipal) || 0) * (Number(newRate) || 0)) / 100)
                    )}
                  </span>
                </div>
                <div className="flex justify-between font-extrabold text-emerald-950 text-base pt-2 border-t border-emerald-200/80">
                  <span>Month 1 Total Due:</span>
                  <span>
                    {formatCurrency(
                       getCompoundTotal(newPrincipal, newRate, 1)
                    )}
                  </span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
                  <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p>
                     <strong>Compound Interest Rule:</strong> Each month applies the interest rate to the previous month&apos;s balance, so later months include prior accrued interest.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium text-base"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={newMethod}
                    onChange={(e) => {
                      const m = e.target.value;
                      setNewMethod(m);
                      if ((m === 'UPI' || m === 'Bank Transfer') && newReference.startsWith('REF-')) {
                        setNewReference('');
                      }
                    }}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-semibold text-base focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT / RTGS / IMPS)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {newMethod === 'UPI'
                      ? 'UPI Reference ID / UTR Number (Optional)'
                      : newMethod === 'Bank Transfer'
                      ? 'Bank Transaction ID / IMPS Ref (Optional)'
                      : 'Reference No. (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={newReference}
                    onChange={(e) => setNewReference(e.target.value)}
                    placeholder={
                      newMethod === 'UPI'
                        ? 'e.g. 423456789012 or GPay Ref ID'
                        : newMethod === 'Bank Transfer'
                        ? 'e.g. TXN987654321 or IMPS/NEFT Ref'
                        : 'e.g. REF-123456'
                    }
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-mono text-base text-slate-900 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Site construction loan"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium text-base"
                  />
                </div>
              </div>

              {/* WhatsApp Notification Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="sendWhatsAppAdd"
                  checked={sendWhatsApp}
                  onChange={(e) => setSendWhatsApp(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="sendWhatsAppAdd" className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1.5">
                  💬 Send WhatsApp Receipt / Loan Notification
                </label>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full-Screen Modal: Record Return Payment */}
      {isReturnModalOpen && currentSelectedLoanCalculated && (
        <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col animate-in fade-in duration-200">
          {/* Top Bar */}
          <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setIsReturnModalOpen(false); setSelectedLoan(null); setReturnPayMonth(''); setReturnPayDate(new Date().toISOString().split('T')[0]); }}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-600" />
                Record Return Payment
              </h3>
            </div>
            <button
              type="submit"
              form="return-pay-form"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 text-sm cursor-pointer"
            >
              Save Payment
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="max-w-lg mx-auto space-y-5">
              {/* Loan Summary Card */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-extrabold text-slate-900 text-base">{currentSelectedLoanCalculated.borrowerName}</p>
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                    {currentSelectedLoanCalculated.interestRate}% / month ({formatCurrency(currentSelectedLoanCalculated.monthlyInterest)}/mo)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Principal Given</span>
                    <p className="font-bold text-slate-900">{formatCurrency(currentSelectedLoanCalculated.principal)}</p>
                  </div>
                  <div className="bg-amber-50/60 rounded-xl p-3 border border-amber-100">
                    <span className="text-[11px] font-bold text-amber-700 uppercase">Total Accrued ({returnPayMonths || currentSelectedLoanCalculated.months} Mo)</span>
                    <p className="font-bold text-amber-900">
                      {formatCurrency(
                         getCompoundTotal(
                           currentSelectedLoanCalculated.principal,
                           currentSelectedLoanCalculated.interestRate,
                           Number(returnPayMonths) || currentSelectedLoanCalculated.months || 1
                         )
                      )}
                    </p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                    <span className="text-[11px] font-bold text-emerald-600 uppercase">Returned So Far</span>
                    <p className="font-bold text-emerald-700">{formatCurrency(currentSelectedLoanCalculated.returnedAmount || 0)}</p>
                  </div>
                  <div className="bg-rose-50 rounded-xl p-3 border border-rose-100">
                    <span className="text-[11px] font-bold text-rose-500 uppercase">Remaining Due</span>
                    <p className="font-bold text-rose-600">
                      {formatCurrency(
                        Math.max(
                          0,
                           getCompoundTotal(
                             currentSelectedLoanCalculated.principal,
                             currentSelectedLoanCalculated.interestRate,
                             Number(returnPayMonths) || currentSelectedLoanCalculated.months || 1
                           ) -
                            (currentSelectedLoanCalculated.returnedAmount || 0)
                        )
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Form */}
              <form id="return-pay-form" onSubmit={handleReturnSubmit} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-xs sm:text-sm">Payment Date *</label>
                    <input
                      type="date"
                      required
                      value={returnPayDate}
                      onChange={(e) => setReturnPayDate(e.target.value)}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:border-emerald-500 text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Repayment Type *</label>
                    <select
                      value={returnPayMonth}
                      onChange={(e) => {
                        const val = e.target.value;
                        setReturnPayMonth(val);
                        if (val === 'Full Settlement') {
                          setReturnPayAmount(currentSelectedLoanCalculated.dueAmount.toString());
                        }
                      }}
                      required
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:border-emerald-500 text-xs sm:text-sm"
                    >
                      <option value="Return Payment">Return Payment</option>
                      <option value="Full Settlement">Full Remaining Settlement</option>
                    </select>
                  </div>

                {/* Amount */}
                <div>
                  <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                    <label className="block font-bold text-slate-700">Return Amount Paid (₹) *</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setReturnPayAmount(currentSelectedLoanCalculated.monthlyInterest.toString())}
                        className="text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer"
                      >
                        Fill Monthly Int ({formatCurrency(currentSelectedLoanCalculated.monthlyInterest)})
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={() => {
                          setReturnPayAmount(currentSelectedLoanCalculated.dueAmount.toString());
                          setReturnPayMonth('Full Settlement');
                        }}
                        className="text-[11px] font-bold text-amber-700 hover:underline cursor-pointer"
                      >
                        Fill Full Due ({formatCurrency(currentSelectedLoanCalculated.dueAmount)})
                      </button>
                    </div>
                  </div>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 2000"
                    value={returnPayAmount}
                    onChange={(e) => setReturnPayAmount(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-lg text-slate-900 focus:outline-hidden focus:border-emerald-500"
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
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-emerald-500 text-sm"
                  />
                  {Number(returnPayDiscount) > 0 && (
                    <p className="text-[11px] font-bold text-emerald-700 mt-1">
                      💡 Net Credit to Loan: {formatCurrency((Number(returnPayAmount) || 0) + (Number(returnPayDiscount) || 0))} (Paid {formatCurrency(Number(returnPayAmount) || 0)} + Discount {formatCurrency(Number(returnPayDiscount) || 0)})
                    </p>
                  )}
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
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
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          returnPayMethod === method
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
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

                {/* Payment History */}
                {currentSelectedLoanCalculated.paymentHistory && currentSelectedLoanCalculated.paymentHistory.length > 0 && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-2">Previous Return Payments</label>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                       {currentSelectedLoanCalculated.paymentHistory.map((p, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2 border border-slate-100 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 rounded-md px-1.5 py-0.5 border border-amber-200">
                              {p.month}
                            </span>
                            <span className="text-xs text-slate-500">
                              {p.method || 'Cash'}
                              {p.discount ? ` • Discount: ${formatCurrency(p.discount)}` : ''}
                              {p.date ? ` • ${formatDate(p.date)}` : ''}
                            </span>
                          </div>
                           <div className="flex items-center gap-2">
                             <span className="font-bold text-emerald-600">{formatCurrency((Number(p.amount) || 0) + (Number(p.discount) || 0))}</span>
                             <button type="button" title="Edit return payment" onClick={() => {
                               setSelectedLoan(selectedLoan);
                               setEditingReturnPayment(p);
                               setReturnPayAmount(String(p.amount || 0));
                               setReturnPayDiscount(String(p.discount || 0));
                               setReturnPayMonth(p.month || '');
                               setReturnPayMonths(String(currentSelectedLoanCalculated.months || 1));
                               setReturnPayMethod(p.method || 'Cash');
                               setReturnPayRef(p.reference || '');
                               setReturnPayDate(p.date || new Date().toISOString().split('T')[0]);
                             }} className="text-amber-600 cursor-pointer"><Pencil className="w-3.5 h-3.5" /></button>
                             <button type="button" title="Delete return payment" onClick={() => window.confirm(`Delete return payment of ${formatCurrency((Number(p.amount) || 0) + (Number(p.discount) || 0))} for ${p.month || 'Loan'}?`) && deleteReturnPayment(selectedLoan.id, p.id)} className="text-rose-600 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* WhatsApp Notification Checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="sendWhatsAppReturn"
                    checked={sendWhatsApp}
                    onChange={(e) => setSendWhatsApp(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="sendWhatsAppReturn" className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1.5">
                    💬 Send WhatsApp Return Payment Receipt
                  </label>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal (Settle / Delete) */}
      {confirmModal.isOpen && confirmModal.loan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xl ${
                    confirmModal.type === 'delete'
                      ? 'bg-rose-100 text-rose-600'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {confirmModal.type === 'delete' ? '🗑️' : '🤝'}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {confirmModal.type === 'delete' ? 'Delete Loan Record' : 'Settle Loan'}
                  </h3>
                  <p className="text-xs text-slate-500 font-bold">
                    Confirmation required for {confirmModal.loan.borrowerName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, type: null, loan: null })}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-700 font-bold">
                <span>BORROWER:</span>
                <span className="text-slate-900 font-black">{confirmModal.loan.borrowerName}</span>
              </div>
              <div className="flex justify-between text-slate-700 font-bold">
                <span>PRINCIPAL:</span>
                <span className="text-slate-900 font-mono font-black">{formatCurrency(confirmModal.loan.principal)}</span>
              </div>
              <div className="flex justify-between text-slate-700 font-bold">
                <span>REMAINING DUE:</span>
                <span className="text-rose-700 font-mono font-black">{formatCurrency(confirmModal.loan.dueAmount)}</span>
              </div>
            </div>

            <p className="text-xs font-bold text-slate-600 leading-relaxed">
              {confirmModal.type === 'delete'
                ? `Are you sure you want to permanently DELETE the finance loan record for "${confirmModal.loan.borrowerName}"? This action cannot be undone.`
                : `Are you sure you want to mark this loan for "${confirmModal.loan.borrowerName}" as FULLY SETTLED? Remaining due of ${formatCurrency(confirmModal.loan.dueAmount)} will be cleared.`}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 font-mono">
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, type: null, loan: null })}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className={`px-5 py-2.5 text-white font-black rounded-xl text-xs shadow-md transition-all cursor-pointer ${
                  confirmModal.type === 'delete'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
                }`}
              >
                {confirmModal.type === 'delete' ? 'Yes, Delete Record' : 'Yes, Settle Loan'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Full-Screen Modal: Borrower Ledger & Payment History (Exact Table Format) */}
      {currentSelectedLedgerLoanCalculated && (() => {
        const allEvents = buildLoanLedgerEvents(currentSelectedLedgerLoanCalculated);
        const filteredEvents = allEvents.filter((ev) => {
          if (ledgerTab === 'Transactions') return ev.type === 'Transaction';
          if (ledgerTab === 'Payments') return ev.type === 'Payment';
          return true;
        });

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-slate-50 rounded-3xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
              {/* Top Header */}
              <div className="bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-lg">
                    📋
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      {currentSelectedLedgerLoanCalculated.borrowerName}'s Account Ledger
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          currentSelectedLedgerLoanCalculated.dueAmount === 0 ||
                          currentSelectedLedgerLoanCalculated.status === 'Settled'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {currentSelectedLedgerLoanCalculated.dueAmount === 0 ? 'Settled' : 'Active Loan'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                      <span>📞 {currentSelectedLedgerLoanCalculated.phone || 'No phone'}</span>
                      <span>•</span>
                      <span>Start: {currentSelectedLedgerLoanCalculated.startDate}</span>
                      <span>•</span>
                      <span>ID: {currentSelectedLedgerLoanCalculated.id}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLedgerLoan(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
                {/* KPI Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-wider block">
                      PRINCIPAL
                    </span>
                    <p className="text-base font-mono font-black text-slate-900 mt-1">
                      {formatCurrency(currentSelectedLedgerLoanCalculated.principal)}
                    </p>
                    <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
                      @ {currentSelectedLedgerLoanCalculated.interestRate}% / mo
                    </span>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-wider block">
                      TOTAL ACCRUED
                    </span>
                    <p className="text-base font-mono font-black text-amber-700 mt-1">
                      {formatCurrency(currentSelectedLedgerLoanCalculated.totalAmount)}
                    </p>
                    <span className="text-[10px] text-amber-800 font-bold block mt-0.5">
                      {currentSelectedLedgerLoanCalculated.months} Mo Interest ({formatCurrency(currentSelectedLedgerLoanCalculated.totalInterest)})
                    </span>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-wider block">
                      PAID SO FAR
                    </span>
                    <p className="text-base font-mono font-black text-emerald-600 mt-1">
                      {formatCurrency(currentSelectedLedgerLoanCalculated.returnedAmount || 0)}
                    </p>
                    <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                      Total Payments Recorded
                    </span>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-wider block">
                      REMAINING DUE
                    </span>
                    <p className="text-base font-mono font-black text-rose-600 mt-1">
                      {formatCurrency(currentSelectedLedgerLoanCalculated.dueAmount)}
                    </p>
                    <span className="text-[10px] text-rose-700 font-bold block mt-0.5">
                      {currentSelectedLedgerLoanCalculated.dueAmount === 0 ? 'Fully Paid' : 'Pending Balance'}
                    </span>
                  </div>
                </div>

                {/* Filter Tabs & Header Bar */}
                <div className="flex items-center justify-between gap-2 flex-wrap pt-1 font-sans">
                  <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl">
                    {['All', 'Transactions', 'Payments'].map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setLedgerTab(tab)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          ledgerTab === tab
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    Showing {filteredEvents.length} Ledger Event(s)
                  </span>
                </div>

                {/* EXACT TABLE FORMAT FROM USER SCREENSHOT */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-sans">
                      <thead>
                        <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-black uppercase tracking-wider text-[11px]">
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
                              No ledger transactions found for selected filter.
                            </td>
                          </tr>
                        ) : (
                          filteredEvents.map((ev) => (
                            <tr key={ev.id} className="hover:bg-slate-50/80 transition-colors">
                              {/* DATE */}
                              <td className="py-3.5 px-4 text-slate-600 font-bold whitespace-nowrap text-xs">
                                {ev.displayDate}
                              </td>

                              {/* TYPE (Pill Badge) */}
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
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

                              {/* PAYMENT METHOD & ID */}
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

                              {/* DESCRIPTION */}
                               <td className="py-3.5 px-4 font-bold text-slate-900">
                                 <div className="flex items-center justify-between gap-2">
                                   <span>{ev.description}</span>
                                   {ev.kind === 'payment' && (
                                     <span className="flex items-center gap-1 shrink-0">
                                       <button type="button" title="Edit return payment" onClick={() => {
                                         const payment = currentSelectedLedgerLoanCalculated.paymentHistory.find((item) => item.id === ev.paymentId);
                                         if (!payment) return;
                                         setSelectedLoan(currentSelectedLedgerLoanCalculated);
                                         setEditingReturnPayment(payment);
                                         setReturnPayAmount(String(payment.amount || 0));
                                         setReturnPayDiscount(String(payment.discount || 0));
                                         setReturnPayMonth(payment.month || '');
                                         setReturnPayMonths(String(currentSelectedLedgerLoanCalculated.months || 1));
                                         setReturnPayMethod(payment.method || 'Cash');
                                         setReturnPayRef(payment.reference || '');
                                         setReturnPayDate(payment.date || new Date().toISOString().split('T')[0]);
                                         setSelectedLedgerLoan(null);
                                         setIsReturnModalOpen(true);
                                       }} className="text-amber-600 cursor-pointer"><Pencil className="w-3.5 h-3.5" /></button>
                                       <button type="button" title="Delete return payment" onClick={() => window.confirm(`Delete return payment of ${formatCurrency(ev.paidAmount || 0)}?`) && deleteReturnPayment(currentSelectedLedgerLoanCalculated.id, ev.paymentId)} className="text-rose-600 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                                     </span>
                                   )}
                                 </div>
                               </td>

                              {/* BILL AMOUNT */}
                              <td className="py-3.5 px-4 text-right font-black text-slate-900 whitespace-nowrap">
                                {ev.billAmount > 0 ? formatCurrency(ev.billAmount) : '-'}
                              </td>

                              {/* AMOUNT PAID */}
                              <td className="py-3.5 px-4 text-right font-black text-emerald-600 whitespace-nowrap">
                                +{formatCurrency(ev.paidAmount || 0)}
                              </td>

                              {/* REMAINING DUE */}
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
              </div>

              {/* Footer Actions */}
              <div className="bg-white border-t border-slate-200 px-5 py-3.5 flex items-center justify-between gap-3 shrink-0">
                <a
                  href={`https://wa.me/${(currentSelectedLedgerLoanCalculated.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Hello ${currentSelectedLedgerLoanCalculated.borrowerName}, Loan Statement: Principal ${formatCurrency(
                      currentSelectedLedgerLoanCalculated.principal
                    )}, Month ${currentSelectedLedgerLoanCalculated.months} Interest: ${formatCurrency(
                      currentSelectedLedgerLoanCalculated.totalInterest
                    )}. Total Returned: ${formatCurrency(
                      currentSelectedLedgerLoanCalculated.returnedAmount || 0
                    )}. Remaining Due: ${formatCurrency(currentSelectedLedgerLoanCalculated.dueAmount)}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-emerald-200 transition-all"
                >
                  💬 WhatsApp Statement
                </a>

                <div className="flex items-center gap-2">
                  {currentSelectedLedgerLoanCalculated.dueAmount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const loanToPay = currentSelectedLedgerLoanCalculated;
                        setSelectedLedgerLoan(null);
                        const calculated = getLoanCalculatedDetails(loanToPay);
                        const firstUnsettled = getFirstUnsettledMonth(calculated);
                        const isAllSettled = isMonthSettled(calculated, firstUnsettled);
                        setSelectedLoan(loanToPay);
                        setReturnPayAmount(
                          (isAllSettled ? calculated.dueAmount : calculated.monthlyInterest || 2000).toString()
                        );
                        setReturnPayMonths(calculated.months.toString());
                        setReturnPayMonth(isAllSettled ? 'Full Settlement' : `Month ${firstUnsettled}`);
                        setIsReturnModalOpen(true);
                      }}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-md shadow-amber-600/20 transition-all cursor-pointer"
                    >
                      + Record Return
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedLedgerLoan(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      {/* WhatsApp Modal Dialog */}
      <WhatsAppModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        phone={whatsAppPhone}
        customerName={whatsAppCustName}
        messageText={whatsAppText}
      />

      {/* Edit Finance Loan Modal */}
      <EditFinanceLoanModal
        isOpen={Boolean(editingLoan)}
        onClose={() => setEditingLoan(null)}
        loan={editingLoan}
      />
    </div>
  );
};

export default Finance;
