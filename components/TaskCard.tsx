'use client';

import { useState } from 'react';
import { Task } from '@/types/game';
import { formatNumber } from '@/lib/storage';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSubscription } from '@/hooks/useSubscription';
import { useTelegram } from '@/hooks/useTelegram';

interface TaskCardProps {
  task: Task;
  isCompleted: boolean;
  progress?: number;
  onComplete: () => void;
  onAction?: () => void;
}

export function TaskCard({ task, isCompleted, progress, onComplete, onAction }: TaskCardProps) {
  const { checkSubscription, isChecking } = useSubscription();
  const { user, webApp } = useTelegram();
  const [error, setError] = useState<string | null>(null);

  const hasProgress = task.requirement && task.requirement > 1;
  const progressPercentage = hasProgress && progress !== undefined
    ? Math.min((progress / task.requirement!) * 100, 100)
    : 0;
  const canComplete = !isCompleted && (!hasProgress || (progress !== undefined && progress >= task.requirement!));

  const handleClaim = async () => {
    setError(null);

    // If task requires channel subscription, verify it first
    if (task.channelId && user?.id) {
      const result = await checkSubscription(user.id, task.channelId);

      if (!result.subscribed) {
        setError('Subscribe to the channel first!');
        // Provide haptic feedback for error
        webApp?.HapticFeedback?.notificationOccurred('error');
        return;
      }
    }

    // Subscription verified or not required, complete the task
    webApp?.HapticFeedback?.notificationOccurred('success');
    onComplete();
  };

  const handleAction = () => {
    setError(null);
    onAction?.();
  };

  return (
    <Card className="flex flex-row items-center gap-3 p-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl">
        {task.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium truncate">
            {task.title}
          </h3>
          {isCompleted && (
            <span className="text-green-500 text-lg">✓</span>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {task.description}
        </p>
        {hasProgress && !isCompleted && (
          <div className="mt-2">
            <Progress value={progressPercentage} className="h-2" />
            <p className="mt-1 text-xs text-muted-foreground">
              {progress}/{task.requirement}
            </p>
          </div>
        )}
        {error && (
          <p className="mt-1 text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
      <div className="flex flex-col items-end gap-2">
        <Badge variant="secondary">
          +{formatNumber(task.reward)}
        </Badge>
        {isCompleted ? (
          <Badge variant="outline" className="text-green-600">
            Done
          </Badge>
        ) : canComplete ? (
          <Button
            size="sm"
            onClick={handleClaim}
            disabled={isChecking}
          >
            {isChecking ? '...' : 'Claim'}
          </Button>
        ) : task.action ? (
          <Button size="sm" variant="secondary" onClick={handleAction}>
            Go
          </Button>
        ) : (
          <Badge variant="outline">
            Locked
          </Badge>
        )}
      </div>
    </Card>
  );
}
