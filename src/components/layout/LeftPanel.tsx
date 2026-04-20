'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

const menuItems = [
  { label: '전체 피드', href: '/', match: '/', icon: '📋' },
  {
    label: '인기 글',
    href: '/?sort=popular',
    match: 'sort=popular',
    icon: '🔥',
  },
  {
    label: '자유',
    href: '/?category=FREE',
    match: 'category=FREE',
    icon: '💬',
  },
  {
    label: '질문',
    href: '/?category=QUESTION',
    match: 'category=QUESTION',
    icon: '❓',
  },
  {
    label: '정보',
    href: '/?category=INFO',
    match: 'category=INFO',
    icon: 'ℹ️',
  },
];

export default function LeftPanel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentUrl =
    pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');

  function isActive(item: (typeof menuItems)[0]) {
    if (item.href === '/') {
      return currentUrl === '/' || currentUrl === '';
    }
    return currentUrl.includes(item.match);
  }

  async function handleLogout() {
    await fetch('/api/auth/signout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        callbackUrl: '/login',
        csrfToken: await fetch('/api/auth/csrf')
          .then((r) => r.json())
          .then((d) => d.csrfToken),
      }),
    });
    window.location.href = '/login';
  }

  return (
    <aside
      data-testid="left-panel"
      className="fixed left-0 top-0 z-20 hidden h-screen w-[280px] flex-col border-r border-surface-border bg-background px-4 py-6 xl:flex"
    >
      {/* Logo */}
      <div className="mb-8 flex items-center gap-3 px-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-pink text-lg font-black text-white shadow-lg shadow-primary/20">
          B
        </div>
        <div>
          <h1 className="text-base font-bold text-text-primary">
            AX Tech본부 Blind
          </h1>
          <p className="text-[11px] text-text-muted">Anonymous Board</p>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-3 mb-4 border-t border-surface-border" />

      {/* Menu label */}
      <h2 className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-widest text-text-muted">
        메뉴
      </h2>

      {/* Navigation */}
      <nav className="flex flex-col gap-1">
        {menuItems.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.label}
              href={item.href}
              data-testid={`menu-${item.label}`}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
                active
                  ? 'bg-gradient-to-r from-[rgba(139,92,246,0.15)] to-[rgba(236,72,153,0.08)] text-text-primary shadow-sm shadow-primary/10 border border-[rgba(139,92,246,0.2)]'
                  : 'text-text-secondary hover:bg-[rgba(255,255,255,0.04)] hover:text-text-primary border border-transparent'
              }`}
            >
              <span
                className={`text-lg transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-105'}`}
              >
                {item.icon}
              </span>
              <span className={active ? 'font-semibold' : 'font-medium'}>
                {item.label}
              </span>
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent shadow-sm shadow-accent/50" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-3 mt-6 mb-4 border-t border-surface-border" />

      {/* Bottom actions */}
      <div className="mt-auto flex flex-col gap-3">
        <Link
          href="/write"
          data-testid="write-button-sidebar"
          className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-pink transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/30" />
          <span className="relative flex items-center gap-2">
            ✏️ 새 글 작성
          </span>
        </Link>

        <button
          data-testid="logout-button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-surface-border py-3 text-sm text-text-muted transition-all duration-200 hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-400"
        >
          🚪 로그아웃
        </button>
      </div>
    </aside>
  );
}
