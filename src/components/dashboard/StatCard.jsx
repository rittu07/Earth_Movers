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
    <div className="bg-white rounded-2xl p-2.5 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden min-w-0">
      <div className="flex items-center justify-between gap-1 mb-1.5 sm:mb-3">
        <span className="text-[9px] xs:text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-wider truncate">
          {title}
        </span>
        <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl ${theme.bg} text-white flex items-center justify-center shadow-2xs shrink-0`}>
          <Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
        </div>
      </div>

      <div className="flex items-baseline justify-between min-w-0">
        <h3 className="text-xs xs:text-sm sm:text-2xl font-black text-slate-900 tracking-tight truncate">{value}</h3>
      </div>

      <div className="mt-1 sm:mt-2 flex items-center text-[9px] sm:text-xs font-semibold gap-0.5 sm:gap-1 truncate">
        {change && (
          <span
            className={`inline-flex items-center gap-0.5 shrink-0 ${
              isIncrease ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'
            }`}
          >
            {isIncrease ? (
              <ArrowUpRight className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
            ) : (
              <ArrowDownRight className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
            )}
            {change}
          </span>
        )}
        <span className="text-slate-400 font-medium truncate">
          {subtitle || 'from yesterday'}
        </span>
      </div>
    </div>
  );
};

export default StatCard;
