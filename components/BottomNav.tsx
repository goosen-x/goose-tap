'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItemProps {
  href: string;
  icon: string;
  label: string;
  active: boolean;
}

function NavItem({ href, icon, label, active }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`flex cursor-pointer flex-col items-center gap-0.5 transition-colors ${
        active ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-500 dark:text-zinc-400'
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-xs">{label}</span>
    </Link>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: '🏠', label: 'Home' },
    { href: '/tasks', icon: '📋', label: 'Tasks' },
    { href: '/friends', icon: '👥', label: 'Friends' },
    { href: '/earn', icon: '💰', label: 'Earn' },
  ];

  return (
    <nav className="flex items-center justify-around border-t border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-900/80">
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
