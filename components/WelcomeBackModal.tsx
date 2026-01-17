'use client';

import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SlidingNumber } from '@/components/ui/sliding-number';
import Image from 'next/image';

interface WelcomeBackModalProps {
  earnings: number;
  offlineMinutes: number;
  coinsPerHour: number;
}

const MIN_EARNINGS_THRESHOLD = 10;
const MIN_OFFLINE_MINUTES = 5;

export function WelcomeBackModal({ earnings, offlineMinutes, coinsPerHour }: WelcomeBackModalProps) {
  const [open, setOpen] = useState(false);
  const [displayEarnings, setDisplayEarnings] = useState(0);

  const shouldShow = earnings >= MIN_EARNINGS_THRESHOLD && offlineMinutes >= MIN_OFFLINE_MINUTES;

  useEffect(() => {
    if (shouldShow) {
      setOpen(true);
      // Animate the number after modal opens
      const timer = setTimeout(() => {
        setDisplayEarnings(earnings);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [shouldShow, earnings]);

  if (!shouldShow) {
    return null;
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-w-[320px]">
        <AlertDialogHeader className="flex flex-col items-center text-center">
          {/* Goose icon */}
          <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Image
              src="/goose.svg"
              alt="Goose"
              width={56}
              height={56}
              className="animate-bounce"
            />
          </div>

          <AlertDialogTitle className="text-xl">
            Welcome back!
          </AlertDialogTitle>

          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p className="text-muted-foreground">
                While you were away, your goose earned:
              </p>

              {/* Earnings display */}
              <div className="flex items-center justify-center gap-2 text-3xl font-bold text-foreground">
                <span>+</span>
                <SlidingNumber value={displayEarnings} />
                <Image
                  src="/coin.svg"
                  alt="coins"
                  width={28}
                  height={28}
                />
              </div>

              {/* Passive income info */}
              {coinsPerHour > 0 && (
                <p className="text-xs text-muted-foreground">
                  Earning {coinsPerHour.toLocaleString()} coins/hour
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogAction className="w-full cursor-pointer">
            Claim
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
