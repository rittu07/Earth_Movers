/**
 * Calculate total transaction amount
 */
export const calculateTotal = (quantity, rate, additionalCharge = 0) => {
  const qty = Number(quantity) || 0;
  const r = Number(rate) || 0;
  const extra = Number(additionalCharge) || 0;
  return (qty * r) + extra;
};

/**
 * Calculate remaining outstanding due
 */
export const calculateOutstanding = (total, paid) => {
  const tot = Number(total) || 0;
  const pd = Number(paid) || 0;
  return Math.max(0, tot - pd);
};

/**
 * Determine payment status based on total and paid amounts
 */
export const getPaymentStatus = (total, paid) => {
  const tot = Number(total) || 0;
  const pd = Number(paid) || 0;
  
  if (pd >= tot && tot > 0) return 'Paid';
  if (pd > 0 && pd < tot) return 'Partial';
  return 'Pending';
};

/**
 * Calculate duration between two time strings (HH:mm format) in hours
 */
export const calculateJCBDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;
  
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  
  let startMinutes = startH * 60 + startM;
  let endMinutes = endH * 60 + endM;
  
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60; // Handle midnight crossover
  }
  
  const durationInHours = (endMinutes - startMinutes) / 60;
  return Math.round(durationInHours * 10) / 10; // 1 decimal place
};

/**
 * Calculate summary metrics for dashboard or customer ledgers
 */
export const calculateSummaryMetrics = (transactions = [], payments = [], expenses = []) => {
  const totalIncome = transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalPaid = transactions.reduce((sum, t) => sum + (Number(t.paid) || 0), 0) +
    payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalBilled = transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalOutstanding = Math.max(0, totalBilled - totalPaid);
  const totalExpense = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalProfit = totalIncome - totalExpense;

  return {
    totalIncome,
    totalPaid,
    totalOutstanding,
    totalExpense,
    totalProfit
  };
};

export const getDateRange = (range = 'month', reference = new Date()) => {
  const end = new Date(reference);
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);

  if (range === 'today') {
    start.setHours(0, 0, 0, 0);
  } else if (range === 'week') {
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  } else if (range === 'year') {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }

  return { start, end };
};

export const isDateInRange = (date, range) => {
  if (!date) return false;
  const value = new Date(`${date}T00:00:00`);
  return value >= range.start && value <= range.end;
};

export const calculateReportData = (
  transactions = [],
  payments = [],
  expenses = [],
  businesses = [],
  dateRange = 'month'
) => {
  const range = getDateRange(dateRange);
  const scopedTransactions = transactions.filter((item) => isDateInRange(item.date, range));
  const scopedPayments = payments.filter((item) => isDateInRange(item.date, range));
  const scopedExpenses = expenses.filter((item) => isDateInRange(item.date, range));
  const totalIncome = scopedTransactions.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalExpense = scopedExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalPaid = scopedTransactions.reduce((sum, item) => sum + Number(item.paid || 0), 0) +
    scopedPayments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const outstanding = Math.max(0, totalIncome - totalPaid);

  const businessBreakdown = businesses.map((business) => {
    const revenue = scopedTransactions
      .filter((item) => item.businessId === business.id)
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const expense = scopedExpenses
      .filter((item) => item.businessId === business.id)
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return {
      business: business.name,
      businessId: business.id,
      revenue,
      expense,
      profit: revenue - expense,
      transactions: scopedTransactions.filter((item) => item.businessId === business.id).length
    };
  });

  const chartDays = [];
  for (let index = 6; index >= 0; index -= 1) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - index);
    const date = day.toISOString().split('T')[0];
    chartDays.push({
      date,
      day: day.toLocaleDateString('en-US', { weekday: 'short' }),
      income: transactions.filter((item) => item.date === date).reduce((sum, item) => sum + Number(item.amount || 0), 0),
      expense: expenses.filter((item) => item.date === date).reduce((sum, item) => sum + Number(item.amount || 0), 0)
    });
  }

  return {
    totalIncome,
    totalExpense,
    totalProfit: totalIncome - totalExpense,
    totalPaid,
    outstanding,
    businessBreakdown,
    weeklyPerformance: chartDays,
    businessPerformance: businessBreakdown.map((item) => ({
      name: item.business,
      value: item.revenue,
      color: businesses.find((business) => business.id === item.businessId)?.color || '#64748b'
    }))
  };
};

export const calculateBusinessMetrics = (transactions = [], payments = [], expenses = [], businessId) => {
  const businessTransactions = transactions.filter((item) => item.businessId === businessId);
  const businessExpenses = expenses.filter((item) => item.businessId === businessId);
  const today = new Date().toISOString().split('T')[0];
  const month = today.slice(0, 7);
  const todayTransactions = businessTransactions.filter((item) => item.date === today);
  const monthTransactions = businessTransactions.filter((item) => item.date?.startsWith(month));
  const todayIncome = todayTransactions.reduce((sum, item) => sum + Number(item.paid || 0), 0);
  const todayOutstanding = todayTransactions.reduce((sum, item) => sum + Number(item.due || 0), 0);
  const monthlyRevenue = monthTransactions.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalOutstanding = Math.max(0, businessTransactions.reduce((sum, item) => sum + Number(item.amount || 0), 0) -
    businessTransactions.reduce((sum, item) => sum + Number(item.paid || 0), 0) -
    payments.filter((item) => businessTransactions.some((transaction) => transaction.customerId === item.customerId))
      .reduce((sum, item) => sum + Number(item.amount || 0), 0));

  return {
    todayIncome,
    todayTransactions: todayTransactions.length,
    todayOutstanding,
    monthlyRevenue,
    totalOutstanding,
    totalExpenses: businessExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  };
};
