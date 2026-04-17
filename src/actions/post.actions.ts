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
  return {
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
}

export async function getPosts(input: unknown) {
  const user = await requireAuth();
  const parsed = getPostsSchema.parse(input);

  const result = await postService.getPosts({
    ...parsed,
    userId: user.id,
  });

  return {
    posts: result.posts.map(stripPost),
    nextCursor: result.nextCursor,
  };
}

export async function getPost(input: unknown) {
  const user = await requireAuth();
  const { postId } = getPostSchema.parse(input);

  const post = await postService.getPost(postId, user.id);
  if (!post) {
    return { error: '게시글을 찾을 수 없습니다.' };
  }

  return { post: stripPost(post) };
}

export async function createPost(input: unknown) {
  const user = await requireAuth();
  const data = createPostSchema.parse(input);

  const post = await postService.createPost(user.id, data);
  return { post: stripPost(post) };
}

export async function deletePost(input: unknown) {
  const user = await requireAuth();
  const { postId } = deletePostSchema.parse(input);

  return postService.deletePost(postId, user.id, user.role);
}
