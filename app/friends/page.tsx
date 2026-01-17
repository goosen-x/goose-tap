'use client';

import { useState, useEffect } from 'react';
import { useGame } from '@/components/GameProvider';
import { formatNumber } from '@/lib/storage';
import { useTelegram } from '@/hooks/useTelegram';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SlidingNumber } from '@/components/ui/sliding-number';
import { Users, Gift, Gem, Copy, UserPlus, Check, TrendingUp, User2 } from 'lucide-react';
import { toast } from 'sonner';
import { REFERRAL_BONUSES, REFERRAL_PERCENTAGES } from '@/types/game';

interface ReferralInfo {
  telegramId: number;
  username: string | null;
  firstName: string;
  joinedAt: string;
}

interface MultiTierReferralsData {
  tier1: { count: number; referrals: ReferralInfo[] };
  tier2: { count: number; referrals: ReferralInfo[] };
  tier3: { count: number; referrals: ReferralInfo[] };
  earnings: { tier1: number; tier2: number; tier3: number; total: number };
}

const TIER_CONFIG = {
  tier1: {
    label: 'Friends',
    bonus: REFERRAL_BONUSES.tier1,
    percentage: REFERRAL_PERCENTAGES.tier1 * 100,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  tier2: {
    label: 'Level 2',
    bonus: REFERRAL_BONUSES.tier2,
    percentage: REFERRAL_PERCENTAGES.tier2 * 100,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  tier3: {
    label: 'Level 3',
    bonus: REFERRAL_BONUSES.tier3,
    percentage: REFERRAL_PERCENTAGES.tier3 * 100,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
};

function ReferralCard({ referral }: { referral: ReferralInfo }) {
  const joinedDate = new Date(referral.joinedAt);
  const timeAgo = getTimeAgo(joinedDate);

  return (
    <Card className="p-3 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
        <User2 className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {referral.firstName || referral.username || 'Anonymous'}
        </p>
        {referral.username && (
          <p className="text-xs text-muted-foreground truncate">@{referral.username}</p>
        )}
      </div>
      <span className="text-xs text-muted-foreground">{timeAgo}</span>
    </Card>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

export default function FriendsPage() {
  const { isLoaded, initData } = useGame();
  const { webApp, user, hapticNotification } = useTelegram();
  const [copied, setCopied] = useState(false);
  const [referralsData, setReferralsData] = useState<MultiTierReferralsData | null>(null);
  const [isLoadingReferrals, setIsLoadingReferrals] = useState(true);

  // Fetch multi-tier referrals data
  useEffect(() => {
    if (!isLoaded || !initData) return;

    const fetchReferrals = async () => {
      try {
        const response = await fetch('/api/game/referrals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData }),
        });

        if (response.ok) {
          const data = await response.json();
          setReferralsData(data);
        }
      } catch (error) {
        console.error('Failed to fetch referrals:', error);
      } finally {
        setIsLoadingReferrals(false);
      }
    };

    fetchReferrals();
  }, [isLoaded, initData]);

  // Show skeleton until data is loaded
  if (!isLoaded || isLoadingReferrals) {
    return (
      <div className="flex flex-1 flex-col bg-background">
        <div className="p-4">
          <Card className="p-4">
            <div className="h-5 w-40 bg-secondary rounded animate-pulse mb-3" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-secondary rounded animate-pulse" />
              <div className="h-4 w-36 bg-secondary rounded animate-pulse" />
            </div>
          </Card>
          <div className="mt-4 flex gap-2">
            <div className="flex-1 h-10 bg-secondary rounded animate-pulse" />
            <div className="h-10 w-10 bg-secondary rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

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

  const handleCopyLink = async () => {
    const userId = user?.id || 'demo';
    const referralLink = `https://t.me/goosetap_bot?startapp=ref_${userId}`;

    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      hapticNotification('success');
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
      hapticNotification('error');
    }
  };

  const tier1 = referralsData?.tier1 ?? { count: 0, referrals: [] };
  const tier2 = referralsData?.tier2 ?? { count: 0, referrals: [] };
  const tier3 = referralsData?.tier3 ?? { count: 0, referrals: [] };
  const earnings = referralsData?.earnings ?? { tier1: 0, tier2: 0, tier3: 0, total: 0 };

  const totalReferrals = tier1.count + tier2.count + tier3.count;

  const renderTierContent = (
    tier: 'tier1' | 'tier2' | 'tier3',
    data: { count: number; referrals: ReferralInfo[] },
    tierEarnings: number
  ) => {
    const config = TIER_CONFIG[tier];

    return (
      <div className="flex flex-col gap-3">
        {/* Tier info card */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${config.bgColor}`}>
                <Gift className={`h-4 w-4 ${config.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium">+{formatNumber(config.bonus)} per invite</p>
                <p className="text-xs text-muted-foreground">+{config.percentage}% of earnings</p>
              </div>
            </div>
          </div>
          <div className={`flex items-center gap-2 p-2 rounded-lg ${config.bgColor}`}>
            <TrendingUp className={`h-4 w-4 ${config.color}`} />
            <span className="text-sm">
              Total earned: <span className="font-bold">{formatNumber(tierEarnings)}</span>
            </span>
          </div>
        </Card>

        {/* Referrals list */}
        {data.referrals.length > 0 ? (
          <div className="flex flex-col gap-2">
            {data.referrals.map((referral) => (
              <ReferralCard key={referral.telegramId} referral={referral} />
            ))}
          </div>
        ) : (
          <div className="mt-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
              <Users className="h-8 w-8" />
            </div>
            <p className="text-muted-foreground">
              {tier === 'tier1'
                ? 'No friends yet'
                : tier === 'tier2'
                  ? 'Your friends haven\'t invited anyone yet'
                  : 'No level 3 referrals yet'}
            </p>
            {tier === 'tier1' && (
              <p className="mt-1 text-sm text-muted-foreground">
                Invite friends to earn bonus coins!
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-1 flex-col bg-background">
      {/* Header with invite info */}
      <div className="p-4">
        <Card className="p-4">
          <h2 className="mb-3 font-semibold">Invite Friends & Earn!</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-green-500" />
              <span>+{formatNumber(REFERRAL_BONUSES.tier1)} for direct friends</span>
            </div>
            <div className="flex items-center gap-2">
              <Gem className="h-4 w-4 text-blue-500" />
              <span>Up to 3 levels of referral earnings</span>
            </div>
          </div>
          {earnings.total > 0 && (
            <div className="mt-3 pt-3 border-t flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total network earnings:</span>
              <span className="font-bold text-lg">
                <SlidingNumber value={earnings.total} />
              </span>
            </div>
          )}
        </Card>

        {/* Invite buttons */}
        <div className="mt-4 flex gap-2">
          <Button onClick={handleInvite} className="flex-1 cursor-pointer">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Friend
          </Button>
          <Button onClick={handleCopyLink} variant="outline" size="icon" className="cursor-pointer">
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Tabs section */}
      <main className="flex-1 p-4 pt-0">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            Your network (<SlidingNumber value={totalReferrals} />)
          </h3>
        </div>

        <Tabs defaultValue="tier1" className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="tier1" className="flex-1 cursor-pointer">
              {TIER_CONFIG.tier1.label} ({tier1.count})
            </TabsTrigger>
            <TabsTrigger value="tier2" className="flex-1 cursor-pointer">
              {TIER_CONFIG.tier2.label} ({tier2.count})
            </TabsTrigger>
            <TabsTrigger value="tier3" className="flex-1 cursor-pointer">
              {TIER_CONFIG.tier3.label} ({tier3.count})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tier1">
            {renderTierContent('tier1', tier1, earnings.tier1)}
          </TabsContent>

          <TabsContent value="tier2">
            {renderTierContent('tier2', tier2, earnings.tier2)}
          </TabsContent>

          <TabsContent value="tier3">
            {renderTierContent('tier3', tier3, earnings.tier3)}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
