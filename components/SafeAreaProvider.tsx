'use client';

import { useEffect } from 'react';
import { useTelegram } from '@/hooks/useTelegram';

export function SafeAreaProvider({ children }: { children: React.ReactNode }) {
  const { totalSafeArea, safeAreaInset, contentSafeAreaInset, isFullscreen } = useTelegram();

  useEffect(() => {
    // Set CSS custom properties for safe area insets
    const root = document.documentElement;

    // Use Telegram API values if available (Bot API 8.0+), otherwise use 0
    // CSS env() fallback is applied in the style prop below
    const hasTelegramSafeArea = safeAreaInset.top > 0 || contentSafeAreaInset.top > 0;

    if (hasTelegramSafeArea) {
      // Telegram provides safe area values
      root.style.setProperty('--safe-area-top', `${totalSafeArea.top}px`);
      root.style.setProperty('--safe-area-bottom', `${totalSafeArea.bottom}px`);
      root.style.setProperty('--safe-area-left', `${totalSafeArea.left}px`);
      root.style.setProperty('--safe-area-right', `${totalSafeArea.right}px`);
    } else {
      // Fallback: use CSS env() for native safe area (notch, etc.)
      // These will be resolved by the browser
      root.style.setProperty('--safe-area-top', 'env(safe-area-inset-top, 0px)');
      root.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom, 0px)');
      root.style.setProperty('--safe-area-left', 'env(safe-area-inset-left, 0px)');
      root.style.setProperty('--safe-area-right', 'env(safe-area-inset-right, 0px)');
    }

    // System safe area (notch, etc.)
    root.style.setProperty('--system-safe-area-top', `${safeAreaInset.top}px`);
    root.style.setProperty('--system-safe-area-bottom', `${safeAreaInset.bottom}px`);

    // Content safe area (Telegram UI elements)
    root.style.setProperty('--content-safe-area-top', `${contentSafeAreaInset.top}px`);
    root.style.setProperty('--content-safe-area-bottom', `${contentSafeAreaInset.bottom}px`);

  }, [totalSafeArea, safeAreaInset, contentSafeAreaInset]);

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
