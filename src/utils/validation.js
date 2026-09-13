export const digitsOnly = (value) => String(value ?? '').replace(/\D/g, '');

export const decimalOnly = (value) => {
  const cleaned = String(value ?? '').replace(/[^0-9.]/g, '');
  const [whole, ...fraction] = cleaned.split('.');
  return fraction.length ? `${whole}.${fraction.join('')}` : whole;
};

export const isValidMobile = (value) => /^\d{10}$/.test(String(value ?? '').trim());

export const mobileError = (value, required = false) => {
  const phone = String(value ?? '').trim();
  if (!phone && !required) return '';
  if (!phone) return 'Mobile number is required';
  return isValidMobile(phone) ? '' : 'Enter a valid 10-digit mobile number';
};
