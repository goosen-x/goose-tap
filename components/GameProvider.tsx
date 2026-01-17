'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useGameState, UseGameStateResult } from '@/hooks/useGameState';
import { useTelegram } from '@/hooks/useTelegram';
import { Loader2, Coins } from 'lucide-react';

type GameContextType = UseGameStateResult;

const GameContext = createContext<GameContextType | null>(null);

interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  const { initData, isReady: isTelegramReady } = useTelegram();
  const gameState = useGameState({ initData });

  // Show loading state while Telegram SDK initializes
  if (!isTelegramReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  // Show loading state while game data loads from API
  if (gameState.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your progress...</p>
        </div>
      </div>
    );
  }

  // Show offline earnings notification
  const showOfflineEarnings = gameState.offlineEarnings > 0 && gameState.isLoaded;

  return (
    <GameContext.Provider value={gameState}>
      {showOfflineEarnings && (
        <OfflineEarningsNotification earnings={gameState.offlineEarnings} />
      )}
      {children}
    </GameContext.Provider>
  );
}

function OfflineEarningsNotification({ earnings }: { earnings: number }) {
  return (
    <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 transform animate-fade-in">
      <div className="rounded-lg bg-secondary border px-6 py-3 shadow-lg">
        <p className="text-center flex items-center gap-2">
          <Coins className="h-5 w-5" />
          <span className="font-bold">+{earnings.toLocaleString()}</span>
          <span className="text-sm text-muted-foreground">offline earnings!</span>
        </p>
      </div>
    </div>
  );
}

export function useGame(): GameContextType {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
