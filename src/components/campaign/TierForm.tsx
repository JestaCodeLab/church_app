import React, { useState } from 'react';
import { Plus, Edit2, Trash2, GripVertical } from 'lucide-react';

interface Tier {
  _id?: string;
  name: string;
  minimumAmount: number;
  description: string;
  benefits: string[];
  badgeColor: string;
  displayOrder: number;
}

interface TierFormProps {
  tiers: Tier[];
  onTiersChange: (tiers: Tier[]) => void;
  currency?: string;
  disabled?: boolean;
}

const badgeColors = [
  'gray', 'blue', 'emerald', 'purple', 'amber', 'indigo'
];

/**
 * Tier Form Component
 * Manages adding, editing, and reordering donation tiers
 */
const TierForm: React.FC<TierFormProps> = ({
  tiers,
  onTiersChange,
  currency = 'GHS',
  disabled = false
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Tier> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Tier>({
    name: '',
    minimumAmount: 0,
    description: '',
    benefits: [],
    badgeColor: 'gray',
    displayOrder: tiers.length
  });

  const handleAddTier = () => {
    if (!formData.name || formData.minimumAmount <= 0) {
      alert('Please fill in tier name and minimum amount');
      return;
    }

    const newTier: Tier = {
      ...formData,
      _id: `temp-${Date.now()}`,
      displayOrder: tiers.length
    };

    onTiersChange([...tiers, newTier]);
    setFormData({
      name: '',
      minimumAmount: 0,
      description: '',
      benefits: [],
      badgeColor: 'gray',
      displayOrder: tiers.length + 1
    });
    setShowForm(false);
  };

  const handleEditTier = (id: string | undefined) => {
    if (!id) return;

    const tierIndex = tiers.findIndex(t => t._id === id);
    if (tierIndex === -1) return;

    if (!editData?.name || editData?.minimumAmount! <= 0) {
      alert('Please fill in tier name and minimum amount');
      return;
    }

    const updatedTiers = [...tiers];
    updatedTiers[tierIndex] = {
      ...updatedTiers[tierIndex],
      ...editData
    };

    onTiersChange(updatedTiers);
    setEditingId(null);
    setEditData(null);
  };

  const handleDeleteTier = (id: string | undefined) => {
    if (!id) return;
    onTiersChange(tiers.filter(t => t._id !== id));
  };

  const handleMoveTier = (fromIndex: number, toIndex: number) => {
    const newTiers = [...tiers];
    const [movedTier] = newTiers.splice(fromIndex, 1);
    newTiers.splice(toIndex, 0, movedTier);

    // Update display order
    newTiers.forEach((tier, index) => {
      tier.displayOrder = index;
    });

    onTiersChange(newTiers);
  };

  const handleBenefitChange = (
    tierId: string | undefined,
    benefits: string[],
    isNewTier: boolean = false
  ) => {
    if (isNewTier) {
      setFormData({ ...formData, benefits });
    } else if (editingId === tierId) {
      setEditData({ ...editData, benefits } as Partial<Tier>);
    }
  };

  const addBenefit = (isNewTier: boolean = false) => {
    if (isNewTier) {
      setFormData({
        ...formData,
        benefits: [...formData.benefits, '']
      });
    } else {
      setEditData({
        ...editData,
        benefits: [...(editData?.benefits || []), '']
      } as Partial<Tier>);
    }
  };

  const removeBenefit = (index: number, isNewTier: boolean = false) => {
    if (isNewTier) {
      const newBenefits = formData.benefits.filter((_, i) => i !== index);
      setFormData({ ...formData, benefits: newBenefits });
    } else {
      const newBenefits = (editData?.benefits || []).filter((_, i) => i !== index);
      setEditData({ ...editData, benefits: newBenefits } as Partial<Tier>);
    }
  };

  return (
    <div className="space-y-4">
      {/* Add Tier Button */}
      {!showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          disabled={disabled}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Add Tier
        </button>
      )}

      {/* New Tier Form */}
      {showForm && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Create New Tier</h3>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tier Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Silver Partner"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Minimum Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Minimum Amount ({currency}) *
              </label>
              <input
                type="number"
                value={formData.minimumAmount || ''}
                onChange={(e) => setFormData({ ...formData, minimumAmount: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                onWheel={e => (e.target as HTMLInputElement).blur()}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500"
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
                placeholder="Optional description for this tier"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Benefits */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Benefits
              </label>
              <div className="space-y-2 mb-2">
                {formData.benefits.map((benefit, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={benefit}
                      onChange={(e) => {
                        const newBenefits = [...formData.benefits];
                        newBenefits[index] = e.target.value;
                        setFormData({ ...formData, benefits: newBenefits });
                      }}
                      placeholder="Benefit"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeBenefit(index, true)}
                      className="text-red-600 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => addBenefit(true)}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                + Add Benefit
              </button>
            </div>

            {/* Badge Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Badge Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {badgeColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, badgeColor: color })}
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.badgeColor === color
                        ? 'border-primary-500'
                        : 'border-gray-300 dark:border-gray-600'
                    } ${getBgColor(color)}`}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddTier}
                className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                Create Tier
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData({
                    name: '',
                    minimumAmount: 0,
                    description: '',
                    benefits: [],
                    badgeColor: 'gray',
                    displayOrder: tiers.length
                  });
                }}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tiers List */}
      {tiers.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Tiers ({tiers.length})
          </h3>
          {tiers.map((tier, index) => (
            <div
              key={tier._id}
              className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              {editingId === tier._id ? (
                // Edit Mode
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tier Name
                    </label>
                    <input
                      type="text"
                      value={editData?.name || ''}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value } as Partial<Tier>)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Minimum Amount
                    </label>
                    <input
                      type="number"
                      value={editData?.minimumAmount || 0}
                      onChange={(e) => setEditData({ ...editData, minimumAmount: parseFloat(e.target.value) || 0 } as Partial<Tier>)}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={editData?.description || ''}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value } as Partial<Tier>)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>

                  {/* Benefits Edit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Benefits
                    </label>
                    <div className="space-y-2 mb-2">
                      {(editData?.benefits || []).map((benefit, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="text"
                            value={benefit}
                            onChange={(e) => {
                              const newBenefits = [...(editData?.benefits || [])];
                              newBenefits[idx] = e.target.value;
                              setEditData({ ...editData, benefits: newBenefits } as Partial<Tier>);
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => removeBenefit(idx)}
                            className="text-red-600 hover:text-red-700"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => addBenefit()}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      + Add Benefit
                    </button>
                  </div>

                  {/* Save/Cancel */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditTier(tier._id)}
                      className="flex-1 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded text-sm"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setEditData(null);
                      }}
                      className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // Display Mode
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {tier.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {currency} {tier.minimumAmount.toLocaleString()} minimum
                    </p>
                    {tier.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {tier.description}
                      </p>
                    )}
                    {tier.benefits.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {tier.benefits.map((benefit, idx) => (
                          <li key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                            ✓ {benefit}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 ml-4">
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => handleMoveTier(index, index - 1)}
                        disabled={disabled}
                        className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50"
                      >
                        ▲
                      </button>
                    )}
                    {index < tiers.length - 1 && (
                      <button
                        type="button"
                        onClick={() => handleMoveTier(index, index + 1)}
                        disabled={disabled}
                        className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50"
                      >
                        ▼
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(tier._id);
                        setEditData({ ...tier });
                      }}
                      disabled={disabled}
                      className="p-1 text-primary-600 hover:text-primary-700 disabled:opacity-50"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTier(tier._id)}
                      disabled={disabled}
                      className="p-1 text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function getBgColor(color: string): string {
  const colors: Record<string, string> = {
    gray: 'bg-gray-300',
    blue: 'bg-blue-400',
    emerald: 'bg-emerald-400',
    purple: 'bg-purple-400',
    amber: 'bg-amber-400',
    indigo: 'bg-indigo-400'
  };
  return colors[color] || colors.gray;
}

export default TierForm;
