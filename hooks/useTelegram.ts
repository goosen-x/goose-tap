'use client';

import { useEffect, useSyncExternalStore } from 'react';

function getWebApp() {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp ?? null;
}

function subscribe(callback: () => void) {
  // Telegram WebApp doesn't have a subscription mechanism,
  // but we can listen to viewport changes
  const tg = getWebApp();
  if (tg) {
    tg.onEvent('viewportChanged', callback);
    tg.onEvent('themeChanged', callback);
    return () => {
      tg.offEvent('viewportChanged', callback);
      tg.offEvent('themeChanged', callback);
    };
  }
  return () => {};
}

function getServerSnapshot() {
  return null;
}

export function useTelegram() {
  const webApp = useSyncExternalStore(subscribe, getWebApp, getServerSnapshot);

  useEffect(() => {
    const tg = getWebApp();
    if (tg) {
      tg.ready();
      tg.expand();
    }
  }, []);

  return {
    webApp,
    isReady: webApp !== null,
    initData: webApp?.initData ?? '',
    user: webApp?.initDataUnsafe?.user,
    colorScheme: webApp?.colorScheme,
    themeParams: webApp?.themeParams,
    viewportHeight: webApp?.viewportHeight,
    isExpanded: webApp?.isExpanded,
  };
}
