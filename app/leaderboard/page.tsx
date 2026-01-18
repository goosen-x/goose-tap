'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useTelegram } from '@/hooks/useTelegram';
import { useGame } from '@/components/GameProvider';
import { LeaderboardCard } from '@/components/LeaderboardCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SlidingNumber } from '@/components/ui/sliding-number';
import { Trophy, RefreshCw, Users, Loader2 } from 'lucide-react';

// Skeleton for a single leaderboard entry
function EntrySkeleton({ index }: { index: number }) {
  const isTopThree = index < 3;
  return (
    <Card className="flex flex-row items-center gap-3 p-3 animate-pulse">
      <div className={`h-6 ${isTopThree ? 'w-6' : 'w-8'} rounded bg-secondary shrink-0`} />
      <div className="h-10 w-10 rounded-full bg-secondary shrink-0" />
      <div className="flex flex-1 flex-col gap-1.5 min-w-0">
        <div className="h-4 w-28 rounded bg-secondary" />
        <div className="h-3 w-10 rounded bg-secondary" />
      </div>
      <div className="h-4 w-16 rounded bg-secondary shrink-0" />
    </Card>
  );
}

export default function LeaderboardPage() {
  const { initData, user } = useTelegram();
  const { coins, level } = useGame();
  const {
    entries,
    currentUser,
    totalPlayers,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    refresh,
    loadMore,
  } = useLeaderboard(initData);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoadingMore) return;

      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      });

      if (node) {
        observerRef.current.observe(node);
      }
    },
    [isLoadingMore, hasMore, loadMore]
  );

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div className="flex flex-1 flex-col bg-background overflow-hidden">
      {/* Static header */}
      <div className="shrink-0 p-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Leaderboard
          </h1>
          {/* Static: total players count */}
          {totalPlayers > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{totalPlayers.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* User rank card - only coins are dynamic */}
        {currentUser && (
          <Card className="p-4 bg-primary/5 border-primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Your Rank</p>
                {/* Static: rank from API */}
                <span className="text-2xl font-bold">#{currentUser.rank}</span>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Earned</p>
                {/* Total earnings from API */}
                <span className="text-lg font-semibold flex items-center justify-end">
                  <SlidingNumber value={currentUser.coins} />
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Loading state for user card */}
        {isLoading && !currentUser && (
          <Card className="p-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-3 w-16 rounded bg-secondary mb-2" />
                <div className="h-8 w-12 rounded bg-secondary" />
              </div>
              <div className="flex flex-col items-end">
                <div className="h-3 w-16 rounded bg-secondary mb-2" />
                <div className="h-6 w-20 rounded bg-secondary" />
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Leaderboard list */}
      <main className="flex-1 overflow-y-auto p-4 pt-2">
        {/* Loading skeleton */}
        {isLoading && (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <EntrySkeleton key={i} index={i} />
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={refresh} variant="outline" className="cursor-pointer">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && entries.length === 0 && (
          <div className="mt-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
              <Trophy className="h-8 w-8" />
            </div>
            <p className="text-muted-foreground">No players yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Start playing to appear on the leaderboard!
            </p>
          </div>
        )}

        {/* Leaderboard entries */}
        {!isLoading && !error && entries.length > 0 && (
          <div className="flex flex-col gap-2">
            {entries.map((entry) => {
              const isCurrentUser = entry.telegramId === user?.id;
              return (
                <LeaderboardCard
                  key={entry.telegramId}
                  entry={entry}
                  isCurrentUser={isCurrentUser}
                />
              );
            })}

            {/* Infinite scroll trigger */}
            {hasMore && (
              <div ref={loadMoreRef} className="flex justify-center py-4">
                {isLoadingMore && (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
