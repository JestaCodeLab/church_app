import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader, Plus, X } from 'lucide-react';
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

const AdminCreatePlan = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'limits' | 'features'>('basic');

  // Basic Info
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState({ amount: 0, currency: 'GHS' });
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly' | 'one-time'>('monthly');
  const [type, setType] = useState<'free' | 'paid' | 'enterprise' | 'custom'>('paid');
  const [trialDays, setTrialDays] = useState(0);
  const [isPublic, setIsPublic] = useState(true);
  const [isActive, setIsActive] = useState(true);
  
  // Highlights
  const [highlights, setHighlights] = useState<string[]>(['']);

  // Limits
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

  // Features
  const [features, setFeatures] = useState<PlanFeatures>({
    memberManagement: true,
    branchManagement: true,
    eventManagement: false,
    sermonManagement: false,
    financialManagement: false,
    donationTracking: false,
    emailCommunications: false,
    smsCommunications: false,
    bulkMessaging: false,
    basicReports: true,
    advancedReports: false,
    customReports: false,
    dataExport: false,
    apiAccess: false,
    webhooks: false,
    thirdPartyIntegrations: false,
    emailSupport: true,
    prioritySupport: false,
    dedicatedAccountManager: false,
    phoneSupport: false,
    customBranding: false,
    customDomain: false,
    whiteLabel: false,
    multiLanguage: false,
    mobileApp: false,
    automatedWorkflows: false
  });

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value);
    // Auto-generate slug if it hasn't been manually edited
    const autoSlug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    setSlug(autoSlug);
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

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      showToast.error('Plan name is required');
      return;
    }

    if (!slug.trim()) {
      showToast.error('Plan slug is required');
      return;
    }

    if (price.amount < 0) {
      showToast.error('Price cannot be negative');
      return;
    }

    try {
      setSaving(true);

      const planData = {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
        price,
        billingCycle,
        type,
        trialDays: trialDays || 0,
        limits,
        features,
        highlights: highlights.filter(h => h.trim() !== ''),
        isPublic,
        isActive
      };

      await planAPI.createPlan(planData);
      showToast.success('Plan created successfully!');
      navigate('/admin/plans');
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to create plan');
    } finally {
      setSaving(false);
    }
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
              Create New Plan
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Set up a new subscription plan with custom limits and features
            </p>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="inline-flex items-center px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-medium rounded-lg transition-colors"
        >
          {saving ? (
            <>
              <Loader className="w-5 h-5 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Create Plan
            </>
          )}
        </button>
      </div>

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
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Plan Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Professional Plan"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Slug (URL-friendly) *
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g., professional"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Auto-generated from name, or customize
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe this plan and who it's for..."
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Price Amount
                </label>
                <input
                  type="number"
                  value={price.amount}
                  onChange={(e) => setPrice({ ...price, amount: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Currency
                </label>
                <select
                  value={price.currency}
                  onChange={(e) => setPrice({ ...price, currency: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="GHS">GHS (₵)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Billing Cycle
                </label>
                <select
                  value={billingCycle}
                  onChange={(e) => setBillingCycle(e.target.value as any)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="one-time">One-time</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Plan Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                  <option value="enterprise">Enterprise</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Trial Days
                </label>
                <input
                  type="number"
                  value={trialDays}
                  onChange={(e) => setTrialDays(parseInt(e.target.value) || 0)}
                  min="0"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Highlights */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Plan Highlights
              </label>
              <div className="space-y-2">
                {highlights.map((highlight, index) => (
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
                      className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={handleAddHighlight}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Highlight
                </button>
              </div>
            </div>

            {/* Toggles */}
            <div className="flex items-center space-x-8 pt-4 border-t border-gray-200 dark:border-gray-700">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Public (Visible to customers)
                </span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Active
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Limits Tab */}
        {activeTab === 'limits' && (
          <div className="space-y-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Set resource limits for this plan. Leave empty or set to 0 for unlimited.
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
                    min="0"
                    className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              ))}
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
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCreatePlan;