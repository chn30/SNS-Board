'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', icon: '🏠', label: '피드', testId: 'nav-feed' },
  { href: '/write', icon: '✏️', label: '글쓰기', testId: 'nav-write' },
];

export default function IconBar() {
  const pathname = usePathname();

  return (
    <aside
      data-testid="icon-bar"
      className="fixed left-0 top-0 z-30 flex h-screen w-[72px] flex-col items-center border-r border-surface-border bg-background py-6"
    >
      {/* Logo */}
      <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-pink text-lg font-black text-white">
        B
      </div>

      {/* Nav items */}
      <nav className="flex flex-1 flex-col items-center gap-2">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              data-testid={item.testId}
              title={item.label}
              className={`flex h-11 w-11 items-center justify-center rounded-md text-xl transition-colors duration-200 ${
                isActive
                  ? 'bg-[rgba(139,92,246,0.1)] text-accent'
                  : 'text-text-muted hover:bg-[rgba(255,255,255,0.03)] hover:text-text-secondary'
              }`}
            >
              {item.icon}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
