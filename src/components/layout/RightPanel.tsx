'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBoardStats, getTrendingPosts } from '@/actions/stats.actions';

interface TrendingPost {
  id: string;
  title: string;
  likeCount: number;
  commentCount: number;
}

interface Stats {
  todayPosts: number;
  totalPosts: number;
  activeUsers: number;
}

export default function RightPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [trending, setTrending] = useState<TrendingPost[]>([]);

  useEffect(() => {
    getBoardStats().then(setStats);
    getTrendingPosts().then(setTrending);
  }, []);

  return (
    <aside
      data-testid="right-panel"
      className="fixed right-0 top-0 z-20 hidden h-screen w-[340px] flex-col gap-6 overflow-y-auto border-l border-surface-border bg-background px-5 py-6 xl:flex"
    >
      {/* Trending */}
      <section className="glass rounded-xl p-5">
        <h3 className="mb-4 text-sm font-bold text-text-primary">
          🔥 인기 급상승
        </h3>
        <div className="space-y-3">
          {trending.length > 0 ? (
            trending.map((post, i) => (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
                className="flex items-start gap-3 rounded-md p-1.5 transition-colors hover:bg-[rgba(139,92,246,0.1)]"
              >
                <span className="mt-0.5 text-xs font-bold text-accent">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-text-primary">
                    {post.title}
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    ❤️ {post.likeCount} · 💬 {post.commentCount}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-center text-xs text-text-muted">
              게시글이 쌓이면 표시됩니다
            </p>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="glass rounded-xl p-5">
        <h3 className="mb-4 text-sm font-bold text-text-primary">
          📊 게시판 통계
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">오늘 작성</span>
            <span className="font-semibold text-text-primary">
              {stats ? stats.todayPosts : '-'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">전체 게시글</span>
            <span className="font-semibold text-text-primary">
              {stats ? stats.totalPosts : '-'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">활성 사용자</span>
            <span className="font-semibold text-text-primary">
              {stats ? stats.activeUsers : '-'}
            </span>
          </div>
        </div>
      </section>
    </aside>
  );
}
