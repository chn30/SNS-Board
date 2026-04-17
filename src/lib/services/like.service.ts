import { prisma } from '@/lib/prisma';
import type { TargetType } from '@prisma/client';

export interface ToggleLikeResult {
  liked: boolean;
  likeCount: number;
  error?: string;
}

export async function toggleLike(
  userId: string,
  targetType: TargetType,
  targetId: string,
): Promise<ToggleLikeResult> {
  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.like.findUnique({
        where: {
          userId_targetType_targetId: { userId, targetType, targetId },
        },
      });

      if (existing) {
        // Unlike
        await tx.like.delete({ where: { id: existing.id } });

        if (targetType === 'POST') {
          const post = await tx.post.update({
            where: { id: targetId },
            data: { likeCount: { decrement: 1 } },
            select: { likeCount: true },
          });
          return { liked: false, likeCount: post.likeCount };
        } else {
          const comment = await tx.comment.update({
            where: { id: targetId },
            data: { likeCount: { decrement: 1 } },
            select: { likeCount: true },
          });
          return { liked: false, likeCount: comment.likeCount };
        }
      } else {
        // Like
        await tx.like.create({
          data: { userId, targetType, targetId },
        });

        if (targetType === 'POST') {
          const post = await tx.post.update({
            where: { id: targetId },
            data: { likeCount: { increment: 1 } },
            select: { likeCount: true },
          });
          return { liked: true, likeCount: post.likeCount };
        } else {
          const comment = await tx.comment.update({
            where: { id: targetId },
            data: { likeCount: { increment: 1 } },
            select: { likeCount: true },
          });
          return { liked: true, likeCount: comment.likeCount };
        }
      }
    });
  } catch (error) {
    return { liked: false, likeCount: 0, error: 'Failed to toggle like' };
  }
}
