'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGame } from '@/components/GameProvider';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCompact } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { Layers, Rocket, Star, Zap, Clock, Battery } from 'lucide-react';
import { GooseIcon } from '@/components/ui/goose-icon';

interface TabLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabLink[] = [
  { href: '/earn/cards', label: 'Cards', icon: <Layers className="h-4 w-4" /> },
  { href: '/earn/boosts', label: 'Boosts', icon: <Rocket className="h-4 w-4" /> },
];

function formatBonus(bonus: { coinsPerTap?: number; maxEnergy?: number; passiveIncomeMultiplier?: number }): string {
  const parts: string[] = [];
  if (bonus.coinsPerTap) parts.push(`+${bonus.coinsPerTap} tap`);
  if (bonus.maxEnergy) parts.push(`+${bonus.maxEnergy} energy`);
  if (bonus.passiveIncomeMultiplier) parts.push(`+${Math.round((bonus.passiveIncomeMultiplier - 1) * 100)}% passive`);
  return parts.join(', ') || 'No bonus';
}

function EarnHeader() {
  const {
    xp,
    coinsPerTap,
    coinsPerHour,
    maxEnergy,
    levelData,
    nextLevelData,
    levelProgress,
    isLoaded,
  } = useGame();

  if (!isLoaded) {
    return (
      <div className="px-4 pt-4">
        <Card className="p-4 mb-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-secondary animate-pulse" />
              <div>
                <div className="h-4 w-16 bg-secondary rounded animate-pulse mb-1" />
                <div className="h-3 w-12 bg-secondary rounded animate-pulse" />
              </div>
            </div>
          </div>
          <div className="h-2 w-full bg-secondary rounded animate-pulse" />
        </Card>
        <div className="grid grid-cols-3 gap-2 pb-2">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-2 h-16 animate-pulse bg-secondary/50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4">
      {/* Level Progress */}
      <Card className="p-4 mb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
              <Star className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">Level {levelData.level}</p>
              <p className="text-xs text-muted-foreground">{levelData.title}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm font-medium flex items-center justify-end gap-1">{formatCompact(xp)} XP</span>
            {nextLevelData && (
              <span className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                {formatCompact(nextLevelData.xpRequired)} next
              </span>
            )}
          </div>
        </div>
        <Progress value={levelProgress} className="h-2 mb-2" />
        {nextLevelData && (
          <p className="text-xs text-muted-foreground text-center">
            Next: {formatBonus(nextLevelData.bonus)}
          </p>
        )}
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 pb-2">
        <Card className="p-2 text-center">
          <Zap className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
          <p className="text-[10px] text-muted-foreground">Per tap</p>
          <span className="text-sm font-semibold flex items-center justify-center gap-0.5">
            +{formatCompact(coinsPerTap)}
            <GooseIcon className="h-3 w-3" />
          </span>
        </Card>
        <Card className="p-2 text-center">
          <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
          <p className="text-[10px] text-muted-foreground">Per hour</p>
          <span className="text-sm font-semibold flex items-center justify-center gap-0.5">
            +{formatCompact(coinsPerHour)}
            <GooseIcon className="h-3 w-3" />
          </span>
        </Card>
        <Card className="p-2 text-center">
          <Battery className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
          <p className="text-[10px] text-muted-foreground">Max energy</p>
          <span className="text-sm font-semibold flex items-center justify-center">{formatCompact(maxEnergy)}</span>
        </Card>
      </div>
    </div>
  );
}

export default function EarnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col bg-background">
      {/* Header section (scrolls with content) */}
      <EarnHeader />

      {/* Tabs navigation */}
      <div className="bg-background px-4 pt-2 pb-2">
        <div className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
          {TABS.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all cursor-pointer',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  isActive
                    ? 'bg-background text-foreground shadow'
                    : 'hover:bg-background/50'
                )}
              >
                {tab.icon}
                <span className="ml-1">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Page content */}
      <div className="px-4 pb-4">
        {children}
      </div>
    </div>
  );
}
