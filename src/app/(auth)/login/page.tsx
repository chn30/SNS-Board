'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      await signIn('credentials', {
        email,
        password,
        redirectTo: '/',
      });
    } catch {
      // CredentialsSignin error is thrown when credentials are invalid
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      setLoading(false);
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ background: '#05050a' }}
    >
      <div className="glass w-full max-w-md rounded-xl p-8">
        <h1 className="gradient-primary mb-6 bg-clip-text text-center text-2xl font-black text-transparent">
          익명 게시판
        </h1>
        <p className="mb-8 text-center text-text-secondary">
          사내 SSO로 로그인하세요
        </p>
        {error && (
          <div
            data-testid="login-error"
            className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-center text-sm text-red-400"
          >
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm text-text-secondary mb-2"
            >
              이메일
            </label>
            <input
              data-testid="login-email"
              id="email"
              name="email"
              type="email"
              required
              placeholder="이메일을 입력하세요"
              className="w-full bg-surface border border-surface-border rounded-md p-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-sm text-text-secondary mb-2"
            >
              비밀번호
            </label>
            <input
              data-testid="login-password"
              id="password"
              name="password"
              type="password"
              required
              placeholder="비밀번호를 입력하세요"
              className="w-full bg-surface border border-surface-border rounded-md p-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            data-testid="login-submit"
            type="submit"
            disabled={loading}
            className="gradient-primary w-full rounded-lg py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}
