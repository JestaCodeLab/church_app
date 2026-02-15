import React from 'react';
import { PostStatus, POST_STATUS_INFO } from '../../types/socialMedia';

interface PostStatusBadgeProps {
  status: PostStatus;
  size?: 'sm' | 'md';
}

const PostStatusBadge: React.FC<PostStatusBadgeProps> = ({ status, size = 'sm' }) => {
  const info = POST_STATUS_INFO[status] || POST_STATUS_INFO.draft;

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${info.bgColor} ${info.color} ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      }`}
    >
      {info.label}
    </span>
  );
};

export default PostStatusBadge;
