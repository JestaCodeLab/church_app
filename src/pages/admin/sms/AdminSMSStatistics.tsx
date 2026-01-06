import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';

interface Stats {
  totalCreditsIssued: number;
  totalCreditsUsed: number;
  totalMessagesSent: number;
  totalRevenue: number;
  topChurches: Array<{
    name: string;
    creditsUsed: number;
    messagesSent: number;
  }>;
}

const SMSStatistics: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30); // days

  useEffect(() => {
    fetchStats(timeRange);
  }, [timeRange]);

  const fetchStats = async (period: number) => {
  try {
    setLoading(true);
    const response = await api.get(`/sms/admin/sms-statistics?days=${period}`);
    setStats(response.data.data);
  } catch (error: any) {
    toast.error('Failed to load statistics');
    console.error(error);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            SMS Statistics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Platform-wide messaging analytics
          </p>
        </div>
        
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(+e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : stats ? (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Credits Issued</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.totalCreditsIssued || 0}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Credits Used</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.totalCreditsUsed || 0}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Messages Sent</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.totalMessagesSent || 0}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                GHS {stats.totalRevenue || 0}
              </p>
            </div>
          </div>

          {/* Top Churches */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Top Churches by SMS Usage
              </h2>
            </div>
            <div className="p-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Church</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Credits Used</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Messages</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topChurches.map((church, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3 text-sm text-gray-900 dark:text-white">{church.name}</td>
                      <td className="py-3 text-sm text-right text-gray-900 dark:text-white">
                        {church.creditsUsed || 0}
                      </td>
                      <td className="py-3 text-sm text-right text-gray-900 dark:text-white">
                        {church.messagesSent || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default SMSStatistics;
