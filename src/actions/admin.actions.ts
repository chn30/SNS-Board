'use server';

import { requireAdmin } from '@/lib/auth-utils';
import * as adminService from '@/lib/services/admin.service';

export async function adminGetPosts(input?: {
  cursor?: string;
  filter?: string;
}) {
  const user = await requireAdmin();
  const filter = (input?.filter || 'all') as 'all' | 'deleted' | 'hidden';
  return adminService.adminGetPosts({ cursor: input?.cursor, filter });
}

export async function adminDeletePost(input: { postId: string }) {
  const user = await requireAdmin();
  return adminService.adminDeletePost(input.postId, user.id);
}

export async function adminRestorePost(input: { postId: string }) {
  const user = await requireAdmin();
  return adminService.adminRestorePost(input.postId, user.id);
}

export async function adminGetReports(input?: { cursor?: string }) {
  const user = await requireAdmin();
  return adminService.adminGetReports(input?.cursor);
}

export async function adminDismissReport(input: { reportId: string }) {
  const user = await requireAdmin();
  return adminService.adminDismissReport(input.reportId, user.id);
}

export async function adminGetStats() {
  await requireAdmin();
  return adminService.adminGetStats();
}

export async function adminGetRecentActivity() {
  await requireAdmin();
  return adminService.adminGetRecentActivity();
}
