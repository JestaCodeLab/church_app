import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { partnershipAPI } from '../../../../services/api';
import { showToast } from '../../../../utils/toasts';
import { formatCurrency, getMerchantCurrency } from '../../../../utils/currency';

interface Tier {
  _id?: string;
  name: string;
  minimumAmount: number;
  description?: string;
  color?: string;
}

interface Partner {
  _id: string;
  partnerType: 'member' | 'guest';
  partner: {
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
  };
  tier: Tier;
  commitment?: {
    amount: number;
    frequency: string;
  };
  status?: string;
}

interface EditPartnerModalProps {
  isOpen: boolean;
  partner: Partner | null;
  programmeId: string;
  tiers: Tier[];
  onClose: () => void;
  onSuccess: () => void;
}

const EditPartnerModal: React.FC<EditPartnerModalProps> = ({
  isOpen,
  partner,
  programmeId,
  tiers,
  onClose,
  onSuccess
}) => {
  const merchantCurrency = getMerchantCurrency();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    tierId: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (partner) {
      setFormData({
        firstName: partner.partner?.firstName || '',
        lastName: partner.partner?.lastName || '',
        email: partner.partner?.email || '',
        phone: partner.partner?.phone || '',
        tierId: partner.tier?._id || ''
      });
    }
  }, [partner, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!partner) return;

    try {
      setIsSubmitting(true);

      // Validate required fields
      if (partner.partnerType === 'guest') {
        if (!formData.firstName || !formData.lastName || !formData.phone) {
          showToast.error('First name, last name, and phone are required');
          return;
        }
      }

      if (!formData.tierId) {
        showToast.error('Tier is required');
        return;
      }

      // Build update payload - only include fields that can be edited
      const updateData: any = {
        tierId: formData.tierId
      };

      // For guests, include personal details
      if (partner.partnerType === 'guest') {
        updateData.firstName = formData.firstName;
        updateData.lastName = formData.lastName;
        updateData.email = formData.email;
        updateData.phone = formData.phone;
      } else {
        // For members, only include email
        updateData.email = formData.email;
      }

      await partnershipAPI.editPartner(programmeId, partner._id, updateData);
      showToast.success('Partner updated successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to update partner');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !partner) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Partner</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Guest Partner Fields - disabled for members */}
          {partner.partnerType === 'guest' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </>
          )}

          {/* Member Partner Info - read-only */}
          {partner.partnerType === 'member' && (
            <>
              <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formData.firstName} {formData.lastName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{formData.phone}</p>
                {formData.email && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{formData.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </>
          )}

          {/* Tier Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tier
            </label>
            <select
              name="tierId"
              value={formData.tierId}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-1 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select Tier</option>
              {tiers.map(tier => (
                <option key={tier._id} value={tier._id}>
                  {tier.name} - {formatCurrency(tier.minimumAmount, merchantCurrency)} min
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPartnerModal;
