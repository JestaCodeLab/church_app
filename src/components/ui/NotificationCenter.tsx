import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Bell, X, Check, Trash2, CheckCheck, BellOff, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import notificationApi from '../../services/notificationApi';
import toast from 'react-hot-toast';

interface Notification {
  _id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: string;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  actionText?: string;
  createdAt: string;
  readAt?: string;
}

const TYPE_STYLES: Record<string, { dot: string; bg: string }> = {
  success: { dot: 'bg-green-500',  bg: 'bg-green-50 dark:bg-green-900/20' },
  warning: { dot: 'bg-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  error:   { dot: 'bg-red-500',    bg: 'bg-red-50 dark:bg-red-900/20' },
  info:    { dot: 'bg-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/10' },
};

const formatTime = (dateString: string) => {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString();
};

const SWR_OPTIONS = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

const NotificationCenter: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  // ── Unread count ──────────────────────────────────────────────────────────
  // Global SWR cache — deduplicated across mounts, polls every 30s.
  const { data: unreadCount = 0, mutate: mutateUnread } = useSWR(
    '/notifications/unread-count',
    () => notificationApi.getUnreadCount().then(r => r.data?.count ?? 0),
    { ...SWR_OPTIONS, refreshInterval: 30000 }
  );

  // ── Notifications list ────────────────────────────────────────────────────
  // Fixed key — fetches once on mount, then only when mutate() is called.
  // revalidateIfStale: false means SWR won't refetch just because the drawer
  // opens/closes; opening the bell multiple times hits the cache every time.
  const { data: notifications = [], isLoading: loading, mutate: mutateNotifications } = useSWR<Notification[]>(
    '/notifications',
    () => notificationApi.getNotifications(1, 20).then(r => r.data.notifications),
    { ...SWR_OPTIONS, revalidateIfStale: false }
  );

  const openDrawer = () => {
    setIsOpen(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
  };

  const closeDrawer = () => {
    setVisible(false);
    setTimeout(() => setIsOpen(false), 300);
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      mutateNotifications(prev => prev?.map(n => n._id === id ? { ...n, isRead: true } : n), false);
      mutateUnread(prev => Math.max(0, (prev ?? 0) - 1), false);
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      mutateNotifications(prev => prev?.map(n => ({ ...n, isRead: true })), false);
      mutateUnread(0, false);
      toast.success('All marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const target = notifications.find(n => n._id === id);
      await notificationApi.deleteNotification(id);
      mutateNotifications(prev => prev?.filter(n => n._id !== id), false);
      if (target && !target.isRead) {
        mutateUnread(prev => Math.max(0, (prev ?? 0) - 1), false);
      }
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  const handleActionClick = (url: string) => {
    closeDrawer();
    setTimeout(() => navigate(url), 50);
  };

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* Bell trigger */}
      <button
        onClick={openDrawer}
        className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Open notifications"
        style={{ marginRight: '10px' }}
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-800">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Drawer */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={closeDrawer}
            className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
          />

          {/* Panel */}
          <div
            className={`fixed top-0 right-0 h-full w-[420px] max-w-[calc(100vw-2rem)] z-50 bg-white dark:bg-gray-800 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
              visible ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <Bell className="w-5 h-5 text-primary-600" />
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 text-xs font-bold text-white bg-red-500 rounded-full">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={closeDrawer}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Close notifications"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3 text-gray-400">
                  <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400 px-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <BellOff className="w-7 h-7 opacity-50" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">All caught up</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">No notifications yet</p>
                  </div>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                  {notifications.map(n => {
                    const style = TYPE_STYLES[n.type] || TYPE_STYLES.info;
                    return (
                      <li
                        key={n._id}
                        className={`px-5 py-4 transition-colors ${
                          !n.isRead ? style.bg : 'hover:bg-gray-50 dark:hover:bg-gray-700/40'
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 mt-1.5">
                            <span className={`block w-2 h-2 rounded-full ${n.isRead ? 'bg-gray-300 dark:bg-gray-600' : style.dot}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-0.5">
                              <p className={`text-sm font-semibold leading-snug ${
                                !n.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'
                              }`}>
                                {n.title}
                              </p>
                              <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0 mt-0.5">
                                {formatTime(n.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{n.message}</p>
                            <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                              {n.actionUrl && (
                                <button
                                  onClick={() => handleActionClick(n.actionUrl!)}
                                  className="flex items-center gap-1 text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  {n.actionText || 'View Details'}
                                </button>
                              )}
                              {!n.isRead && (
                                <button
                                  onClick={() => markAsRead(n._id)}
                                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                >
                                  <Check className="w-3 h-3" />
                                  Mark read
                                </button>
                              )}
                              <button
                                onClick={() => deleteNotification(n._id)}
                                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors ml-auto"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="flex-shrink-0 px-5 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
                <button
                  onClick={() => handleActionClick('/notifications')}
                  className="w-full text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors text-center"
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default NotificationCenter;
