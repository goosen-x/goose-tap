import { useState, useCallback } from 'react';

interface SubscriptionResult {
  subscribed: boolean;
  status?: string;
  error?: string;
}

export function useSubscription() {
  const [isChecking, setIsChecking] = useState(false);

  const checkSubscription = useCallback(async (
    userId: number | string,
    channelId: string
  ): Promise<SubscriptionResult> => {
    setIsChecking(true);

    try {
      const response = await fetch('/api/check-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, channelId }),
      });

      const data = await response.json();

      return {
        subscribed: data.subscribed || false,
        status: data.status,
        error: data.error,
      };
    } catch (error) {
      console.error('Error checking subscription:', error);
      return {
        subscribed: false,
        error: 'Failed to check subscription',
      };
    } finally {
      setIsChecking(false);
    }
  }, []);

  return {
    checkSubscription,
    isChecking,
  };
}
