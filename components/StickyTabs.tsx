'use client';

import { useState } from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    <div className={cn('flex flex-1 flex-col min-h-0 overflow-auto', className)}>
      {/* Optional header that scrolls with content */}
      {header}

      {/* Sticky tabs navigation */}
      <div className="sticky top-0 z-10 bg-background px-4 pt-2 pb-2">
        <TabsList className="w-full">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex-1 cursor-pointer"
              data-state={activeTab === tab.value ? 'active' : 'inactive'}
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.icon}
              {tab.icon && <span className="ml-1">{tab.label}</span>}
              {!tab.icon && tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {/* Tab content */}
      <div className="flex-1 px-4 pb-4">
        {children(activeTab)}
      </div>
    </div>
  );
}
