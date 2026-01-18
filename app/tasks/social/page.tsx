'use client';

import { useGame } from '@/components/GameProvider';
import { TaskCard } from '@/components/TaskCard';
import { getAvailableTasks } from '@/types/game';

export default function SocialTasksPage() {
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

  const socialTasks = getAvailableTasks(['social'], isTaskCompleted);

  return (
    <div className="flex flex-col gap-3">
      {socialTasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          isCompleted={isTaskCompleted(task.id)}
          progress={task.requirement ? getTaskProgress(task.id) : undefined}
          onComplete={() => completeTask(task.id)}
        />
      ))}
      {socialTasks.length === 0 && (
        <div className="mt-12 text-center text-muted-foreground">
          No social tasks available
        </div>
      )}
    </div>
  );
}
