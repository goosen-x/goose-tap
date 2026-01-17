'use client';

import { GameState } from '@/types/game';

export interface LoadGameResponse {
  success: boolean;
  state: GameState;
  offlineEarnings: number;
  user: {
    id: number;
    username?: string;
    firstName: string;
  };
}

export interface SaveGameResponse {
  success: boolean;
  state: GameState;
}

export interface TapResponse {
  success: boolean;
  state: GameState;
  tapped: number;
  coinsEarned: number;
}

export interface UpgradeResponse {
  success: boolean;
  state: GameState;
  cost: number;
  newLevel: number;
}

export interface TaskResponse {
  success: boolean;
  state: GameState;
  reward: number;
}

export interface ApiError {
  error: string;
}

async function apiRequest<T>(
  endpoint: string,
  body: Record<string, unknown>
): Promise<T> {
  const response = await fetch(`/api/game/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error((data as ApiError).error || 'Request failed');
  }

  return data as T;
}

export function useGameAPI() {
  const loadGame = async (initData: string): Promise<LoadGameResponse> => {
    return apiRequest<LoadGameResponse>('load', { initData });
  };

  const saveGame = async (
    initData: string,
    state: GameState
  ): Promise<SaveGameResponse> => {
    return apiRequest<SaveGameResponse>('save', { initData, state });
  };

  const tap = async (
    initData: string,
    count: number = 1
  ): Promise<TapResponse> => {
    return apiRequest<TapResponse>('tap', { initData, count });
  };

  const purchaseUpgrade = async (
    initData: string,
    upgradeId: string
  ): Promise<UpgradeResponse> => {
    return apiRequest<UpgradeResponse>('upgrade', { initData, upgradeId });
  };

  const completeTask = async (
    initData: string,
    taskId: string
  ): Promise<TaskResponse> => {
    return apiRequest<TaskResponse>('task', { initData, taskId });
  };

  return {
    loadGame,
    saveGame,
    tap,
    purchaseUpgrade,
    completeTask,
  };
}
