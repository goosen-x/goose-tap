'use client'

import { useState } from 'react'
import { ChevronUp, Zap, Coins, TrendingUp, UserPlus, Trash2, RefreshCw, Terminal } from 'lucide-react'
import { GameState } from '@/types/game'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'

interface DevPanelProps {
  state: GameState | null
  onUpdateState: (updates: Partial<GameState>) => void
  initData: string
  onSync?: () => void
}

export function DevPanel({ state, onUpdateState, onSync }: DevPanelProps) {
  const [open, setOpen] = useState(false)

  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null

  const addCoins = (amount: number) => {
    if (!state) return
    onUpdateState({ coins: state.coins + amount })
  }

  const resetEnergy = () => {
    if (!state) return
    onUpdateState({ energy: state.maxEnergy })
  }

  const addXP = (amount: number) => {
    if (!state) return
    onUpdateState({ xp: state.xp + amount })
  }

  const resetUser = async () => {
    if (!confirm('> CONFIRM USER RESET?')) return
    try {
      const res = await fetch('/api/dev/reset', { method: 'POST' })
      if (res.ok) {
        window.location.reload()
      }
    } catch (e) {
      console.error('Reset failed:', e)
    }
  }

  const copyRefLink = () => {
    const link = `${window.location.origin}?ref=123456789`
    navigator.clipboard.writeText(link)
  }

  const handleSync = () => {
    if (onSync) {
      onSync()
    } else {
      window.location.reload()
    }
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button
          className="fixed bottom-20 right-2 z-50 bg-black border border-green-500/50 text-green-400 px-3 py-1.5 rounded text-xs font-mono flex items-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(0,255,0,0.3)] hover:shadow-[0_0_15px_rgba(0,255,0,0.5)] hover:border-green-400 transition-all"
        >
          <Terminal className="w-3 h-3" /> DEV <ChevronUp className="w-3 h-3" />
        </button>
      </DrawerTrigger>
      <DrawerContent className="bg-black border-t border-green-500/50 shadow-[0_-5px_30px_rgba(0,255,0,0.2)]">
        <div className="mx-auto w-full max-w-sm font-mono">
          <DrawerHeader className="border-b border-green-500/30 pb-2">
            <DrawerTitle className="text-green-400 text-center flex items-center justify-center gap-2 text-sm">
              <Terminal className="w-4 h-4" />
              SYSTEM_CONTROL_v1.0
            </DrawerTitle>
          </DrawerHeader>

          <div className="p-4 pb-8">
            {/* Current state - Matrix terminal style */}
            {state && (
              <div className="text-xs text-green-400/80 mb-4 p-3 bg-green-950/30 border border-green-500/20 rounded">
                <div className="text-green-500 text-[10px] mb-2 opacity-60">// SYSTEM STATUS</div>
                <div className="grid grid-cols-2 gap-1">
                  <div><span className="text-green-600">coins:</span> {state.coins.toLocaleString()}</div>
                  <div><span className="text-green-600">energy:</span> {state.energy}/{state.maxEnergy}</div>
                  <div><span className="text-green-600">xp:</span> {state.xp.toLocaleString()}</div>
                  <div><span className="text-green-600">level:</span> {state.level}</div>
                  <div><span className="text-green-600">refs:</span> {state.referrals.length}</div>
                  <div><span className="text-green-600">taps:</span> {state.totalTaps.toLocaleString()}</div>
                </div>
              </div>
            )}

            {/* Actions - Matrix style buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleSync}
                className="flex items-center justify-center gap-2 bg-green-950/50 hover:bg-green-900/50 border border-green-500/50 hover:border-green-400 text-green-400 text-xs px-3 py-2.5 rounded cursor-pointer transition-all hover:shadow-[0_0_10px_rgba(0,255,0,0.3)] col-span-2"
              >
                <RefreshCw className="w-3 h-3" /> SYNC_FROM_SERVER
              </button>
              <button
                onClick={() => addCoins(10000)}
                className="flex items-center justify-center gap-2 bg-green-950/30 hover:bg-green-900/40 border border-green-500/30 hover:border-green-400 text-green-400 text-xs px-3 py-2 rounded cursor-pointer transition-all hover:shadow-[0_0_8px_rgba(0,255,0,0.2)]"
              >
                <Coins className="w-3 h-3" /> +10K
              </button>
              <button
                onClick={() => addCoins(100000)}
                className="flex items-center justify-center gap-2 bg-green-950/30 hover:bg-green-900/40 border border-green-500/30 hover:border-green-400 text-green-400 text-xs px-3 py-2 rounded cursor-pointer transition-all hover:shadow-[0_0_8px_rgba(0,255,0,0.2)]"
              >
                <Coins className="w-3 h-3" /> +100K
              </button>
              <button
                onClick={resetEnergy}
                className="flex items-center justify-center gap-2 bg-green-950/30 hover:bg-green-900/40 border border-green-500/30 hover:border-green-400 text-green-400 text-xs px-3 py-2 rounded cursor-pointer transition-all hover:shadow-[0_0_8px_rgba(0,255,0,0.2)]"
              >
                <Zap className="w-3 h-3" /> MAX_ENERGY
              </button>
              <button
                onClick={() => addXP(1000)}
                className="flex items-center justify-center gap-2 bg-green-950/30 hover:bg-green-900/40 border border-green-500/30 hover:border-green-400 text-green-400 text-xs px-3 py-2 rounded cursor-pointer transition-all hover:shadow-[0_0_8px_rgba(0,255,0,0.2)]"
              >
                <TrendingUp className="w-3 h-3" /> +1K_XP
              </button>
              <button
                onClick={copyRefLink}
                className="flex items-center justify-center gap-2 bg-green-950/30 hover:bg-green-900/40 border border-green-500/30 hover:border-green-400 text-green-400 text-xs px-3 py-2 rounded cursor-pointer transition-all hover:shadow-[0_0_8px_rgba(0,255,0,0.2)]"
              >
                <UserPlus className="w-3 h-3" /> COPY_REF
              </button>
              <button
                onClick={resetUser}
                className="flex items-center justify-center gap-2 bg-red-950/30 hover:bg-red-900/40 border border-red-500/30 hover:border-red-400 text-red-400 text-xs px-3 py-2 rounded cursor-pointer transition-all hover:shadow-[0_0_8px_rgba(255,0,0,0.2)]"
              >
                <Trash2 className="w-3 h-3" /> RESET_USR
              </button>
            </div>

            {/* Footer */}
            <div className="mt-4 text-[10px] text-green-500/40 font-mono text-center">
              <span className="text-green-500/60">&gt;</span> ref_test: ?ref=204887498
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
