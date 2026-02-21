import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Download, 
  Filter, 
  Search, 
  ChevronDown,
  Loader
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import PermissionGuard from '../../components/guards/PermissionGuard';
import { PermissionRoute } from '../../components/guards/PermissionRoute';

interface ActivityLog {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  action: string;
  resourceType: string;
  resourceId: string;
  description: string;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

const ActivityLogs = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);

  // Filters
  const [filterAction, setFilterAction] = useState('all');
  const [filterResourceType, setFilterResourceType] = useState('all');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');

  // Available options for filters
  const [availableActions, setAvailableActions] = useState<string[]>([]);
  const [availableResourceTypes, setAvailableResourceTypes] = useState<string[]>([]);

  useEffect(() => {
    loadActivityLogs();
  }, [page, limit, filterAction, filterResourceType, dateFromFilter, dateToFilter]);

  const loadActivityLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/activity-logs', {
        params: {
          page,
          limit,
          action: filterAction === 'all' ? undefined : filterAction,
          resourceType: filterResourceType === 'all' ? undefined : filterResourceType,
          startDate: dateFromFilter || undefined,
          endDate: dateToFilter || undefined
        }
      });

      if (res.data.success) {
        // Backend returns data: { logs, pagination }
        const logsData = Array.isArray(res.data.data?.logs) ? res.data.data.logs : [];
        setLogs(logsData);
        setTotalPages(res.data.data?.pagination?.pages || 1);
        setTotalDocs(res.data.data?.pagination?.total || 0);
        
        // Extract unique actions and resource types from logs
        const actions = new Set<string>();
        const resourceTypes = new Set<string>();
        logsData.forEach(log => {
          if (log.action) actions.add(log.action);
          if (log.resourceType) resourceTypes.add(log.resourceType);
        });
        setAvailableActions(Array.from(actions).sort());
        setAvailableResourceTypes(Array.from(resourceTypes).sort());
      }
    } catch (error: any) {
      console.error('Failed to load activity logs:', error);
      toast.error(error?.response?.data?.message || 'Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFilterAction('all');
    setFilterResourceType('all');
    setDateFromFilter('');
    setDateToFilter('');
    setPage(1);
  };

  const getActionBadgeColor = (action: string) => {
    const baseAction = action.split('.')[0].toLowerCase();
    
    switch (baseAction) {
      case 'withdrawal':
        return 'bg-purple-100 text-primary-700 dark:bg-purple-900/30 dark:text-primary-400';
      case 'donation':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'member':
        return 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400';
      case 'event':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'user':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'payment':
        return 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const getResourceTypeBadgeColor = (resourceType: string) => {
    switch (resourceType.toLowerCase()) {
      case 'withdrawal':
        return 'bg-purple-50 text-primary-700 dark:bg-purple-900/20 dark:text-primary-300 border border-purple-200 dark:border-purple-800';
      case 'donation':
        return 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 border border-green-200 dark:border-green-800';
      case 'member':
        return 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-blue-300 border border-primary-200 dark:border-primary-800';
      case 'event':
        return 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800';
      case 'user':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800';
      case 'payment':
        return 'bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-300 border border-pink-200 dark:border-pink-800';
      default:
        return 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <PermissionRoute permission="settings.viewActivityLogs" redirectTo='/settings'>
    <div className="min-h-screen dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-8xl mx-auto px-4 sm:px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <Activity className="text-primary-600 dark:text-primary-400" size={24} />
              </div>
              <div>
                <h1 className="text-xl sm:text-xl font-bold text-slate-900 dark:text-white">
                  Activity Logs
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Track all actions and changes in your account
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-8xl mx-auto px-2 sm:px-2 py-6 sm:py-4">
        {/* Filters Section */}
        <div className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 mb-6">
          {/* <div className="flex items-center gap-2 mb-4">
            <Filter size={18} className="text-slate-600 dark:text-slate-400" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Filters</h2>
          </div> */}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Action Filter */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Action
              </label>
              <select
                value={filterAction}
                onChange={(e) => {
                  setFilterAction(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Actions</option>
                {availableActions.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>

            {/* Resource Type Filter */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Resource Type
              </label>
              <select
                value={filterResourceType}
                onChange={(e) => {
                  setFilterResourceType(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                {availableResourceTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Date From Filter */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={dateFromFilter}
                onChange={(e) => {
                  setDateFromFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Date To Filter */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={dateToFilter}
                onChange={(e) => {
                  setDateToFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Reset Button */}
            <div className="flex items-end">
              <button
                onClick={handleResetFilters}
                className="w-full px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-300 dark:border-slate-600"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Loading activity logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <Activity size={32} className="mx-auto mb-2 text-slate-400 dark:text-slate-600" />
              <p className="text-slate-600 dark:text-slate-400 font-medium">No activity logs found</p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                      <th className="text-left px-4 sm:px-6 py-3 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">DATE & TIME</th>
                      <th className="text-left px-4 sm:px-6 py-3 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">USER</th>
                      <th className="text-left px-4 sm:px-6 py-3 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">ACTION</th>
                      <th className="text-left px-4 sm:px-6 py-3 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">RESOURCE</th>
                      <th className="text-left px-4 sm:px-6 py-3 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">DESCRIPTION</th>
                      <th className="text-left px-4 sm:px-6 py-3 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">IP ADDRESS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr
                        key={log._id}
                        className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors last:border-b-0"
                      >
                        <td className="px-4 sm:px-6 py-3 text-xs sm:text-sm">
                          <div className="text-slate-900 dark:text-white font-medium">
                            {new Date(log.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">
                            {new Date(log.createdAt).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: true
                            })}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-xs sm:text-sm">
                          <div className="text-slate-900 dark:text-white font-medium">
                            {log.userId?.firstName} {log.userId?.lastName}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 truncate">
                            {log.userId?.email}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-xs sm:text-sm">
                          <span className={`inline-block px-2 py-1 rounded-full font-bold text-xs ${getActionBadgeColor(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-xs sm:text-sm">
                          <span className={`inline-block px-2 py-1 rounded-full font-bold text-xs ${getResourceTypeBadgeColor(log.resourceType)}`}>
                            {log.resourceType}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 max-w-xs truncate" title={log.description}>
                          {log.description}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-xs sm:text-sm font-mono text-slate-600 dark:text-slate-400">
                          {log.metadata?.ipAddress || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="border-t border-slate-200 dark:border-slate-700 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Showing <span className="font-semibold">{(page - 1) * limit + 1}</span> to{' '}
                    <span className="font-semibold">
                      {Math.min(page * limit, totalDocs)}
                    </span>{' '}
                    of <span className="font-semibold">{totalDocs}</span> logs
                  </p>

                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* Limit Selector */}
                    <select
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setPage(1);
                      }}
                      className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value={5}>5 per page</option>
                      <option value={10}>10 per page</option>
                      <option value={25}>25 per page</option>
                      <option value={50}>50 per page</option>
                    </select>

                    {/* Page Navigation */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1 || loading}
                        className="px-3 sm:px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors"
                      >
                        Previous
                      </button>
                      <div className="flex items-center gap-2 px-2">
                        <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                          Page <span className="font-semibold">{page}</span> of{' '}
                          <span className="font-semibold">{totalPages}</span>
                        </span>
                      </div>
                      <button
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages || loading}
                        className="px-3 sm:px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
    </PermissionRoute>
  );
};

export default ActivityLogs;
