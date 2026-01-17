import { NextResponse } from 'next/server';
import { validateInitDataWithDevFallback } from '@/lib/telegram-auth';
import { sql } from '@/lib/db';
import { LeaderboardEntry, LeaderboardResponse } from '@/types/game';

// Dev user ID - only visible in development mode
const DEV_USER_ID = 123456789;
const IS_DEV = process.env.NODE_ENV === 'development';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const initData = searchParams.get('initData');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);

    // Validate initData if provided
    let currentTelegramId: number | null = null;
    if (initData) {
      const validation = await validateInitDataWithDevFallback(initData);
      if (validation.valid && validation.user) {
        currentTelegramId = validation.user.id;
      }
    }

    // Get top players with pagination
    // Use subquery to ensure ROW_NUMBER calculates global rank before pagination
    // Dev user only visible in development mode
    const { rows: leaderboardRows } = await sql<{
      telegram_id: number;
      first_name: string | null;
      username: string | null;
      photo_url: string | null;
      coins: number;
      level: number;
      rank: number;
    }>`
      SELECT * FROM (
        SELECT
          telegram_id,
          first_name,
          username,
          photo_url,
          coins,
          level,
          ROW_NUMBER() OVER (ORDER BY coins DESC) as rank
        FROM users
        WHERE coins > 0 AND (${IS_DEV} OR telegram_id != ${DEV_USER_ID})
      ) ranked
      ORDER BY rank
      LIMIT ${limit + 1}
      OFFSET ${offset}
    `;

    // Check if there are more results
    const hasMore = leaderboardRows.length > limit;
    const results = hasMore ? leaderboardRows.slice(0, limit) : leaderboardRows;

    // Map to LeaderboardEntry
    const leaderboard: LeaderboardEntry[] = results.map((row) => ({
      rank: Number(row.rank),
      telegramId: row.telegram_id,
      firstName: row.first_name || 'Anonymous',
      username: row.username,
      photoUrl: row.photo_url || null,
      coins: Number(row.coins),
      level: row.level,
    }));

    // Get current user's rank if initData provided
    // Dev user only counted in development mode
    let currentUser: LeaderboardResponse['currentUser'] = null;
    if (currentTelegramId) {
      const { rows: userRows } = await sql<{
        rank: number;
        coins: number;
        level: number;
      }>`
        SELECT
          (SELECT COUNT(*) + 1 FROM users WHERE coins > u.coins AND (${IS_DEV} OR telegram_id != ${DEV_USER_ID})) as rank,
          u.coins,
          u.level
        FROM users u
        WHERE u.telegram_id = ${currentTelegramId}
      `;

      if (userRows.length > 0) {
        currentUser = {
          rank: Number(userRows[0].rank),
          coins: Number(userRows[0].coins),
          level: userRows[0].level,
        };
      }
    }

    // Get total players count (dev user only in development)
    const { rows: countRows } = await sql<{ total: number }>`
      SELECT COUNT(*) as total FROM users WHERE coins > 0 AND (${IS_DEV} OR telegram_id != ${DEV_USER_ID})
    `;
    const totalPlayers = Number(countRows[0]?.total || 0);

    const response: LeaderboardResponse = {
      leaderboard,
      currentUser,
      totalPlayers,
      hasMore,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
