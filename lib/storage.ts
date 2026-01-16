import { GameState, DEFAULT_GAME_STATE } from '@/types/game';

const STORAGE_KEY = 'goose-tap-state';
const AUTOSAVE_INTERVAL = 5000; // 5 seconds

export function loadGameState(): GameState {
  if (typeof window === 'undefined') {
    return DEFAULT_GAME_STATE;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return DEFAULT_GAME_STATE;
    }

    const parsed = JSON.parse(stored) as Partial<GameState>;

    // Merge with defaults to handle missing fields from older versions
    return {
      ...DEFAULT_GAME_STATE,
      ...parsed,
      lastEnergyUpdate: parsed.lastEnergyUpdate ?? Date.now(),
      lastOfflineEarnings: parsed.lastOfflineEarnings ?? Date.now(),
    };
  } catch {
    console.error('Failed to load game state from localStorage');
    return DEFAULT_GAME_STATE;
  }
}

export function saveGameState(state: GameState): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    console.error('Failed to save game state to localStorage');
  }
}

export function clearGameState(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    console.error('Failed to clear game state from localStorage');
  }
}

// Calculate offline earnings based on coinsPerHour
export function calculateOfflineEarnings(
  lastUpdate: number,
  coinsPerHour: number,
  maxOfflineHours: number = 3
): number {
  const now = Date.now();
  const hoursElapsed = Math.min(
    (now - lastUpdate) / (1000 * 60 * 60),
    maxOfflineHours
  );
  return Math.floor(hoursElapsed * coinsPerHour);
}

// Calculate energy restoration based on time elapsed
export function calculateEnergyRestoration(
  lastUpdate: number,
  currentEnergy: number,
  maxEnergy: number,
  energyPerSecond: number = 1
): number {
  const now = Date.now();
  const secondsElapsed = (now - lastUpdate) / 1000;
  const energyToRestore = Math.floor(secondsElapsed * energyPerSecond);
  return Math.min(currentEnergy + energyToRestore, maxEnergy);
}

// Autosave hook helper
let autosaveTimer: ReturnType<typeof setInterval> | null = null;

export function startAutosave(getState: () => GameState): void {
  if (typeof window === 'undefined') {
    return;
  }

  stopAutosave();
  autosaveTimer = setInterval(() => {
    saveGameState(getState());
  }, AUTOSAVE_INTERVAL);
}

export function stopAutosave(): void {
  if (autosaveTimer) {
    clearInterval(autosaveTimer);
    autosaveTimer = null;
  }
}

// Format numbers for display
export function formatNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1) + 'B';
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
}
