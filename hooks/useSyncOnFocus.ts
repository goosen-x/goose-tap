'use client'

import { useEffect, useRef, useTransition, useCallback } from 'react'
import { syncGameState } from '@/app/actions/game'
import { GameState } from '@/types/game'

interface UseSyncOnFocusOptions {
  initData: string
  onSync: (state: GameState) => void
  debounceMs?: number
  enabled?: boolean
}

export function useSyncOnFocus({
  initData,
  onSync,
  debounceMs = 2000,
  enabled = true,
}: UseSyncOnFocusOptions) {
  const [isSyncing, startTransition] = useTransition()
  const lastSyncRef = useRef<number>(0)

  const sync = useCallback(() => {
    if (!enabled || !initData) return

    const now = Date.now()
    if (now - lastSyncRef.current < debounceMs) return
    lastSyncRef.current = now

    startTransition(async () => {
      const result = await syncGameState(initData)
      if (result.success && result.state) {
        onSync(result.state)
      }
    })
  }, [initData, onSync, debounceMs, enabled])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sync()
      }
    }

    const handleFocus = () => sync()

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [sync])

  return { isSyncing, sync }
}
