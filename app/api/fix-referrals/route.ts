import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

const REFERRAL_BONUS = 10000;

interface DbUser {
  id: number;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  coins: number;
  referrals: Array<{
    id: string;
    username?: string;
    firstName: string;
    coins: number;
    joinedAt: number;
  }>;
  referred_by: number | null;
  created_at: Date;
}

export async function POST(request: Request) {
  try {
    // Get all users
    const { rows: allUsers } = await sql<DbUser>`SELECT * FROM users`;

    const fixes: string[] = [];
    const updates: Array<{ referrerId: number; referrals: DbUser['referrals']; coinsToAdd: number }> = [];

    // Build a map of telegram_id -> user
    const userMap = new Map<number, DbUser>();
    for (const user of allUsers) {
      userMap.set(user.telegram_id, user);
    }

    // Find users who were referred (have referred_by set)
    const referredUsers = allUsers.filter(u => u.referred_by !== null);

    // Group by referrer
    const referrerMap = new Map<number, DbUser[]>();
    for (const user of referredUsers) {
      const referrerId = user.referred_by!;
      if (!referrerMap.has(referrerId)) {
        referrerMap.set(referrerId, []);
      }
      referrerMap.get(referrerId)!.push(user);
    }

    // Check each referrer
    for (const [referrerId, referredList] of referrerMap) {
      const referrer = userMap.get(referrerId);
      if (!referrer) {
        fixes.push(`Referrer ${referrerId} not found in database`);
        continue;
      }

      const currentReferrals = referrer.referrals || [];
      const currentReferralIds = new Set(
        currentReferrals.map(r => {
          // Try to match by username or firstName+joinedAt
          return r.username || r.firstName;
        })
      );

      const missingReferrals: DbUser[] = [];

      for (const referred of referredList) {
        // Check if this referral is already in the array
        const identifier = referred.username || referred.first_name;
        const alreadyExists = currentReferrals.some(r =>
          (r.username && r.username === referred.username) ||
          (r.firstName === referred.first_name)
        );

        if (!alreadyExists) {
          missingReferrals.push(referred);
          fixes.push(`Missing: ${referred.first_name} (@${referred.username}) should be in @${referrer.username}'s referrals`);
        }
      }

      if (missingReferrals.length > 0) {
        // Build new referrals array
        const newReferrals = [...currentReferrals];
        for (const missing of missingReferrals) {
          newReferrals.push({
            id: `ref-fix-${missing.telegram_id}`,
            username: missing.username || undefined,
            firstName: missing.first_name || 'Anonymous',
            coins: 0,
            joinedAt: new Date(missing.created_at).getTime(),
          });
        }

        updates.push({
          referrerId: referrer.telegram_id,
          referrals: newReferrals,
          coinsToAdd: missingReferrals.length * REFERRAL_BONUS,
        });
      }
    }

    // Apply fixes
    for (const update of updates) {
      await sql`
        UPDATE users SET
          referrals = ${JSON.stringify(update.referrals)}::jsonb,
          coins = coins + ${update.coinsToAdd},
          updated_at = NOW()
        WHERE telegram_id = ${update.referrerId}
      `;
      fixes.push(`Fixed: Added ${update.coinsToAdd} coins to ${update.referrerId}`);
    }

    return NextResponse.json({
      success: true,
      fixes,
      updatesApplied: updates.length,
    });
  } catch (error) {
    console.error('Fix referrals error:', error);
    return NextResponse.json(
      { error: 'Failed to fix referrals', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint to fix referral data',
    warning: 'This will modify database records'
  });
}
