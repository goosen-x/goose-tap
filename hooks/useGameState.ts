'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  GameState,
  DEFAULT_GAME_STATE,
  UPGRADES,
  TASKS,
  UserUpgrade,
  UserTask,
  Referral,
  ReferralEarnings,
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
} from '@/lib/storage';
import {
  loadGame,
  saveGame,
  tap as tapAction,
  purchaseUpgrade as purchaseUpgradeAction,
  completeTask as completeTaskAction,
} from '@/app/actions/game';
import { useSyncOnFocus } from './useSyncOnFocus';

export interface UseGameStateOptions {
  initData: string;
}

export interface UseGameStateResult {
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
  referralEarnings: ReferralEarnings;
  lastEnergyUpdate: number;
  lastOfflineEarnings: number;
  levelData: Level;
  nextLevelData: Level | null;
  xpToNextLevel: number;
  levelProgress: number;
  dailyStreak: number;
  lastDailyClaim: number | null;
  canClaimDailyReward: boolean;
  currentDailyReward: DailyReward;
  timeUntilNextDaily: number;
  allDailyRewards: DailyReward[];
  isLoaded: boolean;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  offlineEarnings: number;
  offlineMinutes: number;
  tap: () => void;
  purchaseUpgrade: (upgradeId: string) => boolean;
  completeTask: (taskId: string) => boolean;
  addReferral: (referral: Omit<Referral, 'id'>) => void;
  claimDailyReward: () => Promise<DailyReward | null>;
  save: () => void;
  getUpgradeLevel: (upgradeId: string) => number;
  isTaskCompleted: (taskId: string) => boolean;
  getTaskProgress: (taskId: string) => number;
  // Dev-only: direct state update for testing
  devUpdateState: (updates: Partial<GameState>) => void;
  // Force sync from server (clears localStorage)
  forceSync: () => void;
  // For DevPanel
  initData: string;
}

function createInitialState(): GameState {
  if (typeof window === 'undefined') {
    return DEFAULT_GAME_STATE;
  }
  return loadGameState();
}

export function useGameState(options: UseGameStateOptions): UseGameStateResult {
  const { initData } = options;

  // Core state
  const [state, setState] = useState<GameState>(() => createInitialState());
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offlineEarnings, setOfflineEarnings] = useState(0);
  const [offlineMinutes, setOfflineMinutes] = useState(0);

  // Refs (don't cause re-renders)
  const stateRef = useRef(state);
  const initDataRef = useRef(initData);
  const loadedRef = useRef(false);
  const lastTapRef = useRef(0);
  const tapBatchRef = useRef(0);
  const accumulatedCoins = useRef(0);

  // Constants
  const TAP_THROTTLE_MS = 50;
  const TAP_BATCH_SIZE = 10;

  // Keep refs in sync
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    initDataRef.current = initData;
  }, [initData]);

  // Load from API once on mount
  useEffect(() => {
    if (loadedRef.current) return;

    if (!initData) {
      setIsLoading(false);
      setIsLoaded(true);
      return;
    }

    loadedRef.current = true;

    loadGame(initData)
      .then((response) => {
        if (response.success && response.state) {
          setState(response.state);
          saveGameState(response.state);
          setOfflineEarnings(response.offlineEarnings ?? 0);
          setOfflineMinutes(response.offlineMinutes ?? 0);
        } else {
          setError(response.error ?? 'Load failed');
        }
        setIsLoading(false);
        setIsLoaded(true);
      })
      .catch((err) => {
        console.error('[GameState] Load failed:', err);
        setError(err.message);
        setIsLoading(false);
        setIsLoaded(true);
      });
  }, [initData]);

  // Energy regeneration - use ref to batch updates and reduce re-renders
  const energyAccumulator = useRef(0);
  const ENERGY_REGEN_RATE = 1; // 1 energy per second
  const ENERGY_UPDATE_INTERVAL = 1000; // Check every second
  const ENERGY_BATCH_THRESHOLD = 3; // Only update state every 3 energy points

  useEffect(() => {
    if (!isLoaded) return;

    const interval = setInterval(() => {
      setState((prev) => {
        if (prev.energy >= prev.maxEnergy) {
          energyAccumulator.current = 0;
          return prev;
        }

        energyAccumulator.current += ENERGY_REGEN_RATE;

        // Only trigger re-render when batch threshold is reached OR energy is low
        const shouldUpdate = energyAccumulator.current >= ENERGY_BATCH_THRESHOLD ||
          prev.energy < 10; // Always update when energy is very low

        if (shouldUpdate) {
          const energyToAdd = Math.floor(energyAccumulator.current);
          energyAccumulator.current -= energyToAdd;
          const newEnergy = Math.min(prev.energy + energyToAdd, prev.maxEnergy);

          if (newEnergy === prev.energy) return prev;

          const newState = {
            ...prev,
            energy: newEnergy,
            lastEnergyUpdate: Date.now(),
          };
          stateRef.current = newState;
          saveGameState(newState);
          return newState;
        }

        return prev;
      });
    }, ENERGY_UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [isLoaded]);

  // Passive income - batch updates to reduce re-renders
  const PASSIVE_INCOME_UPDATE_INTERVAL = 1000; // Check every second
  const PASSIVE_INCOME_BATCH_THRESHOLD = 5; // Only update state when 5+ coins accumulated

  useEffect(() => {
    if (!isLoaded || state.coinsPerHour === 0) return;

    const interval = setInterval(() => {
      setState((prev) => {
        accumulatedCoins.current += prev.coinsPerHour / 3600;

        // Only update state when threshold is reached
        if (accumulatedCoins.current >= PASSIVE_INCOME_BATCH_THRESHOLD) {
          const wholeCoins = Math.floor(accumulatedCoins.current);
          accumulatedCoins.current -= wholeCoins;
          const newState = { ...prev, coins: prev.coins + wholeCoins };
          stateRef.current = newState;
          saveGameState(newState);
          return newState;
        }
        return prev;
      });
    }, PASSIVE_INCOME_UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [isLoaded, state.coinsPerHour]);

  // Periodic save to server (every 10 seconds)
  useEffect(() => {
    if (!isLoaded || !initData) return;

    const interval = setInterval(() => {
      saveGame(initDataRef.current, stateRef.current).catch(console.error);
    }, 10000);

    return () => clearInterval(interval);
  }, [isLoaded, initData]);

  // Helper to recalculate stats
  const recalculateStats = useCallback((upgrades: UserUpgrade[], level: number) => {
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

  // Sync on focus - merge server state with local state
  const handleSyncFromServer = useCallback((serverState: GameState) => {
    setState(prev => {
      // Merge strategy: take max for coins/xp (don't lose progress), server for energy
      const mergedState = {
        ...serverState,
        coins: Math.max(prev.coins, serverState.coins),
        xp: Math.max(prev.xp, serverState.xp),
      };
      saveGameState(mergedState);
      return mergedState;
    });
  }, []);

  const { isSyncing } = useSyncOnFocus({
    initData,
    onSync: handleSyncFromServer,
    debounceMs: 2000,
    enabled: isLoaded,
  });

  // Tap handler
  const tap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < TAP_THROTTLE_MS) return;
    lastTapRef.current = now;

    setState((prev) => {
      if (prev.energy <= 0) return prev;

      const newXP = prev.xp + XP_REWARDS.tap;
      const newLevel = calculateLevelFromXP(newXP);
      const newTotalTaps = prev.totalTaps + 1;

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
      // Update ref immediately for reliable sendBeacon
      stateRef.current = newState;
      saveGameState(newState);
      return newState;
    });

    // Batch taps for server
    tapBatchRef.current += 1;
    if (tapBatchRef.current >= TAP_BATCH_SIZE && initDataRef.current) {
      const count = tapBatchRef.current;
      tapBatchRef.current = 0;
      tapAction(initDataRef.current, count).catch(console.error);
    }
  }, [recalculateStats]);

  // Flush taps and save state on visibility change
  useEffect(() => {
    const flush = () => {
      if (tapBatchRef.current > 0 && initDataRef.current) {
        const count = tapBatchRef.current;
        tapBatchRef.current = 0;
        tapAction(initDataRef.current, count).catch(console.error);
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        flush();
        // sendBeacon for reliable save on close/hide
        if (initDataRef.current) {
          const blob = new Blob(
            [JSON.stringify({
              initData: initDataRef.current,
              state: stateRef.current,
            })],
            { type: 'application/json' }
          );
          navigator.sendBeacon('/api/game/save', blob);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      flush();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Purchase upgrade - server-first to ensure persistence
  const purchaseUpgrade = useCallback((upgradeId: string): boolean => {
    const upgrade = UPGRADES.find((u) => u.id === upgradeId);
    if (!upgrade) return false;

    // Pre-validate locally
    const currentState = stateRef.current;
    const existing = currentState.upgrades.find((u) => u.upgradeId === upgradeId);
    const currentLevel = existing?.level ?? 0;

    if (currentLevel >= upgrade.maxLevel) return false;

    const cost = calculateUpgradeCost(upgrade, currentLevel);
    if (currentState.coins < cost) return false;

    // Optimistic update
    const newLevel = currentLevel + 1;
    const newUpgrades: UserUpgrade[] = existing
      ? currentState.upgrades.map((u) => u.upgradeId === upgradeId ? { ...u, level: newLevel } : u)
      : [...currentState.upgrades, { upgradeId, level: 1 }];

    const xpGained = XP_REWARDS.upgrade * newLevel;
    const newXP = currentState.xp + xpGained;
    const newPlayerLevel = calculateLevelFromXP(newXP);
    const stats = recalculateStats(newUpgrades, newPlayerLevel);

    const optimisticState = {
      ...currentState,
      coins: currentState.coins - cost,
      xp: newXP,
      level: newPlayerLevel,
      upgrades: newUpgrades,
      ...stats,
    };

    // Update ref IMMEDIATELY (before setState) for reliable sendBeacon on close
    stateRef.current = optimisticState;

    // Update local state for UI
    setState(optimisticState);
    saveGameState(optimisticState);

    // Call Server Action and handle response
    if (initDataRef.current) {
      purchaseUpgradeAction(initDataRef.current, upgradeId)
        .then((response) => {
          // Sync with server state to ensure consistency
          if (response.success && response.state) {
            setState(response.state);
            saveGameState(response.state);
          } else if (!response.success) {
            console.error('[Upgrade] Server action failed:', response.error);
            setState(currentState);
            saveGameState(currentState);
          }
        })
        .catch((err) => {
          console.error('[Upgrade] Server action failed, rolling back:', err);
          // Rollback to previous state
          setState(currentState);
          saveGameState(currentState);
        });
    }

    return true;
  }, [recalculateStats]);

  // Complete task - server-first to ensure persistence
  const completeTask = useCallback((taskId: string): boolean => {
    const task = TASKS.find((t) => t.id === taskId);
    if (!task) return false;

    // Pre-validate locally
    const currentState = stateRef.current;
    const existing = currentState.tasks.find((t) => t.taskId === taskId);
    if (existing?.status === 'claimed') return false;

    if (task.type === 'referral' && task.requirement && currentState.referrals.length < task.requirement) return false;
    if (task.id === 'reach-level-5' && task.requirement && currentState.level < task.requirement) return false;

    // Optimistic update
    const newTasks: UserTask[] = existing
      ? currentState.tasks.map((t) => t.taskId === taskId ? { ...t, status: 'claimed' as const, completedAt: Date.now() } : t)
      : [...currentState.tasks, { taskId, status: 'claimed' as const, completedAt: Date.now() }];

    const newXP = currentState.xp + XP_REWARDS.task;
    const newLevel = calculateLevelFromXP(newXP);

    let stats = { coinsPerTap: currentState.coinsPerTap, coinsPerHour: currentState.coinsPerHour, maxEnergy: currentState.maxEnergy };
    if (newLevel !== currentState.level) {
      stats = recalculateStats(currentState.upgrades, newLevel);
    }

    const optimisticState = {
      ...currentState,
      coins: currentState.coins + task.reward,
      xp: newXP,
      level: newLevel,
      tasks: newTasks,
      ...stats,
    };

    // Update ref IMMEDIATELY (before setState) for reliable sendBeacon on close
    stateRef.current = optimisticState;

    // Update local state for UI
    setState(optimisticState);
    saveGameState(optimisticState);

    // Call Server Action and handle response
    if (initDataRef.current) {
      completeTaskAction(initDataRef.current, taskId)
        .then((response) => {
          // Sync with server state to ensure consistency
          if (response.success && response.state) {
            setState(response.state);
            saveGameState(response.state);
          } else if (!response.success) {
            console.error('[Task] Server action failed:', response.error);
            setState(currentState);
            saveGameState(currentState);
          }
        })
        .catch((err) => {
          console.error('[Task] Server action failed, rolling back:', err);
          // Rollback to previous state
          setState(currentState);
          saveGameState(currentState);
        });
    }

    return true;
  }, [recalculateStats]);

  // Add referral
  const addReferral = useCallback((referral: Omit<Referral, 'id'>): void => {
    setState((prev) => {
      const newXP = prev.xp + XP_REWARDS.referral;
      const newLevel = calculateLevelFromXP(newXP);

      let stats = { coinsPerTap: prev.coinsPerTap, coinsPerHour: prev.coinsPerHour, maxEnergy: prev.maxEnergy };
      if (newLevel !== prev.level) {
        stats = recalculateStats(prev.upgrades, newLevel);
      }

      const newState = {
        ...prev,
        referrals: [...prev.referrals, { ...referral, id: `ref-${Date.now()}-${Math.random().toString(36).slice(2)}` }],
        coins: prev.coins + 10000,
        xp: newXP,
        level: newLevel,
        ...stats,
      };
      stateRef.current = newState;
      saveGameState(newState);
      return newState;
    });

    if (initDataRef.current) {
      saveGame(initDataRef.current, stateRef.current).catch(console.error);
    }
  }, [recalculateStats]);

  // Helpers
  const getUpgradeLevel = useCallback(
    (upgradeId: string) => state.upgrades.find((u) => u.upgradeId === upgradeId)?.level ?? 0,
    [state.upgrades]
  );

  const isTaskCompleted = useCallback(
    (taskId: string) => state.tasks.find((t) => t.taskId === taskId)?.status === 'claimed',
    [state.tasks]
  );

  const getTaskProgress = useCallback(
    (taskId: string): number => {
      const task = TASKS.find((t) => t.id === taskId);
      if (!task?.requirement) return 0;
      if (task.type === 'referral') return state.referrals.length;
      if (taskId.startsWith('reach-level-')) return state.level;
      if (taskId.startsWith('tap-')) return state.totalTaps;
      return 0;
    },
    [state.referrals.length, state.level, state.totalTaps]
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

      if (!response.ok) return null;

      const data = await response.json();
      setState(data.state);
      saveGameState(data.state);
      return data.reward as DailyReward;
    } catch {
      return null;
    }
  }, []);

  // Manual save
  const save = useCallback(() => {
    saveGameState(stateRef.current);
    if (initDataRef.current) {
      saveGame(initDataRef.current, stateRef.current).catch(console.error);
    }
  }, []);

  // Dev-only: direct state update for testing
  const devUpdateState = useCallback((updates: Partial<GameState>) => {
    if (process.env.NODE_ENV !== 'development') return;
    setState(prev => {
      const newState = { ...prev, ...updates };
      saveGameState(newState);
      return newState;
    });
    // Save to server after state update (outside setState callback)
    setTimeout(() => {
      if (initDataRef.current) {
        saveGame(initDataRef.current, stateRef.current).catch(console.error);
      }
    }, 0);
  }, []);

  // Force sync from server - clears localStorage and reloads state
  const forceSync = useCallback(() => {
    if (!initDataRef.current) return;
    // Clear localStorage to force fresh load
    localStorage.removeItem('goose-tap-state');
    // Reload from server
    loadGame(initDataRef.current).then(response => {
      if (response.success && response.state) {
        setState(response.state);
        saveGameState(response.state);
        console.log('[forceSync] State synced from server');
      }
    }).catch(console.error);
  }, []);

  // Derived values - memoized to prevent recalculation on every render
  const levelData = useMemo(() => getLevelData(state.level), [state.level]);
  const nextLevelData = useMemo(() => getNextLevelData(state.level), [state.level]);

  const xpToNextLevel = useMemo(
    () => (nextLevelData ? nextLevelData.xpRequired - state.xp : 0),
    [nextLevelData, state.xp]
  );

  const levelProgress = useMemo(() => {
    if (!nextLevelData) return 100;
    const progress = ((state.xp - levelData.xpRequired) / (nextLevelData.xpRequired - levelData.xpRequired)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  }, [state.xp, levelData, nextLevelData]);

  const canClaimDailyReward = useMemo(
    () => canClaimDaily(state.lastDailyClaim),
    [state.lastDailyClaim]
  );

  const currentDailyReward = useMemo(
    () => getDailyReward(state.dailyStreak),
    [state.dailyStreak]
  );

  const timeUntilNextDaily = useMemo(
    () => getTimeUntilNextDaily(state.lastDailyClaim),
    [state.lastDailyClaim]
  );

  // Memoize the entire return object to prevent unnecessary context updates
  return useMemo(() => ({
    ...state,
    isLoaded,
    isLoading,
    isSyncing,
    error,
    offlineEarnings,
    offlineMinutes,
    levelData,
    nextLevelData,
    xpToNextLevel,
    levelProgress,
    canClaimDailyReward,
    currentDailyReward,
    timeUntilNextDaily,
    allDailyRewards: DAILY_REWARDS,
    tap,
    purchaseUpgrade,
    completeTask,
    addReferral,
    claimDailyReward,
    save,
    getUpgradeLevel,
    isTaskCompleted,
    getTaskProgress,
    devUpdateState,
    forceSync,
    initData,
  }), [
    state,
    isLoaded,
    isLoading,
    isSyncing,
    error,
    offlineEarnings,
    offlineMinutes,
    levelData,
    nextLevelData,
    xpToNextLevel,
    levelProgress,
    canClaimDailyReward,
    currentDailyReward,
    timeUntilNextDaily,
    tap,
    purchaseUpgrade,
    completeTask,
    addReferral,
    claimDailyReward,
    save,
    getUpgradeLevel,
    isTaskCompleted,
    getTaskProgress,
    devUpdateState,
    forceSync,
    initData,
  ]);
}
