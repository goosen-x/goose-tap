'use server'

import { cacheTag, cacheLife } from 'next/cache'
import { sql } from '@/lib/db'
import { LeaderboardEntry, LeaderboardResponse } from '@/types/game'
import { validateInitDataWithDevFallback } from '@/lib/telegram-auth'

// Dev user ID - only visible in development mode
const DEV_USER_ID = 123456789
const IS_DEV = process.env.NODE_ENV === 'development'

/**
 * Cached leaderboard list - shared across all users
 * Cache key: limit + offset (pagination params)
 */
async function getCachedLeaderboardList(limit: number, offset: number) {
  'use cache'
  cacheTag('leaderboard')
  cacheLife('leaderboard') // Uses custom profile from next.config.ts

  const { rows } = await sql<{
    telegram_id: number
    first_name: string | null
    username: string | null
    photo_url: string | null
    total_earnings: number
    level: number
    rank: number
  }>`
    SELECT * FROM (
      SELECT
        telegram_id,
        first_name,
        username,
        photo_url,
        COALESCE(total_earnings, 0) as total_earnings,
        level,
        ROW_NUMBER() OVER (ORDER BY COALESCE(total_earnings, 0) DESC) as rank
      FROM users
      WHERE COALESCE(total_earnings, 0) > 0 AND (${IS_DEV} OR telegram_id != ${DEV_USER_ID})
    ) ranked
    ORDER BY rank
    LIMIT ${limit + 1}
    OFFSET ${offset}
  `

  return rows
}

/**
 * Cached total players count
 */
async function getCachedTotalPlayers() {
  'use cache'
  cacheTag('leaderboard')
  cacheLife('leaderboard')

  const { rows } = await sql<{ total: number }>`
    SELECT COUNT(*) as total FROM users
    WHERE COALESCE(total_earnings, 0) > 0 AND (${IS_DEV} OR telegram_id != ${DEV_USER_ID})
  `

  return Number(rows[0]?.total || 0)
}

/**
 * Get current user's rank - NOT cached (per-user data)
 */
async function getCurrentUserRank(telegramId: number) {
  const { rows } = await sql<{
    rank: number
    total_earnings: number
    level: number
  }>`
    SELECT
      (SELECT COUNT(*) + 1 FROM users WHERE COALESCE(total_earnings, 0) > COALESCE(u.total_earnings, 0) AND (${IS_DEV} OR telegram_id != ${DEV_USER_ID})) as rank,
      COALESCE(u.total_earnings, 0) as total_earnings,
      u.level
    FROM users u
    WHERE u.telegram_id = ${telegramId}
  `

  if (rows.length === 0) return null

  return {
    rank: Number(rows[0].rank),
    coins: Number(rows[0].total_earnings),
    level: rows[0].level,
  }
}

/**
 * Main leaderboard action - combines cached list with per-user data
 */
export async function getLeaderboard(
  initData: string,
  limit: number = 20,
  offset: number = 0
): Promise<LeaderboardResponse> {
  // Validate user
  let currentTelegramId: number | null = null
  const validation = await validateInitDataWithDevFallback(initData)
  if (validation.valid && validation.user) {
    currentTelegramId = validation.user.id
  }

  // Fetch cached data in parallel
  const [leaderboardRows, totalPlayers] = await Promise.all([
    getCachedLeaderboardList(Math.min(limit, 50), Math.max(offset, 0)),
    getCachedTotalPlayers(),
  ])

  // Check pagination
  const hasMore = leaderboardRows.length > limit
  const results = hasMore ? leaderboardRows.slice(0, limit) : leaderboardRows

  // Map to LeaderboardEntry (coins field shows totalEarnings for display)
  const leaderboard: LeaderboardEntry[] = results.map((row) => ({
    rank: Number(row.rank),
    telegramId: row.telegram_id,
    firstName: row.first_name || 'Anonymous',
    username: row.username,
    photoUrl: row.photo_url || null,
    coins: Number(row.total_earnings),
    level: row.level,
  }))

  // Get current user's rank (not cached)
  const currentUser = currentTelegramId
    ? await getCurrentUserRank(currentTelegramId)
    : null

  return {
    leaderboard,
    currentUser,
    totalPlayers,
    hasMore,
  }
}
