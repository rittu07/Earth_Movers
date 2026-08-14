import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import PageHeader from '../components/layout/PageHeader';
import PaymentTable from '../components/payments/PaymentTable';
import { Wallet, Search, Filter } from 'lucide-react';

const Payments = () => {
  const { payments } = useBusiness();
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');

  const filteredPayments = payments.filter((pay) => {
    const matchesSearch =
      pay.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pay.phone.includes(searchTerm) ||
      pay.reference.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (methodFilter !== 'all' && pay.method.toLowerCase() !== methodFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Payments"
        subtitle="Track customer receipts, UPI settlements, cash collections and bank transfers"
        action={
          <Link
            to="/payments/receive"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all"
          >
            <Wallet className="w-4 h-4" /> + Receive Payment
          </Link>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, mobile or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Method Filter */}
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-indigo-500 w-full sm:w-auto"
        >
          <option value="all">All Payment Methods</option>
          <option value="cash">Cash</option>
          <option value="upi">UPI (GPay/PhonePe)</option>
          <option value="bank transfer">Bank Transfer</option>
          <option value="cheque">Cheque</option>
        </select>
      </div>

      {/* Payment Table */}
      <PaymentTable payments={filteredPayments} />
    </div>
  );
};

export default Payments;
