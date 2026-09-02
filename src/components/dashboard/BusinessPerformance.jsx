import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '../../utils/formatCurrency';
import { calculateReportData } from '../../utils/calculations';
import { useBusiness } from '../../context/BusinessContext';

const BusinessPerformance = () => {
  const { transactions, payments, expenses, businesses } = useBusiness();
  const businessPerformanceDonut = useMemo(
    () => calculateReportData(transactions, payments, expenses, businesses, 'today').businessPerformance,
    [transactions, payments, expenses, businesses]
  );
  const total = businessPerformanceDonut.reduce((acc, item) => acc + item.value, 0);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Business Performance (Today)</h3>
          <p className="text-xs text-slate-500 font-medium">Income distribution across business units</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 items-center flex-1 gap-4">
        {/* Donut Chart with Center Text */}
        <div className="relative h-52 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={businessPerformanceDonut}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {businessPerformanceDonut.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val) => [formatCurrency(val), 'Income']}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Donut Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-lg font-extrabold text-slate-900 tracking-tight">
              {formatCurrency(total)}
            </span>
            <span className="text-[11px] font-medium text-slate-400">Total Income</span>
          </div>
        </div>

        {/* Custom Legend Table */}
        <div className="space-y-3 pl-0 sm:pl-2">
          {businessPerformanceDonut.map((item) => {
            const percentage = total ? ((item.value / total) * 100).toFixed(1) : '0.0';
            return (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-semibold text-slate-700">{item.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-900">{formatCurrency(item.value)}</span>
                  <span className="text-slate-400 font-medium text-[11px] w-10 text-right">
                    {percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BusinessPerformance;
