import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

// Debug endpoint to check user by telegram_id (no auth required)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const telegramId = searchParams.get('id')

    if (!telegramId) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
    }

    const { rows } = await sql`
      SELECT
        telegram_id,
        username,
        first_name,
        coins,
        total_earnings,
        level,
        upgrades
      FROM users
      WHERE telegram_id = ${telegramId}
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
      totalEarnings: user.total_earnings,
      level: user.level,
      upgrades: user.upgrades,
    })
  } catch (error) {
    console.error('[Debug] Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
