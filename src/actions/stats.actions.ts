'use server';

import { prisma } from '@/lib/prisma';

export async function getBoardStats() {
  try {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    const [todayPosts, totalPosts, activeUsers] = await Promise.all([
      prisma.post.count({
        where: { isDeleted: false, createdAt: { gte: todayStart } },
      }),
      prisma.post.count({
        where: { isDeleted: false },
      }),
      prisma.user.count(),
    ]);

    return { todayPosts, totalPosts, activeUsers };
  } catch {
    return { todayPosts: 0, totalPosts: 0, activeUsers: 0 };
  }
}

export async function getTrendingPosts() {
  try {
    const posts = await prisma.post.findMany({
      where: { isDeleted: false, isHidden: false },
      orderBy: { likeCount: 'desc' },
      take: 3,
      select: {
        id: true,
        title: true,
        likeCount: true,
        commentCount: true,
      },
    });

    return posts;
  } catch {
    return [];
  }
}
