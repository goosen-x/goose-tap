'use client';

import { useEffect } from 'react';
import { useTelegram } from '@/hooks/useTelegram';

// Fallback values when Telegram API doesn't provide safe area insets
// iOS status bar with notch: ~47px
// Telegram header (close button): ~56px
// Total: ~103px, using 100px as safe value
const IOS_NOTCH_HEIGHT = 47;
const TELEGRAM_HEADER_HEIGHT = 56;
const TOTAL_HEADER_FALLBACK = IOS_NOTCH_HEIGHT + TELEGRAM_HEADER_HEIGHT;

export function SafeAreaProvider({ children }: { children: React.ReactNode }) {
  const {
    totalSafeArea,
    safeAreaInset,
    contentSafeAreaInset,
    isFullscreen,
    viewportHeight,
    webApp
  } = useTelegram();

  useEffect(() => {
    const root = document.documentElement;

    // Get viewportStableHeight for workaround calculation
    const viewportStableHeight = webApp?.viewportStableHeight ?? window.innerHeight;
    const screenHeight = window.innerHeight;

    // Calculate safe area top:
    // 1. If Telegram provides contentSafeAreaInset.top > 0, use it (Bot API 8.0+)
    // 2. If in fullscreen mode, use only system safe area (notch)
    // 3. If not in fullscreen and no contentSafeAreaInset, use fixed fallback
    let safeTop = 0;
    let safeBottom = 0;

    if (contentSafeAreaInset.top > 0) {
      // Telegram API provides content safe area (Bot API 8.0+)
      safeTop = safeAreaInset.top + contentSafeAreaInset.top;
      safeBottom = safeAreaInset.bottom + contentSafeAreaInset.bottom;
    } else if (isFullscreen) {
      // In fullscreen mode, only system safe area matters (notch)
      safeTop = safeAreaInset.top;
      safeBottom = safeAreaInset.bottom;
    } else {
      // Non-fullscreen mode without contentSafeAreaInset (Bot API < 8.0):
      // Only apply fallback on iOS where Telegram header overlaps content
      const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
      if (isIOS) {
        // iOS: Telegram renders its header ON TOP of our WebView
        // Need fallback: iOS notch (~47px) + Telegram header (~56px) = ~103px
        safeTop = TOTAL_HEADER_FALLBACK;
      } else {
        // Desktop/Android: no extra padding needed
        safeTop = 0;
      }
      safeBottom = safeAreaInset.bottom;
    }

    // Set CSS custom properties
    root.style.setProperty('--safe-area-top', `${safeTop}px`);
    root.style.setProperty('--safe-area-bottom', `${safeBottom}px`);
    root.style.setProperty('--safe-area-left', `${totalSafeArea.left}px`);
    root.style.setProperty('--safe-area-right', `${totalSafeArea.right}px`);

    // Debug info (remove in production)
    console.log('[SafeArea]', {
      isFullscreen,
      screenHeight,
      viewportStableHeight,
      safeAreaInset,
      contentSafeAreaInset,
      calculated: { top: safeTop, bottom: safeBottom }
    });

    // System safe area (notch, etc.)
    root.style.setProperty('--system-safe-area-top', `${safeAreaInset.top}px`);
    root.style.setProperty('--system-safe-area-bottom', `${safeAreaInset.bottom}px`);

    // Content safe area (Telegram UI elements)
    root.style.setProperty('--content-safe-area-top', `${contentSafeAreaInset.top}px`);
    root.style.setProperty('--content-safe-area-bottom', `${contentSafeAreaInset.bottom}px`);

  }, [totalSafeArea, safeAreaInset, contentSafeAreaInset, isFullscreen, viewportHeight, webApp]);

  return (
    <div
      className="flex h-screen flex-col"
      style={{
        paddingTop: 'var(--safe-area-top, 0px)',
        paddingBottom: 'var(--safe-area-bottom, 0px)',
        paddingLeft: 'var(--safe-area-left, 0px)',
        paddingRight: 'var(--safe-area-right, 0px)',
      }}
    >
      {children}
    </div>
  );
}
