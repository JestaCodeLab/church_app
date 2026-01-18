import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, Clock, MapPin, Users, 
  Save, X, UserCircle, Plus, Mic, Image as ImageIcon
} from 'lucide-react';
import { eventAPI, branchAPI, memberAPI } from '../../../services/api';
import { showToast } from '../../../utils/toasts';
import AddHostModal from '../../../components/modals/AddHostModal';
import AddSpeakerModal from '../../../components/modals/AddSpeakerModal';
import ImageUploader, { GalleryUploader } from '../../../components/modals/ImageUploader';
import FeatureGate from '../../../components/access/FeatureGate';
import { useResourceLimit } from '../../../hooks/useResourceLimit';
import { PermissionRoute } from '../../../components/guards/PermissionRoute';

interface FormData {
  title: string;
  description: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  eventType: string;
  category: string;
  location: {
    venue: string;
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
    };
  };
  branch: string;
  isPublic: boolean;
  status: string;
  // Recurring event support
  isRecurring: boolean;
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    daysOfWeek: number[];
    baseTime: string;
    baseEndTime?: string;
    startDate: string;
    endDate: string;
  };
  allowSelfCheckin?: boolean;
}

const NewEvent: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const eventLimit = useResourceLimit('events');

  // Basic form state
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    eventType: 'service',
    category: 'general',
    location: {
      venue: '',
      address: {
        street: '',
        city: '',
        state: '',
        country: ''
      }
    },
    branch: '',
    isPublic: true,
    status: 'draft',
    isRecurring: false,
    recurrence: {
      frequency: 'weekly',
      daysOfWeek: [0], // Sunday
      baseTime: '09:00',
      baseEndTime: '',
      startDate: '',
      endDate: ''
    },
    allowSelfCheckin: false
  });

  // Image uploads
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string>('');
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  // Hosts and Speakers
  const [hosts, setHosts] = useState<any[]>([]);
  const [speakers, setSpeakers] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  // Modals
  const [showAddHostModal, setShowAddHostModal] = useState(false);
  const [showAddSpeakerModal, setShowAddSpeakerModal] = useState(false);

  // Other state
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
      fetchInitialData();
  }, [id]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);

      // Fetch branches
      const branchResponse = await branchAPI.getBranches({ limit: 100 });
      setBranches(branchResponse.data.data.branches);

      // Fetch members for host/speaker selection
      const memberResponse = await memberAPI.getMembers({ 
        status: 'active', 
        limit: 1000 
      });
      setMembers(memberResponse.data.data.members);

      // If editing, load existing event data
      if (isEdit && id) {
        const eventResponse = await eventAPI.getEvent(id);
        const event = eventResponse.data.data.event;
        
        // Set form data
        setFormData({
          title: event.title || '',
          description: event.description || '',
          eventDate: event.eventDate ? event.eventDate.split('T')[0] : '',
          startTime: event.startTime || '',
          endTime: event.endTime || '',
          eventType: event.eventType || 'service',
          category: event.category || 'general',
          location: event.location || {
            venue: '',
            address: { street: '', city: '', state: '', country: '' }
          },
          branch: event.branch?._id || event.branch || '',
          isPublic: event.isPublic !== false,
          status: event.status || 'draft',
          isRecurring: event.isRecurring || false,
          recurrence: event.isRecurring && event.recurrence ? {
            frequency: event.recurrence.frequency || 'weekly',
            daysOfWeek: event.recurrence.daysOfWeek || [0],
            baseTime: event.recurrence.baseTime || '09:00',
            baseEndTime: event.recurrence.baseEndTime || '',
            startDate: event.recurrence.startDate ? event.recurrence.startDate.split('T')[0] : '',
            endDate: event.recurrence.endDate ? event.recurrence.endDate.split('T')[0] : ''
          } : {
            frequency: 'weekly',
            daysOfWeek: [0],
            baseTime: '09:00',
            baseEndTime: '',
            startDate: '',
            endDate: ''
          },
          allowSelfCheckin: event.allowSelfCheckin || false
        });

        // Load cover image preview
        if (event.coverImage?.url) {
          setCoverImagePreview(event.coverImage.url);
        }
        
        // Load gallery previews
        if (event.images?.length > 0) {
          setGalleryPreviews(event.images.map((img: any) => img.url));
        }
        
        // Load hosts
        if (event.hosts) {
          setHosts(event.hosts);
        }
        
        // Load speakers
        if (event.speakers) {
          setSpeakers(event.speakers);
        }
      }
    } catch (error: any) {
      showToast.error('Failed to load form data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Image handlers
  const handleCoverImageSelect = (file: File) => {
    setCoverImage(file);
    setCoverImagePreview(URL.createObjectURL(file));
  };

  const removeCoverImage = () => {
    setCoverImage(null);
    setCoverImagePreview('');
  };

  const handleGalleryImagesSelect = (files: File[]) => {
    setGalleryImages(prev => [...prev, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setGalleryPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== index));
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Host handlers
  const addMemberHost = (memberId: string) => {
    const member = members.find(m => m._id === memberId);
    if (!member) return;
    
    if (hosts.some(h => h.type === 'member' && h.member?._id === memberId)) {
      showToast.error('This member is already a host');
      return;
    }
    
    setHosts([...hosts, {
      type: 'member',
      member: member
    }]);
    setShowAddHostModal(false);
  };

  const addExternalHost = (hostData: any) => {
    setHosts([...hosts, {
      type: 'external',
      externalHost: hostData
    }]);
    setShowAddHostModal(false);
  };

  const removeHost = (index: number) => {
    setHosts(prev => prev.filter((_, i) => i !== index));
  };

  // Speaker handlers
  const addMemberSpeaker = (memberId: string) => {
    const member = members.find(m => m._id === memberId);
    if (!member) return;
    
    if (speakers.some(s => s.type === 'member' && s.member?._id === memberId)) {
      showToast.error('This member is already a speaker');
      return;
    }
    
    setSpeakers([...speakers, {
      type: 'member',
      member: member
    }]);
    setShowAddSpeakerModal(false);
  };

  const addExternalSpeaker = (speakerData: any) => {
    setSpeakers([...speakers, {
      type: 'external',
      externalSpeaker: speakerData
    }]);
    setShowAddSpeakerModal(false);
  };

  const removeSpeaker = (index: number) => {
    setSpeakers(prev => prev.filter((_, i) => i !== index));
  };

  // Form handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name.includes('.')) {
      const keys = name.split('.');
      setFormData(prev => {
        const updated: any = { ...prev };
        let current = updated;
        
        for (let i = 0; i < keys.length - 1; i++) {
          current[keys[i]] = { ...current[keys[i]] };
          current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = 
          type === 'number' ? (value ? parseInt(value) : 0) : value;
        
        return updated;
      });
    } else {
      setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value 
      }));
    }
    
    if (errors[name]) {
      setErrors((prev: any) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    
    // For recurring events, use base time; for one-time events, use event date and start time
    if (formData.isRecurring) {
      if (!formData.recurrence?.baseTime) newErrors['recurrence.baseTime'] = 'Base time is required';
      if (!formData.recurrence?.startDate) newErrors['recurrence.startDate'] = 'Start date is required';
      if (!formData.recurrence?.daysOfWeek || formData.recurrence.daysOfWeek.length === 0) {
        newErrors['recurrence.daysOfWeek'] = 'Select at least one day';
      }
    } else {
      if (!formData.eventDate) newErrors.eventDate = 'Service date is required';
      if (!formData.startTime) newErrors.startTime = 'Start time is required';
    }
    
    if (!formData.location.venue.trim()) newErrors['location.venue'] = 'Venue is required';
    if (!formData.branch) newErrors.branch = 'Branch is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast.error('Please fill in all required fieldszzz');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Create FormData for file uploads
      const submitData = new FormData();
      
      // Add basic fields
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      
      // Only add eventDate and startTime for one-time events
      if (!formData.isRecurring) {
        submitData.append('eventDate', formData.eventDate);
        submitData.append('startTime', formData.startTime);
        submitData.append('endTime', formData.endTime);
      } else {
        // For recurring events, explicitly set these to null to clear them if updating
        submitData.append('eventDate', '');
        submitData.append('startTime', '');
        submitData.append('endTime', '');
      }
      
      submitData.append('eventType', formData.eventType);
      submitData.append('category', formData.category);
      submitData.append('branch', formData.branch);
      submitData.append('isPublic', String(formData.isPublic));
      submitData.append('status', formData.status);
      
      // Add location as JSON string
      submitData.append('location', JSON.stringify(formData.location));
      
      // Add recurring event data
      submitData.append('isRecurring', String(formData.isRecurring));
      if (formData.isRecurring && formData.recurrence) {
        submitData.append('recurrence', JSON.stringify(formData.recurrence));
      }
      
      // Add self check-in setting
      submitData.append('allowSelfCheckin', String(formData.allowSelfCheckin || false));
      
      // Add cover image
      if (coverImage) {
        submitData.append('coverImage', coverImage);
      }
      
      // Add gallery images
      galleryImages.forEach((image) => {
        submitData.append('gallery', image);
      });
      
      // Add hosts as JSON
      const hostsData = hosts.map(host => {
        if (host.type === 'member') {
          return {
            type: 'member',
            member: host.member._id
          };
        } else {
          return {
            type: 'external',
            externalHost: host.externalHost
          };
        }
      });
      submitData.append('hosts', JSON.stringify(hostsData));
      
      // Add speakers as JSON
      const speakersData = speakers.map(speaker => {
        if (speaker.type === 'member') {
          return {
            type: 'member',
            member: speaker.member._id
          };
        } else {
          return {
            type: 'external',
            externalSpeaker: speaker.externalSpeaker
          };
        }
      });
      submitData.append('speakers', JSON.stringify(speakersData));
      
      let response;
      if (isEdit) {
        response = await eventAPI.updateEvent(id!, submitData);
      } else {
        response = await eventAPI.createEvent(submitData);
      }
      
      showToast.success(isEdit ? 'Service updated successfully' : 'Service created successfully');
      navigate(`/services/${response.data.data.event._id}`);
      
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to save service');
      console.error('Submit error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading service...</p>
        </div>
      </div>
    );
  }

  return (
    <PermissionRoute permissions={['events.create', 'events.edit']} redirectTo={`/services/${id}`}>
      <FeatureGate feature={'eventManagement'} usageExceeded={!eventLimit?.canCreate}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
          <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <button
                onClick={() => navigate('/services')}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors mb-4"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Services</span>
              </button>
              
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {isEdit ? 'Edit Service' : 'New Service'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-0">
                {isEdit ? 'Update service details' : 'Fill in the details to create a new service'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Basic Information</span>
                </h3>
                
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Service Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="e.g., Sunday Morning Service"
                    />
                    {errors.title && (
                      <p className="text-sm text-red-600 mt-1">{errors.title}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
                      placeholder="Describe the service..."
                    />
                  </div>

                  {/* Recurring Event */}
                  <div>
                    <div className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        id="isRecurring"
                        checked={formData.isRecurring}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          isRecurring: e.target.checked
                        }))}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <label htmlFor="isRecurring" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Recurring Event (e.g., Sunday Services)
                      </label>
                    </div>

                    {formData.isRecurring && (
                      <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        {/* Frequency */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Recurrence Pattern
                          </label>
                          <select
                            value={formData.recurrence?.frequency || 'weekly'}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              recurrence: { ...prev.recurrence!, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' }
                            }))}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>

                        {/* Days of Week (for weekly) */}
                        {formData.recurrence?.frequency === 'weekly' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Days of Week
                            </label>
                            <div className="grid grid-cols-7 gap-2">
                              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => {
                                    const days = formData.recurrence?.daysOfWeek || [];
                                    const updated = days.includes(index)
                                      ? days.filter(d => d !== index)
                                      : [...days, index];
                                    setFormData(prev => ({
                                      ...prev,
                                      recurrence: { ...prev.recurrence!, daysOfWeek: updated }
                                    }));
                                  }}
                                  className={`py-2 rounded-lg font-medium text-sm transition-colors ${
                                    (formData.recurrence?.daysOfWeek || []).includes(index)
                                      ? 'bg-primary-600 text-white'
                                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                  }`}
                                >
                                  {day}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Service Time */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Service Start Time *
                            </label>
                            <input
                              type="time"
                              value={formData.recurrence?.baseTime || '09:00'}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                recurrence: { ...prev.recurrence!, baseTime: e.target.value }
                              }))}
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Service End Time (Optional)
                            </label>
                            <input
                              type="time"
                              value={formData.recurrence?.baseEndTime || ''}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                recurrence: { ...prev.recurrence!, baseEndTime: e.target.value }
                              }))}
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                        </div>

                        {/* Start Date */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Start Date *
                          </label>
                          <input
                            type="date"
                            value={formData.recurrence?.startDate || ''}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              recurrence: { ...prev.recurrence!, startDate: e.target.value }
                            }))}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>

                        {/* End Date (Optional) */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            End Date (Optional - leave empty for ongoing)
                          </label>
                          <input
                            type="date"
                            value={formData.recurrence?.endDate || ''}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              recurrence: { ...prev.recurrence!, endDate: e.target.value }
                            }))}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>

                        {/* Self Check-in */}
                        <div className="flex items-center pt-2">
                          <input
                            type="checkbox"
                            id="allowSelfCheckin"
                            checked={formData.allowSelfCheckin || false}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              allowSelfCheckin: e.target.checked
                            }))}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <label htmlFor="allowSelfCheckin" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Allow members to self check-in via QR code or service code
                          </label>
                        </div>

                        {/* Recurrence Pattern Display */}
                        <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Pattern: {formData.recurrence?.frequency === 'weekly'
                              ? `Every ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                                  .filter((_, i) => (formData.recurrence?.daysOfWeek || []).includes(i))
                                  .join(', ')} at ${formData.recurrence?.baseTime || '09:00'}${formData.recurrence?.baseEndTime ? ` - ${formData.recurrence.baseEndTime}` : ''}`
                              : `${formData.recurrence?.frequency === 'daily' ? 'Daily' : 'Monthly'} at ${formData.recurrence?.baseTime || '09:00'}${formData.recurrence?.baseEndTime ? ` - ${formData.recurrence.baseEndTime}` : ''}`
                            }
                          </p>
                          {formData.recurrence?.startDate && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              Starting {new Date(formData.recurrence.startDate).toLocaleDateString()} {formData.recurrence?.endDate ? `until ${new Date(formData.recurrence.endDate).toLocaleDateString()}` : '(ongoing)'}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Event Type & Category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Service Type *
                      </label>
                      <select
                        name="eventType"
                        value={formData.eventType}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="service">Service</option>
                        <option value="meeting">Meeting</option>
                        <option value="conference">Conference</option>
                        <option value="workshop">Workshop</option>
                        <option value="social">Social Event</option>
                        <option value="outreach">Outreach</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Category *
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="general">General</option>
                        <option value="worship">Worship</option>
                        <option value="prayer">Prayer</option>
                        <option value="leadership">Leadership</option>
                        <option value="youth">Youth</option>
                        <option value="children">Children</option>
                        <option value="men">Men</option>
                        <option value="women">Women</option>
                        <option value="special">Special</option>
                      </select>
                    </div>
                  </div>

                  {/* Date & Time - Only for one-time events */}
                  {!formData.isRecurring && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Service Date *
                        </label>
                        <input
                          type="date"
                          name="eventDate"
                          value={formData.eventDate}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                        {errors.eventDate && (
                          <p className="text-sm text-red-600 mt-1">{errors.eventDate}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Start Time *
                        </label>
                        <input
                          type="time"
                          name="startTime"
                          value={formData.startTime}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                        {errors.startTime && (
                          <p className="text-sm text-red-600 mt-1">{errors.startTime}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          End Time
                        </label>
                        <input
                          type="time"
                          name="endTime"
                          value={formData.endTime}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    </div>
                  )}

                  {/* Branch */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Branch *
                    </label>
                    <select
                      name="branch"
                      value={formData.branch}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Select a Branch</option>
                      {branches.map(branch => (
                        <option key={branch._id} value={branch._id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                    {errors.branch && (
                      <p className="text-sm text-red-600 mt-1">{errors.branch}</p>
                    )}
                  </div>

                  {/* Status & Visibility */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    <div className="flex items-center pt-7">
                      <input
                        type="checkbox"
                        name="isPublic"
                        checked={formData.isPublic}
                        onChange={handleChange}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <label className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Public Service (visible to non-members)
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
                  <MapPin className="w-5 h-5" />
                  <span>Location</span>
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Venue *
                    </label>
                    <input
                      type="text"
                      name="location.venue"
                      value={formData.location.venue}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="e.g., Main Sanctuary, Fellowship Hall"
                    />
                    {errors['location.venue'] && (
                      <p className="text-sm text-red-600 mt-1">{errors['location.venue']}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Street Address
                      </label>
                      <input
                        type="text"
                        name="location.address.street"
                        value={formData.location.address.street}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        name="location.address.city"
                        value={formData.location.address.city}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Cover Image */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
                  <ImageIcon className="w-5 h-5" />
                  <span>Cover Image</span>
                </h3>
                <ImageUploader
                  label="Service Cover Image (Optional)"
                  preview={coverImagePreview}
                  onImageSelect={handleCoverImageSelect}
                  onImageRemove={removeCoverImage}
                  maxSize={5}
                />
              </div>

              {/* Gallery */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Gallery Images
                </h3>
                <GalleryUploader
                  label="Service Gallery (Optional)"
                  previews={galleryPreviews}
                  onImagesSelect={handleGalleryImagesSelect}
                  onImageRemove={removeGalleryImage}
                  maxImages={10}
                  maxSize={5}
                />
              </div>

              {/* Hosts */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Service Hosts (Optional)</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddHostModal(true)}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Host</span>
                  </button>
                </div>
                
                {hosts.length > 0 ? (
                  <div className="space-y-2">
                    {hosts.map((host, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {host.type === 'member' && host.member?.photo ? (
                            <img
                              src={host.member.photo}
                              alt={`${host.member.firstName} ${host.member.lastName}`}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <UserCircle className="w-10 h-10 text-gray-400" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {host.type === 'member' 
                                ? `${host.member.firstName} ${host.member.lastName}`
                                : host.externalHost.name
                              }
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {host.type === 'member' 
                                ? 'Church Member'
                                : `${host.externalHost.title}${host.externalHost.organization ? ` • ${host.externalHost.organization}` : ''}`
                              }
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeHost(index)}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No hosts added yet
                  </p>
                )}
              </div>

              {/* Speakers */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                    <Mic className="w-5 h-5" />
                    <span>Service Speakers (Optional)</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddSpeakerModal(true)}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Speaker</span>
                  </button>
                </div>
                
                {speakers.length > 0 ? (
                  <div className="space-y-2">
                    {speakers.map((speaker, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {speaker.type === 'member' && speaker.member?.photo ? (
                            <img
                              src={speaker.member.photo}
                              alt={`${speaker.member.firstName} ${speaker.member.lastName}`}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <UserCircle className="w-10 h-10 text-gray-400" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {speaker.type === 'member' 
                                ? `${speaker.member.firstName} ${speaker.member.lastName}`
                                : speaker.externalSpeaker.name
                              }
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {speaker.type === 'member' 
                                ? 'Church Member'
                                : speaker.externalSpeaker.title
                              }
                            </p>
                            {speaker.type === 'external' && speaker.externalSpeaker.topic && (
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                Topic: {speaker.externalSpeaker.topic}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSpeaker(index)}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No speakers added yet
                  </p>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => navigate('/services')}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-lg flex items-center space-x-2 transition-colors disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{isEdit ? 'Update Service' : 'Create Service'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Modals */}
            <AddHostModal
              isOpen={showAddHostModal}
              onClose={() => setShowAddHostModal(false)}
              onAddMemberHost={addMemberHost}
              onAddExternalHost={addExternalHost}
              members={members}
              existingHosts={hosts}
            />

            <AddSpeakerModal
              isOpen={showAddSpeakerModal}
              onClose={() => setShowAddSpeakerModal(false)}
              onAddMemberSpeaker={addMemberSpeaker}
              onAddExternalSpeaker={addExternalSpeaker}
              members={members}
              existingSpeakers={speakers}
            />
          </div>
        </div>
      </FeatureGate>
    </PermissionRoute>
  );
};

export default NewEvent;