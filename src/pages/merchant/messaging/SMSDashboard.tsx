import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { messagingAPI } from '../../../services/api';
import { Link } from 'react-router-dom';
import { showToast } from '../../../utils/toasts';
import { checkFeatureAccess } from '../../../utils/featureAccess';
import { ChartArea, CheckCircle, ClipboardClock, CreditCard, FilePen, FilePenLine, Mail, Users, RefreshCcw, TrendingUp } from 'lucide-react';
import FeatureGate from '../../../components/access/FeatureGate';
import PermissionGuard from '../../../components/guards/PermissionGuard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SMSStats {
  totalSent: number;
  totalFailed: number;
  totalRecipients: number;
  totalCreditsUsed: number;
  successRate: string;
  byCategory: Array<{ _id: string; count: number }>;
}

interface Credits {
  balance: number;
  planCredits: number;
  purchasedCredits: number;
  totalAdded: number;
  totalUsed: number;
  lastPurchase?: {
    amount: number;
    date: string;
  };
}

const SMSDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<SMSStats | null>(null);
  const [credits, setCredits] = useState<Credits | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(false);
  const [hasSMSAccess, setHasSMSAccess] = useState<boolean | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [dateFilter, setDateFilter] = useState<'this-week' | 'last-week' | 'this-month' | 'last-month' | 'custom'>('this-week');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [tempStartDate, setTempStartDate] = useState<string>('');
  const [tempEndDate, setTempEndDate] = useState<string>('');
  const [recentSMS, setRecentSMS] = useState<any[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);

  useEffect(() => {
    checkSMSAccess();
    fetchDashboardData();
    fetchRecentSMS();
    fetchTimeSeriesData();
  }, [dateFilter]);

  const handleCustomDateSearch = async () => {
    if (tempStartDate && tempEndDate) {
      if (new Date(tempStartDate) > new Date(tempEndDate)) {
        showToast.error('Start date must be before end date');
        return;
      }
      setCustomStartDate(tempStartDate);
      setCustomEndDate(tempEndDate);

      // Fetch data immediately without waiting for state update
      try {
        setLoading(true);
        const [statsRes, creditsRes] = await Promise.all([
          messagingAPI.sms.getStatistics({
            startDate: tempStartDate,
            endDate: tempEndDate
          }),
          messagingAPI.credits.get()
        ]);
        setStats(statsRes.data.data);
        setCredits(creditsRes.data.data.credits);
      } catch (error: any) {
        showToast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }

      // Fetch recent SMS
      try {
        setRecentLoading(true);
        const response = await messagingAPI.sms.getLogs({
          limit: 10,
          page: 1,
          status: 'completed',
          startDate: tempStartDate,
          endDate: tempEndDate
        });
        setRecentSMS(response.data.data?.logs || []);
      } catch (error: any) {
        console.error('Failed to load recent SMS:', error);
        setRecentSMS([]);
      } finally {
        setRecentLoading(false);
      }

      // Fetch time series data
      try {
        setChartsLoading(true);
        const period = getChartPeriod();
        const response = await messagingAPI.sms.getTimeSeriesAnalytics({
          period,
          startDate: tempStartDate,
          endDate: tempEndDate
        });
        setChartData(response.data.data.chartData);
      } catch (error: any) {
        showToast.error('Failed to load analytics data');
        console.error('Analytics error:', error);
        setChartData([]);
      } finally {
        setChartsLoading(false);
      }
    } else {
      showToast.error('Please select both start and end dates');
    }
  };

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();

    switch(dateFilter) {
      case 'this-week':
        const dayOfWeek = end.getDay();
        start.setDate(end.getDate() - dayOfWeek);
        break;
      case 'last-week':
        const lastWeekEnd = new Date(end);
        lastWeekEnd.setDate(lastWeekEnd.getDate() - lastWeekEnd.getDay());
        const lastWeekStart = new Date(lastWeekEnd);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        return { startDate: lastWeekStart, endDate: lastWeekEnd };
      case 'this-month':
        start.setDate(1);
        break;
      case 'last-month':
        const lastMonthEnd = new Date(end.getFullYear(), end.getMonth(), 0);
        const lastMonthStart = new Date(end.getFullYear(), end.getMonth() - 1, 1);
        return { startDate: lastMonthStart, endDate: lastMonthEnd };
      case 'custom':
        if (customStartDate && customEndDate) {
          return { startDate: new Date(customStartDate), endDate: new Date(customEndDate) };
        }
        break;
    }

    return { startDate: start, endDate: end };
  };

  const getChartPeriod = (): 'daily' | 'weekly' | 'monthly' => {
    const { startDate, endDate } = getDateRange();
    const daysDifference = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Auto-select period based on date range
    if (daysDifference > 60) {
      return 'monthly'; // More than 2 months
    } else if (daysDifference > 14) {
      return 'weekly'; // More than 2 weeks
    }
    return 'daily'; // Less than 2 weeks
  };

  const checkSMSAccess = async () => {
    const hasAccess = await checkFeatureAccess('smsAnalytics', {
      showErrorToast: false
    });
    setHasSMSAccess(hasAccess);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange();

      const [statsRes, creditsRes] = await Promise.all([
        messagingAPI.sms.getStatistics({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }),
        messagingAPI.credits.get()
      ]);

      setStats(statsRes.data.data);
      setCredits(creditsRes.data.data.credits);
    } catch (error: any) {
      showToast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentSMS = async () => {
    try {
      setRecentLoading(true);
      const { startDate, endDate } = getDateRange();

      const response = await messagingAPI.sms.getLogs({
        limit: 10,
        page: 1,
        status: 'completed',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      setRecentSMS(response.data.data?.logs || []);
    } catch (error: any) {
      console.error('Failed to load recent SMS:', error);
      setRecentSMS([]);
    } finally {
      setRecentLoading(false);
    }
  };

  const fetchTimeSeriesData = async () => {
    try {
      setChartsLoading(true);

      // Get date range from the global filter
      const { startDate, endDate } = getDateRange();

      // Auto-determine the appropriate period based on date range
      const period = getChartPeriod();

      const response = await messagingAPI.sms.getTimeSeriesAnalytics({
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      setChartData(response.data.data.chartData);
    } catch (error: any) {
      showToast.error('Failed to load analytics data');
      console.error('Analytics error:', error);
      setChartData([]);
    } finally {
      setChartsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <FeatureGate feature={"smsAnalytics"} showUpgrade={!hasSMSAccess}>
      <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Analytics
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Overview of your SMS messaging performance
        </p>
      </div>

       {/* Credits Card */}
      {credits && (
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm mb-1">Available Credits</p>
              <p className="text-4xl font-bold">{credits.balance.toLocaleString()}</p>
              <p className="text-primary-100 text-sm mt-2">
                Plan: {credits.planCredits} | Purchased: {credits.purchasedCredits}
              </p>
            </div>
            <div className="text-right space-y-2">
              <div className="flex gap-2 justify-end">
                <Link
                  to="/messaging/send"
                  className="px-4 py-2 bg-white text-primary-600 rounded-lg hover:bg-primary-50 font-medium inline-block"
                >
                  Send SMS
                </Link>
                <Link
                  to="/messaging/credits"
                  className="px-4 py-2 bg-white text-primary-600 rounded-lg hover:bg-primary-50 font-medium inline-block"
                >
                  Buy Credits
                </Link>
              </div>
              <p className="text-primary-100 text-xs">
                Total used: {credits.totalUsed.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Global Date Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by:</span>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'this-week', label: 'This Week' },
              { value: 'last-week', label: 'Last Week' },
              { value: 'this-month', label: 'This Month' },
              { value: 'last-month', label: 'Last Month' },
              { value: 'custom', label: 'Custom' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setDateFilter(option.value as any)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  dateFilter === option.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Inputs */}
        {dateFilter === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={tempStartDate}
              onChange={(e) => setTempStartDate(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white"
              placeholder="Start Date"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={tempEndDate}
              onChange={(e) => setTempEndDate(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white"
              placeholder="End Date"
            />
            <button
              onClick={handleCustomDateSearch}
              className="px-4 py-1.5 bg-primary-600 text-white rounded text-sm font-medium hover:bg-primary-700 transition-colors whitespace-nowrap"
            >
              Search
            </button>
          </div>
        )}
      </div>

     

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Messages Sent</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.totalSent.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl"><CheckCircle className='text-green-600' /></span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Recipients</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.totalRecipients.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl"><Users className='text-primary-600' /></span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.successRate}%
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl"><ChartArea className='text-primary-600'/></span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Credits Used (Period)</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats?.totalCreditsUsed.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  All-time total: {credits?.totalUsed.toLocaleString() || '0'}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl"><CreditCard className='text-orange-600' /></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time-Series Analytics Charts */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              SMS Sent Over Time
            </h2>
          </div>

          {/* Chart Loading State */}
          {chartsLoading ? (
            <div className="flex items-center justify-center h-80">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              {(() => {
                const period = getChartPeriod();
                const dataKey = period === 'daily' ? 'date' : period === 'weekly' ? 'week' : 'month';

                return (
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
                    <XAxis dataKey={dataKey} stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #4b5563',
                        borderRadius: '8px'
                      }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="sent"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorSent)"
                      name="SMS Sent"
                    />
                    <Area
                      type="monotone"
                      dataKey="failed"
                      stroke="#ef4444"
                      fillOpacity={1}
                      fill="url(#colorFailed)"
                      name="Failed"
                    />
                  </AreaChart>
                );
              })()}
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-80 text-gray-500 dark:text-gray-400">
              <p>No SMS data available for the selected period</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Successful SMS Delivered */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Successful SMS Delivered
          </h2>
          <Link
            to="/messaging/history"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View All →
          </Link>
        </div>

        {recentLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : recentSMS.length > 0 ? (
          <div className="space-y-3">
            {recentSMS.map((sms, index) => (
              <div
                key={sms._id || index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {sms.message || sms.template?.name || 'SMS Message'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {sms.totalRecipients || 1} recipient{(sms.totalRecipients || 1) !== 1 ? 's' : ''} •{' '}
                    {new Date(sms.createdAt).toLocaleDateString()} {new Date(sms.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                    ✓ Delivered
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No SMS delivered in this period
            </p>
          </div>
        )}
      </div>
      </div>
    </FeatureGate>
  );
};

export default SMSDashboard;