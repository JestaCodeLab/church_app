import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Edit, Trash2, MapPin, Phone, Mail, Calendar, Users,
  Building2, Clock, Wifi, ParkingCircle, Baby, Building,
  TrendingUp, Facebook, Instagram, Twitter, Youtube, Globe,
  Accessibility
} from 'lucide-react';
import { branchAPI } from '../../../services/api';
import { showToast } from '../../../utils/toasts';
import DeleteBranchModal from '../../../components/branch/DeleteBranchModal';

const BranchDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [branch, setBranch] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchBranch();
    fetchStats();
  }, [id]);

  const fetchBranch = async () => {
    try {
      setLoading(true);
      const response = await branchAPI.getBranch(id);
      setBranch(response.data.data.branch);
    } catch (error: any) {
      showToast.error('Failed to load branch');
      navigate('/branches');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await branchAPI.getStats(id);
      setStats(response.data.data.stats);
    } catch (error) {
      console.error('Failed to load stats');
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async (permanent: boolean) => {
    try {
      await branchAPI.deleteBranch(id, permanent);
      showToast.success(permanent ? 'Branch deleted permanently' : 'Branch archived');
      navigate('/branches');
    } catch (error: any) {
      showToast.error(error?.response?.data?.message || 'Failed to delete branch');
    }
  };

  const formatDate = (date: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTypeBadgeColor = (type: string) => {
    const colors: any = {
      main: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
      branch: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
      campus: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300',
      satellite: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300',
    };
    return colors[type] || colors.branch;
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: any = {
      active: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300',
      inactive: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
      closed: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300',
      upcoming: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
    };
    return colors[status] || colors.inactive;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading branch details...</p>
        </div>
      </div>
    );
  }

  if (!branch) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 h-32"></div>

      <div className="max-w-8xl mx-auto px-6 -mt-16 pb-12">
        {/* Back button */}
        <div className="mb-4">
          <button
            onClick={() => navigate('/branches')}
            className="flex items-center text-white hover:text-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Branches
          </button>
        </div>

        {/* Branch Header Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-6">
              <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-12 h-12 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {branch.name}
                  </h1>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getTypeBadgeColor(branch.type)}`}>
                    {branch.type}
                  </span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadgeColor(branch.status)}`}>
                    {branch.status}
                  </span>
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-3">
                  Code: <span className="font-semibold">{branch.code}</span>
                </p>
                {branch.description && (
                  <p className="text-gray-600 dark:text-gray-400 max-w-3xl">
                    {branch.description}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(`/branches/${id}/edit`)}
                className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Contact Information
              </h2>
              <div className="space-y-3">
                {branch.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{branch.phone}</span>
                  </div>
                )}
                {branch.alternatePhone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{branch.alternatePhone}</span>
                  </div>
                )}
                {branch.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{branch.email}</span>
                  </div>
                )}
                {branch.address && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="text-gray-700 dark:text-gray-300">
                      <p>{branch.address.street}</p>
                      <p>
                        {branch.address.city}
                        {branch.address.region && `, ${branch.address.region}`}
                        {branch.address.state && `, ${branch.address.state}`}
                      </p>
                      <p>{branch.address.country}</p>
                      {branch.address.landmark && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Landmark: {branch.address.landmark}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Leadership */}
            {(branch.pastor || branch.assistant || (branch.leaders && branch.leaders.length > 0)) && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Leadership
                  </h2>
                </div>
                <div className="space-y-4">
                  {branch.pastor && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Pastor</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {branch.pastor.firstName} {branch.pastor.lastName}
                      </p>
                      {branch.pastor.email && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{branch.pastor.email}</p>
                      )}
                    </div>
                  )}
                  {branch.assistant && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Assistant Pastor</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {branch.assistant.firstName} {branch.assistant.lastName}
                      </p>
                      {branch.assistant.email && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{branch.assistant.email}</p>
                      )}
                    </div>
                  )}
                  {branch.leaders && branch.leaders.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Branch Leaders</p>
                      <div className="space-y-2">
                        {branch.leaders.map((leader: any) => (
                          <div key={leader._id} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {leader.firstName} {leader.lastName}
                            </span>
                            {leader.phone && (
                              <span className="text-sm text-gray-600 dark:text-gray-400">{leader.phone}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Service Times */}
            {branch.serviceTimes && branch.serviceTimes.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Clock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Service Times
                  </h2>
                </div>
                <div className="space-y-3">
                  {branch.serviceTimes.map((service: any, index: number) => (
                    <div key={index} className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{service.service}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{service.day}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-900 dark:text-gray-100">{service.startTime}</p>
                        {service.endTime && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">to {service.endTime}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Facilities & Amenities */}
            {branch.facilities && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Wifi className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Facilities & Amenities
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  {branch.facilities.capacity && (
                    <div className="flex items-center space-x-3 py-3 px-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <Building className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Capacity</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{branch.facilities.capacity}</p>
                      </div>
                    </div>
                  )}
                  {branch.facilities.parking?.available && (
                    <div className="flex items-center space-x-3 py-3 px-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <ParkingCircle className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Parking</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {branch.facilities.parking.spaces || 'Available'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {branch.facilities.childcare && (
                    <span className="flex items-center px-3 py-1.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                      <Baby className="w-4 h-4 mr-1.5" />
                      Childcare
                    </span>
                  )}
                  {branch.facilities.accessibility?.wheelchair && (
                    <span className="flex items-center px-3 py-1.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-sm">
                      <Accessibility className="w-4 h-4 mr-1.5" />
                      Wheelchair Access
                    </span>
                  )}
                  {branch.facilities.accessibility?.elevator && (
                    <span className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-full text-sm">
                      Elevator
                    </span>
                  )}
                  {branch.facilities.accessibility?.assistiveListening && (
                    <span className="px-3 py-1.5 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-full text-sm">
                      Assistive Listening
                    </span>
                  )}
                  {branch.facilities.amenities?.map((amenity: string, index: number) => (
                    <span key={index} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Social Media */}
            {branch.socialMedia && Object.values(branch.socialMedia).some(v => v) && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Social Media & Website
                </h2>
                <div className="flex flex-wrap gap-3">
                  {branch.socialMedia.facebook && (
                    <a
                      href={branch.socialMedia.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      <Facebook className="w-4 h-4 mr-2" />
                      Facebook
                    </a>
                  )}
                  {branch.socialMedia.instagram && (
                    <a
                      href={branch.socialMedia.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-4 py-2 bg-pink-100 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400 rounded-lg hover:bg-pink-200 dark:hover:bg-pink-900/30 transition-colors"
                    >
                      <Instagram className="w-4 h-4 mr-2" />
                      Instagram
                    </a>
                  )}
                  {branch.socialMedia.twitter && (
                    <a
                      href={branch.socialMedia.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-4 py-2 bg-sky-100 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 rounded-lg hover:bg-sky-200 dark:hover:bg-sky-900/30 transition-colors"
                    >
                      <Twitter className="w-4 h-4 mr-2" />
                      Twitter
                    </a>
                  )}
                  {branch.socialMedia.youtube && (
                    <a
                      href={branch.socialMedia.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <Youtube className="w-4 h-4 mr-2" />
                      YouTube
                    </a>
                  )}
                  {branch.socialMedia.website && (
                    <a
                      href={branch.socialMedia.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Globe className="w-4 h-4 mr-2" />
                      Website
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Stats & Info */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Statistics
                </h2>
              </div>
              <div className="space-y-4">
<div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Members</p>
                    <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                      {branch.statistics?.memberCount || 0}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/members?branchId=${id}`)}
                    className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    View All
                  </button>
                </div>
                {branch.statistics?.averageAttendance > 0 && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg. Attendance</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {branch.statistics.averageAttendance}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Branch Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Branch Information
              </h2>
              <div className="space-y-3">
                {branch.establishedDate && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Established</p>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-900 dark:text-gray-100">{formatDate(branch.establishedDate)}</p>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Created</p>
                  <p className="text-gray-900 dark:text-gray-100">{formatDate(branch.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Last Updated</p>
                  <p className="text-gray-900 dark:text-gray-100">{formatDate(branch.updatedAt)}</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {branch.notes && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Internal Notes
                </h2>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{branch.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <DeleteBranchModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDelete={handleDeleteConfirm}
        branchName={branch?.name || ''}
        memberCount={branch?.statistics?.memberCount || 0}
      />
    </div>
  );
};

export default BranchDetails;