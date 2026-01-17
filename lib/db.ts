import { sql } from '@vercel/postgres';
import { GameState, UserUpgrade, UserTask, Referral, calculateLevelFromXP } from '@/types/game';

// Database user row type
export interface DbUser {
  id: number;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  photo_url: string | null;
  coins: number;
  xp: number;
  energy: number;
  max_energy: number;
  coins_per_tap: number;
  coins_per_hour: number;
  level: number;
  total_taps: number;
  upgrades: UserUpgrade[];
  tasks: UserTask[];
  referrals: Referral[];
  last_energy_update: Date;
  last_offline_earnings: Date;
  last_daily_claim: Date | null;
  daily_streak: number;
  created_at: Date;
  updated_at: Date;
}

// Convert DB row to GameState
export function dbRowToGameState(row: DbUser): GameState {
  const xp = Number(row.xp) || 0;
  // Always calculate level from XP to ensure consistency
  const calculatedLevel = calculateLevelFromXP(xp);

  return {
    coins: Number(row.coins),
    xp,
    energy: row.energy,
    maxEnergy: row.max_energy,
    coinsPerTap: row.coins_per_tap,
    coinsPerHour: row.coins_per_hour,
    level: calculatedLevel,
    totalTaps: row.total_taps || 0,
    upgrades: row.upgrades ?? [],
    tasks: row.tasks ?? [],
    referrals: row.referrals ?? [],
    lastEnergyUpdate: new Date(row.last_energy_update).getTime(),
    lastOfflineEarnings: new Date(row.last_offline_earnings).getTime(),
    lastDailyClaim: row.last_daily_claim ? new Date(row.last_daily_claim).getTime() : null,
    dailyStreak: row.daily_streak || 0,
  };
}

// Referral bonus amount
const REFERRAL_BONUS = 10000;

// Get user by telegram_id, create if not exists
export async function getOrCreateUser(
  telegramId: number,
  username?: string,
  firstName?: string,
  photoUrl?: string,
  referredBy?: number
): Promise<DbUser> {
  // Try to find existing user
  const { rows } = await sql<DbUser>`
    SELECT * FROM users WHERE telegram_id = ${telegramId}
  `;

  if (rows.length > 0) {
    // User already exists - referral not processed for existing users
    console.log('[getOrCreateUser] User already exists:', telegramId, 'referredBy ignored:', referredBy)
    const user = rows[0];
    if (user.username !== username || user.first_name !== firstName || user.photo_url !== photoUrl) {
      const { rows: updatedRows } = await sql<DbUser>`
        UPDATE users SET
          username = ${username ?? null},
          first_name = ${firstName ?? null},
          photo_url = ${photoUrl ?? null},
          updated_at = NOW()
        WHERE telegram_id = ${telegramId}
        RETURNING *
      `;
      return updatedRows[0];
    }
    return user;
  }

  // Create new user with referred_by
  console.log('[getOrCreateUser] Creating NEW user:', telegramId, 'referredBy:', referredBy)
  const { rows: newRows } = await sql<DbUser>`
    INSERT INTO users (telegram_id, username, first_name, photo_url, referred_by)
    VALUES (${telegramId}, ${username ?? null}, ${firstName ?? null}, ${photoUrl ?? null}, ${referredBy ?? null})
    RETURNING *
  `;

  const newUser = newRows[0];

  // If referred by someone, award bonus to referrer
  if (referredBy && referredBy !== telegramId) {
    console.log('[getOrCreateUser] Processing referral bonus for referrer:', referredBy)
    await processReferralBonus(referredBy, newUser);
  }

  return newUser;
}

// Process referral bonus for the referrer
async function processReferralBonus(referrerId: number, newUser: DbUser): Promise<void> {
  try {
    // Get referrer
    const { rows: referrerRows } = await sql<DbUser>`
      SELECT * FROM users WHERE telegram_id = ${referrerId}
    `;

    if (referrerRows.length === 0) {
      console.log('[Referral] Referrer not found:', referrerId);
      return;
    }

    const referrer = referrerRows[0];

    // Create new referral entry
    const newReferral = {
      id: `ref-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      username: newUser.username || undefined,
      firstName: newUser.first_name || 'Anonymous',
      joinedAt: Date.now(),
    };

    // Update referrer's referrals array and add bonus coins
    const updatedReferrals = [...(referrer.referrals ?? []), newReferral];

    await sql`
      UPDATE users SET
        referrals = ${JSON.stringify(updatedReferrals)}::jsonb,
        coins = coins + ${REFERRAL_BONUS},
        updated_at = NOW()
      WHERE telegram_id = ${referrerId}
    `;

    console.log('[Referral] Bonus awarded to referrer:', referrerId, 'for new user:', newUser.telegram_id);
  } catch (error) {
    console.error('[Referral] Error processing referral bonus:', error);
  }
}

// Update user game state
export async function updateUserState(
  telegramId: number,
  state: Partial<GameState>
): Promise<DbUser> {
  const { rows } = await sql<DbUser>`
    UPDATE users SET
      coins = COALESCE(${state.coins ?? null}, coins),
      xp = COALESCE(${state.xp ?? null}, xp),
      energy = COALESCE(${state.energy ?? null}, energy),
      max_energy = COALESCE(${state.maxEnergy ?? null}, max_energy),
      coins_per_tap = COALESCE(${state.coinsPerTap ?? null}, coins_per_tap),
      coins_per_hour = COALESCE(${state.coinsPerHour ?? null}, coins_per_hour),
      level = COALESCE(${state.level ?? null}, level),
      total_taps = COALESCE(${state.totalTaps ?? null}, total_taps),
      upgrades = COALESCE(${state.upgrades ? JSON.stringify(state.upgrades) : null}::jsonb, upgrades),
      tasks = COALESCE(${state.tasks ? JSON.stringify(state.tasks) : null}::jsonb, tasks),
      referrals = COALESCE(${state.referrals ? JSON.stringify(state.referrals) : null}::jsonb, referrals),
      last_energy_update = COALESCE(${state.lastEnergyUpdate ? new Date(state.lastEnergyUpdate).toISOString() : null}::timestamp, last_energy_update),
      last_offline_earnings = COALESCE(${state.lastOfflineEarnings ? new Date(state.lastOfflineEarnings).toISOString() : null}::timestamp, last_offline_earnings),
      updated_at = NOW()
    WHERE telegram_id = ${telegramId}
    RETURNING *
  `;

  return rows[0];
}

// Atomic tap operation
export async function atomicTap(
  telegramId: number,
  coinsPerTap: number,
  xpPerTap: number = 1
): Promise<DbUser | null> {
  const { rows } = await sql<DbUser>`
    UPDATE users SET
      coins = coins + ${coinsPerTap},
      xp = xp + ${xpPerTap},
      energy = energy - 1,
      total_taps = total_taps + 1,
      last_energy_update = NOW(),
      updated_at = NOW()
    WHERE telegram_id = ${telegramId}
      AND energy > 0
    RETURNING *
  `;

  return rows[0] ?? null;
}

// Atomic batch tap operation
export async function atomicBatchTap(
  telegramId: number,
  taps: number,
  coinsPerTap: number,
  xpPerTap: number = 1
): Promise<DbUser | null> {
  // First check if we have enough energy
  const { rows: checkRows } = await sql<DbUser>`
    SELECT * FROM users
    WHERE telegram_id = ${telegramId} AND energy >= ${taps}
  `;

  if (checkRows.length === 0) {
    return null;
  }

  const { rows } = await sql<DbUser>`
    UPDATE users SET
      coins = coins + ${taps * coinsPerTap},
      xp = xp + ${taps * xpPerTap},
      energy = energy - ${taps},
      total_taps = total_taps + ${taps},
      last_energy_update = NOW(),
      updated_at = NOW()
    WHERE telegram_id = ${telegramId}
      AND energy >= ${taps}
    RETURNING *
  `;

  return rows[0] ?? null;
}

// Get user by telegram_id
export async function getUser(telegramId: number): Promise<DbUser | null> {
  const { rows } = await sql<DbUser>`
    SELECT * FROM users WHERE telegram_id = ${telegramId}
  `;

  return rows[0] ?? null;
}

export { sql };
