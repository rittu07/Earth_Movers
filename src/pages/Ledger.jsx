import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import PageHeader from '../components/layout/PageHeader';
import { formatCurrency } from '../utils/formatCurrency';
import { exportToPdf } from '../utils/pdfGenerator';
import { BookOpen, Search, Download, ChevronDown, Eye } from 'lucide-react';
import { getDateRange, getOutsourcedSupplierName, isDateInRange } from '../utils/calculations';

const Ledger = () => {
  const { transactions, payments, customers, businesses, showToast } = useBusiness();
  const [selectedCust, setSelectedCust] = useState('all');
  const [selectedBusiness, setSelectedBusiness] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month, custom
  const [customDate, setCustomDate] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const navigate = useNavigate();

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
      isOutsourced: t.isOutsourced,
      outsourcedSupplier: t.outsourcedSupplier,
      description: `${t.itemService} (${t.quantity} ${t.unit})${t.isOutsourced ? ` • Outsourced from: ${getOutsourcedSupplierName(t)}` : ''}`,
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

    if (dateFilter === 'today' || dateFilter === 'week' || dateFilter === 'month') {
      if (!isDateInRange(ev.date, getDateRange(dateFilter))) return false;
    } else if (dateFilter === 'custom' && customDate) {
      if (ev.date !== customDate) return false;
    }

    return true;
  });

  const handleDownload = () => {
    exportToPdf({
      title: 'MASTER GENERAL LEDGER & AUDIT REPORT',
      subtitle: `Filter: ${selectedBusiness.toUpperCase()} • ${dateFilter.toUpperCase()}`,
      filename: 'Master_General_Ledger.pdf',
      columns: [
        { header: 'Date', key: 'displayDate' },
        { header: 'Type', key: 'type', bold: true },
        { header: 'Customer / Party', key: 'customerName', bold: true },
        { header: 'Sector / Business', key: 'businessName' },
        { header: 'Description', key: 'description' },
        { header: 'Debit (Bill)', key: 'formattedDebit', align: 'right', bold: true },
        { header: 'Credit (Paid)', key: 'formattedCredit', align: 'right', color: '#15803d' },
        { header: 'Balance Due', key: 'formattedBalance', align: 'right', color: '#b91c1c', bold: true }
      ],
      data: filteredEvents.map((ev) => ({
        ...ev,
        formattedDebit: ev.debit > 0 ? formatCurrency(ev.debit) : '-',
        formattedCredit: ev.credit > 0 ? `+${formatCurrency(ev.credit)}` : '₹0',
        formattedBalance: ev.balance > 0 ? formatCurrency(ev.balance) : '₹0'
      })),
      summary: [
        { label: 'Total Billed (Debit)', value: formatCurrency(filteredEvents.reduce((sum, e) => sum + e.debit, 0)) },
        { label: 'Total Received (Credit)', value: formatCurrency(filteredEvents.reduce((sum, e) => sum + e.credit, 0)), color: '#15803d' },
        { label: 'Total Outstanding Balance', value: formatCurrency(filteredEvents.reduce((sum, e) => sum + e.balance, 0)), color: '#b91c1c' }
      ]
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="General Ledger & Audit Log"
        subtitle="Complete double-entry record of transactions, payments, and settlements"
        action={
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> Download Audit PDF
          </button>
        }
      />

      {/* Filter and Date Selector Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Date Filter */}
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

      {/* MOBILE VIEW INLINE EXPANDABLE CARDS (No horizontal scrolling) */}
      <div className="md:hidden space-y-3">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs font-medium">
            No ledger transactions match selected filters.
          </div>
        ) : (
          filteredEvents.map((ev) => {
            const isExpanded = expandedId === ev.id;
            return (
              <div
                key={ev.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all"
              >
                {/* Header Card Bar (Tap to toggle expansion inline) */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : ev.id)}
                  className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl font-black flex items-center justify-center text-sm shrink-0 shadow-2xs ${
                      ev.type === 'Payment' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {ev.customerName ? ev.customerName.charAt(0) : 'L'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-slate-900 leading-tight truncate">
                        {ev.customerName.split('(')[0]}
                      </h4>
                       <p className="text-[11px] font-black text-indigo-900 mt-0.5 truncate">
                         {ev.type} • {ev.businessName}
                       </p>
                       {ev.isOutsourced && (
                         <p className="text-[10px] font-black text-amber-700 truncate">
                           Outsourced from: {getOutsourcedSupplierName(ev)}
                         </p>
                       )}
                      <span className="text-[10px] text-slate-400 font-medium">{ev.displayDate}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <div className="text-sm font-black text-slate-900">
                        {ev.type === 'Payment' ? (
                          <span className="text-emerald-600">+{formatCurrency(ev.credit)}</span>
                        ) : (
                          formatCurrency(ev.debit)
                        )}
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180 text-indigo-600' : ''}`} />
                  </div>
                </div>

                {/* Inline Details Accordion */}
                {isExpanded && (
                  <div className="p-4 bg-slate-50/70 border-t border-slate-100 space-y-3 text-xs animate-in slide-in-from-top-2 duration-200">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Particulars / Description</span>
                      <p className="text-xs text-slate-800 font-semibold">{ev.description}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Debit (Billed)</span>
                        <span className="text-xs font-black text-slate-900 mt-0.5 block">{ev.debit > 0 ? formatCurrency(ev.debit) : '-'}</span>
                      </div>
                      <div className="bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200 text-center">
                        <span className="text-[9px] font-extrabold text-emerald-700 uppercase block">Credit (Paid)</span>
                        <span className="text-xs font-black text-emerald-700 mt-0.5 block">{ev.credit > 0 ? `+${formatCurrency(ev.credit)}` : '-'}</span>
                      </div>
                      <div className="bg-rose-50/80 p-2.5 rounded-xl border border-rose-200 text-center">
                        <span className="text-[9px] font-extrabold text-rose-700 uppercase block">Balance Due</span>
                        <span className="text-xs font-black text-rose-700 mt-0.5 block">{ev.balance > 0 ? formatCurrency(ev.balance) : '₹0'}</span>
                      </div>
                    </div>

                    {ev.customerId && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/customers/${ev.customerId}`);
                        }}
                        className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Customer Ledger →
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP GENERAL ACCOUNTING TABLE (Visible on screens >= md) */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
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
                  <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-slate-700">
                    {ev.type}
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
