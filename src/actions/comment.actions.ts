'use server';

import { requireAuth } from '@/lib/auth-utils';
import {
  getCommentsSchema,
  createCommentSchema,
  deleteCommentSchema,
} from '@/lib/validations/comment';
import * as commentService from '@/lib/services/comment.service';

function stripComment(comment: commentService.CommentItem): any {
  const base = {
    id: comment.id,
    postId: comment.postId,
    parentId: comment.parentId,
    content: comment.content,
    likeCount: comment.likeCount,
    createdAt: comment.createdAt,
    isLiked: comment.isLiked,
    isOwner: comment.isOwner,
    isAdmin: comment.isAdmin,
    isPostAuthor: comment.isPostAuthor,
  };
  if (comment.replies && comment.replies.length > 0) {
    return { ...base, replies: comment.replies.map(stripComment) };
  }
  return { ...base, replies: [] };
}

export async function getComments(input: unknown) {
  const user = await requireAuth();
  const parsed = getCommentsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: '잘못된 요청입니다.' };
  }

  const result = await commentService.getComments(
    parsed.data.postId,
    parsed.data.cursor,
    user.id,
    user.role,
  );

  return {
    comments: result.comments.map(stripComment),
    nextCursor: result.nextCursor,
  };
}

export async function createComment(input: unknown) {
  const user = await requireAuth();
  const parsed = createCommentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: '잘못된 요청입니다.',
      validationErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const comment = await commentService.createComment(
    user.id,
    parsed.data.postId,
    parsed.data.content,
    parsed.data.parentId,
  );
  return { comment: stripComment(comment) };
}

export async function deleteComment(input: unknown) {
  const user = await requireAuth();
  const parsed = deleteCommentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: '잘못된 요청입니다.' };
  }

  const result = await commentService.deleteComment(
    parsed.data.commentId,
    user.id,
    user.role,
  );
  return { success: result.success, error: result.error };
}
