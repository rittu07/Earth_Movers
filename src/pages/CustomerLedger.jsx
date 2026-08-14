import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import PageHeader from '../components/layout/PageHeader';
import StatusBadge from '../components/common/StatusBadge';
import { formatCurrency } from '../utils/formatCurrency';
import {
  Phone,
  MapPin,
  PlusCircle,
  Wallet,
  Download,
  Receipt,
  CheckCircle,
  FileText
} from 'lucide-react';

const CustomerLedger = () => {
  const { id } = useParams();
  const { getCustomerById, getCustomerLedger, showToast } = useBusiness();
  const [activeTab, setActiveTab] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [customDate, setCustomDate] = useState('');

  const customer = getCustomerById(id);

  if (!customer) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-xl font-bold text-slate-800">Customer Not Found</h2>
        <p className="text-sm text-slate-500 mt-1">The customer ID requested does not exist.</p>
        <Link to="/customers" className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">
          Back to Customers
        </Link>
      </div>
    );
  }

  const ledgerItems = getCustomerLedger(customer.id);

  const filteredItems = ledgerItems.filter((item) => {
    if (activeTab === 'transactions' && item.type !== 'Transaction') return false;
    if (activeTab === 'payments' && item.type !== 'Payment') return false;
    if (activeTab === 'outstanding' && item.due <= 0) return false;

    if (dateFilter === 'today') {
      const todayStr = new Date().toISOString().split('T')[0];
      if (item.date !== '2026-08-11' && item.date !== todayStr) return false;
    } else if (dateFilter === 'week') {
      if (!item.date.startsWith('2026-08')) return false;
    } else if (dateFilter === 'custom' && customDate) {
      if (item.date !== customDate) return false;
    }

    return true;
  });

  const handleDownload = () => {
    showToast(`Downloading statement for ${customer.name}...`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title={customer.name}
        subtitle={`Customer Code: ${customer.id} • Mobile: ${customer.phone}`}
        backUrl="/customers"
        action={
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <Link
              to={`/transactions/add?customer=${customer.id}`}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-md shadow-indigo-600/30 transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Add Transaction
            </Link>
            <Link
              to={`/payments/receive?customer=${customer.id}`}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-md shadow-emerald-600/30 transition-all"
            >
              <Wallet className="w-3.5 h-3.5" /> Receive Payment
            </Link>
            <button
              onClick={handleDownload}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1 transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Statement
            </button>
          </div>
        }
      />

      {/* Customer Header Info Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">{customer.name}</h2>
            <StatusBadge status={customer.status} />
          </div>
          <p className="text-xs text-slate-300 flex flex-wrap items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-indigo-400" />
              {customer.phone}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
              {customer.address}
            </span>
            {customer.gst && (
              <>
                <span>•</span>
                <span className="font-mono text-indigo-300">GST: {customer.gst}</span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* 6 Key Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Business</span>
          <p className="text-base font-extrabold text-slate-900 mt-1">
            {formatCurrency(customer.totalBusiness)}
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-600 uppercase">Total Paid</span>
          <p className="text-base font-extrabold text-emerald-600 mt-1">
            {formatCurrency(customer.paid)}
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-amber-600 uppercase">Outstanding</span>
          <p className="text-base font-extrabold text-amber-600 mt-1">
            {formatCurrency(customer.outstanding)}
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Transactions</span>
          <p className="text-base font-extrabold text-slate-900 mt-1">
            {customer.totalTransactions}
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Last Sale</span>
          <p className="text-xs font-bold text-slate-800 mt-1.5 truncate">
            {customer.lastTransaction}
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Last Payment</span>
          <p className="text-xs font-bold text-slate-800 mt-1.5 truncate">
            {customer.lastPayment}
          </p>
        </div>
      </div>

      {/* Tabs & Date Filter Controls */}
      <div className="border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-3 transition-all relative ${
              activeTab === 'all'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            All Activity ({ledgerItems.length})
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`pb-3 transition-all relative ${
              activeTab === 'transactions'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`pb-3 transition-all relative ${
              activeTab === 'payments'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Payments Received
          </button>
          <button
            onClick={() => setActiveTab('outstanding')}
            className={`pb-3 transition-all relative ${
              activeTab === 'outstanding'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Outstanding Items
          </button>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 mb-2 sm:mb-0">
          <span className="text-[11px] font-bold text-slate-500 pl-2">📅 Date:</span>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-hidden"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">August 2026</option>
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
      </div>

      {/* Detailed Ledger Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-4">Date</th>
              <th className="py-3.5 px-4">Type</th>
              <th className="py-3.5 px-4">Business</th>
              <th className="py-3.5 px-4">Description</th>
              <th className="py-3.5 px-4 text-right">Bill Amount</th>
              <th className="py-3.5 px-4 text-right">Amount Paid</th>
              <th className="py-3.5 px-4 text-right">Remaining Due</th>
              <th className="py-3.5 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-8 text-center text-slate-400">
                  No records match the tab selection.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                    {item.displayDate}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StatusBadge status={item.type} />
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                    {item.business}
                  </td>

                  <td className="py-3.5 px-4 text-slate-800">
                    {item.description}
                  </td>

                  <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 whitespace-nowrap">
                    {item.amount > 0 ? formatCurrency(item.amount) : '-'}
                  </td>

                  <td className="py-3.5 px-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                    +{formatCurrency(item.paid)}
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    {item.due > 0 ? (
                      <span className="font-extrabold text-amber-600">
                        {formatCurrency(item.due)}
                      </span>
                    ) : (
                      <span className="font-bold text-slate-400">₹0</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <StatusBadge status={item.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerLedger;
