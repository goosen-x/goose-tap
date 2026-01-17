'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  GameState,
  DEFAULT_GAME_STATE,
  UPGRADES,
  TASKS,
  UserUpgrade,
  UserTask,
  Referral,
  calculateUpgradeCost,
  calculateTotalBonus,
  calculateLevelFromXP,
  calculateLevelBonuses,
  getLevelData,
  getNextLevelData,
  XP_REWARDS,
  Level,
  DailyReward,
  DAILY_REWARDS,
  canClaimDaily,
  getDailyReward,
  getTimeUntilNextDaily,
} from '@/types/game';
import {
  loadGameState,
  saveGameState,
  calculateOfflineEarnings,
  calculateEnergyRestoration,
} from '@/lib/storage';
import { gameAPI } from './useGameAPI';

export interface UseGameStateOptions {
  initData: string;
}

export interface UseGameStateResult {
  // State
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

  // Level info
  levelData: Level;
  nextLevelData: Level | null;
  xpToNextLevel: number;
  levelProgress: number; // 0-100%

  // Daily rewards
  dailyStreak: number;
  lastDailyClaim: number | null;
  canClaimDailyReward: boolean;
  currentDailyReward: DailyReward;
  timeUntilNextDaily: number;
  allDailyRewards: DailyReward[];

  // Status
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  offlineEarnings: number;

  // Actions
  tap: () => void;
  purchaseUpgrade: (upgradeId: string) => boolean;
  completeTask: (taskId: string) => boolean;
  addReferral: (referral: Omit<Referral, 'id'>) => void;
  claimDailyReward: () => Promise<DailyReward | null>;
  save: () => void;

  // Helpers
  getUpgradeLevel: (upgradeId: string) => number;
  isTaskCompleted: (taskId: string) => boolean;
  getTaskProgress: (taskId: string) => number;
}

// Create initial state from localStorage as cache
function createInitialState(): GameState {
  if (typeof window === 'undefined') {
    return DEFAULT_GAME_STATE;
  }

  const loaded = loadGameState();

  // Calculate offline earnings
  const offlineEarnings = calculateOfflineEarnings(
    loaded.lastOfflineEarnings,
    loaded.coinsPerHour
  );

  // Calculate energy restoration
  const restoredEnergy = calculateEnergyRestoration(
    loaded.lastEnergyUpdate,
    loaded.energy,
    loaded.maxEnergy
  );

  return {
    ...loaded,
    coins: loaded.coins + offlineEarnings,
    energy: restoredEnergy,
    lastEnergyUpdate: Date.now(),
    lastOfflineEarnings: Date.now(),
  };
}

export function useGameState(options: UseGameStateOptions): UseGameStateResult {
  const { initData } = options;

  // State
  const [state, setState] = useState<GameState>(() => createInitialState());
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offlineEarnings, setOfflineEarnings] = useState(0);

  // Refs
  const stateRef = useRef(state);
  const initDataRef = useRef(initData);
  const loadedFromApi = useRef(false);

  // Keep refs in sync
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    initDataRef.current = initData;
  }, [initData]);

  // Load game from API on mount
  useEffect(() => {
    if (loadedFromApi.current) return;

    // If no initData, use localStorage only
    if (!initData) {
      setIsLoading(false);
      setIsLoaded(true);
      return;
    }

    const loadFromApi = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await gameAPI.loadGame(initData);

        setState(response.state);
        setOfflineEarnings(response.offlineEarnings);
        saveGameState(response.state); // Cache in localStorage
        loadedFromApi.current = true;
      } catch (err) {
        console.error('Failed to load from API, using localStorage:', err);
        // Keep localStorage state as fallback
        setError(err instanceof Error ? err.message : 'Failed to load game');
      } finally {
        setIsLoading(false);
        setIsLoaded(true);
      }
    };

    loadFromApi();
  }, [initData]);

  // Energy regeneration timer
  useEffect(() => {
    if (!isLoaded) return;

    const interval = setInterval(() => {
      setState((prev) => {
        if (prev.energy >= prev.maxEnergy) return prev;
        const newState = {
          ...prev,
          energy: Math.min(prev.energy + 1, prev.maxEnergy),
          lastEnergyUpdate: Date.now(),
        };
        saveGameState(newState); // Cache locally
        return newState;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoaded]);

  // Passive income timer (coins per hour)
  // Accumulate fractional coins to handle small hourly rates
  const accumulatedCoins = useRef(0);

  useEffect(() => {
    if (!isLoaded || state.coinsPerHour === 0) return;

    const interval = setInterval(() => {
      setState((prev) => {
        // Add fractional coins per second
        accumulatedCoins.current += prev.coinsPerHour / 3600;

        // Only add whole coins to the state
        const wholeCoins = Math.floor(accumulatedCoins.current);
        if (wholeCoins > 0) {
          accumulatedCoins.current -= wholeCoins;
          const newState = {
            ...prev,
            coins: prev.coins + wholeCoins,
          };
          saveGameState(newState); // Cache locally
          return newState;
        }

        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoaded, state.coinsPerHour]);

  // Periodic save to API
  useEffect(() => {
    if (!isLoaded || !initDataRef.current) return;

    const interval = setInterval(() => {
      gameAPI.saveGame(initDataRef.current, stateRef.current).catch(console.error);
    }, 30000); // Save every 30 seconds

    return () => clearInterval(interval);
  }, [isLoaded]);

  // Helper to recalculate stats with upgrades and level bonuses
  const recalculateStats = useCallback((
    upgrades: UserUpgrade[],
    level: number
  ) => {
    const upgradeBonus = {
      tap: calculateTotalBonus(upgrades, 'tap'),
      hour: calculateTotalBonus(upgrades, 'hour'),
      energy: calculateTotalBonus(upgrades, 'energy'),
    };
    const levelBonus = calculateLevelBonuses(level);

    return {
      coinsPerTap: 1 + upgradeBonus.tap + levelBonus.totalCoinsPerTap,
      coinsPerHour: Math.floor(upgradeBonus.hour * levelBonus.passiveIncomeMultiplier),
      maxEnergy: 1000 + upgradeBonus.energy + levelBonus.totalMaxEnergy,
    };
  }, []);

  // Tap handler with optimistic update
  const tap = useCallback(() => {
    // Optimistic update
    setState((prev) => {
      if (prev.energy <= 0) return prev;

      const newXP = prev.xp + XP_REWARDS.tap;
      const newLevel = calculateLevelFromXP(newXP);
      const newTotalTaps = prev.totalTaps + 1;

      // Recalculate stats if level changed
      let stats = {
        coinsPerTap: prev.coinsPerTap,
        coinsPerHour: prev.coinsPerHour,
        maxEnergy: prev.maxEnergy,
      };
      if (newLevel !== prev.level) {
        stats = recalculateStats(prev.upgrades, newLevel);
      }

      const newState = {
        ...prev,
        coins: prev.coins + prev.coinsPerTap,
        xp: newXP,
        energy: prev.energy - 1,
        level: newLevel,
        totalTaps: newTotalTaps,
        ...stats,
      };
      saveGameState(newState); // Cache locally
      return newState;
    });

    // Sync with API in background (debounced via batch)
    // For performance, we don't await this
    if (initDataRef.current) {
      gameAPI.tap(initDataRef.current, 1).catch(console.error);
    }
  }, [recalculateStats]);

  // Purchase upgrade with optimistic update
  const purchaseUpgrade = useCallback((upgradeId: string): boolean => {
    const upgrade = UPGRADES.find((u) => u.id === upgradeId);
    if (!upgrade) return false;

    let success = false;

    setState((prev) => {
      const existingUpgrade = prev.upgrades.find((u) => u.upgradeId === upgradeId);
      const currentLevel = existingUpgrade?.level ?? 0;

      if (currentLevel >= upgrade.maxLevel) return prev;

      const cost = calculateUpgradeCost(upgrade, currentLevel);
      if (prev.coins < cost) return prev;

      const newUpgradeLevel = currentLevel + 1;
      const newUpgrades: UserUpgrade[] = existingUpgrade
        ? prev.upgrades.map((u) =>
            u.upgradeId === upgradeId ? { ...u, level: newUpgradeLevel } : u
          )
        : [...prev.upgrades, { upgradeId, level: 1 }];

      // Award XP for upgrade (100 * upgrade level)
      const xpGained = XP_REWARDS.upgrade * newUpgradeLevel;
      const newXP = prev.xp + xpGained;
      const newLevel = calculateLevelFromXP(newXP);

      // Recalculate stats with new upgrades and level
      const stats = recalculateStats(newUpgrades, newLevel);

      success = true;

      const newState = {
        ...prev,
        coins: prev.coins - cost,
        xp: newXP,
        level: newLevel,
        upgrades: newUpgrades,
        ...stats,
      };
      saveGameState(newState); // Cache locally
      return newState;
    });

    // Sync with API in background
    if (success && initDataRef.current) {
      gameAPI.purchaseUpgrade(initDataRef.current, upgradeId).catch(console.error);
    }

    return success;
  }, [recalculateStats]);

  // Complete task with optimistic update
  const completeTask = useCallback((taskId: string): boolean => {
    const task = TASKS.find((t) => t.id === taskId);
    if (!task) return false;

    let success = false;

    setState((prev) => {
      const existingTask = prev.tasks.find((t) => t.taskId === taskId);
      if (existingTask?.status === 'claimed') return prev;

      // Check requirements
      if (task.type === 'referral' && task.requirement) {
        if (prev.referrals.length < task.requirement) return prev;
      }

      if (task.id === 'reach-level-5' && task.requirement) {
        if (prev.level < task.requirement) return prev;
      }

      const newTasks: UserTask[] = existingTask
        ? prev.tasks.map((t) =>
            t.taskId === taskId
              ? { ...t, status: 'claimed' as const, completedAt: Date.now() }
              : t
          )
        : [...prev.tasks, { taskId, status: 'claimed' as const, completedAt: Date.now() }];

      // Award XP for task
      const newXP = prev.xp + XP_REWARDS.task;
      const newLevel = calculateLevelFromXP(newXP);

      // Recalculate stats if level changed
      let stats = {
        coinsPerTap: prev.coinsPerTap,
        coinsPerHour: prev.coinsPerHour,
        maxEnergy: prev.maxEnergy,
      };
      if (newLevel !== prev.level) {
        stats = recalculateStats(prev.upgrades, newLevel);
      }

      success = true;

      const newState = {
        ...prev,
        coins: prev.coins + task.reward,
        xp: newXP,
        level: newLevel,
        tasks: newTasks,
        ...stats,
      };
      saveGameState(newState); // Cache locally
      return newState;
    });

    // Sync with API in background
    if (success && initDataRef.current) {
      gameAPI.completeTask(initDataRef.current, taskId).catch(console.error);
    }

    return success;
  }, [recalculateStats]);

  // Add referral
  const addReferral = useCallback((referral: Omit<Referral, 'id'>): void => {
    setState((prev) => {
      // Award XP for referral
      const newXP = prev.xp + XP_REWARDS.referral;
      const newLevel = calculateLevelFromXP(newXP);

      // Recalculate stats if level changed
      let stats = {
        coinsPerTap: prev.coinsPerTap,
        coinsPerHour: prev.coinsPerHour,
        maxEnergy: prev.maxEnergy,
      };
      if (newLevel !== prev.level) {
        stats = recalculateStats(prev.upgrades, newLevel);
      }

      const newState = {
        ...prev,
        referrals: [
          ...prev.referrals,
          { ...referral, id: `ref-${Date.now()}-${Math.random().toString(36).slice(2)}` },
        ],
        coins: prev.coins + 10000, // Referral bonus
        xp: newXP,
        level: newLevel,
        ...stats,
      };
      saveGameState(newState); // Cache locally
      return newState;
    });

    // Sync with API
    if (initDataRef.current) {
      gameAPI.saveGame(initDataRef.current, stateRef.current).catch(console.error);
    }
  }, [recalculateStats]);

  // Get upgrade level
  const getUpgradeLevel = useCallback(
    (upgradeId: string): number => {
      return state.upgrades.find((u) => u.upgradeId === upgradeId)?.level ?? 0;
    },
    [state.upgrades]
  );

  // Check if task is completed
  const isTaskCompleted = useCallback(
    (taskId: string): boolean => {
      return state.tasks.find((t) => t.taskId === taskId)?.status === 'claimed';
    },
    [state.tasks]
  );

  // Get task progress
  const getTaskProgress = useCallback(
    (taskId: string): number => {
      const task = TASKS.find((t) => t.id === taskId);
      if (!task?.requirement) return 0;

      if (task.type === 'referral') {
        return state.referrals.length;
      }

      if (task.id === 'reach-level-5') {
        return state.level;
      }

      return 0;
    },
    [state.referrals.length, state.level]
  );

  // Claim daily reward
  const claimDailyReward = useCallback(async (): Promise<DailyReward | null> => {
    if (!initDataRef.current) return null;
    if (!canClaimDaily(stateRef.current.lastDailyClaim)) return null;

    try {
      const response = await fetch('/api/game/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: initDataRef.current }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Daily claim error:', error);
        return null;
      }

      const data = await response.json();

      // Update local state with server response
      setState(data.state);
      saveGameState(data.state);

      return data.reward as DailyReward;
    } catch (error) {
      console.error('Failed to claim daily reward:', error);
      return null;
    }
  }, []);

  // Manual save
  const save = useCallback(() => {
    saveGameState(stateRef.current);
    if (initDataRef.current) {
      gameAPI.saveGame(initDataRef.current, stateRef.current).catch(console.error);
    }
  }, []);

  // Calculate level progress info
  const levelData = getLevelData(state.level);
  const nextLevelData = getNextLevelData(state.level);
  const xpToNextLevel = nextLevelData ? nextLevelData.xpRequired - state.xp : 0;
  const levelProgress = nextLevelData
    ? ((state.xp - levelData.xpRequired) / (nextLevelData.xpRequired - levelData.xpRequired)) * 100
    : 100;

  // Calculate daily reward info
  const canClaimDailyRewardNow = canClaimDaily(state.lastDailyClaim);
  const currentDailyReward = getDailyReward(state.dailyStreak);
  const timeUntilNextDaily = getTimeUntilNextDaily(state.lastDailyClaim);

  return {
    // State
    ...state,
    isLoaded,
    isLoading,
    error,
    offlineEarnings,

    // Level info
    levelData,
    nextLevelData,
    xpToNextLevel,
    levelProgress: Math.min(Math.max(levelProgress, 0), 100),

    // Daily rewards
    canClaimDailyReward: canClaimDailyRewardNow,
    currentDailyReward,
    timeUntilNextDaily,
    allDailyRewards: DAILY_REWARDS,

    // Actions
    tap,
    purchaseUpgrade,
    completeTask,
    addReferral,
    claimDailyReward,
    save,

    // Helpers
    getUpgradeLevel,
    isTaskCompleted,
    getTaskProgress,
  };
}
