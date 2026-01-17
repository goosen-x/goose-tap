import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

const REFERRAL_BONUS = 10000

// Manual fix: set referred_by for a user and add to referrer's list
export async function POST(request: Request) {
  try {
    const { userId, referrerId } = await request.json()

    if (!userId || !referrerId) {
      return NextResponse.json({ error: 'Missing userId or referrerId' }, { status: 400 })
    }

    // Get the user to be added as referral
    const { rows: userRows } = await sql`
      SELECT telegram_id, username, first_name, referred_by, created_at
      FROM users WHERE telegram_id = ${userId}
    `

    if (userRows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = userRows[0]

    // Get the referrer
    const { rows: referrerRows } = await sql`
      SELECT telegram_id, username, referrals, coins
      FROM users WHERE telegram_id = ${referrerId}
    `

    if (referrerRows.length === 0) {
      return NextResponse.json({ error: 'Referrer not found' }, { status: 404 })
    }

    const referrer = referrerRows[0]
    const currentReferrals = referrer.referrals || []

    // Check if already in referrals
    const alreadyExists = currentReferrals.some((r: { username?: string; firstName?: string }) =>
      (r.username && r.username === user.username) ||
      (r.firstName === user.first_name)
    )

    if (alreadyExists) {
      return NextResponse.json({
        message: 'User already in referrals',
        user: user.username || user.first_name,
        referrer: referrer.username
      })
    }

    // Update user's referred_by
    await sql`
      UPDATE users SET referred_by = ${referrerId}
      WHERE telegram_id = ${userId}
    `

    // Add to referrer's referrals and give bonus
    const newReferral = {
      id: `ref-manual-${userId}`,
      username: user.username || undefined,
      firstName: user.first_name || 'Anonymous',
      coins: 0,
      joinedAt: new Date(user.created_at).getTime(),
    }

    const updatedReferrals = [...currentReferrals, newReferral]

    await sql`
      UPDATE users SET
        referrals = ${JSON.stringify(updatedReferrals)}::jsonb,
        coins = coins + ${REFERRAL_BONUS}
      WHERE telegram_id = ${referrerId}
    `

    return NextResponse.json({
      success: true,
      message: `Added ${user.username || user.first_name} as referral of ${referrer.username}`,
      bonusAwarded: REFERRAL_BONUS,
      newReferrerCoins: Number(referrer.coins) + REFERRAL_BONUS
    })
  } catch (error) {
    console.error('[Fix Referral] Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
