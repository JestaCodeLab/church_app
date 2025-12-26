import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';

interface Template {
  _id: string;
  name: string;
  category: string;
  message: string;
  variables: string[];
  isActive: boolean;
  usageCount: number;
  createdBy: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

interface TemplateVariable {
  name: string;
  description: string;
  example: string;
}

const SMSTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [variables, setVariables] = useState<TemplateVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTemplates();
    fetchVariables();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/sms/templates');
      setTemplates(response.data.data.templates);
    } catch (error: any) {
      toast.error('Failed to load templates');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVariables = async () => {
    try {
      const response = await api.get('/sms/templates/variables');
      setVariables(response.data.data.variables);
    } catch (error: any) {
      console.error('Failed to load variables', error);
    }
  };

  const openCreateModal = () => {
    setEditingTemplate(null);
    setName('');
    setCategory('general');
    setMessage('');
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (template: Template) => {
    setEditingTemplate(template);
    setName(template.name);
    setCategory(template.category);
    setMessage(template.message);
    setIsActive(template.isActive);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTemplate(null);
  };

  const insertVariable = (variableName: string) => {
    const variable = `{{${variableName}}}`;
    setMessage(message + variable);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !message.trim()) {
      toast.error('Name and message are required');
      return;
    }

    setSubmitting(true);

    try {
      if (editingTemplate) {
        // Update
        await api.put(`/sms/templates/${editingTemplate._id}`, {
          name,
          category,
          message,
          isActive
        });
        toast.success('Template updated successfully');
      } else {
        // Create
        await api.post('/sms/templates', {
          name,
          category,
          message
        });
        toast.success('Template created successfully');
      }

      fetchTemplates();
      closeModal();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to save template';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (templateId: string, templateName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${templateName}"?`
    );

    if (!confirmed) return;

    try {
      await api.delete(`/sms/templates/${templateId}`);
      toast.success('Template deleted successfully');
      fetchTemplates();
    } catch (error: any) {
      toast.error('Failed to delete template');
    }
  };

  const handleToggleActive = async (template: Template) => {
    try {
      await api.put(`/sms/templates/${template._id}`, {
        isActive: !template.isActive
      });
      toast.success(`Template ${!template.isActive ? 'activated' : 'deactivated'}`);
      fetchTemplates();
    } catch (error: any) {
      toast.error('Failed to update template');
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      welcome: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      event_reminder: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      event_confirmation: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      birthday: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400',
      anniversary: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      first_timer_followup: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
      announcement: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      invitation: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400',
      thank_you: 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400',
      general: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return colors[category] || colors.general;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            SMS Templates
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create and manage reusable message templates
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          + New Template
        </button>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No templates yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first SMS template to get started
          </p>
          <button
            onClick={openCreateModal}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Create Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template._id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {template.name}
                    </h3>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getCategoryBadgeColor(template.category)}`}>
                      {template.category.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {template.isActive ? (
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    ) : (
                      <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                    )}
                  </div>
                </div>

                {/* Message Preview */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-4">
                    {template.message}
                  </p>
                </div>

                {/* Variables */}
                {template.variables.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Variables:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map((variable, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded"
                        >
                          {`{{${variable}}}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <span>Used {template.usageCount} times</span>
                  <span>by {template.createdBy.firstName}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openEditModal(template)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleActive(template)}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg ${
                      template.isActive
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {template.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(template._id, template.name)}
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Template Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Sunday Service Reminder"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    >
                      <option value="general">General</option>
                      <option value="welcome">Welcome</option>
                      <option value="event_reminder">Event Reminder</option>
                      <option value="event_confirmation">Event Confirmation</option>
                      <option value="birthday">Birthday</option>
                      <option value="anniversary">Anniversary</option>
                      <option value="first_timer_followup">First Timer Follow-up</option>
                      <option value="announcement">Announcement</option>
                      <option value="invitation">Invitation</option>
                      <option value="thank_you">Thank You</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Available Variables */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Available Variables (Click to insert)
                  </label>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {variables.map((variable) => (
                        <button
                          key={variable.name}
                          type="button"
                          onClick={() => insertVariable(variable.name)}
                          className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm text-left"
                          title={variable.description}
                        >
                          <div className="font-mono text-xs text-blue-600 dark:text-blue-400">
                            {`{{${variable.name}}}`}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {variable.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message *
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Dear {{firstName}}, this is a reminder that our {{eventName}} is on {{eventDate}} at {{eventTime}}. We look forward to seeing you! - {{churchName}}"
                    rows={8}
                    maxLength={1000}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {message.length}/1000 characters
                  </p>
                </div>

                {/* Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Preview
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                      <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                        {message || 'Your message will appear here...'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Active Status (only for edit) */}
                {editingTemplate && (
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Template is active
                      </span>
                    </label>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
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

export default SMSTemplates;