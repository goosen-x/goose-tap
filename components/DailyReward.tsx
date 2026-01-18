'use client';

import { useState, useEffect } from 'react';
import { useGame } from '@/components/GameProvider';
import { useTelegram } from '@/hooks/useTelegram';
import { DailyReward as DailyRewardType, DAILY_REWARDS } from '@/types/game';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SlidingNumber } from '@/components/ui/sliding-number';
import { Gift, Clock, Sparkles } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { GooseIcon } from '@/components/ui/goose-icon';
import { cn } from '@/lib/utils';

interface DailyRewardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DailyRewardDrawer({ open, onOpenChange }: DailyRewardProps) {
  const {
    dailyStreak,
    canClaimDailyReward,
    currentDailyReward,
    claimDailyReward,
    timeUntilNextDaily,
  } = useGame();
  const { hapticNotification } = useTelegram();
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimedReward, setClaimedReward] = useState<DailyRewardType | null>(null);
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

  // Days completed this week (based on actual streak)
  const daysCompletedThisWeek = dailyStreak % 7;
  // Handle week completion (streak 7, 14, 21... should show 7 dots)
  const daysCompleted = (daysCompletedThisWeek === 0 && dailyStreak > 0) ? 7 : daysCompletedThisWeek;
  // Current day display:
  // - If can claim: show next day to claim (daysCompleted + 1)
  // - If already claimed: show last completed day (daysCompleted, or 7 if week complete)
  const currentDay = canClaimDailyReward
    ? (daysCompleted % 7) + 1
    : (daysCompleted === 0 ? 1 : daysCompleted);

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent>
        <div className="w-full px-4 pb-8">
          <DrawerHeader className="px-0 text-center">
            <DrawerTitle className="flex items-center justify-center gap-2">
              <Gift className="h-5 w-5" />
              Daily Rewards
            </DrawerTitle>
            <DrawerDescription className="text-center">
              {canClaimDailyReward
                ? 'Claim your daily reward!'
                : `Come back tomorrow for day ${currentDay === 7 ? 1 : currentDay + 1}!`}
            </DrawerDescription>
          </DrawerHeader>

          {claimedReward ? (
            // Success state
            <div className="py-6 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20">
                <Sparkles className="h-10 w-10 text-green-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Reward Claimed!</h3>
              <div className="flex items-center justify-center gap-4 text-lg">
                <span className="flex items-center gap-1">
                  <GooseIcon className="h-5 w-5" />
                  +<SlidingNumber value={claimedReward.coins} />
                </span>
                <span className="text-muted-foreground flex items-center gap-1">
                  +<SlidingNumber value={claimedReward.xp} /> XP
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
            // Variant 4: Compact grid + large reward
            <div className="space-y-6">
              {/* Today's Reward Card */}
              <Card className={cn(
                "p-6 text-center",
                canClaimDailyReward && "ring-2 ring-primary bg-primary/5"
              )}>
                <p className="text-sm text-muted-foreground mb-2">Today's Reward</p>
                <div className="flex items-center justify-center gap-2 text-3xl font-bold">
                  <GooseIcon className="h-8 w-8" />
                  <SlidingNumber value={currentDailyReward.coins} />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  +{currentDailyReward.xp} XP
                </p>
              </Card>

              {/* Progress Dots */}
              <div className="flex items-center justify-between px-2">
                {DAILY_REWARDS.map((_, index) => {
                  const day = index + 1;
                  const isCompleted = day <= daysCompleted;
                  const isCurrent = day === currentDay && canClaimDailyReward;

                  return (
                    <div key={day} className="flex flex-col items-center gap-1.5">
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full transition-colors",
                          isCompleted && "bg-primary",
                          isCurrent && "bg-primary ring-2 ring-primary/30 ring-offset-2 ring-offset-background",
                          !isCompleted && !isCurrent && "bg-muted-foreground/30"
                        )}
                      />
                      <span className="text-xs text-muted-foreground">{day}</span>
                    </div>
                  );
                })}
              </div>

              {/* Streak Info */}
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  🔥 {dailyStreak} {dailyStreak === 1 ? 'day' : 'days'}
                </span>
                <span>•</span>
                <span>Day {currentDay}/7</span>
              </div>

              {/* Claim Button */}
              <Button
                onClick={handleClaim}
                disabled={!canClaimDailyReward || isClaiming}
                className="w-full cursor-pointer"
                size="lg"
              >
                {isClaiming ? (
                  <Spinner />
                ) : canClaimDailyReward ? (
                  <span className="flex items-center">
                    <Gift className="h-4 w-4 mr-2" />
                    Claim Reward
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <SlidingNumber value={Math.floor(timeLeft / (1000 * 60 * 60))} padStart />
                    <span>:</span>
                    <SlidingNumber value={Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))} padStart />
                    <span>:</span>
                    <SlidingNumber value={Math.floor((timeLeft % (1000 * 60)) / 1000)} padStart />
                  </span>
                )}
              </Button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

// Days progress dots component
function DaysProgress({ current, total = 7 }: { current: number; total?: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "w-1.5 h-1.5 rounded-full transition-colors",
            i < current ? "bg-primary" : "bg-muted-foreground/30"
          )}
        />
      ))}
    </div>
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

  // Days completed this week (based on actual streak)
  const daysCompletedThisWeek = dailyStreak % 7;
  const daysCompleted = (daysCompletedThisWeek === 0 && dailyStreak > 0) ? 7 : daysCompletedThisWeek;
  // Current day display:
  // - If can claim: show next day to claim (daysCompleted + 1)
  // - If already claimed: show last completed day
  const currentDay = canClaimDailyReward
    ? (daysCompleted % 7) + 1
    : (daysCompleted === 0 ? 1 : daysCompleted);

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
          'p-4 cursor-pointer transition-colors',
          canClaimDailyReward && 'ring-2 ring-primary bg-primary/5'
        )}
        onClick={() => setDialogOpen(true)}
      >
        {/* Row 1: Icon, Title, Reward, Action */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
              canClaimDailyReward ? 'bg-primary text-primary-foreground' : 'bg-secondary'
            )}
          >
            <Gift className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-medium">Daily Reward</h3>
          </div>

          <Badge variant="secondary" className="shrink-0">
            +<SlidingNumber value={currentDailyReward.coins} />
          </Badge>

          <Button
            size="sm"
            variant={canClaimDailyReward ? 'default' : 'secondary'}
            onClick={(e) => {
              e.stopPropagation();
              setDialogOpen(true);
            }}
            className="cursor-pointer shrink-0"
          >
            {canClaimDailyReward ? 'Claim' : 'View'}
          </Button>
        </div>

        {/* Row 2: Progress dots, Day counter, Streak/Timer */}
        <div className="flex items-center gap-3 mt-1 ml-[52px]">
          <DaysProgress current={daysCompleted} total={7} />

          <span className="text-xs text-muted-foreground">
            Day {currentDay}/7
          </span>

          {canClaimDailyReward ? (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              🔥 {dailyStreak} {dailyStreak === 1 ? 'day' : 'days'}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTimeLeft(timeLeft)}
            </span>
          )}
        </div>
      </Card>

      <DailyRewardDrawer open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
