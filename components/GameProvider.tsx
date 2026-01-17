'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useGameState, UseGameStateResult } from '@/hooks/useGameState';
import { useTelegram } from '@/hooks/useTelegram';
import { WelcomeBackModal } from '@/components/WelcomeBackModal';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';

type GameContextType = UseGameStateResult;

const GameContext = createContext<GameContextType | null>(null);

interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  const { initData, isReady: isTelegramReady } = useTelegram();
  const gameState = useGameState({ initData });

  // Show loading state while Telegram SDK initializes or game data loads
  if (!isTelegramReady || gameState.isLoading) {
    return <LoadingSkeleton message={!isTelegramReady ? 'Connecting...' : 'Loading...'} />;
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
