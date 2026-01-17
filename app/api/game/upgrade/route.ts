import { NextResponse } from 'next/server';
import { validateInitDataWithDevFallback } from '@/lib/telegram-auth';
import { getUser, updateUserState, dbRowToGameState } from '@/lib/db';
import {
  UPGRADES,
  UserUpgrade,
  calculateUpgradeCost,
  calculateTotalBonus,
  calculateLevelFromXP,
  calculateLevelBonuses,
  XP_REWARDS,
} from '@/types/game';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { initData, upgradeId } = body as { initData: string; upgradeId: string };

    if (!initData) {
      return NextResponse.json(
        { error: 'Missing initData' },
        { status: 400 }
      );
    }

    if (!upgradeId) {
      return NextResponse.json(
        { error: 'Missing upgradeId' },
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

    // Find upgrade definition
    const upgrade = UPGRADES.find((u) => u.id === upgradeId);
    if (!upgrade) {
      return NextResponse.json(
        { error: 'Upgrade not found' },
        { status: 404 }
      );
    }

    // Get current user state
    const dbUser = await getUser(user.id);
    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const state = dbRowToGameState(dbUser);

    // Check current upgrade level
    const existingUpgrade = state.upgrades.find((u) => u.upgradeId === upgradeId);
    const currentLevel = existingUpgrade?.level ?? 0;

    // Check if max level reached
    if (currentLevel >= upgrade.maxLevel) {
      return NextResponse.json(
        { error: 'Max level reached' },
        { status: 400 }
      );
    }

    // Calculate cost
    const cost = calculateUpgradeCost(upgrade, currentLevel);

    // Check if user has enough coins
    if (state.coins < cost) {
      return NextResponse.json(
        { error: 'Not enough coins' },
        { status: 400 }
      );
    }

    // Create new upgrades array
    const newUpgradeLevel = currentLevel + 1;
    const newUpgrades: UserUpgrade[] = existingUpgrade
      ? state.upgrades.map((u) =>
          u.upgradeId === upgradeId ? { ...u, level: u.level + 1 } : u
        )
      : [...state.upgrades, { upgradeId, level: 1 }];

    // Award XP for upgrade (100 * upgrade level)
    const xpGained = XP_REWARDS.upgrade * newUpgradeLevel;
    const newXP = state.xp + xpGained;
    const newLevel = calculateLevelFromXP(newXP);

    // Calculate upgrade bonuses
    const upgradeBonus = {
      tap: calculateTotalBonus(newUpgrades, 'tap'),
      hour: calculateTotalBonus(newUpgrades, 'hour'),
      energy: calculateTotalBonus(newUpgrades, 'energy'),
    };

    // Calculate level bonuses
    const levelBonus = calculateLevelBonuses(newLevel);

    // Combined stats
    const newCoinsPerTap = 1 + upgradeBonus.tap + levelBonus.totalCoinsPerTap;
    const newCoinsPerHour = Math.floor(upgradeBonus.hour * levelBonus.passiveIncomeMultiplier);
    const newMaxEnergy = 1000 + upgradeBonus.energy + levelBonus.totalMaxEnergy;

    // Update user state
    const updatedUser = await updateUserState(user.id, {
      coins: state.coins - cost,
      xp: newXP,
      level: newLevel,
      upgrades: newUpgrades,
      coinsPerTap: newCoinsPerTap,
      coinsPerHour: newCoinsPerHour,
      maxEnergy: newMaxEnergy,
    });

    return NextResponse.json({
      success: true,
      state: dbRowToGameState(updatedUser),
      cost,
      newLevel: currentLevel + 1,
    });
  } catch (error) {
    console.error('Upgrade error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
