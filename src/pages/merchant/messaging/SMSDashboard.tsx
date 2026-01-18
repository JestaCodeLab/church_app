import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { messagingAPI } from '../../../services/api';
import { Link } from 'react-router-dom';
import { showToast } from '../../../utils/toasts';
import { checkFeatureAccess } from '../../../utils/featureAccess';
import { ChartArea, CheckCircle, ClipboardClock, CreditCard, FilePen, FilePenLine, Mail, Users, RefreshCcw } from 'lucide-react';
import FeatureGate from '../../../components/access/FeatureGate';
import PermissionGuard from '../../../components/guards/PermissionGuard';

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
  const [hasSMSAccess, setHasSMSAccess] = useState<boolean | null>(null);

  useEffect(() => {
    checkSMSAccess();
    fetchDashboardData();
  }, []);

  const checkSMSAccess = async () => {
    const hasAccess = await checkFeatureAccess('smsAnalytics', {
      showErrorToast: false
    });
    setHasSMSAccess(hasAccess);
  };

  const fetchDashboardData = async () => {
  try {
    setLoading(true);
    const [statsRes, creditsRes] = await Promise.all([
      messagingAPI.sms.getStatistics(),
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <FeatureGate feature={"smsAnalytics"} showUpgrade={!hasSMSAccess}>
      <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Overview of your SMS messaging performance
          </p>
        </div>
        <Link
          to="/messaging/send"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Send SMS
        </Link>
      </div>

      {/* Credits Card */}
      {credits && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-1">Available Credits</p>
              <p className="text-4xl font-bold">{credits.balance.toLocaleString()}</p>
              <p className="text-blue-100 text-sm mt-2">
                Plan: {credits.planCredits} | Purchased: {credits.purchasedCredits}
              </p>
            </div>
            <div className="text-right">
              <Link
                to="/messaging/credits"
                className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-medium inline-block"
              >
                Buy Credits
              </Link>
              <p className="text-blue-100 text-xs mt-2">
                Total used: {credits.totalUsed.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

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
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl"><Users className='text-blue-600' /></span>
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
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl"><ChartArea className='text-purple-600'/></span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Credits Used</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.totalCreditsUsed.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl"><CreditCard className='text-orange-600' /></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/messaging/send"
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl"><Mail className='text-blue-600' /></span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Send SMS</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Send messages to members
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/messaging/templates"
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl"><FilePenLine className='text-purple-600' /></span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Templates</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage message templates
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/messaging/history"
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl"><ClipboardClock className='text-green-600' /></span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">History</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View sent messages
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Messages by Category */}
      {stats && stats.byCategory.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Messages by Category
          </h2>
          <div className="space-y-3">
            {stats.byCategory.map((category) => (
              <div key={category._id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {category._id.replace(/_/g, ' ')}
                  </span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {category.count} messages
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </FeatureGate>
  );
};

export default SMSDashboard;