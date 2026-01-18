'use client';

import { TabsLayout, TabLink } from '@/components/TabsLayout';
import { ListTodo, Calendar, Share2 } from 'lucide-react';

const TABS: TabLink[] = [
  { href: '/tasks/all', label: 'All', icon: <ListTodo className="h-4 w-4" /> },
  { href: '/tasks/daily', label: 'Daily', icon: <Calendar className="h-4 w-4" /> },
  { href: '/tasks/social', label: 'Social', icon: <Share2 className="h-4 w-4" /> },
];

export default function TasksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TabsLayout tabs={TABS}>{children}</TabsLayout>;
}
