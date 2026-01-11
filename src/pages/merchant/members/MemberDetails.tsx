import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  User,
  Heart,
  Users,
  AlertCircle,
  FileText,
  Building2
} from 'lucide-react';
import { memberAPI } from '../../../services/api';
import { showToast } from '../../../utils/toasts';
import DeleteMemberModal from '../../../components/member/DeleteMemberModal';
import FeatureGate from '../../../components/access/FeatureGate';

const MemberDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchMember();
  }, [id]);

  const fetchMember = async () => {
    try {
      const response = await memberAPI.getMember(id);
      setMember(response.data.data?.member);
    } catch (error) {
      showToast.error('Failed to load member details');
      navigate('/members/all');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async (permanent: boolean) => {
    try {
      await memberAPI.deleteMember(id, permanent);
      showToast.success(permanent ? 'Member deleted permanently' : 'Member archived');
      setShowDeleteModal(false);
      navigate('/members/all');
    } catch (error) {
      showToast.error('Failed to delete member');
      setShowDeleteModal(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      active: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
      inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      visitor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
      new_convert: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
      transferred: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
    };
    return colors[status] || colors.inactive;
  };

  const getRoleColor = (role: string) => {
    const colors: any = {
      pastor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
      leader: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
      elder: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400',
      deacon: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400',
      member: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      youth: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
      children: 'bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400',
      visitor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
    };
    return colors[role] || colors.member;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading member details...</p>
        </div>
      </div>
    );
  }

  if (!member) return null;

  const age = getAge(member.dateOfBirth);

  console.log(member)

  return (
    <FeatureGate feature={'memberManagement'}>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/members/all')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Back to Members"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  Member Details
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  View and manage member information
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(`/members/${id}/edit`)}
                className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Profile Header Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-primary-500 to-primary-600"></div>
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end space-y-4 sm:space-y-0 sm:space-x-6 -mt-16">
              {/* Profile Photo */}
              <div className="w-32 h-32 rounded-full bg-white dark:bg-gray-800 p-2 shadow-lg">
                <div className="w-full h-full rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center overflow-hidden">
                  {member?.photo ? (
                    <img 
                      src={member?.photo} 
                      alt={`${member.firstName} ${member.lastName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-semibold text-primary-600 dark:text-primary-400">
                      {member?.firstName}{member?.lastName}
                    </span>
                  )}
                </div>
              </div>

              {/* Name and Status */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {member.firstName} {member.middleName} {member.lastName}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(member.membershipStatus)}`}>
                    {member.membershipStatus?.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(member.membershipType)}`}>
                    {member.membershipType?.toUpperCase()}
                  </span>
                  {age && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      {age} years old
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Contact Information
                </h3>
              </div>
              <div className="p-6 space-y-4">
                {member.email && (
                  <div className="flex items-start space-x-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                      <p className="text-gray-900 dark:text-gray-100">{member.email}</p>
                    </div>
                  </div>
                )}
                {member.phone && (
                  <div className="flex items-start space-x-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                      <p className="text-gray-900 dark:text-gray-100">{member.phone}</p>
                    </div>
                  </div>
                )}
                {member.address && (member.address.street || member.address.city) && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
                      <p className="text-gray-900 dark:text-gray-100">
                        {member.address.street && <>{member.address.street}<br /></>}
                        {member.address.city && `${member.address.city}, `}
                        {member.address.state && `${member.address.state} `}
                        {member.address.postalCode}
                        {member.address.country && <><br />{member.address.country}</>}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Personal Details */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Personal Details
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Date of Birth</p>
                    <p className="text-gray-900 dark:text-gray-100 flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {formatDate(member.dateOfBirth)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Gender</p>
                    <p className="text-gray-900 dark:text-gray-100 flex items-center">
                      <User className="w-4 h-4 mr-2 text-gray-400" />
                      {member.gender ? member.gender.charAt(0).toUpperCase() + member.gender.slice(1) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Marital Status</p>
                    <p className="text-gray-900 dark:text-gray-100 flex items-center">
                      <Heart className="w-4 h-4 mr-2 text-gray-400" />
                      {member.maritalStatus ? member.maritalStatus.charAt(0).toUpperCase() + member.maritalStatus.slice(1) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Membership Date</p>
                    <p className="text-gray-900 dark:text-gray-100 flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {formatDate(member.membershipDate)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            {member.emergencyContact?.name && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
                    Emergency Contact
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Name</p>
                    <p className="text-gray-900 dark:text-gray-100">{member.emergencyContact.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Relationship</p>
                    <p className="text-gray-900 dark:text-gray-100">{member.emergencyContact.relationship}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Phone</p>
                    <p className="text-gray-900 dark:text-gray-100">{member.emergencyContact.phone}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {member.notes && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Notes
                  </h3>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{member.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Branch Information */}
            {member.branch && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                    <Building2 className="w-5 h-5 mr-2" />
                    Branch Information
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Branch Name</p>
                    <button
                      onClick={() => navigate(`/branches/${member.branch._id}`)}
                      className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
                    >
                      {member.branch.name}
                    </button>
                  </div>
                  {member.branch.code && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Branch Code</p>
                      <p className="text-gray-900 dark:text-gray-100 font-mono text-sm">{member.branch.code}</p>
                    </div>
                  )}
                  {member.branch.address && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        Location
                      </p>
                      <p className="text-gray-900 dark:text-gray-100">
                        {member.branch.address.street && `${member.branch.address.street}, `}
                        {member.branch.address.city && `${member.branch.address.city}, `}
                        {member.branch.address.state && `${member.branch.address.state}`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Departments - ADD THIS SECTION */}
            {member.departments && member.departments.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Departments
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {member.departments.map((department: any) => (
                      <div
                        key={department._id}
                        onClick={() => navigate(`/departments/${department._id}`)}
                        className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                      >
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mr-3"
                          style={{ backgroundColor: `${department.color}20` }}
                        >
                          {department.icon}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {department.name}
                          </p>
                          {member.primaryDepartment?._id === department._id && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400 mt-1">
                              Primary
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Member Since
                </h3>
              </div>
              <div className="p-6">
                <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                  {member.membershipDate ? new Date(member.membershipDate).getFullYear() : 'N/A'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {formatDate(member.membershipDate)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <DeleteMemberModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onDelete={handleDeleteConfirm}
          memberName={`${member.firstName} ${member.lastName}`}
        />
      )}
    </div>
    </FeatureGate>
  );
};

export default MemberDetails;