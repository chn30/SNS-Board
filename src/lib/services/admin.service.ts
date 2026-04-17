import { prisma } from '@/lib/prisma';
import type { TargetType } from '@prisma/client';

const PAGE_SIZE = 20;

export interface AdminPostItem {
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

export interface AdminGetPostsParams {
  cursor?: string;
  filter?: 'all' | 'deleted' | 'hidden';
}

export async function adminGetPosts(params: AdminGetPostsParams): Promise<{
  posts: AdminPostItem[];
  nextCursor: string | null;
  total: number;
}> {
  try {
    const { cursor, filter } = params;

    const where: Record<string, unknown> = {};
    if (filter === 'deleted') where.isDeleted = true;
    else if (filter === 'hidden') where.isHidden = true;

    if (cursor) {
      where.id = { lt: cursor };
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: { id: 'desc' },
        take: PAGE_SIZE + 1,
        select: {
          id: true,
          title: true,
          content: true,
          category: true,
          isDeleted: true,
          isHidden: true,
          likeCount: true,
          commentCount: true,
          viewCount: true,
          createdAt: true,
        },
      }),
      prisma.post.count({
        where:
          filter === 'deleted'
            ? { isDeleted: true }
            : filter === 'hidden'
              ? { isHidden: true }
              : {},
      }),
    ]);

    const hasMore = posts.length > PAGE_SIZE;
    const result = posts.slice(0, PAGE_SIZE);

    // Batch report counts (no N+1)
    const postIds = result.map((p) => p.id);
    const reportCounts = await prisma.report.groupBy({
      by: ['targetId'],
      where: {
        targetType: 'POST',
        targetId: { in: postIds },
      },
      _count: true,
    });
    const reportMap = new Map(reportCounts.map((r) => [r.targetId, r._count]));

    return {
      posts: result.map((p) => ({
        ...p,
        reportCount: reportMap.get(p.id) || 0,
      })),
      nextCursor: hasMore ? result[result.length - 1].id : null,
      total,
    };
  } catch {
    return { posts: [], nextCursor: null, total: 0 };
  }
}

export async function adminDeletePost(
  postId: string,
  adminId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { isDeleted: true },
    });

    if (!post) return { success: false, error: '게시글을 찾을 수 없습니다.' };
    if (post.isDeleted)
      return { success: false, error: '이미 삭제된 게시글입니다.' };

    await prisma.$transaction([
      prisma.post.update({
        where: { id: postId },
        data: { isDeleted: true },
      }),
      prisma.adminLog.create({
        data: {
          adminId,
          action: 'DELETE_POST',
          targetType: 'POST',
          targetId: postId,
        },
      }),
    ]);

    return { success: true };
  } catch {
    return { success: false, error: '게시글 삭제에 실패했습니다.' };
  }
}

export async function adminRestorePost(
  postId: string,
  adminId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { isDeleted: true, isHidden: true },
    });

    if (!post) return { success: false, error: '게시글을 찾을 수 없습니다.' };
    if (!post.isDeleted && !post.isHidden)
      return { success: false, error: '이미 공개된 게시글입니다.' };

    await prisma.$transaction([
      prisma.post.update({
        where: { id: postId },
        data: { isDeleted: false, isHidden: false },
      }),
      prisma.adminLog.create({
        data: {
          adminId,
          action: 'RESTORE_POST',
          targetType: 'POST',
          targetId: postId,
        },
      }),
    ]);

    return { success: true };
  } catch {
    return { success: false, error: '게시글 복원에 실패했습니다.' };
  }
}

export interface AdminReportItem {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  reporterCount: number;
  createdAt: Date;
  targetTitle?: string;
  targetContent?: string;
}

export async function adminGetReports(
  cursor?: string,
): Promise<{ reports: AdminReportItem[]; nextCursor: string | null }> {
  try {
    const where: Record<string, unknown> = {};

    if (cursor) {
      where.id = { lt: cursor };
    }

    const reports = await prisma.report.findMany({
      where,
      orderBy: { id: 'desc' },
      take: PAGE_SIZE + 1,
      select: {
        id: true,
        targetType: true,
        targetId: true,
        reason: true,
        createdAt: true,
      },
    });

    const hasMore = reports.length > PAGE_SIZE;
    const result = reports.slice(0, PAGE_SIZE);

    // Batch reporter counts (no N+1)
    const targetKeys = [...new Set(result.map((r) => r.targetId))];
    const reporterCounts = await prisma.report.groupBy({
      by: ['targetType', 'targetId'],
      where: {
        targetId: { in: targetKeys },
      },
      _count: true,
    });
    const countMap = new Map(
      reporterCounts.map((r) => [`${r.targetType}:${r.targetId}`, r._count]),
    );

    // Batch target content lookups
    const postIds = [
      ...new Set(
        result.filter((r) => r.targetType === 'POST').map((r) => r.targetId),
      ),
    ];
    const commentIds = [
      ...new Set(
        result.filter((r) => r.targetType === 'COMMENT').map((r) => r.targetId),
      ),
    ];

    const [posts, comments] = await Promise.all([
      postIds.length > 0
        ? prisma.post.findMany({
            where: { id: { in: postIds } },
            select: { id: true, title: true, content: true },
          })
        : [],
      commentIds.length > 0
        ? prisma.comment.findMany({
            where: { id: { in: commentIds } },
            select: { id: true, content: true },
          })
        : [],
    ]);

    const postMap = new Map(posts.map((p) => [p.id, p]));
    const commentMap = new Map(comments.map((c) => [c.id, c]));

    const enrichedReports: AdminReportItem[] = result.map((report) => {
      const reporterCount =
        countMap.get(`${report.targetType}:${report.targetId}`) || 0;
      let targetTitle: string | undefined;
      let targetContent: string | undefined;

      if (report.targetType === 'POST') {
        const post = postMap.get(report.targetId);
        targetTitle = post?.title;
        targetContent = post?.content;
      } else {
        const comment = commentMap.get(report.targetId);
        targetContent = comment?.content;
      }

      return {
        ...report,
        reporterCount,
        targetTitle,
        targetContent,
      };
    });

    return {
      reports: enrichedReports,
      nextCursor: hasMore ? result[result.length - 1].id : null,
    };
  } catch {
    return { reports: [], nextCursor: null };
  }
}

export async function adminDismissReport(
  reportId: string,
  adminId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) return { success: false, error: '신고를 찾을 수 없습니다.' };

    await prisma.$transaction([
      prisma.report.delete({
        where: { id: reportId },
      }),
      prisma.adminLog.create({
        data: {
          adminId,
          action: 'DISMISS_REPORT',
          targetType: 'REPORT',
          targetId: reportId,
        },
      }),
    ]);

    return { success: true };
  } catch {
    return { success: false, error: '신고 기각에 실패했습니다.' };
  }
}

export async function adminGetStats(): Promise<{
  totalPosts: number;
  totalComments: number;
  activeReports: number;
  totalUsers: number;
}> {
  try {
    const [totalPosts, totalComments, activeReports, totalUsers] =
      await Promise.all([
        prisma.post.count(),
        prisma.comment.count(),
        prisma.report.count(),
        prisma.user.count(),
      ]);

    return { totalPosts, totalComments, activeReports, totalUsers };
  } catch {
    return { totalPosts: 0, totalComments: 0, activeReports: 0, totalUsers: 0 };
  }
}

export async function adminGetRecentActivity(limit = 10) {
  try {
    const logs = await prisma.adminLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        action: true,
        targetType: true,
        targetId: true,
        detail: true,
        createdAt: true,
      },
    });

    return logs;
  } catch {
    return [];
  }
}
