'use client';

import { useState, useEffect } from 'react';
import { useGame } from '@/components/GameProvider';
import { formatNumber } from '@/lib/storage';
import { useTelegram } from '@/hooks/useTelegram';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SlidingNumber } from '@/components/ui/sliding-number';
import { Users, Copy, UserPlus, Check, ChevronDown, ChevronRight, Coins } from 'lucide-react';
import { toast } from 'sonner';
import { REFERRAL_BONUSES, REFERRAL_PERCENTAGES } from '@/types/game';
import { cn } from '@/lib/utils';

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
  },
  tier2: {
    label: 'Level 2',
    bonus: REFERRAL_BONUSES.tier2,
    percentage: REFERRAL_PERCENTAGES.tier2 * 100,
  },
  tier3: {
    label: 'Level 3',
    bonus: REFERRAL_BONUSES.tier3,
    percentage: REFERRAL_PERCENTAGES.tier3 * 100,
  },
};

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return '1d';
  if (diffDays < 7) return `${diffDays}d`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`;
  return `${Math.floor(diffDays / 30)}mo`;
}

function AvatarStack({ count, max = 5 }: { count: number; max?: number }) {
  const displayed = Math.min(count, max);
  const remaining = count - displayed;

  if (count === 0) return null;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {Array.from({ length: displayed }).map((_, i) => (
          <div
            key={i}
            className="w-8 h-8 rounded-full bg-secondary border-2 border-background flex items-center justify-center"
          >
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        ))}
      </div>
      {remaining > 0 && (
        <span className="ml-2 text-sm text-muted-foreground">+{remaining}</span>
      )}
    </div>
  );
}

function ReferralRow({ referral }: { referral: ReferralInfo }) {
  const timeAgo = getTimeAgo(new Date(referral.joinedAt));

  return (
    <div className="flex items-center gap-3 py-2 px-3">
      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
        <Users className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {referral.firstName || 'Anonymous'}
        </p>
        {referral.username && (
          <p className="text-xs text-muted-foreground truncate">@{referral.username}</p>
        )}
      </div>
      <span className="text-xs text-muted-foreground shrink-0">{timeAgo}</span>
    </div>
  );
}

function TierSection({
  tier,
  data,
  earnings,
  isExpanded,
  onToggle,
}: {
  tier: 'tier1' | 'tier2' | 'tier3';
  data: { count: number; referrals: ReferralInfo[] };
  earnings: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const config = TIER_CONFIG[tier];

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors cursor-pointer"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        )}

        <div className="flex-1 flex items-center justify-between min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">{config.label}</span>
            <span className="text-sm text-muted-foreground">({data.count})</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>+{formatNumber(config.bonus)}</span>
            <span className="text-green-500">+{config.percentage}%</span>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="bg-secondary/30">
          {earnings > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50">
              <Coins className="w-3.5 h-3.5 text-yellow-500" />
              <span className="text-xs text-muted-foreground">
                Earned: <span className="text-foreground font-medium">{formatNumber(earnings)}</span>
              </span>
            </div>
          )}

          {data.referrals.length > 0 ? (
            <div className="divide-y divide-border/50">
              {data.referrals.map((referral) => (
                <ReferralRow key={referral.telegramId} referral={referral} />
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {tier === 'tier1'
                ? 'Invite friends to start earning!'
                : tier === 'tier2'
                  ? 'Your friends haven\'t invited anyone yet'
                  : 'No level 3 referrals yet'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FriendsPage() {
  const { isLoaded, initData } = useGame();
  const { webApp, user, hapticNotification } = useTelegram();
  const [copied, setCopied] = useState(false);
  const [referralsData, setReferralsData] = useState<MultiTierReferralsData | null>(null);
  const [isLoadingReferrals, setIsLoadingReferrals] = useState(true);
  const [expandedTiers, setExpandedTiers] = useState<Set<string>>(new Set(['tier1']));

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

  if (!isLoaded || isLoadingReferrals) {
    return (
      <div className="flex flex-1 flex-col bg-background p-4">
        <div className="h-32 bg-secondary rounded-xl animate-pulse mb-4" />
        <div className="h-12 bg-secondary rounded-lg animate-pulse mb-2" />
        <div className="h-12 bg-secondary rounded-lg animate-pulse mb-2" />
        <div className="h-12 bg-secondary rounded-lg animate-pulse" />
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

  const toggleTier = (tier: string) => {
    setExpandedTiers(prev => {
      const next = new Set(prev);
      if (next.has(tier)) {
        next.delete(tier);
      } else {
        next.add(tier);
      }
      return next;
    });
  };

  const tier1 = referralsData?.tier1 ?? { count: 0, referrals: [] };
  const tier2 = referralsData?.tier2 ?? { count: 0, referrals: [] };
  const tier3 = referralsData?.tier3 ?? { count: 0, referrals: [] };
  const earnings = referralsData?.earnings ?? { tier1: 0, tier2: 0, tier3: 0, total: 0 };
  const totalReferrals = tier1.count + tier2.count + tier3.count;

  return (
    <div className="flex flex-1 flex-col bg-background">
      {/* Hero Card */}
      <div className="p-4 pb-3">
        <Card className="p-4">
          <div className="flex items-start justify-between mb-4">
            <AvatarStack count={totalReferrals} />
            {totalReferrals === 0 && (
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="mb-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                <SlidingNumber value={totalReferrals} />
              </span>
              <span className="text-muted-foreground">
                {totalReferrals === 1 ? 'friend' : 'friends'}
              </span>
            </div>
            {earnings.total > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <Coins className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-muted-foreground">
                  <span className="text-foreground font-medium">
                    <SlidingNumber value={earnings.total} />
                  </span>
                  {' '}earned
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleInvite} className="flex-1 cursor-pointer">
              <UserPlus className="w-4 h-4 mr-2" />
              Invite
            </Button>
            <Button
              onClick={handleCopyLink}
              variant="secondary"
              className={cn("cursor-pointer", copied && "text-green-500")}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </Card>
      </div>

      {/* Referral Tiers Accordion */}
      <div className="flex-1 px-4 pb-4">
        <Card className="overflow-hidden">
          <TierSection
            tier="tier1"
            data={tier1}
            earnings={earnings.tier1}
            isExpanded={expandedTiers.has('tier1')}
            onToggle={() => toggleTier('tier1')}
          />
          <TierSection
            tier="tier2"
            data={tier2}
            earnings={earnings.tier2}
            isExpanded={expandedTiers.has('tier2')}
            onToggle={() => toggleTier('tier2')}
          />
          <TierSection
            tier="tier3"
            data={tier3}
            earnings={earnings.tier3}
            isExpanded={expandedTiers.has('tier3')}
            onToggle={() => toggleTier('tier3')}
          />
        </Card>
      </div>
    </div>
  );
}
