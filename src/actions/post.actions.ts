'use server';

import { requireAuth } from '@/lib/auth-utils';
import {
  getPostsSchema,
  getPostSchema,
  createPostSchema,
  deletePostSchema,
} from '@/lib/validations/post';
import * as postService from '@/lib/services/post.service';

function stripPost(post: postService.PostListItem | postService.PostDetail) {
  const base = {
    id: post.id,
    title: post.title,
    content: post.content,
    category: post.category,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    viewCount: post.viewCount,
    createdAt: post.createdAt,
    isLiked: post.isLiked,
  };
  if ('isOwner' in post) {
    return { ...base, isOwner: post.isOwner };
  }
  return base;
}

export async function getPosts(input: unknown) {
  const user = await requireAuth();
  const parsed = getPostsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: '잘못된 요청입니다.',
      validationErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const result = await postService.getPosts({
    ...parsed.data,
    userId: user.id,
  });

  return {
    posts: result.posts.map(stripPost),
    nextCursor: result.nextCursor,
  };
}

export async function getPost(input: unknown) {
  const user = await requireAuth();
  const parsed = getPostSchema.safeParse(input);
  if (!parsed.success) {
    return { error: '잘못된 요청입니다.' };
  }

  const post = await postService.getPost(parsed.data.postId, user.id);
  if (!post) {
    return { error: '게시글을 찾을 수 없습니다.' };
  }

  return { post: stripPost(post) };
}

export async function createPost(input: unknown) {
  const user = await requireAuth();
  const parsed = createPostSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: '잘못된 요청입니다.',
      validationErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const post = await postService.createPost(user.id, parsed.data);
    return { post: stripPost(post) };
  } catch {
    return { error: '게시글 작성에 실패했습니다. 다시 시도해주세요.' };
  }
}

export async function deletePost(input: unknown) {
  const user = await requireAuth();
  const parsed = deletePostSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: '잘못된 요청입니다.' };
  }

  const result = await postService.deletePost(
    parsed.data.postId,
    user.id,
    user.role,
  );
  return { success: result.success, error: result.error };
}
