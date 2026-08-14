import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import PageHeader from '../components/layout/PageHeader';
import { formatCurrency } from '../utils/formatCurrency';
import { reportsSummaryData, weeklyPerformanceData, businessPerformanceDonut } from '../data/mockData';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Download, Calendar, TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';

const Reports = () => {
  const { showToast } = useBusiness();
  const [dateRange, setDateRange] = useState('month'); // today, week, month, custom
  const [activeTab, setActiveTab] = useState('summary');

  const handleDownload = () => {
    showToast('Generating and downloading report CSV/PDF...');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Reports & Financial Analytics"
        subtitle="Comprehensive P&L, business unit performance and tax summaries"
        action={
          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-xs focus:outline-hidden"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">Custom Year</option>
            </select>

            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all"
            >
              <Download className="w-4 h-4" /> Download Report
            </button>
          </div>
        }
      />

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Income</span>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">
            {formatCurrency(reportsSummaryData.totalIncome)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Expense</span>
          <p className="text-2xl font-extrabold text-rose-600 mt-1">
            {formatCurrency(reportsSummaryData.totalExpense)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Net Profit</span>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">
            {formatCurrency(reportsSummaryData.totalProfit)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Outstanding</span>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">
            {formatCurrency(reportsSummaryData.outstanding)}
          </p>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('summary')}
          className={`pb-3 transition-all relative ${
            activeTab === 'summary'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Executive Summary
        </button>
        <button
          onClick={() => setActiveTab('income-expense')}
          className={`pb-3 transition-all relative ${
            activeTab === 'income-expense'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Income vs Expense Trend
        </button>
        <button
          onClick={() => setActiveTab('business-wise')}
          className={`pb-3 transition-all relative ${
            activeTab === 'business-wise'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Business Wise Breakdown
        </button>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-4">Revenue & Expense Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis
                  axisLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(val) => `₹${val / 1000}k`}
                />
                <Tooltip formatter={(val) => [formatCurrency(val)]} />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke="#f43f5e"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Business Share Donut */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-4">Revenue Share by Business</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={businessPerformanceDonut}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {businessPerformanceDonut.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [formatCurrency(val)]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Business Unit Comparative Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-base font-bold text-slate-900">
            Business Unit Financial Comparison
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Business Unit</th>
                <th className="py-3.5 px-4 text-right">Revenue</th>
                <th className="py-3.5 px-4 text-right">Operating Expense</th>
                <th className="py-3.5 px-4 text-right">Net Profit</th>
                <th className="py-3.5 px-4 text-center">Transactions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {reportsSummaryData.businessBreakdown.map((row) => (
                <tr key={row.business} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{row.business}</td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600">
                    {formatCurrency(row.revenue)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-rose-600">
                    {formatCurrency(row.expense)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-blue-600">
                    {formatCurrency(row.profit)}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                    {row.transactions} orders
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
