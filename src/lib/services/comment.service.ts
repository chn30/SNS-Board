import { prisma } from '@/lib/prisma';

const PAGE_SIZE = 50;

export interface CommentItem {
  id: string;
  postId: string;
  parentId: string | null;
  content: string;
  likeCount: number;
  createdAt: Date;
  isLiked: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isPostAuthor: boolean;
  replies?: CommentItem[];
}

export async function getComments(
  postId: string,
  cursor: string | undefined,
  userId: string | undefined,
  userRole?: string,
): Promise<{ comments: CommentItem[]; nextCursor: string | null }> {
  // Get the post author id to mark "글쓴이"
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });
  const postAuthorId = post?.authorId;

  const where: any = {
    postId,
    isDeleted: false,
  };

  const comments = await prisma.comment.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    take: PAGE_SIZE + 1,
    select: {
      id: true,
      postId: true,
      authorId: true,
      parentId: true,
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

  const isAdmin = userRole === 'ADMIN';

  // Build flat list with parentId
  const flat: CommentItem[] = result.map(({ authorId, ...c }) => ({
    ...c,
    isLiked: likedIds.has(c.id),
    isOwner: !!userId && authorId === userId,
    isAdmin,
    isPostAuthor: !!postAuthorId && authorId === postAuthorId,
  }));

  // Build tree structure
  const map = new Map<string, CommentItem>();
  const roots: CommentItem[] = [];

  for (const comment of flat) {
    comment.replies = [];
    map.set(comment.id, comment);
  }

  for (const comment of flat) {
    if (comment.parentId && map.has(comment.parentId)) {
      map.get(comment.parentId)!.replies!.push(comment);
    } else {
      roots.push(comment);
    }
  }

  return {
    comments: roots,
    nextCursor: hasMore ? result[result.length - 1].id : null,
  };
}

export async function createComment(
  authorId: string,
  postId: string,
  content: string,
  parentId?: string,
): Promise<CommentItem> {
  const post = await prisma.post.findFirst({
    where: { id: postId, isDeleted: false, isHidden: false },
    select: { id: true, authorId: true },
  });

  if (!post) {
    throw new Error('게시글을 찾을 수 없습니다.');
  }

  // Validate parentId if provided
  if (parentId) {
    const parent = await prisma.comment.findFirst({
      where: { id: parentId, postId, isDeleted: false },
    });
    if (!parent) {
      throw new Error('부모 댓글을 찾을 수 없습니다.');
    }
  }

  const [comment] = await prisma.$transaction([
    prisma.comment.create({
      data: { authorId, postId, content, parentId: parentId || null },
      select: {
        id: true,
        postId: true,
        parentId: true,
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

  return {
    ...comment,
    isLiked: false,
    isOwner: true,
    isAdmin: false,
    isPostAuthor: post.authorId === authorId,
  };
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
