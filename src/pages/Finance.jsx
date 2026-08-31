import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import PageHeader from '../components/layout/PageHeader';
import StatCard from '../components/dashboard/StatCard';
import BusinessQuickActions from '../components/dashboard/BusinessQuickActions';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import QuickActions from '../components/dashboard/QuickActions';
import { formatCurrency } from '../utils/formatCurrency';
import {
  Landmark,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  Wallet,
  Trash2,
  X,
  Search
} from 'lucide-react';

const Finance = () => {
  const {
    overviewMetrics,
    financeLoans = [],
    addFinanceLoan,
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

  // New Loan Form State
  const [newBorrowerName, setNewBorrowerName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPrincipal, setNewPrincipal] = useState('100000');
  const [newRate, setNewRate] = useState('2');
  const [newMonths, setNewMonths] = useState('1');
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [newNotes, setNewNotes] = useState('');

  // Filtered loans list
  const filteredLoans = financeLoans.filter((loan) => {
    const matchesSearch =
      loan.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.phone.includes(searchTerm);
    if (statusFilter === 'All') return matchesSearch;
    return matchesSearch && loan.status === statusFilter;
  });

  // Summary Metrics
  const activeLoans = financeLoans.filter((l) => l.status === 'Active');
  const totalPrincipalGiven = financeLoans.reduce((sum, l) => sum + l.principal, 0);
  const totalMonthlyInterest = activeLoans.reduce((sum, l) => sum + l.monthlyInterest, 0);
  const totalReturnedAmount = financeLoans.reduce((sum, l) => sum + (l.returnedAmount || 0), 0);
  const totalRemainingDue = financeLoans.reduce((sum, l) => sum + (l.dueAmount !== undefined ? l.dueAmount : Math.max(0, l.totalAmount - (l.returnedAmount || 0))), 0);

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

    recordReturnPayment(selectedLoan.id, Number(returnPayAmount) || 0);
    setIsReturnModalOpen(false);
    setSelectedLoan(null);
    setReturnPayAmount('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Receive Customer Payment Card & Business Quick Action Blocks (Mobile View Only) */}
      <div className="md:hidden space-y-6">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-emerald-600" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-900">Receive Payment</h4>
          </div>
          <Link
            to="/payments/receive"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Wallet className="w-4 h-4" />
            <span>+ Receive Payment</span>
          </Link>
        </div>

        <BusinessQuickActions />
      </div>

      {/* Finance Loan & Return Records Directory */}
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-emerald-600" />
                Finance Loan & Return Ledger
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                List of people who took loans, monthly interest rates, return amounts paid & dues
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
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
                  <th className="py-3 px-3 text-right">Monthly Interest</th>
                  <th className="py-3 px-3 text-right">Total Payable</th>
                  <th className="py-3 px-3 text-right">Return Amount Paid</th>
                  <th className="py-3 px-3 text-right">Remaining Due</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredLoans.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-8 text-center text-slate-400 font-medium">
                      No finance loan records found.
                    </td>
                  </tr>
                ) : (
                  filteredLoans.map((loan) => {
                    const returned = loan.returnedAmount || 0;
                    const due = loan.dueAmount !== undefined ? loan.dueAmount : Math.max(0, loan.totalAmount - returned);

                    return (
                      <tr key={loan.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 text-sm">{loan.borrowerName}</div>
                          <div className="text-[11px] text-slate-400 font-normal">{loan.phone || loan.id}</div>
                        </td>

                        <td className="py-3 px-3 text-right font-bold text-slate-900">
                          {formatCurrency(loan.principal)}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 font-bold">
                            {loan.interestRate}% / mo
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right font-bold text-amber-600">
                          {formatCurrency(loan.monthlyInterest)}
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
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              loan.status === 'Settled' || due === 0
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {due === 0 ? 'Settled' : loan.status}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center space-x-1">
                          {due > 0 && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedLoan(loan);
                                  setReturnPayAmount(loan.monthlyInterest.toString());
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

      {/* Modal 1: Give New Loan */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-emerald-600" />
                Give New Loan
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Person / Borrower Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Person A / Ramesh"
                    value={newBorrowerName}
                    onChange={(e) => setNewBorrowerName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Principal Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="100000"
                    value={newPrincipal}
                    onChange={(e) => setNewPrincipal(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Monthly Interest (%) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="2"
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-amber-600 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tenure (Months) *</label>
                  <input
                    type="number"
                    required
                    placeholder="1"
                    value={newMonths}
                    onChange={(e) => setNewMonths(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Automatic calculation preview */}
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 space-y-1 text-xs">
                <div className="flex justify-between font-bold text-emerald-900">
                  <span>1 Month Interest:</span>
                  <span>
                    {formatCurrency(
                      ((Number(newPrincipal) || 0) * (Number(newRate) || 0)) / 100
                    )}
                  </span>
                </div>
                <div className="flex justify-between font-extrabold text-emerald-950 pt-1 border-t border-emerald-200/80">
                  <span>Total Amount Payable after {newMonths || 1} Month(s):</span>
                  <span>
                    {formatCurrency(
                      (Number(newPrincipal) || 0) +
                        (((Number(newPrincipal) || 0) * (Number(newRate) || 0)) / 100) *
                          (Number(newMonths) || 1)
                    )}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Date & Notes</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                  <input
                    type="text"
                    placeholder="Notes e.g. Site construction loan"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20"
                >
                  Save Loan Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Record Return Amount Paid by Person */}
      {isReturnModalOpen && selectedLoan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-600" />
                Record Loan Return Payment
              </h3>
              <button
                onClick={() => setIsReturnModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
              <p className="font-bold text-slate-900 text-sm">{selectedLoan.borrowerName}</p>
              <div className="flex justify-between text-slate-600">
                <span>Principal Given:</span>
                <span className="font-bold text-slate-900">{formatCurrency(selectedLoan.principal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Amount (with Interest):</span>
                <span className="font-bold text-slate-900">{formatCurrency(selectedLoan.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Returned So Far:</span>
                <span>{formatCurrency(selectedLoan.returnedAmount || 0)}</span>
              </div>
              <div className="flex justify-between text-rose-600 font-bold border-t border-slate-200 pt-1">
                <span>Remaining Due:</span>
                <span>{formatCurrency(selectedLoan.dueAmount !== undefined ? selectedLoan.dueAmount : Math.max(0, selectedLoan.totalAmount - (selectedLoan.returnedAmount || 0)))}</span>
              </div>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Return Amount Paid by Person (₹) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 2000"
                  value={returnPayAmount}
                  onChange={(e) => setReturnPayAmount(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-base text-slate-900 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={returnPayMethod}
                  onChange={(e) => setReturnPayMethod(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20"
                >
                  Record Return Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
