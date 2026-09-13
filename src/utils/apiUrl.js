import { Capacitor } from '@capacitor/core';

const DEPLOYED_API_URL = 'https://earth-movers-api.loga.workers.dev';
const configuredUrl = import.meta.env.VITE_API_URL || '';
const fallbackUrl = typeof window !== 'undefined' ? window.location.origin : '';
const nativeFallbackUrl = Capacitor.isNativePlatform() ? DEPLOYED_API_URL : fallbackUrl;

export const API_URL = (() => {
  const value = configuredUrl || nativeFallbackUrl;
  if (!value) return '';
  try {
    const protocol = new URL(value).protocol;
    if (import.meta.env.PROD && protocol !== 'https:') return '';
    return value.replace(/\/$/, '');
  } catch {
    return '';
  }
})();
