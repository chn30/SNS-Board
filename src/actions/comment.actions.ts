'use server';

import { requireAuth } from '@/lib/auth-utils';
import {
  getCommentsSchema,
  createCommentSchema,
  deleteCommentSchema,
} from '@/lib/validations/comment';
import * as commentService from '@/lib/services/comment.service';

function stripComment(comment: commentService.CommentItem) {
  return {
    id: comment.id,
    postId: comment.postId,
    content: comment.content,
    likeCount: comment.likeCount,
    createdAt: comment.createdAt,
    isLiked: comment.isLiked,
    isOwner: comment.isOwner,
  };
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
