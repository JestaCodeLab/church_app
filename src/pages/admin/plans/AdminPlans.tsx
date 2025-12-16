import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Edit, 
  Eye, 
  EyeOff, 
  Trash2, 
  Users, 
  TrendingUp,
  Crown,
  Zap,
  Loader,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { planAPI } from '../../../services/api';
import { showToast } from '../../../utils/toasts';
import ConfirmModal from '../../../components/modals/ConfirmModal';

const AdminPlans = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await planAPI.getPlans({ sortBy: 'displayOrder', sortOrder: 'asc' });
      setPlans(response.data.data.plans);
    } catch (error) {
      showToast.error('Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (planId: string) => {
    try {
      await planAPI.togglePlanVisibility(planId);
      showToast.success('Plan visibility updated');
      fetchPlans();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to toggle visibility');
    }
  };

  const handleDelete = (planId: string, planName: string) => {
    setPlanToDelete({ id: planId, name: planName });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!planToDelete) return;

    try {
      setDeleteLoading(true);
      await planAPI.deletePlan(planToDelete.id, false);
      showToast.success('Plan deactivated successfully');
      setShowDeleteModal(false);
      setPlanToDelete(null);
      fetchPlans();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to deactivate plan');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getPlanIcon = (type: string) => {
    switch (type) {
      case 'free': return <Users className="w-6 h-6 text-gray-500" />;
      case 'basic': return <Zap className="w-6 h-6 text-blue-500" />;
      case 'pro': return <Crown className="w-6 h-6 text-purple-500" />;
      case 'enterprise': return <TrendingUp className="w-6 h-6 text-orange-500" />;
      default: return <Users className="w-6 h-6 text-gray-500" />;
    }
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
            Subscription Plans
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage pricing, limits, and features for all plans
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/plans/new')}
          className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Plan
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan._id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getPlanIcon(plan.type)}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {plan.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {plan.slug}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {plan.isActive ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  {plan.isPublic ? (
                    <Eye className="w-5 h-5 text-blue-500" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-gray-400"/>
                  )}
                </div>
              </div>

              {/* Pricing */}
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {plan.price.amount === 0 ? 'Free' : `${plan.price.currency} ${plan.price.amount}`}
                </span>
                {plan.price.amount > 0 && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    /{plan.billingCycle}
                  </span>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="p-6 bg-gray-50 dark:bg-gray-900/50">
              <div className="space-y-3">
                {/* Merchants using this plan */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Active Churches:</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {plan.merchantCount || 0}
                  </span>
                </div>

                {/* Key Limits */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Member Limit:</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {plan.limits.members === null ? '∞' : plan.limits.members}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Branch Limit:</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {plan.limits.branches === null ? '∞' : plan.limits.branches}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleToggleVisibility(plan._id)}
                  className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
                  title={plan.isPublic ? 'Make Private' : 'Make Public'}
                >
                  {plan.isPublic ? (
                    <Eye className="w-5 h-5" />
                  ) : (
                    <EyeOff className="w-5 h-5" />
                  )}
                </button>

                <button
                  onClick={() => navigate(`/admin/plans/${plan._id}/edit`)}
                  className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  title="Edit Plan"
                >
                  <Edit className="w-5 h-5" />
                </button>

                {plan.merchantCount === 0 && (
                  <button
                    onClick={() => handleDelete(plan._id, plan.name)}
                    disabled={deleteLoading}
                    className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors disabled:opacity-50"
                    title="Deactivate Plan"
                  >
                    {deleteLoading ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                )}
              </div>

              <button
                onClick={() => navigate(`/admin/plans/${plan._id}`)}
                className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                View Details →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {plans.length === 0 && (
        <div className="text-center py-12">
          <Crown className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Plans Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first subscription plan to get started
          </p>
          <button
            onClick={() => navigate('/admin/plans/new')}
            className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Plan
          </button>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setPlanToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Deactivate Plan"
        message={`Are you sure you want to deactivate "${planToDelete?.name}"? This plan will no longer be visible to new customers, but existing customers will keep their access.`}
        confirmText="Deactivate"
        cancelText="Cancel"
        type="warning"
        isLoading={deleteLoading}
      />
    </div>
  );
};

export default AdminPlans;