import { z } from 'zod';

export const getPostsSchema = z.object({
  cursor: z.string().min(1).optional(),
  category: z.enum(['FREE', 'QUESTION', 'INFO']).optional(),
  sort: z.enum(['latest', 'popular']).default('latest'),
});

export const getPostSchema = z.object({
  postId: z.string().uuid(),
});

export const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
  category: z.enum(['FREE', 'QUESTION', 'INFO']),
});

export const deletePostSchema = z.object({
  postId: z.string().uuid(),
});

export type GetPostsInput = z.infer<typeof getPostsSchema>;
export type GetPostInput = z.infer<typeof getPostSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type DeletePostInput = z.infer<typeof deletePostSchema>;
