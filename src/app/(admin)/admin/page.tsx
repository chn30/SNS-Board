import { adminGetStats, adminGetRecentActivity } from '@/actions/admin.actions';

export default async function AdminPage() {
  const [stats, recentActivity] = await Promise.all([
    adminGetStats(),
    adminGetRecentActivity(),
  ]);

  const statCards = [
    {
      label: '전체 게시글',
      value: stats.totalPosts,
      color: 'from-primary to-primary-pink',
    },
    {
      label: '전체 댓글',
      value: stats.totalComments,
      color: 'from-primary-pink to-hot',
    },
    {
      label: '활성 신고',
      value: stats.activeReports,
      color: 'from-hot to-warning',
    },
    {
      label: '사용자 수',
      value: stats.totalUsers,
      color: 'from-success to-accent',
    },
  ];

  const actionLabels: Record<string, string> = {
    DELETE_POST: '게시글 삭제',
    RESTORE_POST: '게시글 복원',
    DISMISS_REPORT: '신고 기각',
  };

  return (
    <div className="p-8" data-testid="admin-dashboard">
      <h1 className="mb-8 bg-gradient-to-r from-primary to-primary-pink bg-clip-text text-2xl font-black text-transparent">
        관리자 대시보드
      </h1>

      {/* Stats Grid */}
      <div
        className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        data-testid="admin-stats"
      >
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-surface-border bg-surface/60 p-6 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-primary/30"
            data-testid={`stat-${stat.label}`}
          >
            <p className="text-xs font-medium text-text-muted">{stat.label}</p>
            <p
              className={`mt-2 bg-gradient-to-r ${stat.color} bg-clip-text text-3xl font-black text-transparent`}
            >
              {stat.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div
        className="rounded-xl border border-surface-border bg-surface/60 p-6 backdrop-blur-xl"
        data-testid="admin-recent-activity"
      >
        <h2 className="mb-4 text-lg font-bold text-text-primary">최근 활동</h2>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-text-muted">아직 관리 활동이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-lg border border-surface-border bg-background/50 px-4 py-3"
                data-testid="activity-row"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-accent">
                    {actionLabels[log.action] || log.action}
                  </span>
                  <span className="text-sm text-text-secondary">
                    {log.targetType} #{log.targetId.slice(0, 8)}
                  </span>
                </div>
                <time className="text-xs text-text-muted">
                  {new Date(log.createdAt).toLocaleString('ko-KR')}
                </time>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
