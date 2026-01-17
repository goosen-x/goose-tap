import { NextResponse } from 'next/server';
import { validateInitDataWithDevFallback } from '@/lib/telegram-auth';
import { getOrCreateUser, dbRowToGameState } from '@/lib/db';
import { calculateOfflineEarnings, calculateEnergyRestoration } from '@/lib/storage';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { initData } = body;

    if (!initData) {
      return NextResponse.json(
        { error: 'Missing initData' },
        { status: 400 }
      );
    }

    // Validate Telegram initData
    const validation = validateInitDataWithDevFallback(initData);
    if (!validation.valid || !validation.user) {
      return NextResponse.json(
        { error: validation.error || 'Invalid initData' },
        { status: 401 }
      );
    }

    const { user } = validation;

    // Get or create user in database
    const dbUser = await getOrCreateUser(
      user.id,
      user.username,
      user.first_name,
      user.photo_url
    );

    // Convert to GameState
    let state = dbRowToGameState(dbUser);

    // Calculate offline earnings
    const offlineEarnings = calculateOfflineEarnings(
      state.lastOfflineEarnings,
      state.coinsPerHour
    );

    // Calculate energy restoration
    const restoredEnergy = calculateEnergyRestoration(
      state.lastEnergyUpdate,
      state.energy,
      state.maxEnergy
    );

    // Apply calculated values
    state = {
      ...state,
      coins: state.coins + offlineEarnings,
      energy: restoredEnergy,
      lastEnergyUpdate: Date.now(),
      lastOfflineEarnings: Date.now(),
    };

    return NextResponse.json({
      success: true,
      state,
      offlineEarnings,
      user: {
        id: user.id,
        username: user.username,
        firstName: user.first_name,
      },
    });
  } catch (error) {
    console.error('Load game error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
