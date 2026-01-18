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
import { Check, Megaphone, MessageSquare, Calendar, Users, Star, Target, Lock, ExternalLink } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

interface TaskCardProps {
  task: Task;
  isCompleted: boolean;
  progress?: number;
  onComplete: () => void;
}

const iconMap: Record<string, React.ReactNode> = {
  'subscribe-gooselabs': <Megaphone className="h-5 w-5" />,
  'join-group': <MessageSquare className="h-5 w-5" />,
  'daily-login': <Calendar className="h-5 w-5" />,
  'invite-3-friends': <Users className="h-5 w-5" />,
  'reach-level-5': <Star className="h-5 w-5" />,
  'tap-1000': <Target className="h-5 w-5" />,
};

export function TaskCard({ task, isCompleted, progress, onComplete }: TaskCardProps) {
  const { checkSubscription, isChecking } = useSubscription();
  const { user, hapticNotification, openTelegramLink } = useTelegram();
  const [isStarted, setIsStarted] = useState(false);

  const hasProgress = task.requirement && task.requirement > 1;
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

    // Locked task
    return <Badge variant="outline"><Lock className="h-3 w-3 mr-1" />Locked</Badge>;
  };

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
          {iconMap[task.id] || <Target className="h-5 w-5" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate">{task.title}</h3>
            {isCompleted && <Check className="h-4 w-4 text-green-500 shrink-0" />}
          </div>
          <p className="text-sm text-muted-foreground">{task.description}</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <Badge variant="secondary">+<SlidingNumber value={task.reward} /></Badge>
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
