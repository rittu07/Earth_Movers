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
  const totalPaid = transactions.reduce((sum, t) => sum + (Number(t.paid) || 0), 0);
  const totalOutstanding = transactions.reduce((sum, t) => sum + (Number(t.due) || 0), 0);
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
