'use client';

import { useGame } from '@/components/GameProvider';
import { UpgradeCard } from '@/components/UpgradeCard';
import { UPGRADES } from '@/types/game';
import { formatNumber } from '@/lib/storage';
import { useTelegram } from '@/hooks/useTelegram';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';

type TabType = 'cards' | 'boosts';

export default function EarnPage() {
  const { coins, coinsPerTap, coinsPerHour, maxEnergy, purchaseUpgrade, getUpgradeLevel } = useGame();
  const { webApp } = useTelegram();

  const getFilteredUpgrades = (tab: TabType) => {
    return UPGRADES.filter((upgrade) => upgrade.category === tab);
  };

  const handlePurchase = (upgradeId: string) => {
    const success = purchaseUpgrade(upgradeId);
    if (success && webApp) {
      webApp.HapticFeedback?.notificationOccurred('success');
    }
  };

  return (
    <div className="flex flex-1 flex-col bg-gradient-to-b from-amber-50 to-orange-100 dark:from-zinc-900 dark:to-zinc-800">
      {/* Header */}
      <header className="px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            Earn
          </h1>
          <div className="flex items-center gap-1 rounded-full bg-primary/20 px-3 py-1.5">
            <span className="text-lg">🪙</span>
            <span className="font-bold text-primary">
              {formatNumber(coins)}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Card className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Per tap</p>
            <p className="text-lg font-bold text-primary">
              +{coinsPerTap}
            </p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Per hour</p>
            <p className="text-lg font-bold text-primary">
              +{formatNumber(coinsPerHour)}
            </p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Max energy</p>
            <p className="text-lg font-bold text-primary">
              {formatNumber(maxEnergy)}
            </p>
          </Card>
        </div>
      </header>

      {/* Tabs and content */}
      <Tabs defaultValue="cards" className="flex flex-1 flex-col px-4">
        <TabsList className="w-full">
          <TabsTrigger value="cards" className="flex-1 cursor-pointer">🎴 Cards</TabsTrigger>
          <TabsTrigger value="boosts" className="flex-1 cursor-pointer">⚡ Boosts</TabsTrigger>
        </TabsList>

        {/* Upgrades list */}
        <div className="flex-1 pb-4 pt-4">
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
