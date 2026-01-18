'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface TabConfig {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface StickyTabsProps {
  tabs: TabConfig[];
  defaultValue?: string;
  /** Content that scrolls away before tabs stick */
  header?: React.ReactNode;
  children: (activeTab: string) => React.ReactNode;
  className?: string;
}

export function StickyTabs({ tabs, defaultValue, header, children, className }: StickyTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue ?? tabs[0]?.value ?? '');

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Optional header that scrolls with content */}
      {header}

      {/* Sticky tabs navigation */}
      <div className="sticky top-0 z-10 bg-background px-4 pt-2 pb-2">
        <div className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
                activeTab === tab.value
                  ? 'bg-background text-foreground shadow'
                  : 'hover:bg-background/50'
              )}
            >
              {tab.icon}
              {tab.icon && <span className="ml-1">{tab.label}</span>}
              {!tab.icon && tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 pb-4">
        {children(activeTab)}
      </div>
    </div>
  );
}
