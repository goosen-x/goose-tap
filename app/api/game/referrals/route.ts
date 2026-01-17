import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { validateInitDataWithDevFallback } from '@/lib/telegram-auth';

// Referral data for UI display
interface ReferralInfo {
  telegramId: number;
  username: string | null;
  firstName: string;
  joinedAt: string;
}

interface MultiTierReferralsResponse {
  tier1: {
    count: number;
    referrals: ReferralInfo[];
  };
  tier2: {
    count: number;
    referrals: ReferralInfo[];
  };
  tier3: {
    count: number;
    referrals: ReferralInfo[];
  };
  earnings: {
    tier1: number;
    tier2: number;
    tier3: number;
    total: number;
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { initData } = body;

    if (!initData) {
      return NextResponse.json({ error: 'Missing initData' }, { status: 400 });
    }

    // Validate Telegram data
    const validation = await validateInitDataWithDevFallback(initData);
    if (!validation.valid || !validation.user) {
      return NextResponse.json({ error: validation.error || 'Invalid Telegram auth' }, { status: 401 });
    }

    const telegramId = validation.user.id;

    // Get current user's earnings
    const { rows: userRows } = await sql`
      SELECT
        COALESCE(referral_earnings_t1, 0) as earnings_t1,
        COALESCE(referral_earnings_t2, 0) as earnings_t2,
        COALESCE(referral_earnings_t3, 0) as earnings_t3
      FROM users
      WHERE telegram_id = ${telegramId}
    `;

    const earnings = {
      tier1: Number(userRows[0]?.earnings_t1) || 0,
      tier2: Number(userRows[0]?.earnings_t2) || 0,
      tier3: Number(userRows[0]?.earnings_t3) || 0,
      total: 0,
    };
    earnings.total = earnings.tier1 + earnings.tier2 + earnings.tier3;

    // Get tier 1 referrals (users who have this user as referrer_t1)
    const { rows: tier1Rows } = await sql<ReferralInfo>`
      SELECT telegram_id as "telegramId", username, first_name as "firstName", created_at as "joinedAt"
      FROM users
      WHERE referrer_t1 = ${telegramId}
      ORDER BY created_at DESC
      LIMIT 100
    `;

    // Get tier 2 referrals (users who have this user as referrer_t2)
    const { rows: tier2Rows } = await sql<ReferralInfo>`
      SELECT telegram_id as "telegramId", username, first_name as "firstName", created_at as "joinedAt"
      FROM users
      WHERE referrer_t2 = ${telegramId}
      ORDER BY created_at DESC
      LIMIT 100
    `;

    // Get tier 3 referrals (users who have this user as referrer_t3)
    const { rows: tier3Rows } = await sql<ReferralInfo>`
      SELECT telegram_id as "telegramId", username, first_name as "firstName", created_at as "joinedAt"
      FROM users
      WHERE referrer_t3 = ${telegramId}
      ORDER BY created_at DESC
      LIMIT 100
    `;

    const response: MultiTierReferralsResponse = {
      tier1: {
        count: tier1Rows.length,
        referrals: tier1Rows.map(r => ({
          telegramId: r.telegramId,
          username: r.username,
          firstName: r.firstName || 'Anonymous',
          joinedAt: r.joinedAt,
        })),
      },
      tier2: {
        count: tier2Rows.length,
        referrals: tier2Rows.map(r => ({
          telegramId: r.telegramId,
          username: r.username,
          firstName: r.firstName || 'Anonymous',
          joinedAt: r.joinedAt,
        })),
      },
      tier3: {
        count: tier3Rows.length,
        referrals: tier3Rows.map(r => ({
          telegramId: r.telegramId,
          username: r.username,
          firstName: r.firstName || 'Anonymous',
          joinedAt: r.joinedAt,
        })),
      },
      earnings,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Referrals API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load referrals' },
      { status: 500 }
    );
  }
}
