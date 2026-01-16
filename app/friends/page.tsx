'use client';

import { useGame } from '@/components/GameProvider';
import { FriendCard } from '@/components/FriendCard';
import { formatNumber } from '@/lib/storage';
import { useTelegram } from '@/hooks/useTelegram';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const REFERRAL_BONUS = 10000;
const EARNINGS_PERCENTAGE = 10;

export default function FriendsPage() {
  const { coins, referrals } = useGame();
  const { webApp, user } = useTelegram();

  const totalEarned = referrals.length * REFERRAL_BONUS;

  const handleInvite = () => {
    const userId = user?.id || 'demo';
    const referralLink = `https://t.me/goosetap_bot?startapp=ref_${userId}`;
    const shareText = `Join me in Goose Tap and earn coins! 🪿💰`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`;

    if (webApp) {
      webApp.openTelegramLink(shareUrl);
    } else {
      window.open(shareUrl, '_blank');
    }
  };

  const handleCopyLink = () => {
    const userId = user?.id || 'demo';
    const referralLink = `https://t.me/goosetap_bot?startapp=ref_${userId}`;

    navigator.clipboard?.writeText(referralLink);

    if (webApp) {
      webApp.HapticFeedback?.notificationOccurred('success');
    }
  };

  return (
    <div className="flex flex-1 flex-col bg-gradient-to-b from-amber-50 to-orange-100 dark:from-zinc-900 dark:to-zinc-800">
      {/* Header */}
      <header className="px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            Friends
          </h1>
          <div className="flex items-center gap-1 rounded-full bg-primary/20 px-3 py-1.5">
            <span className="text-lg">🪙</span>
            <span className="font-bold text-primary">
              {formatNumber(coins)}
            </span>
          </div>
        </div>
      </header>

      {/* Referral info */}
      <div className="px-4">
        <Card className="bg-gradient-to-br from-primary to-orange-500 p-4 text-white">
          <h2 className="mb-3 text-lg font-bold">Invite Friends & Earn!</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎁</span>
              <span>+{formatNumber(REFERRAL_BONUS)} for each friend</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">💎</span>
              <span>+{EARNINGS_PERCENTAGE}% of their earnings</span>
            </div>
          </div>
        </Card>

        {/* Invite buttons */}
        <div className="mt-4 flex gap-2">
          <Button onClick={handleInvite} className="flex-1">
            Invite Friend
          </Button>
          <Button onClick={handleCopyLink} variant="outline" size="icon">
            📋
          </Button>
        </div>
      </div>

      {/* Friends list */}
      <main className="flex-1 px-4 pb-4 pt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">
            Your friends ({referrals.length})
          </h3>
          {totalEarned > 0 && (
            <span className="text-sm text-primary">
              Total earned: {formatNumber(totalEarned)}
            </span>
          )}
        </div>

        {referrals.length > 0 ? (
          <div className="flex flex-col gap-3">
            {referrals.map((friend) => (
              <FriendCard key={friend.id} friend={friend} />
            ))}
          </div>
        ) : (
          <div className="mt-12 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-4xl">
              👥
            </div>
            <p className="text-muted-foreground">
              No friends yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Invite friends to earn bonus coins!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
