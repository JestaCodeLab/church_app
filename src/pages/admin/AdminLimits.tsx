import React, { useState, useEffect } from 'react';
import { Loader, Save, Plus, Edit2, Trash2, X } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { showToast } from '../../utils/toasts';

interface LimitDefinition {
  _id: string;
  key: string;
  name: string;
  description?: string;
  category: string;
  valueType: 'numeric' | 'enum' | 'boolean';
  unit: string;
  defaultValue: number | null;
  allowedValues?: string[];
  defaultSelection?: string[];
  displayOrder: number;
  enabled: boolean;
}

interface FormData {
  key: string;
  name: string;
  description: string;
  category: string;
  valueType: 'numeric' | 'enum' | 'boolean';
  unit: string;
  defaultValue: string;
  allowedValues: string;
  defaultSelection: string;
  displayOrder: number;
}

const CATEGORIES = ['Core', 'Financial', 'Communication','Socials', 'Reporting', 'Attendance', 'Integration', 'Support', 'Customization', 'Advanced'];
const VALUE_TYPES = [
  { value: 'numeric', label: 'Numeric' },
  { value: 'enum', label: 'Enum (Select Options)' },
  { value: 'boolean', label: 'Boolean (Yes/No)' }
];
const UNITS = [
  { value: 'count', label: 'Count' },
  { value: 'GB', label: 'GB (Storage)' },
  { value: 'per-month', label: 'Per Month' },
  { value: 'credits', label: 'Credits' },
  { value: 'items', label: 'Items' }
];

const AdminLimits = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [limits, setLimits] = useState<LimitDefinition[]>([]);

  // Form modal
  const [showModal, setShowModal] = useState(false);
  const [editingLimit, setEditingLimit] = useState<LimitDefinition | null>(null);
  const [formData, setFormData] = useState<FormData>({
    key: '',
    name: '',
    description: '',
    category: 'Core',
    valueType: 'numeric',
    unit: 'count',
    defaultValue: '',
    allowedValues: '',
    defaultSelection: '',
    displayOrder: 0
  });

  useEffect(() => {
    fetchLimits();
  }, []);

  const fetchLimits = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getLimitDefinitions();
      setLimits(response.data?.data?.limits || []);
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to load limits');
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setEditingLimit(null);
    setFormData({
      key: '',
      name: '',
      description: '',
      category: 'Core',
      valueType: 'numeric',
      unit: 'count',
      defaultValue: '',
      allowedValues: '',
      defaultSelection: '',
      displayOrder: limits.length
    });
    setShowModal(true);
  };

  const handleEdit = (limit: LimitDefinition) => {
    setEditingLimit(limit);
    setFormData({
      key: limit.key,
      name: limit.name,
      description: limit.description || '',
      category: limit.category,
      valueType: limit.valueType || 'numeric',
      unit: limit.unit,
      defaultValue: limit.defaultValue !== null ? String(limit.defaultValue) : '',
      allowedValues: limit.allowedValues?.join(', ') || '',
      defaultSelection: limit.defaultSelection?.join(', ') || '',
      displayOrder: limit.displayOrder
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.key || !formData.name) {
        showToast.error('Key and Name are required');
        return;
      }

      // Validate enum limits
      if (formData.valueType === 'enum' && !formData.allowedValues.trim()) {
        showToast.error('Enum limits must have allowed values');
        return;
      }

      setSaving(true);

      const payload: any = {
        key: formData.key,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        valueType: formData.valueType,
        displayOrder: formData.displayOrder
      };

      // Handle numeric vs enum fields
      if (formData.valueType === 'numeric') {
        payload.unit = formData.unit;
        payload.defaultValue = formData.defaultValue === '' ? null : parseInt(formData.defaultValue);
        payload.allowedValues = [];
        payload.defaultSelection = [];
      } else if (formData.valueType === 'enum') {
        payload.unit = formData.unit;
        payload.allowedValues = formData.allowedValues
          .split(',')
          .map((v: string) => v.trim())
          .filter((v: string) => v.length > 0);
        payload.defaultSelection = formData.defaultSelection
          .split(',')
          .map((v: string) => v.trim())
          .filter((v: string) => v.length > 0);
        payload.defaultValue = null;
      } else if (formData.valueType === 'boolean') {
        payload.unit = 'count';
        payload.allowedValues = ['true', 'false'];
        payload.defaultValue = null;
      }

      if (editingLimit) {
        const { key, ...updateData } = payload;
        await adminAPI.updateLimitDefinition(editingLimit._id, updateData);
        showToast.success('Limit updated successfully');
      } else {
        await adminAPI.createLimitDefinition(payload);
        showToast.success('Limit created successfully');
      }

      setShowModal(false);
      await fetchLimits();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to save limit');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to disable this limit?')) return;

    try {
      setSaving(true);
      await adminAPI.deleteLimitDefinition(id);
      showToast.success('Limit disabled successfully');
      await fetchLimits();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to disable limit');
    } finally {
      setSaving(false);
    }
  };

  // Group by category
  const groupedLimits = CATEGORIES
    .filter(cat => limits.some(l => l.category === cat))
    .map(cat => ({
      name: cat,
      items: limits.filter(l => l.category === cat).sort((a, b) => a.displayOrder - b.displayOrder)
    }));

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
            Limit Definitions
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Define resource limits available for subscription plans
          </p>
        </div>
        <button
          onClick={handleNew}
          className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Limit
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-xl p-6 border border-primary-200 dark:border-primary-800">
          <div className="text-sm text-primary-600 dark:text-primary-400 font-medium">Total Limits</div>
          <div className="text-3xl font-bold text-primary-900 dark:text-primary-100 mt-2">{limits.length}</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 rounded-xl p-6 border border-green-200 dark:border-green-800">
          <div className="text-sm text-green-600 dark:text-green-400 font-medium">Categories</div>
          <div className="text-3xl font-bold text-green-900 dark:text-green-100 mt-2">
            {new Set(limits.map(l => l.category)).size}
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
          <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">Unit Types</div>
          <div className="text-3xl font-bold text-purple-900 dark:text-purple-100 mt-2">
            {new Set(limits.map(l => l.unit)).size}
          </div>
        </div>
      </div>

      {/* Limits by Category */}
      {limits.length === 0 ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 text-center">
          <p className="text-yellow-900 dark:text-yellow-100">
            No limit definitions yet. Click "Add Limit" to create your first one.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedLimits.map(category => (
            <div
              key={category.name}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {category.items.length} limit{category.items.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {category.items.map(limit => (
                    <div
                      key={limit._id}
                      className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {limit.name}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Key: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">{limit.key}</code>
                          </p>
                        </div>
                        <span className="flex-shrink-0 ml-2 px-2 py-0.5 text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded">
                          {limit.unit}
                        </span>
                      </div>

                      {limit.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                          {limit.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Default: {limit.defaultValue !== null ? limit.defaultValue : 'Unlimited'}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEdit(limit)}
                            className="p-1.5 text-primary-600 hover:bg-primary-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(limit._id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {editingLimit ? 'Edit Limit' : 'Add New Limit'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
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
                  placeholder="e.g., campaigns"
                  disabled={!!editingLimit}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 disabled:opacity-50"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Campaigns"
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
                  placeholder="Brief description of this limit"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
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

                {/* Value Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Value Type
                  </label>
                  <select
                    value={formData.valueType}
                    onChange={(e) => setFormData({ ...formData, valueType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  >
                    {VALUE_TYPES.map(vt => (
                      <option key={vt.value} value={vt.value}>{vt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Unit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Unit
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  >
                    {UNITS.map(u => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </div>

                {/* Default Value (for numeric) */}
                {formData.valueType === 'numeric' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Default Value
                    </label>
                    <input
                      type="number"
                      value={formData.defaultValue}
                      onChange={(e) => setFormData({ ...formData, defaultValue: e.target.value })}
                      placeholder="Unlimited"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Leave empty for unlimited</p>
                  </div>
                )}
              </div>

              {/* Allowed Values (for enum) */}
              {formData.valueType === 'enum' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Allowed Values *
                  </label>
                  <textarea
                    value={formData.allowedValues}
                    onChange={(e) => setFormData({ ...formData, allowedValues: e.target.value })}
                    placeholder="e.g., facebook, whatsapp, instagram&#10;(comma-separated)"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Enter comma-separated values</p>
                </div>
              )}

              {/* Default Selection (for enum) */}
              {formData.valueType === 'enum' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Default Selection
                  </label>
                  <input
                    type="text"
                    value={formData.defaultSelection}
                    onChange={(e) => setFormData({ ...formData, defaultSelection: e.target.value })}
                    placeholder="e.g., facebook, whatsapp"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Which values should be selected by default?</p>
                </div>
              )}

              <div>
                {/* Display Order */}
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {saving && <Loader className="w-4 h-4 animate-spin" />}
                {editingLimit ? 'Update' : 'Create'} Limit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLimits;
