export const APP_FONT_SETTINGS_KEY = 'earth-movers-app-font-settings';
export const DEFAULT_APP_FONT_SETTINGS = { desktop: 16, mobile: 16 };

export const loadAppFontSettings = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(APP_FONT_SETTINGS_KEY) || '{}');
    return {
      desktop: Number(saved.desktop) || DEFAULT_APP_FONT_SETTINGS.desktop,
      mobile: Number(saved.mobile) || DEFAULT_APP_FONT_SETTINGS.mobile
    };
  } catch {
    return { ...DEFAULT_APP_FONT_SETTINGS };
  }
};

export const saveAppFontSettings = (settings) => {
  localStorage.setItem(APP_FONT_SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent('app-font-settings-change', { detail: settings }));
};

export const applyAppFontSize = (settings) => {
  const isMobile = window.matchMedia('(max-width: 1023px)').matches;
  document.documentElement.style.fontSize = `${isMobile ? settings.mobile : settings.desktop}px`;
};
