'use client'

import { useState } from 'react'
import { ChevronUp, Zap, Coins, TrendingUp, UserPlus, Trash2 } from 'lucide-react'
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
}

export function DevPanel({ state, onUpdateState }: DevPanelProps) {
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
    if (!confirm('Reset devuser to fresh state?')) return
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
    alert('Copied: ' + link)
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button
          className="fixed bottom-20 right-2 z-50 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1 cursor-pointer shadow-lg"
        >
          DEV <ChevronUp className="w-3 h-3" />
        </button>
      </DrawerTrigger>
      <DrawerContent className="bg-gray-900 border-purple-500/50">
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle className="text-white text-center">Dev Tools</DrawerTitle>
          </DrawerHeader>

          <div className="p-4 pb-8">
            {/* Current state */}
            {state && (
              <div className="text-xs font-mono text-gray-400 mb-4 grid grid-cols-2 gap-2 bg-black/30 p-3 rounded-lg">
                <div>coins: {state.coins.toLocaleString()}</div>
                <div>energy: {state.energy}/{state.maxEnergy}</div>
                <div>xp: {state.xp.toLocaleString()}</div>
                <div>level: {state.level}</div>
                <div>refs: {state.referrals.length}</div>
                <div>taps: {state.totalTaps.toLocaleString()}</div>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => addCoins(10000)}
                className="flex items-center justify-center gap-2 bg-yellow-600/80 hover:bg-yellow-600 text-white text-sm px-3 py-2.5 rounded-lg cursor-pointer transition-colors"
              >
                <Coins className="w-4 h-4" /> +10k coins
              </button>
              <button
                onClick={() => addCoins(100000)}
                className="flex items-center justify-center gap-2 bg-yellow-600/80 hover:bg-yellow-600 text-white text-sm px-3 py-2.5 rounded-lg cursor-pointer transition-colors"
              >
                <Coins className="w-4 h-4" /> +100k coins
              </button>
              <button
                onClick={resetEnergy}
                className="flex items-center justify-center gap-2 bg-blue-600/80 hover:bg-blue-600 text-white text-sm px-3 py-2.5 rounded-lg cursor-pointer transition-colors"
              >
                <Zap className="w-4 h-4" /> Full Energy
              </button>
              <button
                onClick={() => addXP(1000)}
                className="flex items-center justify-center gap-2 bg-green-600/80 hover:bg-green-600 text-white text-sm px-3 py-2.5 rounded-lg cursor-pointer transition-colors"
              >
                <TrendingUp className="w-4 h-4" /> +1k XP
              </button>
              <button
                onClick={copyRefLink}
                className="flex items-center justify-center gap-2 bg-purple-600/80 hover:bg-purple-600 text-white text-sm px-3 py-2.5 rounded-lg cursor-pointer transition-colors"
              >
                <UserPlus className="w-4 h-4" /> Copy Ref Link
              </button>
              <button
                onClick={resetUser}
                className="flex items-center justify-center gap-2 bg-red-600/80 hover:bg-red-600 text-white text-sm px-3 py-2.5 rounded-lg cursor-pointer transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Reset User
              </button>
            </div>

            {/* Ref test hint */}
            <div className="mt-4 text-[11px] text-gray-500 font-mono text-center">
              Test referral: localhost:3000?ref=204887498
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
