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
  XCircle,
  DollarSign,
  BarChart3,
  Settings,
  ArrowRight
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

  // Calculate statistics
  const totalChurches = plans.reduce((sum, plan) => sum + (plan.merchantCount || 0), 0);
  const activePlans = plans.filter(p => p.isActive).length;
  const totalRevenue = plans.reduce((sum, plan) => sum + (plan.price.amount * (plan.merchantCount || 0)), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Subscription Plans
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage pricing, limits, and features for all plans
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/plans/new')}
          className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-all hover:shadow-lg active:scale-95"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Plan
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Churches */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-xl p-6 border border-primary-300 dark:border-primary-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-600 dark:text-primary-400">Total Churches</p>
              <p className="text-3xl font-bold text-primary-900 dark:text-primary-100 mt-2">{totalChurches}</p>
            </div>
            <Users className="w-12 h-12 text-blue-300 dark:text-primary-700 opacity-50" />
          </div>
        </div>

        {/* Active Plans */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/10 rounded-xl p-6 border border-primary-300 dark:border-primary-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Active Plans</p>
              <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100 mt-2">{activePlans}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-emerald-300 dark:text-emerald-700 opacity-50" />
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 rounded-xl p-6 border border-primary-300 dark:border-primary-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-600 dark:text-primary-400">Monthly Revenue</p>
              <p className="text-3xl font-bold text-purple-900 dark:text-primary-100 mt-2">GHS {totalRevenue.toLocaleString()}</p>
            </div>
            <DollarSign className="w-12 h-12 text-purple-300 dark:text-primary-700 opacity-50" />
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            All Plans ({plans.length})
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan._id}
              className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-primary-300 dark:border-primary-700 overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              {/* Status Bar */}
              <div className="h-1 w-full bg-primary-500" />

              {/* Header */}
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-lg ${
                      plan.type === 'free' ? 'bg-gray-100 dark:bg-gray-700' :
                      plan.type === 'basic' ? 'bg-primary-100 dark:bg-primary-900/30' :
                      plan.type === 'pro' ? 'bg-purple-100 dark:bg-purple-900/30' :
                      'bg-orange-100 dark:bg-orange-900/30'
                    }`}>
                      {getPlanIcon(plan.type)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {plan.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {plan.slug}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    {plan.isActive ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    {plan.badge?.text && (
                      <span className={`text-xs font-bold px-2 py-1 rounded-full text-white ${
                        plan.badge.color === 'blue' ? 'bg-primary-500' :
                        plan.badge.color === 'purple' ? 'bg-purple-500' :
                        plan.badge.color === 'green' ? 'bg-emerald-500' :
                        plan.badge.color === 'orange' ? 'bg-orange-500' :
                        'bg-gray-500'
                      }`}>
                        {plan.badge.text}
                      </span>
                    )}
                  </div>
                </div>

                {/* Pricing */}
                <div className="flex items-baseline space-x-2">
                  <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                    {plan.price.amount === 0 ? 'Free' : `${plan.price.amount}`}
                  </span>
                  {plan.price.amount > 0 && (
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {plan.price.currency}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        /{plan.billingCycle}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="p-6 bg-gray-50 dark:bg-gray-900/50 space-y-3">
                <div className="space-y-3">
                  {/* Merchants using this plan */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>Active Churches</span>
                    </span>
                    <span className="font-bold text-lg text-primary-600 dark:text-primary-400">
                      {plan.merchantCount || 0}
                    </span>
                  </div>

                  {/* Key Limits */}
                  <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Members:</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {plan.limits.members === null ? '∞' : plan.limits.members}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Branches:</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {plan.limits.branches === null ? '∞' : plan.limits.branches}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Events:</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {plan.limits.events === null ? '∞' : plan.limits.events}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => navigate(`/admin/plans/${plan._id}/edit`)}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors group"
                  >
                    <Settings className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
                    Edit
                  </button>

                  <button
                    onClick={() => handleToggleVisibility(plan._id)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-lg"
                    title={plan.isPublic ? 'Make Private' : 'Make Public'}
                  >
                    {plan.isPublic ? (
                      <Eye className="w-5 h-5" />
                    ) : (
                      <EyeOff className="w-5 h-5" />
                    )}
                  </button>

                  {plan.merchantCount === 0 && (
                    <button
                      onClick={() => handleDelete(plan._id, plan.name)}
                      disabled={deleteLoading}
                      className="p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-lg disabled:opacity-50"
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
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {plans.length === 0 && (
        <div className="text-center py-16 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
            <Crown className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            No Plans Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            Create your first subscription plan to define pricing tiers, feature access, and limits for your churches.
          </p>
          <button
            onClick={() => navigate('/admin/plans/new')}
            className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-all hover:shadow-lg active:scale-95"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Your First Plan
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