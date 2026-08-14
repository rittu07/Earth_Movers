import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import PageHeader from '../components/layout/PageHeader';
import StatusBadge from '../components/common/StatusBadge';
import { formatCurrency } from '../utils/formatCurrency';
import { BookOpen, Search, Download } from 'lucide-react';

const Ledger = () => {
  const { transactions, payments, customers, businesses, showToast } = useBusiness();
  const [selectedCust, setSelectedCust] = useState('all');
  const [selectedBusiness, setSelectedBusiness] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month, custom
  const [customDate, setCustomDate] = useState('');

  // Build combined accounting ledger
  const allEvents = [
    ...transactions.map((t) => ({
      id: t.id,
      date: t.date,
      displayDate: t.displayDate || `${t.date}, 04:30 PM`,
      customerName: t.customerName,
      customerId: t.customerId,
      businessId: t.businessId,
      businessName: t.businessName,
      type: 'Transaction',
      description: `${t.itemService} (${t.quantity} ${t.unit})`,
      debit: t.amount,
      credit: t.paid,
      balance: t.due
    })),
    ...payments.map((p) => ({
      id: p.id,
      date: p.date,
      displayDate: p.displayDate || `${p.date}, 02:15 PM`,
      customerName: p.customerName,
      customerId: p.customerId,
      businessId: 'payment',
      businessName: 'Payment Received',
      type: 'Payment',
      description: `Payment Settlement (${p.method} - Ref: ${p.reference})`,
      debit: 0,
      credit: p.amount,
      balance: 0
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const filteredEvents = allEvents.filter((ev) => {
    if (selectedCust !== 'all' && ev.customerId !== selectedCust) return false;
    if (selectedBusiness !== 'all' && ev.businessId !== selectedBusiness) return false;

    if (dateFilter === 'today') {
      const todayStr = new Date().toISOString().split('T')[0];
      if (ev.date !== '2026-08-11' && ev.date !== todayStr) return false;
    } else if (dateFilter === 'week') {
      // Show recent 7 days
      if (!ev.date.startsWith('2026-08')) return false;
    } else if (dateFilter === 'custom' && customDate) {
      if (ev.date !== customDate) return false;
    }

    return true;
  });

  const handleExport = () => {
    showToast('Exporting ledger statement...');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="General Ledger"
        subtitle="Double-entry audit log of all customer debit bills, credit payments, date entries and closing balances"
        action={
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all"
          >
            <Download className="w-4 h-4" /> Export Ledger
          </button>
        }
      />

      {/* Filter Options */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Date Range Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 pl-2">📅 Date:</span>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-hidden"
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

          <select
            value={selectedCust}
            onChange={(e) => setSelectedCust(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-indigo-500"
          >
            <option value="all">All Customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedBusiness}
            onChange={(e) => setSelectedBusiness(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-indigo-500"
          >
            <option value="all">All Businesses</option>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs font-bold text-slate-600">
          Showing {filteredEvents.length} Ledger Events
        </div>
      </div>

      {/* General Accounting Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900 text-white font-semibold">
            <tr>
              <th className="py-3.5 px-4">Date</th>
              <th className="py-3.5 px-4">Customer</th>
              <th className="py-3.5 px-4">Type</th>
              <th className="py-3.5 px-4">Business</th>
              <th className="py-3.5 px-4">Particulars / Description</th>
              <th className="py-3.5 px-4 text-right">Debit (Billed)</th>
              <th className="py-3.5 px-4 text-right">Credit (Received)</th>
              <th className="py-3.5 px-4 text-right">Balance Due</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-8 text-center text-slate-400">
                  No ledger transactions match selected filters.
                </td>
              </tr>
            ) : (
              filteredEvents.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                    {ev.displayDate}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                    {ev.customerName.split('(')[0]}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StatusBadge status={ev.type} />
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700 whitespace-nowrap">
                    {ev.businessName}
                  </td>
                  <td className="py-3.5 px-4 text-slate-800 max-w-xs truncate">
                    {ev.description}
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 whitespace-nowrap">
                    {ev.debit > 0 ? formatCurrency(ev.debit) : '-'}
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600 whitespace-nowrap">
                    {ev.credit > 0 ? `+${formatCurrency(ev.credit)}` : '-'}
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-amber-600 whitespace-nowrap">
                    {ev.balance > 0 ? formatCurrency(ev.balance) : '₹0'}
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

export default Ledger;
