export default function PostCardSkeleton() {
  return (
    <div
      data-testid="post-skeleton"
      className="glass animate-pulse rounded-xl p-5"
    >
      <div className="flex gap-4">
        <div className="h-11 w-11 flex-shrink-0 rounded-lg bg-[rgba(255,255,255,0.06)]" />
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex gap-2">
            <div className="h-3 w-12 rounded bg-[rgba(255,255,255,0.06)]" />
            <div className="h-3 w-16 rounded bg-[rgba(255,255,255,0.06)]" />
          </div>
          <div className="mb-1 h-4 w-3/4 rounded bg-[rgba(255,255,255,0.06)]" />
          <div className="mb-3 h-3 w-full rounded bg-[rgba(255,255,255,0.04)]" />
          <div className="h-3 w-2/3 rounded bg-[rgba(255,255,255,0.04)]" />
        </div>
      </div>
    </div>
  );
}
