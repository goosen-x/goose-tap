'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTelegram } from '@/hooks/useTelegram';
import { useGame } from '@/components/GameProvider';
import { formatNumber } from '@/lib/storage';
import { Progress } from '@/components/ui/progress';

interface TapEffect {
  id: number;
  x: number;
  y: number;
  value: number;
}

export default function Home() {
  const { user, webApp } = useTelegram();
  const { coins, energy, maxEnergy, coinsPerTap, coinsPerHour, level, tap, isLoaded } = useGame();
  const [tapEffects, setTapEffects] = useState<TapEffect[]>([]);
  const [isPressed, setIsPressed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const tapIdRef = useRef(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleTap = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      if (energy <= 0) return;

      // Haptic feedback
      webApp?.HapticFeedback?.impactOccurred('light');

      // Perform tap action
      tap();

      const rect = e.currentTarget.getBoundingClientRect();
      let clientX: number, clientY: number;

      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const newEffect: TapEffect = {
        id: tapIdRef.current++,
        x,
        y,
        value: coinsPerTap,
      };

      setTapEffects((prev) => [...prev, newEffect]);

      setTimeout(() => {
        setTapEffects((prev) => prev.filter((effect) => effect.id !== newEffect.id));
      }, 800);
    },
    [energy, coinsPerTap, webApp, tap]
  );

  const energyPercentage = (energy / maxEnergy) * 100;

  // Show loading state while game state is being loaded
  // Use isMounted to avoid hydration mismatch
  if (!isMounted || !isLoaded) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gradient-to-b from-amber-50 to-orange-100 dark:from-zinc-900 dark:to-zinc-800">
        <div className="text-center">
          <div className="mb-4 text-6xl">🪿</div>
          <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-gradient-to-b from-amber-50 to-orange-100 dark:from-zinc-900 dark:to-zinc-800">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-xl">
            🪿
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              {user?.first_name || 'Player'}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Level {level}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1 rounded-full bg-amber-500/20 px-3 py-1.5">
            <span className="text-lg">🪙</span>
            <span className="font-bold text-amber-700 dark:text-amber-400">
              {formatNumber(coins)}
            </span>
          </div>
          {coinsPerHour > 0 && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              +{formatNumber(coinsPerHour)}/hr
            </p>
          )}
        </div>
      </header>

      {/* Main tap area */}
      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <div
          className={`relative flex h-64 w-64 cursor-pointer select-none items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-2xl transition-transform duration-75 active:scale-95 ${
            isPressed ? 'scale-95' : 'scale-100'
          }`}
          onMouseDown={() => setIsPressed(true)}
          onMouseUp={() => setIsPressed(false)}
          onMouseLeave={() => setIsPressed(false)}
          onTouchEnd={() => setIsPressed(false)}
          onClick={handleTap}
          onTouchStart={(e) => {
            setIsPressed(true);
            handleTap(e);
          }}
        >
          {/* Goose emoji */}
          <span
            className={`text-[8rem] transition-transform duration-75 ${
              isPressed ? 'scale-90' : 'scale-100'
            }`}
          >
            🪿
          </span>

          {/* Tap effects */}
          {tapEffects.map((effect) => (
            <div
              key={effect.id}
              className="pointer-events-none absolute animate-float-up text-2xl font-bold text-amber-600 dark:text-amber-400"
              style={{
                left: effect.x,
                top: effect.y,
              }}
            >
              +{effect.value}
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-zinc-600 dark:text-zinc-400">
          Tap the goose to earn coins!
        </p>
      </main>

      {/* Energy bar */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-1">
            <span>⚡</span>
            <span>
              {energy}/{maxEnergy}
            </span>
          </div>
          <span>+{coinsPerTap}/tap</span>
        </div>
        <Progress value={energyPercentage} className="mt-1 h-3" />
      </div>
    </div>
  );
}
