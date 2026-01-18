'use client';

import { createContext, useContext, ReactNode, useEffect, useRef } from 'react';
import { useGameState, UseGameStateResult } from '@/hooks/useGameState';
import { useTelegram } from '@/hooks/useTelegram';
import { WelcomeBackModal } from '@/components/WelcomeBackModal';
import { DevPanel } from '@/components/DevPanel';

type GameContextType = UseGameStateResult;

const GameContext = createContext<GameContextType | null>(null);

interface GameProviderProps {
  children: ReactNode;
}

// Cloud backup interval in milliseconds (every 60 seconds)
const CLOUD_BACKUP_INTERVAL = 60000;

export function GameProvider({ children }: GameProviderProps) {
  const { initData, isReady: isTelegramReady, cloudStorageSet, isCloudStorageSupported } = useTelegram();
  const gameState = useGameState({ initData });
  const lastBackupRef = useRef<string | null>(null);

  // Backup critical state to Telegram CloudStorage periodically
  useEffect(() => {
    if (!gameState.isLoaded || !isCloudStorageSupported) return;

    const backupToCloud = async () => {
      const backupData = JSON.stringify({
        coins: gameState.coins,
        level: gameState.level,
        xp: gameState.xp,
        totalTaps: gameState.totalTaps,
        timestamp: Date.now(),
      });

      // Only save if data changed
      if (backupData === lastBackupRef.current) return;

      const success = await cloudStorageSet('lastKnownState', backupData);
      if (success) {
        lastBackupRef.current = backupData;
      }
    };

    // Initial backup
    backupToCloud();

    // Periodic backup
    const interval = setInterval(backupToCloud, CLOUD_BACKUP_INTERVAL);

    return () => clearInterval(interval);
  }, [gameState.isLoaded, gameState.coins, gameState.level, gameState.xp, gameState.totalTaps, cloudStorageSet, isCloudStorageSupported]);

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
          totalEarnings: gameState.totalEarnings,
          xp: gameState.xp,
          energy: gameState.energy,
          maxEnergy: gameState.maxEnergy,
          coinsPerTap: gameState.coinsPerTap,
          coinsPerHour: gameState.coinsPerHour,
          level: gameState.level,
          totalTaps: gameState.totalTaps,
          dailyTaps: gameState.dailyTaps,
          lastDailyTapsReset: gameState.lastDailyTapsReset,
          upgrades: gameState.upgrades,
          tasks: gameState.tasks,
          referrals: gameState.referrals,
          referralEarnings: gameState.referralEarnings,
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
