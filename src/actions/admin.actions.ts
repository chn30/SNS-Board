'use server';

import { z } from 'zod';
import { requireAdmin } from '@/lib/auth-utils';
import * as adminService from '@/lib/services/admin.service';

const adminGetPostsSchema = z.object({
  cursor: z.string().min(1).optional(),
  filter: z.enum(['all', 'deleted', 'hidden']).optional(),
});

const adminPostIdSchema = z.object({
  postId: z.string().uuid(),
});

const adminReportCursorSchema = z.object({
  cursor: z.string().min(1).optional(),
});

const adminReportIdSchema = z.object({
  reportId: z.string().uuid(),
});

export async function adminGetPosts(input?: {
  cursor?: string;
  filter?: string;
}) {
  try {
    await requireAdmin();
    const parsed = adminGetPostsSchema.safeParse(input ?? {});
    if (!parsed.success) {
      return { posts: [], nextCursor: null, total: 0 };
    }
    return adminService.adminGetPosts({
      cursor: parsed.data.cursor,
      filter: parsed.data.filter ?? 'all',
    });
  } catch {
    return { posts: [], nextCursor: null, total: 0 };
  }
}

export async function adminDeletePost(input: { postId: string }) {
  try {
    const user = await requireAdmin();
    const parsed = adminPostIdSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: '잘못된 요청입니다.' };
    }
    return adminService.adminDeletePost(parsed.data.postId, user.id);
  } catch {
    return { success: false, error: '권한이 없습니다.' };
  }
}

export async function adminRestorePost(input: { postId: string }) {
  try {
    const user = await requireAdmin();
    const parsed = adminPostIdSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: '잘못된 요청입니다.' };
    }
    return adminService.adminRestorePost(parsed.data.postId, user.id);
  } catch {
    return { success: false, error: '권한이 없습니다.' };
  }
}

export async function adminGetReports(input?: { cursor?: string }) {
  try {
    await requireAdmin();
    const parsed = adminReportCursorSchema.safeParse(input ?? {});
    if (!parsed.success) {
      return { reports: [], nextCursor: null };
    }
    return adminService.adminGetReports(parsed.data.cursor);
  } catch {
    return { reports: [], nextCursor: null };
  }
}

export async function adminDismissReport(input: { reportId: string }) {
  try {
    const user = await requireAdmin();
    const parsed = adminReportIdSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: '잘못된 요청입니다.' };
    }
    return adminService.adminDismissReport(parsed.data.reportId, user.id);
  } catch {
    return { success: false, error: '권한이 없습니다.' };
  }
}

export async function adminGetStats() {
  try {
    await requireAdmin();
    return adminService.adminGetStats();
  } catch {
    return { totalPosts: 0, totalComments: 0, activeReports: 0, totalUsers: 0 };
  }
}

export async function adminGetRecentActivity() {
  try {
    await requireAdmin();
    return adminService.adminGetRecentActivity();
  } catch {
    return [];
  }
}
