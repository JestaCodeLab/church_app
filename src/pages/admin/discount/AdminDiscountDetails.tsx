import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Users,
  TrendingUp,
  DollarSign,
  Percent,
  Loader,
  BarChart3,
  Clock,
  Target
} from 'lucide-react';
import { discountAPI } from '../../../services/api';
import { showToast } from '../../../utils/toasts';
import ConfirmModal from '../../../components/ui/ConfirmModal';

const AdminDiscountDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [discount, setDiscount] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDiscountDetails();
      fetchDiscountStats();
    }
  }, [id]);

  const fetchDiscountDetails = async () => {
    try {
      setLoading(true);
      const response = await discountAPI.getDiscount(id!);
      setDiscount(response.data.data.discount);
    } catch (error) {
      showToast.error('Failed to fetch discount details');
      navigate('/admin/discounts');
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscountStats = async () => {
    try {
      setStatsLoading(true);
      const response = await discountAPI.getDiscountStats(id!);
      setStats(response.data.data.stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      setDeleteLoading(true);
      await discountAPI.deleteDiscount(id!, false);
      showToast.success('Discount deactivated successfully');
      navigate('/admin/discounts');
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to deactivate discount');
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  const getStatusBadge = () => {
    if (!discount) return null;

    const now = new Date();
    
    if (!discount.isActive) {
      return (
        <span className="inline-flex items-center px-3 py-1 text-sm font-semibold bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-full">
          <XCircle className="w-4 h-4 mr-2" />
          Inactive
        </span>
      );
    }

    if (discount.validUntil && new Date(discount.validUntil) < now) {
      return (
        <span className="inline-flex items-center px-3 py-1 text-sm font-semibold bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded-full">
          <AlertCircle className="w-4 h-4 mr-2" />
          Expired
        </span>
      );
    }

    if (discount.maxUses && discount.currentUses >= discount.maxUses) {
      return (
        <span className="inline-flex items-center px-3 py-1 text-sm font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 rounded-full">
          <AlertCircle className="w-4 h-4 mr-2" />
          Used Up
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-3 py-1 text-sm font-semibold bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full">
        <CheckCircle className="w-4 h-4 mr-2" />
        Active
      </span>
    );
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'No expiration';
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!discount) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/discounts')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {discount.code}
              </h1>
              {getStatusBadge()}
            </div>
            {discount.description && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {discount.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(`/admin/discounts/${id}/edit`)}
            className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <Edit className="w-5 h-5 mr-2" />
            Edit
          </button>

          {discount.currentUses === 0 && (
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Deactivate
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Uses
            </span>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {statsLoading ? '...' : stats?.totalUses || 0}
          </p>
          {discount.maxUses && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              of {discount.maxUses} limit
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Remaining Uses
            </span>
            <Target className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {statsLoading ? '...' : stats?.remainingUses === null ? '∞' : stats?.remainingUses}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Discount
            </span>
            <DollarSign className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {statsLoading ? '...' : `GHS ${stats?.totalDiscount?.toFixed(2) || '0.00'}`}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Unique Churches
            </span>
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {statsLoading ? '...' : stats?.uniqueMerchants || 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Discount Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Discount Information
            </h3>

            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                {discount.type === 'percentage' ? (
                  <>
                    <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
                      <Percent className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Discount Value</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {discount.value}% OFF
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Discount Value</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        GHS {discount.value} OFF
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Valid From
                  </label>
                  <div className="flex items-center text-gray-900 dark:text-gray-100">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    {formatDate(discount.validFrom)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Valid Until
                  </label>
                  <div className="flex items-center text-gray-900 dark:text-gray-100">
                    <Clock className="w-4 h-4 mr-2 text-gray-400" />
                    {formatDate(discount.validUntil)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Max Uses (Total)
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {discount.maxUses === null ? 'Unlimited' : discount.maxUses.toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Max Uses Per Church
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {discount.maxUsesPerMerchant}
                  </p>
                </div>
              </div>

              {discount.applicablePlans && discount.applicablePlans.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Applicable Plans
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {discount.applicablePlans.map((plan: string) => (
                      <span
                        key={plan}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium capitalize"
                      >
                        {plan}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Usage History */}
          {discount.usedBy && discount.usedBy.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Usage History ({discount.usedBy.length})
              </h3>

              <div className="space-y-3">
                {discount.usedBy.slice(0, 10).map((usage: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {usage.merchant?.name || 'Unknown Church'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(usage.usedAt).toLocaleDateString()} • Plan: {usage.plan}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-through">
                        GHS {usage.originalAmount}
                      </p>
                      <p className="font-semibold text-green-600 dark:text-green-400">
                        GHS {usage.finalAmount}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Saved: GHS {usage.discountAmount}
                      </p>
                    </div>
                  </div>
                ))}

                {discount.usedBy.length > 10 && (
                  <p className="text-sm text-center text-gray-500 dark:text-gray-400 pt-2">
                    Showing 10 of {discount.usedBy.length} uses
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Statistics Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-6">
            <div className="flex items-center space-x-2 mb-4">
              <BarChart3 className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Statistics
              </h3>
            </div>

            {statsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-6 h-6 animate-spin text-primary-600" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Revenue</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    GHS {stats?.totalRevenue?.toFixed(2) || '0.00'}
                  </p>
                </div>

                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Avg Discount</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    GHS {stats?.averageDiscount?.toFixed(2) || '0.00'}
                  </p>
                </div>

                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Usage Rate</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {discount.maxUses 
                      ? `${((discount.currentUses / discount.maxUses) * 100).toFixed(1)}%`
                      : 'N/A'
                    }
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {stats?.isValid ? 'Valid' : 'Invalid'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Deactivate Discount"
        message={`Are you sure you want to deactivate "${discount.code}"? The code will no longer be valid for new uses, but existing usage records will be preserved.`}
        confirmText="Deactivate"
        cancelText="Cancel"
        type="warning"
        isLoading={deleteLoading}
      />
    </div>
  );
};

export default AdminDiscountDetails;