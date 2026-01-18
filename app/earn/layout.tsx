'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGame } from '@/components/GameProvider';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCompact } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { Layers, Rocket, Star, Zap, Clock, Battery } from 'lucide-react';

interface TabLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabLink[] = [
  { href: '/earn/cards', label: 'Cards', icon: <Layers className="h-4 w-4" /> },
  { href: '/earn/boosts', label: 'Boosts', icon: <Rocket className="h-4 w-4" /> },
];

function formatNextBonus(bonus: { coinsPerTap?: number; maxEnergy?: number; passiveIncomeMultiplier?: number }): string {
  const parts: string[] = [];
  if (bonus.coinsPerTap) parts.push(`+${bonus.coinsPerTap} tap`);
  if (bonus.maxEnergy) parts.push(`+${bonus.maxEnergy}E`);
  if (bonus.passiveIncomeMultiplier) parts.push(`+${Math.round((bonus.passiveIncomeMultiplier - 1) * 100)}%`);
  return parts.join(' ') || '';
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
      <div className="px-4 pt-4 pb-2">
        <Card className="p-3">
          <div className="h-4 w-full bg-secondary rounded animate-pulse mb-2" />
          <div className="h-8 w-full bg-secondary rounded animate-pulse" />
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-2">
      <Card className="p-3 space-y-2">
        {/* Row 1: Level + Progress + XP + Next bonus */}
        <div className="flex items-center gap-3 text-sm">
          {/* Level */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="font-medium">Lvl {levelData.level}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground text-xs">{levelData.title}</span>
          </div>

          {/* Progress */}
          <Progress value={levelProgress} className="h-1.5 flex-1" />

          {/* XP */}
          <span className="text-xs text-muted-foreground shrink-0">
            {formatCompact(xp)}/{nextLevelData ? formatCompact(nextLevelData.xpRequired) : 'MAX'}
          </span>

          {/* Next bonus */}
          {nextLevelData && (
            <span className="text-xs text-emerald-400 shrink-0 hidden sm:inline">
              {formatNextBonus(nextLevelData.bonus)}
            </span>
          )}
        </div>

        {/* Row 2: Stats with dividers */}
        <div className="flex items-center text-xs divide-x divide-border">
          <div className="flex-1 flex items-center justify-center gap-1 py-1">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span className="font-medium">+{formatCompact(coinsPerTap)}</span>
            <span className="text-muted-foreground">/tap</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-1 py-1">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-medium">+{formatCompact(coinsPerHour)}</span>
            <span className="text-muted-foreground">/hr</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-1 py-1">
            <Battery className="w-3.5 h-3.5 text-green-400" />
            <span className="font-medium">{formatCompact(maxEnergy)}</span>
            <span className="text-muted-foreground">max</span>
          </div>
        </div>
      </Card>
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
    <div className="flex flex-1 flex-col min-h-0 bg-background">
      {/* Header section - fixed, doesn't scroll */}
      <div className="shrink-0">
        <EarnHeader />
      </div>

      {/* Tabs navigation - fixed, doesn't scroll */}
      <div className="shrink-0 bg-background px-4 pt-2 pb-2">
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

      {/* Page content - scrollable */}
      <div className="flex-1 overflow-auto px-4 pt-2 pb-4">
        {children}
      </div>
    </div>
  );
}
