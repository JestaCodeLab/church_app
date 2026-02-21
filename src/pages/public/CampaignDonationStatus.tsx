import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Heart, ArrowLeft } from 'lucide-react';
import api from '../../services/api';

interface DonationData {
  _id: string;
  reference?: string;
  payment: {
    status: 'completed' | 'pending' | 'failed';
    amount: number;
    currency: string;
  };
  donor: {
    name: string;
    email: string;
    phone?: string;
  };
  createdAt: string;
  campaignName?: string;
}

const CampaignDonationStatus: React.FC = () => {
  const { campaignId } = useParams<{ campaignId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [donation, setDonation] = useState<DonationData | null>(location.state?.donation || null);
  const [error, setError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  const verifyDonation = useCallback(async () => {
    try {
      setLoading(true);
      
      if (location.state?.donation) {
        // Already have donation in state
        setLoading(false);
        setIsVerified(true);
      } else if (campaignId) {
        // Fetch from API
        const res = await api.get(`/public/donations/${campaignId}`);
        
        if (res.data.data) {
          const donationData = res.data.data;
          const mappedDonation: DonationData = {
            _id: donationData._id,
            reference: donationData.payment?.paystackReference || donationData.reference || '',
            payment: {
              status: donationData.payment?.status || 'pending',
              amount: donationData.payment?.amount || donationData.amount || 0,
              currency: donationData.payment?.currency || donationData.currency || 'GHS'
            },
            donor: {
              name: donationData.donor?.name || 'Donor',
              email: donationData.donor?.email || '',
              phone: donationData.donor?.phone || ''
            },
            createdAt: donationData.createdAt || new Date().toISOString(),
            campaignName: typeof donationData.campaign === 'string' 
              ? donationData.campaign 
              : donationData.campaign?.name || 'Campaign'
          };
          
          setDonation(mappedDonation);
          setLoading(false);
          setIsVerified(true);
        }
      } else {
        setError('Invalid campaign ID');
        setLoading(false);
        setIsVerified(true);
      }
    } catch (err: any) {
      console.error('Donation verification error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to verify donation');
      setLoading(false);
      setIsVerified(true);
    }
  }, [campaignId, location.state?.donation]);

  useEffect(() => {
    if (!isVerified) {
      verifyDonation();
    }
  }, [verifyDonation, isVerified]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Verifying your donation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Verification Failed
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!donation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <XCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Campaign Donation Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We couldn't find the donation information. Please try again.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const isSuccess = donation?.payment?.status === 'completed';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className={`p-8 text-center ${isSuccess ? 'bg-green-50 dark:bg-green-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'}`}>
            {isSuccess ? (
              <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-4" />
            ) : (
              <Loader2 className="w-20 h-20 text-yellow-600 mx-auto mb-4 animate-spin" />
            )}
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {isSuccess ? 'Thank You!' : 'Payment Processing'}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {isSuccess 
                ? 'Your donation has been received successfully'
                : 'Your payment is being processed'
              }
            </p>
          </div>

          {/* Donation Details */}
          <div className="p-8">
            <div className="space-y-4 mb-6">
              {/* Campaign Name */}
              {donation?.campaignName && (
                <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Campaign</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {donation.campaignName}
                  </span>
                </div>
              )}

              {/* Amount */}
              <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Amount</span>
                <span className="font-semibold text-gray-900 dark:text-white text-xl">
                  {donation?.payment?.currency} {donation?.payment?.amount?.toLocaleString()}
                </span>
              </div>

              {/* Donor Name */}
              {donation.donor?.name && (
                <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Donor</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {donation.donor.name}
                  </span>
                </div>
              )}

              {/* Transaction Reference */}
              {(donation?.reference) && (
                <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Transaction Reference</span>
                  <span className="font-mono text-sm text-gray-900 dark:text-white break-all">
                    {donation.reference}
                  </span>
                </div>
              )}

              {/* Status */}
              <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Status</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isSuccess 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                }`}>
                  {isSuccess ? 'Completed' : 'Processing'}
                </span>
              </div>

              {/* Date & Time */}
              {donation.createdAt && (
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-600 dark:text-gray-400">Date & Time</span>
                  <span className="text-gray-900 dark:text-white">
                    {new Date(donation.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Success Message */}
            {isSuccess && donation.donor?.email && (
              <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-primary-800 dark:text-blue-300">
                  <Heart className="w-4 h-4 inline mr-2" />
                  A receipt has been sent to <strong>{donation.donor.email}</strong>
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/')}
                className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back Home</span>
              </button>
              {isSuccess && (
                <button
                  onClick={() => navigate(`/campaign/${campaignId}`)}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Heart className="w-5 h-5" />
                  <span>Donate Again</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDonationStatus;
