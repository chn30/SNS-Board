'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { deletePost } from '@/actions/post.actions';
import CommentList from '@/components/comments/CommentList';
import LikeButton from '@/components/LikeButton';
import ReportModal from '@/components/ReportModal';

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

interface PostData {
  id: string;
  title: string;
  content: string;
  category: string;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  createdAt: string | Date;
  isLiked: boolean;
  isOwner?: boolean;
  isAdmin?: boolean;
}

interface PostDetailClientProps {
  post: PostData;
}

export default function PostDetailClient({ post }: PostDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const cat = CATEGORY_MAP[post.category] ?? CATEGORY_MAP.FREE;
  const isHot = post.likeCount >= 10;

  function handleDelete() {
    if (!confirm('게시글을 삭제하시겠습니까?')) return;
    setDeleteError('');
    startTransition(async () => {
      try {
        const result = await deletePost({ postId: post.id });
        if (result.success) {
          router.push('/');
        } else {
          setDeleteError(result.error || '삭제에 실패했습니다.');
        }
      } catch {
        setDeleteError('삭제에 실패했습니다. 다시 시도해주세요.');
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-6">
      {/* Back button */}
      <Link
        href="/"
        data-testid="post-back"
        className="mb-6 inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-text-secondary"
      >
        ← 피드로 돌아가기
      </Link>

      {/* Post card */}
      <article className="glass mb-8 rounded-xl p-6" data-testid="post-detail">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              data-testid="post-avatar"
              className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-sm font-bold text-white"
            >
              익
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-text-secondary">익명</span>
                <span className="text-text-muted">·</span>
                <span className="text-text-muted">
                  {timeAgo(post.createdAt)}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span
                  data-testid="category-badge"
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
            </div>
          </div>

          {/* Delete button for owner or admin */}
          {(post.isOwner || post.isAdmin) && (
            <button
              data-testid="delete-post"
              onClick={handleDelete}
              disabled={isPending}
              className="rounded-lg px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-[rgba(248,113,113,0.1)] hover:text-red-300"
            >
              {isPending ? '삭제 중...' : '🗑 삭제'}
            </button>
          )}
        </div>

        {deleteError && (
          <p className="mt-2 text-xs text-red-400">{deleteError}</p>
        )}

        {/* Title */}
        <h1
          data-testid="post-detail-title"
          className="mb-4 text-xl font-bold leading-snug text-text-primary"
        >
          {post.title}
        </h1>

        {/* Body */}
        <div
          data-testid="post-detail-content"
          className="mb-6 whitespace-pre-wrap text-sm leading-relaxed text-text-secondary"
        >
          {post.content}
        </div>

        {/* Stats & Actions */}
        <div className="flex items-center justify-between border-t border-[rgba(255,255,255,0.06)] pt-4">
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <span data-testid="post-like-count">
              <LikeButton
                targetType="POST"
                targetId={post.id}
                initialLiked={post.isLiked}
                initialCount={post.likeCount}
              />
            </span>
            <span
              data-testid="post-comment-count"
              className="flex items-center gap-1"
            >
              💬 {post.commentCount}
            </span>
            <span
              data-testid="post-view-count"
              className="flex items-center gap-1"
            >
              👁 {post.viewCount}
            </span>
          </div>

          <button
            data-testid="report-button"
            onClick={() => setReportOpen(true)}
            className="rounded-lg px-3 py-1.5 text-xs text-text-muted transition-colors hover:bg-[rgba(255,255,255,0.03)] hover:text-red-400"
          >
            🚨 신고
          </button>
        </div>
      </article>

      {/* Comments */}
      <CommentList postId={post.id} />

      <ReportModal
        targetType="POST"
        targetId={post.id}
        open={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </div>
  );
}
