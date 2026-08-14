import React from 'react';

const StatusBadge = ({ status }) => {
  let badgeStyle = 'bg-gray-100 text-gray-700 border-gray-200';

  switch (status?.toLowerCase()) {
    case 'paid':
    case 'active':
    case 'settled':
      badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium';
      break;
    case 'partial':
      badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200 font-medium';
      break;
    case 'pending':
    case 'overdue':
      badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200 font-medium';
      break;
    case 'transaction':
      badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200 font-medium';
      break;
    case 'payment':
      badgeStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200 font-medium';
      break;
    default:
      badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${badgeStyle}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
          status?.toLowerCase() === 'paid' || status?.toLowerCase() === 'active'
            ? 'bg-emerald-500'
            : status?.toLowerCase() === 'partial'
            ? 'bg-amber-500'
            : status?.toLowerCase() === 'pending'
            ? 'bg-rose-500'
            : 'bg-indigo-500'
        }`}
      />
      {status}
    </span>
  );
};

export default StatusBadge;
