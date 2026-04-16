'use client';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="glass w-full max-w-md rounded-xl p-8">
        <h1 className="gradient-primary mb-6 bg-clip-text text-center text-2xl font-black text-transparent">
          익명 게시판
        </h1>
        <p className="mb-8 text-center text-text-secondary">
          사내 SSO로 로그인하세요
        </p>
        <form>
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
              placeholder="비밀번호를 입력하세요"
              className="w-full bg-surface border border-surface-border rounded-md p-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            data-testid="login-submit"
            type="submit"
            className="gradient-primary w-full rounded-lg py-3 font-semibold text-white transition hover:opacity-90"
          >
            로그인
          </button>
        </form>
      </div>
    </div>
  );
}
