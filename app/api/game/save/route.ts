import { NextResponse } from 'next/server';
import { validateInitDataWithDevFallback } from '@/lib/telegram-auth';
import { updateUserState, dbRowToGameState } from '@/lib/db';
import { GameState } from '@/types/game';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { initData, state } = body as { initData: string; state: GameState };

    if (!initData) {
      return NextResponse.json(
        { error: 'Missing initData' },
        { status: 400 }
      );
    }

    if (!state) {
      return NextResponse.json(
        { error: 'Missing state' },
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

    // Update user state in database
    const dbUser = await updateUserState(user.id, state);

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      state: dbRowToGameState(dbUser),
    });
  } catch (error) {
    console.error('Save game error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
