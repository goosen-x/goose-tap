import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST() {
  try {
    console.log('[Migration] Starting multi-tier referrals migration...');

    // 1. Add referrer chain columns (denormalized for performance)
    console.log('[Migration] Adding referrer columns...');
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS referrer_t1 BIGINT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS referrer_t2 BIGINT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS referrer_t3 BIGINT`;

    // 2. Add referral earnings columns
    console.log('[Migration] Adding referral earnings columns...');
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_earnings_t1 BIGINT DEFAULT 0`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_earnings_t2 BIGINT DEFAULT 0`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_earnings_t3 BIGINT DEFAULT 0`;

    // 3. Fill referrer_t1 from existing referred_by
    console.log('[Migration] Populating referrer_t1 from referred_by...');
    await sql`UPDATE users SET referrer_t1 = referred_by WHERE referred_by IS NOT NULL AND referrer_t1 IS NULL`;

    // 4. Fill referrer_t2 (parent of referrer_t1)
    console.log('[Migration] Populating referrer_t2...');
    await sql`
      UPDATE users u SET referrer_t2 = r.referred_by
      FROM users r
      WHERE u.referrer_t1 = r.telegram_id
        AND r.referred_by IS NOT NULL
        AND u.referrer_t2 IS NULL
    `;

    // 5. Fill referrer_t3 (parent of referrer_t2)
    console.log('[Migration] Populating referrer_t3...');
    await sql`
      UPDATE users u SET referrer_t3 = r.referred_by
      FROM users r
      WHERE u.referrer_t2 = r.telegram_id
        AND r.referred_by IS NOT NULL
        AND u.referrer_t3 IS NULL
    `;

    // 6. Create indexes for faster lookups
    console.log('[Migration] Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_users_referrer_t1 ON users(referrer_t1)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_referrer_t2 ON users(referrer_t2)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_referrer_t3 ON users(referrer_t3)`;

    // Get stats for verification
    const stats = await sql`
      SELECT
        COUNT(*) as total_users,
        COUNT(referrer_t1) as users_with_t1,
        COUNT(referrer_t2) as users_with_t2,
        COUNT(referrer_t3) as users_with_t3
      FROM users
    `;

    console.log('[Migration] Multi-tier referrals migration completed!', stats.rows[0]);

    return NextResponse.json({
      success: true,
      message: 'Multi-tier referrals migration completed',
      stats: stats.rows[0]
    });
  } catch (error) {
    console.error('[Migration] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Migration failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Check current state of migration
    const stats = await sql`
      SELECT
        COUNT(*) as total_users,
        COUNT(referrer_t1) as users_with_t1,
        COUNT(referrer_t2) as users_with_t2,
        COUNT(referrer_t3) as users_with_t3,
        SUM(COALESCE(referral_earnings_t1, 0)) as total_earnings_t1,
        SUM(COALESCE(referral_earnings_t2, 0)) as total_earnings_t2,
        SUM(COALESCE(referral_earnings_t3, 0)) as total_earnings_t3
      FROM users
    `;

    return NextResponse.json({
      message: 'Multi-tier referrals migration status',
      stats: stats.rows[0],
      hint: 'Use POST to run migration'
    });
  } catch (error) {
    return NextResponse.json({
      message: 'Migration not yet applied or columns missing',
      hint: 'Use POST to run migration',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
