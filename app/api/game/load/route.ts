import { NextResponse } from 'next/server';
import { validateInitDataWithDevFallback } from '@/lib/telegram-auth';
import { getOrCreateUser, dbRowToGameState } from '@/lib/db';
import { calculateOfflineEarnings, calculateEnergyRestoration } from '@/lib/storage';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { initData } = body;

    console.log('[Load] Request received');

    if (!initData) {
      console.log('[Load] Missing initData');
      return NextResponse.json(
        { error: 'Missing initData' },
        { status: 400 }
      );
    }

    // Validate Telegram initData
    console.log('[Load] Validating initData...');
    const validation = await validateInitDataWithDevFallback(initData);
    console.log('[Load] Validation result:', { valid: validation.valid, error: validation.error, userId: validation.user?.id });

    if (!validation.valid || !validation.user) {
      return NextResponse.json(
        { error: validation.error || 'Invalid initData' },
        { status: 401 }
      );
    }

    const { user } = validation;

    // Parse start_param for referral tracking
    const params = new URLSearchParams(initData);
    const startParam = params.get('start_param');
    let referrerId: number | undefined;

    if (startParam?.startsWith('ref_')) {
      const parsedId = parseInt(startParam.slice(4), 10);
      if (!isNaN(parsedId) && parsedId !== user.id) {
        referrerId = parsedId;
        console.log('[Load] Referral detected, referrer:', referrerId);
      }
    }

    // Get or create user in database
    console.log('[Load] Getting user from DB, telegram_id:', user.id);
    const dbUser = await getOrCreateUser(
      user.id,
      user.username,
      user.first_name,
      user.photo_url,
      referrerId
    );
    console.log('[Load] DB user coins:', dbUser.coins, 'level:', dbUser.level);

    // Convert to GameState
    let state = dbRowToGameState(dbUser);

    // Calculate offline time and earnings
    const offlineMs = Date.now() - state.lastOfflineEarnings;
    const offlineMinutes = Math.floor(offlineMs / (1000 * 60));
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
      offlineMinutes,
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
