import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader, AlertCircle, Plus, X } from 'lucide-react';
import { planAPI, adminAPI } from '../../../services/api';
import { showToast } from '../../../utils/toasts';

interface FeatureDoc {
  _id: string;
  key: string;
  name: string;
  category: string;
  description?: string;
  beta?: boolean;
}

interface LimitDefinition {
  _id: string;
  key: string;
  name: string;
  category: string;
  valueType: 'numeric' | 'enum' | 'boolean';
  unit: string;
  description?: string;
  displayOrder: number;
  allowedValues?: string[];
  defaultSelection?: string[];
}

const AdminPlanEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'limits' | 'features'>('basic');

  // Form state
  const [plan, setPlan] = useState<any>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState({ amount: 0, currency: 'GHS' });
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [highlights, setHighlights] = useState<string[]>([]);

  // Dynamic features
  const [allFeatures, setAllFeatures] = useState<FeatureDoc[]>([]);
  const [selectedFeatureKeys, setSelectedFeatureKeys] = useState<string[]>([]);

  // Dynamic limits
  const [limitDefinitions, setLimitDefinitions] = useState<LimitDefinition[]>([]);
  const [limitValues, setLimitValues] = useState<Record<string, any>>({});

  // Feature category ordering
  const CATEGORY_ORDER = ['Core', 'Financial', 'Communication', 'Reporting', 'Attendance', 'Integration', 'Support', 'Customization', 'Advanced'];

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [planRes, featuresRes, limitsRes] = await Promise.all([
        planAPI.getPlan(id!),
        adminAPI.getFeatures(),
        adminAPI.getLimitDefinitions().catch(() => ({ data: { data: { limits: [] } } }))
      ]);

      const planData = planRes.data.data.plan;
      setPlan(planData);
      setName(planData.name);
      setDescription(planData.description || '');
      setPrice(planData.price);
      setBillingCycle(planData.billingCycle);
      setHighlights(planData.highlights || []);

      // Features
      const features = featuresRes.data?.data?.features || [];
      setAllFeatures(features);
      setSelectedFeatureKeys(planData.featureKeys || []);

      // Limits
      const limits = limitsRes.data?.data?.limits || [];
      setLimitDefinitions(limits);
      // Merge legacy limits and dynamicLimits for display
      const mergedLimits: Record<string, any> = {};
      limits.forEach((def: LimitDefinition) => {
        // Check dynamicLimits first, then legacy limits
        const dynamicValue = planData.dynamicLimits?.[def.key];
        const legacyValue = planData.limits?.[def.key];
        const value = dynamicValue !== undefined ? dynamicValue : (legacyValue ?? null);
        
        // For enum types, ensure value is an array and clean it
        if (def.valueType === 'enum' && value && !Array.isArray(value)) {
          mergedLimits[def.key] = typeof value === 'string' ? [value] : [];
        } else if (def.valueType === 'enum' && !value) {
          mergedLimits[def.key] = [];
        } else if (def.valueType === 'enum' && Array.isArray(value)) {
          // ✅ Clean up array: remove duplicates and extra quotes
          const cleanedArray = value
            .map(v => String(v).replace(/^['"]|['"]$/g, '').trim()) // Remove quotes
            .filter((v, index, self) => v && self.indexOf(v) === index); // Remove duplicates and empty
          mergedLimits[def.key] = cleanedArray;
        } else {
          mergedLimits[def.key] = value;
        }
      });
      setLimitValues(mergedLimits);
    } catch (error) {
      showToast.error('Failed to fetch plan');
      navigate('/admin/plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBasic = async () => {
    try {
      setSaving(true);
      await planAPI.updatePlan(id!, {
        name,
        description,
        price,
        billingCycle,
        highlights: highlights.filter(h => h.trim() !== '')
      });
      showToast.success('Plan updated successfully');
      fetchData();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to update plan');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLimits = async () => {
    try {
      setSaving(true);
      
      // ✅ Clean up limit values before saving
      const cleanedLimits: Record<string, any> = {};
      Object.keys(limitValues).forEach(key => {
        const value = limitValues[key];
        
        // Handle arrays (enum types)
        if (Array.isArray(value)) {
          const cleanedArray = value
            .map(v => String(v).replace(/^['"]|['"]$/g, '').trim()) // Remove quotes
            .filter((v, index, self) => v && self.indexOf(v) === index); // Remove duplicates
          cleanedLimits[key] = cleanedArray.length > 0 ? cleanedArray : [];
        } else {
          cleanedLimits[key] = value;
        }
      });
      
      await planAPI.updatePlanLimits(id!, cleanedLimits);
      showToast.success('Plan limits updated successfully');
      fetchData();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to update limits');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFeatures = async () => {
    try {
      setSaving(true);
      const response = await planAPI.updatePlanFeatures(id!, { featureKeys: selectedFeatureKeys });
      const merchantsAffected = response.data.data.merchantsAffected;
      showToast.success(`Features updated. ${merchantsAffected} church(es) affected.`);
      fetchData();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to update features');
    } finally {
      setSaving(false);
    }
  };

  const handleLimitChange = (key: string, value: string | string[] | number | null) => {
    setLimitValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleFeatureToggle = (key: string) => {
    setSelectedFeatureKeys(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  const handleAddHighlight = () => {
    setHighlights([...highlights, '']);
  };

  const handleRemoveHighlight = (index: number) => {
    setHighlights(highlights.filter((_, i) => i !== index));
  };

  const handleHighlightChange = (index: number, value: string) => {
    const newHighlights = [...highlights];
    newHighlights[index] = value;
    setHighlights(newHighlights);
  };

  // Group features by category
  const featuresByCategory = () => {
    const grouped: Record<string, FeatureDoc[]> = {};
    allFeatures.forEach(f => {
      const cat = f.category || 'Other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(f);
    });

    return CATEGORY_ORDER
      .filter(cat => grouped[cat]?.length > 0)
      .map(cat => ({ name: cat, features: grouped[cat] }))
      .concat(
        // Add any categories not in the predefined order
        Object.keys(grouped)
          .filter(cat => !CATEGORY_ORDER.includes(cat))
          .map(cat => ({ name: cat, features: grouped[cat] }))
      );
  };

  // Group limits by category
  const limitsByCategory = () => {
    const grouped: Record<string, LimitDefinition[]> = {};
    limitDefinitions.forEach(l => {
      const cat = l.category || 'Other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(l);
    });

    return CATEGORY_ORDER
      .filter(cat => grouped[cat]?.length > 0)
      .map(cat => ({ name: cat, limits: grouped[cat].sort((a, b) => a.displayOrder - b.displayOrder) }))
      .concat(
        Object.keys(grouped)
          .filter(cat => !CATEGORY_ORDER.includes(cat))
          .map(cat => ({ name: cat, limits: grouped[cat] }))
      );
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
              Edit Plan: {plan.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {plan.merchantCount} church(es) using this plan
            </p>
          </div>
        </div>
      </div>

      {/* Warning if merchants are using this plan */}
      {plan.merchantCount > 0 && activeTab === 'features' && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                Warning: Changes to features will affect {plan.merchantCount} active church(es)
              </p>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                All churches on this plan will have their features updated immediately.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-1">
          {(['basic', 'limits', 'features'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {/* Basic Info Tab */}
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Plan Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Price Amount
                </label>
                <input
                  type="number"
                  value={price.amount}
                  onChange={(e) => setPrice({ ...price, amount: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Billing Cycle
                </label>
                <select
                  value={billingCycle}
                  onChange={(e) => setBillingCycle(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="one-time">One-time</option>
                </select>
              </div>
            </div>

            {/* Highlights Editor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Plan Highlights
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Add bullet points to highlight key features of this plan
              </p>
              <div className="space-y-2">
                {highlights.length > 0 ? (
                  highlights.map((highlight, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={highlight}
                        onChange={(e) => handleHighlightChange(index, e.target.value)}
                        placeholder="e.g., Up to 500 members"
                        className="flex-1 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      <button
                        onClick={() => handleRemoveHighlight(index)}
                        className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        title="Remove highlight"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic py-2">
                    No highlights added yet
                  </p>
                )}
                <button
                  onClick={handleAddHighlight}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Highlight
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveBasic}
                disabled={saving}
                className="inline-flex items-center px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-medium rounded-lg transition-colors"
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
            </div>
          </div>
        )}

        {/* Limits Tab */}
        {activeTab === 'limits' && (
          <div className="space-y-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Leave empty or set to 0 for unlimited. These limits control what churches can create.
            </p>

            {limitDefinitions.length > 0 ? (
              limitsByCategory().map(category => (
                <div key={category.name}>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    {category.name}
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    {category.limits.map(limitDef => (
                      <div key={limitDef.key}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {limitDef.name}
                          {limitDef.unit && limitDef.unit !== 'count' && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                              ({limitDef.unit})
                            </span>
                          )}
                        </label>

                        {/* Numeric Limit Input */}
                        {limitDef.valueType === 'numeric' && (
                          <input
                            type="number"
                            value={limitValues[limitDef.key] ?? ''}
                            onChange={(e) => handleLimitChange(limitDef.key, e.target.value === '' ? null : parseInt(e.target.value))}
                            placeholder="Unlimited"
                            className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        )}

                        {/* Enum Checkboxes */}
                        {limitDef.valueType === 'enum' && limitDef.allowedValues && (
                          <div className="space-y-2">
                            {limitDef.allowedValues.map(value => (
                              <label key={value} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={(limitValues[limitDef.key] || []).includes(value)}
                                  onChange={(e) => {
                                    const currentValues = limitValues[limitDef.key] || [];
                                    if (e.target.checked) {
                                      handleLimitChange(limitDef.key, [...currentValues, value]);
                                    } else {
                                      handleLimitChange(limitDef.key, currentValues.filter((v: string) => v !== value));
                                    }
                                  }}
                                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{value}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        {limitDef.description && (
                          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{limitDef.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              // Fallback to legacy limits if no limit definitions exist yet
              <div className="grid grid-cols-2 gap-6">
                {plan.limits && Object.keys(plan.limits).map((key) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <input
                      type="number"
                      value={limitValues[key] ?? ''}
                      onChange={(e) => handleLimitChange(key, e.target.value)}
                      placeholder="Unlimited"
                      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleSaveLimits}
                disabled={saving}
                className="inline-flex items-center px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-medium rounded-lg transition-colors"
              >
                {saving ? (
                  <>
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save Limits
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Features Tab */}
        {activeTab === 'features' && (
          <div className="space-y-6">
            {allFeatures.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400 mb-3">
                  No features defined yet. Create features from the Feature Management page first.
                </p>
                <button
                  onClick={() => navigate('/admin/features')}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Go to Feature Management
                </button>
              </div>
            ) : (
              featuresByCategory().map((category) => (
                <div key={category.name}>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    {category.name}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {category.features.map((feature) => (
                      <div
                        key={feature.key}
                        className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                          selectedFeatureKeys.includes(feature.key)
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
                        }`}
                      >
                        <div className="flex-1 min-w-0 mr-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                              {feature.name}
                            </span>
                            {feature.beta && (
                              <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-semibold bg-yellow-100 text-yellow-800 rounded">
                                BETA
                              </span>
                            )}
                          </div>
                          {feature.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                              {feature.description}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => handleFeatureToggle(feature.key)}
                          className={`
                            relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0
                            ${selectedFeatureKeys.includes(feature.key)
                              ? 'bg-primary-600'
                              : 'bg-gray-300 dark:bg-gray-600'
                            }
                          `}
                        >
                          <span
                            className={`
                              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                              ${selectedFeatureKeys.includes(feature.key) ? 'translate-x-6' : 'translate-x-1'}
                            `}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}

            {allFeatures.length > 0 && (
              <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleSaveFeatures}
                  disabled={saving}
                  className="inline-flex items-center px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-medium rounded-lg transition-colors"
                >
                  {saving ? (
                    <>
                      <Loader className="w-5 h-5 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Save Features
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPlanEdit;
