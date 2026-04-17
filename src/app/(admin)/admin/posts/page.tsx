'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  adminGetPosts,
  adminDeletePost,
  adminRestorePost,
} from '@/actions/admin.actions';

interface AdminPost {
  id: string;
  title: string;
  content: string;
  category: string;
  isDeleted: boolean;
  isHidden: boolean;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  createdAt: Date;
  reportCount: number;
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [filter, setFilter] = useState<'all' | 'deleted' | 'hidden'>('all');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadPosts = (cursor?: string) => {
    startTransition(async () => {
      const result = await adminGetPosts({ cursor, filter });
      if (cursor) {
        setPosts((prev) => [...prev, ...result.posts]);
      } else {
        setPosts(result.posts);
      }
      setNextCursor(result.nextCursor);
      setTotal(result.total);
    });
  };

  useEffect(() => {
    loadPosts();
  }, [filter]);

  const handleDelete = (postId: string) => {
    startTransition(async () => {
      const result = await adminDeletePost({ postId });
      if (result.success) {
        showToast('게시글이 삭제되었습니다.');
        loadPosts();
      } else {
        showToast(result.error || '삭제에 실패했습니다.');
      }
      setConfirmDelete(null);
    });
  };

  const handleRestore = (postId: string) => {
    startTransition(async () => {
      const result = await adminRestorePost({ postId });
      if (result.success) {
        showToast('게시글이 복원되었습니다.');
        loadPosts();
      } else {
        showToast(result.error || '복원에 실패했습니다.');
      }
    });
  };

  const categoryLabels: Record<string, { label: string; className: string }> = {
    FREE: { label: '자유', className: 'bg-cat-free text-cat-free-text' },
    QUESTION: {
      label: '질문',
      className: 'bg-cat-question text-cat-question-text',
    },
    INFO: { label: '정보', className: 'bg-cat-info text-cat-info-text' },
  };

  return (
    <div className="p-8" data-testid="admin-posts-page">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="bg-gradient-to-r from-primary to-primary-pink bg-clip-text text-2xl font-black text-transparent">
          게시글 관리
        </h1>
        <span className="text-sm text-text-muted">총 {total}건</span>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2" data-testid="admin-posts-filter">
        {(['all', 'deleted', 'hidden'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-primary/20 text-accent'
                : 'bg-surface text-text-muted hover:text-text-secondary'
            }`}
            data-testid={`filter-${f}`}
          >
            {f === 'all' ? '전체' : f === 'deleted' ? '삭제됨' : '비공개'}
          </button>
        ))}
      </div>

      {/* Posts Table */}
      <div className="rounded-xl border border-surface-border bg-surface/60 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border text-left text-xs font-medium text-text-muted">
                <th className="px-4 py-3">제목</th>
                <th className="px-4 py-3">카테고리</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3">신고</th>
                <th className="px-4 py-3">통계</th>
                <th className="px-4 py-3">작성일</th>
                <th className="px-4 py-3">작업</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.id}
                  className="border-b border-surface-border/50 transition-colors hover:bg-surface/80"
                  data-testid="admin-post-row"
                >
                  <td className="max-w-[300px] truncate px-4 py-3 text-sm text-text-primary">
                    {post.title}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-medium ${categoryLabels[post.category]?.className || ''}`}
                    >
                      {categoryLabels[post.category]?.label || post.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {post.isDeleted ? (
                      <span
                        className="rounded-md bg-hot/10 px-2 py-0.5 text-xs font-medium text-hot"
                        data-testid="status-deleted"
                      >
                        삭제됨
                      </span>
                    ) : post.isHidden ? (
                      <span
                        className="rounded-md bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning"
                        data-testid="status-hidden"
                      >
                        비공개
                      </span>
                    ) : (
                      <span
                        className="rounded-md bg-success/10 px-2 py-0.5 text-xs font-medium text-success"
                        data-testid="status-active"
                      >
                        공개
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {post.reportCount > 0 && (
                      <span className="rounded-md bg-hot/10 px-2 py-0.5 text-xs font-medium text-hot">
                        {post.reportCount}건
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">
                    <span title="좋아요">&#9829; {post.likeCount}</span>
                    <span className="mx-1">|</span>
                    <span title="댓글">&#128172; {post.commentCount}</span>
                    <span className="mx-1">|</span>
                    <span title="조회">&#128065; {post.viewCount}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">
                    {new Date(post.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {!post.isDeleted && (
                        <button
                          onClick={() => setConfirmDelete(post.id)}
                          className="rounded-md bg-hot/10 px-3 py-1.5 text-xs font-medium text-hot transition-colors hover:bg-hot/20"
                          data-testid="admin-delete-post"
                        >
                          삭제
                        </button>
                      )}
                      {(post.isDeleted || post.isHidden) && (
                        <button
                          onClick={() => handleRestore(post.id)}
                          className="rounded-md bg-success/10 px-3 py-1.5 text-xs font-medium text-success transition-colors hover:bg-success/20"
                          data-testid="admin-restore-post"
                        >
                          복원
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {posts.length === 0 && !isPending && (
          <div className="py-12 text-center text-sm text-text-muted">
            게시글이 없습니다.
          </div>
        )}
      </div>

      {/* Load more */}
      {nextCursor && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => loadPosts(nextCursor)}
            disabled={isPending}
            className="rounded-lg bg-surface px-6 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-primary/10 hover:text-accent disabled:opacity-50"
            data-testid="load-more"
          >
            {isPending ? '로딩 중...' : '더 보기'}
          </button>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-sm rounded-xl border border-surface-border bg-background p-6"
            data-testid="confirm-dialog"
          >
            <h3 className="mb-2 text-lg font-bold text-text-primary">
              게시글 삭제
            </h3>
            <p className="mb-6 text-sm text-text-secondary">
              이 게시글을 삭제하시겠습니까?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-lg bg-surface px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary"
                data-testid="confirm-cancel"
              >
                취소
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="rounded-lg bg-hot/20 px-4 py-2 text-sm font-medium text-hot hover:bg-hot/30"
                data-testid="confirm-delete"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 animate-slide-up rounded-lg border border-surface-border bg-surface/90 px-4 py-3 text-sm text-text-primary backdrop-blur-xl"
          data-testid="toast"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
