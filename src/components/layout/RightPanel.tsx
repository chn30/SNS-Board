export default function RightPanel() {
  return (
    <aside
      data-testid="right-panel"
      className="fixed right-0 top-0 z-20 hidden h-screen w-[340px] flex-col gap-6 overflow-y-auto border-l border-surface-border bg-background px-5 py-6 xl:flex"
    >
      {/* Trending */}
      <section className="glass rounded-xl p-5">
        <h3 className="mb-4 text-sm font-bold text-text-primary">
          🔥 인기 급상승
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="mt-0.5 text-xs font-bold text-accent">{i}</span>
              <div className="min-w-0 flex-1">
                <div className="h-3 w-full rounded bg-[rgba(255,255,255,0.06)]" />
                <div className="mt-1.5 h-2 w-2/3 rounded bg-[rgba(255,255,255,0.04)]" />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-text-muted">
          게시글이 쌓이면 표시됩니다
        </p>
      </section>

      {/* Stats */}
      <section className="glass rounded-xl p-5">
        <h3 className="mb-4 text-sm font-bold text-text-primary">
          📊 게시판 통계
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">오늘 작성</span>
            <span className="font-semibold text-text-primary">-</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">전체 게시글</span>
            <span className="font-semibold text-text-primary">-</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">활성 사용자</span>
            <span className="font-semibold text-text-primary">-</span>
          </div>
        </div>
      </section>
    </aside>
  );
}
