/**
 * Calculates the number of months elapsed from a start date to current date.
 * Financial rule: Month 1 starts on day 1 (startDate).
 * Each 1-month cycle entered adds 1 month.
 * Handles month-end differences (e.g. starting Jan 31 -> Feb 28/29).
 */
export const calculateElapsedMonths = (startDate, asOfDate = null) => {
  if (!startDate) return 1;
  const start = new Date(startDate);
  if (isNaN(start.getTime())) return 1;
  const refDate = asOfDate ? new Date(asOfDate) : new Date();
  const now = isNaN(refDate.getTime()) ? new Date() : refDate;

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
 * Sums all recorded return payments (amount + discount) from payment history.
 * ALWAYS recalculated from the payment history so new payments are never missed.
 */
export const getTotalReturnedAmount = (loan) => {
  const paymentHistory = (loan && loan.paymentHistory) || [];
  return paymentHistory.reduce(
    (sum, p) => sum + (Number(p.amount) || 0) + (Number(p.discount) || 0),
    0
  );
};

/**
 * Recalculates dynamic loan values using monthly compound interest.
 * Each month's interest is calculated on the previous month's balance.
 * Total Payable = Principal + Simple Interest
 * Remaining Due = max(0, Total Payable - Total Returned Payments)
 *
 * Example: Principal ₹1,00,000 @ 2%/mo for 3 months
 * - Total Payable = ₹1,00,000 × 1.02³
 * - Payment of ₹2,000 reduces Remaining Due to ₹1,04,000
 */
export const getLoanCalculatedDetails = (loan) => {
  if (!loan) return null;

  const principal = Number(loan.principal) || 0;
  const rate = Number(loan.interestRate) || 0;
  const startDateStr = loan.startDate || new Date().toISOString().split('T')[0];
  const autoElapsed = calculateElapsedMonths(startDateStr);

  const storedMonths = Number(loan.months) || 1;
  const isManual = Boolean(loan.isManualMonths);
  const months = isManual ? Math.max(1, storedMonths) : Math.max(storedMonths, autoElapsed);

  // Always recalculate from payment history (do NOT trust stored returnedAmount,
  // which goes stale after subsequent payments).
  const paymentHistory = (loan.paymentHistory || []).map((payment, index) => ({
    ...payment,
    id: payment.id || `${loan.id}-return-${index}`
  }));
  const normalizedLoan = { ...loan, paymentHistory };
  const returnedAmount = getTotalReturnedAmount(normalizedLoan);

  // Compound the balance month by month so every later month's interest
  // includes the interest accrued in prior months.
  const monthBreakdown = [];
  let runningBalance = principal;
  for (let m = 1; m <= months; m++) {
    const startBalance = runningBalance;
    const interestAccrued = Math.round((startBalance * rate) / 100);
    runningBalance = startBalance + interestAccrued;
    monthBreakdown.push({
      monthNum: m,
      startBalance,
      interestAccrued,
      paid: 0,
      endBalance: runningBalance
    });
  }
  const monthlyInterest = monthBreakdown[0]?.interestAccrued || 0;
  const totalAmount = runningBalance;
  const totalInterest = totalAmount - principal;
  const dueAmount = Math.max(0, totalAmount - returnedAmount);

  const isExtended = autoElapsed > 1;
  const isAutoUpdated = !isManual && autoElapsed > storedMonths;

  const fullyPaidByPayments = returnedAmount > 0 && dueAmount <= 0;
  const previouslySettled = loan.status === 'Settled';
  const isSettled = fullyPaidByPayments || previouslySettled;
  const status = isSettled ? 'Settled' : (loan.status && loan.status !== 'Settled' ? loan.status : 'Active');
  const effectiveDue = isSettled ? 0 : dueAmount;

  return {
    ...normalizedLoan,
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
    dueAmount: effectiveDue,
    status,
    monthBreakdown,
    isCompound: true
  };
};

/**
 * Calculates due date and days remaining to due date for current active/unsettled month.
 */
export const getLoanDueDateInfo = (loanCalculated) => {
  if (!loanCalculated) {
    return { dueDateStr: '-', daysLeft: 0, isSettled: false };
  }

  if (loanCalculated.dueAmount === 0 || loanCalculated.status === 'Settled') {
    return { dueDateStr: 'Settled', daysLeft: 0, isSettled: true };
  }

  const startDateStr = loanCalculated.startDate || new Date().toISOString().split('T')[0];
  const start = new Date(startDateStr);
  if (isNaN(start.getTime())) {
    return { dueDateStr: '-', daysLeft: 0, isSettled: false };
  }

  const totalMonths = loanCalculated.months || 1;
  let targetMonthNum = totalMonths;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDueDate = new Date(start);
  targetDueDate.setMonth(targetDueDate.getMonth() + targetMonthNum);
  const targetDueDateStr = targetDueDate.toISOString().split('T')[0];

  const due = new Date(targetDueDate);
  due.setHours(0, 0, 0, 0);

  const diffMs = due.getTime() - today.getTime();
  const daysLeft = Math.round(diffMs / (1000 * 60 * 60 * 24));

  return {
    dueDateStr: targetDueDateStr,
    daysLeft,
    targetMonthNum,
    isSettled: false
  };
};
