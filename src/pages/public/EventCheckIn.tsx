import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, CheckCircle, Loader, AlertCircle, Clock, ArrowLeft, Phone, User } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ThemeToggle from '../../components/ui/ThemeToggle';
import { validatePhone } from '../../utils/validators';

const EventCheckIn = () => {
  // Support both old (qrData) and new (eventId) params
  const { qrData, eventId } = useParams();
  const navigate = useNavigate();
  const isNewSystem = !!eventId;
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

  // State
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [checkinData, setCheckinData] = useState<any>(null);

  // Form state - unified for both systems
  const [formData, setFormData] = useState({
    phone: '',
    code: '', // For new system: event code
    firstName: '', // For old system: guest first name
    lastName: '' // For old system: guest last name
  });

  const fetchEvent = useCallback(async () => {
    try {
      setLoading(true);
      let response;

      if (isNewSystem) {
        // New system: fetch event info with event code
        response = await axios.get(`${API_BASE_URL}/attendance/public/event/${eventId}`);
        if (response.data.success) {
          setEvent(response.data.data.event);
        }
      } else {
        // Old system: fetch via QR data
        response = await axios.get(`${API_BASE_URL}/public/events/qr/${qrData}`);
        setEvent(response.data.data.event);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Event not found';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [qrData, eventId, isNewSystem, API_BASE_URL]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (isNewSystem) {
        // New system: check-in with event code
        if (!formData.code.trim()) {
          toast.error('Please enter the event code');
          setSubmitting(false);
          return;
        }

        if (formData.code.length !== 4 || !/^\d{4}$/.test(formData.code)) {
          toast.error('Service code must be 4 digits');
          setSubmitting(false);
          return;
        }

        if (!formData.phone.trim()) {
          toast.error('Please enter your phone number');
          setSubmitting(false);
          return;
        }

        const phoneValidation = validatePhone(formData.phone);
        if (!phoneValidation.valid) {
          toast.error(phoneValidation.error || 'Invalid phone number');
          setSubmitting(false);
          return;
        }

        const deviceId = localStorage.getItem('deviceId') || 'web-' + Date.now();
        localStorage.setItem('deviceId', deviceId);

        const response = await axios.post(`${API_BASE_URL}/attendance/public/checkin`, {
          eventId,
          code: formData.code,
          phone: formData.phone,
          deviceId,
          ipAddress: 'web'
        });

        if (response.data.success) {
          setSuccess(true);
          setCheckinData(response.data.data.attendance);
          toast.success('Successfully checked in!');
          setFormData({ phone: '', code: '', firstName: '', lastName: '' });
        }
      } else {
        // Old system: check-in with guest details
        if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.phone.trim()) {
          toast.error('Please fill in all required fields');
          setSubmitting(false);
          return;
        }

        const phoneValidation = validatePhone(formData.phone);
        if (!phoneValidation.valid) {
          toast.error(phoneValidation.error || 'Invalid phone number');
          setSubmitting(false);
          return;
        }

        const response = await axios.post(`${API_BASE_URL}/public/events/qr/${qrData}/checkin`, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone
        });

        if (response.data.success) {
          setSuccess(true);
          setCheckinData(response.data.data?.attendance);
          toast.success('Successfully checked in!');
          setFormData({ phone: '', code: '', firstName: '', lastName: '' });
        }
      }
    } catch (error: any) {
      const errorCode = error.response?.data?.code;
      let message = error.response?.data?.message || 'Check-in failed. Please try again.';
      
      // Provide more specific messages based on error code
      if (errorCode === 'code_not_yet_valid') {
        // Don't toast for not-yet-valid as it's informational
        setError(message);
      } else if (errorCode === 'code_expired') {
        setError(message);
        toast.error(message);
      } else if (errorCode === 'code_not_found' || errorCode === 'code_invalid') {
        setError('Invalid service code. Please check and try again.');
        toast.error('Invalid service code. Please check and try again.');
      } else {
        setError(message);
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getTime = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}
   


  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading event...</p>
        </div>
      </div>
    );
  }

  // Error state - Event not found
  if (error && !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-20 h-20 mx-auto text-red-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Service Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Please check the QR code or contact the service organizer
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go back</span>
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-20 h-20 mx-auto text-green-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Welcome {checkinData?.firstName || ''}!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You've successfully checked in to
          </p>
          <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 mb-6">
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {event.title}
            </p>
            {checkinData && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {new Date(checkinData.checkInTime).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              Done
            </button>
            {isNewSystem && (
              <button
                onClick={() => {
                  setSuccess(false);
                  setFormData({ phone: '', code: '', firstName: '', lastName: '' });
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Check In Another Person
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800 py-8">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Event Banner Card with Image */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden mb-8">
          {/* Event Image/Banner */}
          
          <div className="relative h-72 sm:h-80 bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-900 dark:to-blue-950 overflow-hidden">
            {event?.coverImage ? (
              <img 
                src={event?.image || event.coverImage?.url} 
                alt={event?.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-900 dark:to-blue-950"></div>
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,transparent_10%,rgba(0, 0, 0, 0.1)_100%)]"></div>
                </div>
              </div>
            )}
            
            {/* Black Gradient Overlay - Bottom to Top */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent"></div>
            
            {/* Title Overlay */}
            <div className="absolute inset-0 bg-black/10 dark:bg-black/10 flex items-end">
              <div className="w-full p-6 sm:p-8 text-white">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">{event?.title}</h1>
                
                {/* Event Details */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm font-medium mb-1">
                  {event?.eventDate && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(event.eventDate)}</span>
                    </div>
                  )}
                  {event?.startTime && (
                        <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>{getTime(event?.startTime)} {event?.endTime ? `- ${getTime(event.endTime)}` : ''}</span>
                        </div>
                    )}
                
                </div>
                {event?.location?.venue && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location.venue}</span>
                    </div>
                  )}
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="p-6 sm:p-10">
            {/* Error Message Alert */}
            {error && (
              <div className="mb-6 p-4 rounded-lg border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {isNewSystem ? (
                // New System: Event Code Check-in
                <>
                  {/* Event Code Field - Prominent */}
                  <div>
                    <label className="block text-sm font-normal text-gray-700 dark:text-gray-300 mb-3">
                      Service Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="code"
                      maxLength={4}
                      value={formData.code}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setFormData(prev => ({ ...prev, code: value }));
                      }}
                      placeholder="0000"
                      className="w-full px-6 py-4 text-center text-4xl tracking-widest font-mono border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-bold transition-all"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                      Enter the 4-digit code provided at the event
                    </p>
                  </div>

                  {/* Phone Number Field */}
                  <div>
                    <label className="block text-sm font-normal text-gray-700 dark:text-gray-300 mb-3">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="024XXXXXXX"
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                      />
                    </div>
                  </div>
                </>
              ) : (
                // Old System: Guest Registration
                <>
                  {/* First Name & Last Name */}
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-normal text-gray-700 dark:text-gray-300 mb-1">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          placeholder="John"
                          className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-normal text-gray-700 dark:text-gray-300 mb-1">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          placeholder="Doe"
                          className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-normal text-gray-700 dark:text-gray-300 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="024XXXXXXX"
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:bg-blue-700 dark:hover:bg-blue-800 dark:disabled:bg-gray-600 text-white font-bold text-lg rounded-xl transition-all flex items-center justify-center space-x-2 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {submitting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Checking in...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Check In</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCheckIn;
