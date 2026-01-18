import { NextResponse } from 'next/server'
import { validateInitDataWithDevFallback } from '@/lib/telegram-auth'
import { sql } from '@/lib/db'

// Debug endpoint to check user data
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const initData = searchParams.get('initData')

    if (!initData) {
      return NextResponse.json({ error: 'Missing initData' }, { status: 400 })
    }

    const validation = await validateInitDataWithDevFallback(initData)
    if (!validation.valid || !validation.user) {
      return NextResponse.json({ error: 'Invalid initData' }, { status: 401 })
    }

    const { rows } = await sql`
      SELECT
        telegram_id,
        username,
        first_name,
        coins,
        level,
        total_taps,
        daily_taps,
        last_daily_taps_reset,
        referrals,
        referred_by
      FROM users
      WHERE telegram_id = ${validation.user.id}
    `

    if (rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = rows[0]

    return NextResponse.json({
      telegramId: user.telegram_id,
      username: user.username,
      firstName: user.first_name,
      coins: user.coins,
      level: user.level,
      totalTaps: user.total_taps,
      dailyTaps: user.daily_taps,
      lastDailyTapsReset: user.last_daily_taps_reset,
      referrals: user.referrals,
      referralsType: typeof user.referrals,
      referralsIsArray: Array.isArray(user.referrals),
      referralsLength: Array.isArray(user.referrals) ? user.referrals.length : 'N/A',
      referredBy: user.referred_by,
    })
  } catch (error) {
    console.error('[Debug] Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
