import React from 'react';
import { useBusiness } from '../context/BusinessContext';
import StatCard from '../components/dashboard/StatCard';
import BusinessPerformance from '../components/dashboard/BusinessPerformance';
import RevenueChart from '../components/dashboard/RevenueChart';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import OutstandingCustomers from '../components/dashboard/OutstandingCustomers';
import QuickActions from '../components/dashboard/QuickActions';
import { formatCurrency } from '../utils/formatCurrency';
import { TrendingUp, TrendingDown, Clock, Wallet } from 'lucide-react';

const Dashboard = () => {
  const { overviewMetrics } = useBusiness();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="TODAY'S INCOME"
          value={formatCurrency(overviewMetrics.todayIncome)}
          change="+18.6%"
          isIncrease={true}
          subtitle="from yesterday"
          icon={TrendingUp}
          colorTheme="emerald"
        />

        <StatCard
          title="TODAY'S EXPENSE"
          value={formatCurrency(overviewMetrics.todayExpense)}
          change="-5.3%"
          isIncrease={false}
          subtitle="from yesterday"
          icon={TrendingDown}
          colorTheme="rose"
        />

        <StatCard
          title="OUTSTANDING"
          value={formatCurrency(overviewMetrics.totalOutstanding)}
          subtitle="From 47 customers"
          icon={Clock}
          colorTheme="amber"
        />

        <StatCard
          title="TODAY'S PROFIT"
          value={formatCurrency(overviewMetrics.todayProfit)}
          change="+28.4%"
          isIncrease={true}
          subtitle="from yesterday"
          icon={Wallet}
          colorTheme="blue"
        />
      </div>

      {/* Row 2: Business Performance Donut & Weekly Income vs Expense Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BusinessPerformance />
        <RevenueChart />
      </div>

      {/* Row 3: Recent Transactions, Outstanding Customers, Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <RecentTransactions />
        <OutstandingCustomers />
        <QuickActions />
      </div>
    </div>
  );
};

export default Dashboard;
