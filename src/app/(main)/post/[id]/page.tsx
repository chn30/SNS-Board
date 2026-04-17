import { notFound } from 'next/navigation';
import { getPost } from '@/actions/post.actions';
import PostDetailClient from './PostDetailClient';

interface PostDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { id } = await params;
  const result = await getPost({ postId: id });

  if ('error' in result || !('post' in result)) {
    notFound();
  }

  const post = result.post as {
    id: string;
    title: string;
    content: string;
    category: string;
    likeCount: number;
    commentCount: number;
    viewCount: number;
    createdAt: string | Date;
    isLiked: boolean;
    isOwner?: boolean;
  };

  return <PostDetailClient post={post} />;
}
