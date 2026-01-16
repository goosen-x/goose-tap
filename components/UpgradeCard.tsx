'use client';

import { Upgrade, calculateUpgradeCost } from '@/types/game';
import { formatNumber } from '@/lib/storage';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface UpgradeCardProps {
  upgrade: Upgrade;
  level: number;
  coins: number;
  onPurchase: () => void;
}

export function UpgradeCard({ upgrade, level, coins, onPurchase }: UpgradeCardProps) {
  const cost = calculateUpgradeCost(upgrade, level);
  const canAfford = coins >= cost;
  const isMaxLevel = level >= upgrade.maxLevel;
  const bonus = upgrade.bonusValue * (level + 1);

  const getBonusText = () => {
    switch (upgrade.bonusType) {
      case 'tap':
        return `+${bonus}/tap`;
      case 'hour':
        return `+${formatNumber(bonus)}/hour`;
      case 'energy':
        return `+${bonus} max`;
    }
  };

  return (
    <Card className="flex flex-row items-center gap-3 p-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-3xl">
        {upgrade.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">
            {upgrade.name}
          </h3>
          <Badge variant="secondary">
            Lvl {level}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {upgrade.description}
        </p>
        <p className="mt-0.5 text-sm font-medium text-primary">
          {getBonusText()}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        {isMaxLevel ? (
          <Badge variant="outline" className="text-green-600">
            MAX
          </Badge>
        ) : (
          <Button
            size="sm"
            onClick={onPurchase}
            disabled={!canAfford}
          >
            🪙 {formatNumber(cost)}
          </Button>
        )}
      </div>
    </Card>
  );
}
