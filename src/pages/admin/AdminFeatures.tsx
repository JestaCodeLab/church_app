import React, { useState, useEffect } from 'react';
import { Crown, Loader, Plus, Edit2, Trash2, X, RotateCw } from 'lucide-react';
import api, { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface Category {
  _id: string;
  slug: string;
  name: string;
  order?: number;
}

interface Feature {
  _id?: string;
  key: string;
  name: string;
  category: string | Category;
  categoryName?: string;
  icon?: string;
  description?: string;
  beta?: boolean;
  enabled?: boolean;
  availableInTiers?: string[];
  dependencies?: string[];
}

interface GroupedFeatures {
  [categoryId: string]: {
    categoryId: string;
    categoryName: string;
    categorySlug: string;
    features: Feature[];
  };
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

const TIERS = ['starter', 'basic', 'growth', 'enterprise'];

const AdminFeatures = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [groupedFeatures, setGroupedFeatures] = useState<GroupedFeatures>({});
  const [categories, setCategories] = useState<Category[]>([]);

  // Feature form modal
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [formData, setFormData] = useState<FeatureFormData>({
    key: '',
    name: '',
    description: '',
    category: '',
    icon: '',
    beta: false,
    availableInTiers: [],
    dependencies: []
  });

  // Delete confirmation modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [featureToDelete, setFeatureToDelete] = useState<Feature | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch features without plans (AdminFeatures only needs features)
      const response = await api.get('/admin/features?includePlans=false');
      const featuresData = response.data?.data?.features || [];

      // Fetch permission categories to populate the categories list
      const categoryResponse = await adminAPI.getAllPermissionCategories();
      const cats = categoryResponse?.data?.data || [];

      if (cats.length === 0) {
        console.log('No categories found, initializing defaults...');
        try {
          await adminAPI.initializePermissionCategories();
          const reinitResponse = await adminAPI.getAllPermissionCategories();
          const reinitCats = reinitResponse?.data?.data || [];
          setCategories(reinitCats.sort((a: Category, b: Category) => (a.order || 0) - (b.order || 0)));
          toast.success('Permission categories initialized');
        } catch (initError) {
          console.error('Failed to initialize categories:', initError);
          setCategories([]);
        }
      } else {
        const sorted = cats.sort((a: Category, b: Category) => (a.order || 0) - (b.order || 0));
        setCategories(sorted);
      }

      // Group features by category ID - backend now populates category object with _id, name, slug
      const grouped: GroupedFeatures = {};

      featuresData.forEach((feature: any) => {
        // Get category ID from populated category object
        const categoryId = feature.category?._id || 'uncategorized';
        const categoryName = feature.categoryName || feature.category?.name || 'Uncategorized';
        const categorySlug = feature.category?.slug || '';

        if (!grouped[categoryId]) {
          grouped[categoryId] = {
            categoryId: categoryId,
            categoryName: categoryName,
            categorySlug: categorySlug,
            features: []
          };
        }
        grouped[categoryId].features.push(feature);
      });

      setGroupedFeatures(grouped);
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Failed to load features');
    } finally {
      setLoading(false);
    }
  };

  // Open feature form for creating new feature
  const handleNewFeature = () => {
    setEditingFeature(null);
    setFormData({
      key: '',
      name: '',
      description: '',
      category: categories.length > 0 ? categories[0]._id : '',
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
    const categoryId = typeof feature.category === 'string' ? feature.category : feature.category?._id || '';
    setFormData({
      key: feature.key,
      name: feature.name,
      description: feature.description || '',
      category: categoryId,
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
        const updateData = { ...formData };
        delete (updateData as any).key;
        await adminAPI.updateFeature(editingFeature._id!, updateData);
        toast.success('Feature updated successfully');
      } else {
        await adminAPI.createFeature(formData);
        toast.success('Feature created successfully');
      }

      setShowFeatureModal(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save feature');
    } finally {
      setSaving(false);
    }
  };

  // Handle delete click
  const handleDeleteClick = (feature: Feature) => {
    setFeatureToDelete(feature);
    setShowDeleteConfirm(true);
  };

  // Confirm and delete feature
  const handleConfirmDelete = async () => {
    if (!featureToDelete) return;

    try {
      setSaving(true);
      await adminAPI.deleteFeature(featureToDelete._id!);
      toast.success('Feature deleted successfully');
      setShowDeleteConfirm(false);
      setFeatureToDelete(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete feature');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const allFeatures = Object.values(groupedFeatures).flatMap(group => group?.features || []).filter(f => f);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Features Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Create, edit, and manage all available features</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh features"
          >
            <RotateCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleNewFeature}
            className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Feature
          </button>
        </div>
      </div>

      {/* Stats Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total Features</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{allFeatures.length}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Categories</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{Object.keys(groupedFeatures).length}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Enabled</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{allFeatures.filter(f => f && f.enabled !== false).length}</div>
          </div>
        </div>
      </div>

      {/* Features by Category */}
      <div className="space-y-4">
        {Object.keys(groupedFeatures).length === 0 ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
            <p className="text-yellow-900 dark:text-yellow-100">No features or categories available. Creating default categories...</p>
          </div>
        ) : (
          Object.values(groupedFeatures)
            .filter(group => group && group.features && Array.isArray(group.features))
            .map((group) => (
            <div
              key={group.categoryId}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Category Header */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {group.categoryName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {group.features.length} feature{group.features.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="w-16 h-16 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center border border-gray-300 dark:border-gray-600">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary-600">{group.features.length}</div>
                        <div className="text-xs text-gray-500">total</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Content */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.features.map((feature: Feature) => (
                    <div
                      key={feature.key}
                      className="relative p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:border-primary-300 hover:shadow-md transition-all"
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
                            {feature.enabled === false && (
                              <span className="flex-shrink-0 px-2 py-0.5 text-xs font-semibold bg-gray-300 text-gray-800 rounded">
                                DISABLED
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

                          {feature.key && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{feature.key}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex gap-2 justify-end">
                        <button
                          onClick={() => handleEditFeature(feature)}
                          className="p-1.5 text-primary-600 hover:bg-primary-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(feature)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

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
                  Key * {editingFeature && <span className="text-xs text-gray-500">(cannot be changed)</span>}
                </label>
                <input
                  type="text"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  placeholder="e.g., memberManagement"
                  disabled={!!editingFeature}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800"
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
                  placeholder="e.g., Member Management"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>

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
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this feature does"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Available Tiers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Available Tiers
                </label>
                <div className="space-y-2">
                  {TIERS.map(tier => (
                    <label key={tier} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.availableInTiers.includes(tier)}
                        onChange={(e) => {
                          const tiers = e.target.checked
                            ? [...formData.availableInTiers, tier]
                            : formData.availableInTiers.filter(t => t !== tier);
                          setFormData({ ...formData, availableInTiers: tiers });
                        }}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{tier}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Beta */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.beta}
                    onChange={(e) => setFormData({ ...formData, beta: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mark as Beta</span>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end pt-4">
                <button
                  onClick={() => setShowFeatureModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveFeature}
                  disabled={saving}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg font-medium transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Feature'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && featureToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                Delete Feature?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Are you sure you want to delete "<strong>{featureToDelete.name}</strong>"? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={saving}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors"
                >
                  {saving ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeatures;
