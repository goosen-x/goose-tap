'use client';

import { Upgrade, calculateUpgradeCost } from '@/types/game';
import { formatCompact } from '@/lib/storage';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SlidingNumber } from '@/components/ui/sliding-number';
import { Coins, Clock, TrendingUp, Sparkles, Rocket, Battery } from 'lucide-react';
import { GooseIcon } from '@/components/ui/goose-icon';

interface UpgradeCardProps {
  upgrade: Upgrade;
  level: number;
  coins: number;
  onPurchase: () => void;
}

const iconMap: Record<string, React.ReactNode> = {
  'golden-goose': <Coins className="h-6 w-6" />,
  'egg-farm': <Clock className="h-6 w-6" />,
  'golden-egg': <Sparkles className="h-6 w-6" />,
  'goose-nest': <TrendingUp className="h-6 w-6" />,
  'energy-drink': <Battery className="h-6 w-6" />,
  'turbo-tap': <Rocket className="h-6 w-6" />,
};

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
        return `+${formatCompact(bonus)}/hour`;
      case 'energy':
        return `+${formatCompact(bonus)} max`;
    }
  };

  return (
    <Card className="flex flex-row items-center gap-3 p-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
        {iconMap[upgrade.id] || <Coins className="h-6 w-6" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">
            {upgrade.name}
          </h3>
          <Badge variant="outline" className="flex items-center gap-0.5">
            Lvl <SlidingNumber value={level} />
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {upgrade.description}
        </p>
        <p className="mt-0.5 text-sm font-medium">
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
            className="cursor-pointer"
          >
            {formatCompact(cost)}
            <GooseIcon className="h-3.5 w-3.5 ml-1" />
          </Button>
        )}
      </div>
    </Card>
  );
}
