'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useGameState, UseGameStateResult } from '@/hooks/useGameState';
import { useTelegram } from '@/hooks/useTelegram';
import { Loader2 } from 'lucide-react';
import { WelcomeBackModal } from '@/components/WelcomeBackModal';

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

  return (
    <GameContext.Provider value={gameState}>
      {children}
      <WelcomeBackModal
        earnings={gameState.offlineEarnings}
        offlineMinutes={gameState.offlineMinutes}
        coinsPerHour={gameState.coinsPerHour}
      />
    </GameContext.Provider>
  );
}

export function useGame(): GameContextType {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
