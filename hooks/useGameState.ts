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
  calculateLevel,
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
  useEffect(() => {
    if (!isLoaded || state.coinsPerHour === 0) return;

    const interval = setInterval(() => {
      setState((prev) => {
        const newState = {
          ...prev,
          coins: prev.coins + Math.floor(prev.coinsPerHour / 3600), // Per second
        };
        saveGameState(newState); // Cache locally
        return newState;
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

  // Tap handler with optimistic update
  const tap = useCallback(() => {
    // Optimistic update
    setState((prev) => {
      if (prev.energy <= 0) return prev;

      const newCoins = prev.coins + prev.coinsPerTap;
      const newLevel = calculateLevel(newCoins);

      const newState = {
        ...prev,
        coins: newCoins,
        energy: prev.energy - 1,
        level: newLevel,
      };
      saveGameState(newState); // Cache locally
      return newState;
    });

    // Sync with API in background (debounced via batch)
    // For performance, we don't await this
    if (initDataRef.current) {
      gameAPI.tap(initDataRef.current, 1).catch(console.error);
    }
  }, []);

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

      const newUpgrades: UserUpgrade[] = existingUpgrade
        ? prev.upgrades.map((u) =>
            u.upgradeId === upgradeId ? { ...u, level: u.level + 1 } : u
          )
        : [...prev.upgrades, { upgradeId, level: 1 }];

      // Recalculate bonuses
      const newCoinsPerTap = 1 + calculateTotalBonus(newUpgrades, 'tap');
      const newCoinsPerHour = calculateTotalBonus(newUpgrades, 'hour');
      const newMaxEnergy = 1000 + calculateTotalBonus(newUpgrades, 'energy');

      success = true;

      const newState = {
        ...prev,
        coins: prev.coins - cost,
        upgrades: newUpgrades,
        coinsPerTap: newCoinsPerTap,
        coinsPerHour: newCoinsPerHour,
        maxEnergy: newMaxEnergy,
      };
      saveGameState(newState); // Cache locally
      return newState;
    });

    // Sync with API in background
    if (success && initDataRef.current) {
      gameAPI.purchaseUpgrade(initDataRef.current, upgradeId).catch(console.error);
    }

    return success;
  }, []);

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

      success = true;

      const newState = {
        ...prev,
        coins: prev.coins + task.reward,
        tasks: newTasks,
      };
      saveGameState(newState); // Cache locally
      return newState;
    });

    // Sync with API in background
    if (success && initDataRef.current) {
      gameAPI.completeTask(initDataRef.current, taskId).catch(console.error);
    }

    return success;
  }, []);

  // Add referral
  const addReferral = useCallback((referral: Omit<Referral, 'id'>): void => {
    setState((prev) => {
      const newState = {
        ...prev,
        referrals: [
          ...prev.referrals,
          { ...referral, id: `ref-${Date.now()}-${Math.random().toString(36).slice(2)}` },
        ],
        coins: prev.coins + 10000, // Referral bonus
      };
      saveGameState(newState); // Cache locally
      return newState;
    });

    // Sync with API
    if (initDataRef.current) {
      gameAPI.saveGame(initDataRef.current, stateRef.current).catch(console.error);
    }
  }, []);

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

  // Manual save
  const save = useCallback(() => {
    saveGameState(stateRef.current);
    if (initDataRef.current) {
      gameAPI.saveGame(initDataRef.current, stateRef.current).catch(console.error);
    }
  }, []);

  return {
    // State
    ...state,
    isLoaded,
    isLoading,
    error,
    offlineEarnings,

    // Actions
    tap,
    purchaseUpgrade,
    completeTask,
    addReferral,
    save,

    // Helpers
    getUpgradeLevel,
    isTaskCompleted,
    getTaskProgress,
  };
}
