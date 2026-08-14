/**
 * Utility functions for formatting and directly sending WhatsApp notifications for Loganathan Earth Movers
 */

export const COMPANY_NAME = 'Loganathan Earth Movers';

/**
 * Format WhatsApp message for a New Transaction
 */
export const formatTransactionWhatsApp = ({
  customerName = 'Customer',
  serviceName = 'JCB Rental',
  quantity = 5,
  unit = 'Hours',
  amount = 7500,
  paid = 5000,
  due = 2500
}) => {
  const serviceTitle = serviceName.includes('JCB') ? '🚜 JCB Rental' : `📦 ${serviceName}`;

  return `Hello ${customerName} 👋\n\nYour ${serviceName} transaction has been recorded.\n\n${serviceTitle}: ${quantity} ${unit}\n💰 Total: ₹${Number(amount).toLocaleString('en-IN')}\n✅ Paid: ₹${Number(paid).toLocaleString('en-IN')}\n⏳ Remaining: ₹${Number(due).toLocaleString('en-IN')}\n\nThank you for choosing ${COMPANY_NAME}.`;
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
