'use client';

import { useState } from 'react';
import { Task } from '@/types/game';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SlidingNumber } from '@/components/ui/sliding-number';
import { useSubscription } from '@/hooks/useSubscription';
import { useTelegram } from '@/hooks/useTelegram';
import { Check, Megaphone, Calendar, Users, Star, Target, ExternalLink, Zap, Trophy, Sparkles } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { GooseIcon } from '@/components/ui/goose-icon';

interface TaskCardProps {
  task: Task;
  isCompleted: boolean;
  progress?: number;
  onComplete: () => void;
}

function getTaskIcon(taskId: string): React.ReactNode {
  // Social tasks
  if (taskId.startsWith('subscribe-') || taskId.startsWith('join-') || taskId.startsWith('follow-')) {
    return <Megaphone className="h-5 w-5" />;
  }
  // Referral tasks
  if (taskId.startsWith('invite-')) {
    return <Users className="h-5 w-5" />;
  }
  // Level tasks
  if (taskId.startsWith('reach-level-')) {
    return <Star className="h-5 w-5" />;
  }
  // Tap tasks (daily and progress)
  if (taskId.startsWith('tap-') || taskId.startsWith('daily-tap-')) {
    return <Target className="h-5 w-5" />;
  }
  // Upgrade tasks
  if (taskId.includes('upgrade')) {
    return <Zap className="h-5 w-5" />;
  }
  // Daily login
  if (taskId === 'daily-login') {
    return <Calendar className="h-5 w-5" />;
  }
  // Default
  return <Trophy className="h-5 w-5" />;
}

export function TaskCard({ task, isCompleted, progress, onComplete }: TaskCardProps) {
  const { checkSubscription, isChecking } = useSubscription();
  const { user, hapticNotification, openTelegramLink } = useTelegram();
  const [isStarted, setIsStarted] = useState(false);

  const hasProgress = task.requirement !== undefined && task.requirement > 0;
  const progressPercentage = hasProgress && progress !== undefined
    ? Math.min((progress / task.requirement!) * 100, 100)
    : 0;
  const canComplete = !isCompleted && (!hasProgress || (progress !== undefined && progress >= task.requirement!));

  // For channel subscription tasks
  const isChannelTask = !!task.channelId && !!task.action;

  const handleGo = () => {
    if (task.action) {
      openTelegramLink(task.action);
      setIsStarted(true);
      hapticNotification('success');
    }
  };

  const handleCheck = async () => {
    if (!task.channelId || !user?.id) return;

    const result = await checkSubscription(user.id, task.channelId);

    if (!result.subscribed) {
      toast.error('Subscribe to the channel first!');
      hapticNotification('error');
      return;
    }

    hapticNotification('success');
    onComplete();
  };

  const handleClaim = () => {
    hapticNotification('success');
    onComplete();
  };

  // Render action button based on task state
  const renderAction = () => {
    if (isCompleted) {
      return <Badge variant="outline" className="text-green-600">Done</Badge>;
    }

    // Channel subscription task (two-step flow)
    if (isChannelTask) {
      if (isStarted) {
        return (
          <Button size="sm" onClick={handleCheck} disabled={isChecking} className="cursor-pointer">
            {isChecking ? <Spinner /> : 'Check'}
          </Button>
        );
      }
      return (
        <Button size="sm" variant="secondary" onClick={handleGo} className="cursor-pointer">
          <ExternalLink className="h-3 w-3 mr-1" />Go
        </Button>
      );
    }

    // Regular task with progress requirement
    if (canComplete) {
      return (
        <Button size="sm" onClick={handleClaim} className="cursor-pointer">
          Claim
        </Button>
      );
    }

    // Task with action but no channel (external link)
    if (task.action) {
      return (
        <Button size="sm" variant="secondary" onClick={handleGo} className="cursor-pointer">
          <ExternalLink className="h-3 w-3 mr-1" />Go
        </Button>
      );
    }

    // No action available
    return null;
  };

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
          {getTaskIcon(task.id)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate">{task.title}</h3>
            {isCompleted && <Check className="h-4 w-4 text-green-500 shrink-0" />}
          </div>
          <p className="text-sm text-muted-foreground">{task.description}</p>
        </div>

        {/* Rewards & Actions */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              +<SlidingNumber value={task.reward} />
              <GooseIcon className="h-3 w-3" />
            </Badge>
            {task.xpReward && (
              <Badge variant="outline" className="flex items-center gap-1">
                +<SlidingNumber value={task.xpReward} />
                <Sparkles className="h-3 w-3" />
              </Badge>
            )}
          </div>
          {renderAction()}
        </div>
      </div>

      {/* Progress bar - full width below */}
      {hasProgress && !isCompleted && (
        <div className="mt-1 ml-[52px] flex items-center gap-2">
          <Progress value={progressPercentage} className="h-1.5 flex-1" />
          <span className="text-xs text-muted-foreground shrink-0">
            {progress || 0}/{task.requirement || 0}
          </span>
        </div>
      )}
    </Card>
  );
}
