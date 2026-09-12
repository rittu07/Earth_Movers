import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import PageHeader from '../components/layout/PageHeader';
import StatusBadge from '../components/common/StatusBadge';
import { formatCurrency } from '../utils/formatCurrency';
import { exportToPdf } from '../utils/pdfGenerator';
import { openWhatsAppChat } from '../utils/whatsapp';
import {
  Phone,
  MapPin,
  PlusCircle,
  Wallet,
  Download,
  Receipt,
  MessageSquare,
  Building2,
  ChevronDown,
  Pencil,
  Trash2
} from 'lucide-react';

import PaySupplierModal from '../components/suppliers/PaySupplierModal';

const SupplierLedger = () => {
  const { id } = useParams();
  const { getSupplierById, getSupplierLedger, getSupplierFinancials, updateTransaction, deleteTransaction, showToast } = useBusiness();
  const [activeTab, setActiveTab] = useState('all');
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [monthFilter, setMonthFilter] = useState('');

  const supplier = getSupplierById(id);

  if (!supplier) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-xl font-bold text-slate-800">Supplier Not Found</h2>
        <p className="text-sm text-slate-500 mt-1">The requested supplier ID does not exist.</p>
        <Link to="/" className="mt-4 inline-block px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold">
          Back to Home
        </Link>
      </div>
    );
  }

  const ledgerItems = getSupplierLedger(supplier.id);

  const totalSupplies = ledgerItems.filter((i) => i.type === 'Supply Entry');
  const totalPayments = ledgerItems.filter((i) => i.type === 'Payment Made');

  const supplierFinancials = getSupplierFinancials(supplier.id);
  const totalSupplyAmount = supplierFinancials.totalPurchase;
  const totalPaidAmount = supplierFinancials.paidAmount;
  const remainingDue = supplierFinancials.outstanding;

  const filteredItems = ledgerItems.filter((item) => {
    if (activeTab === 'supplies' && item.type !== 'Supply Entry') return false;
    if (activeTab === 'payments' && item.type !== 'Payment Made') return false;
    if (activeTab === 'outstanding' && item.due <= 0) return false;
    if (monthFilter && !String(item.date || '').startsWith(monthFilter)) return false;
    return true;
  });

  const handleDownload = () => {
    exportToPdf({
      title: 'SUPPLIER ACCOUNT STATEMENT',
      customerName: supplier.name,
      phone: supplier.phone,
      address: supplier.address || 'Katpadi, Vellore',
      filename: `Supplier_Statement_${supplier.name}.pdf`,
      columns: [
        { header: 'Date', key: 'displayDate' },
        { header: 'Entry Type', key: 'type', bold: true },
        { header: 'Material / Description', key: 'description' },
        { header: 'Supply Cost', key: 'formattedAmount', align: 'right', bold: true },
        { header: 'Paid to Supplier', key: 'formattedPaid', align: 'right', color: '#15803d' },
        { header: 'Remaining Due', key: 'formattedDue', align: 'right', color: '#b91c1c', bold: true }
      ],
      data: filteredItems.map((item) => ({
        ...item,
        formattedAmount: item.amount > 0 ? formatCurrency(item.amount) : '-',
        formattedPaid: item.paid > 0 ? `+${formatCurrency(item.paid)}` : '₹0',
        formattedDue: item.due > 0 ? formatCurrency(item.due) : '₹0'
      })),
      summary: [
        { label: 'Total Material Supplied', value: formatCurrency(totalSupplyAmount) },
        { label: 'Total Paid to Supplier', value: formatCurrency(totalPaidAmount), color: '#15803d' },
        { label: 'Net Remaining Payable Due', value: formatCurrency(remainingDue), color: '#b91c1c' }
      ]
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title={supplier.name}
        subtitle={`Supplier Code: ${supplier.id} • Mobile: ${supplier.phone}`}
        backUrl="/"
        action={
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <Link
              to="/transactions/add"
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-md shadow-amber-600/30 transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" /> + Material Order
            </Link>
            <button
              onClick={() => setIsPayModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5" /> Pay Supplier
            </button>
            <button
              onClick={handleDownload}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Statement
            </button>
          </div>
        }
      />

      {/* Supplier Header Info Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-lg">
              🏢
            </div>
            <h2 className="text-xl font-bold">{supplier.name}</h2>
          </div>
          <p className="text-xs text-slate-300 flex flex-wrap items-center gap-3 mt-2">
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              {supplier.phone || 'N/A'}
            </span>
            {supplier.location && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  {supplier.location}
                </span>
              </>
            )}
            {supplier.contactPerson && (
              <>
                <span>•</span>
                <span className="text-amber-300">Contact: {supplier.contactPerson}</span>
              </>
            )}
          </p>
        </div>

        {supplier.phone && (
          <div className="flex items-center gap-2">
            <a
              href={`tel:${supplier.phone}`}
              className="px-3.5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5" /> Call
            </a>
            <button
              onClick={() =>
                openWhatsAppChat(supplier.phone, `Hello ${supplier.name}, regarding our material supply balance.`)
              }
              className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
            </button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Supply Bill</span>
          <p className="text-base font-extrabold text-slate-900 mt-1">
            {formatCurrency(totalSupplyAmount)}
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-600 uppercase">Total Paid to Supplier</span>
          <p className="text-base font-extrabold text-emerald-600 mt-1">
            {formatCurrency(totalPaidAmount)}
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-rose-600 uppercase">Amount To Pay (Payable)</span>
          <p className="text-base font-extrabold text-rose-600 mt-1">
            {formatCurrency(remainingDue)}
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Supply Orders</span>
          <p className="text-base font-extrabold text-slate-900 mt-1">
            {totalSupplies.length} Orders
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-6 text-xs font-bold overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 transition-all relative whitespace-nowrap cursor-pointer ${
            activeTab === 'all'
              ? 'text-amber-600 border-b-2 border-amber-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          All Activity ({ledgerItems.length})
        </button>
        <button
          onClick={() => setActiveTab('supplies')}
          className={`pb-3 transition-all relative whitespace-nowrap cursor-pointer ${
            activeTab === 'supplies'
              ? 'text-amber-600 border-b-2 border-amber-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Material Supplies ({totalSupplies.length})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 transition-all relative whitespace-nowrap cursor-pointer ${
            activeTab === 'payments'
              ? 'text-amber-600 border-b-2 border-amber-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Payments Made ({totalPayments.length})
        </button>
        <button
          onClick={() => setActiveTab('outstanding')}
          className={`pb-3 transition-all relative whitespace-nowrap cursor-pointer ${
            activeTab === 'outstanding'
              ? 'text-amber-600 border-b-2 border-amber-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Outstanding Items
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs font-bold text-slate-600">Filter month</label>
        <input type="month" value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold" />
        {monthFilter && <button onClick={() => setMonthFilter('')} className="text-xs font-bold text-indigo-600">Clear</button>}
      </div>

      {/* Supplier Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs font-medium">
            No ledger records found.
          </div>
        ) : (
          <table className="w-full text-left text-xs min-w-[850px]">
            <thead className="bg-slate-50 text-slate-500 uppercase font-black tracking-wider"><tr><th className="p-3">Date</th><th className="p-3">Type</th><th className="p-3">Business</th><th className="p-3">Description</th><th className="p-3 text-right">Bill Amount</th><th className="p-3 text-right">Amount Paid</th><th className="p-3 text-right">Remaining Due</th><th className="p-3">Action</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => <tr key={item.id}>
                <td className="p-3 whitespace-nowrap font-semibold text-slate-600">{item.displayDate}</td>
                <td className="p-3 font-bold">{item.type}</td>
                <td className="p-3 font-semibold">{item.business}</td>
                <td className="p-3 font-bold">{item.description}</td>
                <td className="p-3 text-right font-black">{formatCurrency(item.amount || 0)}</td>
                <td className="p-3 text-right font-black text-emerald-600">{formatCurrency(item.paid || 0)}</td>
                <td className="p-3 text-right font-black text-rose-600">{formatCurrency(item.due || 0)}</td>
                <td className="p-3 whitespace-nowrap">
                  {item.type === 'Supply Entry' && <><button title="Edit" onClick={() => { const cost = window.prompt('Supplier cost', String(item.amount)); if (cost !== null) updateTransaction(item.id, { outsourcedCost: Number(cost), outsourcedDue: Math.max(0, Number(cost) - Number(item.paid || 0)) }); }} className="p-1 text-amber-600"><Pencil className="w-4 h-4" /></button><button title="Delete" onClick={() => window.confirm(`Delete this supplier transaction?\n\n${supplier.name} | ${item.business} | ${item.description} | ${formatCurrency(item.amount || 0)} | ${item.displayDate || item.date || 'No date'}`) && deleteTransaction(item.id)} className="p-1 text-rose-600"><Trash2 className="w-4 h-4" /></button></>}
                </td>
              </tr>)}
            </tbody>
          </table>
        )}
      </div>

      {/* Pay Supplier Modal */}
      <PaySupplierModal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        preselectedSupplierId={supplier.id}
      />
    </div>
  );
};

export default SupplierLedger;
