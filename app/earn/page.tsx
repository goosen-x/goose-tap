'use client';

import { useGame } from '@/components/GameProvider';
import { UpgradeCard } from '@/components/UpgradeCard';
import { UPGRADES } from '@/types/game';
import { formatNumber } from '@/lib/storage';
import { useTelegram } from '@/hooks/useTelegram';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Layers, Rocket } from 'lucide-react';

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
    <div className="flex flex-1 flex-col bg-background">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 p-4 pb-2">
        <Card className="p-2 text-center">
          <p className="text-[10px] text-muted-foreground">Per tap</p>
          <p className="text-sm font-semibold">+{coinsPerTap}</p>
        </Card>
        <Card className="p-2 text-center">
          <p className="text-[10px] text-muted-foreground">Per hour</p>
          <p className="text-sm font-semibold">+{formatNumber(coinsPerHour)}</p>
        </Card>
        <Card className="p-2 text-center">
          <p className="text-[10px] text-muted-foreground">Max energy</p>
          <p className="text-sm font-semibold">{formatNumber(maxEnergy)}</p>
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
