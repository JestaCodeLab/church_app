import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp,
  DollarSign,
  Users,
  MessageSquare,
  AlertTriangle,
  ExternalLink,
  Clock
} from 'lucide-react';
import api from '../../../services/api';
import toast from 'react-hot-toast';

interface ArkeselData {
  balance: number; // SMS credits
  currency: string;
  user: string;
  smsBalance?: number; // SMS credits (same as balance)
  mainBalance?: number; // Cash balance (parsed)
  mainBalanceRaw?: string; // Original format "GHS 0.2"
  lastChecked: string;
  status: 'healthy' | 'low' | 'critical';
}

interface PlatformStats {
  purchases: {
    totalCredits: number;
    totalRevenue: number;
    count: number;
  };
  usage: {
    totalSent: number;
    totalCreditsUsed: number;
  };
  merchants: {
    withCredits: number;
    lowCredits: number;
  };
}

const AdminArkeselBalance: React.FC = () => {
  const [arkesel, setArkesel] = useState<ArkeselData | null>(null);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/sms/admin/arkesel-balance');

      setArkesel(response.data.data.arkesel);
      setPlatformStats(response.data.data.platform);
    } catch (error: any) {
      toast.error('Failed to load Arkesel data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const response = await api.get('/sms/admin/arkesel-balance');
      setArkesel(response.data.data.arkesel);
      setPlatformStats(response.data.data.platform);
      toast.success('Balance refreshed');
    } catch (error: any) {
      toast.error('Failed to refresh balance');
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'low':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'critical':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5" />;
      case 'low':
        return <AlertCircle className="w-5 h-5" />;
      case 'critical':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Arkesel Balance
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor your SMS service provider balance and platform usage
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Balance Card */}
{arkesel && (
  <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg p-8 text-white">
    <div className="flex items-center justify-between mb-6">
      <div>
        <p className="text-blue-100 text-sm font-medium mb-1">Arkesel SMS Credits</p>
        <div className="flex items-baseline">
          <span className="text-5xl font-bold">{arkesel.balance}</span>
          <span className="text-2xl ml-2 text-blue-100">SMS</span>
        </div>
        
        {/* Show cash balance if available */}
        {arkesel.mainBalanceRaw && (
          <div className="mt-3 text-sm text-blue-100">
            <span className="bg-white/10 px-3 py-1 rounded-full">
              Cash Balance: {arkesel.mainBalanceRaw}
            </span>
          </div>
        )}
      </div>
      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
        <Wallet className="w-8 h-8" />
      </div>
    </div>

    <div className="flex items-center justify-between pt-6 border-t border-blue-500/30">
      <div>
        <p className="text-blue-100 text-sm">Account: {arkesel.user}</p>
        <p className="text-blue-200 text-xs mt-1">
          <Clock className="w-3 h-3 inline mr-1" />
          Last checked: {new Date(arkesel.lastChecked).toLocaleString()}
        </p>
      </div>
      <div className={`px-4 py-2 rounded-full flex items-center space-x-2 ${getStatusColor(arkesel.status)}`}>
        {getStatusIcon(arkesel.status)}
        <span className="text-sm font-semibold capitalize">{arkesel.status}</span>
      </div>
    </div>
  </div>
)}

      {/* Low Balance Warning */}
      { arkesel && arkesel.status !== 'healthy' && (
        <div className={`rounded-lg p-4 ${
          arkesel.status === 'critical' 
            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' 
            : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
        }`}>
          <div className="flex items-start">
            <AlertTriangle className={`w-5 h-5 mt-0.5 ${
              arkesel.status === 'critical' ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'
            }`} />
            <div className="ml-3 flex-1">
              <h3 className={`text-sm font-semibold ${
                arkesel.status === 'critical' ? 'text-red-900 dark:text-red-100' : 'text-yellow-900 dark:text-yellow-100'
              }`}>
                {arkesel.status === 'critical' ? 'Critical: Low Balance' : 'Warning: Balance Running Low'}
              </h3>
              <p className={`text-sm mt-1 ${
                arkesel.status === 'critical' ? 'text-red-700 dark:text-red-300' : 'text-yellow-700 dark:text-yellow-300'
              }`}>
                Your Arkesel balance is {arkesel.status === 'critical' ? 'critically low' : 'running low'}. 
                SMS messages may fail to send. Please top up your account.
              </p>
              
                <a href="https://sms.arkesel.com"
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center mt-3 px-4 py-2 text-sm font-medium rounded-lg ${
                  arkesel.status === 'critical' 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-yellow-600 text-white hover:bg-yellow-700'
                } transition-colors`}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Top Up on Arkesel
              </a>
            </div>
          </div>
      </div>
      )}

      {/* Platform Statistics */}
      {platformStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Revenue */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              GHS {platformStats.purchases.totalRevenue.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Total Revenue
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              {platformStats.purchases.count} purchases
            </p>
          </div>

          {/* Credits Purchased */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {platformStats.purchases.totalCredits.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Credits Purchased
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              All time
            </p>
          </div>

          {/* SMS Sent */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {platformStats.usage.totalSent.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              SMS Sent
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              {platformStats.usage.totalCreditsUsed} credits used
            </p>
          </div>

          {/* Active Churches */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {platformStats.merchants.withCredits}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Churches with Credits
            </p>
            {platformStats.merchants.lowCredits > 0 && (
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                {platformStats.merchants.lowCredits} with low credits
              </p>
            )}
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
          💡 About Arkesel Balance
        </h3>
        <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <p>• <strong>Church Credits:</strong> Tracks credits purchased by churches in the platform</p>
          <p>• <strong>Arkesel Balance:</strong> Your actual SMS service provider account balance</p>
          <p>• <strong>Important:</strong> Keep Arkesel balance topped up to ensure SMS delivery</p>
          <p>• <strong>Recommended:</strong> Maintain at least GHS 50 for uninterrupted service</p>
        </div>
      </div>
    </div>
  );
};

export default AdminArkeselBalance;