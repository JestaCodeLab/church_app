import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Loader, 
  Search,
  MoreVertical,
  UserCheck,
  Clock,
  Mail,
  Phone,
  Eye,
  Grid3x3,
  List
} from 'lucide-react';
import { showToast } from '../../../utils/toasts';
import { formatTime } from '../../../utils/timeFormat';
import { departmentAPI } from '../../../services/api';
import LimitReachedModal from '../../../components/modals/LimitReachedModal';
import { useAuth } from '../../../context/AuthContext';
import { useResourceLimit } from '../../../hooks/useResourceLimit';
import PermissionGuard from '../../../components/guards/PermissionGuard';

interface Department {
  _id: string;
  name: string;
  description: string;
  leader: {
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  contactEmail: string;
  contactPhone: string;
  branch: any
  meetingSchedule: {
    day: string;
    time: string;
    location: string;
    frequency: string;
  };
  isActive: boolean;
  allowSelfRegistration: boolean;
  color: string;
  icon: string;
  memberCount: number;
  createdAt: string;
}

const AllDepartments = () => {
  const navigate = useNavigate();
  const plan = useAuth()?.user?.merchant?.subscription?.plan
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const departmentLimit = useResourceLimit('departments');

  useEffect(() => {
    fetchDepartments();
  }, [filterActive]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);      
      const params: any = {};

      if (filterActive !== null) {
        params.isActive = filterActive;
      }

      const response = await departmentAPI.getDepartments(params);

      if (response.data.success) {
        setDepartments(response.data.data.departments);
      }
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = async () => {
    if (!departmentToDelete) return;

    try {
      setDeleteLoading(true);
      const token = localStorage.getItem('token');

      await departmentAPI.deleteDepartment(departmentToDelete._id);

      showToast.success('Department deleted successfully');
      setShowDeleteModal(false);
      setDepartmentToDelete(null);
      fetchDepartments();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to delete department');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

    const handleAddDepartmentClick = () => {
    if (!departmentLimit?.canCreate) {
      setShowLimitModal(true);
      return;
    }
    navigate('/departments/new');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Departments
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage church departments and ministries
          </p>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <PermissionGuard permission="departments.create">
          <button
            onClick={handleAddDepartmentClick}
            className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Department
          </button>
          </PermissionGuard>
          {departmentLimit && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {departmentLimit?.current} / {departmentLimit?.limit || '∞'} used
            </p>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* View Toggle & Filter Tabs */}
          <div className="flex items-center space-x-4">
            {/* View Toggle */}
            <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
                title="Grid view"
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${
                  viewMode === 'list'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
                title="List view"
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-2">
            <button
              onClick={() => setFilterActive(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterActive === null
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All ({departments.length})
            </button>
            <button
              onClick={() => setFilterActive(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterActive === true
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Active ({departments.filter(d => d.isActive).length})
            </button>
            <button
              onClick={() => setFilterActive(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterActive === false
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Inactive ({departments.filter(d => !d.isActive).length})
            </button>
            </div>
          </div>
        </div>
      </div>

      {/* Departments Grid */}
      {filteredDepartments.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No departments found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchTerm ? 'Try adjusting your search' : 'Get started by creating your first department'}
          </p>
          {!searchTerm && (
            <PermissionGuard permission="departments.create">
            <button
              onClick={() => navigate('/departments/new')}
              className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Department
            </button>
            </PermissionGuard>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDepartments.map((dept) => (
            <div
              key={dept._id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
            >
              {/* Header with gradient accent */}
              <div 
                className="h-3"
                style={{ background: `linear-gradient(90deg, ${dept.color}, ${dept.color}dd)` }}
              />

              <div className="p-6">
                {/* Title & Icon */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3 flex-1">
                    <div 
                      className="w-14 h-14 rounded-lg flex items-center justify-center text-3xl flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: `${dept.color}15`, border: `2px solid ${dept.color}40` }}
                    >
                      {dept.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 line-clamp-1">
                        {dept.name}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1 flex-wrap gap-1">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          dept.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {dept.isActive ? '● Active' : '○ Inactive'}
                        </span>
                        {dept.allowSelfRegistration && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400">
                            Open
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {dept.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {dept.description}
                  </p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {dept.memberCount || 0}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Members</p>
                  </div>
                  {dept.meetingSchedule && dept.meetingSchedule.day !== 'None' && (
                    <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {formatTime(dept.meetingSchedule.time)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{dept.meetingSchedule.day}</p>
                    </div>
                  )}
                </div>

                {/* Leader Info */}
                {/* {dept.leader && (
                  <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/10 rounded-lg">
                    <div className="flex items-center text-sm">
                      <UserCheck className="w-4 h-4 text-primary-600 dark:text-primary-400 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Leader</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {dept.leader.firstName} {dept.leader.lastName}
                        </p>
                      </div>
                    </div>
                  </div>
                )} */}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4">
                  <PermissionGuard permission="departments.view">
                  <button
                    onClick={() => navigate(`/departments/${dept._id}`)}
                    className="inline-flex items-center justify-center px-3 py-2 bg-primary-600 hover:bg-primary-700 dark:hover:bg-primary-500 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </button>
                  </PermissionGuard>
                  <PermissionGuard permission="departments.edit">
                  <button
                    onClick={() => navigate(`/departments/${dept._id}/edit`)}
                    className="inline-flex items-center justify-center px-3 py-2 bg-primary-100 dark:bg-primary-900/20 hover:bg-blue-200 dark:hover:bg-blue-900/30 text-primary-700 dark:text-primary-400 text-sm font-semibold rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  </PermissionGuard>
                  <PermissionGuard permission="departments.delete">
                  <button
                    onClick={() => {
                      setDepartmentToDelete(dept);
                      setShowDeleteModal(true);
                    }}
                    className="inline-flex items-center justify-center px-3 py-2 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-semibold rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  </PermissionGuard>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">Department</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">Leader</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">Members</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">Schedule</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredDepartments.map((dept) => (
                  <tr key={dept._id} onClick={() => navigate(`/departments/${dept._id}`)} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                          style={{ backgroundColor: `${dept.color}20` }}
                        >
                          {dept.icon}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{dept.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{dept.description}</p>
                          {dept.branch && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0">{dept.branch.name}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {dept.leader ? (
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{dept.leader.firstName} {dept.leader.lastName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{dept.leader.email}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">—</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                        {dept.memberCount || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {dept.meetingSchedule && dept.meetingSchedule.day !== 'None' ? (
                        <div>
                          <p className="text-sm text-gray-900 dark:text-gray-100">{dept.meetingSchedule.day}s</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{formatTime(dept.meetingSchedule.time)}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">—</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          dept.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {dept.isActive ? '● Active' : '○ Inactive'}
                        </span>
                        {dept.allowSelfRegistration && (
                          <span className="block inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400">
                            Open
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <PermissionGuard permission="departments.edit">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/departments/${dept._id}/edit`);
                          }}
                          className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        </PermissionGuard>
                        <PermissionGuard permission="departments.delete">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDepartmentToDelete(dept);
                            setShowDeleteModal(true);
                          }}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        </PermissionGuard>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && departmentToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Delete Department
              </h3>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete <strong>{departmentToDelete.name}</strong>? 
              This action cannot be undone.
            </p>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDepartmentToDelete(null);
                }}
                disabled={deleteLoading}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors inline-flex items-center"
              >
                {deleteLoading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Limit Modal */}
      <LimitReachedModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        resourceType="departments"
        planName={plan}
        current={departmentLimit?.current}
        limit={departmentLimit?.limit || 0}
      />
    </div>
  );
};

export default AllDepartments;