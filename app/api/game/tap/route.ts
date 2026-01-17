import { NextResponse } from 'next/server';
import { validateInitDataWithDevFallback } from '@/lib/telegram-auth';
import { atomicTap, atomicBatchTap, dbRowToGameState, getUser } from '@/lib/db';
import { calculateLevel } from '@/types/game';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { initData, count = 1 } = body as { initData: string; count?: number };

    if (!initData) {
      return NextResponse.json(
        { error: 'Missing initData' },
        { status: 400 }
      );
    }

    // Validate Telegram initData
    const validation = validateInitDataWithDevFallback(initData);
    if (!validation.valid || !validation.user) {
      return NextResponse.json(
        { error: validation.error || 'Invalid initData' },
        { status: 401 }
      );
    }

    const { user } = validation;

    // Get current user state to check coinsPerTap
    const currentUser = await getUser(user.id);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    let dbUser;

    // Single tap or batch tap
    if (count === 1) {
      dbUser = await atomicTap(user.id, currentUser.coins_per_tap);
    } else {
      dbUser = await atomicBatchTap(user.id, count, currentUser.coins_per_tap);
    }

    if (!dbUser) {
      return NextResponse.json(
        { error: 'Not enough energy' },
        { status: 400 }
      );
    }

    // Calculate and update level if needed
    const state = dbRowToGameState(dbUser);
    const newLevel = calculateLevel(state.coins);

    if (newLevel !== state.level) {
      state.level = newLevel;
    }

    return NextResponse.json({
      success: true,
      state,
      tapped: count,
      coinsEarned: count * currentUser.coins_per_tap,
    });
  } catch (error) {
    console.error('Tap error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
