import React from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader';
import BusinessQuickActions from '../components/dashboard/BusinessQuickActions';
import { PlusCircle } from 'lucide-react';

const Transactions = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Business Operations"
        subtitle="Quick actions, sales, service orders, and material deliveries across all businesses"
        action={
          <Link
            to="/transactions/add"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer font-mono"
          >
            <PlusCircle className="w-4 h-4" /> + Add Transaction
          </Link>
        }
      />

      {/* Business Cards Grid */}
      <BusinessQuickActions />
    </div>
  );
};

export default Transactions;
