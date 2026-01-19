// Leaderboard types
export interface LeaderboardEntry {
  rank: number;
  telegramId: number;
  firstName: string;
  username: string | null;
  photoUrl: string | null;
  coins: number;
  level: number;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  currentUser: {
    rank: number;
    coins: number;
    level: number;
  } | null;
  totalPlayers: number;
  hasMore: boolean;
}

// Upgrade types
export type BonusType = 'tap' | 'hour' | 'energy';

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  icon: string;
  baseCost: number;
  costMultiplier: number;
  bonusType: BonusType;
  bonusValue: number;
  maxLevel: number;
  category: 'cards' | 'boosts';
}

export interface UserUpgrade {
  upgradeId: string;
  level: number;
}

// Task types
export type TaskType = 'social' | 'daily' | 'referral' | 'progress';
export type TaskStatus = 'pending' | 'completed' | 'claimed';

export interface Task {
  id: string;
  type: TaskType;
  title: string;
  description: string;
  reward: number;
  /** XP reward for completing the task */
  xpReward?: number;
  action?: string;
  requirement?: number;
  icon: string;
  /** Channel/group ID for subscription verification */
  channelId?: string;
  /** Task ID that must be completed before this task appears */
  prerequisite?: string;
}

export interface UserTask {
  taskId: string;
  status: TaskStatus;
  progress?: number;
  completedAt?: number;
}

// Referral types
export interface Referral {
  id: string;
  username?: string;
  firstName: string;
  coins: number;
  joinedAt: number;
}

// Multi-tier referral earnings
export interface ReferralEarnings {
  tier1: number;  // Earned from direct referrals (10%)
  tier2: number;  // Earned from tier 2 (3%)
  tier3: number;  // Earned from tier 3 (1%)
  total: number;
}

// Referral tier bonuses configuration
export const REFERRAL_BONUSES = {
  tier1: 10000,  // +10,000 for direct friend
  tier2: 2000,   // +2,000 for friend of friend
  tier3: 500,    // +500 for tier 3
} as const;

// Referral earnings percentages
export const REFERRAL_PERCENTAGES = {
  tier1: 0.10,  // 10% of earnings
  tier2: 0.03,  // 3% of earnings
  tier3: 0.01,  // 1% of earnings
} as const;

// Level system
export interface LevelBonus {
  coinsPerTap?: number;
  maxEnergy?: number;
  passiveIncomeMultiplier?: number; // 1.05 = +5%
}

export interface Level {
  level: number;
  xpRequired: number;
  title: string;
  bonus: LevelBonus;
}

export const LEVELS: Level[] = [
  { level: 1, xpRequired: 0, title: 'Newbie', bonus: {} },
  { level: 2, xpRequired: 500, title: 'Beginner', bonus: { coinsPerTap: 1 } },
  { level: 3, xpRequired: 1500, title: 'Tapper', bonus: { maxEnergy: 50 } },
  { level: 4, xpRequired: 4000, title: 'Amateur', bonus: { coinsPerTap: 1 } },
  { level: 5, xpRequired: 10000, title: 'Skilled', bonus: { maxEnergy: 100 } },
  { level: 6, xpRequired: 20000, title: 'Expert', bonus: { coinsPerTap: 2 } },
  { level: 7, xpRequired: 40000, title: 'Pro', bonus: { passiveIncomeMultiplier: 1.05 } },
  { level: 8, xpRequired: 80000, title: 'Master', bonus: { maxEnergy: 150, coinsPerTap: 2 } },
  { level: 9, xpRequired: 150000, title: 'Champion', bonus: { passiveIncomeMultiplier: 1.10 } },
  { level: 10, xpRequired: 300000, title: 'Legend', bonus: { coinsPerTap: 3, maxEnergy: 200 } },
  { level: 11, xpRequired: 500000, title: 'Mythic', bonus: { passiveIncomeMultiplier: 1.15 } },
  { level: 12, xpRequired: 800000, title: 'Divine', bonus: { coinsPerTap: 5, maxEnergy: 300 } },
  { level: 13, xpRequired: 1200000, title: 'Immortal', bonus: { passiveIncomeMultiplier: 1.20 } },
  { level: 14, xpRequired: 2000000, title: 'Goose King', bonus: { coinsPerTap: 10, maxEnergy: 500 } },
  { level: 15, xpRequired: 5000000, title: 'Goose God', bonus: { passiveIncomeMultiplier: 1.50, coinsPerTap: 20 } },
  { level: 16, xpRequired: 8000000, title: 'Celestial', bonus: { maxEnergy: 750, coinsPerTap: 25 } },
  { level: 17, xpRequired: 12000000, title: 'Eternal', bonus: { passiveIncomeMultiplier: 1.75 } },
  { level: 18, xpRequired: 18000000, title: 'Transcendent', bonus: { coinsPerTap: 35, maxEnergy: 1000 } },
  { level: 19, xpRequired: 27000000, title: 'Omnipotent', bonus: { passiveIncomeMultiplier: 2.0, coinsPerTap: 50 } },
  { level: 20, xpRequired: 40000000, title: 'Ultimate Goose', bonus: { coinsPerTap: 100, maxEnergy: 2000, passiveIncomeMultiplier: 2.5 } },
];

// XP rewards
export const XP_REWARDS = {
  tap: 1,
  upgrade: 100, // multiplied by upgrade level
  task: 500,
  referral: 1000,
};

// Daily rewards
export interface DailyReward {
  day: number;
  coins: number;
  xp: number;
  bonus?: string; // special bonus like 'mystery_box'
}

export const DAILY_REWARDS: DailyReward[] = [
  { day: 1, coins: 500, xp: 50 },
  { day: 2, coins: 1000, xp: 100 },
  { day: 3, coins: 2000, xp: 200 },
  { day: 4, coins: 3500, xp: 350 },
  { day: 5, coins: 5000, xp: 500 },
  { day: 6, coins: 7500, xp: 750 },
  { day: 7, coins: 15000, xp: 1500, bonus: 'week_complete' },
];

// Game state
export interface GameState {
  coins: number;
  totalEarnings: number;
  xp: number;
  energy: number;
  maxEnergy: number;
  coinsPerTap: number;
  coinsPerHour: number;
  level: number;
  totalTaps: number;
  dailyTaps: number;
  lastDailyTapsReset: number;
  upgrades: UserUpgrade[];
  tasks: UserTask[];
  referrals: Referral[];
  referralEarnings: ReferralEarnings;
  lastEnergyUpdate: number;
  lastOfflineEarnings: number;
  lastDailyClaim: number | null;
  dailyStreak: number;
}

// Default game state
export const DEFAULT_GAME_STATE: GameState = {
  coins: 0,
  totalEarnings: 0,
  xp: 0,
  energy: 1000,
  maxEnergy: 1000,
  coinsPerTap: 1,
  coinsPerHour: 0,
  level: 1,
  totalTaps: 0,
  dailyTaps: 0,
  lastDailyTapsReset: Date.now(),
  upgrades: [],
  tasks: [],
  referrals: [],
  referralEarnings: { tier1: 0, tier2: 0, tier3: 0, total: 0 },
  lastEnergyUpdate: Date.now(),
  lastOfflineEarnings: Date.now(),
  lastDailyClaim: null,
  dailyStreak: 0,
};

// Upgrade definitions
export const UPGRADES: Upgrade[] = [
  {
    id: 'golden-goose',
    name: 'Golden Goose',
    description: 'Increases coins per tap',
    icon: '🪿',
    baseCost: 1000,
    costMultiplier: 1.5,
    bonusType: 'tap',
    bonusValue: 1,
    maxLevel: 50,
    category: 'cards',
  },
  {
    id: 'egg-farm',
    name: 'Egg Farm',
    description: 'Passive income per hour',
    icon: '🥚',
    baseCost: 2000,
    costMultiplier: 1.6,
    bonusType: 'hour',
    bonusValue: 100,
    maxLevel: 30,
    category: 'cards',
  },
  {
    id: 'golden-egg',
    name: 'Golden Egg',
    description: 'Increases passive income',
    icon: '🥇',
    baseCost: 5000,
    costMultiplier: 1.7,
    bonusType: 'hour',
    bonusValue: 250,
    maxLevel: 20,
    category: 'cards',
  },
  {
    id: 'goose-nest',
    name: 'Goose Nest',
    description: 'Bonus tap power',
    icon: '🪺',
    baseCost: 3000,
    costMultiplier: 1.5,
    bonusType: 'tap',
    bonusValue: 2,
    maxLevel: 25,
    category: 'cards',
  },
  {
    id: 'energy-drink',
    name: 'Energy Drink',
    description: 'Increases max energy',
    icon: '⚡',
    baseCost: 1500,
    costMultiplier: 1.4,
    bonusType: 'energy',
    bonusValue: 100,
    maxLevel: 20,
    category: 'boosts',
  },
  {
    id: 'turbo-tap',
    name: 'Turbo Tap',
    description: 'Massive tap boost',
    icon: '🚀',
    baseCost: 10000,
    costMultiplier: 2.0,
    bonusType: 'tap',
    bonusValue: 5,
    maxLevel: 10,
    category: 'boosts',
  },
];

// Task definitions
export const TASKS: Task[] = [
  // Social tasks (one-time subscriptions)
  {
    id: 'subscribe-gooselabs',
    type: 'social',
    title: 'Subscribe to @gooselabs',
    description: 'Join Goose Labs channel',
    reward: 5000,
    xpReward: 500,
    action: 'https://t.me/gooselabs',
    channelId: '@gooselabs',
    icon: '📢',
  },
  // Referral tasks (one-time achievements)
  {
    id: 'invite-1-friend',
    type: 'referral',
    title: 'Invite first friend',
    description: 'Share the game',
    reward: 5000,
    xpReward: 500,
    requirement: 1,
    icon: '👥',
  },
  {
    id: 'invite-3-friends',
    type: 'referral',
    title: 'Invite 3 friends',
    description: 'Get friends to join',
    reward: 10000,
    xpReward: 1000,
    requirement: 3,
    icon: '👥',
    prerequisite: 'invite-1-friend',
  },
  {
    id: 'invite-10-friends',
    type: 'referral',
    title: 'Invite 10 friends',
    description: 'Build your network',
    reward: 50000,
    xpReward: 2500,
    requirement: 10,
    icon: '👥',
    prerequisite: 'invite-3-friends',
  },
  {
    id: 'invite-25-friends',
    type: 'referral',
    title: 'Invite 25 friends',
    description: 'Network master',
    reward: 100000,
    xpReward: 5000,
    requirement: 25,
    icon: '👥',
    prerequisite: 'invite-10-friends',
  },
  {
    id: 'invite-50-friends',
    type: 'referral',
    title: 'Invite 50 friends',
    description: 'Influencer status',
    reward: 200000,
    xpReward: 10000,
    requirement: 50,
    icon: '👥',
    prerequisite: 'invite-25-friends',
  },
  {
    id: 'invite-100-friends',
    type: 'referral',
    title: 'Invite 100 friends',
    description: 'Legendary recruiter',
    reward: 500000,
    xpReward: 25000,
    requirement: 100,
    icon: '👥',
    prerequisite: 'invite-50-friends',
  },

  // Progress tasks (one-time milestones) - Level achievements
  {
    id: 'reach-level-3',
    type: 'progress',
    title: 'Reach level 3',
    description: 'First steps',
    reward: 2000,
    xpReward: 200,
    requirement: 3,
    icon: '⭐',
  },
  {
    id: 'reach-level-5',
    type: 'progress',
    title: 'Reach level 5',
    description: 'Skilled tapper',
    reward: 5000,
    xpReward: 500,
    requirement: 5,
    icon: '⭐',
    prerequisite: 'reach-level-3',
  },
  {
    id: 'reach-level-10',
    type: 'progress',
    title: 'Reach level 10',
    description: 'Legend status',
    reward: 25000,
    xpReward: 2500,
    requirement: 10,
    icon: '⭐',
    prerequisite: 'reach-level-5',
  },
  {
    id: 'reach-level-15',
    type: 'progress',
    title: 'Reach level 15',
    description: 'Goose God',
    reward: 75000,
    xpReward: 7500,
    requirement: 15,
    icon: '⭐',
    prerequisite: 'reach-level-10',
  },
  {
    id: 'reach-level-20',
    type: 'progress',
    title: 'Reach level 20',
    description: 'Ultimate Goose',
    reward: 200000,
    xpReward: 20000,
    requirement: 20,
    icon: '⭐',
    prerequisite: 'reach-level-15',
  },
  {
    id: 'tap-1000',
    type: 'progress',
    title: 'Tap 1,000 times',
    description: 'Get tapping!',
    reward: 2000,
    xpReward: 200,
    requirement: 1000,
    icon: '👆',
  },
  {
    id: 'tap-10000',
    type: 'progress',
    title: 'Tap 10,000 times',
    description: 'Tap master',
    reward: 10000,
    xpReward: 1000,
    requirement: 10000,
    icon: '👆',
    prerequisite: 'tap-1000',
  },
  {
    id: 'tap-100000',
    type: 'progress',
    title: 'Tap 100,000 times',
    description: 'Ultimate tapper',
    reward: 25000,
    xpReward: 2500,
    requirement: 100000,
    icon: '👆',
    prerequisite: 'tap-10000',
  },
  {
    id: 'first-upgrade',
    type: 'progress',
    title: 'First upgrade',
    description: 'Buy your first upgrade',
    reward: 2000,
    xpReward: 200,
    requirement: 1,
    icon: '🔧',
  },
  {
    id: 'max-upgrade',
    type: 'progress',
    title: 'Max out an upgrade',
    description: 'Reach max level on any upgrade',
    reward: 20000,
    xpReward: 2000,
    requirement: 1,
    icon: '🏆',
  },

  // Daily tap chain (only next uncompleted shows)
  {
    id: 'daily-tap-100',
    type: 'daily',
    title: 'Tap 100 times',
    description: 'Daily warm-up',
    reward: 500,
    xpReward: 50,
    requirement: 100,
    icon: '🎯',
  },
  {
    id: 'daily-tap-250',
    type: 'daily',
    title: 'Tap 250 times',
    description: 'Getting started',
    reward: 1000,
    xpReward: 100,
    requirement: 250,
    icon: '🎯',
    prerequisite: 'daily-tap-100',
  },
  {
    id: 'daily-tap-500',
    type: 'daily',
    title: 'Tap 500 times',
    description: 'Casual player',
    reward: 1500,
    xpReward: 150,
    requirement: 500,
    icon: '🎯',
    prerequisite: 'daily-tap-250',
  },
  {
    id: 'daily-tap-1000',
    type: 'daily',
    title: 'Tap 1,000 times',
    description: 'Active player',
    reward: 2500,
    xpReward: 250,
    requirement: 1000,
    icon: '🎯',
    prerequisite: 'daily-tap-500',
  },
  {
    id: 'daily-tap-2500',
    type: 'daily',
    title: 'Tap 2,500 times',
    description: 'Dedicated player',
    reward: 5000,
    xpReward: 500,
    requirement: 2500,
    icon: '🎯',
    prerequisite: 'daily-tap-1000',
  },
  {
    id: 'daily-tap-5000',
    type: 'daily',
    title: 'Tap 5,000 times',
    description: 'Hardcore player',
    reward: 10000,
    xpReward: 1000,
    requirement: 5000,
    icon: '🎯',
    prerequisite: 'daily-tap-2500',
  },
  {
    id: 'daily-tap-10000',
    type: 'daily',
    title: 'Tap 10,000 times',
    description: 'Ultra grinder',
    reward: 25000,
    xpReward: 2500,
    requirement: 10000,
    icon: '🎯',
    prerequisite: 'daily-tap-5000',
  },
];

// Helper functions
export function calculateUpgradeCost(upgrade: Upgrade, currentLevel: number): number {
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
}

export function calculateTotalBonus(
  upgrades: UserUpgrade[],
  bonusType: BonusType
): number {
  return upgrades.reduce((total, userUpgrade) => {
    const upgrade = UPGRADES.find((u) => u.id === userUpgrade.upgradeId);
    if (upgrade && upgrade.bonusType === bonusType) {
      return total + upgrade.bonusValue * userUpgrade.level;
    }
    return total;
  }, 0);
}

// Calculate level from XP
export function calculateLevelFromXP(xp: number): number {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpRequired) {
      return LEVELS[i].level;
    }
  }
  return 1;
}

// Get current level data
export function getLevelData(level: number): Level {
  return LEVELS.find(l => l.level === level) || LEVELS[0];
}

// Get next level data
export function getNextLevelData(level: number): Level | null {
  const nextLevel = LEVELS.find(l => l.level === level + 1);
  return nextLevel || null;
}

// Calculate total bonuses from all levels up to current
export function calculateLevelBonuses(level: number): {
  totalCoinsPerTap: number;
  totalMaxEnergy: number;
  passiveIncomeMultiplier: number;
} {
  let totalCoinsPerTap = 0;
  let totalMaxEnergy = 0;
  let passiveIncomeMultiplier = 1;

  for (const lvl of LEVELS) {
    if (lvl.level <= level) {
      totalCoinsPerTap += lvl.bonus.coinsPerTap || 0;
      totalMaxEnergy += lvl.bonus.maxEnergy || 0;
      if (lvl.bonus.passiveIncomeMultiplier) {
        passiveIncomeMultiplier = lvl.bonus.passiveIncomeMultiplier;
      }
    }
  }

  return { totalCoinsPerTap, totalMaxEnergy, passiveIncomeMultiplier };
}

// Legacy function for backwards compatibility
export function calculateLevel(coins: number): number {
  return Math.floor(coins / 10000) + 1;
}

// Daily reward helpers
export function canClaimDaily(lastClaim: number | null): boolean {
  if (!lastClaim) return true;

  const now = Date.now();
  const lastClaimDate = new Date(lastClaim);
  const today = new Date(now);

  // Reset to start of day (UTC)
  lastClaimDate.setUTCHours(0, 0, 0, 0);
  today.setUTCHours(0, 0, 0, 0);

  // Can claim if it's a new day
  return today.getTime() > lastClaimDate.getTime();
}

export function getDailyReward(streak: number): DailyReward {
  // Streak is 0-indexed, rewards are 1-indexed (day 1-7)
  // After 7 days, cycle back
  const dayIndex = streak % 7;
  return DAILY_REWARDS[dayIndex];
}

export function shouldResetStreak(lastClaim: number | null): boolean {
  if (!lastClaim) return false;

  const now = Date.now();
  const hoursSinceLastClaim = (now - lastClaim) / (1000 * 60 * 60);

  // Reset streak if more than 48 hours since last claim
  return hoursSinceLastClaim > 48;
}

export function getTimeUntilNextDaily(lastClaim: number | null): number {
  if (!lastClaim) return 0;

  const lastClaimDate = new Date(lastClaim);
  const nextClaimDate = new Date(lastClaimDate);

  // Next claim is available at start of next day (UTC)
  nextClaimDate.setUTCDate(nextClaimDate.getUTCDate() + 1);
  nextClaimDate.setUTCHours(0, 0, 0, 0);

  const now = Date.now();
  return Math.max(0, nextClaimDate.getTime() - now);
}

// Check if daily taps should be reset (new UTC day)
export function shouldResetDailyTaps(lastReset: number): boolean {
  const now = Date.now();
  const lastResetDate = new Date(lastReset);
  const today = new Date(now);

  // Reset to start of day (UTC)
  lastResetDate.setUTCHours(0, 0, 0, 0);
  today.setUTCHours(0, 0, 0, 0);

  // Should reset if it's a new day
  return today.getTime() > lastResetDate.getTime();
}

// Check if a task is part of a chain (has prerequisite or is a prerequisite for another task)
function isChainTask(taskId: string): boolean {
  const task = TASKS.find(t => t.id === taskId);
  if (!task) return false;

  // Has a prerequisite = part of a chain
  if (task.prerequisite) return true;

  // Is referenced as prerequisite by another task = start of a chain
  return TASKS.some(t => t.prerequisite === taskId);
}

// Filter tasks to show:
// - Uncompleted tasks (if prerequisites met)
// - Completed tasks (only if NOT part of a chain) - shown at bottom
export function getAvailableTasks(
  types: TaskType[],
  isTaskCompleted: (taskId: string) => boolean
): Task[] {
  const filtered = TASKS.filter((task) => {
    // Must be of requested type
    if (!types.includes(task.type)) return false;

    const completed = isTaskCompleted(task.id);
    const isChain = isChainTask(task.id);

    // Completed chain tasks: hide
    if (completed && isChain) return false;

    // Completed non-chain tasks: show
    if (completed && !isChain) return true;

    // Uncompleted tasks: show only if prerequisite is met
    return !task.prerequisite || isTaskCompleted(task.prerequisite);
  });

  // Sort: uncompleted first, completed at bottom
  return filtered.sort((a, b) => {
    const aCompleted = isTaskCompleted(a.id);
    const bCompleted = isTaskCompleted(b.id);
    if (aCompleted === bCompleted) return 0;
    return aCompleted ? 1 : -1;
  });
}
