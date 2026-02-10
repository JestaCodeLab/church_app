import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Megaphone,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  CheckCircle,
  Archive,
  Loader,
  ChevronLeft,
  ChevronRight,
  Eye,
  Layers
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import { Announcement } from '../../types/announcement';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/modals/ConfirmModal';
import AnnouncementFormModal from '../../components/modals/AnnouncementFormModal';

const AdminAnnouncements = () => {
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Form modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  // Delete confirmation state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    show: boolean;
    id: string | null;
    title: string;
  }>({ show: false, id: null, title: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    if (activeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenu]);

  useEffect(() => {
    fetchAnnouncements();
  }, [currentPage, statusFilter]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };
      if (statusFilter) params.status = statusFilter;

      const response = await adminAPI.getAnnouncements(params);
      setAnnouncements(response.data.data.announcements);
      setTotalPages(response.data.data.pagination.totalPages);
      setTotalItems(response.data.data.pagination.totalItems);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await adminAPI.activateAnnouncement(id);
      toast.success('Announcement activated successfully');
      setActiveMenu(null);
      fetchAnnouncements();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to activate announcement');
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await adminAPI.updateAnnouncement(id, { status: 'archived' });
      toast.success('Announcement archived');
      setActiveMenu(null);
      fetchAnnouncements();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to archive announcement');
    }
  };

  const openDeleteConfirmation = (id: string, title: string) => {
    setDeleteConfirmation({ show: true, id, title });
    setActiveMenu(null);
  };

  const handleDelete = async () => {
    if (!deleteConfirmation.id) return;
    try {
      setIsDeleting(true);
      await adminAPI.deleteAnnouncement(deleteConfirmation.id);
      toast.success('Announcement deleted');
      setDeleteConfirmation({ show: false, id: null, title: '' });
      fetchAnnouncements();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete announcement');
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditModal = async (id: string) => {
    try {
      const response = await adminAPI.getAnnouncement(id);
      setEditingAnnouncement(response.data.data.announcement);
      setShowFormModal(true);
      setActiveMenu(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load announcement');
    }
  };

  const openCreateModal = () => {
    setEditingAnnouncement(null);
    setShowFormModal(true);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300',
      active: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300',
      archived: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300',
    };
    return colors[status] || colors.draft;
  };

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Feature Announcements
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create and manage feature announcements for merchants
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Announcement
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center space-x-2">
          {[
            { label: 'All', value: '' },
            { label: 'Draft', value: 'draft' },
            { label: 'Active', value: 'active' },
            { label: 'Archived', value: 'archived' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setStatusFilter(tab.value);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                statusFilter === tab.value
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <div className="flex-1" />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Total: <span className="font-semibold text-gray-900 dark:text-gray-100">{totalItems}</span>
          </span>
        </div>
      </div>

      {/* Announcements Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-12">
            <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No announcements found</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Create your first feature announcement to get started
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Announcement
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Slides
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Published
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {announcements.map((announcement) => (
                    <tr key={announcement._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Megaphone className="w-5 h-5 text-primary-500 mr-3 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {announcement.title}
                            </p>
                            {announcement.createdBy && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                by {announcement.createdBy.firstName} {announcement.createdBy.lastName}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Layers className="w-4 h-4 mr-1" />
                          {announcement.slides.length}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(announcement.status)}`}>
                          {announcement.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(announcement.publishedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(announcement.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="relative inline-block" ref={activeMenu === announcement._id ? menuRef : undefined}>
                          <button
                            onClick={() =>
                              setActiveMenu(activeMenu === announcement._id ? null : announcement._id)
                            }
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>

                          {activeMenu === announcement._id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                              <div className="py-1">
                                <button
                                  onClick={() => openEditModal(announcement._id)}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                                >
                                  <Edit2 className="w-4 h-4 mr-2" />
                                  Edit
                                </button>
                                {announcement.status !== 'active' && (
                                  <button
                                    onClick={() => handleActivate(announcement._id)}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Activate
                                  </button>
                                )}
                                {announcement.status === 'active' && (
                                  <button
                                    onClick={() => handleArchive(announcement._id)}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                                  >
                                    <Archive className="w-4 h-4 mr-2" />
                                    Archive
                                  </button>
                                )}
                                <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
                                <button
                                  onClick={() => openDeleteConfirmation(announcement._id, announcement.title)}
                                  className="w-full px-4 py-2 text-left text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
              {announcements.map((announcement) => (
                <div key={announcement._id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <Megaphone className="w-5 h-5 text-primary-500 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {announcement.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {announcement.slides.length} slide{announcement.slides.length !== 1 ? 's' : ''} · {formatDate(announcement.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(announcement.status)}`}>
                      {announcement.status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEditModal(announcement._id)}
                      className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      Edit
                    </button>
                    {announcement.status !== 'active' && (
                      <button
                        onClick={() => handleActivate(announcement._id)}
                        className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                      >
                        Activate
                      </button>
                    )}
                    {announcement.status === 'active' && (
                      <button
                        onClick={() => handleArchive(announcement._id)}
                        className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg hover:bg-yellow-200"
                      >
                        Archive
                      </button>
                    )}
                    <button
                      onClick={() => openDeleteConfirmation(announcement._id, announcement.title)}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Form Modal */}
      <AnnouncementFormModal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditingAnnouncement(null);
        }}
        onSaved={fetchAnnouncements}
        announcement={editingAnnouncement}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteConfirmation.show}
        onClose={() => setDeleteConfirmation({ show: false, id: null, title: '' })}
        onConfirm={handleDelete}
        title="Delete Announcement"
        message={`Are you sure you want to delete "${deleteConfirmation.title}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default AdminAnnouncements;
