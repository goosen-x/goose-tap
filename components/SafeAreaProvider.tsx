'use client';

import { useEffect } from 'react';
import { useTelegram } from '@/hooks/useTelegram';

// Telegram header height fallback when contentSafeAreaInset is not available
// This is approximately 56px on iOS (close button + padding)
const TELEGRAM_HEADER_FALLBACK = 56;

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
      // Non-fullscreen mode without contentSafeAreaInset:
      // Use fixed fallback for Telegram header (~56px on iOS)
      // Note: The workaround calc(100vh - viewportStableHeight) is for BOTTOM, not top
      safeTop = 0; // Telegram header is OUTSIDE our WebView, no padding needed
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
