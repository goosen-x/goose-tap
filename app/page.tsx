'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTelegram } from '@/hooks/useTelegram';
import { useGame } from '@/components/GameProvider';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { SlidingNumber } from '@/components/ui/sliding-number';
import { Zap } from 'lucide-react';

function GooseLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 250 250"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M125 0C194.036 0 250 55.9644 250 125C250 194.036 194.036 250 125 250C55.9644 250 0 194.036 0 125C0 55.9644 55.9644 0 125 0ZM157.01 104.497C155.131 95.6004 145.401 90.8275 137.216 94.7871L44.9951 139.397C31.6071 145.874 36.2193 166 51.0918 166H152.734C161.63 166 168.27 157.811 166.432 149.106L157.01 104.497ZM196 84C189.925 84 185 88.9249 185 95C185 101.075 189.925 106 196 106C202.075 106 207 101.075 207 95C207 88.9249 202.075 84 196 84Z"
        fill="currentColor"
      />
      <path
        d="M137 106C137 107.657 138.343 109 140 109C141.657 109 143 107.657 143 106C143 104.343 141.657 103 140 103C138.343 103 137 104.343 137 106Z"
        fill="currentColor"
      />
    </svg>
  );
}

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
          <GooseLogo className="mb-4 h-16 w-16 mx-auto text-foreground" />
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
            <GooseLogo className="h-full w-full text-foreground" />

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
              <span className="flex items-center"><SlidingNumber value={energy} />/<SlidingNumber value={maxEnergy} /></span>
            </div>
            <span className="flex items-center">+<SlidingNumber value={coinsPerTap} />/tap</span>
          </div>
          <Progress value={energyPercentage} className="h-2" />
        </Card>
      </div>
    </div>
  );
}
