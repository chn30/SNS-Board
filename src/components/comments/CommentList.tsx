'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { getComments } from '@/actions/comment.actions';
import CommentItem, { type CommentData } from './CommentItem';
import CommentInput from './CommentInput';

interface CommentListProps {
  postId: string;
}

export default function CommentList({ postId }: CommentListProps) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchComments = useCallback(async () => {
    const result = await getComments({ postId });
    if ('comments' in result && result.comments) {
      setComments(
        result.comments.map((c: any) => ({
          ...c,
          createdAt:
            typeof c.createdAt === 'string'
              ? c.createdAt
              : new Date(c.createdAt).toISOString(),
        })),
      );
    }
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  function handleCommentAdded(comment: CommentData) {
    setComments((prev) => [...prev, comment]);
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  function handleCommentDeleted(commentId: string) {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }

  return (
    <div data-testid="comments-section">
      <h2 className="mb-4 text-lg font-bold text-text-primary">
        댓글 {comments.length > 0 && `(${comments.length})`}
      </h2>

      {/* Comment input */}
      <div className="mb-6">
        <CommentInput postId={postId} onCommentAdded={handleCommentAdded} />
      </div>

      {/* Comments list */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-8 text-center text-sm text-text-muted">
            댓글을 불러오는 중...
          </div>
        ) : comments.length === 0 ? (
          <div
            data-testid="empty-comments"
            className="py-8 text-center text-sm text-text-muted"
          >
            아직 댓글이 없습니다. 첫 댓글을 작성해보세요!
          </div>
        ) : (
          comments.map((comment, i) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              index={i}
              onDeleted={handleCommentDeleted}
            />
          ))
        )}
      </div>

      <div ref={bottomRef} />
    </div>
  );
}
