import React, { useState, useEffect } from 'react';
import { Crown, Loader, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface Feature {
  key: string;
  name: string;
  category: string;
}

interface Plan {
  _id: string;
  name: string;
  slug: string;
  type: string;
  price: {amount: number, currency: string} | null;
  features: Record<string, boolean>;
}

interface FeatureData {
  features: Feature[];
  plans: Plan[];
}

const AdminFeatures = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [featureData, setFeatureData] = useState<FeatureData | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [modifiedFeatures, setModifiedFeatures] = useState<Record<string, boolean>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch features and plans
  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getFeatures();
      setFeatureData(response.data.data);
      
      // Select first plan by default
      if (response.data.data.plans.length > 0) {
        const firstPlan = response.data.data.plans[0];
        setSelectedPlan(firstPlan);
        setModifiedFeatures(firstPlan.features || {});
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load features');
    } finally {
      setLoading(false);
    }
  };

  // Handle plan selection
  const handlePlanChange = (planId: string) => {
    const plan = featureData?.plans.find(p => p._id === planId);
    if (plan) {
      setSelectedPlan(plan);
      setModifiedFeatures(plan.features || {});
      setHasChanges(false);
    }
  };

  // Toggle feature
  const toggleFeature = (featureKey: string) => {
    setModifiedFeatures(prev => ({
      ...prev,
      [featureKey]: !prev[featureKey]
    }));
    setHasChanges(true);
  };

  // Save changes
  const handleSave = async () => {
    if (!selectedPlan) return;

    try {
      setSaving(true);
      const response = await adminAPI.updatePlanFeatures(selectedPlan._id, { features: modifiedFeatures });
      
      toast.success(response.data.message || 'Plan features updated successfully');
      
      // Refresh data
      const refreshResponse = await adminAPI.getFeatures();
      const updatedFeatureData = refreshResponse.data.data;
      setFeatureData(updatedFeatureData);
      
      // ✅ Update selected plan and modified features with refreshed data
      const updatedPlan = updatedFeatureData.plans.find(p => p._id === selectedPlan._id);
      if (updatedPlan) {
        setSelectedPlan(updatedPlan);
        setModifiedFeatures(updatedPlan.features || {});
      }
      
      setHasChanges(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update features');
    } finally {
      setSaving(false);
    }
  };

  // Group features by category
  const groupedFeatures = featureData?.features.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, Feature[]>) || {};

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
            Feature Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Control which features are available for each subscription plan
          </p>
        </div>

        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-medium rounded-lg transition-colors"
          >
            {saving ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save Changes
              </>
            )}
          </button>
        )}
      </div>

      {/* Plan Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Plan to Configure
        </label>
        <select
          value={selectedPlan?._id || ''}
          onChange={(e) => handlePlanChange(e.target.value)}
          className="w-full max-w-md px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          {featureData?.plans.map(plan => (
            <option key={plan._id} value={plan._id}>
              {plan.name} - GH₵{plan.price?.amount}/month
            </option>
          ))}
        </select>

        {selectedPlan && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium">Important:</p>
                <p className="mt-1">Changes to this plan will affect all merchants currently subscribed to <strong>{selectedPlan.name}</strong>.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Features Grid */}
      {selectedPlan && (
        <div className="space-y-6">
          {Object.entries(groupedFeatures).map(([category, features]) => (
            <div
              key={category}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {category} Features
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {features.map(feature => (
                  <div
                    key={feature.key}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {feature.name}
                    </span>

                    <button
                      onClick={() => toggleFeature(feature.key)}
                      className={`
                        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                        ${modifiedFeatures[feature.key]
                          ? 'bg-primary-600'
                          : 'bg-gray-300 dark:bg-gray-600'
                        }
                      `}
                    >
                      <span
                        className={`
                          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                          ${modifiedFeatures[feature.key] ? 'translate-x-6' : 'translate-x-1'}
                        `}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Save Button (Bottom) */}
      {hasChanges && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-medium rounded-lg transition-colors shadow-lg"
          >
            {saving ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminFeatures;