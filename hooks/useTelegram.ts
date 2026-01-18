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

// Get start_param from URL (for web_app button opens)
function getUrlStartParam(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  // Support both ?startParam=ref_123 (from bot button) and ?ref=123 (dev testing)
  return params.get('startParam') || (params.get('ref') ? `ref_${params.get('ref')}` : null);
}

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
  const startParam = getUrlStartParam();
  if (startParam) {
    initData += `&start_param=${startParam}`;
  }

  return initData;
}

// Append start_param to initData if it came from URL (web_app button)
function appendUrlStartParam(initData: string): string {
  if (typeof window === 'undefined') return initData;

  // If initData already has start_param, don't override
  if (initData.includes('start_param=')) return initData;

  const startParam = getUrlStartParam();
  if (startParam) {
    return initData + `&start_param=${startParam}`;
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

// Check if CloudStorage is supported (requires version 6.9+)
function isCloudStorageSupported(webApp: ReturnType<typeof getWebApp>): boolean {
  if (!webApp) return false;
  const version = parseFloat(webApp.version || '0');
  return version >= 6.9 && !!webApp.CloudStorage;
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

      // Disable vertical swipes to prevent collapse and ensure full height (Bot API 7.7+)
      if (tg.disableVerticalSwipes) {
        tg.disableVerticalSwipes();
      }

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

  // Open Telegram link (channel, group, user, etc.)
  const openTelegramLink = useCallback((url: string) => {
    if (webApp?.openTelegramLink) {
      webApp.openTelegramLink(url);
    } else {
      // Fallback for development or unsupported versions
      window.open(url, '_blank');
    }
  }, [webApp]);

  // CloudStorage methods for backup saving
  const cloudStorageSet = useCallback((key: string, value: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (webApp && isCloudStorageSupported(webApp)) {
        webApp.CloudStorage?.setItem(key, value, (error, stored) => {
          if (error) {
            console.warn('[CloudStorage] setItem error:', error);
            resolve(false);
          } else {
            resolve(stored);
          }
        });
      } else {
        // Fallback to localStorage in dev
        try {
          localStorage.setItem(`cloud_${key}`, value);
          resolve(true);
        } catch {
          resolve(false);
        }
      }
    });
  }, [webApp]);

  const cloudStorageGet = useCallback((key: string): Promise<string | null> => {
    return new Promise((resolve) => {
      if (webApp && isCloudStorageSupported(webApp)) {
        webApp.CloudStorage?.getItem(key, (error, value) => {
          if (error) {
            console.warn('[CloudStorage] getItem error:', error);
            resolve(null);
          } else {
            resolve(value || null);
          }
        });
      } else {
        // Fallback to localStorage in dev
        try {
          resolve(localStorage.getItem(`cloud_${key}`));
        } catch {
          resolve(null);
        }
      }
    });
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
    initData: isDev ? getDevInitData() : appendUrlStartParam(webApp?.initData || ''),
    user: webApp?.initDataUnsafe?.user || (isDev ? DEV_USER : undefined),
    startParam: webApp?.initDataUnsafe?.start_param || getUrlStartParam() || undefined,
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
    // Navigation
    openTelegramLink,
    // CloudStorage for backup saving
    cloudStorageSet,
    cloudStorageGet,
    isCloudStorageSupported: isCloudStorageSupported(webApp),
  };
}
