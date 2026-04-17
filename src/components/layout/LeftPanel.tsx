'use client';

import Link from 'next/link';

const menuItems = [
  { label: '전체 피드', href: '/', icon: '📋' },
  { label: '인기 글', href: '/?sort=popular', icon: '🔥' },
  { label: '자유', href: '/?category=FREE', icon: '💬' },
  { label: '질문', href: '/?category=QUESTION', icon: '❓' },
  { label: '정보', href: '/?category=INFO', icon: 'ℹ️' },
];

export default function LeftPanel() {
  return (
    <aside
      data-testid="left-panel"
      className="fixed left-[72px] top-0 z-20 hidden h-screen w-[280px] flex-col border-r border-surface-border bg-background px-4 py-6 xl:flex"
    >
      <h2 className="mb-6 px-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
        메뉴
      </h2>
      <nav className="flex flex-col gap-1">
        {menuItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            data-testid={`menu-${item.label}`}
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-text-secondary transition-colors duration-200 hover:bg-[rgba(139,92,246,0.1)] hover:text-text-primary"
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto">
        <Link
          href="/write"
          data-testid="write-button-sidebar"
          className="btn-primary flex w-full items-center justify-center gap-2 py-3 text-sm"
        >
          ✏️ 새 글 작성
        </Link>
      </div>
    </aside>
  );
}
