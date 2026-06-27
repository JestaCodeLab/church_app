import React, { useState, useEffect } from 'react';
import { Send, CheckCircle, Clock, XCircle, AlertCircle, Info, Zap } from 'lucide-react';
import api, { merchantAPI } from '../../../services/api';
import { showToast } from '../../../utils/toasts';
import ConfirmModal from '../../../components/modals/ConfirmModal';
import { checkFeatureAccess } from '../../../utils/featureAccess';
import FeatureGate from '../../../components/access/FeatureGate';
import Loader from '../../../components/ui/Loader';

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
    const hasAccess = await checkFeatureAccess('smsSenderId', {
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

  const getStatusIcon = (stat: string) => {
    switch(stat) {
      case 'approved': return <CheckCircle className="w-12 h-12 text-green-500" />;
      case 'pending': return <Clock className="w-12 h-12 text-yellow-500" />;
      case 'rejected': return <XCircle className="w-12 h-12 text-red-500" />;
      default: return <AlertCircle className="w-12 h-12 text-primary-600" />;
    }
  };

  const getStatusColor = (stat: string) => {
    switch(stat) {
      case 'approved': return 'from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 border-green-200 dark:border-green-800';
      case 'pending': return 'from-yellow-50 to-yellow-100/50 dark:from-yellow-900/20 dark:to-yellow-800/10 border-yellow-200 dark:border-yellow-800';
      case 'rejected': return 'from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-800/10 border-red-200 dark:border-red-800';
      default: return 'from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/10 border-primary-200 dark:border-primary-800';
    }
  };

  if (loading) {
    return <Loader variant="skeleton-list" count={3} />;
  }

  return (
    <FeatureGate feature="smsSenderId" showUpgrade={!hasAccess}>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">SMS Sender ID</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Customize how your church appears when sending SMS messages to members
          </p>
        </div>

        {/* Benefits Banner */}
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4 flex items-start gap-3">
          <Zap className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-primary-900 dark:text-primary-100">Benefits of Custom Sender ID</h3>
            <p className="text-sm text-primary-700 dark:text-primary-300 mt-1">
              Members will instantly recognize messages from your church, improving engagement and trust in your communications.
            </p>
          </div>
        </div>

        {/* Current Status Card */}
        <div className={`bg-gradient-to-br ${getStatusColor(status?.status || 'none')} border-2 rounded-xl p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Current Sender ID Status</h2>
            {getStatusIcon(status?.status || 'none')}
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Using</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 font-mono tracking-wider">
                {status?.effectiveSenderId || '—'}
              </p>
            </div>
            {status?.status === 'none' && (
              <p className="text-sm text-primary-700 dark:text-primary-300">
                Currently using default platform sender ID. Register a custom one to personalize your SMS.
              </p>
            )}
            {status?.status === 'pending' && (
              <div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">Pending approval</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                  Requested: {new Date(status.registeredAt || '').toLocaleDateString()}
                </p>
              </div>
            )}
            {status?.status === 'approved' && (
              <div>
                <p className="text-sm text-green-700 dark:text-green-300 font-medium">Active and Ready</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Members see "{status.customSenderId}" on all SMS messages
                </p>
              </div>
            )}
            {status?.status === 'rejected' && (
              <p className="text-sm text-red-700 dark:text-red-300">Request was rejected. Try a different sender ID.</p>
            )}
          </div>
        </div>

        {/* Status: None - Registration Form */}
        {status?.status === 'none' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Register Your Custom Sender ID</h3>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Enter Sender ID
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
                  placeholder="e.g., ZIONHILL"
                  maxLength={11}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-lg tracking-wider"
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">3-11 characters, letters and numbers only</p>
                  <p className="text-xs font-medium text-primary-600 dark:text-primary-400">{senderId.length}/11</p>
                </div>
              </div>

              {/* Requirements Checklist */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary-600" />
                  Requirements
                </h4>
                <div className="space-y-2.5">
                  <label className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                    <CheckCircle className={`w-5 h-5 mr-3 flex-shrink-0 ${senderId.length >= 3 ? 'text-green-500' : 'text-gray-300 dark:text-gray-600'}`} />
                    <span className={`text-sm ${senderId.length >= 3 ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                      At least 3 characters long
                    </span>
                  </label>
                  <label className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                    <CheckCircle className={`w-5 h-5 mr-3 flex-shrink-0 ${/^[A-Z0-9]+$/.test(senderId) && senderId.length > 0 ? 'text-green-500' : 'text-gray-300 dark:text-gray-600'}`} />
                    <span className={`text-sm ${/^[A-Z0-9]+$/.test(senderId) && senderId.length > 0 ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                      Letters and numbers only (no spaces)
                    </span>
                  </label>
                  <label className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                    <CheckCircle className={`w-5 h-5 mr-3 flex-shrink-0 ${senderId.length > 0 ? 'text-green-500' : 'text-gray-300 dark:text-gray-600'}`} />
                    <span className={`text-sm ${senderId.length > 0 ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                      Represents your church name
                    </span>
                  </label>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-3 pl-3">Examples: ZIONHILL, GRACECHPL, VICTORYCH</p>
              </div>

              <button
                onClick={handleRegisterSenderId}
                disabled={submitting || senderId.length < 3}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Register Sender ID
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Status: Pending */}
        {status?.status === 'pending' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900/20">
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Pending Approval
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-yellow-900 dark:text-yellow-100">
                  Your sender ID <span className="font-mono font-bold text-lg">"{status.customSenderId}"</span> is under review.
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                  ⏱️ This typically takes 24-48 hours. We'll notify you once it's approved.
                </p>
                {status.registeredAt && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-3">
                    Submitted on {new Date(status.registeredAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Meanwhile:</strong> Your SMS will continue using <span className="font-mono">"{status.platformSenderId}"</span>
                </p>
              </div>

              <button
                onClick={handleCancelRequest}
                disabled={submitting}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                {submitting ? 'Cancelling...' : 'Cancel Request'}
              </button>
            </div>
          </div>
        )}

        {/* Status: Approved */}
        {status?.status === 'approved' && (
          <div className="space-y-6">
            
            {/* <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/20">
                <h3 className="font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Sender ID Active
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-green-900 dark:text-green-100">
                    ✅ Members now see <span className="font-mono font-bold text-lg">"{status.customSenderId}"</span> when receiving SMS from your church.
                  </p>
                  {status.approvedAt && (
                    <p className="text-xs text-green-700 dark:text-green-300 mt-3">
                      Approved: {new Date(status.approvedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>

                <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
                  <p className="text-sm text-primary-700 dark:text-primary-300">
                    💡 <strong>Tip:</strong> Test it by sending an SMS to yourself from the messaging page.
                  </p>
                </div>
              </div>
            </div> */}

            {/* Change Sender ID Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Change Sender ID</h3>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Want to update your sender ID? Enter a new one below.</p>
                <input
                  type="text"
                  value={senderId}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    if (value.length <= 11) {
                      setSenderId(value);
                    }
                  }}
                  placeholder="e.g., ZIONHILL"
                  maxLength={11}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-lg tracking-wider"
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500 dark:text-gray-400">3-11 characters, letters and numbers only</p>
                  <p className="text-xs font-medium text-primary-600 dark:text-primary-400">{senderId.length}/11</p>
                </div>
                <button
                  onClick={handleRegisterSenderId}
                  disabled={submitting || senderId.length < 3}
                  className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Request Change
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        

        {/* Status: Rejected */}
        {status?.status === 'rejected' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-900/20">
                <h3 className="font-semibold text-red-900 dark:text-red-100 flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  Sender ID Rejected
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-red-900 dark:text-red-100">
                    The sender ID <span className="font-mono font-bold">"{status.customSenderId}"</span> could not be approved.
                  </p>
                  {status.rejectionReason && (
                    <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/40 rounded border border-red-300 dark:border-red-700">
                      <p className="text-xs font-semibold text-red-900 dark:text-red-100 uppercase tracking-wide">Reason</p>
                      <p className="text-sm text-red-800 dark:text-red-200 mt-1">{status.rejectionReason}</p>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Your SMS will continue using <span className="font-mono">"{status.platformSenderId}"</span> until approved.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Try Another Sender ID</h3>
              </div>
              <div className="p-6 space-y-4">
                <input
                  type="text"
                  value={senderId}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    if (value.length <= 11) {
                      setSenderId(value);
                    }
                  }}
                  placeholder="e.g., ZIONHILL"
                  maxLength={11}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-lg tracking-wider"
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500 dark:text-gray-400">3-11 characters, letters and numbers only</p>
                  <p className="text-xs font-medium text-primary-600 dark:text-primary-400">{senderId.length}/11</p>
                </div>
                <button
                  onClick={handleRegisterSenderId}
                  disabled={submitting || senderId.length < 3}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit New Request
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

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
