'use client';

import { useGame } from '@/components/GameProvider';
import { UpgradeCard } from '@/components/UpgradeCard';
import { UPGRADES, calculateUpgradeCost } from '@/types/game';
import { useTelegram } from '@/hooks/useTelegram';
import { toast } from 'sonner';

export default function BoostsPage() {
  const { coins, purchaseUpgrade, getUpgradeLevel, isLoaded } = useGame();
  const { hapticNotification } = useTelegram();

  if (!isLoaded) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 w-full bg-secondary/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const handlePurchase = (upgradeId: string) => {
    const upgrade = UPGRADES.find((u) => u.id === upgradeId);
    if (!upgrade) return;

    const level = getUpgradeLevel(upgradeId);
    const cost = calculateUpgradeCost(upgrade, level);

    if (level >= upgrade.maxLevel) {
      toast.error('Already at max level');
      hapticNotification('error');
      return;
    }

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

  const boostUpgrades = UPGRADES.filter((upgrade) => upgrade.category === 'boosts');

  return (
    <div className="flex flex-col gap-3">
      {boostUpgrades.map((upgrade) => (
        <UpgradeCard
          key={upgrade.id}
          upgrade={upgrade}
          level={getUpgradeLevel(upgrade.id)}
          coins={coins}
          onPurchase={() => handlePurchase(upgrade.id)}
        />
      ))}
    </div>
  );
}
