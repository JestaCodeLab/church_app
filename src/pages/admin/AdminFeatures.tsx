import React, { useState, useEffect } from 'react';
import { Crown, Loader, Save, AlertCircle, CheckCircle2, Plus, Edit2, Trash2, X } from 'lucide-react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface Feature {
  _id?: string; // MongoDB ObjectId
  key: string; // Unique identifier
  name: string;
  category: string;
  icon?: string;
  description?: string;
  beta?: boolean;
  enabled?: boolean;
  availableInTiers?: string[];
  dependencies?: string[];
}

interface Plan {
  _id: string;
  name: string;
  slug: string;
  type: string;
  price: {amount: number, currency: string} | null;
  featureKeys?: string[]; // Feature keys (e.g., "memberManagement")
  featureIds?: string[]; // Legacy: actual MongoDB ObjectIds
}

interface FeatureData {
  features: Feature[]; // All features from backend
  plans: Plan[];
}

interface FeatureFormData {
  key: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  beta: boolean;
  availableInTiers: string[];
  dependencies: string[];
}

const CATEGORIES = ['Core', 'Financial', 'Communication', 'Reporting', 'Attendance', 'Integration', 'Support', 'Customization', 'Advanced'];
const TIERS = ['starter', 'basic', 'growth', 'enterprise'];

const AdminFeatures = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [featureData, setFeatureData] = useState<FeatureData | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Feature form modal
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [formData, setFormData] = useState<FeatureFormData>({
    key: '',
    name: '',
    description: '',
    category: 'Core',
    icon: '',
    beta: false,
    availableInTiers: [],
    dependencies: []
  });

  // Fetch features and plans
  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getFeatures();
      
      const features = response.data?.data?.features || [];
      const plans = response.data?.data?.plans || [];
      
      setFeatureData({
        features,
        plans
      });
      
      // Select first plan by default
      if (plans.length > 0) {
        const firstPlan = plans[0];
        setSelectedPlan(firstPlan);
        setSelectedFeatureIds((firstPlan.featureKeys || []).map(key => String(key)));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Failed to load features');
    } finally {
      setLoading(false);
    }
  };

  // Handle plan selection
  const handlePlanChange = (planId: string) => {
    const plan = featureData?.plans.find(p => p._id === planId);
    if (plan) {
      setSelectedPlan(plan);
      setSelectedFeatureIds((plan.featureKeys || []).map(key => String(key)));
      setHasChanges(false);
    }
  };

  // Toggle feature selection
  const toggleFeature = (featureKey: string) => {
    console.log('Toggling feature:', featureKey);
    console.log('Current selectedFeatureIds:', selectedFeatureIds);
    
    setSelectedFeatureIds(prev => {
      const newIds = prev.includes(featureKey)
        ? prev.filter(id => id !== featureKey)
        : [...prev, featureKey];
      
      console.log('New selectedFeatureIds:', newIds);
      setHasChanges(true);
      return newIds;
    });
  };

  // Save plan features
  const handleSave = async () => {
    if (!selectedPlan) return;

    try {
      setSaving(true);
      
      // Optimistic update - update UI immediately
      const updatedPlan = {
        ...selectedPlan,
        featureKeys: selectedFeatureIds
      };
      
      // Update local state first (optimistic)
      setSelectedPlan(updatedPlan);
      setFeatureData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          plans: prev.plans.map(p => p._id === updatedPlan._id ? updatedPlan : p)
        };
      });
      
      // Then make the API call in background
      const response = await adminAPI.updatePlanFeatures(selectedPlan._id, { 
        featureKeys: selectedFeatureIds 
      });
      
      // Update with server response (ensures consistency)
      if (response.data?.data?.plan) {
        const serverPlan = response.data.data.plan;
        setSelectedPlan(serverPlan);
        setFeatureData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            plans: prev.plans.map(p => p._id === serverPlan._id ? serverPlan : p)
          };
        });
      }
      
      toast.success(response.data.message || 'Plan features updated successfully');
      setHasChanges(false);
    } catch (error: any) {
      // Revert optimistic update on error
      const plan = featureData?.plans.find(p => p._id === selectedPlan._id);
      if (plan) {
        setSelectedPlan(plan);
        setSelectedFeatureIds((plan.featureKeys || []).map(key => String(key)));
      }
      toast.error(error.response?.data?.message || 'Failed to update features');
    } finally {
      setSaving(false);
    }
  };

  // Open feature form for creating new feature
  const handleNewFeature = () => {
    setEditingFeature(null);
    setFormData({
      key: '',
      name: '',
      description: '',
      category: 'Core',
      icon: '',
      beta: false,
      availableInTiers: [],
      dependencies: []
    });
    setShowFeatureModal(true);
  };

  // Open feature form for editing
  const handleEditFeature = (feature: Feature) => {
    setEditingFeature(feature);
    setFormData({
      key: feature.key,
      name: feature.name,
      description: feature.description || '',
      category: feature.category,
      icon: feature.icon || '',
      beta: feature.beta || false,
      availableInTiers: feature.availableInTiers || [],
      dependencies: feature.dependencies || []
    });
    setShowFeatureModal(true);
  };

  // Save feature (create or update)
  const handleSaveFeature = async () => {
    try {
      if (!formData.key || !formData.name) {
        toast.error('Key and Name are required');
        return;
      }

      setSaving(true);

      if (editingFeature) {
        // Update existing feature - exclude key since it cannot be changed
        const updateData = { ...formData };
        delete updateData.key;
        await adminAPI.updateFeature(editingFeature._id, updateData);
        toast.success('Feature updated successfully');
      } else {
        // Create new feature
        await adminAPI.createFeature(formData);
        toast.success('Feature created successfully');
      }

      setShowFeatureModal(false);
      await fetchFeatures();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save feature');
    } finally {
      setSaving(false);
    }
  };

  // Delete feature
  const handleDeleteFeature = async (featureId: string) => {
    if (!window.confirm('Are you sure you want to delete this feature?')) {
      return;
    }

    try {
      setSaving(true);
      await adminAPI.deleteFeature(featureId);
      toast.success('Feature deleted successfully');
      await fetchFeatures();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete feature');
    } finally {
      setSaving(false);
    }
  };

  // Get feature object by key
  const getFeatureByKey = (featureKey: string): Feature | undefined => {
    return featureData?.features.find(f => f.key === featureKey);
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
            Feature Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Control which features are available for each subscription plan
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleNewFeature}
            className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Feature
          </button>

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
      {selectedPlan && featureData && (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Features</div>
              <div className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-2">{featureData.features.length}</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 rounded-xl p-6 border border-green-200 dark:border-green-800">
              <div className="text-sm text-green-600 dark:text-green-400 font-medium">Enabled for {selectedPlan.name}</div>
              <div className="text-3xl font-bold text-green-900 dark:text-green-100 mt-2">{selectedFeatureIds.length}</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
              <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">Categories</div>
              <div className="text-3xl font-bold text-purple-900 dark:text-purple-100 mt-2">
                {new Set(featureData.features.map(f => f.category)).size}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10 rounded-xl p-6 border border-orange-200 dark:border-orange-800">
              <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">Disabled</div>
              <div className="text-3xl font-bold text-orange-900 dark:text-orange-100 mt-2">{featureData.features.length - selectedFeatureIds.length}</div>
            </div>
          </div>

          {/* Features by Category */}
          <div className="space-y-4">
            {featureData.features.length === 0 ? (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
                <p className="text-yellow-900 dark:text-yellow-100">No features available</p>
              </div>
            ) : (
              CATEGORIES.filter(category => featureData.features.some((f: Feature) => f.category === category)).map(category => {
                const categoryFeatures = featureData.features.filter((f: Feature) => f.category === category);
                const enabledCount = categoryFeatures.filter((f: Feature) => selectedFeatureIds.includes(f.key)).length;
                
                return (
                  <div
                    key={category}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Category Header */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {category}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {enabledCount} of {categoryFeatures.length} enabled
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="w-16 h-16 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center border border-gray-300 dark:border-gray-600">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-primary-600">{enabledCount}</div>
                              <div className="text-xs text-gray-500">active</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Category Content */}
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {categoryFeatures.map((feature: Feature) => {
                          const isEnabled = selectedFeatureIds.includes(feature.key);
                          return (
                            <div
                              key={feature.key}
                              className={`
                                relative p-4 rounded-lg border-2 transition-all
                                ${isEnabled 
                                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
                                }
                                hover:border-primary-400 hover:shadow-md
                              `}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                      {feature.name}
                                    </h4>
                                    {feature.beta && (
                                      <span className="flex-shrink-0 px-2 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded">
                                        BETA
                                      </span>
                                    )}
                                  </div>
                                  
                                  {feature.description && (
                                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                                      {feature.description}
                                    </p>
                                  )}
                                  
                                  {feature.availableInTiers && feature.availableInTiers.length > 0 && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      <span className="font-medium">Tiers:</span> {feature.availableInTiers.join(', ')}
                                    </div>
                                  )}
                                </div>

                                <button
                                  onClick={() => toggleFeature(feature.key)}
                                  className={`
                                    flex-shrink-0 ml-2 relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                                    ${isEnabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}
                                  `}
                                  title={isEnabled ? 'Disable' : 'Enable'}
                                >
                                  <span
                                    className={`
                                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                                      ${isEnabled ? 'translate-x-6' : 'translate-x-1'}
                                    `}
                                  />
                                </button>
                              </div>

                              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex gap-2 justify-end">
                                <button
                                  onClick={() => handleEditFeature(feature)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteFeature(feature.key)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
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

      {/* Feature Form Modal */}
      {showFeatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {editingFeature ? 'Edit Feature' : 'Add New Feature'}
              </h2>
              <button
                onClick={() => setShowFeatureModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Key (camelCase) *
                </label>
                <input
                  type="text"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  placeholder="e.g., financeDonations"
                  disabled={!!editingFeature}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 disabled:opacity-50"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Finance Donations"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the feature"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Icon */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Icon (Lucide name)
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="e.g., DollarSign"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* Tiers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Available in Tiers
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {TIERS.map(tier => (
                    <label key={tier} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.availableInTiers.includes(tier)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              availableInTiers: [...formData.availableInTiers, tier]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              availableInTiers: formData.availableInTiers.filter(t => t !== tier)
                            });
                          }
                        }}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{tier}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Beta */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="beta"
                  checked={formData.beta}
                  onChange={(e) => setFormData({ ...formData, beta: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="beta" className="text-sm text-gray-700 dark:text-gray-300">
                  Mark as Beta
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowFeatureModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFeature}
                disabled={saving}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {saving && <Loader className="w-4 h-4 animate-spin" />}
                {editingFeature ? 'Update' : 'Create'} Feature
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeatures;