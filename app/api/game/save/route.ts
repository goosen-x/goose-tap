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
    const validation = await validateInitDataWithDevFallback(initData);
    if (!validation.valid || !validation.user) {
      return NextResponse.json(
        { error: validation.error || 'Invalid initData' },
        { status: 401 }
      );
    }

    const { user } = validation;

    // IMPORTANT: Don't allow client to overwrite server-managed fields:
    // - dailyTaps, lastDailyTapsReset, tasks - managed by loadGame reset logic
    // - totalTaps - managed by atomicTap/atomicBatchTap
    // - referrals, referralEarnings - managed by server-side referral processing
    const safeState: Partial<GameState> = {
      coins: state.coins,
      xp: state.xp,
      energy: state.energy,
      maxEnergy: state.maxEnergy,
      coinsPerTap: state.coinsPerTap,
      coinsPerHour: state.coinsPerHour,
      level: state.level,
      upgrades: state.upgrades,
      lastEnergyUpdate: state.lastEnergyUpdate,
      lastOfflineEarnings: state.lastOfflineEarnings,
    };

    // Update user state in database (with safe fields only)
    const dbUser = await updateUserState(user.id, safeState);

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
