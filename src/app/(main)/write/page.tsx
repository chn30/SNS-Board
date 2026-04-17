'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createPost } from '@/actions/post.actions';

const CATEGORIES = [
  { value: 'FREE', label: '자유' },
  { value: 'QUESTION', label: '질문' },
  { value: 'INFO', label: '정보' },
] as const;

interface FieldErrors {
  title?: string[];
  content?: string[];
  category?: string[];
}

export default function WritePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [category, setCategory] = useState<string>('FREE');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await createPost({ title, content, category });

      if ('error' in result && result.error) {
        setError(result.error);
        if ('validationErrors' in result && result.validationErrors) {
          setFieldErrors(result.validationErrors as FieldErrors);
        }
        return;
      }

      // Navigate outside transition to avoid blocking on RSC fetch
      window.location.href = '/';
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-6">
      <h1
        className="mb-6 text-[26px] font-black text-text-primary"
        data-testid="write-title"
      >
        새 글 작성
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
        data-testid="write-form"
      >
        {/* Category */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-text-muted">
            카테고리
          </label>
          <div className="flex gap-2" data-testid="category-select">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                data-testid={`category-${cat.value.toLowerCase()}`}
                onClick={() => setCategory(cat.value)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                  category === cat.value
                    ? 'bg-[rgba(139,92,246,0.15)] text-accent'
                    : 'glass text-text-muted hover:text-text-secondary'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          {fieldErrors.category && (
            <p className="mt-1 text-xs text-hot">{fieldErrors.category[0]}</p>
          )}
        </div>

        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="mb-2 block text-xs font-semibold text-text-muted"
          >
            제목
          </label>
          <input
            id="title"
            type="text"
            data-testid="post-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            maxLength={200}
            className="glass w-full rounded-md border border-surface-border bg-transparent px-4 py-3 text-sm text-text-primary placeholder-text-muted outline-none transition-shadow focus:shadow-[0_0_0_2px_rgba(139,92,246,0.3)]"
          />
          {fieldErrors.title && (
            <p className="mt-1 text-xs text-hot">{fieldErrors.title[0]}</p>
          )}
        </div>

        {/* Content */}
        <div>
          <label
            htmlFor="content"
            className="mb-2 block text-xs font-semibold text-text-muted"
          >
            내용
          </label>
          <textarea
            id="content"
            data-testid="post-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="내용을 입력하세요"
            maxLength={5000}
            rows={8}
            className="glass w-full resize-none rounded-md border border-surface-border bg-transparent px-4 py-3 text-sm leading-relaxed text-text-primary placeholder-text-muted outline-none transition-shadow focus:shadow-[0_0_0_2px_rgba(139,92,246,0.3)]"
          />
          <div className="mt-1 flex justify-between text-xs text-text-muted">
            {fieldErrors.content ? (
              <p className="text-hot">{fieldErrors.content[0]}</p>
            ) : (
              <span />
            )}
            <span>{content.length}/5000</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            data-testid="write-error"
            className="rounded-md bg-[rgba(248,113,113,0.1)] px-4 py-3 text-sm text-hot"
          >
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            data-testid="write-cancel"
            className="glass rounded-lg px-5 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isPending}
            data-testid="post-submit"
            className="btn-primary flex-1 py-2.5 text-sm disabled:opacity-50"
          >
            {isPending ? '작성 중...' : '작성하기'}
          </button>
        </div>
      </form>
    </div>
  );
}
