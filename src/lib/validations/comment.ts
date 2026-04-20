import { z } from 'zod';

export const getCommentsSchema = z.object({
  postId: z.string().uuid(),
  cursor: z.string().uuid().optional(),
});

export const createCommentSchema = z.object({
  postId: z.string().uuid(),
  content: z.string().min(1).max(2000),
  parentId: z.string().uuid().optional(),
});

export const deleteCommentSchema = z.object({
  commentId: z.string().uuid(),
});

export type GetCommentsInput = z.infer<typeof getCommentsSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type DeleteCommentInput = z.infer<typeof deleteCommentSchema>;
