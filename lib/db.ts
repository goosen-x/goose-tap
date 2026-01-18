import { sql } from '@vercel/postgres';
import { GameState, UserUpgrade, UserTask, Referral, calculateLevelFromXP, REFERRAL_BONUSES, REFERRAL_PERCENTAGES } from '@/types/game';

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
  daily_taps: number;
  last_daily_taps_reset: Date;
  upgrades: UserUpgrade[];
  tasks: UserTask[];
  referrals: Referral[];
  // Multi-tier referral chain (denormalized)
  referrer_t1: number | null;
  referrer_t2: number | null;
  referrer_t3: number | null;
  // Accumulated earnings from each tier
  referral_earnings_t1: number;
  referral_earnings_t2: number;
  referral_earnings_t3: number;
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

  // Calculate referral earnings
  const tier1Earnings = Number(row.referral_earnings_t1) || 0;
  const tier2Earnings = Number(row.referral_earnings_t2) || 0;
  const tier3Earnings = Number(row.referral_earnings_t3) || 0;

  return {
    coins: Number(row.coins),
    xp,
    energy: row.energy,
    maxEnergy: row.max_energy,
    coinsPerTap: row.coins_per_tap,
    coinsPerHour: row.coins_per_hour,
    level: calculatedLevel,
    totalTaps: row.total_taps || 0,
    dailyTaps: row.daily_taps || 0,
    lastDailyTapsReset: row.last_daily_taps_reset ? new Date(row.last_daily_taps_reset).getTime() : Date.now(),
    upgrades: row.upgrades ?? [],
    tasks: row.tasks ?? [],
    referrals: row.referrals ?? [],
    referralEarnings: {
      tier1: tier1Earnings,
      tier2: tier2Earnings,
      tier3: tier3Earnings,
      total: tier1Earnings + tier2Earnings + tier3Earnings,
    },
    lastEnergyUpdate: new Date(row.last_energy_update).getTime(),
    lastOfflineEarnings: new Date(row.last_offline_earnings).getTime(),
    lastDailyClaim: row.last_daily_claim ? new Date(row.last_daily_claim).getTime() : null,
    dailyStreak: row.daily_streak || 0,
  };
}

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
  console.log('[getOrCreateUser] New user created successfully:', newUser.telegram_id)

  // If referred by someone, award bonus to referrer
  if (referredBy && referredBy !== telegramId) {
    console.log('[getOrCreateUser] Processing referral bonus for referrer:', referredBy)
    try {
      await processReferralBonus(referredBy, newUser);
      console.log('[getOrCreateUser] Referral bonus processed successfully')
    } catch (error) {
      // Log but don't fail user creation
      console.error('[getOrCreateUser] Failed to process referral bonus:', error)
    }
  }

  return newUser;
}

// Process multi-tier referral bonus
async function processReferralBonus(referrerId: number, newUser: DbUser): Promise<void> {
  console.log('[Referral] Starting processReferralBonus for referrer:', referrerId, 'newUser:', newUser.telegram_id);

  try {
    // 1. Get referral chain using recursive CTE (up to 3 levels)
    const { rows: chainRows } = await sql`
      WITH RECURSIVE referral_chain AS (
        SELECT telegram_id, referred_by, username, first_name, referrals, 1 as depth
        FROM users WHERE telegram_id = ${referrerId}
        UNION ALL
        SELECT u.telegram_id, u.referred_by, u.username, u.first_name, u.referrals, rc.depth + 1
        FROM users u
        JOIN referral_chain rc ON u.telegram_id = rc.referred_by
        WHERE rc.depth < 3
      )
      SELECT telegram_id, depth, username, first_name, referrals FROM referral_chain ORDER BY depth
    `;

    console.log('[Referral] Chain found:', chainRows.map(r => ({ id: r.telegram_id, depth: r.depth })));

    const t1 = chainRows[0]?.telegram_id || null;  // Direct referrer
    const t2 = chainRows[1]?.telegram_id || null;  // Referrer's referrer
    const t3 = chainRows[2]?.telegram_id || null;  // Third level

    // 2. Save the chain to the new user
    await sql`
      UPDATE users SET
        referrer_t1 = ${t1},
        referrer_t2 = ${t2},
        referrer_t3 = ${t3},
        updated_at = NOW()
      WHERE telegram_id = ${newUser.telegram_id}
    `;
    console.log('[Referral] Chain saved for new user:', newUser.telegram_id, '-> t1:', t1, 't2:', t2, 't3:', t3);

    // 3. Update T1 referrer's referrals array (for displaying in UI)
    if (t1) {
      const t1Data = chainRows[0];
      const newReferral = {
        id: `ref-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        username: newUser.username || undefined,
        firstName: newUser.first_name || 'Anonymous',
        coins: 0,
        joinedAt: Date.now(),
      };
      const updatedReferrals = [...(t1Data.referrals ?? []), newReferral];

      await sql`
        UPDATE users SET
          referrals = ${JSON.stringify(updatedReferrals)}::jsonb,
          coins = coins + ${REFERRAL_BONUSES.tier1},
          updated_at = NOW()
        WHERE telegram_id = ${t1}
      `;
      console.log('[Referral] T1 bonus +', REFERRAL_BONUSES.tier1, 'awarded to:', t1);
    }

    // 4. Award T2 bonus
    if (t2) {
      await sql`
        UPDATE users SET
          coins = coins + ${REFERRAL_BONUSES.tier2},
          updated_at = NOW()
        WHERE telegram_id = ${t2}
      `;
      console.log('[Referral] T2 bonus +', REFERRAL_BONUSES.tier2, 'awarded to:', t2);
    }

    // 5. Award T3 bonus
    if (t3) {
      await sql`
        UPDATE users SET
          coins = coins + ${REFERRAL_BONUSES.tier3},
          updated_at = NOW()
        WHERE telegram_id = ${t3}
      `;
      console.log('[Referral] T3 bonus +', REFERRAL_BONUSES.tier3, 'awarded to:', t3);
    }

    console.log('[Referral] SUCCESS! Multi-tier bonuses processed for new user:', newUser.telegram_id);
  } catch (error) {
    console.error('[Referral] CRITICAL ERROR processing referral bonus:', error);
    throw error;
  }
}

// Update user game state
// NOTE: referrals are NOT updated here - they are managed server-side only
// (via processReferralBonus and fix-referrals endpoint)
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
      daily_taps = COALESCE(${state.dailyTaps ?? null}, daily_taps),
      last_daily_taps_reset = COALESCE(${state.lastDailyTapsReset ? new Date(state.lastDailyTapsReset).toISOString() : null}::timestamp, last_daily_taps_reset),
      upgrades = COALESCE(${state.upgrades ? JSON.stringify(state.upgrades) : null}::jsonb, upgrades),
      tasks = COALESCE(${state.tasks ? JSON.stringify(state.tasks) : null}::jsonb, tasks),
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
      daily_taps = daily_taps + 1,
      last_energy_update = NOW(),
      last_daily_taps_reset = NOW(),
      updated_at = NOW()
    WHERE telegram_id = ${telegramId}
      AND energy > 0
    RETURNING *
  `;

  return rows[0] ?? null;
}

// Atomic batch tap operation with multi-tier referral earnings distribution
export async function atomicBatchTap(
  telegramId: number,
  taps: number,
  coinsPerTap: number,
  xpPerTap: number = 1
): Promise<DbUser | null> {
  const totalCoins = taps * coinsPerTap;
  const t1Share = Math.floor(totalCoins * REFERRAL_PERCENTAGES.tier1);  // 10%
  const t2Share = Math.floor(totalCoins * REFERRAL_PERCENTAGES.tier2);  // 3%
  const t3Share = Math.floor(totalCoins * REFERRAL_PERCENTAGES.tier3);  // 1%

  // Single query with CTE: updates tapper + all referrers atomically
  const { rows } = await sql<DbUser>`
    WITH tapper AS (
      UPDATE users SET
        coins = coins + ${totalCoins},
        xp = xp + ${taps * xpPerTap},
        energy = energy - ${taps},
        total_taps = total_taps + ${taps},
        daily_taps = daily_taps + ${taps},
        last_energy_update = NOW(),
        last_daily_taps_reset = NOW(),
        updated_at = NOW()
      WHERE telegram_id = ${telegramId} AND energy >= ${taps}
      RETURNING *
    ),
    referral_update AS (
      UPDATE users SET
        coins = coins + CASE
          WHEN telegram_id = (SELECT referrer_t1 FROM tapper) THEN ${t1Share}
          WHEN telegram_id = (SELECT referrer_t2 FROM tapper) THEN ${t2Share}
          WHEN telegram_id = (SELECT referrer_t3 FROM tapper) THEN ${t3Share}
          ELSE 0 END,
        referral_earnings_t1 = referral_earnings_t1 + CASE
          WHEN telegram_id = (SELECT referrer_t1 FROM tapper) THEN ${t1Share} ELSE 0 END,
        referral_earnings_t2 = referral_earnings_t2 + CASE
          WHEN telegram_id = (SELECT referrer_t2 FROM tapper) THEN ${t2Share} ELSE 0 END,
        referral_earnings_t3 = referral_earnings_t3 + CASE
          WHEN telegram_id = (SELECT referrer_t3 FROM tapper) THEN ${t3Share} ELSE 0 END,
        updated_at = NOW()
      WHERE telegram_id IN (
        (SELECT referrer_t1 FROM tapper),
        (SELECT referrer_t2 FROM tapper),
        (SELECT referrer_t3 FROM tapper)
      )
      AND (SELECT COUNT(*) FROM tapper) > 0
    )
    SELECT * FROM tapper
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
