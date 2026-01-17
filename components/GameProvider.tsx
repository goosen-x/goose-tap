'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useGameState, UseGameStateResult } from '@/hooks/useGameState';
import { useTelegram } from '@/hooks/useTelegram';
import { WelcomeBackModal } from '@/components/WelcomeBackModal';
import { DevPanel } from '@/components/DevPanel';

type GameContextType = UseGameStateResult;

const GameContext = createContext<GameContextType | null>(null);

interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  const { initData, isReady: isTelegramReady } = useTelegram();
  const gameState = useGameState({ initData });

  return (
    <GameContext.Provider value={gameState}>
      {children}
      {gameState.isLoaded && (
        <WelcomeBackModal
          earnings={gameState.offlineEarnings}
          offlineMinutes={gameState.offlineMinutes}
          coinsPerHour={gameState.coinsPerHour}
        />
      )}
      <DevPanel
        state={gameState.isLoaded ? {
          coins: gameState.coins,
          xp: gameState.xp,
          energy: gameState.energy,
          maxEnergy: gameState.maxEnergy,
          coinsPerTap: gameState.coinsPerTap,
          coinsPerHour: gameState.coinsPerHour,
          level: gameState.level,
          totalTaps: gameState.totalTaps,
          upgrades: gameState.upgrades,
          tasks: gameState.tasks,
          referrals: gameState.referrals,
          lastEnergyUpdate: gameState.lastEnergyUpdate,
          lastOfflineEarnings: gameState.lastOfflineEarnings,
          lastDailyClaim: gameState.lastDailyClaim,
          dailyStreak: gameState.dailyStreak,
        } : null}
        onUpdateState={gameState.devUpdateState}
        onSync={gameState.forceSync}
        initData={gameState.initData}
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
