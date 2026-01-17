import { NextResponse } from 'next/server';
import { validateInitDataWithDevFallback } from '@/lib/telegram-auth';
import { atomicTap, atomicBatchTap, dbRowToGameState, getUser, updateUserState } from '@/lib/db';
import { calculateLevelFromXP, calculateLevelBonuses, calculateTotalBonus, XP_REWARDS } from '@/types/game';

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
    const validation = await validateInitDataWithDevFallback(initData);
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

    // Convert to state and check if level changed
    let state = dbRowToGameState(dbUser);
    const newLevel = calculateLevelFromXP(state.xp);

    // Update level and recalculate stats if level changed
    if (newLevel !== state.level) {
      const levelBonus = calculateLevelBonuses(newLevel);
      const upgradeBonus = {
        tap: calculateTotalBonus(state.upgrades, 'tap'),
        hour: calculateTotalBonus(state.upgrades, 'hour'),
        energy: calculateTotalBonus(state.upgrades, 'energy'),
      };

      const newCoinsPerTap = 1 + upgradeBonus.tap + levelBonus.totalCoinsPerTap;
      const newCoinsPerHour = Math.floor(upgradeBonus.hour * levelBonus.passiveIncomeMultiplier);
      const newMaxEnergy = 1000 + upgradeBonus.energy + levelBonus.totalMaxEnergy;

      const updatedUser = await updateUserState(user.id, {
        level: newLevel,
        coinsPerTap: newCoinsPerTap,
        coinsPerHour: newCoinsPerHour,
        maxEnergy: newMaxEnergy,
      });

      state = dbRowToGameState(updatedUser);
    }

    return NextResponse.json({
      success: true,
      state,
      tapped: count,
      coinsEarned: count * currentUser.coins_per_tap,
      xpEarned: count * XP_REWARDS.tap,
    });
  } catch (error) {
    console.error('Tap error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
