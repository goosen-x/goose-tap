'use client';

import { useTelegram } from '@/hooks/useTelegram';
import { useGame } from '@/components/GameProvider';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

function GooseIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 250 250"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M125 0C194.036 0 250 55.9644 250 125C250 194.036 194.036 250 125 250C55.9644 250 0 194.036 0 125C0 55.9644 55.9644 0 125 0ZM157.01 104.497C155.131 95.6004 145.401 90.8275 137.216 94.7871L44.9951 139.397C31.6071 145.874 36.2193 166 51.0918 166H152.734C161.63 166 168.27 157.811 166.432 149.106L157.01 104.497ZM196 84C189.925 84 185 88.9249 185 95C185 101.075 189.925 106 196 106C202.075 106 207 101.075 207 95C207 88.9249 202.075 84 196 84Z"
        fill="currentColor"
      />
      <path
        d="M137 106C137 107.657 138.343 109 140 109C141.657 109 143 107.657 143 106C143 104.343 141.657 103 140 103C138.343 103 137 104.343 137 106Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Header() {
  const { user } = useTelegram();
  const { coins, coinsPerHour, level, isLoaded } = useGame();

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
            Lvl {level}
          </p>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <Badge variant="secondary" className="px-2 py-0.5">
          {coins.toLocaleString('ru-RU')}
          <GooseIcon className="h-3 w-3 ml-1" />
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
