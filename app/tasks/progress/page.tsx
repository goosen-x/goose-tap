'use client';

import { useGame } from '@/components/GameProvider';
import { TaskCard } from '@/components/TaskCard';
import { getAvailableTasks } from '@/types/game';

export default function ProgressTasksPage() {
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

  const progressTasks = getAvailableTasks(['progress', 'referral'], isTaskCompleted);

  return (
    <div className="flex flex-col gap-3">
      {progressTasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          isCompleted={isTaskCompleted(task.id)}
          progress={task.requirement ? getTaskProgress(task.id) : undefined}
          onComplete={() => completeTask(task.id)}
        />
      ))}
      {progressTasks.length === 0 && (
        <div className="mt-12 text-center text-muted-foreground">
          No progress tasks available
        </div>
      )}
    </div>
  );
}
