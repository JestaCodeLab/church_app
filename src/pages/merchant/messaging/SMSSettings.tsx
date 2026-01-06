import React, { useState, useEffect } from 'react';
import { Send, CheckCircle, Clock, XCircle, AlertCircle, Loader } from 'lucide-react';
import api, { merchantAPI } from '../../../services/api';
import { showToast } from '../../../utils/toasts';
import ConfirmModal from '../../../components/modals/ConfirmModal';
import { checkFeatureAccess } from '../../../utils/featureAccess';
import FeatureGate from '../../../components/access/FeatureGate';

interface SenderIdStatus {
  hasCustomSenderId: boolean;
  customSenderId: string | null;
  status: 'none' | 'pending' | 'approved' | 'rejected';
  effectiveSenderId: string;
  platformSenderId: string;
  registeredAt: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
}

const SMSSettings = () => {
  const [senderId, setSenderId] = useState('');
  const [status, setStatus] = useState<SenderIdStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  // Fetch current status
  useEffect(() => {
    fetchSenderIdStatus();
    checkAccess();
  }, []);

  const fetchSenderIdStatus = async () => {
    try {
      setLoading(true);
      const response = await merchantAPI.getSenderIDStatus();
      setStatus(response.data.data);
    } catch (error: any) {
      showToast.error('Failed to load sender ID status');
    } finally {
      setLoading(false);
    }
  };

  const checkAccess = async () => {
    const hasAccess = await checkFeatureAccess('smsSenderID', {
        showErrorToast: false,
      });
    setHasAccess(hasAccess);
  }

  const handleRegisterSenderId = async () => {
    if (!senderId || senderId.trim() === '') {
      showToast.error('Please enter a sender ID');
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post('/merchants/sender-id/register', {
        senderId: senderId.trim().toUpperCase()
      });

      showToast.success(response.data.message);
      setSenderId('');
      await fetchSenderIdStatus();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to register sender ID');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancel request with confirmation modal
  const handleCancelRequest = async () => {
    setShowCancelModal(true);
  };

  // Confirm cancel function
  const confirmCancelRequest = async () => {
    try {
      setSubmitting(true);
      await api.delete('/merchants/sender-id/cancel');
      showToast.success('Sender ID request cancelled');
      setShowCancelModal(false);
      await fetchSenderIdStatus();
    } catch (error: any) {
      showToast.error('Failed to cancel request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <FeatureGate feature="smsSenderID" showUpgrade={!hasAccess}>
      <div className="max-w-8xl">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              SMS Sender ID
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Customize how your church name appears when sending SMS to members
            </p>
          </div>

          <div className="p-6">
            {/* Current Status Display */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Current Sender ID
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1 tracking-wider">
                    {status?.effectiveSenderId || 'Loading...'}
                  </p>
                </div>
                <Send className="w-12 h-12 text-primary-600" />
              </div>
            </div>

            {/* Status: None - Registration Form */}
            {status?.status === 'none' && (
              <div>
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">
                        Personalize Your SMS
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Register a custom sender ID so members see your church name instead of "{status.platformSenderId}" when receiving SMS.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sender ID (3-11 characters, letters and numbers only)
                  </label>
                  <input
                    type="text"
                    value={senderId}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                      if (value.length <= 11) {
                        setSenderId(value);
                      }
                    }}
                    placeholder="ZIONHILL"
                    maxLength={11}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-transparent font-mono text-lg tracking-wider"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Examples: ZIONHILL, GRACECHPL, VICTORYCH
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {senderId.length}/11
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                    Requirements:
                  </h4>
                  <ul className="space-y-2">
                    <li className="flex items-start text-sm text-gray-600 dark:text-gray-400">
                      <CheckCircle className={`w-5 h-5 mr-2 flex-shrink-0 ${senderId.length >= 3 ? 'text-green-500' : 'text-gray-300'}`} />
                      At least 3 characters long
                    </li>
                    <li className="flex items-start text-sm text-gray-600 dark:text-gray-400">
                      <CheckCircle className={`w-5 h-5 mr-2 flex-shrink-0 ${/^[A-Z0-9]+$/.test(senderId) && senderId.length > 0 ? 'text-green-500' : 'text-gray-300'}`} />
                      Letters and numbers only (no spaces or special characters)
                    </li>
                    <li className="flex items-start text-sm text-gray-600 dark:text-gray-400">
                      <CheckCircle className={`w-5 h-5 mr-2 flex-shrink-0 ${senderId.length > 0 ? 'text-green-500' : 'text-gray-300'}`} />
                      Represents your church name
                    </li>
                  </ul>
                </div>

                <button
                  onClick={handleRegisterSenderId}
                  disabled={submitting || senderId.length < 3}
                  className=" bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-base transition-colors flex items-center justify-center"
                >
                  {submitting ? (
                    <>
                      <Loader className="w-5 h-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Register Sender ID
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Status: Pending */}
            {status?.status === 'pending' && (
              <div>
                <div className="mb-6 p-6 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-start">
                    <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400 mr-4 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100">
                        Pending Approval
                      </h3>
                      <p className="text-yellow-700 dark:text-yellow-300 mt-2">
                        Your sender ID <strong className="font-mono text-xl">"{status.customSenderId}"</strong> is pending approval.
                      </p>
                      <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                        This typically takes 24-48 hours. We'll notify you once it's approved.
                      </p>
                      {status.registeredAt && (
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-3">
                          Submitted: {new Date(status.registeredAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Meanwhile:</strong> Your SMS will continue to be sent using "{status.platformSenderId}"
                  </p>
                </div>

                <button
                  onClick={handleCancelRequest}
                  disabled={submitting}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  {submitting ? 'Cancelling...' : 'Cancel Request'}
                </button>
              </div>
            )}

            {/* Status: Approved */}
            {status?.status === 'approved' && (
              <div>
                <div className="mb-6 p-6 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-start">
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 mr-4 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                        Sender ID Active
                      </h3>
                      <p className="text-green-700 dark:text-green-300 mt-2">
                        Members will see <strong className="font-mono text-xl">"{status.customSenderId}"</strong> when receiving SMS from your church.
                      </p>
                      {status.approvedAt && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-3">
                          Approved: {new Date(status.approvedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    💡 <strong>Tip:</strong> Test it by sending an SMS to yourself from the messaging page.
                  </p>
                </div>
              </div>
            )}

            {/* Status: Rejected */}
            {status?.status === 'rejected' && (
              <div>
                <div className="mb-6 p-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start">
                    <XCircle className="w-8 h-8 text-red-600 dark:text-red-400 mr-4 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
                        Sender ID Rejected
                      </h3>
                      <p className="text-red-700 dark:text-red-300 mt-2">
                        Your requested sender ID <strong className="font-mono">"{status.customSenderId}"</strong> could not be approved.
                      </p>
                      {status.rejectionReason && (
                        <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/40 rounded border border-red-300 dark:border-red-700">
                          <p className="text-sm font-medium text-red-900 dark:text-red-100">
                            Reason:
                          </p>
                          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                            {status.rejectionReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your SMS will continue using "{status.platformSenderId}" until you register a new sender ID.
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Try a different Sender ID
                  </label>
                  <input
                    type="text"
                    value={senderId}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                      if (value.length <= 11) {
                        setSenderId(value);
                      }
                    }}
                    placeholder="ZIONHILL"
                    maxLength={11}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 font-mono text-lg tracking-wider"
                  />
                </div>

                <button
                  onClick={handleRegisterSenderId}
                  disabled={submitting || senderId.length < 3}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  {submitting ? (
                    <>
                      <Loader className="w-5 h-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Submit New Request
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        <ConfirmModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onConfirm={confirmCancelRequest}
          title="Cancel Sender ID Request"
          message={`Are you sure you want to cancel your sender ID request for "${status?.customSenderId}"? You can submit a new request later.`}
          confirmText="Yes, Cancel Request"
          cancelText="No, Keep Request"
          type="warning"
          isLoading={submitting}
          />
      </div>
    </FeatureGate>
  );
};

export default SMSSettings;