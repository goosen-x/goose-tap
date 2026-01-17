import { NextResponse } from 'next/server';
import { validateInitDataWithDevFallback } from '@/lib/telegram-auth';
import { getUser, dbRowToGameState, sql, DbUser } from '@/lib/db';
import {
  canClaimDaily,
  shouldResetStreak,
  getDailyReward,
  DAILY_REWARDS,
  calculateLevelFromXP,
  calculateLevelBonuses,
  calculateTotalBonus,
} from '@/types/game';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const initData = searchParams.get('initData');

    if (!initData) {
      return NextResponse.json(
        { error: 'Missing initData' },
        { status: 400 }
      );
    }

    const validation = await validateInitDataWithDevFallback(initData);
    if (!validation.valid || !validation.user) {
      return NextResponse.json(
        { error: validation.error || 'Invalid initData' },
        { status: 401 }
      );
    }

    const { user } = validation;
    const dbUser = await getUser(user.id);

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const lastClaim = dbUser.last_daily_claim
      ? new Date(dbUser.last_daily_claim).getTime()
      : null;

    let currentStreak = dbUser.daily_streak || 0;

    // Check if streak should be reset
    if (shouldResetStreak(lastClaim)) {
      currentStreak = 0;
    }

    const canClaim = canClaimDaily(lastClaim);
    const nextReward = getDailyReward(currentStreak);

    return NextResponse.json({
      canClaim,
      currentStreak,
      nextReward,
      allRewards: DAILY_REWARDS,
      lastClaim,
    });
  } catch (error) {
    console.error('Daily status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { initData } = body as { initData: string };

    if (!initData) {
      return NextResponse.json(
        { error: 'Missing initData' },
        { status: 400 }
      );
    }

    const validation = await validateInitDataWithDevFallback(initData);
    if (!validation.valid || !validation.user) {
      return NextResponse.json(
        { error: validation.error || 'Invalid initData' },
        { status: 401 }
      );
    }

    const { user } = validation;
    const dbUser = await getUser(user.id);

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const lastClaim = dbUser.last_daily_claim
      ? new Date(dbUser.last_daily_claim).getTime()
      : null;

    // Check if can claim
    if (!canClaimDaily(lastClaim)) {
      return NextResponse.json(
        { error: 'Already claimed today' },
        { status: 400 }
      );
    }

    // Calculate new streak
    let newStreak = dbUser.daily_streak || 0;

    // Reset streak if more than 48 hours since last claim
    if (shouldResetStreak(lastClaim)) {
      newStreak = 0;
    }

    // Get reward for current streak (before incrementing)
    const reward = getDailyReward(newStreak);

    // Increment streak (cap at 7 for display, but continues cycling)
    newStreak += 1;

    // Update user with reward
    const { rows } = await sql<DbUser>`
      UPDATE users SET
        coins = coins + ${reward.coins},
        xp = xp + ${reward.xp},
        daily_streak = ${newStreak},
        last_daily_claim = NOW(),
        updated_at = NOW()
      WHERE telegram_id = ${user.id}
      RETURNING *
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    // Convert to state and check level
    let state = dbRowToGameState(rows[0]);
    const newLevel = calculateLevelFromXP(state.xp);

    // Update level if changed
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

      const { rows: updatedRows } = await sql<DbUser>`
        UPDATE users SET
          level = ${newLevel},
          coins_per_tap = ${newCoinsPerTap},
          coins_per_hour = ${newCoinsPerHour},
          max_energy = ${newMaxEnergy}
        WHERE telegram_id = ${user.id}
        RETURNING *
      `;

      state = dbRowToGameState(updatedRows[0]);
    }

    return NextResponse.json({
      success: true,
      reward,
      newStreak,
      state,
    });
  } catch (error) {
    console.error('Daily claim error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
