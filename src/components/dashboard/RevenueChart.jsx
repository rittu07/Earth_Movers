import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { formatCurrency } from '../../utils/formatCurrency';
import { calculateReportData } from '../../utils/calculations';
import { useBusiness } from '../../context/BusinessContext';

const RevenueChart = () => {
  const { transactions, payments, expenses, businesses } = useBusiness();
  const weeklyPerformanceData = useMemo(
    () => calculateReportData(transactions, payments, expenses, businesses, 'week').weeklyPerformance,
    [transactions, payments, expenses, businesses]
  );

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Income vs Expense (This Week)</h3>
          <p className="text-xs text-slate-500 font-medium">Monday to Sunday revenue breakdown</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
            <span className="text-slate-600">Income</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>
            <span className="text-slate-600">Expense</span>
          </div>
        </div>
      </div>

      <div className="h-60 w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weeklyPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(val) => `₹${val / 1000}k`}
            />
            <Tooltip
              formatter={(val) => [formatCurrency(val)]}
              contentStyle={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={16} />
            <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;
