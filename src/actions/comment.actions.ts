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
  };
}

export async function getComments(input: unknown) {
  const user = await requireAuth();
  const { postId, cursor } = getCommentsSchema.parse(input);

  const result = await commentService.getComments(postId, cursor, user.id);

  return {
    comments: result.comments.map(stripComment),
    nextCursor: result.nextCursor,
  };
}

export async function createComment(input: unknown) {
  const user = await requireAuth();
  const { postId, content } = createCommentSchema.parse(input);

  const comment = await commentService.createComment(user.id, postId, content);
  return { comment: stripComment(comment) };
}

export async function deleteComment(input: unknown) {
  const user = await requireAuth();
  const { commentId } = deleteCommentSchema.parse(input);

  return commentService.deleteComment(commentId, user.id, user.role);
}
