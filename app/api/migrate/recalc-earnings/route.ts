import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Upgrade definitions (copy from types/game.ts to avoid import issues)
const UPGRADES = [
  { id: 'golden-goose', baseCost: 1000, costMultiplier: 1.5 },
  { id: 'egg-farm', baseCost: 2000, costMultiplier: 1.6 },
  { id: 'golden-egg', baseCost: 5000, costMultiplier: 1.7 },
  { id: 'goose-nest', baseCost: 3000, costMultiplier: 1.5 },
  { id: 'energy-drink', baseCost: 1500, costMultiplier: 1.4 },
  { id: 'turbo-tap', baseCost: 10000, costMultiplier: 2.0 },
];

// Calculate total cost spent on an upgrade to reach a certain level
function calculateTotalSpent(upgradeId: string, level: number): number {
  const upgrade = UPGRADES.find(u => u.id === upgradeId);
  if (!upgrade || level <= 0) return 0;

  let total = 0;
  for (let i = 0; i < level; i++) {
    total += Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, i));
  }
  return total;
}

interface UserUpgrade {
  upgradeId: string;
  level: number;
}

export async function GET() {
  try {
    // Get all users with their upgrades and coins
    const { rows: users } = await sql<{
      telegram_id: number;
      coins: number;
      upgrades: UserUpgrade[] | null;
    }>`
      SELECT telegram_id, coins, upgrades FROM users
    `;

    let updated = 0;
    let totalRecalculated = 0;

    for (const user of users) {
      // Calculate total spent on upgrades
      let totalSpentOnUpgrades = 0;
      if (user.upgrades && Array.isArray(user.upgrades)) {
        for (const userUpgrade of user.upgrades) {
          totalSpentOnUpgrades += calculateTotalSpent(userUpgrade.upgradeId, userUpgrade.level);
        }
      }

      // New total_earnings = current coins + spent on upgrades
      const newTotalEarnings = Number(user.coins) + totalSpentOnUpgrades;

      // Update user
      await sql`
        UPDATE users
        SET total_earnings = ${newTotalEarnings}
        WHERE telegram_id = ${user.telegram_id}
      `;

      updated++;
      totalRecalculated += newTotalEarnings;
    }

    return NextResponse.json({
      success: true,
      message: 'Recalculation completed',
      stats: {
        usersUpdated: updated,
        totalEarningsSum: totalRecalculated,
      },
    });
  } catch (error) {
    console.error('Recalculation error:', error);
    return NextResponse.json(
      { error: 'Recalculation failed', details: String(error) },
      { status: 500 }
    );
  }
}
