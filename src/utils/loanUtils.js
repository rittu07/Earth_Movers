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
 * Each month's interest is calculated on the previous month's remaining balance
 * after subtracting any return payments credited during or prior to that month.
 *
 * Example: Principal ₹1,00,000 @ 2%/mo for 3 months
 * - Month 1: Interest = ₹2,000. Balance before payment = ₹1,02,000.
 *   Payment of ₹50,000 reduces ending balance to ₹52,000.
 * - Month 2: Interest is calculated on ₹52,000 (₹1,040 instead of ₹2,040).
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

  // Helper to determine payment cycle date ranges
  const getCycleEndDate = (startStr, monthNum) => {
    const start = new Date(startStr);
    if (isNaN(start.getTime())) return null;
    const cycleEnd = new Date(start);
    cycleEnd.setMonth(cycleEnd.getMonth() + monthNum);
    return cycleEnd;
  };

  // Track payments allocated to months so each payment is accounted for once
  const allocatedPaymentIds = new Set();
  const monthBreakdown = [];
  let runningBalance = principal;

  for (let m = 1; m <= months; m++) {
    const startBalance = runningBalance;
    const interestAccrued = startBalance > 0 ? Math.round((startBalance * rate) / 100) : 0;
    const balanceBeforePayment = startBalance + interestAccrued;
    const cycleEnd = getCycleEndDate(startDateStr, m);

    // Sum payments attributable to Month m
    let monthPaid = 0;
    paymentHistory.forEach((p) => {
      if (!p || allocatedPaymentIds.has(p.id)) return;
      const monthLabel = String(p.month || '').toLowerCase();
      const pmtAmt = (Number(p.amount) || 0) + (Number(p.discount) || 0);

      // Check if explicitly tagged for Month m
      const isExplicitMonthMatch = new RegExp(`\\bmonth\\s*0*${m}\\b`, 'i').test(monthLabel);

      // Check if payment date falls on or before this month's cycle end date
      let isDateMatch = false;
      if (p.date && cycleEnd) {
        const pDate = new Date(p.date);
        if (!isNaN(pDate.getTime()) && pDate <= cycleEnd) {
          isDateMatch = true;
        }
      }

      if (isExplicitMonthMatch || isDateMatch) {
        monthPaid += pmtAmt;
        allocatedPaymentIds.add(p.id);
      }
    });

    // On the final month, include any remaining unallocated payments in payment history
    if (m === months) {
      paymentHistory.forEach((p) => {
        if (p && !allocatedPaymentIds.has(p.id)) {
          const pmtAmt = (Number(p.amount) || 0) + (Number(p.discount) || 0);
          monthPaid += pmtAmt;
          allocatedPaymentIds.add(p.id);
        }
      });
    }

    runningBalance = Math.max(0, balanceBeforePayment - monthPaid);

    monthBreakdown.push({
      monthNum: m,
      startBalance,
      interestAccrued,
      paid: monthPaid,
      endBalance: runningBalance
    });
  }

  const monthlyInterest = monthBreakdown[0]?.interestAccrued || 0;
  const totalInterest = monthBreakdown.reduce((sum, mb) => sum + mb.interestAccrued, 0);
  const totalAmount = principal + totalInterest;
  const dueAmount = Math.max(0, runningBalance);

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
