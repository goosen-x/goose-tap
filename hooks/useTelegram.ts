'use client';

import { useEffect, useSyncExternalStore, useCallback } from 'react';

// Global flag to prevent multiple initializations
let isInitialized = false;

// Mock user for development mode
const DEV_USER: TelegramWebAppUser = {
  id: 123456789,
  first_name: 'Dev',
  last_name: 'User',
  username: 'devuser',
  photo_url: undefined,
};

// Create mock initData for development (only on client)
function getDevInitData(): string {
  // Use static timestamp during SSR to avoid prerender warnings
  if (typeof window === 'undefined') {
    const user = encodeURIComponent(JSON.stringify(DEV_USER));
    return `user=${user}&auth_date=0`;
  }

  const user = encodeURIComponent(JSON.stringify(DEV_USER));
  let initData = `user=${user}&auth_date=${Math.floor(Date.now() / 1000)}`;

  // Support referral testing via URL: localhost:3000?ref=204887498
  const params = new URLSearchParams(window.location.search);
  const refId = params.get('ref');
  if (refId) {
    initData += `&start_param=ref_${refId}`;
  }

  return initData;
}

function getWebApp() {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp ?? null;
}

function subscribe(callback: () => void) {
  // Telegram WebApp doesn't have a subscription mechanism,
  // but we can listen to viewport and safe area changes
  const tg = getWebApp();
  if (tg) {
    tg.onEvent('viewportChanged', callback);
    tg.onEvent('themeChanged', callback);
    tg.onEvent('safeAreaChanged', callback);
    tg.onEvent('contentSafeAreaChanged', callback);
    tg.onEvent('fullscreenChanged', callback);
    return () => {
      tg.offEvent('viewportChanged', callback);
      tg.offEvent('themeChanged', callback);
      tg.offEvent('safeAreaChanged', callback);
      tg.offEvent('contentSafeAreaChanged', callback);
      tg.offEvent('fullscreenChanged', callback);
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

  // In development without valid Telegram data, use mock data
  const isDev = process.env.NODE_ENV === 'development' && (!webApp || !webApp.initData);

  // Default safe area (zero insets)
  const defaultSafeArea = { top: 0, bottom: 0, left: 0, right: 0 };

  // Combine system safe area + content safe area for total padding
  const safeAreaInset = webApp?.safeAreaInset ?? defaultSafeArea;
  const contentSafeAreaInset = webApp?.contentSafeAreaInset ?? defaultSafeArea;

  // Total insets = system + content (for fullscreen mode)
  const totalSafeArea = {
    top: safeAreaInset.top + contentSafeAreaInset.top,
    bottom: safeAreaInset.bottom + contentSafeAreaInset.bottom,
    left: safeAreaInset.left + contentSafeAreaInset.left,
    right: safeAreaInset.right + contentSafeAreaInset.right,
  };

  return {
    webApp,
    isReady: webApp !== null || isDev,
    initData: webApp?.initData || (isDev ? getDevInitData() : ''),
    user: webApp?.initDataUnsafe?.user || (isDev ? DEV_USER : undefined),
    startParam: webApp?.initDataUnsafe?.start_param,
    colorScheme: webApp?.colorScheme,
    themeParams: webApp?.themeParams,
    viewportHeight: webApp?.viewportHeight,
    isExpanded: webApp?.isExpanded,
    isFullscreen: webApp?.isFullscreen ?? false,
    // Safe area insets
    safeAreaInset,
    contentSafeAreaInset,
    totalSafeArea,
    // Safe haptic methods
    hapticFeedback,
    hapticNotification,
    isHapticSupported: isHapticSupported(webApp),
  };
}
