'use client';

import { useGame } from '@/components/GameProvider';
import { FriendCard } from '@/components/FriendCard';
import { formatNumber } from '@/lib/storage';
import { useTelegram } from '@/hooks/useTelegram';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SlidingNumber } from '@/components/ui/sliding-number';
import { Users, Gift, Gem, Copy, UserPlus } from 'lucide-react';

const REFERRAL_BONUS = 10000;
const EARNINGS_PERCENTAGE = 10;

export default function FriendsPage() {
  const { referrals } = useGame();
  const { webApp, user, hapticNotification } = useTelegram();

  const totalEarned = referrals.length * REFERRAL_BONUS;

  const handleInvite = () => {
    const userId = user?.id || 'demo';
    const referralLink = `https://t.me/goosetap_bot?startapp=ref_${userId}`;
    const shareText = `Join me in Goose Tap and earn coins!`;
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
    hapticNotification('success');
  };

  return (
    <div className="flex flex-1 flex-col bg-background">
      {/* Referral info */}
      <div className="p-4">
        <Card className="p-4">
          <h2 className="mb-3 font-semibold">Invite Friends & Earn!</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              <span>+{formatNumber(REFERRAL_BONUS)} for each friend</span>
            </div>
            <div className="flex items-center gap-2">
              <Gem className="h-4 w-4" />
              <span>+{EARNINGS_PERCENTAGE}% of their earnings</span>
            </div>
          </div>
        </Card>

        {/* Invite buttons */}
        <div className="mt-4 flex gap-2">
          <Button onClick={handleInvite} className="flex-1 cursor-pointer">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Friend
          </Button>
          <Button onClick={handleCopyLink} variant="outline" size="icon" className="cursor-pointer">
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Friends list */}
      <main className="flex-1 p-4 pt-2">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            Your friends (<SlidingNumber value={referrals.length} />)
          </h3>
          {totalEarned > 0 && (
            <span className="text-sm flex items-center gap-1">
              Total earned: <SlidingNumber value={totalEarned} />
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
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
              <Users className="h-8 w-8" />
            </div>
            <p className="text-muted-foreground">No friends yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Invite friends to earn bonus coins!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
