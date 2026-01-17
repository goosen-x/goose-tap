'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Zap, Coins, TrendingUp, UserPlus, Trash2 } from 'lucide-react'
import { GameState } from '@/types/game'

interface DevPanelProps {
  state: GameState | null
  onUpdateState: (updates: Partial<GameState>) => void
  initData: string
}

export function DevPanel({ state, onUpdateState, initData }: DevPanelProps) {
  const [isOpen, setIsOpen] = useState(false)

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
    <div className="fixed bottom-20 right-2 z-50">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -top-8 right-0 bg-purple-600 text-white px-2 py-1 rounded-t-lg text-xs font-mono flex items-center gap-1 cursor-pointer"
      >
        DEV {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="bg-gray-900/95 border border-purple-500/50 rounded-lg p-3 min-w-[200px] shadow-xl">
          {/* Current state */}
          {state && (
            <div className="text-xs font-mono text-gray-400 mb-3 space-y-1">
              <div>coins: {state.coins.toLocaleString()}</div>
              <div>energy: {state.energy}/{state.maxEnergy}</div>
              <div>xp: {state.xp} | lvl: {state.level}</div>
              <div>refs: {state.referrals.length}</div>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => addCoins(10000)}
              className="flex items-center gap-1 bg-yellow-600/80 hover:bg-yellow-600 text-white text-xs px-2 py-1.5 rounded cursor-pointer"
            >
              <Coins className="w-3 h-3" /> +10k
            </button>
            <button
              onClick={() => addCoins(100000)}
              className="flex items-center gap-1 bg-yellow-600/80 hover:bg-yellow-600 text-white text-xs px-2 py-1.5 rounded cursor-pointer"
            >
              <Coins className="w-3 h-3" /> +100k
            </button>
            <button
              onClick={resetEnergy}
              className="flex items-center gap-1 bg-blue-600/80 hover:bg-blue-600 text-white text-xs px-2 py-1.5 rounded cursor-pointer"
            >
              <Zap className="w-3 h-3" /> Energy
            </button>
            <button
              onClick={() => addXP(1000)}
              className="flex items-center gap-1 bg-green-600/80 hover:bg-green-600 text-white text-xs px-2 py-1.5 rounded cursor-pointer"
            >
              <TrendingUp className="w-3 h-3" /> +1k XP
            </button>
            <button
              onClick={copyRefLink}
              className="flex items-center gap-1 bg-purple-600/80 hover:bg-purple-600 text-white text-xs px-2 py-1.5 rounded cursor-pointer"
            >
              <UserPlus className="w-3 h-3" /> Ref Link
            </button>
            <button
              onClick={resetUser}
              className="flex items-center gap-1 bg-red-600/80 hover:bg-red-600 text-white text-xs px-2 py-1.5 rounded cursor-pointer"
            >
              <Trash2 className="w-3 h-3" /> Reset
            </button>
          </div>

          {/* Ref test hint */}
          <div className="mt-3 text-[10px] text-gray-500 font-mono">
            Test ref: ?ref=204887498
          </div>
        </div>
      )}
    </div>
  )
}
