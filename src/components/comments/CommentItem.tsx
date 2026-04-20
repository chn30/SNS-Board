'use client';

import { useState, useTransition } from 'react';
import { deleteComment } from '@/actions/comment.actions';
import LikeButton from '@/components/LikeButton';
import ReportModal from '@/components/ReportModal';
import CommentInput from './CommentInput';

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
  parentId?: string | null;
  content: string;
  likeCount: number;
  createdAt: string | Date;
  isLiked: boolean;
  isOwner: boolean;
  isAdmin?: boolean;
  isPostAuthor?: boolean;
  replies?: CommentData[];
}

interface CommentItemProps {
  comment: CommentData;
  index: number;
  depth?: number;
  onDeleted?: (commentId: string) => void;
  onReplyAdded?: (comment: CommentData) => void;
}

export default function CommentItem({
  comment,
  index,
  depth = 0,
  onDeleted,
  onReplyAdded,
}: CommentItemProps) {
  const gradient = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
  const [isPending, startTransition] = useTransition();
  const [deleted, setDeleted] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [repliesExpanded, setRepliesExpanded] = useState(true);
  const [localReplies, setLocalReplies] = useState<CommentData[]>(
    comment.replies || [],
  );

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

  function handleReplyAdded(newComment: CommentData) {
    setLocalReplies((prev) => [...prev, newComment]);
    setReplyOpen(false);
    setRepliesExpanded(true);
    onReplyAdded?.(newComment);
  }

  const canDelete = comment.isOwner || comment.isAdmin;
  const hasReplies = localReplies.length > 0;

  return (
    <>
      <div
        data-testid="comment-item"
        className="glass rounded-xl p-4 transition-all duration-200"
        style={{ marginLeft: depth > 0 ? Math.min(depth * 24, 72) : 0 }}
      >
        <div className="flex gap-3">
          {/* Avatar */}
          <div
            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} text-xs font-bold text-white`}
          >
            {comment.isPostAuthor ? '글' : '익'}
          </div>

          <div className="min-w-0 flex-1">
            {/* Meta */}
            <div className="mb-1 flex items-center gap-2 text-xs">
              <span className="font-medium text-text-secondary">
                {comment.isPostAuthor ? (
                  <span className="text-accent font-bold">글쓴이</span>
                ) : (
                  '익명'
                )}
              </span>
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
              <LikeButton
                targetType="COMMENT"
                targetId={comment.id}
                initialLiked={comment.isLiked}
                initialCount={comment.likeCount}
              />
              <button
                onClick={() => setReplyOpen(!replyOpen)}
                className="transition-colors hover:text-accent"
              >
                💬 답글
              </button>
              {canDelete && (
                <button
                  data-testid="comment-delete"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="text-red-400 transition-colors hover:text-red-300"
                >
                  {isPending ? '삭제 중...' : '삭제'}
                </button>
              )}
              <button
                data-testid="report-button"
                onClick={() => setReportOpen(true)}
                className="text-text-muted transition-colors hover:text-red-400"
              >
                🚨
              </button>
            </div>

            {/* Reply input */}
            {replyOpen && (
              <div className="mt-3">
                <CommentInput
                  postId={comment.postId}
                  parentId={comment.id}
                  onCommentAdded={handleReplyAdded}
                  placeholder="답글을 입력하세요..."
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Replies toggle */}
      {hasReplies && (
        <div style={{ marginLeft: depth > 0 ? Math.min(depth * 24, 72) : 0 }}>
          <button
            onClick={() => setRepliesExpanded(!repliesExpanded)}
            className="ml-4 mt-1 mb-1 text-xs text-accent hover:text-accent/80 transition-colors"
          >
            {repliesExpanded
              ? `▼ 답글 ${localReplies.length}개 접기`
              : `▶ 답글 ${localReplies.length}개 보기`}
          </button>
        </div>
      )}

      {/* Nested replies */}
      {hasReplies && repliesExpanded && (
        <div className="space-y-2">
          {localReplies.map((reply, i) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              index={index + i + 1}
              depth={depth + 1}
              onDeleted={(id) => {
                setLocalReplies((prev) => prev.filter((r) => r.id !== id));
                onDeleted?.(id);
              }}
              onReplyAdded={onReplyAdded}
            />
          ))}
        </div>
      )}

      <ReportModal
        targetType="COMMENT"
        targetId={comment.id}
        open={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </>
  );
}
