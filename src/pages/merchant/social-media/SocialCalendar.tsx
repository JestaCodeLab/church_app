import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  PenSquare,
  Loader2
} from 'lucide-react';
import { socialMediaAPI } from '../../../services/api';
import { SocialPost, POST_STATUS_INFO, PLATFORM_INFO } from '../../../types/socialMedia';
import PostStatusBadge from '../../../components/social-media/PostStatusBadge';
import toast from 'react-hot-toast';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SocialCalendar: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    fetchPosts();
  }, [month, year]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);

      const response = await socialMediaAPI.getPosts({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 200
      });
      setPosts(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return days;
  }, [year, month]);

  const getPostsForDay = (day: number) => {
    return posts.filter(post => {
      const postDate = post.scheduledAt
        ? new Date(post.scheduledAt)
        : new Date(post.createdAt);
      return postDate.getDate() === day &&
        postDate.getMonth() === month &&
        postDate.getFullYear() === year;
    });
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = new Date();
  const isToday = (day: number) =>
    today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Content Calendar
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View and manage your scheduled and published posts
          </p>
        </div>
        <button
          onClick={() => navigate('/social-media/create')}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          <PenSquare className="w-4 h-4" />
          Create Post
        </button>
      </div>

      {/* Calendar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Month Navigation */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {DAYS.map(day => (
            <div key={day} className="py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => {
              const dayPosts = day ? getPostsForDay(day) : [];
              return (
                <div
                  key={i}
                  className={`min-h-[100px] p-2 border-b border-r border-gray-100 dark:border-gray-700 ${
                    !day ? 'bg-gray-50 dark:bg-gray-800/50' : ''
                  }`}
                >
                  {day && (
                    <>
                      <span className={`text-sm ${
                        isToday(day)
                          ? 'w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {day}
                      </span>
                      <div className="mt-1 space-y-1">
                        {dayPosts.slice(0, 3).map(post => (
                          <button
                            key={post._id}
                            onClick={() => navigate(`/social-media/posts/${post._id}`)}
                            className={`w-full text-left px-1.5 py-0.5 rounded text-xs truncate ${
                              POST_STATUS_INFO[post.status]?.bgColor || 'bg-gray-100'
                            } ${POST_STATUS_INFO[post.status]?.color || 'text-gray-600'} hover:opacity-80 transition-opacity`}
                          >
                            {post.content?.slice(0, 30) || 'No content'}
                          </button>
                        ))}
                        {dayPosts.length > 3 && (
                          <span className="text-xs text-gray-400">
                            +{dayPosts.length - 3} more
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialCalendar;
