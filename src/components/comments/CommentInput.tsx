'use client';

import { useState, useTransition } from 'react';
import { createComment } from '@/actions/comment.actions';
import type { CommentData } from './CommentItem';

interface CommentInputProps {
  postId: string;
  onCommentAdded?: (comment: CommentData) => void;
}

export default function CommentInput({
  postId,
  onCommentAdded,
}: CommentInputProps) {
  const [content, setContent] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    const text = content.trim();
    setContent('');

    startTransition(async () => {
      const result = await createComment({ postId, content: text });
      if ('comment' in result && result.comment) {
        onCommentAdded?.({
          ...result.comment,
          createdAt:
            typeof result.comment.createdAt === 'string'
              ? result.comment.createdAt
              : new Date(result.comment.createdAt).toISOString(),
          isOwner: true,
        });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        data-testid="comment-input"
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="댓글을 입력하세요..."
        maxLength={2000}
        disabled={isPending}
        className="flex-1 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-text-primary placeholder-text-muted outline-none transition-all focus:border-[rgba(139,92,246,0.4)] focus:shadow-[0_0_12px_rgba(139,92,246,0.15)]"
      />
      <button
        data-testid="comment-submit"
        type="submit"
        disabled={isPending || !content.trim()}
        className="btn-primary whitespace-nowrap px-5 text-sm disabled:opacity-50"
      >
        {isPending ? '등록 중...' : '등록'}
      </button>
    </form>
  );
}
