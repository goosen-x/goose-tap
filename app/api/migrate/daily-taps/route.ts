import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST() {
  try {
    // Add daily_taps column
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_taps INTEGER DEFAULT 0`;

    // Add last_daily_taps_reset column
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_daily_taps_reset TIMESTAMP DEFAULT NOW()`;

    return NextResponse.json({ success: true, message: 'Daily taps migration completed' });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Migration failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST to run daily taps migration' });
}
