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
 * Recalculates dynamic loan values using Compound Interest formula per month.
 * If a customer misses a monthly interest payment, the unpaid interest compounds into the next month's starting principal balance.
 * Example: Principal ₹1,00,000 @ 2%/mo
 * - Month 1: Interest = ₹2,000. Balance at end of Month 1 = ₹1,02,000.
 * - If Month 1 is unpaid: Month 2 Interest = ₹1,02,000 * 2% = ₹2,040.
 * - Accrued Total Interest = ₹4,040. Total Payable = ₹1,04,040.
 */
export const getLoanCalculatedDetails = (loan) => {
  if (!loan) return null;

  const principal = Number(loan.principal) || 0;
  const rate = Number(loan.interestRate) || 0;
  const startDateStr = loan.startDate || new Date().toISOString().split('T')[0];
  const startObj = new Date(startDateStr);
  const autoElapsed = calculateElapsedMonths(startDateStr);
  
  const storedMonths = Number(loan.months) || 1;
  const isManual = Boolean(loan.isManualMonths);
  const months = isManual ? Math.max(1, storedMonths) : Math.max(storedMonths, autoElapsed);

  const isExtended = autoElapsed > 1;
  const isAutoUpdated = !isManual && autoElapsed > storedMonths;

  const paymentHistory = loan.paymentHistory || [];
  const returnedAmount = Number(loan.returnedAmount) || paymentHistory.reduce((sum, p) => sum + (Number(p.amount) || 0) + (Number(p.discount) || 0), 0);

  // Month-by-Month Compounding Calculation
  let runningBalance = principal;
  let totalInterest = 0;

  // Track payments chronologically
  const sortedPayments = [...paymentHistory].map((p, idx) => ({
    amount: (Number(p.amount) || 0) + (Number(p.discount) || 0),
    cashAmount: Number(p.amount) || 0,
    discountAmount: Number(p.discount) || 0,
    date: p.date || startDateStr,
    month: p.month || '',
    id: idx
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let unappliedPayments = sortedPayments.map(p => ({ ...p }));
  const monthBreakdown = [];

  for (let m = 1; m <= months; m++) {
    const cycleEndDate = new Date(startObj);
    if (!isNaN(startObj.getTime())) {
      cycleEndDate.setMonth(cycleEndDate.getMonth() + m);
    }
    const cycleEndDateStr = !isNaN(cycleEndDate.getTime()) ? cycleEndDate.toISOString().split('T')[0] : startDateStr;

    // Start-of-month balance is runningBalance
    const startBal = runningBalance;

    // Interest accrued for month m on start-of-month balance (0 if settled)
    const monthInt = startBal > 0 ? Math.round((startBal * rate) / 100) : 0;
    totalInterest += monthInt;

    const grossBal = startBal + monthInt;

    // Find payments made on or before cycleEndDateStr that haven't been applied yet,
    // or payments explicitly tagged for Month m
    let monthPaid = 0;
    for (let p of unappliedPayments) {
      const isExplicitMonthMatch = p.month && new RegExp(`\\bMonth\\s*${m}\\b`, 'i').test(p.month);
      const isDateMatch = p.date <= cycleEndDateStr;

      if (p.amount > 0 && (isExplicitMonthMatch || isDateMatch)) {
        const payToApply = Math.min(p.amount, Math.max(0, grossBal - monthPaid));
        monthPaid += payToApply;
        p.amount -= payToApply;
      }
    }

    // End-of-month balance (compounds into start-of-month balance for month m+1)
    runningBalance = Math.max(0, grossBal - monthPaid);

    monthBreakdown.push({
      monthNum: m,
      startBalance: startBal,
      interestAccrued: monthInt,
      paid: monthPaid,
      endBalance: runningBalance
    });
  }

  const totalAmount = principal + totalInterest;
  const dueAmount = Math.max(0, totalAmount - returnedAmount);
  const currentMonthlyInterest = monthBreakdown.length > 0
    ? monthBreakdown[monthBreakdown.length - 1].interestAccrued
    : Math.round((principal * rate) / 100);

  const status = (dueAmount === 0 && (returnedAmount > 0 || loan.status === 'Settled'))
    ? 'Settled'
    : (loan.status || 'Active');

  return {
    ...loan,
    principal,
    interestRate: rate,
    monthlyInterest: currentMonthlyInterest,
    months,
    autoElapsed,
    isExtended,
    isAutoUpdated,
    isManualMonths: isManual,
    totalInterest,
    totalAmount,
    returnedAmount,
    dueAmount,
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
  const monthBreakdown = loanCalculated.monthBreakdown || [];
  let targetMonthNum = 1;
  for (let m = 1; m <= totalMonths; m++) {
    const mb = monthBreakdown[m - 1];
    if (!mb || mb.endBalance > 0) {
      targetMonthNum = m;
      break;
    }
    targetMonthNum = m;
  }

  const targetDueDate = new Date(start);
  targetDueDate.setMonth(targetDueDate.getMonth() + targetMonthNum);
  const targetDueDateStr = targetDueDate.toISOString().split('T')[0];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

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


