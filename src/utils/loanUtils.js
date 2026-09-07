/**
 * Calculates the number of months elapsed from a start date to current date.
 * Financial rule: Month 1 starts on day 1 (startDate).
 * Each 1-month cycle entered adds 1 month.
 * Handles month-end differences (e.g. starting Jan 31 -> Feb 28/29).
 */
export const calculateElapsedMonths = (startDate) => {
  if (!startDate) return 1;
  const start = new Date(startDate);
  if (isNaN(start.getTime())) return 1;
  const now = new Date();

  const startYear = start.getFullYear();
  const startMonth = start.getMonth();
  const startDateNum = start.getDate();

  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth();
  const nowDateNum = now.getDate();

  let yearDiff = nowYear - startYear;
  let monthDiff = nowMonth - startMonth;
  let months = yearDiff * 12 + monthDiff;

  // Handle months with fewer days than startDateNum (e.g. Jan 31 -> Feb 28)
  const lastDayOfNowMonth = new Date(nowYear, nowMonth + 1, 0).getDate();
  const effectiveStartDay = Math.min(startDateNum, lastDayOfNowMonth);

  if (nowDateNum >= effectiveStartDay) {
    months += 1;
  } else {
    if (months < 1) months = 1;
  }
  return Math.max(1, months);
};

/**
 * Recalculates dynamic loan values based on variable months, principal, interest rate,
 * start date, and returned payments. Automatically detects if month is extended.
 */
export const getLoanCalculatedDetails = (loan) => {
  if (!loan) return null;

  const principal = Number(loan.principal) || 0;
  const rate = Number(loan.interestRate) || 0;
  const monthlyInterest = (principal * rate) / 100;
  
  const autoElapsed = calculateElapsedMonths(loan.startDate);
  
  // If loan.isManualMonths is true, use stored loan.months.
  // Otherwise, auto-detect and update months to Math.max(storedMonths, autoElapsed).
  const storedMonths = Number(loan.months) || 1;
  const isManual = Boolean(loan.isManualMonths);
  const months = isManual ? Math.max(1, storedMonths) : Math.max(storedMonths, autoElapsed);

  const isExtended = autoElapsed > 1;
  const isAutoUpdated = !isManual && autoElapsed > storedMonths;

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
    isExtended,
    isAutoUpdated,
    isManualMonths: isManual,
    totalInterest,
    totalAmount,
    returnedAmount,
    dueAmount,
    status
  };
};

