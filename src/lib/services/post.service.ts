import { prisma } from '@/lib/prisma';
import type { Category } from '@prisma/client';

const PAGE_SIZE = 20;

export interface GetPostsParams {
  cursor?: string;
  category?: Category;
  sort: 'latest' | 'popular';
  userId?: string;
}

export interface PostListItem {
  id: string;
  title: string;
  content: string;
  category: Category;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  createdAt: Date;
  isLiked: boolean;
}

export interface PostDetail extends PostListItem {}

function calculatePopularScore(likeCount: number, createdAt: Date): number {
  const hoursAge = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  return likeCount / Math.pow(hoursAge + 2, 1.5);
}

export async function getPosts(
  params: GetPostsParams,
): Promise<{ posts: PostListItem[]; nextCursor: string | null }> {
  const { cursor, category, sort, userId } = params;

  const where: any = {
    isDeleted: false,
    isHidden: false,
    ...(category ? { category } : {}),
  };

  if (sort === 'popular') {
    // For popular sort, fetch all eligible posts and sort by score in memory.
    // Cursor for popular sort uses offset-based pagination (page number encoded as cursor).
    const page = cursor ? parseInt(cursor, 10) : 0;
    const skip = page * PAGE_SIZE;

    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        likeCount: true,
        commentCount: true,
        viewCount: true,
        createdAt: true,
      },
    });

    const scored = posts
      .map((p) => ({
        ...p,
        _score: calculatePopularScore(p.likeCount, p.createdAt),
      }))
      .sort((a, b) => b._score - a._score);

    const sliced = scored.slice(skip, skip + PAGE_SIZE + 1);
    const hasMore = sliced.length > PAGE_SIZE;
    const result = sliced.slice(0, PAGE_SIZE);

    let likedPostIds = new Set<string>();
    if (userId && result.length > 0) {
      const likes = await prisma.like.findMany({
        where: {
          userId,
          targetType: 'POST',
          targetId: { in: result.map((p) => p.id) },
        },
        select: { targetId: true },
      });
      likedPostIds = new Set(likes.map((l) => l.targetId));
    }

    return {
      posts: result.map(({ _score, ...p }) => ({
        ...p,
        isLiked: likedPostIds.has(p.id),
      })),
      nextCursor: hasMore ? String(page + 1) : null,
    };
  }

  // Latest sort: cursor-based pagination using createdAt
  if (cursor) {
    where.createdAt = {
      lt: (
        await prisma.post.findUniqueOrThrow({
          where: { id: cursor },
          select: { createdAt: true },
        })
      ).createdAt,
    };
  }

  const posts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: PAGE_SIZE + 1,
    select: {
      id: true,
      title: true,
      content: true,
      category: true,
      likeCount: true,
      commentCount: true,
      viewCount: true,
      createdAt: true,
    },
  });

  let likedPostIds = new Set<string>();
  if (userId && posts.length > 0) {
    const likes = await prisma.like.findMany({
      where: {
        userId,
        targetType: 'POST',
        targetId: { in: posts.map((p) => p.id) },
      },
      select: { targetId: true },
    });
    likedPostIds = new Set(likes.map((l) => l.targetId));
  }

  const hasMore = posts.length > PAGE_SIZE;
  const result = posts.slice(0, PAGE_SIZE);

  return {
    posts: result.map((p) => ({
      ...p,
      isLiked: likedPostIds.has(p.id),
    })),
    nextCursor: hasMore ? result[result.length - 1].id : null,
  };
}

export async function getPost(
  id: string,
  userId?: string,
): Promise<PostDetail | null> {
  const post = await prisma.post.findFirst({
    where: { id, isDeleted: false, isHidden: false },
    select: {
      id: true,
      title: true,
      content: true,
      category: true,
      likeCount: true,
      commentCount: true,
      viewCount: true,
      createdAt: true,
    },
  });

  if (!post) return null;

  // Increment view count (fire-and-forget)
  await prisma.post.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });

  let isLiked = false;
  if (userId) {
    const like = await prisma.like.findUnique({
      where: {
        userId_targetType_targetId: {
          userId,
          targetType: 'POST',
          targetId: id,
        },
      },
    });
    isLiked = !!like;
  }

  return {
    ...post,
    viewCount: post.viewCount + 1,
    isLiked,
  };
}

export async function createPost(
  authorId: string,
  data: { title: string; content: string; category: Category },
): Promise<PostDetail> {
  const post = await prisma.post.create({
    data: {
      authorId,
      title: data.title,
      content: data.content,
      category: data.category,
    },
    select: {
      id: true,
      title: true,
      content: true,
      category: true,
      likeCount: true,
      commentCount: true,
      viewCount: true,
      createdAt: true,
    },
  });

  return { ...post, isLiked: false };
}

export async function deletePost(
  postId: string,
  userId: string,
  userRole: string,
): Promise<{ success: boolean; error?: string }> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true, isDeleted: true },
  });

  if (!post) {
    return { success: false, error: '게시글을 찾을 수 없습니다.' };
  }

  if (post.isDeleted) {
    return { success: false, error: '이미 삭제된 게시글입니다.' };
  }

  if (post.authorId !== userId && userRole !== 'ADMIN') {
    return { success: false, error: '삭제 권한이 없습니다.' };
  }

  await prisma.post.update({
    where: { id: postId },
    data: { isDeleted: true },
  });

  return { success: true };
}
