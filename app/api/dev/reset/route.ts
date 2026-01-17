import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

const DEV_USER_ID = 123456789

export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not in development' }, { status: 403 })
  }

  try {
    // Delete the dev user - will be recreated on next load
    await sql`DELETE FROM users WHERE telegram_id = ${DEV_USER_ID}`

    return NextResponse.json({ success: true, message: 'Dev user reset' })
  } catch (error) {
    console.error('[dev/reset] Error:', error)
    return NextResponse.json(
      { error: 'Reset failed', details: String(error) },
      { status: 500 }
    )
  }
}
