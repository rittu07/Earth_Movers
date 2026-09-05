import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import PageHeader from '../components/layout/PageHeader';
import StatCard from '../components/dashboard/StatCard';
import BusinessQuickActions from '../components/dashboard/BusinessQuickActions';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import QuickActions from '../components/dashboard/QuickActions';
import { formatCurrency } from '../utils/formatCurrency';
import { getLoanCalculatedDetails, calculateElapsedMonths } from '../utils/loanUtils';
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
  Calendar
} from 'lucide-react';

const Finance = () => {
  const {
    overviewMetrics,
    financeLoans = [],
    addFinanceLoan,
    updateFinanceLoanMonths,
    recordReturnPayment,
    settleFinanceLoan,
    deleteFinanceLoan
  } = useBusiness();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Active', 'Settled'

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [returnPayAmount, setReturnPayAmount] = useState('');
  const [returnPayMethod, setReturnPayMethod] = useState('Cash');
  const [returnPayMonth, setReturnPayMonth] = useState('');
  const [returnPayMonths, setReturnPayMonths] = useState('');

  // New Loan Form State
  const [newBorrowerName, setNewBorrowerName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPrincipal, setNewPrincipal] = useState('100000');
  const [newRate, setNewRate] = useState('2');
  const [newMonths, setNewMonths] = useState('1');
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().split('T')[0]);
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
  const totalPrincipalGiven = processedLoans.reduce((sum, l) => sum + l.principal, 0);
  const totalMonthlyInterest = activeLoans.reduce((sum, l) => sum + l.monthlyInterest, 0);
  const totalReturnedAmount = processedLoans.reduce((sum, l) => sum + l.returnedAmount, 0);
  const totalRemainingDue = processedLoans.reduce((sum, l) => sum + l.dueAmount, 0);

  // Quick Month Increment / Decrement
  const handleMonthIncrement = (loanId, currentMonths, delta) => {
    const nextMonths = Math.max(1, (currentMonths || 1) + delta);
    updateFinanceLoanMonths(loanId, nextMonths);
  };

  // Handle Add Loan Form Submit
  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newBorrowerName.trim()) return;

    addFinanceLoan({
      borrowerName: newBorrowerName,
      phone: newPhone,
      principal: Number(newPrincipal) || 0,
      interestRate: Number(newRate) || 0,
      months: Number(newMonths) || 1,
      startDate: newStartDate,
      notes: newNotes
    });

    // Reset Form & Close Modal
    setNewBorrowerName('');
    setNewPhone('');
    setNewNotes('');
    setIsAddModalOpen(false);
  };

  // Handle Return Payment Submit
  const handleReturnSubmit = (e) => {
    e.preventDefault();
    if (!selectedLoan || !returnPayAmount) return;

    const newMonths = Number(returnPayMonths) || selectedLoan.months;
    recordReturnPayment(
      selectedLoan.id,
      Number(returnPayAmount) || 0,
      returnPayMonth || `Month ${newMonths}`,
      newMonths
    );
    setIsReturnModalOpen(false);
    setSelectedLoan(null);
    setReturnPayAmount('');
    setReturnPayMonth('');
    setReturnPayMonths('');
  };

  // When selected loan changes for return payment modal, calculate dynamic view
  const currentSelectedLoanCalculated = selectedLoan ? getLoanCalculatedDetails(selectedLoan) : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header (Hidden in Mobile View) */}
      <div className="hidden md:block">
        <PageHeader
          title="Finance"
          subtitle="Loan ledger, dynamic monthly interest tracking & variable tenure returns"
          action={
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> + Give New Loan
            </button>
          }
        />
      </div>

      {/* Mobile Finance View Section (Ultra Mobile Optimized) */}
      <div className="md:hidden space-y-5">
        {/* Mobile Page Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Finance</h2>
            <p className="text-[11px] font-bold text-slate-500">Variable Month Loan Tracker</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" /> + Give Loan
          </button>
        </div>

        {/* Business Section Cards */}
        <div className="space-y-3">
          <BusinessQuickActions />
        </div>

        {/* 4 Summary KPI Cards (White Light Mode Grid) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest block">
              TOTAL PRINCIPAL
            </span>
            <p className="text-lg font-mono font-black text-slate-900 mt-1">
              {formatCurrency(totalPrincipalGiven)}
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest block">
              ACTIVE LOANS
            </span>
            <p className="text-lg font-mono font-black text-emerald-700 mt-1">
              {activeLoans.length} Active
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest block">
              REMAINING DUE
            </span>
            <p className="text-lg font-mono font-black text-rose-700 mt-1">
              {formatCurrency(totalRemainingDue)}
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest block">
              TOTAL RETURNED
            </span>
            <p className="text-lg font-mono font-black text-emerald-700 mt-1">
              {formatCurrency(totalReturnedAmount)}
            </p>
          </div>
        </div>

        {/* Mobile Finance Loan Records Section */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between font-mono">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              FINANCE LOAN RECORDS
            </h3>
            <span className="text-[10px] font-black text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
              ⚡ Variable Interest
            </span>
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
                    className="bg-white text-slate-900 rounded-3xl p-5 border border-slate-200 shadow-md space-y-4 font-sans"
                  >
                    {/* Card Top: Tag + Borrower Name + Status Badge */}
                    <div className="flex items-start justify-between gap-2 font-mono">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-amber-600 text-white font-black text-[11px] px-2.5 py-0.5 rounded-full uppercase tracking-wide shadow-2xs">
                            {loan.id}
                          </span>
                          <h4 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-tight font-mono">
                            {loan.borrowerName}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-600 font-bold mt-1 flex items-center gap-1.5">
                          <span>📞 {loan.phone || 'No phone'}</span>
                          <span>•</span>
                          <span>Start: {loan.startDate}</span>
                        </p>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-mono font-black shrink-0 shadow-2xs ${
                          due === 0 || loan.status === 'Settled'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {due === 0 ? 'Settled' : 'Active'}
                      </span>
                    </div>

                    {/* WhatsApp Action Button */}
                    <a
                      href={`https://wa.me/${(loan.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                        `Hello ${loan.borrowerName}, Loan Statement: Principal ${formatCurrency(loan.principal)}, Month ${loan.months} Interest (${loan.interestRate}%/mo): ${formatCurrency(loan.totalInterest)}. Remaining Due: ${formatCurrency(loan.dueAmount)}.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-mono font-black text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                    >
                      <span className="text-base">💬</span> Send WhatsApp Statement 📊
                    </a>

                    {/* Primary KPI Box: Principal & Variable Month Stepper */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 font-mono">
                      <div>
                        <span className="text-[10px] font-mono font-black text-slate-700 uppercase tracking-widest block">
                          TOTAL PRINCIPAL
                        </span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-2xl sm:text-3xl font-mono font-black text-amber-700">
                            {formatCurrency(loan.principal)}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-700 font-bold block mt-0.5">
                          Rate: <strong className="text-amber-800 font-black">{loan.interestRate}% / mo</strong> ({formatCurrency(loan.monthlyInterest)}/mo)
                        </span>
                      </div>

                      {/* Variable Month Stepper */}
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="text-[10px] font-mono font-black text-slate-700 uppercase tracking-wider">
                          VARIABLE MONTH
                        </span>
                        <div className="flex items-center gap-1.5 bg-amber-600 text-white px-2.5 py-1.5 rounded-xl shadow-xs font-mono font-black text-xs">
                          <button
                            type="button"
                            onClick={() => handleMonthIncrement(loan.id, loan.months, -1)}
                            disabled={loan.months <= 1}
                            className="w-6 h-6 rounded-lg bg-slate-900 text-amber-400 font-mono font-black flex items-center justify-center text-sm border border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            title="Decrease Month"
                          >
                            -
                          </button>
                          <span className="px-1 text-white font-mono font-black text-xs whitespace-nowrap">
                            Month {loan.months}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleMonthIncrement(loan.id, loan.months, 1)}
                            className="w-6 h-6 rounded-lg bg-slate-900 text-amber-400 font-mono font-black flex items-center justify-center text-sm border border-slate-700 cursor-pointer"
                            title="Advance Next Month (+ Interest)"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Accrued Interest & Repayment Progress Bar Card */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 font-mono">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                          <span className="font-mono font-black text-slate-800 uppercase tracking-wide text-[10px]">
                            MONTH {loan.months} INTEREST ACCRUED
                          </span>
                        </div>
                        <span className="font-mono font-black text-amber-700 text-sm sm:text-base">
                          {formatCurrency(loan.totalInterest)}
                        </span>
                      </div>

                      {/* Repayment Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-mono font-black">
                          <span className="text-emerald-700">
                            Returned: {formatCurrency(returned)}
                          </span>
                          <span className="text-slate-700 font-bold">
                            Total Payable: {formatCurrency(loan.totalAmount)}
                          </span>
                        </div>

                        <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden p-0.5 border border-slate-300">
                          <div
                            className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${progressPct}%` }}
                          ></div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-800">
                          <span>
                            {progressPct}% paid
                          </span>
                          <span className="text-rose-700 font-mono font-black">
                            Due: {formatCurrency(due)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    {due > 0 ? (
                      <div className="flex items-center gap-2 pt-1 font-mono">
                        <button
                          onClick={() => {
                            setSelectedLoan(loan);
                            setReturnPayAmount((loan.monthlyInterest || 2000).toString());
                            setReturnPayMonths(loan.months.toString());
                            setReturnPayMonth(`Month ${loan.months}`);
                            setIsReturnModalOpen(true);
                          }}
                          className="flex-1 py-3 px-4 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-mono font-black text-xs sm:text-sm rounded-2xl transition-all shadow-md shadow-amber-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>💰</span> Record Return Payment
                        </button>
                        <button
                          onClick={() => settleFinanceLoan(loan.id)}
                          className="py-3 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono font-black text-xs sm:text-sm rounded-2xl border border-slate-300 transition-all cursor-pointer"
                        >
                          Settle
                        </button>
                        <button
                          onClick={() => deleteFinanceLoan(loan.id)}
                          className="p-3 bg-slate-100 hover:bg-rose-100 text-rose-600 rounded-2xl border border-slate-300 transition-colors cursor-pointer"
                          title="Delete Loan Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-emerald-100 border border-emerald-300 p-3.5 rounded-2xl text-emerald-900 text-xs font-mono font-black">
                        <span>🎉 Loan Fully Settled!</span>
                        <button
                          onClick={() => deleteFinanceLoan(loan.id)}
                          className="text-rose-700 hover:underline text-[11px] font-mono font-black cursor-pointer"
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
                  <th className="py-3 px-3 text-center">Variable Month</th>
                  <th className="py-3 px-3 text-right">Accrued Interest</th>
                  <th className="py-3 px-3 text-right">Total Payable</th>
                  <th className="py-3 px-3 text-right">Returned Paid</th>
                  <th className="py-3 px-3 text-right">Remaining Due</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredLoans.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="py-8 text-center text-slate-400 font-medium">
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
                          <div className="font-bold text-slate-900 text-sm">{loan.borrowerName}</div>
                          <div className="text-[11px] text-slate-400 font-normal">{loan.phone || loan.id}</div>
                          <div className="text-[10px] text-slate-400">Start: {loan.startDate}</div>
                        </td>

                        <td className="py-3 px-3 text-right font-bold text-slate-900">
                          {formatCurrency(loan.principal)}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 font-bold">
                            {loan.interestRate}% / mo
                          </span>
                          <span className="block text-[10px] text-amber-700 font-medium mt-0.5">
                            ({formatCurrency(loan.monthlyInterest)}/mo)
                          </span>
                        </td>

                        {/* Variable Month Stepper */}
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex items-center gap-1 bg-amber-50/90 border border-amber-200 p-1 rounded-xl">
                            <button
                              type="button"
                              onClick={() => handleMonthIncrement(loan.id, loan.months, -1)}
                              disabled={loan.months <= 1}
                              className="w-5 h-5 rounded-lg bg-white text-amber-900 font-extrabold flex items-center justify-center text-xs shadow-2xs border border-amber-200 hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                              title="Decrease Month"
                            >
                              -
                            </button>
                            <span className="text-[11px] font-black text-amber-900 px-1.5 whitespace-nowrap">
                              Month {loan.months}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleMonthIncrement(loan.id, loan.months, 1)}
                              className="w-5 h-5 rounded-lg bg-white text-amber-900 font-extrabold flex items-center justify-center text-xs shadow-2xs border border-amber-200 hover:bg-amber-100 cursor-pointer"
                              title="Advance Next Month (+ Interest)"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right font-bold text-amber-600">
                          {formatCurrency(loan.totalInterest)}
                        </td>

                        <td className="py-3 px-3 text-right font-bold text-slate-900">
                          {formatCurrency(loan.totalAmount)}
                        </td>

                        <td className="py-3 px-3 text-right font-bold text-emerald-600">
                          {formatCurrency(returned)}
                        </td>

                        <td className="py-3 px-3 text-right font-bold text-rose-600">
                          {formatCurrency(due)}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              loan.status === 'Settled' || due === 0
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {due === 0 ? 'Settled' : loan.status}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center space-x-1 whitespace-nowrap">
                          {due > 0 && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedLoan(loan);
                                  setReturnPayAmount((loan.monthlyInterest || 2000).toString());
                                  setReturnPayMonths(loan.months.toString());
                                  setReturnPayMonth(`Month ${loan.months}`);
                                  setIsReturnModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-[11px] border border-emerald-200 transition-all cursor-pointer"
                                title="Record Money Returned by Person"
                              >
                                + Record Return
                              </button>
                              <button
                                onClick={() => settleFinanceLoan(loan.id)}
                                className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-[11px] border border-indigo-200 transition-all cursor-pointer"
                                title="Settle Full Loan"
                              >
                                Settle
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => deleteFinanceLoan(loan.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
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

              <div className="grid grid-cols-3 gap-4">
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

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Month</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="1"
                    value={newMonths}
                    onChange={(e) => setNewMonths(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-emerald-500 text-base"
                  />
                </div>
              </div>

              {/* Auto calculation & variable month explanation */}
              <div className="bg-emerald-50/90 p-4 rounded-xl border border-emerald-200 space-y-2.5">
                <div className="flex justify-between font-bold text-emerald-900 text-sm">
                  <span>Monthly Interest (Each Month):</span>
                  <span>
                    {formatCurrency(
                      ((Number(newPrincipal) || 0) * (Number(newRate) || 0)) / 100
                    )}
                  </span>
                </div>
                <div className="flex justify-between font-extrabold text-emerald-950 text-base pt-2 border-t border-emerald-200/80">
                  <span>Month {newMonths || 1} Total Due:</span>
                  <span>
                    {formatCurrency(
                      (Number(newPrincipal) || 0) +
                        (((Number(newPrincipal) || 0) * (Number(newRate) || 0)) / 100) *
                          (Number(newMonths) || 1)
                    )}
                  </span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
                  <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p>
                    <strong>Variable Month Rule:</strong> Month 1 adds {formatCurrency(((Number(newPrincipal) || 0) * (Number(newRate) || 0)) / 100)} interest. If unpaid in Month 1, Month 2 automatically adds another {formatCurrency(((Number(newPrincipal) || 0) * (Number(newRate) || 0)) / 100)} due (Total {formatCurrency((Number(newPrincipal) || 0) + (((Number(newPrincipal) || 0) * (Number(newRate) || 0)) / 100) * 2)}), and so on.
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
                onClick={() => { setIsReturnModalOpen(false); setSelectedLoan(null); setReturnPayMonth(''); }}
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
                        currentSelectedLoanCalculated.principal +
                        currentSelectedLoanCalculated.monthlyInterest * (Number(returnPayMonths) || currentSelectedLoanCalculated.months || 1)
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
                          (currentSelectedLoanCalculated.principal +
                            currentSelectedLoanCalculated.monthlyInterest * (Number(returnPayMonths) || currentSelectedLoanCalculated.months || 1)) -
                            (currentSelectedLoanCalculated.returnedAmount || 0)
                        )
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Form */}
              <form id="return-pay-form" onSubmit={handleReturnSubmit} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-4">
                {/* Tenure & Month Selection */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Variable Month *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={returnPayMonths}
                      onChange={(e) => {
                        const val = e.target.value;
                        setReturnPayMonths(val);
                        if (val) setReturnPayMonth(`Month ${val}`);
                      }}
                      placeholder={currentSelectedLoanCalculated.months}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-lg text-slate-900 focus:outline-hidden focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Accrues interest per month</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Repayment For *</label>
                    <select
                      value={returnPayMonth}
                      onChange={(e) => {
                        const val = e.target.value;
                        setReturnPayMonth(val);
                        if (val.startsWith('Month ')) {
                          const m = val.split(' ')[1];
                          if (m && !isNaN(m)) setReturnPayMonths(m);
                        }
                      }}
                      required
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:border-emerald-500 text-xs sm:text-sm"
                    >
                      <option value="">-- Select Repayment --</option>
                      {Array.from({ length: Math.max(Number(returnPayMonths) || 1, currentSelectedLoanCalculated.months || 1) }, (_, i) => (
                        <option key={i + 1} value={`Month ${i + 1}`}>
                          Month {i + 1} Interest ({formatCurrency(currentSelectedLoanCalculated.monthlyInterest)})
                        </option>
                      ))}
                      <option value="Full Settlement">Full Remaining Settlement</option>
                      <option value="Partial Principal Return">Partial Principal Return</option>
                    </select>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700">Return Amount Paid (₹) *</label>
                    <button
                      type="button"
                      onClick={() => setReturnPayAmount(currentSelectedLoanCalculated.monthlyInterest.toString())}
                      className="text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer"
                    >
                      Fill 1 Month Int ({formatCurrency(currentSelectedLoanCalculated.monthlyInterest)})
                    </button>
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

                {/* Payment Method */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Cash', 'UPI', 'Bank Transfer'].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setReturnPayMethod(method)}
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
                            <span className="text-xs text-slate-500">{p.method || 'Cash'}</span>
                          </div>
                          <span className="font-bold text-emerald-600">{formatCurrency(p.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
