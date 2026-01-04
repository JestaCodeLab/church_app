import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Clock, MapPin, Users, Edit, Trash2,
  MoreVertical, UserCircle, Mic, Image as ImageIcon,
  ExternalLink, X, Repeat2, Copy, CheckCircle, Code,
  Trash, RotateCw, MessageSquare, DollarSign, Save
} from 'lucide-react';
import { eventAPI, eventCodeAPI } from '../../../services/api';
import { showToast } from '../../../utils/toasts';
import ConfirmModal from '../../../components/modals/ConfirmModal';
import QRCodeDisplay from '../../../components/events/QRCodeDisplay';
import SmsAutomationSettings from '../../../components/events/SmsAutomationSettings';
import DonationSettings from '../../../components/events/DonationSettings';
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
  const [todayEventCode, setTodayEventCode] = useState<any>(null);
  const [allEventCodes, setAllEventCodes] = useState<any[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [regeneratingCodes, setRegeneratingCodes] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);

  // SMS Automation & Donation Settings
  const [smsAutomation, setSmsAutomation] = useState({
    enabled: false,
    notifications: [],
    externalRecipients: []
  });
  const [donations, setDonations] = useState<{
    enabled: boolean;
    goal?: { amount: number; currency: string };
    allowAnonymous: boolean;
    description: string;
    publicUrl?: string;
    thankYouSms?: string;
  }>({
    enabled: false,
    allowAnonymous: true,
    description: ''
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [smsAutomationStatus, setSmsAutomationStatus] = useState<{
    hasRunToday: boolean;
    lastRun?: string;
    nextScheduledRun?: string;
  } | null>(null);
  const [donationAutomationStatus, setDonationAutomationStatus] = useState<{
    hasRunToday: boolean;
    lastRun?: string;
  } | null>(null);
  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await eventAPI.getEvent(id!);
      const eventData = response.data.data.event;
      setEvent(eventData);

      // Load SMS automation settings
      if (eventData.smsAutomation) {
        setSmsAutomation({
          enabled: eventData.smsAutomation.enabled || false,
          notifications: eventData.smsAutomation.notifications || [],
          externalRecipients: eventData.smsAutomation.externalRecipients || []
        });
      }

      // Load donation settings
      if (eventData.donations) {
        setDonations({
          enabled: eventData.donations.enabled || false,
          ...(eventData.donations.goal && eventData.donations.goal.amount > 0 && { goal: eventData.donations.goal }),
          allowAnonymous: eventData.donations.allowAnonymous ?? true,
          description: eventData.donations.description || '',
          ...(eventData.donations.publicUrl && { publicUrl: eventData.donations.publicUrl }),
          ...(eventData.donations.thankYouSms && { thankYouSms: eventData.donations.thankYouSms })
        });
      } else {
        // Initialize with default values if no donation settings exist
        setDonations({
          enabled: false,
          allowAnonymous: true,
          description: ''
        });
      }

      // If recurring event, fetch today's event code
      if (eventData.isRecurring) {
        fetchTodayEventCode(eventData._id);
        fetchAllEventCodes(eventData._id);
      }

      // Check SMS Automation Status
      if (eventData.smsAutomation?.enabled && eventData.smsAutomation?.notifications?.length > 0) {
        // Determine if automation has run today by checking if any notification was sent
        const today = new Date().toDateString();
        const lastNotificationDate = eventData.smsAutomation.lastNotificationSent 
          ? new Date(eventData.smsAutomation.lastNotificationSent).toDateString()
          : null;
        
        setSmsAutomationStatus({
          hasRunToday: lastNotificationDate === today,
          lastRun: eventData.smsAutomation.lastNotificationSent,
          nextScheduledRun: eventData.smsAutomation.nextScheduledRun
        });
      }

      // Check Donation Thank You SMS Status
      if (eventData.donations?.enabled && eventData.donations?.thankYouSms) {
        // Determine if any donation thank you SMS was sent today
        const today = new Date().toDateString();
        const lastThankYouDate = eventData.donations.lastThankYouSmsSent
          ? new Date(eventData.donations.lastThankYouSmsSent).toDateString()
          : null;
        
        setDonationAutomationStatus({
          hasRunToday: lastThankYouDate === today,
          lastRun: eventData.donations.lastThankYouSmsSent
        });
      }
    } catch (error: any) {
      showToast.error('Failed to load event details');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayEventCode = async (eventId: string) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1'}/attendance/public/event/${eventId}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.data?.eventCode) {
          setTodayEventCode(data.data.eventCode);
        }
      }
    } catch (error) {
      // Silently fail
    }
  };

  const fetchAllEventCodes = async (eventId: string) => {
    try {
      const response = await eventCodeAPI.getCodesForEvent(eventId);
      if (response.status === 200 && response.data.success) {
        setAllEventCodes(response.data.data || []);
      }
    } catch (error) {
      // Silently fail
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

  const handleRegenerateEventCodes = async () => {
    try {
      setRegeneratingCodes(true);
      setShowRegenerateModal(false);
      const response = await eventCodeAPI.regenerateCodes(id!);
      await fetchAllEventCodes(id!);
      showToast.success(response.data.message || 'Event codes regenerated successfully');
    } catch (error: any) {
      showToast.error('Failed to regenerate event codes');
    } finally {
      setRegeneratingCodes(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    showToast.success('Code copied to clipboard');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);

      await eventAPI.updateEvent(id!, {
        smsAutomation,
        donations
      });

      showToast.success('Settings updated successfully');
      await fetchEvent(); // Reload event data to get any backend-generated fields like publicUrl
    } catch (error: any) {
      showToast.error('Failed to update settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const getCheckInUrl = () => {
    if (event.isRecurring) {
      return `${window.location.origin}/attend/${event._id}`;
    } else {
      return `${window.location.origin}/events/attend/${event.qrCode?.data}`;
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
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center space-x-1 transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => navigate(`/events/${id}/attendance`)}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center space-x-1 transition-colors"
              >
                <Users className="w-4 h-4" />
                <span>Attendance</span>
              </button>
              {event.donations?.enabled && (
                <button
                  onClick={() => navigate(`/events/${id}/donations`)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center space-x-1 transition-colors"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Donations</span>
                </button>
              )}
              <button
                onClick={() => {
                  setShowDeleteModal(true);
                  setShowDropdown(false);
                }}
                className="p-2.5 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                <Trash className="w-5 h-5 text-white dark:text-gray-400" />
              </button>

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

            {/* Event Codes & Check-In Link (Recurring Events) */}
            {event.isRecurring && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                    <Code className="w-5 h-5 text-primary-600" />
                    <span>Check-In Codes</span>
                  </h2>
                  <button
                    onClick={() => setShowRegenerateModal(true)}
                    disabled={regeneratingCodes}
                    className="p-2 bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={regeneratingCodes ? 'Regenerating...' : 'Regenerate all event codes'}
                  >
                    <RotateCw className={`w-5 h-5 text-orange-600 ${regeneratingCodes ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {allEventCodes.length > 0 ? (
                  <div className="space-y-4">
                    <div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="bg-primary-50 dark:bg-primary-900/20">
                              <th className="px-4 py-3 text-left font-semibold">Date</th>
                              <th className="px-4 py-3 text-left font-semibold">Code</th>
                              <th className="px-4 py-3 text-left font-semibold">Opens</th>
                              <th className="px-4 py-3 text-left font-semibold">Closes</th>
                              <th className="px-4 py-3 text-left font-semibold">Status</th>
                              <th className="px-4 py-3 text-left font-semibold">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {allEventCodes.map((codeObj: any) => {
                              const now = new Date();
                              const validFrom = new Date(codeObj.validFrom);
                              const validUntil = new Date(codeObj.validUntil);
                              const isActive = now >= validFrom && now <= validUntil;
                              const isPast = now > validUntil;
                              
                              return (
                                <tr key={codeObj._id} className="border-b border-gray-200 dark:border-gray-700">
                                  <td className="px-4 py-3">{format(new Date(codeObj.serviceDate), 'MMM d, yyyy')}</td>
                                  <td className="px-4 py-3 font-mono font-bold text-lg">{codeObj.code}</td>
                                  <td className="px-4 py-3">{format(validFrom, 'h:mm a')}</td>
                                  <td className="px-4 py-3">{format(validUntil, 'h:mm a')}</td>
                                  <td className="px-4 py-3">
                                    {isActive ? (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                        Active
                                      </span>
                                    ) : isPast ? (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                        Expired
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                        Upcoming
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    <button
                                      onClick={() => handleCopyCode(codeObj.code)}
                                      className="p-2 bg-primary-100 dark:bg-primary-900/30 hover:bg-primary-200 dark:hover:bg-primary-900/50 rounded-lg transition-colors"
                                      title="Copy code"
                                    >
                                      {copiedCode ? (
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                      ) : (
                                        <Copy className="w-5 h-5 text-primary-600" />
                                      )}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No event codes have been generated for this event yet.
                  </p>
                )}
              </div>
            )}

            {/* SMS Automation Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              {/* SMS Automation Status Banner */}
              {smsAutomation?.enabled && smsAutomationStatus?.hasRunToday && (
                <div className={`rounded-lg p-4 border mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800`}>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className={`w-5 h-5 mt-0.5 text-blue-600 dark:text-blue-400`} />
                    <div className="flex-1">
                      <p className={`text-sm font-bold text-blue-900 dark:text-blue-100`}>
                        Automation Already Ran Today
                      </p>
                      <p className={`text-sm mt-1 text-blue-700 dark:text-blue-300`}>
                        {smsAutomationStatus.lastRun ? (
                          <>
                            Last run:{' '}
                            <span className="font-semibold uppercase">
                              {new Date(smsAutomationStatus.lastRun).toLocaleString([], { 
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: true
                              })}
                            </span>
                            {' '}
                            <span className="font-medium">
                              If you've made changes to automations, you'll need to manually trigger new messages.
                            </span>
                          </>
                        ) : (
                          <>
                            SMS notifications were sent today.
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  <span>SMS Automation</span>
                </h2>
                <button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {savingSettings ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </>
                  )}
                </button>
              </div>
              <SmsAutomationSettings
                value={smsAutomation}
                onChange={setSmsAutomation}
              />
            </div>

            {/* Donation Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              {/* Donation Thank You SMS Status Banner */}
              {donations?.enabled && donations?.thankYouSms && donationAutomationStatus && (
                <div className={`rounded-lg p-4 border mb-6 ${
                  donationAutomationStatus.hasRunToday
                    ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
                    : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                }`}>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className={`w-5 h-5 mt-0.5 ${
                      donationAutomationStatus.hasRunToday
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-green-600 dark:text-green-400'
                    }`} />
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${
                        donationAutomationStatus.hasRunToday
                          ? 'text-purple-900 dark:text-purple-100'
                          : 'text-green-900 dark:text-green-100'
                      }`}>
                        {donationAutomationStatus.hasRunToday
                          ? 'Thank You SMS Already Sent Today'
                          : 'Thank You SMS Automation Active'}
                      </p>
                      <p className={`text-sm mt-1 ${
                        donationAutomationStatus.hasRunToday
                          ? 'text-purple-700 dark:text-purple-300'
                          : 'text-green-700 dark:text-green-300'
                      }`}>
                        {donationAutomationStatus.hasRunToday ? (
                          <>
                            Thank you SMS was sent to donors at{' '}
                            <span className="font-semibold uppercase">
                              {donationAutomationStatus.lastRun 
                                ? new Date(donationAutomationStatus.lastRun).toLocaleString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit',
                                    hour12: true
                                  }) 
                                : 'today'}
                            </span>
                            .
                          </>
                        ) : (
                          <>
                            Thank you SMS will be automatically sent to donors after they complete their donation payment.
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span>Event Donations</span>
                </h2>
                <button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center space-x-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {savingSettings ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </>
                  )}
                </button>
              </div>
              <DonationSettings
                value={donations}
                onChange={setDonations}
              />
            </div>
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
                qrUrl={getCheckInUrl()}
                onRegenerate={handleRegenerateQR}
              />
            )}

            {/* Date & Time */}
            {!event.isRecurring && (
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
                        {event.eventDate && !isNaN(new Date(event.eventDate).getTime())
                          ? format(new Date(event.eventDate), 'EEEE, MMMM d, yyyy')
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Time</p>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">
                        {event.startTime ? (() => {
                          const [hours, minutes] = event.startTime.split(':');
                          const hour = parseInt(hours);
                          const ampm = hour >= 12 ? 'PM' : 'AM';
                          const displayHour = hour % 12 || 12;
                          const startTimeFormatted = `${displayHour}:${minutes} ${ampm}`;
                          if (event.endTime && event.endTime !== 'Invalid date') {
                            const [endHours, endMinutes] = event.endTime.split(':');
                            const endHour = parseInt(endHours);
                            const endAmpm = endHour >= 12 ? 'PM' : 'AM';
                            const endDisplayHour = endHour % 12 || 12;
                            const endTimeFormatted = `${endDisplayHour}:${endMinutes} ${endAmpm}`;
                            return `${startTimeFormatted} - ${endTimeFormatted}`;
                          }
                          return startTimeFormatted;
                        })() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recurrence (if recurring) */}
            {event.isRecurring && event.recurrence && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 border-t-4 border-t-primary-600">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
                  <Repeat2 className="w-5 h-5 text-primary-600" />
                  <span>Recurring Pattern</span>
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Frequency</p>
                    <p className="text-gray-900 dark:text-gray-100 font-medium capitalize">
                      {event.recurrence.frequency}
                    </p>
                  </div>
                  {event.recurrence.daysOfWeek && event.recurrence.daysOfWeek.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Days</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {event.recurrence.daysOfWeek.map((day: number) => {
                          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                          return (
                            <span
                              key={day}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                            >
                              {dayNames[day]}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Start Time</p>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">
                        {event.recurrence.baseTime ? (() => {
                          const [hours, minutes] = event.recurrence.baseTime.split(':');
                          const hour = parseInt(hours);
                          const ampm = hour >= 12 ? 'PM' : 'AM';
                          const displayHour = hour % 12 || 12;
                          return `${displayHour}:${minutes} ${ampm}`;
                        })() : 'N/A'}
                      </p>
                    </div>
                    {event.recurrence.baseEndTime && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">End Time</p>
                        <p className="text-gray-900 dark:text-gray-100 font-medium">
                          {(() => {
                            const [hours, minutes] = event.recurrence.baseEndTime.split(':');
                            const hour = parseInt(hours);
                            const ampm = hour >= 12 ? 'PM' : 'AM';
                            const displayHour = hour % 12 || 12;
                            return `${displayHour}:${minutes} ${ampm}`;
                          })()}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Start Date</p>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">
                        {event.recurrence.startDate && !isNaN(new Date(event.recurrence.startDate).getTime())
                          ? format(new Date(event.recurrence.startDate), 'MMM d, yyyy')
                          : 'N/A'}
                      </p>
                    </div>
                    {event.recurrence.endDate && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">End Date</p>
                        <p className="text-gray-900 dark:text-gray-100 font-medium">
                          {event.recurrence.endDate && !isNaN(new Date(event.recurrence.endDate).getTime())
                            ? format(new Date(event.recurrence.endDate), 'MMM d, yyyy')
                            : 'N/A'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Location */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Location</span>
              </h2>
              <div className="space-y-2">
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {event.location?.venue}
                </p>
                {event.location?.address && (
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

      {/* Regenerate Event Codes Modal */}
      <ConfirmModal
        isOpen={showRegenerateModal}
        onClose={() => setShowRegenerateModal(false)}
        onConfirm={handleRegenerateEventCodes}
        title="Regenerate Event Codes"
        message={`Are you sure you want to regenerate event codes for "${event.title}"? This will delete all existing codes for upcoming dates and generate new ones. Anyone with old codes will need the new codes to check in.`}
        type="warning"
        isLoading={regeneratingCodes}
      />
    </div>
  );
};

export default EventDetails;