'use client';

import { useState, useEffect } from 'react';
import { useGame } from '@/components/GameProvider';
import { useTelegram } from '@/hooks/useTelegram';
import { DailyReward as DailyRewardType, DAILY_REWARDS } from '@/types/game';
import { formatNumber } from '@/lib/storage';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, Gift, Check, Clock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DailyRewardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DailyRewardDialog({ open, onOpenChange }: DailyRewardProps) {
  const {
    dailyStreak,
    canClaimDailyReward,
    currentDailyReward,
    claimDailyReward,
  } = useGame();
  const { hapticNotification } = useTelegram();
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimedReward, setClaimedReward] = useState<DailyRewardType | null>(null);

  const handleClaim = async () => {
    if (!canClaimDailyReward || isClaiming) return;

    setIsClaiming(true);
    const reward = await claimDailyReward();

    if (reward) {
      hapticNotification('success');
      setClaimedReward(reward);
    } else {
      hapticNotification('error');
    }

    setIsClaiming(false);
  };

  const handleClose = () => {
    setClaimedReward(null);
    onOpenChange(false);
  };

  // Current day in streak (1-7)
  const currentDay = (dailyStreak % 7) + 1;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Daily Rewards
          </DialogTitle>
          <DialogDescription>
            {canClaimDailyReward
              ? 'Claim your daily reward!'
              : `Come back tomorrow for day ${currentDay === 7 ? 1 : currentDay + 1}!`}
          </DialogDescription>
        </DialogHeader>

        {claimedReward ? (
          // Success state
          <div className="py-6 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20">
              <Sparkles className="h-10 w-10 text-green-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">Reward Claimed!</h3>
            <div className="flex items-center justify-center gap-4 text-lg">
              <span className="flex items-center gap-1">
                <Coins className="h-5 w-5" />
                +{formatNumber(claimedReward.coins)}
              </span>
              <span className="text-muted-foreground">
                +{claimedReward.xp} XP
              </span>
            </div>
            {claimedReward.bonus && (
              <Badge variant="secondary" className="mt-3">
                🎉 Week Complete Bonus!
              </Badge>
            )}
            <Button onClick={handleClose} className="mt-6 cursor-pointer">
              Awesome!
            </Button>
          </div>
        ) : (
          // Rewards grid
          <>
            <div className="grid grid-cols-7 gap-1">
              {DAILY_REWARDS.map((reward, index) => {
                const day = index + 1;
                const isPast = day < currentDay;
                const isCurrent = day === currentDay;
                const isFuture = day > currentDay;

                return (
                  <DayCard
                    key={day}
                    day={day}
                    reward={reward}
                    isPast={isPast}
                    isCurrent={isCurrent}
                    isFuture={isFuture}
                    canClaim={canClaimDailyReward && isCurrent}
                  />
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-muted-foreground">
                🔥 Streak: {dailyStreak} day{dailyStreak !== 1 ? 's' : ''}
              </div>
              <div className="text-sm text-muted-foreground">
                Day {currentDay}/7
              </div>
            </div>

            <Button
              onClick={handleClaim}
              disabled={!canClaimDailyReward || isClaiming}
              className="w-full cursor-pointer"
              size="lg"
            >
              {isClaiming ? (
                'Claiming...'
              ) : canClaimDailyReward ? (
                <>
                  <Gift className="h-4 w-4 mr-2" />
                  Claim +{formatNumber(currentDailyReward.coins)}
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Already Claimed
                </>
              )}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface DayCardProps {
  day: number;
  reward: DailyRewardType;
  isPast: boolean;
  isCurrent: boolean;
  isFuture: boolean;
  canClaim: boolean;
}

function DayCard({ day, reward, isPast, isCurrent, isFuture, canClaim }: DayCardProps) {
  return (
    <Card
      className={cn(
        'p-1.5 text-center relative',
        isPast && 'bg-green-500/10 border-green-500/30',
        isCurrent && canClaim && 'ring-2 ring-primary bg-primary/10',
        isCurrent && !canClaim && 'bg-green-500/10 border-green-500/30',
        isFuture && 'opacity-50'
      )}
    >
      {isPast && (
        <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5">
          <Check className="h-2 w-2 text-white" />
        </div>
      )}
      {isCurrent && !canClaim && (
        <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5">
          <Check className="h-2 w-2 text-white" />
        </div>
      )}
      <p className="text-[10px] text-muted-foreground">Day {day}</p>
      <div className="my-1">
        <Coins className="h-4 w-4 mx-auto" />
      </div>
      <p className="text-[10px] font-medium">{formatNumber(reward.coins)}</p>
    </Card>
  );
}

// Compact card version for tasks page
export function DailyRewardCard() {
  const {
    dailyStreak,
    canClaimDailyReward,
    currentDailyReward,
    timeUntilNextDaily,
  } = useGame();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeUntilNextDaily);

  // Update countdown timer
  useEffect(() => {
    if (canClaimDailyReward) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [canClaimDailyReward]);

  // Reset timeLeft when timeUntilNextDaily changes
  useEffect(() => {
    setTimeLeft(timeUntilNextDaily);
  }, [timeUntilNextDaily]);

  const formatTimeLeft = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <>
      <Card
        className={cn(
          'flex flex-row items-center gap-3 p-4 cursor-pointer transition-colors',
          canClaimDailyReward && 'ring-2 ring-primary bg-primary/5'
        )}
        onClick={() => setDialogOpen(true)}
      >
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full',
            canClaimDailyReward ? 'bg-primary text-primary-foreground' : 'bg-secondary'
          )}
        >
          <Gift className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">Daily Reward</h3>
            {canClaimDailyReward && (
              <Badge variant="default" className="text-xs">
                Ready!
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {canClaimDailyReward
              ? `Day ${(dailyStreak % 7) + 1} reward available`
              : `Next in ${formatTimeLeft(timeLeft)}`}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant="secondary">
            +{formatNumber(currentDailyReward.coins)}
          </Badge>
          <span className="text-xs text-muted-foreground">
            🔥 {dailyStreak} day streak
          </span>
        </div>
      </Card>

      <DailyRewardDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
