'use server'

import { validateInitDataWithDevFallback } from '@/lib/telegram-auth'
import {
  getOrCreateUser,
  getUser,
  dbRowToGameState,
  updateUserState,
  atomicTap,
  atomicBatchTap,
} from '@/lib/db'
import {
  GameState,
  UPGRADES,
  TASKS,
  UserUpgrade,
  UserTask,
  calculateUpgradeCost,
  calculateTotalBonus,
  calculateLevelFromXP,
  calculateLevelBonuses,
  XP_REWARDS,
  shouldResetDailyTaps,
} from '@/types/game'

// Helper functions (duplicated from lib/storage.ts for server-side use)
function calculateOfflineEarnings(
  lastUpdate: number,
  coinsPerHour: number,
  maxOfflineHours: number = 3
): number {
  const now = Date.now()
  const hoursElapsed = Math.min(
    (now - lastUpdate) / (1000 * 60 * 60),
    maxOfflineHours
  )
  return Math.floor(hoursElapsed * coinsPerHour)
}

function calculateEnergyRestoration(
  lastUpdate: number,
  currentEnergy: number,
  maxEnergy: number,
  energyPerSecond: number = 1
): number {
  const now = Date.now()
  const secondsElapsed = (now - lastUpdate) / 1000
  const energyToRestore = Math.floor(secondsElapsed * energyPerSecond)
  return Math.min(currentEnergy + energyToRestore, maxEnergy)
}

// Response types
export interface LoadGameResult {
  success: boolean
  state?: GameState
  offlineEarnings?: number
  offlineMinutes?: number
  user?: {
    id: number
    username?: string
    firstName: string
  }
  error?: string
}

export interface SaveGameResult {
  success: boolean
  state?: GameState
  error?: string
}

export interface TapResult {
  success: boolean
  state?: GameState
  tapped?: number
  coinsEarned?: number
  error?: string
}

export interface UpgradeResult {
  success: boolean
  state?: GameState
  cost?: number
  newLevel?: number
  error?: string
}

export interface TaskResult {
  success: boolean
  state?: GameState
  reward?: number
  error?: string
}

// ============ LOAD GAME ============
export async function loadGame(initData: string): Promise<LoadGameResult> {
  try {
    if (!initData) {
      return { success: false, error: 'Missing initData' }
    }

    const validation = await validateInitDataWithDevFallback(initData)
    if (!validation.valid || !validation.user) {
      return { success: false, error: validation.error || 'Invalid initData' }
    }

    const { user } = validation

    // Parse start_param for referral tracking
    const params = new URLSearchParams(initData)
    const startParam = params.get('start_param')
    let referrerId: number | undefined

    console.log('[loadGame] start_param:', startParam, 'user.id:', user.id)

    if (startParam?.startsWith('ref_')) {
      const parsedId = parseInt(startParam.slice(4), 10)
      console.log('[loadGame] Parsed referrer ID:', parsedId)
      if (!isNaN(parsedId) && parsedId !== user.id) {
        referrerId = parsedId
        console.log('[loadGame] Valid referrer ID set:', referrerId)
      }
    }

    // Get or create user in database
    const dbUser = await getOrCreateUser(
      user.id,
      user.username,
      user.first_name,
      user.photo_url,
      referrerId
    )

    // Convert to GameState
    let state = dbRowToGameState(dbUser)

    // Calculate offline time and earnings
    const offlineMs = Date.now() - state.lastOfflineEarnings
    const offlineMinutes = Math.floor(offlineMs / (1000 * 60))
    const offlineEarnings = calculateOfflineEarnings(
      state.lastOfflineEarnings,
      state.coinsPerHour
    )

    // Calculate energy restoration
    const restoredEnergy = calculateEnergyRestoration(
      state.lastEnergyUpdate,
      state.energy,
      state.maxEnergy
    )

    // Apply calculated values
    state = {
      ...state,
      coins: state.coins + offlineEarnings,
      energy: restoredEnergy,
      lastEnergyUpdate: Date.now(),
      lastOfflineEarnings: Date.now(),
    }

    // Check if daily taps need to be reset (new UTC day)
    let dailyReset = false
    if (shouldResetDailyTaps(state.lastDailyTapsReset)) {
      dailyReset = true
      // Reset daily taps counter
      state = {
        ...state,
        dailyTaps: 0,
        lastDailyTapsReset: Date.now(),
        // Reset daily task completion status (remove claimed status for daily-tap-* tasks)
        tasks: state.tasks.filter((t) => !t.taskId.startsWith('daily-tap-')),
      }
      console.log('[loadGame] Daily taps reset for user:', user.id)
    }

    // Persist to DB so subsequent loads don't recalculate same earnings
    if (offlineEarnings > 0 || restoredEnergy !== dbUser.energy || dailyReset) {
      await updateUserState(user.id, {
        coins: state.coins,
        energy: state.energy,
        lastEnergyUpdate: state.lastEnergyUpdate,
        lastOfflineEarnings: state.lastOfflineEarnings,
        ...(dailyReset && {
          dailyTaps: state.dailyTaps,
          lastDailyTapsReset: state.lastDailyTapsReset,
          tasks: state.tasks,
        }),
      })
    }

    return {
      success: true,
      state,
      offlineEarnings,
      offlineMinutes,
      user: {
        id: user.id,
        username: user.username,
        firstName: user.first_name,
      },
    }
  } catch (error) {
    console.error('[loadGame] Error:', error)
    return { success: false, error: 'Load failed' }
  }
}

// ============ SAVE GAME ============
export async function saveGame(
  initData: string,
  state: GameState
): Promise<SaveGameResult> {
  try {
    if (!initData || !state) {
      return { success: false, error: 'Missing initData or state' }
    }

    const validation = await validateInitDataWithDevFallback(initData)
    if (!validation.valid || !validation.user) {
      return { success: false, error: validation.error || 'Invalid initData' }
    }

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
    }

    const dbUser = await updateUserState(validation.user.id, safeState)
    if (!dbUser) {
      return { success: false, error: 'User not found' }
    }

    return { success: true, state: dbRowToGameState(dbUser) }
  } catch (error) {
    console.error('[saveGame] Error:', error)
    return { success: false, error: 'Save failed' }
  }
}

// ============ TAP ============
export async function tap(
  initData: string,
  count: number = 1
): Promise<TapResult> {
  try {
    if (!initData) {
      return { success: false, error: 'Missing initData' }
    }

    const validation = await validateInitDataWithDevFallback(initData)
    if (!validation.valid || !validation.user) {
      return { success: false, error: validation.error || 'Invalid initData' }
    }

    const { user } = validation

    // Get current user state to check coinsPerTap
    const currentUser = await getUser(user.id)
    if (!currentUser) {
      return { success: false, error: 'User not found' }
    }

    let dbUser

    // Single tap or batch tap
    if (count === 1) {
      dbUser = await atomicTap(user.id, currentUser.coins_per_tap)
    } else {
      dbUser = await atomicBatchTap(user.id, count, currentUser.coins_per_tap)
    }

    if (!dbUser) {
      return { success: false, error: 'Not enough energy' }
    }

    // Convert to state and check if level changed
    let state = dbRowToGameState(dbUser)
    const newLevel = calculateLevelFromXP(state.xp)

    // Update level and recalculate stats if level changed
    if (newLevel !== state.level) {
      const levelBonus = calculateLevelBonuses(newLevel)
      const upgradeBonus = {
        tap: calculateTotalBonus(state.upgrades, 'tap'),
        hour: calculateTotalBonus(state.upgrades, 'hour'),
        energy: calculateTotalBonus(state.upgrades, 'energy'),
      }

      const newCoinsPerTap = 1 + upgradeBonus.tap + levelBonus.totalCoinsPerTap
      const newCoinsPerHour = Math.floor(upgradeBonus.hour * levelBonus.passiveIncomeMultiplier)
      const newMaxEnergy = 1000 + upgradeBonus.energy + levelBonus.totalMaxEnergy

      const updatedUser = await updateUserState(user.id, {
        level: newLevel,
        coinsPerTap: newCoinsPerTap,
        coinsPerHour: newCoinsPerHour,
        maxEnergy: newMaxEnergy,
      })

      state = dbRowToGameState(updatedUser)
    }

    return {
      success: true,
      state,
      tapped: count,
      coinsEarned: count * currentUser.coins_per_tap,
    }
  } catch (error) {
    console.error('[tap] Error:', error)
    return { success: false, error: 'Tap failed' }
  }
}

// ============ PURCHASE UPGRADE ============
export async function purchaseUpgrade(
  initData: string,
  upgradeId: string
): Promise<UpgradeResult> {
  try {
    if (!initData || !upgradeId) {
      return { success: false, error: 'Missing initData or upgradeId' }
    }

    const validation = await validateInitDataWithDevFallback(initData)
    if (!validation.valid || !validation.user) {
      return { success: false, error: validation.error || 'Invalid initData' }
    }

    const { user } = validation

    // Find upgrade definition
    const upgrade = UPGRADES.find((u) => u.id === upgradeId)
    if (!upgrade) {
      return { success: false, error: 'Upgrade not found' }
    }

    // Get current user state
    const dbUser = await getUser(user.id)
    if (!dbUser) {
      return { success: false, error: 'User not found' }
    }

    const state = dbRowToGameState(dbUser)

    // Check current upgrade level
    const existingUpgrade = state.upgrades.find((u) => u.upgradeId === upgradeId)
    const currentLevel = existingUpgrade?.level ?? 0

    // Check if max level reached
    if (currentLevel >= upgrade.maxLevel) {
      return { success: false, error: 'Max level reached' }
    }

    // Calculate cost
    const cost = calculateUpgradeCost(upgrade, currentLevel)

    // Check if user has enough coins
    if (state.coins < cost) {
      return { success: false, error: 'Not enough coins' }
    }

    // Create new upgrades array
    const newUpgradeLevel = currentLevel + 1
    const newUpgrades: UserUpgrade[] = existingUpgrade
      ? state.upgrades.map((u) =>
          u.upgradeId === upgradeId ? { ...u, level: u.level + 1 } : u
        )
      : [...state.upgrades, { upgradeId, level: 1 }]

    // Award XP for upgrade (100 * upgrade level)
    const xpGained = XP_REWARDS.upgrade * newUpgradeLevel
    const newXP = state.xp + xpGained
    const newLevel = calculateLevelFromXP(newXP)

    // Calculate upgrade bonuses
    const upgradeBonus = {
      tap: calculateTotalBonus(newUpgrades, 'tap'),
      hour: calculateTotalBonus(newUpgrades, 'hour'),
      energy: calculateTotalBonus(newUpgrades, 'energy'),
    }

    // Calculate level bonuses
    const levelBonus = calculateLevelBonuses(newLevel)

    // Combined stats
    const newCoinsPerTap = 1 + upgradeBonus.tap + levelBonus.totalCoinsPerTap
    const newCoinsPerHour = Math.floor(upgradeBonus.hour * levelBonus.passiveIncomeMultiplier)
    const newMaxEnergy = 1000 + upgradeBonus.energy + levelBonus.totalMaxEnergy

    // Update user state
    const updatedUser = await updateUserState(user.id, {
      coins: state.coins - cost,
      xp: newXP,
      level: newLevel,
      upgrades: newUpgrades,
      coinsPerTap: newCoinsPerTap,
      coinsPerHour: newCoinsPerHour,
      maxEnergy: newMaxEnergy,
    })

    return {
      success: true,
      state: dbRowToGameState(updatedUser),
      cost,
      newLevel: newUpgradeLevel,
    }
  } catch (error) {
    console.error('[purchaseUpgrade] Error:', error)
    return { success: false, error: 'Upgrade failed' }
  }
}

// ============ COMPLETE TASK ============
export async function completeTask(
  initData: string,
  taskId: string
): Promise<TaskResult> {
  try {
    if (!initData || !taskId) {
      return { success: false, error: 'Missing initData or taskId' }
    }

    const validation = await validateInitDataWithDevFallback(initData)
    if (!validation.valid || !validation.user) {
      return { success: false, error: validation.error || 'Invalid initData' }
    }

    const { user } = validation

    // Find task definition
    const task = TASKS.find((t) => t.id === taskId)
    if (!task) {
      return { success: false, error: 'Task not found' }
    }

    // Get current user state
    const dbUser = await getUser(user.id)
    if (!dbUser) {
      return { success: false, error: 'User not found' }
    }

    const state = dbRowToGameState(dbUser)

    // Check if task already claimed
    const existingTask = state.tasks.find((t) => t.taskId === taskId)
    if (existingTask?.status === 'claimed') {
      return { success: false, error: 'Task already claimed' }
    }

    // Check subscription for social tasks with channelId
    if (task.channelId) {
      const botToken = process.env.TELEGRAM_BOT_TOKEN
      if (!botToken) {
        return { success: false, error: 'Bot token not configured' }
      }

      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${encodeURIComponent(task.channelId)}&user_id=${user.id}`
      )
      const data = await response.json()

      const validStatuses = ['member', 'administrator', 'creator']
      if (!data.ok || !validStatuses.includes(data.result?.status)) {
        return { success: false, error: 'Please subscribe to the channel first' }
      }
    }

    // Check prerequisite task
    if (task.prerequisite) {
      const prerequisiteCompleted = state.tasks.find(
        (t) => t.taskId === task.prerequisite && t.status === 'claimed'
      )
      if (!prerequisiteCompleted) {
        return { success: false, error: 'Complete prerequisite task first' }
      }
    }

    // Check task requirements based on type and id
    if (task.requirement) {
      // Referral tasks
      if (task.type === 'referral') {
        if (state.referrals.length < task.requirement) {
          return { success: false, error: 'Referral requirement not met' }
        }
      }

      // Level tasks (reach-level-5, reach-level-10, reach-level-20)
      if (taskId.startsWith('reach-level-')) {
        if (state.level < task.requirement) {
          return { success: false, error: 'Level requirement not met' }
        }
      }

      // Progress tap tasks (tap-1000, tap-10000, tap-100000) - use totalTaps
      if (taskId.startsWith('tap-') && !taskId.startsWith('daily-tap-')) {
        if (state.totalTaps < task.requirement) {
          return { success: false, error: 'Tap requirement not met' }
        }
      }

      // Daily tap tasks - use dailyTaps
      if (taskId.startsWith('daily-tap-')) {
        if (state.dailyTaps < task.requirement) {
          return { success: false, error: 'Daily tap requirement not met' }
        }
      }

      // First upgrade task
      if (taskId === 'first-upgrade') {
        if (state.upgrades.length === 0) {
          return { success: false, error: 'Buy an upgrade first' }
        }
      }

      // Max upgrade task
      if (taskId === 'max-upgrade') {
        const hasMaxedUpgrade = state.upgrades.some((userUpgrade) => {
          const upgrade = UPGRADES.find((u) => u.id === userUpgrade.upgradeId)
          return upgrade && userUpgrade.level >= upgrade.maxLevel
        })
        if (!hasMaxedUpgrade) {
          return { success: false, error: 'Max out an upgrade first' }
        }
      }
    }

    // Create new tasks array
    const newTasks: UserTask[] = existingTask
      ? state.tasks.map((t) =>
          t.taskId === taskId
            ? { ...t, status: 'claimed' as const, completedAt: Date.now() }
            : t
        )
      : [...state.tasks, { taskId, status: 'claimed' as const, completedAt: Date.now() }]

    // Award XP for task completion
    const newXP = state.xp + XP_REWARDS.task
    const newLevel = calculateLevelFromXP(newXP)

    // Check if level changed and recalculate stats
    let updateData: Parameters<typeof updateUserState>[1] = {
      coins: state.coins + task.reward,
      xp: newXP,
      tasks: newTasks,
    }

    // For daily-tap tasks, update lastDailyTapsReset to prevent reset on next load
    if (taskId.startsWith('daily-tap-')) {
      updateData.lastDailyTapsReset = Date.now()
    }

    if (newLevel !== state.level) {
      const levelBonus = calculateLevelBonuses(newLevel)
      const upgradeBonus = {
        tap: calculateTotalBonus(state.upgrades, 'tap'),
        hour: calculateTotalBonus(state.upgrades, 'hour'),
        energy: calculateTotalBonus(state.upgrades, 'energy'),
      }

      updateData = {
        ...updateData,
        level: newLevel,
        coinsPerTap: 1 + upgradeBonus.tap + levelBonus.totalCoinsPerTap,
        coinsPerHour: Math.floor(upgradeBonus.hour * levelBonus.passiveIncomeMultiplier),
        maxEnergy: 1000 + upgradeBonus.energy + levelBonus.totalMaxEnergy,
      }
    }

    // Update user state with reward and XP
    const updatedUser = await updateUserState(user.id, updateData)

    return {
      success: true,
      state: dbRowToGameState(updatedUser),
      reward: task.reward,
    }
  } catch (error) {
    console.error('[completeTask] Error:', error)
    return { success: false, error: 'Task failed' }
  }
}

// ============ SYNC GAME STATE (for focus sync) ============
export async function syncGameState(initData: string): Promise<{
  success: boolean
  state?: GameState
  error?: string
}> {
  try {
    const validation = await validateInitDataWithDevFallback(initData)
    if (!validation.valid || !validation.user) {
      return { success: false, error: 'Invalid session' }
    }

    const dbUser = await getOrCreateUser(
      validation.user.id,
      validation.user.username,
      validation.user.first_name,
      validation.user.photo_url
    )

    const state = dbRowToGameState(dbUser)
    return { success: true, state }
  } catch (error) {
    console.error('[syncGameState] Error:', error)
    return { success: false, error: 'Sync failed' }
  }
}
