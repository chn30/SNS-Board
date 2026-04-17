import { prisma } from '@/lib/prisma';
import type { TargetType } from '@prisma/client';

export interface ToggleLikeResult {
  liked: boolean;
  likeCount: number;
}

export async function toggleLike(
  userId: string,
  targetType: TargetType,
  targetId: string,
): Promise<ToggleLikeResult> {
  const existing = await prisma.like.findUnique({
    where: {
      userId_targetType_targetId: { userId, targetType, targetId },
    },
  });

  if (existing) {
    // Unlike
    await prisma.like.delete({ where: { id: existing.id } });

    if (targetType === 'POST') {
      const post = await prisma.post.update({
        where: { id: targetId },
        data: { likeCount: { decrement: 1 } },
        select: { likeCount: true },
      });
      return { liked: false, likeCount: post.likeCount };
    } else {
      const comment = await prisma.comment.update({
        where: { id: targetId },
        data: { likeCount: { decrement: 1 } },
        select: { likeCount: true },
      });
      return { liked: false, likeCount: comment.likeCount };
    }
  } else {
    // Like
    await prisma.like.create({
      data: { userId, targetType, targetId },
    });

    if (targetType === 'POST') {
      const post = await prisma.post.update({
        where: { id: targetId },
        data: { likeCount: { increment: 1 } },
        select: { likeCount: true },
      });
      return { liked: true, likeCount: post.likeCount };
    } else {
      const comment = await prisma.comment.update({
        where: { id: targetId },
        data: { likeCount: { increment: 1 } },
        select: { likeCount: true },
      });
      return { liked: true, likeCount: comment.likeCount };
    }
  }
}
