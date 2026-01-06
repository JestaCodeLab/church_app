import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';

interface SmsPackage {
  _id: string;
  name: string;
  slug: string;
  credits: number;
  price: number;
  currency: string;
  discount: number;
  description: string;
  features: string[];
  isActive: boolean;
  isPrimary: boolean;
  displayOrder: number;
  pricePerSMS: string;
  discountedPrice: number;
}

const SMSPackages: React.FC = () => {
  const [packages, setPackages] = useState<SmsPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<SmsPackage | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [credits, setCredits] = useState('');
  const [price, setPrice] = useState('');
  const [discount, setDiscount] = useState('');
  const [description, setDescription] = useState('');
  const [features, setFeatures] = useState<string[]>(['']);
  const [isPrimary, setIsPrimary] = useState(false);
  const [displayOrder, setDisplayOrder] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/sms-packages');
      setPackages(response.data.data.packages);
    } catch (error: any) {
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingPackage(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (pkg: SmsPackage) => {
    setEditingPackage(pkg);
    setName(pkg.name);
    setSlug(pkg.slug);
    setCredits(pkg.credits.toString());
    setPrice(pkg.price.toString());
    setDiscount(pkg.discount.toString());
    setDescription(pkg.description || '');
    setFeatures(pkg.features.length > 0 ? pkg.features : ['']);
    setIsPrimary(pkg.isPrimary);
    setDisplayOrder(pkg.displayOrder.toString());
    setShowModal(true);
  };

  const resetForm = () => {
    setName('');
    setSlug('');
    setCredits('');
    setPrice('');
    setDiscount('0');
    setDescription('');
    setFeatures(['']);
    setIsPrimary(false);
    setDisplayOrder('0');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !slug || !credits || !price) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      const data = {
        name,
        slug: slug.toLowerCase(),
        credits: parseInt(credits),
        price: parseFloat(price),
        discount: parseInt(discount || '0'),
        description,
        features: features.filter(f => f.trim()),
        isPrimary,
        displayOrder: parseInt(displayOrder || '0')
      };

      if (editingPackage) {
        await api.put(`/admin/sms-packages/${editingPackage._id}`, data);
        toast.success('Package updated successfully');
      } else {
        await api.post('/admin/sms-packages', data);
        toast.success('Package created successfully');
      }

      fetchPackages();
      setShowModal(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save package');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await api.patch(`/admin/sms-packages/${id}/toggle`);
      toast.success('Package status updated');
      fetchPackages();
    } catch (error: any) {
      toast.error('Failed to update package status');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await api.delete(`/admin/sms-packages/${id}`);
      toast.success('Package deleted successfully');
      fetchPackages();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete package');
    }
  };

  const addFeature = () => {
    setFeatures([...features, '']);
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
  };

  return (
    <div className="p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            SMS Packages
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage SMS credit packages for churches
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          + New Package
        </button>
      </div>

      {/* Packages Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg._id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden ${
                pkg.isPrimary ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {pkg.isPrimary && (
                <div className="bg-blue-500 text-white text-center py-1 text-xs font-medium">
                  RECOMMENDED
                </div>
              )}

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {pkg.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {pkg.slug}
                    </p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${pkg.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                </div>

                <div className="mb-4">
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      {pkg.currency} {pkg.price}
                    </span>
                    {pkg.discount > 0 && (
                      <span className="ml-2 text-sm text-green-600 dark:text-green-400">
                        Save {pkg.discount}%
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {pkg.credits.toLocaleString()} credits • {pkg.pricePerSMS} per SMS
                  </p>
                </div>

                {pkg.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {pkg.description}
                  </p>
                )}

                {pkg.features.length > 0 && (
                  <ul className="space-y-2 mb-4">
                    {pkg.features.map((feature, index) => (
                      <li key={index} className="flex items-start text-sm text-gray-600 dark:text-gray-400">
                        <span className="mr-2">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex items-center space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => openEditModal(pkg)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleStatus(pkg._id)}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg ${
                      pkg.isActive
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {pkg.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(pkg._id, pkg.name)}
                    className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {editingPackage ? 'Edit Package' : 'Create Package'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Package Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Starter Pack"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>

                  {/* Slug */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Slug * (lowercase, no spaces)
                    </label>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                      placeholder="e.g., starter-pack"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>

                  {/* Credits */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Credits *
                    </label>
                    <input
                      type="number"
                      value={credits}
                      onChange={(e) => setCredits(e.target.value)}
                      placeholder="100"
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Price (GHS) *
                    </label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="10"
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>

                  {/* Discount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Discount (%)
                    </label>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      placeholder="0"
                      min="0"
                      max="100"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  {/* Display Order */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={displayOrder}
                      onChange={(e) => setDisplayOrder(e.target.value)}
                      placeholder="0"
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="A brief description of this package..."
                    rows={3}
                    maxLength={500}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">{description.length}/500 characters</p>
                </div>

                {/* Features */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Features
                  </label>
                  <div className="space-y-2">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => updateFeature(index, e.target.value)}
                          placeholder="e.g., Valid for 12 months"
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                        {features.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeFeature(index)}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addFeature}
                      className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      + Add Feature
                    </button>
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isPrimary}
                      onChange={(e) => setIsPrimary(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Mark as Primary/Recommended Package
                    </span>
                  </label>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Saving...' : editingPackage ? 'Update Package' : 'Create Package'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SMSPackages;