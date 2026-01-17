'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { LeaderboardEntry, LeaderboardResponse } from '@/types/game';

const PAGE_SIZE = 20;

interface UseLeaderboardResult {
  entries: LeaderboardEntry[];
  currentUser: LeaderboardResponse['currentUser'];
  totalPlayers: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}

export function useLeaderboard(initData: string | null): UseLeaderboardResult {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<LeaderboardResponse['currentUser']>(null);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const offsetRef = useRef(0);
  const loadedRef = useRef(false);
  const initDataRef = useRef(initData);

  // Keep ref in sync
  useEffect(() => {
    initDataRef.current = initData;
  }, [initData]);

  const fetchPage = useCallback(async (offset: number, isRefresh: boolean) => {
    const currentInitData = initDataRef.current;
    if (!currentInitData) {
      setIsLoading(false);
      return;
    }

    if (isRefresh) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('initData', currentInitData);
      params.set('limit', String(PAGE_SIZE));
      params.set('offset', String(offset));

      const response = await fetch(`/api/leaderboard?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const result: LeaderboardResponse = await response.json();

      if (isRefresh) {
        setEntries(result.leaderboard);
        offsetRef.current = result.leaderboard.length;
      } else {
        setEntries((prev) => [...prev, ...result.leaderboard]);
        offsetRef.current += result.leaderboard.length;
      }

      setCurrentUser(result.currentUser);
      setTotalPlayers(result.totalPlayers);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    offsetRef.current = 0;
    await fetchPage(0, true);
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    await fetchPage(offsetRef.current, false);
  }, [fetchPage, isLoadingMore, hasMore]);

  // Initial load - only once
  useEffect(() => {
    if (loadedRef.current) return;
    if (!initData) {
      setIsLoading(false);
      return;
    }

    loadedRef.current = true;
    fetchPage(0, true);
  }, [initData, fetchPage]);

  return {
    entries,
    currentUser,
    totalPlayers,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    refresh,
    loadMore,
  };
}
