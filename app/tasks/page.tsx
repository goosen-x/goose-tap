'use client';

import { useGame } from '@/components/GameProvider';
import { TaskCard } from '@/components/TaskCard';
import { TASKS } from '@/types/game';
import { useTelegram } from '@/hooks/useTelegram';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ListTodo, Calendar, Share2 } from 'lucide-react';

type FilterType = 'all' | 'daily' | 'social';

export default function TasksPage() {
  const { completeTask, isTaskCompleted, getTaskProgress } = useGame();
  const { webApp } = useTelegram();

  const handleAction = (action?: string) => {
    if (!action) return;

    if (webApp) {
      webApp.openLink(action);
    } else {
      window.open(action, '_blank');
    }
  };

  const getFilteredTasks = (filter: FilterType) => {
    return TASKS.filter((task) => {
      if (filter === 'all') return true;
      if (filter === 'daily') return task.type === 'daily' || task.type === 'referral';
      return task.type === 'social';
    });
  };

  return (
    <div className="flex flex-1 flex-col bg-background">
      {/* Tabs and content */}
      <Tabs defaultValue="all" className="flex flex-1 flex-col p-4">
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1 cursor-pointer">
            <ListTodo className="h-4 w-4 mr-1" />
            All
          </TabsTrigger>
          <TabsTrigger value="daily" className="flex-1 cursor-pointer">
            <Calendar className="h-4 w-4 mr-1" />
            Daily
          </TabsTrigger>
          <TabsTrigger value="social" className="flex-1 cursor-pointer">
            <Share2 className="h-4 w-4 mr-1" />
            Social
          </TabsTrigger>
        </TabsList>

        {/* Task list */}
        <div className="flex-1 pt-4">
          {(['all', 'daily', 'social'] as FilterType[]).map((filter) => (
            <TabsContent key={filter} value={filter} className="mt-0">
              <div className="flex flex-col gap-3">
                {getFilteredTasks(filter).map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isCompleted={isTaskCompleted(task.id)}
                    progress={task.requirement ? getTaskProgress(task.id) : undefined}
                    onComplete={() => completeTask(task.id)}
                    onAction={() => handleAction(task.action)}
                  />
                ))}
              </div>

              {getFilteredTasks(filter).length === 0 && (
                <div className="mt-12 text-center text-muted-foreground">
                  No tasks available
                </div>
              )}
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}
