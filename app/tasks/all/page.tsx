'use client';

import { useGame } from '@/components/GameProvider';
import { TaskCard } from '@/components/TaskCard';
import { DailyRewardCard } from '@/components/DailyReward';
import { TASKS } from '@/types/game';

export default function AllTasksPage() {
  const { completeTask, isTaskCompleted, getTaskProgress, isLoaded } = useGame();

  if (!isLoaded) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 w-full bg-secondary/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  // Filter tasks: show only if no prerequisite or prerequisite is completed
  const availableTasks = TASKS.filter(
    (task) => !task.prerequisite || isTaskCompleted(task.prerequisite)
  );

  return (
    <div className="flex flex-col gap-3">
      <DailyRewardCard />
      {availableTasks.map((task) => (
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
