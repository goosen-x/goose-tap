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

// Game state
export interface GameState {
  coins: number;
  energy: number;
  maxEnergy: number;
  coinsPerTap: number;
  coinsPerHour: number;
  level: number;
  upgrades: UserUpgrade[];
  tasks: UserTask[];
  referrals: Referral[];
  lastEnergyUpdate: number;
  lastOfflineEarnings: number;
}

// Default game state
export const DEFAULT_GAME_STATE: GameState = {
  coins: 0,
  energy: 1000,
  maxEnergy: 1000,
  coinsPerTap: 1,
  coinsPerHour: 0,
  level: 1,
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

export function calculateLevel(coins: number): number {
  return Math.floor(coins / 10000) + 1;
}
