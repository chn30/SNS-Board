import { prisma } from '@/lib/prisma';

const PAGE_SIZE = 20;

export interface CommentItem {
  id: string;
  postId: string;
  content: string;
  likeCount: number;
  createdAt: Date;
  isLiked: boolean;
}

export async function getComments(
  postId: string,
  cursor?: string,
  userId?: string,
): Promise<{ comments: CommentItem[]; nextCursor: string | null }> {
  const where: any = {
    postId,
    isDeleted: false,
  };

  if (cursor) {
    const cursorComment = await prisma.comment.findUnique({
      where: { id: cursor },
      select: { createdAt: true },
    });
    if (!cursorComment) {
      return { comments: [], nextCursor: null };
    }
    where.createdAt = { lt: cursorComment.createdAt };
  }

  const comments = await prisma.comment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: PAGE_SIZE + 1,
    select: {
      id: true,
      postId: true,
      content: true,
      likeCount: true,
      createdAt: true,
    },
  });

  let likedIds = new Set<string>();
  if (userId && comments.length > 0) {
    const likes = await prisma.like.findMany({
      where: {
        userId,
        targetType: 'COMMENT',
        targetId: { in: comments.map((c) => c.id) },
      },
      select: { targetId: true },
    });
    likedIds = new Set(likes.map((l) => l.targetId));
  }

  const hasMore = comments.length > PAGE_SIZE;
  const result = comments.slice(0, PAGE_SIZE);

  return {
    comments: result.map((c) => ({
      ...c,
      isLiked: likedIds.has(c.id),
    })),
    nextCursor: hasMore ? result[result.length - 1].id : null,
  };
}

export async function createComment(
  authorId: string,
  postId: string,
  content: string,
): Promise<CommentItem> {
  const post = await prisma.post.findFirst({
    where: { id: postId, isDeleted: false, isHidden: false },
    select: { id: true },
  });

  if (!post) {
    throw new Error('게시글을 찾을 수 없습니다.');
  }

  const [comment] = await prisma.$transaction([
    prisma.comment.create({
      data: { authorId, postId, content },
      select: {
        id: true,
        postId: true,
        content: true,
        likeCount: true,
        createdAt: true,
      },
    }),
    prisma.post.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } },
    }),
  ]);

  return { ...comment, isLiked: false };
}

export async function deleteComment(
  commentId: string,
  userId: string,
  userRole: string,
): Promise<{ success: boolean; error?: string }> {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true, postId: true, isDeleted: true },
  });

  if (!comment) {
    return { success: false, error: '댓글을 찾을 수 없습니다.' };
  }

  if (comment.isDeleted) {
    return { success: false, error: '이미 삭제된 댓글입니다.' };
  }

  if (comment.authorId !== userId && userRole !== 'ADMIN') {
    return { success: false, error: '삭제 권한이 없습니다.' };
  }

  await prisma.$transaction([
    prisma.comment.update({
      where: { id: commentId },
      data: { isDeleted: true },
    }),
    prisma.post.update({
      where: { id: comment.postId },
      data: { commentCount: { decrement: 1 } },
    }),
  ]);

  return { success: true };
}
