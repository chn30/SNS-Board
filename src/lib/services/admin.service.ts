'use server';

import { prisma } from '@/lib/prisma';

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

export async function adminGetPosts(
  params: AdminGetPostsParams,
): Promise<{
  posts: AdminPostItem[];
  nextCursor: string | null;
  total: number;
}> {
  const { cursor, filter } = params;

  const where: any = {};
  if (filter === 'deleted') where.isDeleted = true;
  else if (filter === 'hidden') where.isHidden = true;

  if (cursor) {
    const cursorPost = await prisma.post.findUnique({
      where: { id: cursor },
      select: { createdAt: true },
    });
    if (cursorPost) {
      where.createdAt = { lt: cursorPost.createdAt };
    }
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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

  // Get report counts for each post
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
}

export async function adminDeletePost(
  postId: string,
  adminId: string,
): Promise<{ success: boolean; error?: string }> {
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
}

export async function adminRestorePost(
  postId: string,
  adminId: string,
): Promise<{ success: boolean; error?: string }> {
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
  // Group reports by target to show unique targets with reporter counts
  const where: any = {};

  if (cursor) {
    const cursorReport = await prisma.report.findUnique({
      where: { id: cursor },
      select: { createdAt: true },
    });
    if (cursorReport) {
      where.createdAt = { lt: cursorReport.createdAt };
    }
  }

  const reports = await prisma.report.findMany({
    where,
    orderBy: { createdAt: 'desc' },
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

  // Get reporter counts per target
  const targetKeys = [
    ...new Set(result.map((r) => `${r.targetType}:${r.targetId}`)),
  ];
  const enrichedReports: AdminReportItem[] = [];

  for (const report of result) {
    const reporterCount = await prisma.report.count({
      where: {
        targetType: report.targetType as any,
        targetId: report.targetId,
      },
    });

    let targetTitle: string | undefined;
    let targetContent: string | undefined;

    if (report.targetType === 'POST') {
      const post = await prisma.post.findUnique({
        where: { id: report.targetId },
        select: { title: true, content: true },
      });
      targetTitle = post?.title;
      targetContent = post?.content;
    } else {
      const comment = await prisma.comment.findUnique({
        where: { id: report.targetId },
        select: { content: true },
      });
      targetContent = comment?.content;
    }

    enrichedReports.push({
      ...report,
      reporterCount,
      targetTitle,
      targetContent,
    });
  }

  return {
    reports: enrichedReports,
    nextCursor: hasMore ? result[result.length - 1].id : null,
  };
}

export async function adminDismissReport(
  reportId: string,
  adminId: string,
): Promise<{ success: boolean; error?: string }> {
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
}

export async function adminGetStats(): Promise<{
  totalPosts: number;
  totalComments: number;
  activeReports: number;
  totalUsers: number;
}> {
  const [totalPosts, totalComments, activeReports, totalUsers] =
    await Promise.all([
      prisma.post.count(),
      prisma.comment.count(),
      prisma.report.count(),
      prisma.user.count(),
    ]);

  return { totalPosts, totalComments, activeReports, totalUsers };
}

export async function adminGetRecentActivity(limit = 10) {
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
}
