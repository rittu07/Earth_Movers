import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBusiness } from '../../context/BusinessContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { Phone, ArrowUpRight } from 'lucide-react';

const OutstandingCustomers = () => {
  const { customers } = useBusiness();
  const navigate = useNavigate();

  // Filter customers with outstanding > 0 and sort descending
  const outstandingList = customers
    .filter((c) => c.outstanding > 0)
    .sort((a, b) => b.outstanding - a.outstanding)
    .slice(0, 4);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Top Outstanding Customers</h3>
          <p className="text-xs text-slate-500 font-medium">Pending balance to collect</p>
        </div>
        <Link
          to="/customers"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1"
        >
          View all <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-3 flex-1">
        {outstandingList.map((cust) => (
          <div
            key={cust.id}
            onClick={() => navigate(`/customers/${cust.id}`)}
            className="p-3 rounded-xl border border-slate-100 hover:border-indigo-200 bg-slate-50/50 hover:bg-indigo-50/30 cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs shrink-0">
                {cust.name.charAt(0)}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                  {cust.name}
                </h4>
                <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {cust.phone}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm font-extrabold text-rose-600">
                {formatCurrency(cust.outstanding)}
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Due balance</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OutstandingCustomers;
