'use client';

import { useState, useTransition } from 'react';
import { createComment } from '@/actions/comment.actions';
import type { CommentData } from './CommentItem';

interface CommentInputProps {
  postId: string;
  parentId?: string;
  onCommentAdded?: (comment: CommentData) => void;
  placeholder?: string;
}

export default function CommentInput({
  postId,
  parentId,
  onCommentAdded,
  placeholder = '댓글을 입력하세요...',
}: CommentInputProps) {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    const text = content.trim();
    setError('');

    startTransition(async () => {
      try {
        const result = await createComment({
          postId,
          content: text,
          ...(parentId ? { parentId } : {}),
        });
        if ('comment' in result && result.comment) {
          setContent('');
          onCommentAdded?.({
            ...result.comment,
            createdAt:
              typeof result.comment.createdAt === 'string'
                ? result.comment.createdAt
                : new Date(result.comment.createdAt).toISOString(),
            isOwner: true,
            replies: [],
          });
        } else if ('error' in result && result.error) {
          setError(result.error);
        }
      } catch {
        setError('댓글 작성에 실패했습니다. 다시 시도해주세요.');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-3">
        <input
          data-testid="comment-input"
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
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
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </form>
  );
}
