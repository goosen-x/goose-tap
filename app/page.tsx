'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useTelegram } from '@/hooks/useTelegram';
import { useGame } from '@/components/GameProvider';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Zap } from 'lucide-react';

interface TapEffect {
  id: number;
  x: number;
  y: number;
  value: number;
}

export default function Home() {
  const { hapticFeedback } = useTelegram();
  const { energy, maxEnergy, coinsPerTap, tap, isLoaded } = useGame();
  const [tapEffects, setTapEffects] = useState<TapEffect[]>([]);
  const [isPressed, setIsPressed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const tapIdRef = useRef(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Capture pointer for reliable pointerup events
      e.currentTarget.setPointerCapture(e.pointerId);

      setIsPressed(true);

      // Calculate tilt based on tap position
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Calculate rotation angles (divided by 8 for subtle effect)
      const rotateX = (centerY - y) / 8;
      const rotateY = (x - centerX) / 8;
      setTilt({ x: rotateX, y: rotateY });

      if (energy <= 0) return;

      // Haptic feedback (safe - checks version support)
      hapticFeedback('light');

      // Perform tap action
      tap();

      // Coordinates for effect
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
    [energy, coinsPerTap, hapticFeedback, tap]
  );

  const handlePointerUp = useCallback(() => {
    setIsPressed(false);
    setTilt({ x: 0, y: 0 });
  }, []);

  const energyPercentage = (energy / maxEnergy) * 100;

  if (!isMounted || !isLoaded) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 relative h-16 w-16 mx-auto overflow-hidden rounded-full">
            <Image src="/logo.svg" alt="Goose" fill className="object-contain" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col justify-between bg-background min-h-full">
      {/* Main tap area - centered */}
      <main className="flex flex-1 flex-col items-center justify-center p-4" style={{ perspective: '1000px' }}>
        {/* 3D Transform container */}
        <div
          className="relative transition-transform duration-150 ease-out will-change-transform"
          style={{
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${isPressed ? 0.95 : 1})`,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Reeded edge (ребристый гурт) - behind the coin */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              inset: '-0.375rem',
              background: `repeating-conic-gradient(
                from 0deg,
                hsl(45 50% 50%) 0deg 2deg,
                hsl(45 50% 28%) 2deg 4deg
              )`,
              transform: 'translateZ(-0.375rem)',
            }}
          />

          {/* Main coin face */}
          <div
            className="relative flex h-56 w-56 cursor-pointer select-none items-center justify-center rounded-full overflow-hidden"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <Image
              src="/logo.svg"
              alt="Goose"
              fill
              className="object-contain"
              priority
            />

            {/* Metallic shine overlay */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.25) 0%, transparent 50%)',
              }}
            />

            {/* Tap effects */}
            {tapEffects.map((effect) => (
              <div
                key={effect.id}
                className="pointer-events-none absolute animate-float-up text-xl font-bold text-primary drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                style={{
                  left: effect.x,
                  top: effect.y,
                }}
              >
                +{effect.value}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Energy bar - at bottom in normal flow */}
      <div className="shrink-0 px-4 pb-4">
        <Card className="p-4">
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
    </div>
  );
}
