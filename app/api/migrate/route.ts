import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST() {
  try {
    // Add xp column
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0`;

    // Add photo_url column (if not exists)
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT`;

    // Add daily_streak column (if not exists)
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_streak INTEGER DEFAULT 0`;

    // Add last_daily_claim column (if not exists)
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_daily_claim TIMESTAMP`;

    // Add total_taps column (if not exists)
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS total_taps INTEGER DEFAULT 0`;

    return NextResponse.json({ success: true, message: 'Migration completed' });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Migration failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST to run migration' });
}
