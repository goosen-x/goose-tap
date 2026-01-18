'use client';

import { useEffect } from 'react';
import { useTelegram } from '@/hooks/useTelegram';

export function SafeAreaProvider({ children }: { children: React.ReactNode }) {
  const { safeAreaInset, contentSafeAreaInset } = useTelegram();

  // Calculate total safe area from Telegram API (Bot API 8.0+)
  const safeTop = safeAreaInset.top + contentSafeAreaInset.top;
  const safeBottom = safeAreaInset.bottom + contentSafeAreaInset.bottom;
  const safeLeft = safeAreaInset.left + contentSafeAreaInset.left;
  const safeRight = safeAreaInset.right + contentSafeAreaInset.right;

  useEffect(() => {
    // Set CSS variables for use in other components
    const root = document.documentElement;
    root.style.setProperty('--safe-area-top', `${safeTop}px`);
    root.style.setProperty('--safe-area-bottom', `${safeBottom}px`);
    root.style.setProperty('--safe-area-left', `${safeLeft}px`);
    root.style.setProperty('--safe-area-right', `${safeRight}px`);
  }, [safeTop, safeBottom, safeLeft, safeRight]);

  return (
    <div
      className="flex h-screen flex-col"
      style={{
        paddingTop: safeTop,
        paddingBottom: safeBottom,
        paddingLeft: safeLeft,
        paddingRight: safeRight,
      }}
    >
      {children}
    </div>
  );
}
