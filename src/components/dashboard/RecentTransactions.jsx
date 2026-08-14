import React from 'react';
import { Link } from 'react-router-dom';
import { useBusiness } from '../../context/BusinessContext';
import StatusBadge from '../common/StatusBadge';
import { formatCurrency } from '../../utils/formatCurrency';
import { ArrowUpRight } from 'lucide-react';

const RecentTransactions = () => {
  const { transactions } = useBusiness();
  const recent = transactions.slice(0, 4);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Recent Transactions</h3>
          <p className="text-xs text-slate-500 font-medium">Latest sales & service entries</p>
        </div>
        <Link
          to="/transactions"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1"
        >
          View all <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-3 flex-1">
        {recent.map((trx) => (
          <div
            key={trx.id}
            className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                {trx.customerName.charAt(0)}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 leading-tight">
                  {trx.customerName}
                </h4>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  <span className="text-slate-700 font-semibold">{trx.businessName}</span> • {trx.itemService}
                </p>
                <span className="text-[10px] text-slate-400 font-normal">{trx.displayDate}</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm font-extrabold text-slate-900">
                {formatCurrency(trx.amount)}
              </div>
              <div className="mt-0.5">
                <StatusBadge status={trx.status} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentTransactions;
