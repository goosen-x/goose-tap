import { NextResponse } from 'next/server';
import { validateInitDataWithDevFallback } from '@/lib/telegram-auth';
import { getUser, updateUserState, dbRowToGameState } from '@/lib/db';
import {
  TASKS,
  UserTask,
  calculateLevelFromXP,
  calculateLevelBonuses,
  calculateTotalBonus,
  XP_REWARDS,
} from '@/types/game';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { initData, taskId } = body as { initData: string; taskId: string };

    if (!initData) {
      return NextResponse.json(
        { error: 'Missing initData' },
        { status: 400 }
      );
    }

    if (!taskId) {
      return NextResponse.json(
        { error: 'Missing taskId' },
        { status: 400 }
      );
    }

    // Validate Telegram initData
    const validation = await validateInitDataWithDevFallback(initData);
    if (!validation.valid || !validation.user) {
      return NextResponse.json(
        { error: validation.error || 'Invalid initData' },
        { status: 401 }
      );
    }

    const { user } = validation;

    // Find task definition
    const task = TASKS.find((t) => t.id === taskId);
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Get current user state
    const dbUser = await getUser(user.id);
    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const state = dbRowToGameState(dbUser);

    // Check if task already claimed
    const existingTask = state.tasks.find((t) => t.taskId === taskId);
    if (existingTask?.status === 'claimed') {
      return NextResponse.json(
        { error: 'Task already claimed' },
        { status: 400 }
      );
    }

    // Check subscription for social tasks with channelId
    if (task.channelId) {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) {
        return NextResponse.json(
          { error: 'Bot token not configured' },
          { status: 500 }
        );
      }

      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${encodeURIComponent(task.channelId)}&user_id=${user.id}`
      );
      const data = await response.json();

      const validStatuses = ['member', 'administrator', 'creator'];
      if (!data.ok || !validStatuses.includes(data.result?.status)) {
        return NextResponse.json(
          { error: 'Please subscribe to the channel first' },
          { status: 400 }
        );
      }
    }

    // Check task requirements
    if (task.type === 'referral' && task.requirement) {
      if (state.referrals.length < task.requirement) {
        return NextResponse.json(
          { error: 'Referral requirement not met' },
          { status: 400 }
        );
      }
    }

    if (task.id === 'reach-level-5' && task.requirement) {
      if (state.level < task.requirement) {
        return NextResponse.json(
          { error: 'Level requirement not met' },
          { status: 400 }
        );
      }
    }

    // Create new tasks array
    const newTasks: UserTask[] = existingTask
      ? state.tasks.map((t) =>
          t.taskId === taskId
            ? { ...t, status: 'claimed' as const, completedAt: Date.now() }
            : t
        )
      : [...state.tasks, { taskId, status: 'claimed' as const, completedAt: Date.now() }];

    // Award XP for task completion
    const newXP = state.xp + XP_REWARDS.task;
    const newLevel = calculateLevelFromXP(newXP);

    // Check if level changed and recalculate stats
    let updateData: Parameters<typeof updateUserState>[1] = {
      coins: state.coins + task.reward,
      totalEarnings: state.totalEarnings + task.reward,
      xp: newXP,
      tasks: newTasks,
    };

    if (newLevel !== state.level) {
      const levelBonus = calculateLevelBonuses(newLevel);
      const upgradeBonus = {
        tap: calculateTotalBonus(state.upgrades, 'tap'),
        hour: calculateTotalBonus(state.upgrades, 'hour'),
        energy: calculateTotalBonus(state.upgrades, 'energy'),
      };

      updateData = {
        ...updateData,
        level: newLevel,
        coinsPerTap: 1 + upgradeBonus.tap + levelBonus.totalCoinsPerTap,
        coinsPerHour: Math.floor(upgradeBonus.hour * levelBonus.passiveIncomeMultiplier),
        maxEnergy: 1000 + upgradeBonus.energy + levelBonus.totalMaxEnergy,
      };
    }

    // Update user state with reward and XP
    const updatedUser = await updateUserState(user.id, updateData);

    return NextResponse.json({
      success: true,
      state: dbRowToGameState(updatedUser),
      reward: task.reward,
      xpEarned: XP_REWARDS.task,
    });
  } catch (error) {
    console.error('Task error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
