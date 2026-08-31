import React from 'react';
import { Link } from 'react-router-dom';
import { Boxes, Truck, Droplets, Layers, Mountain, Landmark, PlusCircle, MinusCircle, ArrowRight } from 'lucide-react';

const businessBlocks = [
  {
    id: 'bricks',
    name: 'Bricks Supply',
    path: '/business/bricks',
    icon: Boxes,
    colorTheme: {
      cardBg: 'bg-white hover:shadow-md',
      border: 'border-orange-200/90 hover:border-orange-300',
      badgeBg: 'bg-orange-100 text-orange-700',
      iconColor: 'text-orange-600',
      btnTrx: 'bg-orange-600 hover:bg-orange-700 text-white shadow-xs shadow-orange-600/20',
      btnExp: 'bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200'
    }
  },
  {
    id: 'jcb',
    name: 'JCB Rental',
    path: '/business/jcb',
    icon: Truck,
    colorTheme: {
      cardBg: 'bg-white hover:shadow-md',
      border: 'border-amber-200/90 hover:border-amber-300',
      badgeBg: 'bg-amber-100 text-amber-800',
      iconColor: 'text-amber-600',
      btnTrx: 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs shadow-amber-600/20',
      btnExp: 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
    }
  },
  {
    id: 'water',
    name: 'Water Supply',
    path: '/business/water',
    icon: Droplets,
    colorTheme: {
      cardBg: 'bg-white hover:shadow-md',
      border: 'border-blue-200/90 hover:border-blue-300',
      badgeBg: 'bg-blue-100 text-blue-700',
      iconColor: 'text-blue-600',
      btnTrx: 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs shadow-blue-600/20',
      btnExp: 'bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200'
    }
  },
  {
    id: 'jalli',
    name: 'Jalli Service',
    path: '/business/jalli',
    icon: Layers,
    colorTheme: {
      cardBg: 'bg-white hover:shadow-md',
      border: 'border-emerald-200/90 hover:border-emerald-300',
      badgeBg: 'bg-emerald-100 text-emerald-700',
      iconColor: 'text-emerald-600',
      btnTrx: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shadow-emerald-600/20',
      btnExp: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
    }
  },
  {
    id: 'sand',
    name: 'Sand Supply',
    path: '/business/sand',
    icon: Mountain,
    colorTheme: {
      cardBg: 'bg-white hover:shadow-md',
      border: 'border-teal-200/90 hover:border-teal-300',
      badgeBg: 'bg-teal-100 text-teal-800',
      iconColor: 'text-teal-600',
      btnTrx: 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs shadow-teal-600/20',
      btnExp: 'bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200'
    }
  },
  {
    id: 'finance',
    name: 'Finance Loans',
    path: '/finance',
    icon: Landmark,
    colorTheme: {
      cardBg: 'bg-white hover:shadow-md',
      border: 'border-purple-200/90 hover:border-purple-300',
      badgeBg: 'bg-purple-100 text-purple-800',
      iconColor: 'text-purple-600',
      btnTrx: 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs shadow-purple-600/20',
      btnExp: 'bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200'
    }
  }
];

const BusinessQuickActions = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
      {businessBlocks.map((b) => {
        const Icon = b.icon;
        const { cardBg, border, badgeBg, btnTrx, btnExp } = b.colorTheme;
        return (
          <div
            key={b.id}
            className={`${cardBg} ${border} rounded-2xl p-5 border shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5`}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl ${badgeBg} flex items-center justify-center shrink-0 shadow-2xs`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h4 className="text-base font-black text-slate-900 leading-tight">{b.name}</h4>
              </div>
              <Link
                to={b.path}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                title={`Go to ${b.name}`}
              >
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                to={b.id === 'finance' ? '/finance' : `/transactions/add?business=${b.id}`}
                className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap ${btnTrx}`}
              >
                <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                <span>+ {b.id === 'finance' ? 'Loan' : 'Sale'}</span>
              </Link>

              <Link
                to={b.id === 'finance' ? '/expenses/add' : `/expenses/add?business=${b.id}`}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap ${btnExp}`}
              >
                <MinusCircle className="w-3.5 h-3.5 shrink-0" />
                <span>+ Expense</span>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BusinessQuickActions;
