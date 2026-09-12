import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import PageHeader from '../components/layout/PageHeader';
import StatusBadge from '../components/common/StatusBadge';
import EditTransactionModal from '../components/common/EditTransactionModal';
import EditPaymentModal from '../components/common/EditPaymentModal';
import { formatCurrency } from '../utils/formatCurrency';
import { getDateRange, getOutsourcedSupplierName, isDateInRange } from '../utils/calculations';
import { exportToPdf } from '../utils/pdfGenerator';
import {
  Phone,
  MapPin,
  PlusCircle,
  Wallet,
  Download,
  Receipt,
  CheckCircle,
  FileText,
  ChevronDown,
  Pencil,
  Trash2
} from 'lucide-react';

const getLedgerShortDesc = (item) => {
  if (item.type === 'Payment') {
    return item.paymentMethod ? `Payment (${item.paymentMethod})` : 'Payment Received';
  }
  const biz = (item.business || '').replace(' Supply', '').replace(' Rental', '').replace(' Service', '');
  if (item.quantity && item.unit) {
    return `${biz} • ${item.quantity} ${item.unit}`;
  }
  return item.description || biz || 'Sale Entry';
};

const CustomerLedger = () => {
  const { id } = useParams();
  const {
    getCustomerById,
    getCustomerLedger,
    transactions = [],
    payments = [],
    deleteTransaction,
    deletePayment,
    showToast
  } = useBusiness();

  const [activeTab, setActiveTab] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [customDate, setCustomDate] = useState('');
  const [expandedLedgerId, setExpandedLedgerId] = useState(null);

  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);

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

  // Overall activity totals
  const totalBusiness = ledgerItems
    .filter((item) => item.type === 'Transaction')
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const totalPaid = ledgerItems
    .reduce((sum, item) => sum + (Number(item.paid) || 0), 0);

  const totalOutstanding = Math.max(0, totalBusiness - totalPaid);

  const filteredItems = ledgerItems.filter((item) => {
    if (activeTab === 'transactions' && item.type !== 'Transaction') return false;
    if (activeTab === 'payments' && item.type !== 'Payment') return false;
    if (activeTab === 'outstanding' && item.due <= 0) return false;

    if (dateFilter === 'today' || dateFilter === 'week' || dateFilter === 'month') {
      if (!isDateInRange(item.date, getDateRange(dateFilter))) return false;
    } else if (dateFilter === 'custom' && customDate) {
      if (item.date !== customDate) return false;
    }

    return true;
  });

  // Filtered scope statement totals
  const filteredBusiness = filteredItems
    .filter((item) => item.type === 'Transaction')
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const filteredPaid = filteredItems
    .reduce((sum, item) => sum + (Number(item.paid) || 0), 0);

  const filteredOutstanding = Math.max(0, filteredBusiness - filteredPaid);

  const handleEdit = (item) => {
    if (item.type === 'Transaction') {
      const fullTrx = transactions.find((t) => t.id === item.id) || {
        id: item.id,
        customerName: customer.name,
        phone: customer.phone,
        itemService: item.description,
        amount: item.amount,
        paid: item.paid,
        due: item.due,
        date: item.date
      };
      setEditingTransaction(fullTrx);
    } else if (item.type === 'Payment') {
      const fullPay = payments.find((p) => p.id === item.id) || {
        id: item.id,
        customerName: customer.name,
        phone: customer.phone,
        amount: item.paid,
        date: item.date
      };
      setEditingPayment(fullPay);
    }
  };

  const handleDelete = (item) => {
    if (item.type === 'Transaction') {
      const details = [
        customer.name,
        item.business || 'Unknown business',
        item.description || 'Transaction',
        formatCurrency(item.amount || 0),
        item.date || 'No date'
      ].join(' | ');
      if (window.confirm(`Delete this transaction?\n\n${details}\n\nThis will adjust the customer outstanding balance.`)) {
        deleteTransaction(item.id);
      }
    } else if (item.type === 'Payment') {
      const details = [
        customer.name,
        'Payment',
        formatCurrency(item.paid || item.amount || 0),
        item.date || 'No date'
      ].join(' | ');
      if (window.confirm(`Delete this payment?\n\n${details}\n\nThis will adjust the customer outstanding balance.`)) {
        deletePayment(item.id);
      }
    }
  };

  const handleDownload = () => {
    exportToPdf({
      title: 'CUSTOMER ACCOUNT STATEMENT',
      customerName: customer.name,
      phone: customer.phone,
      address: customer.address,
      filename: `Statement_${customer.name}.pdf`,
      columns: [
        { header: 'Date', key: 'displayDate' },
        { header: 'Type', key: 'type', bold: true },
        { header: 'Business / Service', key: 'business' },
        { header: 'Description', key: 'description' },
        { header: 'Bill Amount', key: 'formattedAmount', align: 'right', bold: true },
        { header: 'Amount Paid', key: 'formattedPaid', align: 'right', color: '#15803d' },
        { header: 'Due Balance', key: 'formattedDue', align: 'right', color: '#b91c1c', bold: true }
      ],
      data: filteredItems.map((item) => ({
        ...item,
        formattedAmount: item.amount > 0 ? formatCurrency(item.amount) : '-',
        formattedPaid: item.paid > 0 ? `+${formatCurrency(item.paid)}` : '₹0',
        formattedDue: item.due > 0 ? formatCurrency(item.due) : '₹0'
      })),
      summary: [
        { label: 'Total Business / Sales', value: formatCurrency(filteredBusiness) },
        { label: 'Total Amount Received', value: formatCurrency(filteredPaid), color: '#15803d' },
        { label: 'Net Outstanding Due', value: formatCurrency(filteredOutstanding), color: '#b91c1c' }
      ]
    });
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
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Statement
            </button>
          </div>
        }
      />

      {/* Customer Header Info Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{customer.name}</h2>
          
          <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-slate-700">
            <a
              href={`tel:${customer.phone}`}
              className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <Phone className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>{customer.phone}</span>
            </a>

            {customer.address && (
              <>
                <span className="text-slate-300">•</span>
                <div className="inline-flex items-center gap-1.5 text-slate-700">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{customer.address}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Financial Metrics Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-black text-slate-500 uppercase tracking-wider block">
            Total Business / Sales
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {formatCurrency(totalBusiness)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-black text-emerald-600 uppercase tracking-wider block">
            Total Paid / Received
          </span>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {formatCurrency(totalPaid)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-black text-rose-600 uppercase tracking-wider block">
            Net Outstanding Due
          </span>
          <p className="text-2xl font-black text-rose-600 mt-1">
            {formatCurrency(totalOutstanding)}
          </p>
        </div>
      </div>

      {/* Tabs & Date Filter Controls */}
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
            All Activity ({ledgerItems.length})
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
      </div>

      {/* MOBILE INLINE EXPANDABLE CARDS (Visible on screens < md) */}
      <div className="md:hidden space-y-3">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs font-medium">
            No records match the tab selection.
          </div>
        ) : (
          filteredItems.map((item) => {
            const isExpanded = expandedLedgerId === item.id;
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all"
              >
                {/* Header Card Bar (Tap to toggle expansion inline) */}
                <div
                  onClick={() => setExpandedLedgerId(isExpanded ? null : item.id)}
                  className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl font-black flex items-center justify-center text-sm shrink-0 shadow-2xs ${
                      item.type === 'Payment' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {customer.name ? customer.name.charAt(0) : 'P'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-slate-900 leading-tight truncate">
                        {customer.name}
                      </h4>
                      <p className="text-[11px] font-black text-indigo-900 mt-0.5 truncate">
                        {getLedgerShortDesc(item)}
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium">{item.displayDate}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <div className="text-sm font-black text-slate-900">
                        {formatCurrency(item.amount || item.paid)}
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180 text-indigo-600' : ''}`} />
                  </div>
                </div>

                {/* Inline Full Details Accordion */}
                {isExpanded && (
                  <div className="p-4 bg-slate-50/70 border-t border-slate-100 space-y-3 text-xs animate-in slide-in-from-top-2 duration-200">
                    {/* Item / Service & Business Sector Card */}
                    <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white">
                          {item.business || item.type}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">Ref: {item.id}</span>
                      </div>
                      <div className="pt-1 flex items-baseline justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Description</span>
                          <span className="text-xs font-black text-slate-900">{item.description}</span>
                        </div>
                        {item.quantity && (
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Quantity</span>
                            <span className="text-xs font-black text-indigo-900">{item.quantity} {item.unit}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Financial Breakdown Box */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Bill Amount</span>
                        <span className="text-xs font-black text-slate-900 mt-0.5 block">{item.amount > 0 ? formatCurrency(item.amount) : '-'}</span>
                      </div>
                      <div className="bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200 text-center">
                        <span className="text-[9px] font-extrabold text-emerald-700 uppercase block">Amount Paid</span>
                        <span className="text-xs font-black text-emerald-700 mt-0.5 block">+{formatCurrency(item.paid)}</span>
                      </div>
                      <div className="bg-rose-50/80 p-2.5 rounded-xl border border-rose-200 text-center">
                        <span className="text-[9px] font-extrabold text-rose-700 uppercase block">Remaining Due</span>
                        <span className="text-xs font-black text-rose-700 mt-0.5 block">{item.due > 0 ? formatCurrency(item.due) : '₹0'}</span>
                      </div>
                    </div>

                    {/* Context & Additional Info */}
                    {(item.driverName || item.isOutsourced || item.waterSource || item.deliveryPlace || item.paymentMethod) && (
                      <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 text-[11px]">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Context & Method</span>
                        {item.paymentMethod && (
                          <div className="flex items-center justify-between text-slate-700 font-semibold bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                            <span>Payment Method: <strong>{item.paymentMethod}</strong></span>
                          </div>
                        )}
                        {item.driverName && (
                          <div className="flex items-center justify-between text-amber-900 font-semibold bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                            <span>Driver: {item.driverName}</span>
                            {Number(item.driverAmount) > 0 && <span>Bata: ₹{item.driverAmount}</span>}
                          </div>
                        )}
                        {item.isOutsourced && (
                          <div className="flex items-center justify-between text-orange-950 font-semibold bg-orange-50 p-1.5 rounded-lg border border-orange-200">
                             <span>Outsourced from: {getOutsourcedSupplierName(item)}</span>
                            {Number(item.outsourcedDue) > 0 && <span className="text-rose-700 font-bold">Due: ₹{item.outsourcedDue}</span>}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Bar (Edit / Delete Entry) */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="flex-1 py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl border border-amber-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit {item.type}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP DETAILED LEDGER TABLE (Visible on screens >= md) */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100/90 text-slate-700 font-black border-b border-slate-200">
            <tr>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black">Date</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black">Type</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black">Business</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black">Description</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black text-right">Bill Amount</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black text-right">Amount Paid</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black text-right">Remaining Due</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-10 text-center text-slate-400 font-bold text-sm">
                  No records match the tab selection.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-4 text-slate-500 font-semibold text-xs whitespace-nowrap">
                    {item.displayDate}
                  </td>

                  <td className="py-4 px-4 whitespace-nowrap">
                    <StatusBadge status={item.type} />
                  </td>

                  <td className="py-4 px-4 font-bold text-slate-900 text-sm whitespace-nowrap">
                    {item.business}
                  </td>

                  <td className="py-4 px-4 text-slate-900 font-bold text-sm">
                    {item.description}
                  </td>

                  <td className="py-4 px-4 text-right font-black text-base text-slate-950 whitespace-nowrap">
                    {item.amount > 0 ? formatCurrency(item.amount) : '-'}
                  </td>

                  <td className="py-4 px-4 text-right font-black text-base text-emerald-700 whitespace-nowrap">
                    +{formatCurrency(item.paid)}
                  </td>

                  <td className="py-4 px-4 text-right whitespace-nowrap">
                    {item.due > 0 ? (
                      <span className="font-black text-base text-amber-600">
                        {formatCurrency(item.due)}
                      </span>
                    ) : (
                      <span className="font-bold text-sm text-slate-400">₹0</span>
                    )}
                  </td>

                  <td className="py-4 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="p-2 inline-flex items-center text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                        title={`Edit ${item.type}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        className="p-2 inline-flex items-center text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title={`Delete ${item.type}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        isOpen={Boolean(editingTransaction)}
        onClose={() => setEditingTransaction(null)}
        transaction={editingTransaction}
      />

      {/* Edit Payment Modal */}
      <EditPaymentModal
        isOpen={Boolean(editingPayment)}
        onClose={() => setEditingPayment(null)}
        payment={editingPayment}
      />
    </div>
  );
};

export default CustomerLedger;
