'use client';

import { useState, useTransition } from 'react';
import { deleteComment } from '@/actions/comment.actions';

const AVATAR_GRADIENTS = [
  'from-blue-500 to-cyan-500',
  'from-green-500 to-emerald-500',
  'from-orange-500 to-red-500',
  'from-purple-500 to-pink-500',
];

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

export interface CommentData {
  id: string;
  postId: string;
  content: string;
  likeCount: number;
  createdAt: string | Date;
  isLiked: boolean;
  isOwner: boolean;
}

interface CommentItemProps {
  comment: CommentData;
  index: number;
  onDeleted?: (commentId: string) => void;
}

export default function CommentItem({
  comment,
  index,
  onDeleted,
}: CommentItemProps) {
  const gradient = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
  const [isPending, startTransition] = useTransition();
  const [deleted, setDeleted] = useState(false);

  if (deleted) return null;

  function handleDelete() {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    startTransition(async () => {
      const result = await deleteComment({ commentId: comment.id });
      if (result.success) {
        setDeleted(true);
        onDeleted?.(comment.id);
      }
    });
  }

  return (
    <div
      data-testid="comment-item"
      className="glass rounded-xl p-4 transition-all duration-200"
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} text-xs font-bold text-white`}
        >
          익
        </div>

        <div className="min-w-0 flex-1">
          {/* Meta */}
          <div className="mb-1 flex items-center gap-2 text-xs">
            <span className="font-medium text-text-secondary">익명</span>
            <span className="text-text-muted">·</span>
            <span className="text-text-muted">
              {timeAgo(comment.createdAt)}
            </span>
          </div>

          {/* Content */}
          <p
            data-testid="comment-content"
            className="text-sm leading-relaxed text-text-primary"
          >
            {comment.content}
          </p>

          {/* Actions */}
          <div className="mt-2 flex items-center gap-3 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              {comment.isLiked ? '💜' : '🤍'} {comment.likeCount}
            </span>
            {comment.isOwner && (
              <button
                data-testid="comment-delete"
                onClick={handleDelete}
                disabled={isPending}
                className="text-red-400 transition-colors hover:text-red-300"
              >
                {isPending ? '삭제 중...' : '삭제'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
