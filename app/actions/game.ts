'use server'

import { validateInitDataWithDevFallback } from '@/lib/telegram-auth'
import { getOrCreateUser, dbRowToGameState, updateUserState } from '@/lib/db'
import { GameState } from '@/types/game'

export async function syncGameState(initData: string): Promise<{
  success: boolean
  state?: GameState
  error?: string
}> {
  try {
    const validation = await validateInitDataWithDevFallback(initData)
    if (!validation.valid || !validation.user) {
      return { success: false, error: 'Invalid session' }
    }

    const dbUser = await getOrCreateUser(
      validation.user.id,
      validation.user.username,
      validation.user.first_name,
      validation.user.photo_url
    )

    const state = dbRowToGameState(dbUser)
    return { success: true, state }
  } catch (error) {
    console.error('[syncGameState] Error:', error)
    return { success: false, error: 'Sync failed' }
  }
}

export async function saveGameState(
  initData: string,
  state: GameState
): Promise<{ success: boolean; error?: string }> {
  try {
    const validation = await validateInitDataWithDevFallback(initData)
    if (!validation.valid || !validation.user) {
      return { success: false, error: 'Invalid session' }
    }

    await updateUserState(validation.user.id, state)
    return { success: true }
  } catch (error) {
    console.error('[saveGameState] Error:', error)
    return { success: false, error: 'Save failed' }
  }
}
