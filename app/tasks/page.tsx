'use client';

import { useGame } from '@/components/GameProvider';
import { TaskCard } from '@/components/TaskCard';
import { DailyRewardCard } from '@/components/DailyReward';
import { StickyTabs, TabConfig } from '@/components/StickyTabs';
import { TASKS } from '@/types/game';
import { useTelegram } from '@/hooks/useTelegram';
import { ListTodo, Calendar, Share2 } from 'lucide-react';

const TABS: TabConfig[] = [
  { value: 'all', label: 'All', icon: <ListTodo className="h-4 w-4" /> },
  { value: 'daily', label: 'Daily', icon: <Calendar className="h-4 w-4" /> },
  { value: 'social', label: 'Social', icon: <Share2 className="h-4 w-4" /> },
];

export default function TasksPage() {
  const { completeTask, isTaskCompleted, getTaskProgress, isLoaded } = useGame();
  const { webApp } = useTelegram();

  // Show skeleton until data is loaded
  if (!isLoaded) {
    return (
      <div className="flex flex-1 flex-col bg-background p-4">
        <div className="h-10 w-full bg-secondary rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 w-full bg-secondary/50 rounded-lg animate-pulse" />
          ))}
        </div>
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

  const getFilteredTasks = (filter: string) => {
    return TASKS.filter((task) => {
      if (filter === 'all') return true;
      if (filter === 'daily') return task.type === 'daily' || task.type === 'referral';
      return task.type === 'social';
    });
  };

  return (
    <div className="flex flex-1 flex-col bg-background">
      <StickyTabs tabs={TABS} defaultValue="all">
        {(activeTab) => (
          <div className="flex flex-col gap-3">
            {/* Daily Reward Card - show on all and daily tabs */}
            {(activeTab === 'all' || activeTab === 'daily') && (
              <DailyRewardCard />
            )}

            {getFilteredTasks(activeTab).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isCompleted={isTaskCompleted(task.id)}
                progress={task.requirement ? getTaskProgress(task.id) : undefined}
                onComplete={() => completeTask(task.id)}
                onAction={() => handleAction(task.action)}
              />
            ))}

            {getFilteredTasks(activeTab).length === 0 && (
              <div className="mt-12 text-center text-muted-foreground">
                No tasks available
              </div>
            )}
          </div>
        )}
      </StickyTabs>
    </div>
  );
}
