'use client';

import { Card } from '@/components/ui/card';

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

// Skeleton header - matches Header.tsx exactly
function HeaderSkeleton() {
  return (
    <header className="flex shrink-0 items-center justify-between border-b bg-background px-4 py-2">
      <div className="flex items-center gap-2">
        {/* Avatar h-8 w-8 */}
        <div className="h-8 w-8 rounded-full bg-secondary animate-pulse" />
        <div>
          {/* Name text-sm leading-tight */}
          <div className="h-[1.25rem] w-20 rounded bg-secondary animate-pulse" />
          {/* Level text-xs mt-0 */}
          <div className="h-[1rem] w-10 rounded bg-secondary animate-pulse mt-0.5" />
        </div>
      </div>
      <div className="flex flex-col items-end">
        {/* Badge with coins */}
        <div className="h-[1.625rem] w-20 rounded-full bg-secondary animate-pulse" />
        {/* Coins per hour text-[10px] */}
        <div className="h-[0.875rem] w-14 rounded bg-secondary animate-pulse mt-0.5" />
      </div>
    </header>
  );
}

// Skeleton bottom nav - matches BottomNav.tsx exactly (5 items)
function BottomNavSkeleton() {
  return (
    <nav className="flex shrink-0 items-center justify-around border-t bg-background px-2 py-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1 rounded-lg">
          {/* Icon h-5 w-5 */}
          <div className="h-5 w-5 rounded bg-secondary animate-pulse" />
          {/* Label text-xs */}
          <div className="h-[1rem] w-8 rounded bg-secondary animate-pulse" />
        </div>
      ))}
    </nav>
  );
}

// Skeleton energy bar - matches page.tsx Card exactly
function EnergyBarSkeleton() {
  return (
    <div className="shrink-0 px-4 pb-4">
      <Card className="p-4">
        <div className="flex items-center justify-between text-sm mb-2">
          {/* Energy: icon + numbers */}
          <div className="flex items-center gap-1">
            <div className="h-4 w-4 rounded bg-secondary animate-pulse" />
            <div className="h-[1.25rem] w-16 rounded bg-secondary animate-pulse" />
          </div>
          {/* Coins per tap */}
          <div className="h-[1.25rem] w-14 rounded bg-secondary animate-pulse" />
        </div>
        {/* Progress bar h-2 */}
        <div className="h-2 w-full rounded-full bg-secondary animate-pulse" />
      </Card>
    </div>
  );
}

interface LoadingSkeletonProps {
  message?: string;
}

export function LoadingSkeleton({ message = 'Loading...' }: LoadingSkeletonProps) {
  return (
    <div className="flex h-screen flex-col bg-background">
      <HeaderSkeleton />

      <main className="flex flex-1 flex-col items-center justify-center">
        {/* Animated goose */}
        <div className="relative">
          {/* Pulsing glow behind */}
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: '2s' }} />

          {/* Bouncing goose */}
          <div className="relative animate-bounce" style={{ animationDuration: '1s' }}>
            <GooseLogo className="h-32 w-32 text-foreground" />
          </div>
        </div>

        {/* Loading message */}
        <p className="mt-6 text-muted-foreground animate-pulse">{message}</p>
      </main>

      <EnergyBarSkeleton />
      <BottomNavSkeleton />
    </div>
  );
}
