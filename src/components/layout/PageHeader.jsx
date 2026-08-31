import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const PageHeader = ({ title, subtitle, backUrl, action }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-6">
      <div>
        {backUrl && (
          <Link
            to={backUrl}
            className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-indigo-600 mb-0.5 sm:mb-1 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Back
          </Link>
        )}
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="hidden sm:block text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
};

export default PageHeader;
