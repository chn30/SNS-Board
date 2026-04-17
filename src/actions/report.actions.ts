'use server';

import { requireAuth } from '@/lib/auth-utils';
import { z } from 'zod';
import * as reportService from '@/lib/services/report.service';

const createReportSchema = z.object({
  targetType: z.enum(['POST', 'COMMENT']),
  targetId: z.string().uuid(),
  reason: z.enum(['ABUSE', 'SPAM', 'INAPPROPRIATE', 'PRIVACY', 'OTHER']),
});

export async function createReport(input: unknown) {
  const user = await requireAuth();
  const parsed = createReportSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: '잘못된 요청입니다.',
      validationErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await reportService.createReport(
      user.id,
      parsed.data.targetType,
      parsed.data.targetId,
      parsed.data.reason,
    );

    if (result.duplicate) {
      return { error: '이미 신고한 게시글입니다.', duplicate: true };
    }

    return {
      success: true,
      hidden: result.hidden,
      message: result.hidden
        ? '신고가 접수되었으며, 해당 게시글이 비공개 처리되었습니다.'
        : '신고가 접수되었습니다.',
    };
  } catch {
    return { error: '신고 접수에 실패했습니다. 다시 시도해주세요.' };
  }
}
