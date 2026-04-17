import { prisma } from '@/lib/prisma';
import type { TargetType, ReportReason } from '@prisma/client';

export interface CreateReportResult {
  success: boolean;
  duplicate?: boolean;
  hidden?: boolean;
}

export async function createReport(
  reporterId: string,
  targetType: TargetType,
  targetId: string,
  reason: ReportReason,
): Promise<CreateReportResult> {
  // Check for duplicate report from same user
  const existing = await prisma.report.findUnique({
    where: {
      reporterId_targetType_targetId: { reporterId, targetType, targetId },
    },
  });

  if (existing) {
    return { success: false, duplicate: true };
  }

  return prisma.$transaction(async (tx) => {
    await tx.report.create({
      data: { reporterId, targetType, targetId, reason },
    });

    // Count unique reports for target
    const reportCount = await tx.report.count({
      where: { targetType, targetId },
    });

    let hidden = false;
    if (reportCount >= 3 && targetType === 'POST') {
      await tx.post.update({
        where: { id: targetId },
        data: { isHidden: true },
      });
      hidden = true;
    }

    return { success: true, hidden };
  });
}

export async function getReportCount(
  targetType: TargetType,
  targetId: string,
): Promise<number> {
  return prisma.report.count({
    where: { targetType, targetId },
  });
}
