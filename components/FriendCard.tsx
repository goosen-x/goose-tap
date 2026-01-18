'use client';

import { Referral } from '@/types/game';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SlidingNumber } from '@/components/ui/sliding-number';
import { User, Coins } from 'lucide-react';

interface FriendCardProps {
  friend: Referral;
}

export function FriendCard({ friend }: FriendCardProps) {
  return (
    <Card className="flex flex-row items-center gap-3 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
        <User className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium truncate">
          {friend.firstName}
          {friend.username && (
            <span className="ml-1 text-sm text-muted-foreground">@{friend.username}</span>
          )}
        </h3>
        <p className="text-sm text-muted-foreground">
          Joined {new Date(friend.joinedAt).toLocaleDateString()}
        </p>
      </div>
      <Badge variant="secondary" className="flex items-center shrink-0">
        <Coins className="h-3 w-3 mr-1" />
        <SlidingNumber value={friend.coins} />
      </Badge>
    </Card>
  );
}
