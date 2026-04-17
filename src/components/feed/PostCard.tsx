'use client';

import Link from 'next/link';

const AVATAR_GRADIENTS = [
  'from-purple-500 to-pink-500',
  'from-blue-500 to-cyan-500',
  'from-green-500 to-emerald-500',
  'from-orange-500 to-red-500',
];

const CATEGORY_MAP: Record<
  string,
  { label: string; bgClass: string; textClass: string }
> = {
  FREE: {
    label: '자유',
    bgClass: 'bg-cat-free',
    textClass: 'text-cat-free-text',
  },
  QUESTION: {
    label: '질문',
    bgClass: 'bg-cat-question',
    textClass: 'text-cat-question-text',
  },
  INFO: {
    label: '정보',
    bgClass: 'bg-cat-info',
    textClass: 'text-cat-info-text',
  },
};

function timeAgo(date: string | Date): string {
  const now = Date.now();
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = now - d.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

export interface PostCardData {
  id: string;
  title: string;
  content: string;
  category: string;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  createdAt: string | Date;
  isLiked: boolean;
}

interface PostCardProps {
  post: PostCardData;
  index: number;
}

export default function PostCard({ post, index }: PostCardProps) {
  const cat = CATEGORY_MAP[post.category] ?? CATEGORY_MAP.FREE;
  const gradient = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
  const isHot = post.likeCount >= 10;

  return (
    <Link
      href={`/post/${post.id}`}
      data-testid="post-card"
      className="glass group block rounded-xl p-5 transition-all duration-200 hover:-translate-y-px hover:border-[rgba(139,92,246,0.3)] hover:shadow-[0_4px_20px_rgba(139,92,246,0.15)]"
    >
      <div className="flex gap-4">
        {/* Avatar */}
        <div
          data-testid="post-avatar"
          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} text-sm font-bold text-white`}
        >
          익
        </div>

        <div className="min-w-0 flex-1">
          {/* Meta row */}
          <div className="mb-1.5 flex items-center gap-2 text-xs">
            <span className="font-medium text-text-secondary">익명</span>
            <span className="text-text-muted">·</span>
            <span className="text-text-muted">{timeAgo(post.createdAt)}</span>
            <span
              className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${cat.bgClass} ${cat.textClass}`}
            >
              {cat.label}
            </span>
            {isHot && (
              <span
                data-testid="hot-badge"
                className="hot-badge text-[11px] font-bold"
              >
                HOT
              </span>
            )}
          </div>

          {/* Title */}
          <h3
            data-testid="post-title"
            className="mb-1 truncate text-[16px] font-bold leading-snug text-text-primary group-hover:text-accent"
          >
            {post.title}
          </h3>

          {/* Body preview */}
          <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-text-secondary">
            {post.content}
          </p>

          {/* Action row */}
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <span
              data-testid="post-like-count"
              className="flex items-center gap-1"
            >
              {post.isLiked ? '💜' : '🤍'} {post.likeCount}
            </span>
            <span
              data-testid="post-comment-count"
              className="flex items-center gap-1"
            >
              💬 {post.commentCount}
            </span>
            <span className="flex items-center gap-1">👁 {post.viewCount}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
