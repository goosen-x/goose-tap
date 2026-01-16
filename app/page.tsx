'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTelegram } from '@/hooks/useTelegram';

interface TapEffect {
  id: number;
  x: number;
  y: number;
  value: number;
}

export default function Home() {
  const { user, webApp } = useTelegram();
  const [coins, setCoins] = useState(0);
  const [energy, setEnergy] = useState(1000);
  const [maxEnergy] = useState(1000);
  const [coinsPerTap] = useState(1);
  const [level, setLevel] = useState(1);
  const [tapEffects, setTapEffects] = useState<TapEffect[]>([]);
  const [isPressed, setIsPressed] = useState(false);
  const tapIdRef = useRef(0);

  // Restore energy over time
  useEffect(() => {
    const interval = setInterval(() => {
      setEnergy((prev) => Math.min(prev + 1, maxEnergy));
    }, 1000);
    return () => clearInterval(interval);
  }, [maxEnergy]);

  // Level up logic
  useEffect(() => {
    const newLevel = Math.floor(coins / 10000) + 1;
    if (newLevel > level) {
      setLevel(newLevel);
    }
  }, [coins, level]);

  const handleTap = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      if (energy <= 0) return;

      // Haptic feedback
      webApp?.HapticFeedback?.impactOccurred('light');

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

      setCoins((prev) => prev + coinsPerTap);
      setEnergy((prev) => Math.max(prev - 1, 0));

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
    [energy, coinsPerTap, webApp]
  );

  const formatNumber = (num: number): string => {
    if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(1) + 'M';
    }
    if (num >= 1_000) {
      return (num / 1_000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  const energyPercentage = (energy / maxEnergy) * 100;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-amber-50 to-orange-100 dark:from-zinc-900 dark:to-zinc-800">
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
        <div className="flex items-center gap-1 rounded-full bg-amber-500/20 px-3 py-1.5">
          <span className="text-lg">🪙</span>
          <span className="font-bold text-amber-700 dark:text-amber-400">
            {formatNumber(coins)}
          </span>
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
        <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-300"
            style={{ width: `${energyPercentage}%` }}
          />
        </div>
      </div>

      {/* Bottom navigation */}
      <nav className="flex items-center justify-around border-t border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-900/80">
        <NavItem icon="🏠" label="Home" active />
        <NavItem icon="📋" label="Tasks" />
        <NavItem icon="👥" label="Friends" />
        <NavItem icon="💰" label="Earn" />
      </nav>
    </div>
  );
}

function NavItem({
  icon,
  label,
  active = false,
}: {
  icon: string;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className={`flex cursor-pointer flex-col items-center gap-0.5 ${
        active ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-500 dark:text-zinc-400'
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-xs">{label}</span>
    </button>
  );
}
