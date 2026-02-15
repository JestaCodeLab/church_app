import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, PenSquare, Construction } from 'lucide-react';

const SocialAnalytics: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Social Media Analytics
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track engagement, growth, and performance across your accounts
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
        <Construction className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Coming Soon
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
          Engagement charts, best posting times heatmap, follower growth tracking, and AI-powered insights will be available here. Start publishing posts to collect analytics data.
        </p>
        <button
          onClick={() => navigate('/social-media/create')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          <PenSquare className="w-4 h-4" />
          Create a Post
        </button>
      </div>
    </div>
  );
};

export default SocialAnalytics;
