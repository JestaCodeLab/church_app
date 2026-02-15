import React from 'react';
import { ThumbsUp, MessageCircle, Share2, Globe } from 'lucide-react';

interface FacebookPreviewProps {
  content: string;
  mediaUrls: string[];
  pageName: string;
  pageImage?: string;
}

const FacebookPreview: React.FC<FacebookPreviewProps> = ({
  content,
  mediaUrls,
  pageName,
  pageImage
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden max-w-md">
      {/* Header */}
      <div className="flex items-center gap-3 p-3">
        {pageImage ? (
          <img src={pageImage} alt={pageName} className="w-10 h-10 rounded-full" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <span className="text-sm font-bold text-blue-600">f</span>
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {pageName || 'Your Page'}
          </p>
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <span>Just now</span>
            <span>·</span>
            <Globe className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Content */}
      {content && (
        <div className="px-3 pb-2">
          <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
            {content}
          </p>
        </div>
      )}

      {/* Media */}
      {mediaUrls.length > 0 && (
        <div className="relative">
          {mediaUrls.length === 1 ? (
            <img
              src={mediaUrls[0]}
              alt=""
              className="w-full aspect-video object-cover"
            />
          ) : (
            <div className="grid grid-cols-2 gap-0.5">
              {mediaUrls.slice(0, 4).map((url, i) => (
                <div key={i} className="relative">
                  <img
                    src={url}
                    alt=""
                    className="w-full aspect-square object-cover"
                  />
                  {i === 3 && mediaUrls.length > 4 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-xl font-bold">
                        +{mediaUrls.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Engagement bar */}
      <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
          <span>0 likes</span>
          <span>0 comments · 0 shares</span>
        </div>
        <div className="flex items-center border-t border-gray-200 dark:border-gray-700 pt-1">
          {[
            { icon: ThumbsUp, label: 'Like' },
            { icon: MessageCircle, label: 'Comment' },
            { icon: Share2, label: 'Share' },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-gray-500 dark:text-gray-400 text-sm"
            >
              <Icon className="w-4 h-4" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FacebookPreview;
