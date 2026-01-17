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
import { Check, Megaphone, MessageSquare, Calendar, Users, Star, Target, Lock, ExternalLink } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  isCompleted: boolean;
  progress?: number;
  onComplete: () => void;
  onAction?: () => void;
}

const iconMap: Record<string, React.ReactNode> = {
  'subscribe-gooselabs': <Megaphone className="h-5 w-5" />,
  'join-group': <MessageSquare className="h-5 w-5" />,
  'daily-login': <Calendar className="h-5 w-5" />,
  'invite-3-friends': <Users className="h-5 w-5" />,
  'reach-level-5': <Star className="h-5 w-5" />,
  'tap-1000': <Target className="h-5 w-5" />,
};

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
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
        {iconMap[task.id] || <Target className="h-5 w-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium truncate">
            {task.title}
          </h3>
          {isCompleted && (
            <Check className="h-4 w-4 text-green-500" />
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
            className="cursor-pointer"
          >
            {isChecking ? '...' : 'Claim'}
          </Button>
        ) : task.action ? (
          <Button size="sm" variant="secondary" onClick={handleAction} className="cursor-pointer">
            <ExternalLink className="h-3 w-3 mr-1" />
            Go
          </Button>
        ) : (
          <Badge variant="outline">
            <Lock className="h-3 w-3 mr-1" />
            Locked
          </Badge>
        )}
      </div>
    </Card>
  );
}
