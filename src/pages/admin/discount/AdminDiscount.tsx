import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Percent,
  DollarSign,
  Calendar,
  Users,
  TrendingUp,
  Loader,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { discountAPI } from '../../../services/api';
import { showToast } from '../../../utils/toasts';
import ConfirmModal from '../../../components/ui/ConfirmModal';

const AdminDiscounts = () => {
  const navigate = useNavigate();
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [discountToDelete, setDiscountToDelete] = useState<{ id: string; code: string } | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'used-up'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'percentage' | 'fixed'>('all');

  useEffect(() => {
    fetchDiscounts();
  }, [statusFilter, typeFilter]);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.type = typeFilter;

      const response = await discountAPI.getDiscounts(params);
      setDiscounts(response.data.data.discounts);
    } catch (error) {
      showToast.error('Failed to fetch discounts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string, code: string) => {
    setDiscountToDelete({ id, code });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!discountToDelete) return;

    try {
      setDeleteLoading(true);
      await discountAPI.deleteDiscount(discountToDelete.id, false);
      showToast.success('Discount deactivated successfully');
      setShowDeleteModal(false);
      setDiscountToDelete(null);
      fetchDiscounts();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to deactivate discount');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getStatusBadge = (discount: any) => {
    const now = new Date();
    
    if (!discount.isActive) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-full">
          <XCircle className="w-3 h-3 mr-1" />
          Inactive
        </span>
      );
    }

    if (discount.validUntil && new Date(discount.validUntil) < now) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded-full">
          <AlertCircle className="w-3 h-3 mr-1" />
          Expired
        </span>
      );
    }

    if (discount.maxUses && discount.currentUses >= discount.maxUses) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 rounded-full">
          <AlertCircle className="w-3 h-3 mr-1" />
          Used Up
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </span>
    );
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'No expiration';
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Discount Codes
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage promotional discount codes for subscription plans
          </p>
        </div>

        <button
          onClick={() => navigate('/admin/discounts/new')}
          className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Discount
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="used-up">Used Up</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Types</option>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>

          <div className="flex-1" />

          <div className="text-sm text-gray-600 dark:text-gray-400">
            {discounts.length} discount{discounts.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Discounts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {discounts.map((discount) => (
          <div
            key={discount._id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {discount.code}
                  </h3>
                  {getStatusBadge(discount)}
                </div>
                
                {discount.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {discount.description}
                  </p>
                )}
              </div>
            </div>

            {/* Discount Value */}
            <div className="flex items-center space-x-2 mb-4">
              {discount.type === 'percentage' ? (
                <>
                  <Percent className="w-5 h-5 text-primary-600" />
                  <span className="text-2xl font-bold text-primary-600">
                    {discount.value}%
                  </span>
                  <span className="text-sm text-gray-500">OFF</span>
                </>
              ) : (
                <>
                  <DollarSign className="w-5 h-5 text-primary-600" />
                  <span className="text-2xl font-bold text-primary-600">
                    {discount.value}
                  </span>
                  <span className="text-sm text-gray-500">OFF</span>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400 flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Usage
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {discount.currentUses}
                  {discount.maxUses && ` / ${discount.maxUses}`}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Expires
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formatDate(discount.validUntil)}
                </span>
              </div>

              {discount.applicablePlans && discount.applicablePlans.length > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Plans
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {discount.applicablePlans.length} specific
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigate(`/admin/discounts/${discount._id}`)}
                  className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  title="View Details"
                >
                  <Eye className="w-5 h-5" />
                </button>

                <button
                  onClick={() => navigate(`/admin/discounts/${discount._id}/edit`)}
                  className="p-2 text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                  title="Edit"
                >
                  <Edit className="w-5 h-5" />
                </button>

                <button
                  onClick={() => navigate(`/admin/discounts/${discount._id}/stats`)}
                  className="p-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                  title="View Stats"
                >
                  <BarChart3 className="w-5 h-5" />
                </button>

                {discount.currentUses === 0 && (
                  <button
                    onClick={() => handleDelete(discount._id, discount.code)}
                    disabled={deleteLoading}
                    className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors disabled:opacity-50"
                    title="Deactivate"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              <button
                onClick={() => navigate(`/admin/discounts/${discount._id}`)}
                className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                View Details →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {discounts.length === 0 && (
        <div className="text-center py-12">
          <Percent className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Discounts Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first discount code to offer promotions
          </p>
          <button
            onClick={() => navigate('/admin/discounts/new')}
            className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Discount
          </button>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDiscountToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Deactivate Discount"
        message={`Are you sure you want to deactivate "${discountToDelete?.code}"? The code will no longer be valid for new uses, but existing usage records will be preserved.`}
        confirmText="Deactivate"
        cancelText="Cancel"
        type="warning"
        isLoading={deleteLoading}
      />
    </div>
  );
};

export default AdminDiscounts;