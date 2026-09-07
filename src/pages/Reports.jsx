import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import PageHeader from '../components/layout/PageHeader';
import { formatCurrency } from '../utils/formatCurrency';
import { exportToPdf } from '../utils/pdfGenerator';
import { calculateReportData } from '../utils/calculations';
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
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  Boxes,
  Truck,
  Droplets,
  Layers,
  Mountain,
  ArrowRight,
  Landmark,
  PieChart as PieIcon,
  BarChart3
} from 'lucide-react';

const Reports = () => {
  const { transactions, payments, expenses, businesses, financeLoans = [] } = useBusiness();
  const [dateRange, setDateRange] = useState('month'); // today, week, month, year

  const reportData = useMemo(
    () => calculateReportData(transactions, payments, expenses, businesses, dateRange, financeLoans),
    [transactions, payments, expenses, businesses, dateRange, financeLoans]
  );

  const handleDownload = () => {
    exportToPdf({
      title: 'BUSINESS INCOME & EXPENSE FINANCIAL REPORT',
      subtitle: `Scope: ${dateRange.toUpperCase()} PERFORMANCE DASHBOARD`,
      filename: `Business_Income_Expense_Report_${dateRange}.pdf`,
      columns: [
        { header: 'Business Unit', key: 'name', bold: true },
        { header: 'Income / Revenue', key: 'formattedRevenue', align: 'right', bold: true, color: '#15803d' },
        { header: 'Operating Expense', key: 'formattedExpense', align: 'right', color: '#b91c1c' },
        { header: 'Net Profit / Loss', key: 'formattedProfit', align: 'right', bold: true, color: '#1e40af' },
        { header: 'Orders', key: 'transactions', align: 'center' }
      ],
      data: reportData.businessBreakdown.map((item) => ({
        name: item.business,
        formattedRevenue: formatCurrency(item.revenue),
        formattedExpense: formatCurrency(item.expense),
        formattedProfit: formatCurrency(item.profit),
        transactions: `${item.transactions} orders`
      })),
      summary: [
        { label: 'Total Business Revenue', value: formatCurrency(reportData.totalIncome), color: '#15803d' },
        { label: 'Total Operating Expenses', value: formatCurrency(reportData.totalExpense), color: '#b91c1c' },
        { label: 'Net Operating Profit', value: formatCurrency(reportData.totalProfit), color: '#0284c7' },
        { label: 'Outstanding Receivables', value: formatCurrency(reportData.outstanding), color: '#d97706' }
      ]
    });
  };

  const iconMap = {
    bricks: Boxes,
    jcb: Truck,
    water: Droplets,
    jalli: Layers,
    sand: Mountain,
    finance: Landmark
  };

  const themeMap = {
    bricks: { bg: 'bg-orange-50/50', border: 'border-orange-200', text: 'text-orange-600', badge: 'bg-orange-100 text-orange-800' },
    jcb: { bg: 'bg-amber-50/50', border: 'border-amber-200', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-800' },
    water: { bg: 'bg-blue-50/50', border: 'border-blue-200', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-800' },
    jalli: { bg: 'bg-emerald-50/50', border: 'border-emerald-200', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-800' },
    sand: { bg: 'bg-teal-50/50', border: 'border-teal-200', text: 'text-teal-600', badge: 'bg-teal-100 text-teal-800' },
    finance: { bg: 'bg-purple-50/50', border: 'border-purple-200', text: 'text-purple-600', badge: 'bg-purple-100 text-purple-800' }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans">
      <PageHeader
        title="Reports & Business Financial Dashboard"
        subtitle="Income vs Expense dashboard and per-business financial analytics"
        action={
          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-2xs focus:outline-hidden cursor-pointer"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>

            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" /> Download PDF Report
            </button>
          </div>
        }
      />

      {/* 4 Executive KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-sans">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
            TOTAL BUSINESS INCOME
          </span>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {formatCurrency(reportData.totalIncome)}
          </p>
          <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
            Gross Sales & Revenue Dues
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
            TOTAL OPERATING EXPENSES
          </span>
          <p className="text-2xl font-black text-rose-600 mt-1">
            {formatCurrency(reportData.totalExpense)}
          </p>
          <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
            Material, Fuel, Labor & Outflows
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
            NET OPERATING PROFIT
          </span>
          <p className="text-2xl font-black text-blue-600 mt-1">
            {formatCurrency(reportData.totalProfit)}
          </p>
          <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
            Total Income - Operating Expenses
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
            OUTSTANDING DUES
          </span>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {formatCurrency(reportData.outstanding)}
          </p>
          <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">
            Total Pending Receivables
          </span>
        </div>
      </div>

      {/* PER-BUSINESS INCOME & EXPENSE DASHBOARD CARDS GRID */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">
            Per-Business Income & Expense Breakdown
          </h3>
          <span className="text-[11px] text-slate-400 font-semibold hidden sm:inline">
            Comparative performance across all business sectors
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportData.businessBreakdown.map((item) => {
            const IconComp = iconMap[item.businessId] || Boxes;
            const theme = themeMap[item.businessId] || {
              bg: 'bg-slate-50',
              border: 'border-slate-200',
              text: 'text-indigo-600',
              badge: 'bg-slate-100 text-slate-700'
            };

            const linkTarget = item.businessId === 'finance' ? '/finance' : `/business/${item.businessId}`;
            const totalVolume = item.revenue + item.expense;
            const incomePct = totalVolume > 0 ? Math.round((item.revenue / totalVolume) * 100) : 100;
            const expensePct = totalVolume > 0 ? 100 - incomePct : 0;

            return (
              <div
                key={item.businessId}
                className={`bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4 hover:shadow-md transition-all font-sans`}
              >
                {/* Header: Icon + Title + Status Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl ${theme.badge} flex items-center justify-center font-black shadow-2xs`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-900 leading-tight">
                        {item.business}
                      </h4>
                      <span className="text-[11px] text-slate-400 font-bold">
                        {item.transactions} Total Order(s)
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-black px-2.5 py-1 rounded-full border shadow-2xs ${
                      item.profit >= 0
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {item.profit >= 0 ? 'PROFITABLE' : 'DEFICIT'}
                  </span>
                </div>

                {/* 3 Metric Metrics Box: Income vs Expense vs Net Profit */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      INCOME
                    </span>
                    <p className="font-extrabold text-emerald-600 text-sm mt-0.5">
                      {formatCurrency(item.revenue)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      EXPENSE
                    </span>
                    <p className="font-extrabold text-rose-600 text-sm mt-0.5">
                      {formatCurrency(item.expense)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      NET PROFIT
                    </span>
                    <p className={`font-extrabold text-sm mt-0.5 ${item.profit >= 0 ? 'text-blue-600' : 'text-rose-700'}`}>
                      {formatCurrency(item.profit)}
                    </p>
                  </div>
                </div>

                {/* Income vs Expense Visual Dual Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-emerald-700">Income: {incomePct}%</span>
                    <span className="text-rose-700">Expense: {expensePct}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-500"
                      style={{ width: `${incomePct}%` }}
                    ></div>
                    <div
                      className="bg-rose-500 h-full transition-all duration-500"
                      style={{ width: `${expensePct}%` }}
                    ></div>
                  </div>
                </div>

                {/* Link to Business Ledger */}
                <Link
                  to={linkTarget}
                  className="flex items-center justify-between text-xs font-bold text-indigo-600 hover:text-indigo-800 pt-1 transition-colors"
                >
                  <span>View Business Ledger & Orders</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* DASHBOARD CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Per-Business Income vs Expense Grouped Bar Chart */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              Per-Business Income vs Expense Comparison
            </h3>
            <span className="text-[10px] font-bold text-slate-400">Side-by-side comparison</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.businessBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="business" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="revenue" name="Income / Revenue" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense" name="Operating Expense" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Revenue Share Pie Chart */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-600" />
              Revenue Share by Business Sector
            </h3>
            <span className="text-[10px] font-bold text-slate-400">Distribution %</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {reportData.businessPerformance.some((item) => item.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportData.businessPerformance.filter((item) => item.value > 0)}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    innerRadius={40}
                    paddingAngle={3}
                    label={({ name, percent }) => percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                  >
                    {reportData.businessPerformance
                      .filter((item) => item.value > 0)
                      .map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [formatCurrency(val), 'Revenue']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8">
                <PieIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-400">No revenue generated in selected period</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PER-BUSINESS INCOME & EXPENSE FINANCIAL STATEMENT TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900">
            Per-Business Income, Expense & Net Profit Financial Statement
          </h3>
          <button
            onClick={handleDownload}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-all"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" /> Export Statement
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">BUSINESS UNIT</th>
                <th className="py-3.5 px-4 text-right">INCOME / REVENUE</th>
                <th className="py-3.5 px-4 text-right">OPERATING EXPENSE</th>
                <th className="py-3.5 px-4 text-right">NET PROFIT / LOSS</th>
                <th className="py-3.5 px-4 text-center">ORDERS / DISPATCHES</th>
                <th className="py-3.5 px-4 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {reportData.businessBreakdown.map((row) => (
                <tr key={row.businessId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-black text-slate-900">{row.business}</td>
                  <td className="py-3.5 px-4 text-right font-black text-emerald-600 text-sm">
                    {formatCurrency(row.revenue)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-rose-600 text-sm">
                    {formatCurrency(row.expense)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-blue-600 text-sm">
                    {formatCurrency(row.profit)}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                    {row.transactions} order(s)
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      row.profit >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {row.profit >= 0 ? 'PROFITABLE' : 'DEFICIT'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100/90 font-black text-slate-900 text-xs border-t-2 border-slate-200">
                <td className="py-3.5 px-4 uppercase tracking-wider">TOTAL ALL BUSINESSES</td>
                <td className="py-3.5 px-4 text-right text-emerald-700 text-sm">{formatCurrency(reportData.totalIncome)}</td>
                <td className="py-3.5 px-4 text-right text-rose-700 text-sm">{formatCurrency(reportData.totalExpense)}</td>
                <td className="py-3.5 px-4 text-right text-blue-700 text-sm">{formatCurrency(reportData.totalProfit)}</td>
                <td colSpan="2" className="py-3.5 px-4 text-center text-slate-500">Official Financial Summary</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
