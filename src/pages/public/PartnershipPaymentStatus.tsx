import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Heart, ArrowLeft } from 'lucide-react';
import { partnershipAPI } from '../../services/api';
import { showToast } from '../../utils/toasts';
import { formatCurrency } from '../../utils/currency';

interface PaymentData {
  reference: string;
  amount: number;
  currency: string;
  transactionId: string;
  registrationId: string;
  tierName?: string;
  partnerName?: string;
  programmeName?: string;
  merchantName?: string;
  createdAt?: string;
}

const PartnershipPaymentStatus: React.FC = () => {
  const { merchantId, programmeId } = useParams<{ merchantId: string; programmeId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('reference');

  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [programme, setProgramme] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  const verifyPayment = useCallback(async () => {
    try {
      if (!merchantId || !programmeId || !reference) {
        setError('Missing required information');
        setIsVerified(true);
        return;
      }

      const response = await partnershipAPI.verifyPublicPayment(merchantId, programmeId, reference);

      if (response.data.success) {
        setPaymentData(response.data.data);
        
        // Load programme info
        const programmeResponse = await partnershipAPI.getPublicProgramme(merchantId, programmeId);
        setProgramme(programmeResponse.data.data.programme);
        setIsVerified(true);
      } else {
        setError(response.data.message || 'Failed to verify payment');
        setIsVerified(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to verify payment');
      setIsVerified(true);
    } finally {
      setLoading(false);
    }
  }, [merchantId, programmeId, reference]);

  useEffect(() => {
    if (reference && !isVerified) {
      verifyPayment();
      // Poll for verification status every 2 seconds until verified
      const interval = setInterval(() => {
        verifyPayment();
      }, 2000);
      return () => clearInterval(interval);
    } else if (!reference) {
      setError('No payment reference found');
      setLoading(false);
    }
  }, [reference, isVerified, verifyPayment]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Verifying your partnership contribution...</p>
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
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const isSuccess = !!paymentData;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className={`p-8 text-center ${isSuccess ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'}`}>
            {isSuccess ? (
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
              </div>
            ) : (
              <Loader2 className="w-20 h-20 text-yellow-600 mx-auto mb-4 animate-spin" />
            )}
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {isSuccess ? 'Payment Successful!' : 'Payment Processing'}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {isSuccess 
                ? 'Thank you for your partnership contribution'
                : 'Your payment is being processed'
              }
            </p>
          </div>

          {/* Payment Details */}
          <div className="p-8">
            <div className="space-y-3 mb-6">
              {/* Programme Name */}
              {programme?.name && (
                <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Programme</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {programme.name}
                  </span>
                </div>
              )}

              {/* Amount */}
              {paymentData && (
                <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Amount</span>
                  <span className="font-bold text-gray-900 dark:text-white text-xl">
                    {formatCurrency(paymentData.amount, paymentData.currency)}
                  </span>
                </div>
              )}

              {/* Transaction Reference */}
              {paymentData?.reference && (
                <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Reference</span>
                  <span className="font-mono text-sm text-gray-900 dark:text-white break-all max-w-xs text-right">
                    {paymentData.reference}
                  </span>
                </div>
              )}

              {/* Status */}
              <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Status</span>
                <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                  isSuccess 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                }`}>
                  {isSuccess ? 'Completed' : 'Processing'}
                </span>
              </div>

              {/* Date */}
              {paymentData?.createdAt && (
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-600 dark:text-gray-400">Date & Time</span>
                  <span className="text-gray-900 dark:text-white">
                    {new Date(paymentData.createdAt).toLocaleDateString('en-US', {
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
            {isSuccess && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-800 dark:text-green-300">
                  <Heart className="w-4 h-4 inline mr-2 text-green-600 dark:text-green-400" />
                  An SMS confirmation has been sent to your phone number.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/')}
                className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2 font-medium"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Home</span>
              </button>
              {isSuccess && programme && (
                <button
                  onClick={() => navigate(`/partnership/payment/${merchantId}/${programmeId}`)}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center space-x-2 font-medium"
                >
                  <Heart className="w-5 h-5" />
                  <span>Contribute Again</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnershipPaymentStatus;
