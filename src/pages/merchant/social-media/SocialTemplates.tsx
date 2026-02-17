import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  PenSquare,
  Plus,
  Search,
  Loader2,
  X,
  Trash2,
  Edit2,
  BookOpen
} from 'lucide-react';
import { socialMediaAPI } from '../../../services/api';
import { SocialTemplate, TEMPLATE_CATEGORIES, PLATFORM_INFO } from '../../../types/socialMedia';
import toast from 'react-hot-toast';

const SocialTemplates: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<SocialTemplate[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SocialTemplate | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'custom',
    content: '',
    defaultHashtags: '' // comma-separated for simple input
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, search]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedCategory) params.category = selectedCategory;
      if (search) params.search = search;
      const response = await socialMediaAPI.getTemplates(params);
      setTemplates(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingTemplate(null);
    setFormData({ name: '', category: 'custom', content: '', defaultHashtags: '' });
    setShowCreateModal(true);
  };

  const openEdit = (template: SocialTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      content: template.content,
      defaultHashtags: template.defaultHashtags.join(', ')
    });
    setShowCreateModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.content.trim()) {
      toast.error('Name and content are required');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formData.name,
        category: formData.category,
        content: formData.content,
        defaultHashtags: formData.defaultHashtags
          .split(',')
          .map(t => t.trim())
          .filter(Boolean)
      };

      if (editingTemplate) {
        await socialMediaAPI.updateTemplate(editingTemplate._id, payload);
        toast.success('Template updated');
      } else {
        await socialMediaAPI.createTemplate(payload);
        toast.success('Template created');
      }

      setShowCreateModal(false);
      fetchTemplates();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      setDeleting(id);
      await socialMediaAPI.deleteTemplate(id);
      toast.success('Template deleted');
      setTemplates(prev => prev.filter(t => t._id !== id));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const applyTemplate = (template: SocialTemplate) => {
    // Navigate to create post with template content pre-filled
    navigate('/social-media/create', {
      state: {
        templateId: template._id,
        content: template.content,
        hashtags: template.defaultHashtags
      }
    });
  };

  const getCategoryInfo = (category: string) => {
    return TEMPLATE_CATEGORIES.find(c => c.value === category) || { label: category, value: category };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Post Templates
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Pre-built and custom templates for your social media posts
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Template
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
        >
          <option value="">All Categories</option>
          {TEMPLATE_CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Template Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 mb-3">
            {search || selectedCategory ? 'No templates match your filters' : 'No templates yet'}
          </p>
          <button
            onClick={openCreate}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Create your first template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => {
            const category = getCategoryInfo(template.category);
            return (
              <div
                key={template._id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  {/* Category badge & system indicator */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
                      {category.label}
                    </span>
                    {template.isSystem && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <BookOpen className="w-3 h-3" />
                        System
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {template.name}
                  </h3>

                  {/* Content preview */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-3">
                    {template.content}
                  </p>

                  {/* Hashtags */}
                  {template.defaultHashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {template.defaultHashtags.slice(0, 4).map(tag => (
                        <span key={tag} className="text-xs text-primary-600 dark:text-primary-400">
                          #{tag}
                        </span>
                      ))}
                      {template.defaultHashtags.length > 4 && (
                        <span className="text-xs text-gray-400">+{template.defaultHashtags.length - 4}</span>
                      )}
                    </div>
                  )}

                  {/* Platforms */}
                  <div className="flex gap-1 mb-4">
                    {template.suggestedPlatforms.map(platform => (
                      <span
                        key={platform}
                        className={`text-xs px-1.5 py-0.5 rounded ${PLATFORM_INFO[platform]?.bgColor} ${PLATFORM_INFO[platform]?.color}`}
                      >
                        {platform === 'facebook' ? 'FB' : 'IG'}
                      </span>
                    ))}
                  </div>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Used {template.usageCount} times</span>
                    {template.placeholders.length > 0 && (
                      <span>{template.placeholders.length} variables</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-gray-200 dark:border-gray-700 px-5 py-3 flex items-center justify-between">
                  <button
                    onClick={() => applyTemplate(template)}
                    className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    <PenSquare className="w-3.5 h-3.5" />
                    Use Template
                  </button>
                  <div className="flex items-center gap-1">
                    {!template.isSystem && (
                      <>
                        <button
                          onClick={() => openEdit(template)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(template._id)}
                          disabled={deleting === template._id}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                          title="Delete"
                        >
                          {deleting === template._id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {editingTemplate ? 'Edit Template' : 'Create Template'}
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Template Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Sunday Service Invite"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    {TEMPLATE_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    rows={6}
                    placeholder={'Use {{variableName}} for dynamic content.\n\nExample: Join us at {{churchName}} this Sunday!'}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {formData.content.length}/2,200 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Default Hashtags
                  </label>
                  <input
                    type="text"
                    value={formData.defaultHashtags}
                    onChange={(e) => setFormData(prev => ({ ...prev, defaultHashtags: e.target.value }))}
                    placeholder="church, worship, faith (comma separated)"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingTemplate ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialTemplates;
