import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader, Search } from 'lucide-react';
import { showToast } from '../../../utils/toasts';
import { adminAPI, branchAPI, departmentAPI, memberAPI } from '../../../services/api';
import SearchableSelect from '../../../components/ui/SearchableSelect';


const DAYS = ['None', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const FREQUENCIES = ['Weekly', 'Bi-weekly', 'Monthly', 'As Needed'];
const COLORS = [
  '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#EC4899', '#F97316', '#14B8A6', '#6366F1'
];
const ICONS = ['👥', '🎵', '🙏', '📖', '🎤', '👨‍👩‍👧‍👦', '⛪', '🌟', '💒', '✝️', '🕊️', '📚'];

const DepartmentForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [members, setMembers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    branchId: '',
    leaderId: '',
    assistantLeaderIds: [] as string[],
    contactEmail: '',
    contactPhone: '',
    meetingSchedule: {
      day: 'None',
      time: '',
      location: '',
      frequency: 'Weekly'
    },
    isActive: true,
    allowSelfRegistration: true,
    color: COLORS[0],
    icon: ICONS[0]
  });

  useEffect(() => {
    fetchMembers();
    fetchBranches();
    if (isEdit) {
      fetchDepartment();
    }
  }, [id]);

  const fetchDepartment = async () => {
    try {
      setFetching(true);
      const response = await departmentAPI.getDepartment(id!);;

      if (response.data.success) {
        const dept = response.data.data.department;
        setFormData({
          name: dept.name,
          description: dept.description || '',
          branchId: dept.branch?._id || '',
          leaderId: dept.leader?._id || '',
          assistantLeaderIds: dept.assistantLeaders?.map((l: any) => l._id) || [],
          contactEmail: dept.contactEmail || '',
          contactPhone: dept.contactPhone || '',
          meetingSchedule: dept.meetingSchedule || {
            day: 'None',
            time: '',
            location: '',
            frequency: 'Weekly'
          },
          isActive: dept.isActive,
          allowSelfRegistration: dept.allowSelfRegistration,
          color: dept.color || COLORS[0],
          icon: dept.icon || ICONS[0]
        });
      }
    } catch (error: any) {
      showToast.error('Failed to load department');
      navigate('/departments');
    } finally {
      setFetching(false);
    }
  };

  const fetchMembers = async () => {
  try {
    const response = await memberAPI.getMembers({ 
      limit: 20, 
      status: 'active' 
    });
    
    if (response.data.success) {
      setMembers(response.data.data.members);
    }
  } catch (error) {
    console.error('Error fetching members:', error);
  }
};

  const fetchBranches = async () => {
    try {
      const response = await branchAPI.getBranches({limit: 10, status: 'active'});
      if (response.data.success) {
        setBranches(response.data.data.branches);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('meetingSchedule.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        meetingSchedule: {
          ...prev.meetingSchedule,
          [field]: value
        }
      }));
    } else if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAssistantLeaderToggle = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      assistantLeaderIds: prev.assistantLeaderIds.includes(userId)
        ? prev.assistantLeaderIds.filter(id => id !== userId)
        : [...prev.assistantLeaderIds, userId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast.error('Department name is required');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const payload = {
        ...formData,
        branchId: formData.branchId || null,
        leaderId: formData.leaderId || null
      };

      if (isEdit) {
        await departmentAPI.updateDepartment(id, payload);
        showToast.success('Department updated successfully');
      } else {
        await departmentAPI.createDepartment(payload);
        showToast.success('Department created successfully');
      }

      navigate('/departments');
    } catch (error: any) {
      showToast.error(error.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} department`);
    } finally {
      setLoading(false);
    }
  };

  const searchMembers = async (searchTerm: string): Promise<any[]> => {
    const response = await memberAPI.getMembers({
        page: 1,
        limit: 20,
        search: searchTerm, // Backend searches by name/email/phone
        status: 'active'
    });
    return response.data.data.members;
    };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/departments')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {isEdit ? 'Edit Department' : 'Create Department'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isEdit ? 'Update department information' : 'Add a new department or ministry'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Basic Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Department Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g., Youth Ministry, Choir, Ushers"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Brief description of the department..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Branch (Optional)
              </label>
              <select
                name="branchId"
                value={formData.branchId}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Branches</option>
                {branches.map(branch => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Leave empty for church-wide department
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Color
              </label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                    className={`w-10 h-10 rounded-lg transition-all ${
                      formData.color === color
                        ? 'ring-2 ring-offset-2 ring-primary-500 scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Icon
              </label>
              <div className="flex flex-wrap gap-2">
                {ICONS.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, icon }))}
                    className={`w-12 h-12 text-2xl rounded-lg border-2 transition-all ${
                      formData.icon === icon
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-110'
                        : 'border-gray-300 dark:border-gray-600 hover:border-primary-300 hover:scale-105'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Leadership */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Leadership
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Department Leader - Searchable */}
            <div className="md:col-span-2">
            <SearchableSelect
                label="Department Leader"
                placeholder="Search for a member..."
                value={formData.leaderId}
                options={members} 
                onSearch={searchMembers}
                onChange={(value) => setFormData(prev => ({ ...prev, leaderId: value }))}
                helperText="Select a member from your church to lead this department"
            />
            </div>

            {/* Assistant Leaders - Multi-select */}
            <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assistant Leaders
            </label>

            {/* Selected Assistants Display */}
            {formData.assistantLeaderIds.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                {formData.assistantLeaderIds.map(assistantId => {
                    const assistant = members.find(m => m._id === assistantId);
                    return assistant ? (
                    <span
                        key={assistantId}
                        className="px-3 py-1.5 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-full text-sm flex items-center space-x-2"
                    >
                        <span>{assistant.firstName} {assistant.lastName}</span>
                        <button
                        type="button"
                        onClick={() => handleAssistantLeaderToggle(assistantId)}
                        className="hover:text-primary-900 dark:hover:text-primary-200 font-bold"
                        >
                        ×
                        </button>
                    </span>
                    ) : null;
                })}
                </div>
            )}

            {/* Assistant Leaders List with Search */}
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                {/* Search Bar */}
                <div className="p-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                    // on input change, we will call the onSearch prop to fetch members
                    onChange={async (e) => {
                        const searchTerm = e.target.value;
                        if (searchTerm.trim() === '') {
                        setMembers(members); // Reset to initial members if search is empty
                        return;
                        }
                        const results = await searchMembers(searchTerm);
                        setMembers(results);
                    }}
                    type="text"
                    placeholder="Search members..."
                    className="w-full pl-10 pr-3 py-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg text-sm focus:ring-1 focus:ring-primary-500 text-gray-900 dark:text-gray-100"
                    />
                </div>
                </div>

                {/* Available Assistants */}
                <div className="p-4 max-h-60 overflow-y-auto">
                {members.filter(m => m._id !== formData.leaderId).length > 0 ? (
                    members.filter(m => m._id !== formData.leaderId).map(member => (
                    <label
                        key={member._id}
                        className="flex items-start space-x-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded px-2 cursor-pointer transition-colors"
                    >
                        <input
                        type="checkbox"
                        checked={formData.assistantLeaderIds.includes(member._id)}
                        onChange={() => handleAssistantLeaderToggle(member._id)}
                        className="w-4 h-4 mt-0.5 text-primary-600 rounded border-gray-300 dark:border-gray-600 focus:ring-primary-500"
                        />
                        <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {member.firstName} {member.lastName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            {member.email || member.phone}
                        </div>
                        </div>
                    </label>
                    ))
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    {formData.leaderId 
                        ? 'No other members available as assistants'
                        : 'Select a leader first to see available assistants'
                    }
                    </p>
                )}
                </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Selected members will be assigned as leaders. Manage user accounts for these members in the Team Management settings.
            </p>
            </div>
        </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Contact Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contact Email
              </label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                placeholder="department@church.com"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contact Phone
              </label>
              <input
                type="tel"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                placeholder="+233 24 123 4567"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Meeting Schedule */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Meeting Schedule
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Meeting Day
              </label>
              <select
                name="meetingSchedule.day"
                value={formData.meetingSchedule.day}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-transparent"
              >
                {DAYS.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Meeting Time
              </label>
              <input
                type="time"
                name="meetingSchedule.time"
                value={formData.meetingSchedule.time}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Frequency
              </label>
              <select
                name="meetingSchedule.frequency"
                value={formData.meetingSchedule.frequency}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-transparent"
              >
                {FREQUENCIES.map(freq => (
                  <option key={freq} value={freq}>{freq}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Meeting Location
              </label>
              <input
                type="text"
                name="meetingSchedule.location"
                value={formData.meetingSchedule.location}
                onChange={handleChange}
                placeholder="e.g., Main Auditorium"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Settings
          </h2>

          <div className="space-y-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-5 h-5 text-primary-600 rounded"
              />
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Active Department
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Department is visible and accepting members
                </p>
              </div>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                name="allowSelfRegistration"
                checked={formData.allowSelfRegistration}
                onChange={handleChange}
                className="w-5 h-5 text-primary-600 rounded"
              />
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Allow Self-Registration
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Members can join this department during registration
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/departments')}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-medium rounded-lg transition-colors"
          >
            {loading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
            <Save className="w-4 h-4 mr-2" />
            {isEdit ? 'Update' : 'Create'} Department
          </button>
        </div>
      </form>
    </div>
  );
};

export default DepartmentForm;