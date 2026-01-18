'use client';

import { useGame } from '@/components/GameProvider';
import { TaskCard } from '@/components/TaskCard';
import { DailyRewardCard } from '@/components/DailyReward';
import { TASKS } from '@/types/game';
import { useTelegram } from '@/hooks/useTelegram';

export default function DailyTasksPage() {
  const { completeTask, isTaskCompleted, getTaskProgress, isLoaded } = useGame();
  const { webApp } = useTelegram();

  if (!isLoaded) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 w-full bg-secondary/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const handleAction = (action?: string) => {
    if (!action) return;
    if (webApp) {
      webApp.openLink(action);
    } else {
      window.open(action, '_blank');
    }
  };

  const dailyTasks = TASKS.filter((task) => task.type === 'daily' || task.type === 'referral');

  return (
    <div className="flex flex-col gap-3">
      <DailyRewardCard />
      {dailyTasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          isCompleted={isTaskCompleted(task.id)}
          progress={task.requirement ? getTaskProgress(task.id) : undefined}
          onComplete={() => completeTask(task.id)}
          onAction={() => handleAction(task.action)}
        />
      ))}
      {dailyTasks.length === 0 && (
        <div className="mt-12 text-center text-muted-foreground">
          No daily tasks available
        </div>
      )}
    </div>
  );
}
