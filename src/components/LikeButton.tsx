'use client';

import { useState, useTransition } from 'react';
import { toggleLike } from '@/actions/like.actions';

interface LikeButtonProps {
  targetType: 'POST' | 'COMMENT';
  targetId: string;
  initialLiked: boolean;
  initialCount: number;
}

export default function LikeButton({
  targetType,
  targetId,
  initialLiked,
  initialCount,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic update
    const prevLiked = liked;
    const prevCount = count;
    setLiked(!liked);
    setCount(liked ? count - 1 : count + 1);

    startTransition(async () => {
      const result = await toggleLike({ targetType, targetId });
      if ('error' in result) {
        // Revert on error
        setLiked(prevLiked);
        setCount(prevCount);
      } else {
        setLiked(result.liked as boolean);
        setCount(result.likeCount as number);
      }
    });
  }

  return (
    <button
      data-testid="like-button"
      onClick={handleClick}
      disabled={isPending}
      className={`flex items-center gap-1 transition-all duration-200 ${
        liked
          ? 'text-pink-400 drop-shadow-[0_0_6px_rgba(236,72,153,0.5)]'
          : 'text-text-muted hover:text-accent'
      }`}
    >
      {liked ? '❤️' : '🤍'} {count}
    </button>
  );
}
