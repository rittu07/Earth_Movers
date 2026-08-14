import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import PageHeader from '../components/layout/PageHeader';
import ExpenseTable from '../components/expenses/ExpenseTable';
import { formatCurrency } from '../utils/formatCurrency';
import { expenseMetricsSummary } from '../data/mockData';
import { PlusCircle, Search, TrendingDown, DollarSign } from 'lucide-react';

const Expenses = () => {
  const { expenses, businesses } = useBusiness();
  const [searchTerm, setSearchTerm] = useState('');
  const [businessFilter, setBusinessFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch =
      exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.category.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (businessFilter !== 'all' && exp.businessId !== businessFilter) return false;
    if (categoryFilter !== 'all' && exp.category.toLowerCase() !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Expenses"
        subtitle="Track operating expenditures, diesel fuel costs, labour wages and maintenance"
        action={
          <Link
            to="/expenses/add"
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/30 transition-all"
          >
            <PlusCircle className="w-4 h-4" /> + Add Expense
          </Link>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Today's Expense</span>
          <p className="text-xl font-extrabold text-rose-600 mt-1">
            {formatCurrency(expenseMetricsSummary.todayExpense)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">This Week</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">
            {formatCurrency(expenseMetricsSummary.thisWeek)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">This Month</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">
            {formatCurrency(expenseMetricsSummary.thisMonth)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Expense</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">
            {formatCurrency(expenseMetricsSummary.totalExpense)}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search expense description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={businessFilter}
            onChange={(e) => setBusinessFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-indigo-500"
          >
            <option value="all">All Businesses</option>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-indigo-500"
          >
            <option value="all">All Categories</option>
            <option value="diesel">Diesel</option>
            <option value="labour">Labour</option>
            <option value="transport">Transport</option>
            <option value="maintenance">Maintenance</option>
            <option value="electricity">Electricity</option>
            <option value="purchase">Purchase</option>
            <option value="salary">Salary</option>
            <option value="rent">Rent</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <ExpenseTable expenses={filteredExpenses} />
    </div>
  );
};

export default Expenses;
