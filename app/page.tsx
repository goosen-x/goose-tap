'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTelegram } from '@/hooks/useTelegram';
import { useGame } from '@/components/GameProvider';
import { formatNumber } from '@/lib/storage';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, Zap, User } from 'lucide-react';

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

  const lastTapTime = useRef(0);

  const handleTap = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      // Prevent double-tap from touch + click events
      const now = Date.now();
      if (now - lastTapTime.current < 100) return;
      lastTapTime.current = now;

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

  if (!isMounted || !isLoaded) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-secondary">
            <Coins className="h-8 w-8" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium">
              {user?.first_name || 'Player'}
            </p>
            <p className="text-sm text-muted-foreground">Level {level}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant="secondary" className="text-base px-3 py-1">
            <Coins className="h-4 w-4 mr-1" />
            {formatNumber(coins)}
          </Badge>
          {coinsPerHour > 0 && (
            <p className="text-xs text-muted-foreground">
              +{formatNumber(coinsPerHour)}/hr
            </p>
          )}
        </div>
      </header>

      {/* Main tap area */}
      <main className="flex flex-1 flex-col items-center justify-center p-4">
        <div
          className={`relative flex h-56 w-56 cursor-pointer select-none items-center justify-center rounded-full border-4 border-border bg-secondary shadow-lg transition-transform duration-75 ${
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
          <Coins
            className={`h-24 w-24 transition-transform duration-75 ${
              isPressed ? 'scale-90' : 'scale-100'
            }`}
          />

          {/* Tap effects */}
          {tapEffects.map((effect) => (
            <div
              key={effect.id}
              className="pointer-events-none absolute animate-float-up text-xl font-bold text-foreground"
              style={{
                left: effect.x,
                top: effect.y,
              }}
            >
              +{effect.value}
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-muted-foreground">
          Tap to earn coins!
        </p>
      </main>

      {/* Energy bar */}
      <Card className="mx-4 mb-4 p-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <div className="flex items-center gap-1">
            <Zap className="h-4 w-4" />
            <span>{energy}/{maxEnergy}</span>
          </div>
          <span>+{coinsPerTap}/tap</span>
        </div>
        <Progress value={energyPercentage} className="h-2" />
      </Card>
    </div>
  );
}
