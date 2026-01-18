'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ListTodo, Users, TrendingUp, Trophy } from 'lucide-react';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

function NavItem({ href, icon, label, active }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`relative flex flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 py-1 rounded-lg transition-all ${
        active
          ? 'text-foreground bg-secondary'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: <Home className="h-5 w-5" />, label: 'Home' },
    { href: '/tasks', icon: <ListTodo className="h-5 w-5" />, label: 'Tasks' },
    { href: '/leaderboard', icon: <Trophy className="h-5 w-5" />, label: 'Top' },
    { href: '/friends', icon: <Users className="h-5 w-5" />, label: 'Friends' },
    { href: '/earn', icon: <TrendingUp className="h-5 w-5" />, label: 'Earn' },
  ];

  return (
    <nav className="flex shrink-0 items-center justify-around border-t bg-background px-2 py-2">
      {navItems.map((item) => {
        // Check if current path matches or starts with the nav item href
        const isActive = item.href === '/'
          ? pathname === '/'
          : pathname.startsWith(item.href);
        return (
          <NavItem
            key={item.href}
            {...item}
            active={isActive}
          />
        );
      })}
    </nav>
  );
}
