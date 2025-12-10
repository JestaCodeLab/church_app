import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader, AlertCircle, Plus, X } from 'lucide-react';
import { planAPI } from '../../../services/api';
import { showToast } from '../../../utils/toasts';

interface PlanLimits {
  members: number | null;
  branches: number | null;
  events: number | null;
  sermons: number | null;
  storage: number | null;
  users: number | null;
  smsCredits: number | null;
  emailCredits: number | null;
}

interface PlanFeatures {
  [key: string]: boolean;
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
  const [limits, setLimits] = useState<PlanLimits>({
    members: null,
    branches: null,
    events: null,
    sermons: null,
    storage: null,
    users: null,
    smsCredits: null,
    emailCredits: null
  });
  const [features, setFeatures] = useState<PlanFeatures>({});

  useEffect(() => {
    if (id) {
      fetchPlan();
    }
  }, [id]);

  const fetchPlan = async () => {
    try {
      setLoading(true);
      const response = await planAPI.getPlan(id!);
      const planData = response.data.data.plan;
      
      setPlan(planData);
      setName(planData.name);
      setDescription(planData.description || '');
      setPrice(planData.price);
      setBillingCycle(planData.billingCycle);
      setHighlights(planData.highlights || []);
      setLimits(planData.limits);
      setFeatures(planData.features);
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
      fetchPlan();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to update plan');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLimits = async () => {
    try {
      setSaving(true);
      await planAPI.updatePlanLimits(id!, limits);
      showToast.success('Plan limits updated successfully');
      fetchPlan();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to update limits');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFeatures = async () => {
    try {
      setSaving(true);
      const response = await planAPI.updatePlanFeatures(id!, features);
      const merchantsAffected = response.data.data.merchantsAffected;
      showToast.success(`Features updated. ${merchantsAffected} church(es) affected.`);
      fetchPlan();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to update features');
    } finally {
      setSaving(false);
    }
  };

  const handleLimitChange = (key: keyof PlanLimits, value: string) => {
    setLimits(prev => ({
      ...prev,
      [key]: value === '' ? null : parseInt(value)
    }));
  };

  const handleFeatureToggle = (key: string) => {
    setFeatures(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
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

  const featureCategories = [
    {
      name: 'Core Features',
      features: [
        { key: 'memberManagement', label: 'Member Management' },
        { key: 'branchManagement', label: 'Branch Management' },
        { key: 'eventManagement', label: 'Event Management' },
        { key: 'sermonManagement', label: 'Sermon Management' }
      ]
    },
    {
      name: 'Financial',
      features: [
        { key: 'financialManagement', label: 'Financial Management' },
        { key: 'donationTracking', label: 'Donation Tracking' }
      ]
    },
    {
      name: 'Communications',
      features: [
        { key: 'emailCommunications', label: 'Email Communications' },
        { key: 'smsCommunications', label: 'SMS Communications' },
        { key: 'bulkMessaging', label: 'Bulk Messaging' }
      ]
    },
    {
      name: 'Reporting',
      features: [
        { key: 'basicReports', label: 'Basic Reports' },
        { key: 'advancedReports', label: 'Advanced Reports' },
        { key: 'customReports', label: 'Custom Reports' },
        { key: 'dataExport', label: 'Data Export' }
      ]
    },
    {
      name: 'Integration',
      features: [
        { key: 'apiAccess', label: 'API Access' },
        { key: 'webhooks', label: 'Webhooks' },
        { key: 'thirdPartyIntegrations', label: 'Third Party Integrations' }
      ]
    },
    {
      name: 'Support',
      features: [
        { key: 'emailSupport', label: 'Email Support' },
        { key: 'prioritySupport', label: 'Priority Support' },
        { key: 'dedicatedAccountManager', label: 'Dedicated Account Manager' },
        { key: 'phoneSupport', label: 'Phone Support' }
      ]
    },
    {
      name: 'Customization',
      features: [
        { key: 'customBranding', label: 'Custom Branding' },
        { key: 'customDomain', label: 'Custom Domain' },
        { key: 'whiteLabel', label: 'White Label' }
      ]
    },
    {
      name: 'Advanced',
      features: [
        { key: 'multiLanguage', label: 'Multi-Language' },
        { key: 'mobileApp', label: 'Mobile App' },
        { key: 'automatedWorkflows', label: 'Automated Workflows' }
      ]
    }
  ];

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

            <div className="grid grid-cols-2 gap-6">
              {Object.keys(limits).map((key) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <input
                    type="number"
                    value={limits[key as keyof PlanLimits] ?? ''}
                    onChange={(e) => handleLimitChange(key as keyof PlanLimits, e.target.value)}
                    placeholder="Unlimited"
                    className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              ))}
            </div>

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
            {featureCategories.map((category) => (
              <div key={category.name}>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  {category.name}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {category.features.map((feature) => (
                    <label
                      key={feature.key}
                      className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={features[feature.key] || false}
                        onChange={() => handleFeatureToggle(feature.key)}
                        className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {feature.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

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
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPlanEdit;