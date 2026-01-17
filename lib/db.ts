import { sql } from '@vercel/postgres';
import { GameState, UserUpgrade, UserTask, Referral } from '@/types/game';

// Database user row type
export interface DbUser {
  id: number;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  coins: number;
  energy: number;
  max_energy: number;
  coins_per_tap: number;
  coins_per_hour: number;
  level: number;
  upgrades: UserUpgrade[];
  tasks: UserTask[];
  referrals: Referral[];
  last_energy_update: Date;
  last_offline_earnings: Date;
  created_at: Date;
  updated_at: Date;
}

// Convert DB row to GameState
export function dbRowToGameState(row: DbUser): GameState {
  return {
    coins: Number(row.coins),
    energy: row.energy,
    maxEnergy: row.max_energy,
    coinsPerTap: row.coins_per_tap,
    coinsPerHour: row.coins_per_hour,
    level: row.level,
    upgrades: row.upgrades ?? [],
    tasks: row.tasks ?? [],
    referrals: row.referrals ?? [],
    lastEnergyUpdate: new Date(row.last_energy_update).getTime(),
    lastOfflineEarnings: new Date(row.last_offline_earnings).getTime(),
  };
}

// Get user by telegram_id, create if not exists
export async function getOrCreateUser(
  telegramId: number,
  username?: string,
  firstName?: string
): Promise<DbUser> {
  // Try to find existing user
  const { rows } = await sql<DbUser>`
    SELECT * FROM users WHERE telegram_id = ${telegramId}
  `;

  if (rows.length > 0) {
    return rows[0];
  }

  // Create new user
  const { rows: newRows } = await sql<DbUser>`
    INSERT INTO users (telegram_id, username, first_name)
    VALUES (${telegramId}, ${username ?? null}, ${firstName ?? null})
    RETURNING *
  `;

  return newRows[0];
}

// Update user game state
export async function updateUserState(
  telegramId: number,
  state: Partial<GameState>
): Promise<DbUser> {
  const { rows } = await sql<DbUser>`
    UPDATE users SET
      coins = COALESCE(${state.coins ?? null}, coins),
      energy = COALESCE(${state.energy ?? null}, energy),
      max_energy = COALESCE(${state.maxEnergy ?? null}, max_energy),
      coins_per_tap = COALESCE(${state.coinsPerTap ?? null}, coins_per_tap),
      coins_per_hour = COALESCE(${state.coinsPerHour ?? null}, coins_per_hour),
      level = COALESCE(${state.level ?? null}, level),
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
  coinsPerTap: number
): Promise<DbUser | null> {
  const { rows } = await sql<DbUser>`
    UPDATE users SET
      coins = coins + ${coinsPerTap},
      energy = energy - 1,
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
  coinsPerTap: number
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
      energy = energy - ${taps},
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
