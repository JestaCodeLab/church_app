import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import ThemeToggle from '../../components/ui/ThemeToggle';

// Extract merchant subdomain from URL and build API URL
const getAPIBaseURL = () => {
  const hostname = window.location.hostname;
  
  // If it's localhost or 127.0.0.1, use environment variable
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';
  }
  
  // Extract subdomain (e.g., "zionhill" from "zionhill.localhost:3000")
  const parts = hostname.split('.');
  const subdomain = parts[0];
  
  // Build API URL using same protocol and port, but to API host
  const protocol = window.location.protocol;
  const port = window.location.port ? `:${window.location.port}` : '';
  
  // For localhost development: use zionhill.localhost:5000
  // For production: would need adjustment based on your setup
  if (hostname.includes('localhost')) {
    return `${protocol}//api.${subdomain}.localhost:5000/api/v1`;
  }
  
  // For production domains
  return `${protocol}//${subdomain}.api.churchhq.com/api/v1`;
};

const API_BASE_URL = getAPIBaseURL();

// Helper function to convert 24-hour time to 12-hour format
const convertTo12Hour = (time24: string): string => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${period}`;
};

interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  attendanceCount: number;
  type: 'member' | 'guest';
}

const EventRegistrationPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [registrationClosed, setRegistrationClosed] = useState(false);
  const [capacityFull, setCapacityFull] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [registrationStats, setRegistrationStats] = useState({
    total: 0,
    capacity: 0,
  });

  const [formData, setFormData] = useState<RegistrationData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    attendanceCount: 1,
    type: 'guest',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/public/events/${eventId}`
      );
      const eventData = response.data.data?.event;
      setEvent(eventData);

      if (!eventData.registration?.enabled) {
        setRegistrationOpen(false);
        setRegistrationClosed(true);
        return;
      }

      // Check registration window
      const now = new Date();
      const regStart = new Date(eventData.registration.startDate);
      const regEnd = new Date(eventData.registration.endDate);

      if (now < regStart) {
        setRegistrationOpen(false);
      } else if (now > regEnd) {
        setRegistrationOpen(false);
        setRegistrationClosed(true);
      } else {
        setRegistrationOpen(true);
      }

      // Fetch registration stats
      try {
        const statsResponse = await axios.get(
          `${API_BASE_URL}/event-registrations/event/${eventId}?limit=1`
        );
        const stats = statsResponse.data.data;
        setRegistrationStats({
          total: stats.totalRegistrations || 0,
          capacity: eventData.registration?.maxCapacity || 0,
        });

        // Check if capacity is full
        if (
          eventData.registration?.maxCapacity &&
          stats.totalRegistrations >= eventData.registration.maxCapacity
        ) {
          setCapacityFull(true);
        }
      } catch (error) {
        console.log('Could not fetch registration stats');
      }

      // Check if already registered
      if (formData.email) {
        try {
          await axios.post(`${API_BASE_URL}/event-registrations/check`, {
            eventId,
            email: formData.email,
          });
          setAlreadyRegistered(false);
        } catch (error: any) {
          if (error.response?.status === 409) {
            setAlreadyRegistered(true);
          }
        }
      }
    } catch (error: any) {
      toast.error('Failed to load event details');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    // Validate phone number - reject international formats
    if (name === 'phone') {
      if (value && (value.startsWith('+233') || value.startsWith('233') || value.startsWith('+0'))) {
        setPhoneError('Phone number must be in local format (e.g., 054 XXX XXXX), not international format');
      } else {
        setPhoneError('');
      }
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'attendanceCount' ? parseInt(value) || 1 : value,
    }));

    // Clear already registered message when email changes
    if (name === 'email') {
      setAlreadyRegistered(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName.trim()) {
      toast.error('Please enter your first name');
      return;
    }

    if (!formData.lastName.trim()) {
      toast.error('Please enter your last name');
      return;
    }

    if (!formData.phone.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    if (phoneError) {
      toast.error(phoneError);
      return;
    }

    if (formData.attendanceCount < 1) {
      toast.error('Attendance count must be at least 1');
      return;
    }

    setSubmitting(true);

    try {
      await axios.post(`${API_BASE_URL}/event-registrations`, {
        eventId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        attendanceCount: formData.attendanceCount,
        type: formData.type,
      });

      setSubmitted(true);
      toast.success('Registration successful! We have sent a confirmation to your email.');

      // Reset form
      setTimeout(() => {
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          attendanceCount: 1,
          type: 'guest',
        });
        setPhoneError('');
        setSubmitted(false);
      }, 3000);
    } catch (error: any) {
      if (error.response?.status === 409) {
        setAlreadyRegistered(true);
        toast.error('You are already registered for this event');
      } else {
        toast.error(
          error.response?.data?.message || 'Failed to register for event'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading event details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800 py-12 px-4">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Go Back</span>
        </button>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div
            className="relative px-8 py-[45px] bg-cover bg-center"
            style={{
              backgroundImage: event?.coverImage
                ? `linear-gradient(135deg, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url("${typeof event.coverImage === 'string' ? event.coverImage : event.coverImage?.url || ''}")`
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <h1 className="text-3xl font-bold text-white mb-1">{event?.title}</h1>
            <p className="text-primary-100">Event Registration</p>
          </div>

          <div className="px-8 py-10">
            {/* Event Details */}
            {event && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 pb-10 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                    <Calendar className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Date</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {event.isRecurring && event.recurrence
                        ? `${format(
                            new Date(event.recurrence.startDate),
                            'MMM dd, yyyy'
                          )} - ${format(
                            new Date(event.recurrence.endDate),
                            'MMM dd, yyyy'
                          )}`
                        : format(new Date(event.eventDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Time</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {convertTo12Hour(event.startTime)} - {convertTo12Hour(event.endTime)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <MapPin className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {event.location?.venue || 'TBA'}
                    </p>
                  </div>
                </div>

                {event.registration?.maxCapacity && (
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                      <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Available Spots
                      </p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {Math.max(0, event.registration.maxCapacity - registrationStats.total)}/
                        {event.registration.maxCapacity}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Status Messages */}
            {registrationClosed && !registrationOpen && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800 dark:text-red-300">
                    Registration Closed
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                    Registration for this event has ended. Thank you for your interest!
                  </p>
                </div>
              </div>
            )}

            {capacityFull && registrationOpen && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-orange-800 dark:text-orange-300">
                    Event Full
                  </p>
                  <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
                    This event has reached maximum capacity. Please check back later or
                    contact us for more information.
                  </p>
                </div>
              </div>
            )}

            {submitted && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6 flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-800 dark:text-green-300">
                    Registration Successful!
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                    Thank you for registering. A confirmation has been sent to you.
                  </p>
                </div>
              </div>
            )}

            {alreadyRegistered && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-800 dark:text-yellow-300">
                    Already Registered
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                    You are already registered for this event. If you need to make changes,
                    please contact the event organizer.
                  </p>
                </div>
              </div>
            )}

            {/* Registration Form */}
            {registrationOpen && !capacityFull && !submitted ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Name */}
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      First Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                      placeholder="John"
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Last Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                      placeholder="Doe"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address <span className="text-gray-500 text-xs">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                      placeholder="john@example.com"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:border-transparent transition ${
                        phoneError
                          ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
                          : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
                      }`}
                      placeholder="054 XXX XXXX"
                    />
                    {phoneError && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{phoneError}</p>
                    )}
                  </div>

                  {/* Attendance Count */}
                  <div>
                    <label htmlFor="attendanceCount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Number of Attendees <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="number"
                      id="attendanceCount"
                      name="attendanceCount"
                      value={formData.attendanceCount}
                      onChange={handleInputChange}
                      min="1"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                      placeholder="1"
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Registration Type <span className="text-red-600">*</span>
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    >
                      <option value="guest">Guest</option>
                      <option value="member">Church Member</option>
                    </select>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || capacityFull || registrationClosed}
                  className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Register Now</span>
                    </>
                  )}
                </button>
              </form>
            ) : !registrationOpen && !registrationClosed ? (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-800 dark:text-blue-300">
                    Registration Not Yet Open
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                    Registration for this event will open on{' '}
                    {event?.registration?.startDate
                      ? format(new Date(event.registration.startDate), 'MMMM dd, yyyy \'at\' h:mm a')
                      : 'a date to be announced'}
                    . Please check back later.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 dark:text-gray-400 text-sm mt-8">
          Questions? Contact the event organizer for more information.
        </p>
      </div>
    </div>
  );
};

export default EventRegistrationPage;
