import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, MapPin, Users, CheckCircle, Loader, AlertCircle, Clock } from 'lucide-react';
import axios from 'axios';

const EventCheckIn = () => {
  const { qrData } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

  useEffect(() => {
    fetchEvent();
  }, [qrData]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/public/events/qr/${qrData}`);
      setEvent(response.data.data.event);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Event not found');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await axios.post(`${API_BASE_URL}/public/events/qr/${qrData}/checkin`, formData);
      setSuccess(true);
      setFormData({ firstName: '', lastName: '', phone: '', email: '' });
    } catch (error: any) {
      setError(error.response?.data?.message || 'Check-in failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

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
            Event Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Please check the QR code or contact the event organizer
          </p>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Check-in Successful!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You're all set for
            </p>
            <h3 className="text-xl font-semibold text-primary-600 dark:text-primary-400 mb-4">
              {event?.title}
            </h3>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center justify-center">
                <Calendar className="w-4 h-4 mr-2" />
                {event && formatDate(event.eventDate)}
              </div>
              <div className="flex items-center justify-center">
                <Clock className="w-4 h-4 mr-2" />
                {event?.startTime}
              </div>
              <div className="flex items-center justify-center">
                <MapPin className="w-4 h-4 mr-2" />
                {event?.location?.venue || event?.branch?.name}
              </div>
            </div>
          </div>

          <p className="text-lg text-gray-900 dark:text-gray-100 font-medium mb-2">
            See you at the event! 🎉
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Please arrive a few minutes early
          </p>
        </div>
      </div>
    );
  }

  // Event at capacity
  if (event?.isFull) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-20 h-20 mx-auto text-orange-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Event at Capacity
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            {event.title}
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Unfortunately, this event has reached maximum capacity and is no longer accepting check-ins.
          </p>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Please contact the event organizer for more information
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main check-in form
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full">
        {/* Event Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {event?.title}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Quick event check-in
          </p>
        </div>

        {/* Event Details */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-start">
              <Calendar className="w-4 h-4 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {event && formatDate(event.eventDate)}
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Clock className="w-4 h-4 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {event?.startTime}
                  {event?.endTime && ` - ${event.endTime}`}
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <MapPin className="w-4 h-4 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {event?.location?.venue || event?.branch?.name || 'Venue TBA'}
                </p>
                {event?.location?.address?.city && (
                  <p className="text-xs mt-1">
                    {event.location.address.street && `${event.location.address.street}, `}
                    {event.location.address.city}
                  </p>
                )}
              </div>
            </div>

            {event?.capacity?.enabled && (
              <div className="flex items-start">
                <Users className="w-4 h-4 mr-3 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {event.availableSpots} spots remaining
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{ 
                        width: `${100 - (event.availableSpots / event.capacity.maxAttendees * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800 dark:text-red-300 flex items-start">
              <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              {error}
            </p>
          </div>
        )}

        {/* Check-in Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              First Name *
            </label>
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
              placeholder="John"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Last Name *
            </label>
            <input
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
              placeholder="Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="+233XXXXXXXXX"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Required for attendance tracking
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email (Optional)
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
              placeholder="john@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {submitting ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Checking in...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Check In to Event
              </>
            )}
          </button>
        </form>

        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-6">
          By checking in, you confirm your attendance at this event
        </p>
      </div>
    </div>
  );
};

export default EventCheckIn;