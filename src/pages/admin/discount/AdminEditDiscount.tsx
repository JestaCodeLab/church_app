import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader, Percent, DollarSign, AlertCircle } from 'lucide-react';
import { discountAPI, planAPI } from '../../../services/api';
import { showToast } from '../../../utils/toasts';

const AdminEditDiscount = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [discount, setDiscount] = useState<any>(null);

  // Form state
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState<number>(0);
  const [applicablePlans, setApplicablePlans] = useState<string[]>([]);
  const [maxUses, setMaxUses] = useState<number | null>(null);
  const [maxUsesPerMerchant, setMaxUsesPerMerchant] = useState<number>(1);
  const [validFrom, setValidFrom] = useState<string>('');
  const [validUntil, setValidUntil] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [unlimitedUses, setUnlimitedUses] = useState(true);
  const [neverExpires, setNeverExpires] = useState(true);

  useEffect(() => {
    if (id) {
      fetchDiscount();
      fetchPlans();
    }
  }, [id]);

  const fetchDiscount = async () => {
    try {
      setLoading(true);
      const response = await discountAPI.getDiscount(id!);
      const discountData = response.data.data.discount;
      
      setDiscount(discountData);
      setCode(discountData.code);
      setDescription(discountData.description || '');
      setType(discountData.type);
      setValue(discountData.value);
      setApplicablePlans(discountData.applicablePlans || []);
      setMaxUses(discountData.maxUses);
      setMaxUsesPerMerchant(discountData.maxUsesPerMerchant);
      setValidFrom(discountData.validFrom ? new Date(discountData.validFrom).toISOString().split('T')[0] : '');
      setValidUntil(discountData.validUntil ? new Date(discountData.validUntil).toISOString().split('T')[0] : '');
      setIsActive(discountData.isActive);
      setUnlimitedUses(discountData.maxUses === null);
      setNeverExpires(discountData.validUntil === null);
    } catch (error) {
      showToast.error('Failed to load discount');
      navigate('/admin/discounts');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      setLoadingPlans(true);
      const response = await planAPI.getPlans();
      setPlans(response.data.data.plans);
    } catch (error) {
      showToast.error('Failed to load plans');
    } finally {
      setLoadingPlans(false);
    }
  };

  const handlePlanToggle = (slug: string) => {
    setApplicablePlans(prev => 
      prev.includes(slug)
        ? prev.filter(s => s !== slug)
        : [...prev, slug]
    );
  };

  const handleSubmit = async () => {
    // Validation
    if (!code.trim()) {
      showToast.error('Discount code is required');
      return;
    }

    if (value <= 0) {
      showToast.error('Discount value must be greater than 0');
      return;
    }

    if (type === 'percentage' && value > 100) {
      showToast.error('Percentage discount cannot exceed 100%');
      return;
    }

    if (!unlimitedUses && (!maxUses || maxUses <= 0)) {
      showToast.error('Please specify maximum uses or select unlimited');
      return;
    }

    try {
      setSaving(true);

      const updateData = {
        code: code.toUpperCase().trim(),
        description: description.trim(),
        type,
        value,
        applicablePlans,
        maxUses: unlimitedUses ? null : maxUses,
        maxUsesPerMerchant,
        validFrom: new Date(validFrom),
        validUntil: neverExpires ? null : new Date(validUntil),
        isActive
      };

      await discountAPI.updateDiscount(id!, updateData);
      showToast.success('Discount updated successfully!');
      navigate(`/admin/discounts/${id}`);
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to update discount');
    } finally {
      setSaving(false);
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
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(`/admin/discounts/${id}`)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Edit Discount: {discount?.code}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Update discount code settings
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

      {/* Warning if discount has been used */}
      {discount?.currentUses > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-900 dark:text-orange-200">
                This discount has been used {discount.currentUses} time{discount.currentUses !== 1 ? 's' : ''}
              </p>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                You cannot change the discount code itself, but you can modify other settings.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
        {/* Basic Info */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Basic Information
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Discount Code *
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                disabled={discount?.currentUses > 0}
                placeholder="e.g., SAVE25"
                className={`w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 uppercase ${
                  discount?.currentUses > 0 ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              />
              {discount?.currentUses > 0 && (
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  Code cannot be changed after first use
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Internal description (optional)"
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Discount Type & Value */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Discount Details
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Discount Type *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setType('percentage')}
                  className={`p-4 border-2 rounded-lg transition-colors ${
                    type === 'percentage'
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <Percent className="w-6 h-6 mx-auto mb-2 text-primary-600" />
                  <p className="font-medium text-gray-900 dark:text-gray-100">Percentage</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">% off the price</p>
                </button>

                <button
                  type="button"
                  onClick={() => setType('fixed')}
                  className={`p-4 border-2 rounded-lg transition-colors ${
                    type === 'fixed'
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <DollarSign className="w-6 h-6 mx-auto mb-2 text-primary-600" />
                  <p className="font-medium text-gray-900 dark:text-gray-100">Fixed Amount</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Flat amount off</p>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Discount Value *
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                  min="0"
                  max={type === 'percentage' ? 100 : undefined}
                  step={type === 'percentage' ? 1 : 0.01}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                  {type === 'percentage' ? '%' : 'GHS'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Applicable Plans */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Applicable Plans
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Select specific plans or leave all unchecked to apply to all plans
          </p>

          {loadingPlans ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 animate-spin text-primary-600" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {plans.map((plan) => (
                <label
                  key={plan._id}
                  className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={applicablePlans.includes(plan.slug)}
                    onChange={() => handlePlanToggle(plan.slug)}
                    className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {plan.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {plan.price.amount === 0 ? 'Free' : `${plan.price.currency} ${plan.price.amount}`}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Usage Limits */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Usage Limits
          </h3>

          <div className="space-y-4">
            <div>
              <label className="flex items-center space-x-3 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={unlimitedUses}
                  onChange={(e) => setUnlimitedUses(e.target.checked)}
                  className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Unlimited total uses
                </span>
              </label>

              {!unlimitedUses && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Maximum Total Uses
                  </label>
                  <input
                    type="number"
                    value={maxUses || ''}
                    onChange={(e) => setMaxUses(parseInt(e.target.value) || null)}
                    min="1"
                    placeholder="e.g., 100"
                    className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maximum Uses Per Church
              </label>
              <input
                type="number"
                value={maxUsesPerMerchant}
                onChange={(e) => setMaxUsesPerMerchant(parseInt(e.target.value) || 1)}
                min="1"
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Validity Period */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Validity Period
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Valid From
              </label>
              <input
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="flex items-center space-x-3 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={neverExpires}
                  onChange={(e) => setNeverExpires(e.target.checked)}
                  className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Never expires
                </span>
              </label>

              {!neverExpires && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valid Until
                  </label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    min={validFrom}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Active
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Discount can be used when active
              </p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default AdminEditDiscount;