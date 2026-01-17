'use client';

import { useTelegram } from '@/hooks/useTelegram';
import { useGame } from '@/components/GameProvider';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Coins } from 'lucide-react';

export function Header() {
  const { user } = useTelegram();
  const { coins, coinsPerHour, level, isLoaded, error } = useGame();

  // Get initials for avatar fallback
  const initials = user?.first_name
    ? user.first_name.slice(0, 2).toUpperCase()
    : 'P';

  if (!isLoaded) {
    return (
      <header className="flex shrink-0 items-center justify-between border-b bg-background px-4 py-2">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="h-4 w-20 animate-pulse rounded bg-secondary" />
        </div>
        <div className="h-6 w-16 animate-pulse rounded bg-secondary" />
      </header>
    );
  }

  return (
    <header className="flex shrink-0 items-center justify-between border-b bg-background px-4 py-2">
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          {user?.photo_url && (
            <AvatarImage src={user.photo_url} alt={user.first_name || 'User'} />
          )}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium leading-tight">
            {user?.first_name || 'Player'}
          </p>
          <p className="text-xs text-muted-foreground">
            Lvl {level} {user?.id && <span className="opacity-50">#{user.id}</span>}
          </p>
          {error && (
            <p className="text-[10px] text-destructive truncate max-w-[150px]">
              {error}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end">
        <Badge variant="secondary" className="px-2 py-0.5">
          {coins.toLocaleString('ru-RU')}
          <Coins className="h-3 w-3 ml-1" />
        </Badge>
        {coinsPerHour > 0 && (
          <p className="text-[10px] text-muted-foreground mt-0.5">
            +{coinsPerHour.toLocaleString('ru-RU')}/hr
          </p>
        )}
      </div>
    </header>
  );
}
