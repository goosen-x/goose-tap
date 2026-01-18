'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface TabLink {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsLayoutProps {
  tabs: TabLink[];
  children: React.ReactNode;
}

export function TabsLayout({ tabs, children }: TabsLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col bg-background">
      {/* Tabs navigation */}
      <div className="bg-background px-4 pt-4 pb-2">
        <div className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all cursor-pointer',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  isActive
                    ? 'bg-background text-foreground shadow'
                    : 'hover:bg-background/50'
                )}
              >
                {tab.icon}
                {tab.icon && <span className="ml-1">{tab.label}</span>}
                {!tab.icon && tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Page content */}
      <div className="px-4 pb-4">
        {children}
      </div>
    </div>
  );
}
