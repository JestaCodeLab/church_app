import React, { useState, useEffect } from 'react';
import { RRule } from 'rrule';
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
import { useBranch } from '../../../context/BranchContext';
import BranchField from '../../../components/forms/BranchField';

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
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    daysOfWeek: number[];
    baseTime: string;
    baseEndTime?: string;
    startDate: string;
    endDate: string;
    rruleString?: string;
    monthlyType?: 'date' | 'relative';
    monthlyOrdinal?: number;   // 1=first, 2=second, 3=third, 4=fourth, -1=last
    monthlyWeekday?: number;   // 0=Sun … 6=Sat
    yearlyMonth?: number;      // 1–12
    yearlyDay?: number;        // 1–31
  };
  allowSelfCheckin?: boolean;
  // Registration support
  registrationEnabled?: boolean;
  registrationStartDate?: string;
  registrationEndDate?: string;
  registrationMaxCapacity?: number;
  allowGuestRegistration?: boolean;
}

type RecurrenceData = NonNullable<FormData['recurrence']>;

function buildRRuleString(r: RecurrenceData): string {
  if (!r.startDate) throw new Error('startDate required');
  const dtstart = new Date(r.startDate + 'T00:00:00Z');
  const WD = [RRule.SU, RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA];

  if (r.frequency === 'daily')
    return new RRule({ freq: RRule.DAILY, dtstart }).toString();

  if (r.frequency === 'weekly')
    return new RRule({ freq: RRule.WEEKLY, byweekday: r.daysOfWeek.map(d => WD[d]), dtstart }).toString();

  if (r.frequency === 'monthly') {
    if (r.monthlyType === 'relative' && r.monthlyWeekday != null && r.monthlyOrdinal != null)
      return new RRule({ freq: RRule.MONTHLY, byweekday: WD[r.monthlyWeekday].nth(r.monthlyOrdinal), dtstart }).toString();
    return new RRule({ freq: RRule.MONTHLY, bymonthday: r.daysOfWeek[0] || 1, dtstart }).toString();
  }

  if (r.frequency === 'yearly' && r.yearlyMonth != null && r.yearlyDay != null)
    return new RRule({ freq: RRule.YEARLY, bymonth: r.yearlyMonth, bymonthday: r.yearlyDay, dtstart }).toString();

  throw new Error('Incomplete recurrence data for buildRRuleString');
}

const NewEvent: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { selectedBranch, branches } = useBranch();
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
    allowSelfCheckin: false,
    registrationEnabled: false,
    registrationStartDate: '',
    registrationEndDate: '',
    registrationMaxCapacity: undefined,
    allowGuestRegistration: true
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
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
      fetchInitialData();
      
      // Auto-populate branch from context (locked user or active branch switch)
      if (selectedBranch && !isEdit) {
        setFormData(prev => ({
          ...prev,
          branch: selectedBranch._id
        }));
      }
  }, [id, selectedBranch]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);

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
          recurrence: event.isRecurring && event.recurrence ? (() => {
            const r = event.recurrence;
            const base = {
              frequency: r.frequency || 'weekly',
              daysOfWeek: r.daysOfWeek || [0],
              baseTime: r.baseTime || '09:00',
              baseEndTime: r.baseEndTime || '',
              startDate: r.startDate ? r.startDate.split('T')[0] : '',
              endDate: r.endDate ? r.endDate.split('T')[0] : '',
              rruleString: r.rruleString || '',
              monthlyType: 'date' as 'date' | 'relative',
              monthlyOrdinal: undefined as number | undefined,
              monthlyWeekday: undefined as number | undefined,
              yearlyMonth: undefined as number | undefined,
              yearlyDay: undefined as number | undefined,
            };
            if (r.rruleString) {
              try {
                const rule = RRule.fromString(r.rruleString);
                const opts = rule.origOptions;
                if (r.frequency === 'monthly' && opts.byweekday) {
                  const wd = Array.isArray(opts.byweekday) ? opts.byweekday[0] : opts.byweekday;
                  base.monthlyType = 'relative';
                  base.monthlyOrdinal = (wd as any).n;
                  base.monthlyWeekday = (wd as any).weekday;
                } else if (r.frequency === 'monthly' && opts.bymonthday) {
                  base.monthlyType = 'date';
                  base.daysOfWeek = [Array.isArray(opts.bymonthday) ? opts.bymonthday[0] : opts.bymonthday];
                } else if (r.frequency === 'yearly') {
                  base.yearlyMonth = Array.isArray(opts.bymonth) ? opts.bymonth[0] : opts.bymonth as number;
                  base.yearlyDay = Array.isArray(opts.bymonthday) ? opts.bymonthday[0] : opts.bymonthday as number;
                }
              } catch {}
            }
            return base;
          })() : {
            frequency: 'weekly',
            daysOfWeek: [0],
            baseTime: '09:00',
            baseEndTime: '',
            startDate: '',
            endDate: ''
          },
          allowSelfCheckin: event.allowSelfCheckin || false,
          registrationEnabled: event.registration?.enabled || false,
          registrationStartDate: event.registration?.startDate ? event.registration.startDate.replace('Z', '').slice(0, 16) : '',
          registrationEndDate: event.registration?.endDate ? event.registration.endDate.replace('Z', '').slice(0, 16) : '',
          registrationMaxCapacity: event.registration?.maxCapacity || undefined,
          allowGuestRegistration: event.registration?.allowGuestRegistration !== false
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
      const freq = formData.recurrence?.frequency;
      if (freq === 'weekly' && (!formData.recurrence?.daysOfWeek || formData.recurrence.daysOfWeek.length === 0)) {
        newErrors['recurrence.daysOfWeek'] = 'Select at least one day';
      }
      if (freq === 'monthly' && formData.recurrence?.monthlyType === 'relative') {
        if (formData.recurrence.monthlyOrdinal == null) newErrors['recurrence.monthlyOrdinal'] = 'Select an ordinal (first, second…)';
        if (formData.recurrence.monthlyWeekday == null) newErrors['recurrence.monthlyWeekday'] = 'Select a weekday';
      }
      if (freq === 'monthly' && formData.recurrence?.monthlyType === 'date') {
        if (!formData.recurrence.daysOfWeek[0]) newErrors['recurrence.daysOfWeek'] = 'Enter a day of month';
      }
      if (freq === 'yearly') {
        if (formData.recurrence?.yearlyMonth == null) newErrors['recurrence.yearlyMonth'] = 'Select a month';
        if (formData.recurrence?.yearlyDay == null) newErrors['recurrence.yearlyDay'] = 'Enter a day';
      }
    } else {
      if (!formData.eventDate) newErrors.eventDate = 'Event date is required';
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
      showToast.error('Please fill in all required fields');
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
        let recurrenceToSend = formData.recurrence;
        try {
          recurrenceToSend = { ...formData.recurrence, rruleString: buildRRuleString(formData.recurrence) };
        } catch (e) {
          // If buildRRuleString fails (incomplete data), send without rruleString
        }
        submitData.append('recurrence', JSON.stringify(recurrenceToSend));
      }
      
      // Add self check-in setting
      submitData.append('allowSelfCheckin', String(formData.allowSelfCheckin || false));
      
      // Add registration settings
      submitData.append('registrationEnabled', String(formData.registrationEnabled || false));
      if (formData.registrationEnabled) {
        if (formData.registrationStartDate) {
          submitData.append('registrationStartDate', formData.registrationStartDate);
        }
        if (formData.registrationEndDate) {
          submitData.append('registrationEndDate', formData.registrationEndDate);
        }
        if (formData.registrationMaxCapacity) {
          submitData.append('registrationMaxCapacity', String(formData.registrationMaxCapacity));
        }
        submitData.append('allowGuestRegistration', String(formData.allowGuestRegistration !== false));
      }
      
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
      
      showToast.success(isEdit ? 'Event updated successfully' : 'Event created successfully');
      navigate(`/events/${response.data.data.event._id}`);
      
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to save event');
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
          <p className="text-gray-600 dark:text-gray-400">Loading event...</p>
        </div>
      </div>
    );
  }

  return (
    <PermissionRoute permissions={['events.create', 'events.edit']} redirectTo={`/events/${id}`}>
      <FeatureGate feature={'eventManagement'} usageExceeded={!eventLimit?.canCreate}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
          <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <button
                onClick={() => navigate('/events')}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors mb-4"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Events</span>
              </button>
              
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {isEdit ? 'Edit Event' : 'New Event'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-0">
                {isEdit ? 'Update event details' : 'Fill in the details to create a new event'}
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
                      Event Title *
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
                      placeholder="Describe the event..."
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
                      <div className="space-y-4 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                        {/* Frequency */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Recurrence Pattern
                          </label>
                          <select
                            value={formData.recurrence?.frequency || 'weekly'}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              recurrence: { ...prev.recurrence!, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly', monthlyType: 'date' }
                            }))}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
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

                        {/* Monthly options */}
                        {formData.recurrence?.frequency === 'monthly' && (
                          <div className="space-y-3">
                            <select
                              value={formData.recurrence?.monthlyType || 'date'}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                recurrence: { ...prev.recurrence!, monthlyType: e.target.value as 'date' | 'relative' }
                              }))}
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            >
                              <option value="date">On a specific date (e.g. the 15th)</option>
                              <option value="relative">On a relative day (e.g. first Tuesday)</option>
                            </select>

                            {(formData.recurrence?.monthlyType === 'date' || !formData.recurrence?.monthlyType) && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Day of month</label>
                                <input
                                  type="number"
                                  min={1}
                                  max={31}
                                  placeholder="1–31"
                                  value={formData.recurrence?.daysOfWeek[0] ?? ''}
                                  onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    recurrence: { ...prev.recurrence!, daysOfWeek: [parseInt(e.target.value) || 1] }
                                  }))}
                                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                />
                              </div>
                            )}

                            {formData.recurrence?.monthlyType === 'relative' && (
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Which</label>
                                  <select
                                    value={formData.recurrence?.monthlyOrdinal ?? ''}
                                    onChange={(e) => setFormData(prev => ({
                                      ...prev,
                                      recurrence: { ...prev.recurrence!, monthlyOrdinal: parseInt(e.target.value) }
                                    }))}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                  >
                                    <option value="">Select…</option>
                                    <option value="1">First</option>
                                    <option value="2">Second</option>
                                    <option value="3">Third</option>
                                    <option value="4">Fourth</option>
                                    <option value="-1">Last</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Weekday</label>
                                  <select
                                    value={formData.recurrence?.monthlyWeekday ?? ''}
                                    onChange={(e) => setFormData(prev => ({
                                      ...prev,
                                      recurrence: { ...prev.recurrence!, monthlyWeekday: parseInt(e.target.value) }
                                    }))}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                  >
                                    <option value="">Select…</option>
                                    {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((d, i) => (
                                      <option key={i} value={i}>{d}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Yearly options */}
                        {formData.recurrence?.frequency === 'yearly' && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Month</label>
                              <select
                                value={formData.recurrence?.yearlyMonth ?? ''}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  recurrence: { ...prev.recurrence!, yearlyMonth: parseInt(e.target.value) }
                                }))}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              >
                                <option value="">Select…</option>
                                {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                                  <option key={i} value={i + 1}>{m}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Day</label>
                              <input
                                type="number"
                                min={1}
                                max={31}
                                placeholder="1–31"
                                value={formData.recurrence?.yearlyDay ?? ''}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  recurrence: { ...prev.recurrence!, yearlyDay: parseInt(e.target.value) }
                                }))}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              />
                            </div>
                          </div>
                        )}

                        {/* Service Time */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Event Start Time *
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
                              Event End Time (Optional)
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
                            min={new Date().toISOString().split('T')[0]}
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
                            Allow members to self check-in via QR code or event code
                          </label>
                        </div>

                        {/* Recurrence Pattern Display */}
                        {formData.recurrence?.startDate && (() => {
                          let patternText = '';
                          try { patternText = RRule.fromString(buildRRuleString(formData.recurrence!)).toText(); } catch {}
                          return (
                            <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                              {patternText && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Pattern: <span className="capitalize">{patternText}</span>
                                  {formData.recurrence?.baseTime ? ` at ${formData.recurrence.baseTime}` : ''}
                                  {formData.recurrence?.baseEndTime ? ` – ${formData.recurrence.baseEndTime}` : ''}
                                </p>
                              )}
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Starting {new Date(formData.recurrence!.startDate).toLocaleDateString()}{formData.recurrence?.endDate ? ` until ${new Date(formData.recurrence.endDate).toLocaleDateString()}` : ' (ongoing)'}
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Event Type & Category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Event Type *
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
                        <option value="seminar">Seminar</option>
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
                          Event Date *
                        </label>
                        <input
                          type="date"
                          name="eventDate"
                          value={formData.eventDate}
                          min={new Date().toISOString().split('T')[0]}
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
                    <BranchField
                      value={formData.branch}
                      onChange={(branchId) => setFormData(prev => ({ ...prev, branch: branchId }))}
                      required
                      allBranches={branches}
                      error={errors.branch}
                    />
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
                        Public Event (visible to non-members)
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
                  label="Event Cover Image (Optional)"
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
                  label="Event Gallery (Optional)"
                  previews={galleryPreviews}
                  onImagesSelect={handleGalleryImagesSelect}
                  onImageRemove={removeGalleryImage}
                  maxImages={10}
                  maxSize={5}
                />
              </div>

              {/* Pre-Registration Settings */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Pre-Registration (Optional)
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="registrationEnabled"
                      checked={formData.registrationEnabled || false}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        registrationEnabled: e.target.checked
                      }))}
                      className="w-4 h-4 text-primary-600 rounded cursor-pointer"
                    />
                    <label htmlFor="registrationEnabled" className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                      Enable Pre-Registration for this event
                    </label>
                  </div>
                  
                  {formData.registrationEnabled && (
                    <div className="space-y-4 pl-6 border-l-2 border-primary-200 dark:border-primary-800">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Registration Opens */}
                        <div>
                          <label htmlFor="registrationStartDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Registration Opens
                          </label>
                          <input
                            type="datetime-local"
                            id="registrationStartDate"
                            value={formData.registrationStartDate || ''}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              registrationStartDate: e.target.value
                            }))}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                          {errors.registrationStartDate && (
                            <p className="text-red-600 text-sm mt-1">{errors.registrationStartDate}</p>
                          )}
                        </div>

                        {/* Registration Closes */}
                        <div>
                          <label htmlFor="registrationEndDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Registration Closes
                          </label>
                          <input
                            type="datetime-local"
                            id="registrationEndDate"
                            value={formData.registrationEndDate || ''}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              registrationEndDate: e.target.value
                            }))}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                          {errors.registrationEndDate && (
                            <p className="text-red-600 text-sm mt-1">{errors.registrationEndDate}</p>
                          )}
                        </div>
                      </div>

                      {/* Max Capacity */}
                      <div>
                        <label htmlFor="registrationMaxCapacity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Max Capacity (Leave blank for unlimited)
                        </label>
                        <input
                          type="number"
                          id="registrationMaxCapacity"
                          value={formData.registrationMaxCapacity || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            registrationMaxCapacity: e.target.value ? parseInt(e.target.value) : undefined
                          }))}
                          min="1"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="e.g., 100"
                        />
                        {errors.registrationMaxCapacity && (
                          <p className="text-red-600 text-sm mt-1">{errors.registrationMaxCapacity}</p>
                        )}
                      </div>

                      {/* Allow Guest Registration */}
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="allowGuestRegistration"
                          checked={formData.allowGuestRegistration !== false}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            allowGuestRegistration: e.target.checked
                          }))}
                          className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                        />
                        <label htmlFor="allowGuestRegistration" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Allow guest registration (non-members)
                        </label>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                          <span className="font-semibold">Note:</span> Pre-registration allows attendees to register their intent to attend before the event date. Registrations are separate from check-ins.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Hosts */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Event Hosts (Optional)</span>
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
                    <span>Event Speakers (Optional)</span>
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
                  onClick={() => navigate('/events')}
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
                      <span>{isEdit ? 'Update Event' : 'Create Event'}</span>
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