'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGame } from '@/components/GameProvider';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { formatCompact } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { Layers, Rocket, Star, Zap, Clock, Battery, ChevronRight, Check, Lock } from 'lucide-react';
import { LEVELS, XP_REWARDS } from '@/types/game';

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
  if (bonus.coinsPerTap) parts.push(`+${bonus.coinsPerTap}/tap`);
  if (bonus.maxEnergy) parts.push(`+${bonus.maxEnergy} energy`);
  if (bonus.passiveIncomeMultiplier) parts.push(`×${bonus.passiveIncomeMultiplier} passive`);
  return parts.join(', ') || '—';
}

function formatBonusShort(bonus: { coinsPerTap?: number; maxEnergy?: number; passiveIncomeMultiplier?: number }): string {
  const parts: string[] = [];
  if (bonus.coinsPerTap) parts.push(`+${bonus.coinsPerTap} tap`);
  if (bonus.maxEnergy) parts.push(`+${bonus.maxEnergy}E`);
  if (bonus.passiveIncomeMultiplier) parts.push(`×${bonus.passiveIncomeMultiplier}`);
  return parts.join(' ') || '';
}

function EarnHeader() {
  const [drawerOpen, setDrawerOpen] = useState(false);
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
      <Card
        className="p-3 space-y-2 cursor-pointer active:scale-[0.98] transition-all hover:border-primary/50"
        onClick={() => setDrawerOpen(true)}
      >
        {/* Row 1: Level + Progress + XP */}
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

        {/* Row 3: Call to action */}
        <div className="flex items-center justify-center gap-1 text-xs text-primary pt-1 border-t border-border">
          <span>View level details</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </Card>

      {/* Level Details Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Levels & XP
            </DrawerTitle>
            <DrawerDescription>
              Level up to unlock bonuses
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-6 space-y-6 overflow-auto">
            {/* Current Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  Level {levelData.level} — {levelData.title}
                </span>
                <span className="text-muted-foreground">
                  {formatCompact(xp)} / {nextLevelData ? formatCompact(nextLevelData.xpRequired) : 'MAX'} XP
                </span>
              </div>
              <Progress value={levelProgress} className="h-2" />
              {nextLevelData && (
                <p className="text-xs text-muted-foreground">
                  {formatCompact(nextLevelData.xpRequired - xp)} XP to Level {nextLevelData.level}
                </p>
              )}
            </div>

            {/* Next Level Bonus */}
            {nextLevelData && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-1">
                <p className="text-xs text-emerald-400 font-medium">
                  Level {nextLevelData.level} bonus:
                </p>
                <p className="text-sm font-medium">
                  {formatBonus(nextLevelData.bonus)}
                </p>
              </div>
            )}

            {/* How to Earn XP */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">How to earn XP</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-muted/50 p-2.5 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <Zap className="w-3 h-3 text-yellow-400" />
                  </div>
                  <div>
                    <p className="font-medium">Tap</p>
                    <p className="text-muted-foreground">+{XP_REWARDS.tap} XP</p>
                  </div>
                </div>
                <div className="rounded-lg bg-muted/50 p-2.5 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Rocket className="w-3 h-3 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium">Upgrade</p>
                    <p className="text-muted-foreground">+{XP_REWARDS.upgrade}×lvl XP</p>
                  </div>
                </div>
                <div className="rounded-lg bg-muted/50 p-2.5 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium">Task</p>
                    <p className="text-muted-foreground">+{XP_REWARDS.task} XP</p>
                  </div>
                </div>
                <div className="rounded-lg bg-muted/50 p-2.5 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Star className="w-3 h-3 text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium">Referral</p>
                    <p className="text-muted-foreground">+{formatCompact(XP_REWARDS.referral)} XP</p>
                  </div>
                </div>
              </div>
            </div>

            {/* All Levels */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">All levels</h4>
              <div className="space-y-1.5">
                {LEVELS.map((level) => {
                  const isCompleted = levelData.level > level.level;
                  const isCurrent = levelData.level === level.level;
                  const isLocked = levelData.level < level.level;

                  return (
                    <div
                      key={level.level}
                      className={cn(
                        "flex items-center gap-3 rounded-lg p-2.5 text-xs",
                        isCurrent && "bg-primary/10 border border-primary/30",
                        isCompleted && "bg-muted/30",
                        isLocked && "opacity-60"
                      )}
                    >
                      {/* Status icon */}
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                        isCompleted && "bg-emerald-500/20",
                        isCurrent && "bg-primary/20",
                        isLocked && "bg-muted"
                      )}>
                        {isCompleted && <Check className="w-3 h-3 text-emerald-400" />}
                        {isCurrent && <Star className="w-3 h-3 text-primary" />}
                        {isLocked && <Lock className="w-3 h-3 text-muted-foreground" />}
                      </div>

                      {/* Level info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">Lvl {level.level}</span>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-muted-foreground truncate">{level.title}</span>
                        </div>
                        <p className="text-muted-foreground truncate">
                          {formatBonus(level.bonus)}
                        </p>
                      </div>

                      {/* XP required */}
                      <span className="text-muted-foreground shrink-0">
                        {formatCompact(level.xpRequired)} XP
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
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
