'use client';

import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getPosts } from '@/actions/post.actions';
import PostCard, { type PostCardData } from '@/components/feed/PostCard';
import PostCardSkeleton from '@/components/feed/PostCardSkeleton';
import Link from 'next/link';

const TABS = [
  { key: 'latest', label: '최신' },
  { key: 'popular', label: '인기' },
] as const;

const CATEGORIES = [
  { key: undefined, label: '전체' },
  { key: 'FREE', label: '자유' },
  { key: 'QUESTION', label: '질문' },
  { key: 'INFO', label: '정보' },
] as const;

export default function FeedPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-6 py-6">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        </div>
      }
    >
      <FeedContent />
    </Suspense>
  );
}

function FeedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const sort = (searchParams.get('sort') as 'latest' | 'popular') || 'latest';
  const category = searchParams.get('category') as
    | 'FREE'
    | 'QUESTION'
    | 'INFO'
    | null;

  const [posts, setPosts] = useState<PostCardData[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  const fetchPosts = useCallback(
    async (cursor?: string) => {
      const input: Record<string, unknown> = { sort };
      if (category) input.category = category;
      if (cursor) input.cursor = cursor;

      const result = await getPosts(input);
      if ('error' in result) return { posts: [], nextCursor: null };
      return result as { posts: PostCardData[]; nextCursor: string | null };
    },
    [sort, category],
  );

  // Initial load
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPosts([]);
    setNextCursor(null);

    fetchPosts().then((res) => {
      if (!cancelled) {
        setPosts(res.posts);
        setNextCursor(res.nextCursor);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [fetchPosts]);

  // Infinite scroll
  useEffect(() => {
    if (!observerRef.current) return;
    const el = observerRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextCursor && !loadingMore) {
          setLoadingMore(true);
          fetchPosts(nextCursor).then((res) => {
            setPosts((prev) => [...prev, ...res.posts]);
            setNextCursor(res.nextCursor);
            setLoadingMore(false);
          });
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [nextCursor, loadingMore, fetchPosts]);

  function setParam(key: string, value: string | null) {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/?${params.toString()}`);
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1
          className="text-[26px] font-black text-text-primary"
          data-testid="feed-title"
        >
          피드
        </h1>
        <Link
          href="/write"
          data-testid="write-button"
          className="btn-primary flex items-center gap-2 text-sm"
        >
          ✏️ 글쓰기
        </Link>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1" data-testid="feed-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            data-testid={`tab-${tab.key}`}
            onClick={() =>
              setParam('sort', tab.key === 'latest' ? null : tab.key)
            }
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 ${
              sort === tab.key
                ? 'bg-[rgba(139,92,246,0.15)] text-accent'
                : 'text-text-muted hover:bg-[rgba(255,255,255,0.03)] hover:text-text-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Category pills */}
      <div className="mb-6 flex flex-wrap gap-2" data-testid="category-filters">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.label}
            data-testid={`category-${(cat.key ?? 'all').toLowerCase()}`}
            onClick={() => setParam('category', cat.key ?? null)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
              (category ?? undefined) === cat.key
                ? 'bg-[rgba(139,92,246,0.15)] text-accent'
                : 'glass text-text-muted hover:text-text-secondary'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Post list */}
      <div className="space-y-3" data-testid="post-list">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <PostCardSkeleton key={i} />)
        ) : posts.length === 0 ? (
          <div
            data-testid="empty-feed"
            className="py-20 text-center text-text-muted"
          >
            게시글이 없습니다. 첫 글을 작성해보세요!
          </div>
        ) : (
          posts.map((post, i) => (
            <PostCard key={post.id} post={post} index={i} />
          ))
        )}

        {loadingMore &&
          Array.from({ length: 3 }).map((_, i) => (
            <PostCardSkeleton key={`more-${i}`} />
          ))}

        {/* Sentinel for infinite scroll */}
        <div ref={observerRef} className="h-1" data-testid="scroll-sentinel" />
      </div>
    </div>
  );
}
