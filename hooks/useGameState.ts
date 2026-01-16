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
  startAutosave,
  stopAutosave,
} from '@/lib/storage';

// Lazy initializer for useState - runs only once on first render
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

export function useGameState() {
  // Use lazy initialization - function runs only on initial render
  const [state, setState] = useState<GameState>(() => createInitialState());
  const stateRef = useRef(state);
  const autosaveInitialized = useRef(false);

  // isLoaded is derived from whether we're in the browser - no need for state
  const isLoaded = typeof window !== 'undefined';

  // Keep ref in sync with state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Setup autosave on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (autosaveInitialized.current) return;
    autosaveInitialized.current = true;

    // Start autosave
    startAutosave(() => stateRef.current);

    return () => {
      stopAutosave();
      saveGameState(stateRef.current);
    };
  }, []);

  // Energy regeneration timer
  useEffect(() => {
    if (!isLoaded) return;

    const interval = setInterval(() => {
      setState((prev) => {
        if (prev.energy >= prev.maxEnergy) return prev;
        return {
          ...prev,
          energy: Math.min(prev.energy + 1, prev.maxEnergy),
          lastEnergyUpdate: Date.now(),
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoaded]);

  // Passive income timer (coins per hour)
  useEffect(() => {
    if (!isLoaded || state.coinsPerHour === 0) return;

    const interval = setInterval(() => {
      setState((prev) => ({
        ...prev,
        coins: prev.coins + Math.floor(prev.coinsPerHour / 3600), // Per second
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoaded, state.coinsPerHour]);

  // Tap handler
  const tap = useCallback(() => {
    setState((prev) => {
      if (prev.energy <= 0) return prev;

      const newCoins = prev.coins + prev.coinsPerTap;
      const newLevel = calculateLevel(newCoins);

      return {
        ...prev,
        coins: newCoins,
        energy: prev.energy - 1,
        level: newLevel,
      };
    });
  }, []);

  // Purchase upgrade
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

      return {
        ...prev,
        coins: prev.coins - cost,
        upgrades: newUpgrades,
        coinsPerTap: newCoinsPerTap,
        coinsPerHour: newCoinsPerHour,
        maxEnergy: newMaxEnergy,
      };
    });

    return success;
  }, []);

  // Complete task
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

      return {
        ...prev,
        coins: prev.coins + task.reward,
        tasks: newTasks,
      };
    });

    return success;
  }, []);

  // Add referral
  const addReferral = useCallback((referral: Omit<Referral, 'id'>): void => {
    setState((prev) => ({
      ...prev,
      referrals: [
        ...prev.referrals,
        { ...referral, id: `ref-${Date.now()}-${Math.random().toString(36).slice(2)}` },
      ],
      coins: prev.coins + 10000, // Referral bonus
    }));
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
  }, []);

  return {
    // State
    ...state,
    isLoaded,

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
