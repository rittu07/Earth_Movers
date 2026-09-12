const configuredUrl = import.meta.env.VITE_API_URL || '';
const fallbackUrl = typeof window !== 'undefined' ? window.location.origin : '';

export const API_URL = (() => {
  const value = configuredUrl || fallbackUrl;
  if (!value) return '';
  try {
    const protocol = new URL(value).protocol;
    if (import.meta.env.PROD && protocol !== 'https:') return '';
    return value.replace(/\/$/, '');
  } catch {
    return '';
  }
})();
