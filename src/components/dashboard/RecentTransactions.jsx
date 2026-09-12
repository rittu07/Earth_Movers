import React from 'react';
import { Link } from 'react-router-dom';
import { useBusiness } from '../../context/BusinessContext';
import StatusBadge from '../common/StatusBadge';
import { formatCurrency } from '../../utils/formatCurrency';
import { getOutsourcedSupplierName } from '../../utils/calculations';
import { ArrowUpRight } from 'lucide-react';

const getShortDesc = (trx) => {
  if (trx.businessId === 'bricks') {
    return trx.quantity ? `Bricks • ${trx.quantity} ${trx.unit || 'units'}` : 'Bricks';
  }
  if (trx.businessId === 'jcb') {
    return trx.quantity ? `JCB • ${trx.quantity} Hrs` : 'JCB';
  }
  if (trx.businessId === 'water') {
    return trx.quantity ? `Water • ${trx.quantity} Loads` : 'Water';
  }
  if (trx.businessId === 'jalli') {
    return trx.quantity ? `Jalli • ${trx.quantity} ${trx.unit || 'Tractor'}` : 'Jalli';
  }
  return trx.businessName ? trx.businessName.replace(' Supply', '').replace(' Rental', '').replace(' Service', '') : 'Sale';
};

const RecentTransactions = () => {
  const { transactions } = useBusiness();
  const recent = transactions.slice(0, 6);

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col h-full w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-black text-slate-900">Recent Transactions</h3>
        </div>
        <Link
          to="/transactions"
          className="text-xs sm:text-sm font-extrabold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl hover:bg-indigo-100 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          View all <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-3 flex-1">
        {recent.map((trx) => (
          <div
            key={trx.id}
            className="p-3.5 sm:p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 bg-slate-50/60 hover:bg-slate-50 transition-all flex items-center justify-between gap-2 shadow-2xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-indigo-100 text-indigo-800 font-black flex items-center justify-center text-sm sm:text-base shrink-0 shadow-2xs">
                {trx.customerName.charAt(0)}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm sm:text-base font-black text-slate-900 leading-tight truncate">
                  {trx.customerName}
                </h4>
                 <p className="text-xs sm:text-sm font-black text-indigo-900 mt-0.5 truncate">
                   {getShortDesc(trx)}
                 </p>
                 {trx.isOutsourced && (
                   <p className="text-[11px] font-black text-amber-700 mt-0.5 truncate">
                     Outsourced from: {getOutsourcedSupplierName(trx)}
                   </p>
                 )}
                <span className="text-[11px] text-slate-400 font-medium">{trx.displayDate}</span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-base sm:text-xl font-black text-slate-900">
                {formatCurrency(trx.amount)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentTransactions;
