import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, Calendar, MapPin, Users, Loader2 } from 'lucide-react';
import axios from 'axios';
import { showToast } from '../../utils/toasts';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

// Currency symbol mapping
const getCurrencySymbol = (currency: string = 'GHS'): string => {
  const symbols: { [key: string]: string } = {
    'GHS': '₵',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'NGN': '₦',
    'ZAR': 'R',
    'KES': 'KSh',
    'UGX': 'USh'
  };
  return symbols[currency] || currency;
};

// Convert 24-hour time to 12-hour format
const formatTime = (time: string): string => {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

// Format recurring event schedule
const formatRecurringSchedule = (event: EventData): string => {
  if (!event.isRecurring || !event.recurrence) return '';
  
  const { frequency, daysOfWeek, baseTime, startDate } = event.recurrence;
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  let schedule = '';
  
  if (frequency === 'weekly' && daysOfWeek && daysOfWeek.length > 0) {
    const days = daysOfWeek.map(d => dayNames[d]).join(', ');
    schedule = `Every ${days}`;
  } else if (frequency === 'daily') {
    schedule = 'Daily';
  } else if (frequency === 'monthly') {
    schedule = 'Monthly';
  }
  
  if (baseTime) {
    schedule += ` at ${formatTime(baseTime)}`;
  }
  
  if (startDate) {
    const start = new Date(startDate);
    schedule += ` (Starting ${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})`;
  }
  
  return schedule;
};

interface EventData {
  title: string;
  description: string;
  eventDate: string;
  isRecurring?: boolean;
  recurrence?: {
    frequency?: string;
    daysOfWeek?: number[];
    startDate?: string;
    endDate?: string;
    baseTime?: string;
    baseEndTime?: string;
  };
  location: {
    venue?: string;
    address?: any;
  };
  donationDescription: string;
  goal?: {
    amount: number;
    currency: string;
  };
  totalRaised: number;
  donationCount: number;
  allowAnonymous: boolean;
}

interface MerchantData {
  name: string;
}

const PublicEventDonation: React.FC = () => {
  const { uniqueId } = useParams<{ uniqueId: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<EventData | null>(null);
  const [merchant, setMerchant] = useState<MerchantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [amount, setAmount] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [donor, setDonor] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // Preset amounts
  const presetAmounts = [10, 20, 50, 100, 200, 500];

  const loadEventData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/public/events/donate/${uniqueId}`
      );
      setEvent(response.data.data.event);
      setMerchant(response.data.data.merchant);
    } catch (error: any) {
      console.error('Failed to load event:', error);
      showToast.error('Event not found or donations are disabled');
      setTimeout(() => navigate('/'), 3000);
    } finally {
      setLoading(false);
    }
  }, [uniqueId, navigate]);

  useEffect(() => {
    loadEventData();
  }, [loadEventData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!amount || parseFloat(amount) < 1) {
      showToast.error('Please enter a valid donation amount');
      return;
    }

    if (!isAnonymous && (!donor.name || !donor.email)) {
      showToast.error('Please provide your name and email');
      return;
    }

    if (isAnonymous && !donor.email) {
      showToast.error('Email is required even for anonymous donations');
      return;
    }

    try {
      setSubmitting(true);

      const response = await axios.post(
        `${API_BASE_URL}/public/events/donate/${uniqueId}/initiate`,
        {
          amount: parseFloat(amount),
          donor,
          isAnonymous
        }
      );

      // Redirect to Paystack
      const { authorization_url } = response.data.data;
      window.location.href = authorization_url;
    } catch (error: any) {
      console.error('Donation error:', error);
      showToast.error(
        error.response?.data?.message || 'Failed to initiate donation',
      );
      setSubmitting(false);
    }
  };

  const progressPercentage = event?.goal?.amount
    ? Math.min(((event.totalRaised || 0) / event.goal.amount) * 100, 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Event not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        {/* Merchant Name */}
        {merchant && (
          <div className="text-center mb-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Organized by</p>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {merchant.name}
            </h2>
          </div>
        )}

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <Heart className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {event.title}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Support This Event</p>
            </div>
          </div>

          {/* Event Details */}
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            {event.isRecurring ? (
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>{formatRecurringSchedule(event)}</span>
              </div>
            ) : event.eventDate ? (
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(event.eventDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
            ) : null}
            {event.location?.venue && (
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>{event.location.venue}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {event.donationDescription && (
            <p className="mt-4 text-gray-700 dark:text-gray-300">
              {event.donationDescription}
            </p>
          )}

          {/* Progress */}
          {event.goal && event.goal.amount && (
            <div className="mt-6 p-4 border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-900 dark:text-white">
                  {event.goal.currency} {(event.totalRaised || 0).toLocaleString()} raised
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  of {event.goal.currency} {event.goal.amount.toLocaleString()} goal
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <Users className="w-4 h-4 inline mr-1" />
                {event.donationCount || 0} {(event.donationCount || 0) === 1 ? 'donation' : 'donations'}
              </p>
            </div>
          )}
        </div>

        {/* Donation Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Make a Donation
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Donation Amount ({event.goal?.currency || 'GHS'})
              </label>

              {/* Preset Amounts */}
              <div className="grid grid-cols-3 gap-3 mb-3">
                {presetAmounts.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset.toString())}
                    className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
                      amount === preset.toString()
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-green-600'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">
                    {getCurrencySymbol(event?.goal?.currency)}
                  </span>
                </div>
                <input
                  type="number"
                  min="10"
                  step="5"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onWheel={
                    (e) => (e.target as HTMLInputElement).blur()
                  }
                  placeholder="Enter custom amount"
                  required
                  className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Anonymous Toggle */}
            {event.allowAnonymous && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="anonymous" className="text-sm text-gray-700 dark:text-gray-300">
                  Make this an anonymous donation
                </label>
              </div>
            )}

            {/* Donor Information */}
            {!isAnonymous && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={donor.name}
                    onChange={(e) => setDonor({ ...donor, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={donor.email}
                    onChange={(e) => setDonor({ ...donor, email: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={donor.phone}
                    onChange={(e) => setDonor({ ...donor, phone: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            )}

            {isAnonymous && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email (for receipt) *
                </label>
                <input
                  type="email"
                  value={donor.email}
                  onChange={(e) => setDonor({ ...donor, email: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Heart className="w-5 h-5" />
                  <span>Donate {amount ? `${event.goal?.currency || 'GHS'} ${amount}` : 'Now'}</span>
                </>
              )}
            </button>
          </form>

          <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
            Secure payment powered by Paystack
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicEventDonation;
