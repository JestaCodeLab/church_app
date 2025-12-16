import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Clock, MapPin, Users, Edit, Trash2,
  MoreVertical, UserCircle, Mic, Image as ImageIcon,
  ExternalLink, X
} from 'lucide-react';
import { eventAPI } from '../../../services/api';
import { showToast } from '../../../utils/toasts';
import ConfirmModal from '../../../components/modals/ConfirmModal';
import QRCodeDisplay from '../../../components/events/QRCodeDisplay';
import { format } from 'date-fns';

const EventDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [regeneratingQR, setRegeneratingQR] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await eventAPI.getEvent(id!);
      setEvent(response.data.data.event);
    } catch (error: any) {
      showToast.error('Failed to load event details');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await eventAPI.deleteEvent(id!);
      showToast.success('Event deleted successfully');
      navigate('/events');
    } catch (error: any) {
      showToast.error('Failed to delete event');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleRegenerateQR = async () => {
    try {
      setRegeneratingQR(true);
      await eventAPI.regenerateQR(id!);
      await fetchEvent(); // Reload event data
      showToast.success('QR Code regenerated successfully');
    } catch (error: any) {
      showToast.error('Failed to regenerate QR code');
    } finally {
      setRegeneratingQR(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Event not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/events')}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Events</span>
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {event.title}
                </h1>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                  {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                </span>
                {event.isPublic && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Public
                  </span>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1)} • {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate(`/events/${id}/edit`)}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                    <button
                      onClick={() => {
                        navigate(`/events/${id}/attendance`);
                        setShowDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-t-lg"
                    >
                      View Attendance
                    </button>
                    <button
                      onClick={() => {
                        navigate(`/events/${id}/check-in`);
                        setShowDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Check-In
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteModal(true);
                        setShowDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-b-lg"
                    >
                      Delete Event
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cover Image */}
            {event.coverImage?.url && (
              <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <img
                  src={event.coverImage.url}
                  alt={event.title}
                  className="w-full h-96 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => setSelectedImage(event.coverImage.url)}
                />
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  About This Event
                </h2>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}

            {/* Gallery */}
            {event.images && event.images.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
                  <ImageIcon className="w-5 h-5" />
                  <span>Event Gallery</span>
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {event.images.map((image: any, index: number) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.url}
                        alt={image.caption || `Gallery image ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                        onClick={() => setSelectedImage(image.url)}
                      />
                      {image.caption && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          {image.caption}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hosts */}
            {event.hosts && event.hosts.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Event Hosts</span>
                </h2>
                <div className="space-y-4">
                  {event.hosts.map((host: any, index: number) => (
                    <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      {host.type === 'member' && host.member?.photo ? (
                        <img
                          src={host.member.photo}
                          alt={`${host.member.firstName} ${host.member.lastName}`}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                          <UserCircle className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {host.type === 'member'
                            ? `${host.member.firstName} ${host.member.lastName}`
                            : host.externalHost.name
                          }
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {host.type === 'member'
                            ? 'Church Member'
                            : host.externalHost.title
                          }
                        </p>
                        {host.type === 'external' && host.externalHost.organization && (
                          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                            {host.externalHost.organization}
                          </p>
                        )}
                        {host.type === 'external' && host.externalHost.bio && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                            {host.externalHost.bio}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Speakers */}
            {event.speakers && event.speakers.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
                  <Mic className="w-5 h-5" />
                  <span>Event Speakers</span>
                </h2>
                <div className="space-y-4">
                  {event.speakers.map((speaker: any, index: number) => (
                    <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      {speaker.type === 'member' && speaker.member?.photo ? (
                        <img
                          src={speaker.member.photo}
                          alt={`${speaker.member.firstName} ${speaker.member.lastName}`}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                          <UserCircle className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {speaker.type === 'member'
                            ? `${speaker.member.firstName} ${speaker.member.lastName}`
                            : speaker.externalSpeaker.name
                          }
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {speaker.type === 'member'
                            ? 'Church Member'
                            : speaker.externalSpeaker.title
                          }
                        </p>
                        {speaker.type === 'external' && speaker.externalSpeaker.organization && (
                          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                            {speaker.externalSpeaker.organization}
                          </p>
                        )}
                        {speaker.type === 'external' && speaker.externalSpeaker.topic && (
                          <div className="mt-2 px-3 py-1 bg-primary-100 dark:bg-primary-900 rounded-full inline-block">
                            <p className="text-xs text-primary-700 dark:text-primary-300 font-medium">
                              Topic: {speaker.externalSpeaker.topic}
                            </p>
                          </div>
                        )}
                        {speaker.type === 'external' && speaker.externalSpeaker.bio && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                            {speaker.externalSpeaker.bio}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* QR Code */}
            {event.qrCode?.imageUrl && (
              <QRCodeDisplay
                qrCodeUrl={event.qrCode.imageUrl}
                eventTitle={event.title}
                eventId={event._id}
                qrData={event.qrCode.data}
                onRegenerate={handleRegenerateQR}
              />
            )}

            {/* Date & Time */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Date & Time
              </h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                    <p className="text-gray-900 dark:text-gray-100 font-medium">
                      {format(new Date(event.eventDate), 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Time</p>
                    <p className="text-gray-900 dark:text-gray-100 font-medium">
                      {event.startTime} {event.endTime && `- ${event.endTime}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Location</span>
              </h2>
              <div className="space-y-2">
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {event.location.venue}
                </p>
                {event.location.address && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {[
                      event.location.address.street,
                      event.location.address.city,
                      event.location.address.state,
                      event.location.address.country
                    ].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            </div>

            {/* Capacity */}
            {event.capacity?.enabled && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Attendance</span>
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Current / Maximum</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {event.capacity.currentAttendees} / {event.capacity.maxAttendees}
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min((event.capacity.currentAttendees / event.capacity.maxAttendees) * 100, 100)}%`
                      }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {event.capacity.maxAttendees - event.capacity.currentAttendees} spots remaining
                  </p>
                </div>
              </div>
            )}

            {/* Branch */}
            {event.branch && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Branch
                </h2>
                <p className="text-gray-700 dark:text-gray-300">
                  {event.branch.name}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 bg-white dark:bg-gray-800 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-6 h-6 text-gray-900 dark:text-gray-100" />
          </button>
          <img
            src={selectedImage}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Event"
        message={`Are you sure you want to delete "${event.title}"? This action cannot be undone and will also delete all attendance records.`}
        type="danger"
        isLoading={deleting}
      />
    </div>
  );
};

export default EventDetails;