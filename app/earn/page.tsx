'use client';

import { useGame } from '@/components/GameProvider';
import { UpgradeCard } from '@/components/UpgradeCard';
import { UPGRADES, calculateUpgradeCost } from '@/types/game';
import { useTelegram } from '@/hooks/useTelegram';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCompact } from '@/lib/storage';
import { Layers, Rocket, Star, Zap, Clock, Battery } from 'lucide-react';
import { GooseIcon } from '@/components/ui/goose-icon';

type TabType = 'cards' | 'boosts';

// Format bonus description
function formatBonus(bonus: { coinsPerTap?: number; maxEnergy?: number; passiveIncomeMultiplier?: number }): string {
  const parts: string[] = [];
  if (bonus.coinsPerTap) parts.push(`+${bonus.coinsPerTap} tap`);
  if (bonus.maxEnergy) parts.push(`+${bonus.maxEnergy} energy`);
  if (bonus.passiveIncomeMultiplier) parts.push(`+${Math.round((bonus.passiveIncomeMultiplier - 1) * 100)}% passive`);
  return parts.join(', ') || 'No bonus';
}

export default function EarnPage() {
  const {
    coins,
    xp,
    coinsPerTap,
    coinsPerHour,
    maxEnergy,
    purchaseUpgrade,
    getUpgradeLevel,
    levelData,
    nextLevelData,
    levelProgress,
    isLoaded,
  } = useGame();
  const { hapticNotification } = useTelegram();

  // Show skeleton until data is loaded (prevents hydration mismatch)
  if (!isLoaded) {
    return (
      <div className="flex flex-1 flex-col bg-background overflow-auto">
        <Card className="mx-4 mt-4 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-secondary animate-pulse" />
              <div>
                <div className="h-4 w-16 bg-secondary rounded animate-pulse mb-1" />
                <div className="h-3 w-12 bg-secondary rounded animate-pulse" />
              </div>
            </div>
            <div className="text-right">
              <div className="h-4 w-12 bg-secondary rounded animate-pulse mb-1 ml-auto" />
              <div className="h-3 w-16 bg-secondary rounded animate-pulse ml-auto" />
            </div>
          </div>
          <div className="h-2 w-full bg-secondary rounded animate-pulse" />
        </Card>
        <div className="grid grid-cols-3 gap-2 p-4 pb-2">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-2 h-16 animate-pulse bg-secondary/50" />
          ))}
        </div>
      </div>
    );
  }

  const getFilteredUpgrades = (tab: TabType) => {
    return UPGRADES.filter((upgrade) => upgrade.category === tab);
  };

  const handlePurchase = (upgradeId: string) => {
    const upgrade = UPGRADES.find((u) => u.id === upgradeId);
    if (!upgrade) return;

    const level = getUpgradeLevel(upgradeId);
    const cost = calculateUpgradeCost(upgrade, level);

    // Check if at max level
    if (level >= upgrade.maxLevel) {
      toast.error('Already at max level');
      hapticNotification('error');
      return;
    }

    // Check if can afford
    if (coins < cost) {
      toast.error('Not enough coins');
      hapticNotification('error');
      return;
    }

    const success = purchaseUpgrade(upgradeId);
    if (success) {
      hapticNotification('success');
    }
  };

  return (
    <div className="flex flex-1 flex-col bg-background overflow-auto">
      {/* Level Progress */}
      <Card className="mx-4 mt-4 p-4">
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
      <div className="grid grid-cols-3 gap-2 p-4 pb-2">
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

      {/* Tabs and content */}
      <Tabs defaultValue="cards" className="flex flex-1 flex-col px-4 pb-4">
        <TabsList className="w-full">
          <TabsTrigger value="cards" className="flex-1 cursor-pointer">
            <Layers className="h-4 w-4 mr-1" />
            Cards
          </TabsTrigger>
          <TabsTrigger value="boosts" className="flex-1 cursor-pointer">
            <Rocket className="h-4 w-4 mr-1" />
            Boosts
          </TabsTrigger>
        </TabsList>

        {/* Upgrades list */}
        <div className="flex-1 pt-4">
          {(['cards', 'boosts'] as TabType[]).map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-0">
              <div className="flex flex-col gap-3">
                {getFilteredUpgrades(tab).map((upgrade) => (
                  <UpgradeCard
                    key={upgrade.id}
                    upgrade={upgrade}
                    level={getUpgradeLevel(upgrade.id)}
                    coins={coins}
                    onPurchase={() => handlePurchase(upgrade.id)}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}
