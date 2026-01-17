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
import { Coins } from 'lucide-react';
import Image from 'next/image';

interface WelcomeBackModalProps {
  earnings: number;
  offlineMinutes: number;
  coinsPerHour: number;
}

const MIN_EARNINGS_THRESHOLD = 10;
const MIN_OFFLINE_MINUTES = 5;
const SESSION_KEY = 'welcome_back_shown';

export function WelcomeBackModal({ earnings, offlineMinutes, coinsPerHour }: WelcomeBackModalProps) {
  const [open, setOpen] = useState(false);
  const [displayEarnings, setDisplayEarnings] = useState(0);

  const shouldShow = earnings >= MIN_EARNINGS_THRESHOLD && offlineMinutes >= MIN_OFFLINE_MINUTES;

  // Clear session flag when user leaves the page (so modal shows on real return)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sessionStorage.removeItem(SESSION_KEY);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (shouldShow) {
      // Check if already shown in this session (prevents showing on HMR)
      const alreadyShown = sessionStorage.getItem(SESSION_KEY);
      if (alreadyShown) return;

      setOpen(true);
      sessionStorage.setItem(SESSION_KEY, 'true');

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
              src="/goose.png"
              alt="Goose"
              width={56}
              height={56}
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
                <Coins className="h-7 w-7 text-yellow-500" />
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
