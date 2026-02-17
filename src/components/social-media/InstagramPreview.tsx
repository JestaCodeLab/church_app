import React from 'react';
import { Heart, MessageCircle, Send, Bookmark } from 'lucide-react';

interface InstagramPreviewProps {
  content: string;
  mediaUrls: string[];
  username: string;
  profileImage?: string;
}

const InstagramPreview: React.FC<InstagramPreviewProps> = ({
  content,
  mediaUrls,
  username,
  profileImage
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden max-w-md">
      {/* Header */}
      <div className="flex items-center gap-3 p-3">
        {profileImage ? (
          <div className="w-8 h-8 rounded-full ring-2 ring-pink-500 ring-offset-1 ring-offset-white dark:ring-offset-gray-800 overflow-hidden">
            <img src={profileImage} alt={username} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center ring-2 ring-pink-500 ring-offset-1 ring-offset-white dark:ring-offset-gray-800">
            <span className="text-xs font-bold text-white">IG</span>
          </div>
        )}
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {username || 'your_page'}
        </p>
      </div>

      {/* Media */}
      {mediaUrls.length > 0 ? (
        <div className="relative">
          <img
            src={mediaUrls[0]}
            alt=""
            className="w-full aspect-square object-cover"
          />
          {mediaUrls.length > 1 && (
            <div className="absolute top-3 right-3 bg-gray-900/70 text-white text-xs px-2 py-1 rounded-full">
              1/{mediaUrls.length}
            </div>
          )}
        </div>
      ) : (
        <div className="w-full aspect-square bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <p className="text-gray-400 dark:text-gray-500 text-sm">No image</p>
        </div>
      )}

      {/* Action icons */}
      <div className="px-3 pt-3 pb-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <Heart className="w-6 h-6 text-gray-900 dark:text-gray-100" />
            <MessageCircle className="w-6 h-6 text-gray-900 dark:text-gray-100" />
            <Send className="w-6 h-6 text-gray-900 dark:text-gray-100" />
          </div>
          <Bookmark className="w-6 h-6 text-gray-900 dark:text-gray-100" />
        </div>

        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
          0 likes
        </p>

        {/* Caption */}
        {content && (
          <p className="text-sm text-gray-900 dark:text-gray-100">
            <span className="font-semibold mr-1">{username || 'your_page'}</span>
            <span className="whitespace-pre-wrap">{content.length > 125 ? content.slice(0, 125) + '... more' : content}</span>
          </p>
        )}

        <p className="text-xs text-gray-400 mt-1 uppercase">Just now</p>
      </div>
    </div>
  );
};

export default InstagramPreview;
