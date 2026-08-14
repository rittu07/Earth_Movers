import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StatCard = ({ title, value, change, isIncrease, subtitle, icon: Icon, colorTheme = 'emerald' }) => {
  const getThemeStyles = () => {
    switch (colorTheme) {
      case 'emerald':
        return {
          bg: 'bg-emerald-500',
          text: 'text-emerald-700',
          lightBg: 'bg-emerald-50'
        };
      case 'rose':
        return {
          bg: 'bg-rose-500',
          text: 'text-rose-700',
          lightBg: 'bg-rose-50'
        };
      case 'amber':
        return {
          bg: 'bg-amber-500',
          text: 'text-amber-700',
          lightBg: 'bg-amber-50'
        };
      case 'blue':
      default:
        return {
          bg: 'bg-blue-600',
          text: 'text-blue-700',
          lightBg: 'bg-blue-50'
        };
    }
  };

  const theme = getThemeStyles();

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <div className={`w-10 h-10 rounded-xl ${theme.bg} text-white flex items-center justify-center shadow-xs`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-baseline justify-between">
        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
      </div>

      <div className="mt-2 flex items-center text-xs font-semibold gap-1">
        {change && (
          <span
            className={`inline-flex items-center gap-0.5 ${
              isIncrease ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {isIncrease ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5" />
            )}
            {change}
          </span>
        )}
        <span className="text-slate-400 font-medium">
          {subtitle || 'from yesterday'}
        </span>
      </div>
    </div>
  );
};

export default StatCard;
