'use client';

import { useState, useTransition } from 'react';
import { createReport } from '@/actions/report.actions';
import { useToast } from '@/components/Toast';

const REASONS = [
  { key: 'ABUSE', label: '욕설/비방' },
  { key: 'SPAM', label: '스팸/광고' },
  { key: 'INAPPROPRIATE', label: '부적절 콘텐츠' },
  { key: 'PRIVACY', label: '개인정보 노출' },
  { key: 'OTHER', label: '기타' },
] as const;

interface ReportModalProps {
  targetType: 'POST' | 'COMMENT';
  targetId: string;
  open: boolean;
  onClose: () => void;
}

export default function ReportModal({
  targetType,
  targetId,
  open,
  onClose,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  if (!open) return null;

  function handleSubmit() {
    if (!selectedReason) return;
    startTransition(async () => {
      const result = await createReport({
        targetType,
        targetId,
        reason: selectedReason,
      });

      if ('error' in result && result.error) {
        if ((result as any).duplicate) {
          showToast('이미 신고한 게시글입니다.', 'info');
        } else {
          showToast(result.error as string, 'error');
        }
      } else {
        showToast('신고가 접수되었습니다.', 'success');
      }

      setSelectedReason(null);
      onClose();
    });
  }

  return (
    <div
      data-testid="report-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="glass w-full max-w-md rounded-2xl border border-[rgba(255,255,255,0.08)] p-6">
        <h2 className="mb-4 text-lg font-bold text-text-primary">신고하기</h2>
        <p className="mb-4 text-sm text-text-secondary">
          신고 사유를 선택해주세요.
        </p>

        <div className="mb-6 space-y-2">
          {REASONS.map((reason) => (
            <button
              key={reason.key}
              data-testid={`report-reason-${reason.key.toLowerCase()}`}
              onClick={() => setSelectedReason(reason.key)}
              className={`w-full rounded-xl px-4 py-3 text-left text-sm transition-all ${
                selectedReason === reason.key
                  ? 'bg-[rgba(139,92,246,0.15)] text-accent border border-[rgba(139,92,246,0.3)]'
                  : 'glass text-text-secondary hover:bg-[rgba(255,255,255,0.05)]'
              }`}
            >
              {reason.label}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            data-testid="report-cancel"
            onClick={onClose}
            className="glass flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-text-muted transition-colors hover:text-text-secondary"
          >
            취소
          </button>
          <button
            data-testid="report-submit"
            onClick={handleSubmit}
            disabled={!selectedReason || isPending}
            className="btn-primary flex-1 rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {isPending ? '신고 중...' : '신고하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
