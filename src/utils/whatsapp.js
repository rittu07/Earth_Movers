/**
 * Utility functions for formatting and directly sending WhatsApp notifications for Loganathan Earth Movers
 */

export const COMPANY_NAME = 'Loganathan Earth Movers';

/**
 * Format WhatsApp message for a New Transaction
 */
/**
 * Format WhatsApp message for a New Transaction with complete breakdown
 */
export const formatTransactionWhatsApp = ({
  customerName = 'Customer',
  serviceName = 'JCB Rental',
  businessName = '',
  quantity = 1,
  unit = 'Units',
  rate = 0,
  amount = 0,
  paid = 0,
  due = 0,
  date = '',
  jcbVehicle = '',
  driverName = '',
  driverPhone = '',
  driverAmount = 0,
  startTime = '',
  endTime = '',
  deliveryPlace = ''
}) => {
  const serviceTitle = serviceName.includes('JCB') ? '🚜 JCB Rental' : `📦 ${serviceName}`;
  const rateText = rate ? ` (Rate: ₹${Number(rate).toLocaleString('en-IN')}/${unit})` : '';
  const dateText = date ? `\n📅 Date: ${date}` : '';
  const timeText = (startTime && endTime) ? `\n⏱ Running Hours: ${startTime} to ${endTime} (${quantity} hrs)` : '';
  const jcbText = jcbVehicle ? `\n🚜 JCB Machine: ${jcbVehicle}` : '';
  const driverText = driverName ? `\n👤 Driver: ${driverName}${driverPhone ? ` (${driverPhone})` : ''}${Number(driverAmount) > 0 ? ` [Bata: ₹${driverAmount}]` : ''}` : '';
  const siteText = deliveryPlace ? `\n📍 Site: ${deliveryPlace}` : '';

  return `Hello ${customerName} 👋\n\nYour transaction with ${COMPANY_NAME} has been recorded.\n${dateText}\n\n${serviceTitle}: ${quantity} ${unit}${rateText}${timeText}${jcbText}${driverText}${siteText}\n\n💰 Total Bill: ₹${Number(amount).toLocaleString('en-IN')}\n✅ Paid Amount: ₹${Number(paid).toLocaleString('en-IN')}\n⏳ Remaining Due: ₹${Number(due).toLocaleString('en-IN')}\n\nThank you for doing business with ${COMPANY_NAME}! 🙏`;
};

/**
 * Format WhatsApp message for JCB Oil Maintenance Overdue Alert
 */
export const formatJCBOverdueWhatsApp = ({
  code = 'JCB-01',
  regNo = 'TN-23-AX-1234',
  totalHours = 1420,
  overdueServices = []
}) => {
  const serviceList = overdueServices.length > 0
    ? overdueServices.map((s) => `• ${s.name}: ${s.hoursRun}/${s.limit} hrs (${s.overdueHrs > 0 ? `OVERDUE by ${s.overdueHrs} hrs!` : 'Due Soon'})`).join('\n')
    : '• Service Recommended';

  return `🚨 *JCB OIL SERVICE OVERDUE ALERT* 🚨\n\n🚜 *Equipment:* ${code} (${regNo})\n⏱ *Current Meter Hours:* ${totalHours} hrs\n\n⚠️ *Pending / Overdue Maintenance:*\n${serviceList}\n\n⚠️ Please schedule oil change & lubrication servicing immediately for ${COMPANY_NAME} fleet safety.`;
};

/**
 * Format WhatsApp message for Payment Received
 */
export const formatPaymentWhatsApp = ({
  customerName = 'Customer',
  amount = 3000,
  reference = 'PAY-201',
  remainingOutstanding = 0
}) => {
  return `Hello ${customerName} 👋\n\nPayment of ₹${Number(amount).toLocaleString('en-IN')} received with thanks!\n\n💳 Reference: ${reference}\n⏳ Remaining Balance: ₹${Number(remainingOutstanding).toLocaleString('en-IN')}\n\nThank you for choosing ${COMPANY_NAME}.`;
};

/**
 * Format WhatsApp message for New Customer Registration
 */
export const formatWelcomeWhatsApp = ({
  customerName = 'Customer',
  phone = ''
}) => {
  return `Welcome ${customerName} to ${COMPANY_NAME}! 👋\n\nYour customer account has been successfully created.\n📱 Registered Mobile: ${phone}\n\nWe look forward to serving your excavation and earth moving requirements!`;
};

/**
 * Format WhatsApp message for New Finance Loan Given
 */
export const formatFinanceLoanWhatsApp = ({
  borrowerName = 'Borrower',
  principal = 0,
  interestRate = 0,
  monthlyInterest = 0,
  months = 1,
  startDate = '',
  paymentMethod = 'Cash',
  reference = '',
  totalAmount = 0
}) => {
  const methodText = paymentMethod ? `\n💳 Payment Method: ${paymentMethod}` : '';
  const refText = reference ? ` (Ref: ${reference})` : '';

  return `Hello ${borrowerName} 👋\n\nFinance Loan Record created with ${COMPANY_NAME}.\n📅 Start Date: ${startDate}\n\n💰 Principal Amount: ₹${Number(principal).toLocaleString('en-IN')}\n⚡ Interest Rate: ${interestRate}% / month (₹${Number(monthlyInterest).toLocaleString('en-IN')}/mo)\n⏱ Tenure: Month ${months}${methodText}${refText}\n\n📊 Total Amount Due (Month ${months}): ₹${Number(totalAmount).toLocaleString('en-IN')}\n\nThank you for choosing ${COMPANY_NAME}! 🙏`;
};

/**
 * Format WhatsApp message for Finance Loan Return Payment Received
 */
export const formatFinanceReturnPaymentWhatsApp = ({
  borrowerName = 'Borrower',
  amount = 0,
  discount = 0,
  repaymentFor = 'Month 1 Interest',
  paymentMethod = 'Cash',
  reference = '',
  remainingDue = 0
}) => {
  const methodText = paymentMethod ? ` (${paymentMethod}${reference ? ` - Ref: ${reference}` : ''})` : '';
  const discountText = discount > 0 ? `\n🏷 Discount Waived: ₹${Number(discount).toLocaleString('en-IN')}` : '';

  return `Hello ${borrowerName} 👋\n\nLoan Return Payment Received with thanks!\n\n💵 Return Amount Paid: ₹${Number(amount).toLocaleString('en-IN')}${methodText}${discountText}\n📌 Repayment For: ${repaymentFor}\n⏳ Remaining Balance Due: ₹${Number(remainingDue).toLocaleString('en-IN')}\n\nThank you for doing business with ${COMPANY_NAME}! 🙏`;
};

/**
 * Clean phone number and generate WhatsApp API URL directly using api.whatsapp.com/send
 * to prevent double HTTP redirect mangling of unicode emojis (👋 🚜 💰 ✅ ⏳)
 */
export const generateWhatsAppLink = (phone, text) => {
  if (!phone) return '#';
  // Strip non-digit characters
  let cleaned = phone.toString().replace(/\D/g, '');
  
  // If 10 digits (Indian standard), prepend 91
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  }

  // Explicitly encode URL text parameter
  const encodedText = encodeURIComponent(text);
  
  // Directly targeting api.whatsapp.com/send prevents unicode mangling
  return `https://api.whatsapp.com/send?phone=${cleaned}&text=${encodedText}`;
};

/**
 * Directly trigger WhatsApp in a new window/tab immediately upon Save
 */
export const openWhatsAppChat = (phone, text) => {
  const url = generateWhatsAppLink(phone, text);
  if (url !== '#') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};
