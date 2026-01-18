'use client';

import { useTelegram } from '@/hooks/useTelegram';
import { useGame } from '@/components/GameProvider';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { SlidingNumber } from '@/components/ui/sliding-number';
import { GooseIcon } from '@/components/ui/goose-icon';

export function Header() {
  const { user } = useTelegram();
  const { coins, coinsPerHour, level, isLoaded } = useGame();

  // Get initials for avatar fallback
  const initials = user?.first_name
    ? user.first_name.slice(0, 2).toUpperCase()
    : 'P';

  if (!isLoaded) {
    return (
      <header className="flex shrink-0 flex-col border-b bg-background">
        <div className="flex items-center justify-center gap-2 py-2">
          <GooseIcon className="h-5 w-5" />
          <span className="text-base font-semibold tracking-tight">GooseTap</span>
        </div>
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="h-4 w-20 animate-pulse rounded bg-secondary" />
          </div>
          <div className="h-6 w-16 animate-pulse rounded bg-secondary" />
        </div>
      </header>
    );
  }

  return (
    <header className="flex shrink-0 flex-col border-b bg-background">
      <div className="flex items-center justify-center gap-2 py-2">
        <GooseIcon className="h-5 w-5" />
        <span className="text-base font-semibold tracking-tight">GooseTap</span>
      </div>
      <div className="flex items-center justify-between px-4 py-2">
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
            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
              Lvl <SlidingNumber value={level} />
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <Badge variant="secondary" className="px-2 py-0.5 flex items-center">
            <SlidingNumber value={coins} />
            <GooseIcon className="h-3 w-3 ml-1" />
          </Badge>
          {coinsPerHour > 0 && (
            <span className="text-[10px] text-muted-foreground mt-0.5 flex items-center">
              +<SlidingNumber value={coinsPerHour} />/hr
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
