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
export type TaskType = 'social' | 'daily' | 'referral';
export type TaskStatus = 'pending' | 'completed' | 'claimed';

export interface Task {
  id: string;
  type: TaskType;
  title: string;
  description: string;
  reward: number;
  action?: string;
  requirement?: number;
  icon: string;
  /** Channel/group ID for subscription verification */
  channelId?: string;
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
];

// XP rewards
export const XP_REWARDS = {
  tap: 1,
  upgrade: 100, // multiplied by upgrade level
  task: 500,
  referral: 1000,
};

// Game state
export interface GameState {
  coins: number;
  xp: number;
  energy: number;
  maxEnergy: number;
  coinsPerTap: number;
  coinsPerHour: number;
  level: number;
  totalTaps: number;
  upgrades: UserUpgrade[];
  tasks: UserTask[];
  referrals: Referral[];
  lastEnergyUpdate: number;
  lastOfflineEarnings: number;
}

// Default game state
export const DEFAULT_GAME_STATE: GameState = {
  coins: 0,
  xp: 0,
  energy: 1000,
  maxEnergy: 1000,
  coinsPerTap: 1,
  coinsPerHour: 0,
  level: 1,
  totalTaps: 0,
  upgrades: [],
  tasks: [],
  referrals: [],
  lastEnergyUpdate: Date.now(),
  lastOfflineEarnings: Date.now(),
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
  {
    id: 'subscribe-gooselabs',
    type: 'social',
    title: 'Subscribe to @gooselabs',
    description: 'Join Goose Labs channel',
    reward: 5000,
    action: 'https://t.me/gooselabs',
    channelId: '@gooselabs',
    icon: '📢',
  },
  {
    id: 'join-group',
    type: 'social',
    title: 'Join Telegram group',
    description: 'Join our community chat',
    reward: 3000,
    action: 'https://t.me/goosetap_chat',
    icon: '💬',
  },
  {
    id: 'daily-login',
    type: 'daily',
    title: 'Daily login',
    description: 'Claim your daily reward',
    reward: 1000,
    icon: '📅',
  },
  {
    id: 'invite-3-friends',
    type: 'referral',
    title: 'Invite 3 friends',
    description: 'Get friends to join the game',
    reward: 10000,
    requirement: 3,
    icon: '👥',
  },
  {
    id: 'reach-level-5',
    type: 'daily',
    title: 'Reach level 5',
    description: 'Level up your goose',
    reward: 5000,
    requirement: 5,
    icon: '⭐',
  },
  {
    id: 'tap-1000',
    type: 'daily',
    title: 'Tap 1000 times',
    description: 'Get tapping!',
    reward: 2000,
    requirement: 1000,
    icon: '👆',
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
