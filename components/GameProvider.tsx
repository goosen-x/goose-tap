'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useGameState, UseGameStateResult } from '@/hooks/useGameState';
import { useTelegram } from '@/hooks/useTelegram';

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
          <div className="mb-4 text-4xl">Loading...</div>
          <p className="text-muted-foreground">Initializing Telegram...</p>
        </div>
      </div>
    );
  }

  // Show loading state while game data loads from API
  if (gameState.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 text-4xl">Loading...</div>
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
  // This could be expanded to a proper modal/toast
  // For now, just a simple notification that fades out
  return (
    <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 transform animate-fade-in">
      <div className="rounded-lg bg-primary px-6 py-3 text-primary-foreground shadow-lg">
        <p className="text-center">
          <span className="text-lg font-bold">+{earnings.toLocaleString()}</span>
          <span className="ml-2 text-sm">offline earnings!</span>
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
