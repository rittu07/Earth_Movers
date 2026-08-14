/**
 * Formats a number into Indian Rupee currency format (e.g., ₹1,24,500)
 * @param {number|string} amount 
 * @param {boolean} showSymbol 
 * @returns {string}
 */
export const formatCurrency = (amount, showSymbol = true) => {
  const num = Number(amount) || 0;
  
  // Format to Indian numbering system
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  }).format(num);

  return showSymbol ? `₹${formatted}` : formatted;
};

/**
 * Formats a date string to Indian date format (e.g., 11 Aug 2026)
 * @param {string|Date} dateInput 
 * @returns {string}
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return dateInput;
  
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

/**
 * Formats time (e.g., 10:30 AM)
 * @param {string} timeInput 
 * @returns {string}
 */
export const formatTime = (timeInput) => {
  if (!timeInput) return '';
  return timeInput;
};
