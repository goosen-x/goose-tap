'use client';

import { GooseIcon } from '@/components/ui/goose-icon';

export function LogoBanner() {
  return (
    <div className="flex shrink-0 items-center justify-center gap-2 py-3">
      <GooseIcon className="h-6 w-6" />
      <span className="text-lg font-semibold tracking-tight">GooseTap</span>
    </div>
  );
}
