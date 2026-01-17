'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GameState } from '@/types/game';
import { gameAPI, LoadGameResponse, TapResponse, UpgradeResponse, TaskResponse } from './useGameAPI';

// Query keys
export const gameKeys = {
  all: ['game'] as const,
  state: (initData: string) => [...gameKeys.all, 'state', initData] as const,
};

// Load game state query
export function useGameQuery(initData: string | null) {
  return useQuery({
    queryKey: gameKeys.state(initData || ''),
    queryFn: async (): Promise<LoadGameResponse> => {
      if (!initData) {
        throw new Error('No initData provided');
      }
      return gameAPI.loadGame(initData);
    },
    enabled: !!initData,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // Auto-sync when app regains focus
    retry: 2,
  });
}

// Tap mutation - fire and forget, no cache updates
export function useTapMutation(initData: string | null) {
  return useMutation({
    mutationFn: async ({ count = 1 }: { count?: number }): Promise<TapResponse> => {
      if (!initData) throw new Error('No initData');
      return gameAPI.tap(initData, count);
    },
    // Don't update cache or cause re-renders - local state handles UI
    onError: (err) => {
      console.error('[TapMutation] Error:', err);
    },
  });
}

// Purchase upgrade mutation - fire and forget
export function usePurchaseMutation(initData: string | null) {
  return useMutation({
    mutationFn: async (upgradeId: string): Promise<UpgradeResponse> => {
      if (!initData) throw new Error('No initData');
      return gameAPI.purchaseUpgrade(initData, upgradeId);
    },
    onError: (err) => {
      console.error('[PurchaseMutation] Error:', err);
    },
  });
}

// Complete task mutation - fire and forget
export function useTaskMutation(initData: string | null) {
  return useMutation({
    mutationFn: async (taskId: string): Promise<TaskResponse> => {
      if (!initData) throw new Error('No initData');
      return gameAPI.completeTask(initData, taskId);
    },
    onError: (err) => {
      console.error('[TaskMutation] Error:', err);
    },
  });
}

// Save game mutation - fire and forget
export function useSaveMutation(initData: string | null) {
  return useMutation({
    mutationFn: async (state: GameState) => {
      if (!initData) throw new Error('No initData');
      return gameAPI.saveGame(initData, state);
    },
    onError: (err) => {
      console.error('[SaveMutation] Error:', err);
    },
  });
}

// Hook to invalidate game state (force refetch)
export function useInvalidateGameState(initData: string | null) {
  const queryClient = useQueryClient();

  return () => {
    if (initData) {
      queryClient.invalidateQueries({ queryKey: gameKeys.state(initData) });
    }
  };
}

// Hook to get current cached game state
export function useGameStateFromCache(initData: string | null): GameState | undefined {
  const queryClient = useQueryClient();
  const data = queryClient.getQueryData<LoadGameResponse>(
    gameKeys.state(initData || '')
  );
  return data?.state;
}
