import { prisma } from '@/lib/prisma';
import type { TargetType, ReportReason } from '@prisma/client';

export interface CreateReportResult {
  success: boolean;
  duplicate?: boolean;
  hidden?: boolean;
  error?: string;
}

export async function createReport(
  reporterId: string,
  targetType: TargetType,
  targetId: string,
  reason: ReportReason,
): Promise<CreateReportResult> {
  try {
    return await prisma.$transaction(async (tx) => {
      // Check for duplicate inside transaction to prevent TOCTOU race
      const existing = await tx.report.findUnique({
        where: {
          reporterId_targetType_targetId: { reporterId, targetType, targetId },
        },
      });

      if (existing) {
        return { success: false, duplicate: true };
      }

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
  } catch (error) {
    return { success: false, error: 'Failed to create report' };
  }
}

export async function getReportCount(
  targetType: TargetType,
  targetId: string,
): Promise<number> {
  try {
    return await prisma.report.count({
      where: { targetType, targetId },
    });
  } catch {
    return 0;
  }
}
