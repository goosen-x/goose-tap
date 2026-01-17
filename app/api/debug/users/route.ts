import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// Debug endpoint to list all users and their referral status
export async function GET() {
  try {
    const { rows } = await sql`
      SELECT
        telegram_id,
        username,
        first_name,
        coins,
        level,
        referred_by,
        referrals,
        created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 20
    `

    const users = rows.map(row => ({
      telegramId: row.telegram_id,
      username: row.username,
      firstName: row.first_name,
      coins: row.coins,
      level: row.level,
      referredBy: row.referred_by,
      referralsCount: Array.isArray(row.referrals) ? row.referrals.length : 0,
      referrals: row.referrals,
      createdAt: row.created_at,
    }))

    return NextResponse.json({ users })
  } catch (error) {
    console.error('[Debug] Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
