'use client';

import { useState, useEffect } from 'react';
import { useGame } from '@/components/GameProvider';
import { formatNumber } from '@/lib/storage';
import { useTelegram } from '@/hooks/useTelegram';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SlidingNumber } from '@/components/ui/sliding-number';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Avatar, AvatarImage, AvatarFallback, AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar';
import { Users, Copy, UserPlus, Check } from 'lucide-react';
import { GooseIcon } from '@/components/ui/goose-icon';
import { toast } from 'sonner';
import { REFERRAL_BONUSES, REFERRAL_PERCENTAGES } from '@/types/game';
import { cn } from '@/lib/utils';

interface ReferralInfo {
  telegramId: number;
  username: string | null;
  firstName: string;
  photoUrl: string | null;
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

// Generate color from name for fallback
const FALLBACK_COLORS = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];

function getFallbackColor(name: string) {
  return FALLBACK_COLORS[name.charCodeAt(0) % FALLBACK_COLORS.length];
}

function ReferralAvatar({ referral, size = 'default' }: { referral: ReferralInfo; size?: 'default' | 'sm' | 'lg' }) {
  return (
    <Avatar size={size}>
      <AvatarImage src={referral.photoUrl || undefined} alt={referral.firstName} />
      <AvatarFallback className={cn(getFallbackColor(referral.firstName), "text-white font-medium")}>
        {referral.firstName.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

function ReferralAvatarStack({ referrals, max = 5 }: { referrals: ReferralInfo[]; max?: number }) {
  const displayed = referrals.slice(0, max);
  const remaining = referrals.length - displayed.length;

  if (referrals.length === 0) return null;

  return (
    <AvatarGroup>
      {displayed.map((r) => (
        <ReferralAvatar key={r.telegramId} referral={r} size="sm" />
      ))}
      {remaining > 0 && (
        <AvatarGroupCount>+{remaining}</AvatarGroupCount>
      )}
    </AvatarGroup>
  );
}

function ReferralRow({ referral }: { referral: ReferralInfo }) {
  const timeAgo = getTimeAgo(new Date(referral.joinedAt));

  return (
    <div className="flex items-center gap-3 py-2.5 px-4">
      <ReferralAvatar referral={referral} size="sm" />
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

function TierContent({
  tier,
  data,
  earnings,
}: {
  tier: 'tier1' | 'tier2' | 'tier3';
  data: { count: number; referrals: ReferralInfo[] };
  earnings: number;
}) {
  return (
    <>
      {earnings > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50">
          <GooseIcon className="w-3.5 h-3.5" />
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
        <div className="py-8 text-center text-sm text-muted-foreground">
          {tier === 'tier1'
            ? 'Invite friends to start earning!'
            : tier === 'tier2'
              ? 'Your friends haven\'t invited anyone yet'
              : 'No level 3 referrals yet'}
        </div>
      )}
    </>
  );
}

export default function FriendsPage() {
  const { isLoaded, initData } = useGame();
  const { webApp, user, hapticNotification } = useTelegram();
  const [copied, setCopied] = useState(false);
  const [referralsData, setReferralsData] = useState<MultiTierReferralsData | null>(null);
  const [isLoadingReferrals, setIsLoadingReferrals] = useState(true);

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
      <div className="flex flex-1 flex-col overflow-auto bg-background p-4">
        <div className="h-32 bg-secondary rounded-xl animate-pulse mb-4" />
        <div className="h-12 bg-secondary rounded-lg animate-pulse mb-2" />
        <div className="h-12 bg-secondary rounded-lg animate-pulse mb-2" />
        <div className="h-12 bg-secondary rounded-lg animate-pulse" />
      </div>
    );
  }

  const handleInvite = () => {
    const userId = user?.id || 'demo';
    const referralLink = `https://t.me/goosetap_bot?start=ref_${userId}`;
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
    const referralLink = `https://t.me/goosetap_bot?start=ref_${userId}`;

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

  return (
    <div className="flex flex-1 flex-col overflow-auto bg-background">
      {/* Hero Card */}
      <div className="p-4 pb-3">
        <Card className="p-4">
          {/* Split layout: Friends | Earned */}
          <div className="flex gap-4 mb-4">
            {/* Left: Friends count + avatars */}
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">
                  <SlidingNumber value={totalReferrals} />
                </span>
                <span className="text-muted-foreground">
                  {totalReferrals === 1 ? 'friend' : 'friends'}
                </span>
              </div>
              <div className="mt-2">
                {totalReferrals > 0 ? (
                  <ReferralAvatarStack referrals={[...tier1.referrals, ...tier2.referrals, ...tier3.referrals]} />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <Users className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>

            {/* Right: Earned */}
            <div className="flex-1 text-right">
              <div className="flex items-baseline justify-end gap-2">
                <span className="text-3xl font-bold">
                  <SlidingNumber value={earnings.total} />
                </span>
              </div>
              <div className="flex items-center justify-end gap-1 mt-2 text-muted-foreground">
                <span className="text-sm">earned</span>
                <GooseIcon className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Buttons */}
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
        <Card className="overflow-hidden py-0">
          <Accordion type="single" collapsible defaultValue="tier1">
            <AccordionItem value="tier1">
              <AccordionTrigger>
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{TIER_CONFIG.tier1.label}</span>
                    <span className="text-sm text-muted-foreground">({tier1.count})</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>+{formatNumber(TIER_CONFIG.tier1.bonus)}</span>
                    <span className="text-green-500">+{TIER_CONFIG.tier1.percentage}%</span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <TierContent tier="tier1" data={tier1} earnings={earnings.tier1} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="tier2">
              <AccordionTrigger>
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{TIER_CONFIG.tier2.label}</span>
                    <span className="text-sm text-muted-foreground">({tier2.count})</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>+{formatNumber(TIER_CONFIG.tier2.bonus)}</span>
                    <span className="text-green-500">+{TIER_CONFIG.tier2.percentage}%</span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <TierContent tier="tier2" data={tier2} earnings={earnings.tier2} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="tier3">
              <AccordionTrigger>
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{TIER_CONFIG.tier3.label}</span>
                    <span className="text-sm text-muted-foreground">({tier3.count})</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>+{formatNumber(TIER_CONFIG.tier3.bonus)}</span>
                    <span className="text-green-500">+{TIER_CONFIG.tier3.percentage}%</span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <TierContent tier="tier3" data={tier3} earnings={earnings.tier3} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
      </div>
    </div>
  );
}
