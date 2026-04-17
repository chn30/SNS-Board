'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  adminGetReports,
  adminDismissReport,
  adminDeletePost,
} from '@/actions/admin.actions';

interface AdminReport {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  reporterCount: number;
  createdAt: Date;
  targetTitle?: string;
  targetContent?: string;
}

const reasonLabels: Record<string, string> = {
  ABUSE: '욕설/비방',
  SPAM: '스팸',
  INAPPROPRIATE: '부적절한 내용',
  PRIVACY: '개인정보 노출',
  OTHER: '기타',
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadReports = (cursor?: string) => {
    startTransition(async () => {
      const result = await adminGetReports({ cursor });
      if (cursor) {
        setReports((prev) => [...prev, ...result.reports]);
      } else {
        setReports(result.reports);
      }
      setNextCursor(result.nextCursor);
    });
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleDismiss = (reportId: string) => {
    startTransition(async () => {
      const result = await adminDismissReport({ reportId });
      if (result.success) {
        showToast('신고가 기각되었습니다.');
        setReports((prev) => prev.filter((r) => r.id !== reportId));
      } else {
        showToast(result.error || '기각에 실패했습니다.');
      }
    });
  };

  const handleDeleteContent = (report: AdminReport) => {
    if (report.targetType !== 'POST') return;
    startTransition(async () => {
      const result = await adminDeletePost({ postId: report.targetId });
      if (result.success) {
        showToast('신고된 콘텐츠가 삭제되었습니다.');
        loadReports();
      } else {
        showToast(result.error || '삭제에 실패했습니다.');
      }
    });
  };

  return (
    <div className="p-8" data-testid="admin-reports-page">
      <h1 className="mb-8 bg-gradient-to-r from-primary to-primary-pink bg-clip-text text-2xl font-black text-transparent">
        신고 관리
      </h1>

      <div className="space-y-4">
        {reports.map((report) => (
          <div
            key={report.id}
            className="rounded-xl border border-surface-border bg-surface/60 p-5 backdrop-blur-xl"
            data-testid="admin-report-row"
          >
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="rounded-md bg-hot/10 px-2 py-0.5 text-xs font-medium text-hot">
                  {reasonLabels[report.reason] || report.reason}
                </span>
                <span className="text-xs text-text-muted">
                  {report.targetType === 'POST' ? '게시글' : '댓글'}
                </span>
                <span className="text-xs text-text-muted">
                  신고 {report.reporterCount}건
                </span>
              </div>
              <time className="text-xs text-text-muted">
                {new Date(report.createdAt).toLocaleDateString('ko-KR')}
              </time>
            </div>

            {report.targetTitle && (
              <h3 className="mb-1 text-sm font-bold text-text-primary">
                {report.targetTitle}
              </h3>
            )}
            {report.targetContent && (
              <p className="mb-4 line-clamp-2 text-sm text-text-secondary">
                {report.targetContent}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleDismiss(report.id)}
                className="rounded-md bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-primary/10 hover:text-accent"
                data-testid="admin-dismiss-report"
              >
                기각
              </button>
              {report.targetType === 'POST' && (
                <button
                  onClick={() => handleDeleteContent(report)}
                  className="rounded-md bg-hot/10 px-3 py-1.5 text-xs font-medium text-hot transition-colors hover:bg-hot/20"
                  data-testid="admin-delete-reported"
                >
                  콘텐츠 삭제
                </button>
              )}
            </div>
          </div>
        ))}

        {reports.length === 0 && !isPending && (
          <div className="rounded-xl border border-surface-border bg-surface/60 py-12 text-center text-sm text-text-muted backdrop-blur-xl">
            처리할 신고가 없습니다.
          </div>
        )}
      </div>

      {nextCursor && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => loadReports(nextCursor)}
            disabled={isPending}
            className="rounded-lg bg-surface px-6 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-primary/10 hover:text-accent disabled:opacity-50"
          >
            {isPending ? '로딩 중...' : '더 보기'}
          </button>
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
