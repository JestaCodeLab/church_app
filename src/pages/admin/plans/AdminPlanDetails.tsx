import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Eye,
  EyeOff,
  Users,
  TrendingUp,
  CheckCircle,
  XCircle,
  Crown,
  Loader,
  BarChart3
} from 'lucide-react';
import { planAPI } from '../../../services/api';
import { showToast } from '../../../utils/toasts';

const AdminPlanDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPlanDetails();
      fetchPlanStats();
    }
  }, [id]);

  const fetchPlanDetails = async () => {
    try {
      setLoading(true);
      const response = await planAPI.getPlan(id!);
      setPlan(response.data.data.plan);
    } catch (error) {
      showToast.error('Failed to fetch plan details');
      navigate('/admin/plans');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlanStats = async () => {
    try {
      setStatsLoading(true);
      const response = await planAPI.getPlanStats(id!);
      setStats(response.data.data.stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleToggleVisibility = async () => {
    try {
      await planAPI.togglePlanVisibility(id!);
      showToast.success('Plan visibility updated');
      fetchPlanDetails();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to toggle visibility');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  const enabledFeatures = Object.entries(plan.features).filter(([_, enabled]) => enabled);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/plans')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {plan.name}
            </h1>
            <div className="flex items-center space-x-3 mt-1">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {plan.slug}
              </span>
              {plan.isActive ? (
                <span className="inline-flex items-center px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded-full">
                  <XCircle className="w-3 h-3 mr-1" />
                  Inactive
                </span>
              )}
              {plan.isPublic ? (
                <span className="inline-flex items-center px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                  <Eye className="w-3 h-3 mr-1" />
                  Public
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-full">
                  <EyeOff className="w-3 h-3 mr-1" />
                  Private
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleToggleVisibility}
            className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            {plan.isPublic ? (
              <>
                <EyeOff className="w-5 h-5 mr-2" />
                Make Private
              </>
            ) : (
              <>
                <Eye className="w-5 h-5 mr-2" />
                Make Public
              </>
            )}
          </button>

          <button
            onClick={() => navigate(`/admin/plans/${id}/edit`)}
            className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            <Edit className="w-5 h-5 mr-2" />
            Edit Plan
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Active Churches
            </span>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {statsLoading ? '...' : stats?.activeMerchants || 0}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Members
            </span>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {statsLoading ? '...' : stats?.totalMembers?.toLocaleString() || 0}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Branches
            </span>
            <BarChart3 className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {statsLoading ? '...' : stats?.totalBranches || 0}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Avg Members/Church
            </span>
            <Crown className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {statsLoading ? '...' : stats?.averageMembersPerMerchant || 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Plan Information
            </h3>

            <div className="space-y-4">
              {plan.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Description
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {plan.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Price
                  </label>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {plan.price.amount === 0 ? (
                      'Free'
                    ) : (
                      <>
                        {plan.price.currency} {plan.price.amount}
                        <span className="text-sm font-normal text-gray-500 ml-1">
                          /{plan.billingCycle}
                        </span>
                      </>
                    )}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Type
                  </label>
                  <p className="text-gray-900 dark:text-gray-100 capitalize">
                    {plan.type}
                  </p>
                </div>
              </div>

              {plan.trialDays > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Trial Period
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {plan.trialDays} days
                  </p>
                </div>
              )}

              {plan.highlights && plan.highlights.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Highlights
                  </label>
                  <ul className="space-y-2">
                    {plan.highlights.map((highlight: string, index: number) => (
                      <li key={index} className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Limits */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Resource Limits
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {Object.entries(plan.limits).map(([key, value]: [string, any]) => (
                <div key={key} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {value === null ? '∞ Unlimited' : value.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Enabled Features ({enabledFeatures.length})
            </h3>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {enabledFeatures.length > 0 ? (
                enabledFeatures.map(([key, _]) => (
                  <div
                    key={key}
                    className="flex items-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg"
                  >
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No features enabled
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPlanDetails;