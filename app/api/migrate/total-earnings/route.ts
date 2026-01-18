import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    // Add total_earnings column if it doesn't exist
    await sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS total_earnings BIGINT DEFAULT 0
    `;

    // Initialize total_earnings from existing data:
    // total_earnings = current coins + spent on upgrades (approximation)
    // For now, just set it to current coins as a baseline
    await sql`
      UPDATE users
      SET total_earnings = coins
      WHERE total_earnings = 0 OR total_earnings IS NULL
    `;

    // Get stats
    const { rows } = await sql`
      SELECT
        COUNT(*) as total_users,
        SUM(total_earnings) as total_earnings_sum
      FROM users
    `;

    return NextResponse.json({
      success: true,
      message: 'Migration completed: total_earnings column added',
      stats: {
        totalUsers: rows[0]?.total_users || 0,
        totalEarningsSum: rows[0]?.total_earnings_sum || 0,
      },
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: String(error) },
      { status: 500 }
    );
  }
}
