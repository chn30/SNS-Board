'use server';

import { requireAuth } from '@/lib/auth-utils';
import { z } from 'zod';
import * as likeService from '@/lib/services/like.service';

const toggleLikeSchema = z.object({
  targetType: z.enum(['POST', 'COMMENT']),
  targetId: z.string().uuid(),
});

export async function toggleLike(input: unknown) {
  const user = await requireAuth();
  const parsed = toggleLikeSchema.safeParse(input);
  if (!parsed.success) {
    return { error: '잘못된 요청입니다.' };
  }

  try {
    const result = await likeService.toggleLike(
      user.id,
      parsed.data.targetType,
      parsed.data.targetId,
    );
    return { liked: result.liked, likeCount: result.likeCount };
  } catch {
    return { error: '처리에 실패했습니다. 다시 시도해주세요.' };
  }
}
