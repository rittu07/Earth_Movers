import React from 'react';
import { Link } from 'react-router-dom';
import { useBusiness } from '../../context/BusinessContext';
import {
  PlusCircle,
  MinusCircle,
  Wallet,
  Search,
  BookOpen,
  BarChart3
} from 'lucide-react';

const QuickActions = () => {
  const { openSearchModal } = useBusiness();

  const actions = [
    {
      title: 'Add Transaction',
      path: '/transactions/add',
      icon: PlusCircle,
      color: 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-100'
    },
    {
      title: 'Add Expense',
      path: '/expenses/add',
      icon: MinusCircle,
      color: 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-100'
    },
    {
      title: 'Receive Payment',
      path: '/payments/receive',
      icon: Wallet,
      color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-100'
    },
    {
      title: 'Search Customer',
      onClick: () => openSearchModal(),
      icon: Search,
      color: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-100'
    },
    {
      title: 'Customer Ledger',
      path: '/customers',
      icon: BookOpen,
      color: 'bg-purple-50 text-purple-600 hover:bg-purple-100 border-purple-100'
    },
    {
      title: 'View Reports',
      path: '/reports',
      icon: BarChart3,
      color: 'bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-100'
    }
  ];

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col h-full">
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-900">Quick Actions</h3>
        <p className="text-xs text-slate-500 font-medium">Fast shortcuts for daily tasks</p>
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1">
        {actions.map((act) => {
          const Icon = act.icon;
          if (act.path) {
            return (
              <Link
                key={act.title}
                to={act.path}
                className={`p-3.5 rounded-xl border ${act.color} flex flex-col items-center justify-center text-center transition-all shadow-2xs group`}
              >
                <Icon className="w-6 h-6 mb-1.5 transition-transform group-hover:scale-110" />
                <span className="text-xs font-bold">{act.title}</span>
              </Link>
            );
          }
          return (
            <button
              key={act.title}
              onClick={act.onClick}
              className={`p-3.5 rounded-xl border ${act.color} flex flex-col items-center justify-center text-center transition-all shadow-2xs group`}
            >
              <Icon className="w-6 h-6 mb-1.5 transition-transform group-hover:scale-110" />
              <span className="text-xs font-bold">{act.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
