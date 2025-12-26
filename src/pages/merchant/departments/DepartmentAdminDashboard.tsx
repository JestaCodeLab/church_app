import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Send, 
  TrendingUp, 
  Calendar,
  MessageSquare,
  Eye
} from 'lucide-react';
import { departmentAPI } from '../../../services/api';
import { showToast } from '../../../utils/toasts';
import { useAuth } from '../../../context/AuthContext';

const DepartmentAdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    fetchMyDepartments();
  }, []);

  const fetchMyDepartments = async () => {
    try {
      setLoading(true);
      const response = await departmentAPI.getDepartments();

      if (response.data.success) {
        const myDepts = response.data.data.departments;
        setDepartments(myDepts);

        // Calculate combined stats
        let totalMembers = 0;
        for (const dept of myDepts) {
          const statsRes = await departmentAPI.getDepartmentStatistics(dept._id);
          if (statsRes.data.success) {
            totalMembers += statsRes.data.data.statistics.totalMembers;
          }
        }

        setStats({
          totalDepartments: myDepts.length,
          totalMembers,
          activeDepartments: myDepts.filter(d => d.isActive).length
        });
      }
    } catch (error: any) {
      showToast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          My Departments
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your departments and communicate with members
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                My Departments
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalDepartments}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Total Members
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalMembers}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Active Departments
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {stats.activeDepartments}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/sms/send')}
            className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Send className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-gray-100">Send SMS</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Send message to your departments
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/messages')}
            className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-gray-100">Message History</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  View past communications
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Departments List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Your Departments
          </h2>
        </div>

        {departments.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              You are not assigned to any departments yet
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {departments.map((dept) => (
              <div
                key={dept._id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${dept.color}20` }}
                    >
                      {dept.icon}
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {dept.name}
                      </h3>
                      {dept.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {dept.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          <Users className="w-4 h-4 inline mr-1" />
                          {dept.memberCount || 0} members
                        </span>
                        {dept.meetingSchedule && dept.meetingSchedule.day !== 'None' && (
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            {dept.meetingSchedule.day}s at {dept.meetingSchedule.time}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => navigate(`/departments/${dept._id}`)}
                      className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </button>
                    <button
                      onClick={() => navigate(`/sms/send?departmentId=${dept._id}`)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <Send className="w-4 h-4 mr-1" />
                      Send SMS
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentAdminDashboard;