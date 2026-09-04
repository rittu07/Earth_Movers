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
  Landmark
} from 'lucide-react';

const Reports = () => {
  const { transactions, payments, expenses, businesses, financeLoans = [] } = useBusiness();
  const [dateRange, setDateRange] = useState('month'); // today, week, month, year
  const [activeTab, setActiveTab] = useState('summary');
  const reportData = useMemo(
    () => calculateReportData(transactions, payments, expenses, businesses, dateRange),
    [transactions, payments, expenses, businesses, dateRange]
  );

  const handleDownload = () => {
    exportToPdf({
      title: 'BUSINESS FINANCIAL & ANALYTICS REPORT',
      subtitle: `Scope: ${dateRange.toUpperCase()} PERFORMANCE`,
      filename: `Business_Report_${dateRange}.pdf`,
      columns: [
        { header: 'Business Unit / Sector', key: 'name', bold: true },
        { header: 'Revenue Generated', key: 'formattedValue', align: 'right', bold: true, color: '#15803d' },
        { header: 'Contribution %', key: 'percentage', align: 'right' }
      ],
       data: reportData.businessPerformance.map((item) => ({
         name: item.name,
         formattedValue: formatCurrency(item.value),
         percentage: `${reportData.totalIncome ? Math.round((item.value / reportData.totalIncome) * 100) : 0}%`
       })),
       summary: [
         { label: 'Total Revenue Income', value: formatCurrency(reportData.totalIncome), color: '#15803d' },
         { label: 'Total Expenses & Costs', value: formatCurrency(reportData.totalExpense), color: '#b91c1c' },
         { label: 'Net Profit Margin', value: formatCurrency(reportData.totalProfit), color: '#0284c7' },
         { label: 'Total Receivables Outstanding', value: formatCurrency(reportData.outstanding), color: '#d97706' }
      ]
    });
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

      {/* Interactive Business Unit Total Sales Cards */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">
            Business Unit Total Sales
          </h3>
          <span className="text-[11px] text-slate-400 font-semibold hidden sm:inline">
            Click any business card to view its total sales & dispatch ledger
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {reportData.businessBreakdown.map((item) => {
            const icons = {
              bricks: Boxes,
              jcb: Truck,
              water: Droplets,
              jalli: Layers,
              sand: Mountain
            };
            const themeMap = {
              bricks: {
                cardBg: 'hover:border-orange-300 hover:bg-orange-50/30',
                badgeBg: 'bg-orange-100 text-orange-700',
                textColor: 'text-orange-600'
              },
              jcb: {
                cardBg: 'hover:border-amber-300 hover:bg-amber-50/30',
                badgeBg: 'bg-amber-100 text-amber-800',
                textColor: 'text-amber-600'
              },
              water: {
                cardBg: 'hover:border-blue-300 hover:bg-blue-50/30',
                badgeBg: 'bg-blue-100 text-blue-700',
                textColor: 'text-blue-600'
              },
              jalli: {
                cardBg: 'hover:border-emerald-300 hover:bg-emerald-50/30',
                badgeBg: 'bg-emerald-100 text-emerald-700',
                textColor: 'text-emerald-600'
              },
              sand: {
                cardBg: 'hover:border-teal-300 hover:bg-teal-50/30',
                badgeBg: 'bg-teal-100 text-teal-800',
                textColor: 'text-teal-600'
              }
            };

            const theme = themeMap[item.businessId] || {
              cardBg: 'hover:border-indigo-300',
              badgeBg: 'bg-slate-100 text-slate-700',
              textColor: 'text-indigo-600'
            };

            const IconComp = icons[item.businessId] || Boxes;

            return (
              <Link
                key={item.businessId}
                to={`/business/${item.businessId}`}
                className={`bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs ${theme.cardBg} transition-all group flex flex-col justify-between cursor-pointer space-y-3`}
                title={`View total sales & dispatch log for ${item.business}`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 rounded-xl ${theme.badgeBg} flex items-center justify-center shrink-0 font-black shadow-2xs`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-400 group-hover:text-slate-900 flex items-center gap-0.5 transition-colors">
                    Sales <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                    {item.business}
                  </h4>
                  <div className="mt-1">
                    <span className={`text-base font-black ${theme.textColor}`}>
                      {formatCurrency(item.revenue)}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                    {item.transactions} total sales orders
                  </p>
                </div>
              </Link>
            );
          })}

          {/* Finance Loans Card */}
          <Link
            to="/finance"
            className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:border-purple-300 hover:bg-purple-50/30 transition-all group flex flex-col justify-between cursor-pointer space-y-3"
            title="View Finance Loan Ledger & Returns"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 font-black shadow-2xs">
                <Landmark className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold text-slate-400 group-hover:text-slate-900 flex items-center gap-0.5 transition-colors">
                Loans <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>

            <div>
              <h4 className="text-xs font-black text-slate-900 leading-tight group-hover:text-purple-600 transition-colors">
                Finance Loans
              </h4>
              <div className="mt-1">
                <span className="text-base font-black text-purple-600">
                  {formatCurrency(financeLoans.reduce((sum, l) => sum + (l.principal || 0), 0))}
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                {financeLoans.length} total loan records
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Income</span>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">
             {formatCurrency(reportData.totalIncome)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Expense</span>
          <p className="text-2xl font-extrabold text-rose-600 mt-1">
             {formatCurrency(reportData.totalExpense)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Net Profit</span>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">
             {formatCurrency(reportData.totalProfit)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Outstanding</span>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">
             {formatCurrency(reportData.outstanding)}
          </p>
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
               {reportData.businessBreakdown.map((row) => (
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
