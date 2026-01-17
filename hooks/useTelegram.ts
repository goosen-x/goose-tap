'use client';

import { useEffect, useSyncExternalStore, useCallback } from 'react';

// Global flag to prevent multiple initializations
let isInitialized = false;

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

// Check if HapticFeedback is supported (requires version 6.1+)
function isHapticSupported(webApp: ReturnType<typeof getWebApp>): boolean {
  if (!webApp) return false;
  const version = parseFloat(webApp.version || '0');
  return version >= 6.1;
}

export function useTelegram() {
  const webApp = useSyncExternalStore(subscribe, getWebApp, getServerSnapshot);

  useEffect(() => {
    // Only initialize once globally
    if (isInitialized) return;

    const tg = getWebApp();
    if (tg) {
      tg.ready();
      tg.expand();
      isInitialized = true;
    }
  }, []);

  // Safe haptic feedback that checks support first
  const hapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light') => {
    if (webApp && isHapticSupported(webApp)) {
      webApp.HapticFeedback?.impactOccurred(type);
    }
  }, [webApp]);

  const hapticNotification = useCallback((type: 'error' | 'success' | 'warning' = 'success') => {
    if (webApp && isHapticSupported(webApp)) {
      webApp.HapticFeedback?.notificationOccurred(type);
    }
  }, [webApp]);

  return {
    webApp,
    isReady: webApp !== null,
    initData: webApp?.initData ?? '',
    user: webApp?.initDataUnsafe?.user,
    startParam: webApp?.initDataUnsafe?.start_param,
    colorScheme: webApp?.colorScheme,
    themeParams: webApp?.themeParams,
    viewportHeight: webApp?.viewportHeight,
    isExpanded: webApp?.isExpanded,
    // Safe haptic methods
    hapticFeedback,
    hapticNotification,
    isHapticSupported: isHapticSupported(webApp),
  };
}
