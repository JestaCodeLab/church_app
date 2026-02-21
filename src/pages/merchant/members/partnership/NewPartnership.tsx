import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, GripVertical, Upload, X, Image as ImageIcon } from 'lucide-react';
import { partnershipAPI } from '../../../../services/api';
import { showToast } from '../../../../utils/toasts';
import { getMerchantCurrency } from '../../../../utils/currency';

interface Tier {
  name: string;
  minimumAmount: number;
  description: string;
  benefits: string[];
  badgeColor: string;
  displayOrder: number;
}

interface FormField {
  fieldName: string;
  fieldLabel: string;
  fieldType: 'text' | 'email' | 'phone' | 'number' | 'textarea' | 'select' | 'date';
  required: boolean;
  options?: string[];
}

const NewPartnership = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const merchantCurrency = getMerchantCurrency();

  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetAmount: '',
    startDate: '',
    endDate: '',
    status: 'draft' as 'draft' | 'active' | 'paused' | 'completed',
    showTargetAmount: true,
  });

  const [tiers, setTiers] = useState<Tier[]>([
    {
      name: 'Bronze',
      minimumAmount: 100,
      description: 'Bronze tier partnership',
      benefits: ['Recognition in newsletter'],
      badgeColor: '#CD7F32',
      displayOrder: 1,
    },
    {
      name: 'Silver',
      minimumAmount: 500,
      description: 'Silver tier partnership',
      benefits: ['Recognition in newsletter', 'Certificate of appreciation'],
      badgeColor: '#C0C0C0',
      displayOrder: 2,
    },
    {
      name: 'Gold',
      minimumAmount: 1000,
      description: 'Gold tier partnership',
      benefits: ['Recognition in newsletter', 'Certificate of appreciation', 'Special mention in events'],
      badgeColor: '#FFD700',
      displayOrder: 3,
    },
  ]);

  const [registrationForm, setRegistrationForm] = useState<FormField[]>([
    { fieldName: 'fullName', fieldLabel: 'Full Name', fieldType: 'text', required: true },
    { fieldName: 'phone', fieldLabel: 'Phone Number', fieldType: 'phone', required: true },
    { fieldName: 'email', fieldLabel: 'Email Address', fieldType: 'email', required: false },
  ]);

  useEffect(() => {
    if (isEditMode) {
      loadProgramme();
    }
  }, [id]);

  const loadProgramme = async () => {
    try {
      setLoading(true);
      const response = await partnershipAPI.getOne(id!);
      const programme = response.data.data.programme;

      setFormData({
        name: programme.name || '',
        description: programme.description || '',
        targetAmount: programme.goal?.targetAmount?.toString() || '',
        startDate: programme.dates?.startDate ? new Date(programme.dates.startDate).toISOString().split('T')[0] : '',
        endDate: programme.dates?.endDate ? new Date(programme.dates.endDate).toISOString().split('T')[0] : '',
        status: programme.status || 'draft',
        showTargetAmount: programme.publicSettings?.showTargetAmount !== undefined ? programme.publicSettings.showTargetAmount : true,
      });

      if (programme.tiers && programme.tiers.length > 0) {
        setTiers(programme.tiers.map((tier: any, index: number) => ({
          name: tier.name,
          minimumAmount: tier.minimumAmount,
          description: tier.description || '',
          benefits: tier.benefits || [],
          badgeColor: tier.color || '#000000', // Map color to badgeColor
          displayOrder: tier.displayOrder || index + 1,
        })));
      }

      if (programme.registrationForm && programme.registrationForm.length > 0) {
        setRegistrationForm(programme.registrationForm);
      }

      // Load existing cover image
      if (programme.coverImage?.url) {
        setImagePreview(programme.coverImage.url);
      }
    } catch (error: any) {
      showToast.error('Failed to load partnership programme');
      navigate('/members/partnership');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast.error('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        showToast.error('Image size should be less than 5MB');
        return;
      }

      setImageFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleAddTier = () => {
    setTiers(prev => [...prev, {
      name: '',
      minimumAmount: 0,
      description: '',
      benefits: [],
      badgeColor: '#000000',
      displayOrder: prev.length + 1,
    }]);
  };

  const handleRemoveTier = (index: number) => {
    if (tiers.length <= 1) {
      showToast.error('At least one tier is required');
      return;
    }
    setTiers(prev => prev.filter((_, i) => i !== index));
  };

  const handleTierChange = (index: number, field: keyof Tier, value: any) => {
    setTiers(prev => prev.map((tier, i) =>
      i === index ? { ...tier, [field]: value } : tier
    ));
  };

  const handleTierBenefitChange = (tierIndex: number, benefitIndex: number, value: string) => {
    setTiers(prev => prev.map((tier, i) => {
      if (i === tierIndex) {
        const newBenefits = [...tier.benefits];
        newBenefits[benefitIndex] = value;
        return { ...tier, benefits: newBenefits };
      }
      return tier;
    }));
  };

  const handleAddTierBenefit = (tierIndex: number) => {
    setTiers(prev => prev.map((tier, i) =>
      i === tierIndex ? { ...tier, benefits: [...tier.benefits, ''] } : tier
    ));
  };

  const handleRemoveTierBenefit = (tierIndex: number, benefitIndex: number) => {
    setTiers(prev => prev.map((tier, i) => {
      if (i === tierIndex) {
        return { ...tier, benefits: tier.benefits.filter((_, bi) => bi !== benefitIndex) };
      }
      return tier;
    }));
  };

  const handleAddFormField = () => {
    setRegistrationForm(prev => [...prev, {
      fieldName: '',
      fieldLabel: '',
      fieldType: 'text',
      required: false,
    }]);
  };

  const handleRemoveFormField = (index: number) => {
    // Don't allow removing required default fields
    const field = registrationForm[index];
    if (['fullName', 'phone', 'email'].includes(field.fieldName)) {
      showToast.error('Cannot remove default fields');
      return;
    }
    setRegistrationForm(prev => prev.filter((_, i) => i !== index));
  };

  const handleFormFieldChange = (index: number, field: keyof FormField, value: any) => {
    setRegistrationForm(prev => prev.map((formField, i) =>
      i === index ? { ...formField, [field]: value } : formField
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      showToast.error('Programme name is required');
      return;
    }

    if (!formData.targetAmount || parseFloat(formData.targetAmount) <= 0) {
      showToast.error('Target amount must be greater than 0');
      return;
    }

    if (tiers.length === 0) {
      showToast.error('At least one tier is required');
      return;
    }

    // Validate tiers
    for (const tier of tiers) {
      if (!tier.name.trim()) {
        showToast.error('All tiers must have a name');
        return;
      }
      if (tier.minimumAmount <= 0) {
        showToast.error('Tier minimum amount must be greater than 0');
        return;
      }
    }

    // Validate form fields
    for (const field of registrationForm) {
      if (!field.fieldName.trim() || !field.fieldLabel.trim()) {
        showToast.error('All form fields must have a name and label');
        return;
      }
    }

    try {
      setLoading(true);

      const formPayload = new FormData();
      formPayload.append('name', formData.name);
      formPayload.append('description', formData.description);
      formPayload.append('goal', JSON.stringify({
        targetAmount: parseFloat(formData.targetAmount),
        currency: merchantCurrency,
      }));
      formPayload.append('dates', JSON.stringify({
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
      }));
      formPayload.append('tiers', JSON.stringify(tiers.map((tier, index) => ({
        name: tier.name,
        minimumAmount: tier.minimumAmount,
        description: tier.description,
        benefits: tier.benefits,
        color: tier.badgeColor, // Map badgeColor to color for the model
        displayOrder: index + 1,
      }))));
      formPayload.append('registrationForm', JSON.stringify(registrationForm));
      formPayload.append('status', formData.status);
      formPayload.append('publicSettings', JSON.stringify({
        showTargetAmount: formData.showTargetAmount
      }));

      // Add image if selected
      if (imageFile) {
        formPayload.append('coverImage', imageFile);
      }

      if (isEditMode) {
        await partnershipAPI.update(id!, formPayload);
        showToast.success('Partnership programme updated successfully');
      } else {
        await partnershipAPI.create(formPayload);
        showToast.success('Partnership programme created successfully');
      }

      navigate('/members/partnership');
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to save partnership programme');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/members/partnership')}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Programmes
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {isEditMode ? 'Edit Partnership Programme' : 'New Partnership Programme'}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Create a partnership programme with tiered giving levels
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Basic Information</h2>

          <div className="space-y-4">
            {/* Cover Image Upload */}
            <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                {/* Image Preview */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Upload Controls */}
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                    Cover Image
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    Upload a cover image for this partnership programme (JPG, PNG, max 5MB)
                  </p>
                  <div className="flex items-center space-x-3">
                    <label className="cursor-pointer">
                      <span className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                        <Upload className="w-4 h-4 mr-2" />
                        Choose Image
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    {imageFile && (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {imageFile.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Programme Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-colors"
                placeholder="e.g., 2024 Building Fund Partnership"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-colors"
                placeholder="Describe the partnership programme..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Target Amount ({merchantCurrency}) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="targetAmount"
                  value={formData.targetAmount}
                  onChange={handleChange}
                  onWheel={
                    (e) => (e.target as HTMLInputElement).blur()
                  }
                  required
                  min="1"
                  step="0.01"
                  className="mt-1 block w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-colors"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-colors"
                />
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showTargetAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, showTargetAmount: e.target.checked }))}
                  className="w-4 h-4 text-primary-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Show Target Amount on Public Registration Page
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Display the fundraising goal and progress bar to the public
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Tiers */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Partnership Tiers</h2>
            <button
              type="button"
              onClick={handleAddTier}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 dark:text-primary-300 bg-purple-100 dark:bg-purple-900/20 hover:bg-purple-200 dark:hover:bg-purple-900/30"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Tier
            </button>
          </div>

          <div className="space-y-4">
            {tiers.map((tier, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-5 h-5 text-gray-400" />
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">Tier {index + 1}</h3>
                  </div>
                  {tiers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTier(index)}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tier Name</label>
                    <input
                      type="text"
                      value={tier.name}
                      onChange={(e) => handleTierChange(index, 'name', e.target.value)}
                      className="mt-1 block w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-colors"
                      placeholder="e.g., Gold"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Minimum Amount ({merchantCurrency})
                    </label>
                    <input
                      type="number"
                      value={tier.minimumAmount}
                      onChange={(e) => handleTierChange(index, 'minimumAmount', parseFloat(e.target.value) || 0)}
                      className="mt-1 block w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-colors"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Badge Color</label>
                    <input
                      type="color"
                      value={tier.badgeColor}
                      onChange={(e) => handleTierChange(index, 'badgeColor', e.target.value)}
                      className="mt-1 block w-full h-10 px-2 py-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                    <input
                      type="text"
                      value={tier.description}
                      onChange={(e) => handleTierChange(index, 'description', e.target.value)}
                      className="mt-1 block w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-colors"
                      placeholder="Tier description"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Benefits</label>
                    <button
                      type="button"
                      onClick={() => handleAddTierBenefit(index)}
                      className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-purple-300"
                    >
                      + Add Benefit
                    </button>
                  </div>
                  <div className="space-y-2">
                    {tier.benefits.map((benefit, benefitIndex) => (
                      <div key={benefitIndex} className="flex gap-2">
                        <input
                          type="text"
                          value={benefit}
                          onChange={(e) => handleTierBenefitChange(index, benefitIndex, e.target.value)}
                          className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-colors"
                          placeholder="Benefit description"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveTierBenefit(index, benefitIndex)}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Registration Form Fields */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Registration Form</h2>
            <button
              type="button"
              onClick={handleAddFormField}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 dark:text-primary-300 bg-purple-100 dark:bg-purple-900/20 hover:bg-purple-200 dark:hover:bg-purple-900/30"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Field
            </button>
          </div>

          <div className="space-y-3">
            {registrationForm.map((field, index) => (
              <div key={index} className="flex gap-3 items-start border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input
                    type="text"
                    value={field.fieldName}
                    onChange={(e) => handleFormFieldChange(index, 'fieldName', e.target.value)}
                    placeholder="Field name (e.g., fullName)"
                    disabled={['fullName', 'phone', 'email'].includes(field.fieldName)}
                    className="px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <input
                    type="text"
                    value={field.fieldLabel}
                    onChange={(e) => handleFormFieldChange(index, 'fieldLabel', e.target.value)}
                    placeholder="Field label"
                    className="px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-colors"
                  />
                  <select
                    value={field.fieldType}
                    onChange={(e) => handleFormFieldChange(index, 'fieldType', e.target.value)}
                    className="px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-colors"
                  >
                    <option value="text">Text</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="number">Number</option>
                    <option value="textarea">Textarea</option>
                    <option value="select">Select</option>
                    <option value="date">Date</option>
                  </select>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => handleFormFieldChange(index, 'required', e.target.checked)}
                      className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Required</span>
                  </label>
                </div>
                {!['fullName', 'phone', 'email'].includes(field.fieldName) && (
                  <button
                    type="button"
                    onClick={() => handleRemoveFormField(index)}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 mt-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/members/partnership')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEditMode ? 'Update Programme' : 'Create Programme'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewPartnership;
