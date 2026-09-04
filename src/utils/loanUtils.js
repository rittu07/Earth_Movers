/**
 * Calculates the number of months elapsed from a start date to current date.
 * Financial rule: Month 1 starts on day 1 (startDate).
 * Each 1-month cycle entered adds 1 month.
 */
export const calculateElapsedMonths = (startDate) => {
  if (!startDate) return 1;
  const start = new Date(startDate);
  if (isNaN(start.getTime())) return 1;
  const now = new Date();

  let yearDiff = now.getFullYear() - start.getFullYear();
  let monthDiff = now.getMonth() - start.getMonth();
  let months = yearDiff * 12 + monthDiff;

  if (now.getDate() >= start.getDate()) {
    months += 1;
  } else {
    if (months < 1) months = 1;
  }
  return Math.max(1, months);
};

/**
 * Recalculates dynamic loan values based on variable months, principal, interest rate,
 * start date, and returned payments.
 */
export const getLoanCalculatedDetails = (loan) => {
  if (!loan) return null;

  const principal = Number(loan.principal) || 0;
  const rate = Number(loan.interestRate) || 0;
  const monthlyInterest = (principal * rate) / 100;
  
  const autoElapsed = calculateElapsedMonths(loan.startDate);
  
  // Use explicitly assigned months if present, otherwise auto elapsed
  const months = (loan.months !== undefined && loan.months !== null && Number(loan.months) > 0)
    ? Number(loan.months)
    : autoElapsed;

  const totalInterest = monthlyInterest * months;
  const totalAmount = principal + totalInterest;
  const returnedAmount = Number(loan.returnedAmount) || 0;
  const dueAmount = Math.max(0, totalAmount - returnedAmount);
  const status = (dueAmount === 0 && (returnedAmount > 0 || loan.status === 'Settled'))
    ? 'Settled'
    : (loan.status || 'Active');

  return {
    ...loan,
    principal,
    interestRate: rate,
    monthlyInterest,
    months,
    autoElapsed,
    totalInterest,
    totalAmount,
    returnedAmount,
    dueAmount,
    status
  };
};
