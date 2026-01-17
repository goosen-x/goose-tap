'use client';

import { LeaderboardEntry } from '@/types/game';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatCompact } from '@/lib/storage';

interface LeaderboardCardProps {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
}

function getRankDisplay(rank: number): React.ReactNode {
  switch (rank) {
    case 1:
      return <span className="text-lg">🥇</span>;
    case 2:
      return <span className="text-lg">🥈</span>;
    case 3:
      return <span className="text-lg">🥉</span>;
    default:
      return <span className="text-sm font-medium text-muted-foreground">#{rank}</span>;
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function LeaderboardCard({ entry, isCurrentUser }: LeaderboardCardProps) {
  return (
    <Card
      className={cn(
        'flex flex-row items-center gap-3 p-3',
        isCurrentUser && 'border-primary bg-primary/5'
      )}
    >
      {/* Rank - static */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center">
        {getRankDisplay(entry.rank)}
      </div>

      {/* Avatar */}
      <Avatar className="h-10 w-10 shrink-0">
        {entry.photoUrl && (
          <AvatarImage src={entry.photoUrl} alt={entry.firstName} />
        )}
        <AvatarFallback className="text-sm font-medium">
          {getInitials(entry.firstName)}
        </AvatarFallback>
      </Avatar>

      {/* Name and level */}
      <div className="flex flex-1 flex-col min-w-0">
        <span className="font-medium truncate">
          {entry.firstName}
          {entry.username && (
            <span className="ml-1 text-sm text-muted-foreground">@{entry.username}</span>
          )}
        </span>
        <span className="text-xs text-muted-foreground">Lvl {entry.level}</span>
      </div>

      {/* Coins */}
      <div className="text-right shrink-0">
        <span className="font-semibold">{formatCompact(entry.coins)}</span>
      </div>
    </Card>
  );
}
