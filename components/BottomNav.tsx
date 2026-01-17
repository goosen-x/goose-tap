'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ListTodo, Users, TrendingUp } from 'lucide-react';

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
      className={`flex cursor-pointer flex-col items-center gap-0.5 transition-colors ${
        active ? 'text-foreground' : 'text-muted-foreground'
      }`}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </Link>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: <Home className="h-5 w-5" />, label: 'Home' },
    { href: '/tasks', icon: <ListTodo className="h-5 w-5" />, label: 'Tasks' },
    { href: '/friends', icon: <Users className="h-5 w-5" />, label: 'Friends' },
    { href: '/earn', icon: <TrendingUp className="h-5 w-5" />, label: 'Earn' },
  ];

  return (
    <nav className="flex items-center justify-around border-t bg-background px-4 py-3">
      {navItems.map((item) => (
        <NavItem
          key={item.href}
          {...item}
          active={pathname === item.href}
        />
      ))}
    </nav>
  );
}
