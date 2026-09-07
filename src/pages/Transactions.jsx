import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import PageHeader from '../components/layout/PageHeader';
import TransactionTable from '../components/transactions/TransactionTable';
import { PlusCircle, Search, Filter, Download } from 'lucide-react';
import { getDateRange, isDateInRange } from '../utils/calculations';
import { exportBusinessStatementPdf } from '../utils/pdfGenerator';

const Transactions = () => {
  const { transactions, businesses } = useBusiness();
  const [searchTerm, setSearchTerm] = useState('');
  const [businessFilter, setBusinessFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [customDate, setCustomDate] = useState('');

  const filteredTrxs = transactions.filter((trx) => {
    const matchesSearch =
      trx.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trx.itemService.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trx.id.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (businessFilter !== 'all' && trx.businessId !== businessFilter) return false;
    if (statusFilter !== 'all' && trx.status.toLowerCase() !== statusFilter) return false;

    if (dateFilter === 'today' || dateFilter === 'week' || dateFilter === 'month') {
      if (!isDateInRange(trx.date, getDateRange(dateFilter))) return false;
    } else if (dateFilter === 'custom' && customDate) {
      if (trx.date !== customDate) return false;
    }

    return true;
  });

  const handleDownloadStatement = () => {
    exportBusinessStatementPdf({
      title: businessFilter !== 'all' ? `${businessFilter.toUpperCase()} TRANSACTIONS` : 'ALL BUSINESS TRANSACTIONS',
      transactions: filteredTrxs
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Transactions"
        subtitle="Track sales, service orders, and material deliveries across all 4 businesses"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadStatement}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Download className="w-4 h-4 text-indigo-600" /> Statement PDF
            </button>
            <Link
              to="/transactions/add"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer font-mono"
            >
              <PlusCircle className="w-4 h-4" /> + Add Transaction
            </Link>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search transaction, customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Date, Business and Status Selectors */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 pl-2">📅 Date:</span>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-hidden"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Specific Date</option>
            </select>
            {dateFilter === 'custom' && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
              />
            )}
          </div>

          <select
            value={businessFilter}
            onChange={(e) => setBusinessFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-indigo-500"
          >
            <option value="all">All Businesses</option>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Transaction Table */}
      <TransactionTable transactions={filteredTrxs} />
    </div>
  );
};

export default Transactions;
