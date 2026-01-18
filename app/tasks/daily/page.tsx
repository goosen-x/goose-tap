'use client';

import { useGame } from '@/components/GameProvider';
import { DailyRewardCard } from '@/components/DailyReward';
import { TaskCard } from '@/components/TaskCard';
import { getAvailableTasks } from '@/types/game';

export default function DailyTasksPage() {
  const { completeTask, isTaskCompleted, getTaskProgress, isLoaded } = useGame();

  if (!isLoaded) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 w-full bg-secondary/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const dailyTasks = getAvailableTasks(['daily'], isTaskCompleted);

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
        />
      ))}
    </div>
  );
}
