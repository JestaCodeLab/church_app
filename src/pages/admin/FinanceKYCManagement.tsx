import React, { useEffect, useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  AlertCircle,
  Loader as LoaderIcon,
  X,
  BadgeCheck,
  ExternalLink,
  Upload
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import Loader from '../../components/ui/Loader';
import { useTheme } from '../../context/ThemeContext';

interface KYCSubmission {
  _id: string;
  name: string;
  email: string;
  phone: string;
  paystackKyc: {
    status: 'submitted' | 'processing' | 'approved' | 'rejected';
    submittedAt: string;
    // Contact
    firstName?: string;
    lastName?: string;
    primaryContactEmail?: string;
    primaryContactPhone?: string;
    // Payout
    payoutType?: string;
    settlementBank?: string;
    settlementBankCode?: string;
    accountNumber?: string;
    accountName?: string;
    bankBranch?: string;
    mobileWalletProvider?: string;
    mobileWalletPhone?: string;
    mobileWalletAccountName?: string;
    payoutSchedule?: string;
    payoutScheduleWeekDay?: string;
    payoutScheduleMonthDate?: number;
    currency?: string;
    // Business
    businessType?: string;
    legalName?: string;
    registrationType?: string;
    businessCertificateUrl?: string;
  };
  subscription?: {
    plan: string;
  };
}

interface Modal {
  type: 'view' | 'approve' | 'reject' | 'edit';
  item: KYCSubmission | null;
  rejectReason?: string;
  paystackPublicKey?: string;
  paystackSecretKey?: string;
  editData?: Partial<KYCSubmission> & { businessCertificate?: File | null };
}

export default function FinanceKYCManagement() {
  useTheme();

  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Modal>({ type: 'view', item: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('submitted');

  const limit = 20;

  useEffect(() => {
    fetchSubmissions();
  }, [page, statusFilter]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.financeKyc.listPending({
        status: statusFilter,
        page,
        limit
      });
      if (response.data.success) {
        setSubmissions(response.data.data);
        setTotal(response.data.pagination.total);
      }
    } catch (error: any) {
      toast.error('Failed to load KYC submissions');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!modal.item) return;
    if (!modal.paystackPublicKey || !modal.paystackSecretKey) {
      toast.error('Please provide both Paystack Public Key and Secret Key');
      return;
    }
    setActionLoading(true);
    try {
      const response = await adminAPI.financeKyc.approve(modal.item._id, {
        paystackPublicKey: modal.paystackPublicKey,
        paystackSecretKey: modal.paystackSecretKey
      });
      if (response.data.success) {
        toast.success('KYC approved successfully');
        setModal({ type: 'view', item: null });
        fetchSubmissions();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve KYC');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!modal.item || !modal.rejectReason) {
      toast.error('Please provide a rejection reason');
      return;
    }
    setActionLoading(true);
    try {
      const response = await adminAPI.financeKyc.reject(modal.item._id, {
        rejectionReason: modal.rejectReason
      });
      if (response.data.success) {
        toast.success('KYC rejected successfully');
        setModal({ type: 'view', item: null });
        fetchSubmissions();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject KYC');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!modal.item || !modal.editData) return;
    setActionLoading(true);
    try {
      const formData = new FormData();

      // Add text fields
      if (modal.editData.paystackKyc?.firstName) {
        formData.append('paystackKyc[firstName]', modal.editData.paystackKyc.firstName);
      }
      if (modal.editData.paystackKyc?.lastName) {
        formData.append('paystackKyc[lastName]', modal.editData.paystackKyc.lastName);
      }
      if (modal.editData.paystackKyc?.primaryContactEmail) {
        formData.append('paystackKyc[primaryContactEmail]', modal.editData.paystackKyc.primaryContactEmail);
      }
      if (modal.editData.paystackKyc?.primaryContactPhone) {
        formData.append('paystackKyc[primaryContactPhone]', modal.editData.paystackKyc.primaryContactPhone);
      }
      if (modal.editData.paystackKyc?.settlementBank) {
        formData.append('paystackKyc[settlementBank]', modal.editData.paystackKyc.settlementBank);
      }
      if (modal.editData.paystackKyc?.accountNumber) {
        formData.append('paystackKyc[accountNumber]', modal.editData.paystackKyc.accountNumber);
      }
      if (modal.editData.paystackKyc?.bankBranch) {
        formData.append('paystackKyc[bankBranch]', modal.editData.paystackKyc.bankBranch);
      }
      if (modal.editData.paystackKyc?.legalName) {
        formData.append('paystackKyc[legalName]', modal.editData.paystackKyc.legalName);
      }
      if (modal.editData.paystackKyc?.registrationType) {
        formData.append('paystackKyc[registrationType]', modal.editData.paystackKyc.registrationType);
      }

      // Add file if present
      if (modal.editData.businessCertificate) {
        formData.append('businessCertificate', modal.editData.businessCertificate);
      }

      const response = await adminAPI.financeKyc.update(modal.item._id, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        toast.success('KYC details updated successfully');
        setModal({ type: 'view', item: null });
        fetchSubmissions();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update KYC');
    } finally {
      setActionLoading(false);
    }
  };

  const startEdit = () => {
    if (!modal.item) return;
    setModal({
      ...modal,
      type: 'edit',
      editData: {
        ...modal.item,
        paystackKyc: { ...modal.item.paystackKyc }
      }
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; darkBg: string; darkText: string; icon: React.ReactNode }> = {
      submitted: {
        bg: 'bg-yellow-50',
        text: 'text-yellow-900',
        darkBg: 'dark:bg-yellow-900/30',
        darkText: 'dark:text-yellow-200',
        icon: <Clock className="w-4 h-4" />
      },
      processing: {
        bg: 'bg-blue-50',
        text: 'text-blue-900',
        darkBg: 'dark:bg-blue-900/30',
        darkText: 'dark:text-blue-200',
        icon: <LoaderIcon className="w-4 h-4 animate-spin" />
      },
      approved: {
        bg: 'bg-green-50',
        text: 'text-green-900',
        darkBg: 'dark:bg-green-900/30',
        darkText: 'dark:text-green-200',
        icon: <CheckCircle className="w-4 h-4" />
      },
      rejected: {
        bg: 'bg-red-50',
        text: 'text-red-900',
        darkBg: 'dark:bg-red-900/30',
        darkText: 'dark:text-red-200',
        icon: <XCircle className="w-4 h-4" />
      }
    };

    const badge = badges[status] || badges.submitted;
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text} ${badge.darkBg} ${badge.darkText}`}>
        {badge.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading && submissions.length === 0) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Finance KYC Management</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Review and approve church finance account applications</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        {['submitted', 'processing', 'approved', 'rejected'].map(status => (
          <button
            key={status}
            onClick={() => {
              setStatusFilter(status);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === status
                ? 'bg-indigo-600 dark:bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Church</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Contact</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Bank Details</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Submitted</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
            {submissions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                  No KYC submissions to review
                </td>
              </tr>
            ) : (
              submissions.map(submission => (
                <tr key={submission._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{submission.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{submission.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{submission.phone}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="text-slate-900 dark:text-slate-100 font-medium">{submission.paystackKyc.settlementBank}</div>
                    <div className="text-slate-500 dark:text-slate-400">****{submission.paystackKyc.accountNumber.slice(-4)}</div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(submission.paystackKyc.status)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {new Date(submission.paystackKyc.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setModal({ type: 'view', item: submission })}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 font-medium inline-flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-300"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => (p * limit < total ? p + 1 : p))}
              disabled={page * limit >= total}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-300"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                {modal.type === 'edit' ? 'Edit KYC Details' : 'KYC Details'}
              </h2>
              <button
                onClick={() => setModal({ type: 'view', item: null })}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Church Info */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Church Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Church Name</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{modal.item.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Email</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{modal.item.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Phone</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{modal.item.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Plan</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {modal.item.subscription?.plan || 'Not selected'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Contact Information</h3>
                {modal.type === 'edit' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={modal.editData?.paystackKyc?.firstName || ''}
                        onChange={(e) => setModal({
                          ...modal,
                          editData: {
                            ...modal.editData,
                            paystackKyc: {
                              ...modal.editData?.paystackKyc,
                              firstName: e.target.value
                            }
                          }
                        })}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={modal.editData?.paystackKyc?.lastName || ''}
                        onChange={(e) => setModal({
                          ...modal,
                          editData: {
                            ...modal.editData,
                            paystackKyc: {
                              ...modal.editData?.paystackKyc,
                              lastName: e.target.value
                            }
                          }
                        })}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={modal.editData?.paystackKyc?.primaryContactEmail || ''}
                        onChange={(e) => setModal({
                          ...modal,
                          editData: {
                            ...modal.editData,
                            paystackKyc: {
                              ...modal.editData?.paystackKyc,
                              primaryContactEmail: e.target.value
                            }
                          }
                        })}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={modal.editData?.paystackKyc?.primaryContactPhone || ''}
                        onChange={(e) => setModal({
                          ...modal,
                          editData: {
                            ...modal.editData,
                            paystackKyc: {
                              ...modal.editData?.paystackKyc,
                              primaryContactPhone: e.target.value
                            }
                          }
                        })}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">First Name</p>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{modal.item.paystackKyc.firstName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Last Name</p>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{modal.item.paystackKyc.lastName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Email</p>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{modal.item.paystackKyc.primaryContactEmail || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Phone</p>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{modal.item.paystackKyc.primaryContactPhone || '-'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Payout Info */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Payout Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Payout Type</p>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        modal.item.paystackKyc.payoutType === 'bank'
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200'
                          : 'bg-purple-50 dark:bg-purple-900/30 text-purple-900 dark:text-purple-200'
                      }`}>
                        {modal.item.paystackKyc.payoutType === 'bank' ? 'Bank Account' : 'Mobile Wallet'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Payout Schedule</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100 capitalize">
                      {modal.item.paystackKyc.payoutSchedule || '-'}
                      {modal.item.paystackKyc.payoutSchedule === 'weekly' && modal.item.paystackKyc.payoutScheduleWeekDay && (
                        <span className="text-sm text-slate-600 dark:text-slate-400 ml-1">({modal.item.paystackKyc.payoutScheduleWeekDay}s)</span>
                      )}
                      {modal.item.paystackKyc.payoutSchedule === 'monthly' && modal.item.paystackKyc.payoutScheduleMonthDate && (
                        <span className="text-sm text-slate-600 dark:text-slate-400 ml-1">(Date: {modal.item.paystackKyc.payoutScheduleMonthDate})</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Currency</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{modal.item.paystackKyc.currency || 'GHS'}</p>
                  </div>
                </div>

                {/* Bank Details */}
                {(modal.item.paystackKyc.payoutType === 'bank' || modal.editData?.paystackKyc?.payoutType === 'bank') && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                    <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3">Bank Details</h4>
                    {modal.type === 'edit' ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Bank
                          </label>
                          <input
                            type="text"
                            value={modal.editData?.paystackKyc?.settlementBank || ''}
                            onChange={(e) => setModal({
                              ...modal,
                              editData: {
                                ...modal.editData,
                                paystackKyc: {
                                  ...modal.editData?.paystackKyc,
                                  settlementBank: e.target.value
                                }
                              }
                            })}
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Account Number
                          </label>
                          <input
                            type="text"
                            value={modal.editData?.paystackKyc?.accountNumber || ''}
                            onChange={(e) => setModal({
                              ...modal,
                              editData: {
                                ...modal.editData,
                                paystackKyc: {
                                  ...modal.editData?.paystackKyc,
                                  accountNumber: e.target.value
                                }
                              }
                            })}
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Branch
                          </label>
                          <input
                            type="text"
                            value={modal.editData?.paystackKyc?.bankBranch || ''}
                            onChange={(e) => setModal({
                              ...modal,
                              editData: {
                                ...modal.editData,
                                paystackKyc: {
                                  ...modal.editData?.paystackKyc,
                                  bankBranch: e.target.value
                                }
                              }
                            })}
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Bank</p>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{modal.item.paystackKyc.settlementBank || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Account Number</p>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{modal.item.paystackKyc.accountNumber || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Branch</p>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{modal.item.paystackKyc.bankBranch || '-'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Mobile Wallet Details */}
                {modal.item.paystackKyc.payoutType === 'mobile_wallet' && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                    <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3">Mobile Wallet Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Provider</p>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{modal.item.paystackKyc.mobileWalletProvider || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Phone Number</p>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{modal.item.paystackKyc.mobileWalletPhone || '-'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Account Name</p>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{modal.item.paystackKyc.mobileWalletAccountName || '-'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Business Info */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Business Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Business Type</p>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        modal.item.paystackKyc.businessType === 'registered'
                          ? 'bg-green-50 dark:bg-green-900/30 text-green-900 dark:text-green-200'
                          : 'bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                      }`}>
                        {modal.item.paystackKyc.businessType === 'registered' ? 'Registered' : 'Starter'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Registered Business Info */}
                {(modal.item.paystackKyc.businessType === 'registered' || modal.editData?.paystackKyc?.businessType === 'registered') && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600 space-y-4">
                    {modal.type === 'edit' ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Legal Business Name
                          </label>
                          <input
                            type="text"
                            value={modal.editData?.paystackKyc?.legalName || ''}
                            onChange={(e) => setModal({
                              ...modal,
                              editData: {
                                ...modal.editData,
                                paystackKyc: {
                                  ...modal.editData?.paystackKyc,
                                  legalName: e.target.value
                                }
                              }
                            })}
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Registration Type
                          </label>
                          <input
                            type="text"
                            value={modal.editData?.paystackKyc?.registrationType || ''}
                            onChange={(e) => setModal({
                              ...modal,
                              editData: {
                                ...modal.editData,
                                paystackKyc: {
                                  ...modal.editData?.paystackKyc,
                                  registrationType: e.target.value
                                }
                              }
                            })}
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Legal Business Name</p>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{modal.item.paystackKyc.legalName || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Registration Type</p>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{modal.item.paystackKyc.registrationType || '-'}</p>
                        </div>
                      </div>
                    )}

                    {/* Business Certificate */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-600">
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Business Certificate</p>
                      {modal.type === 'edit' ? (
                        <div className="space-y-3">
                          {modal.item.paystackKyc.businessCertificateUrl && (
                            <div>
                              <a
                                href={modal.item.paystackKyc.businessCertificateUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 font-medium text-sm"
                              >
                                <ExternalLink className="w-4 h-4" />
                                View Current Certificate
                              </a>
                            </div>
                          )}
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                              Upload New Certificate (Optional)
                            </label>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => setModal({
                                ...modal,
                                editData: {
                                  ...modal.editData,
                                  businessCertificate: e.target.files?.[0] || null
                                }
                              })}
                              className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-600 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50"
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          {modal.item.paystackKyc.businessCertificateUrl ? (
                            <a
                              href={modal.item.paystackKyc.businessCertificateUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 font-medium"
                            >
                              <ExternalLink className="w-4 h-4" />
                              View Certificate
                            </a>
                          ) : (
                            <p className="text-sm text-slate-500 dark:text-slate-400">No certificate uploaded</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Paystack Keys Input - Only for Approval */}
              {modal.type !== 'reject' && modal.item?.paystackKyc.status === 'submitted' && (
                <div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      Create the merchant's Paystack Business Account on paystack.com and paste their credentials here
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Paystack Public Key *
                      </label>
                      <input
                        type="text"
                        value={modal.paystackPublicKey || ''}
                        onChange={(e) => setModal({ ...modal, paystackPublicKey: e.target.value })}
                        placeholder="pk_live_..."
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Paystack Secret Key *
                      </label>
                      <input
                        type="password"
                        value={modal.paystackSecretKey || ''}
                        onChange={(e) => setModal({ ...modal, paystackSecretKey: e.target.value })}
                        placeholder="sk_live_..."
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Rejection Reason Input */}
              {modal.type === 'reject' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Rejection Reason
                  </label>
                  <textarea
                    value={modal.rejectReason || ''}
                    onChange={(e) => setModal({ ...modal, rejectReason: e.target.value })}
                    placeholder="Explain why this KYC is being rejected"
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400"
                    rows={4}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-600">
                <button
                  onClick={() => setModal({ type: 'view', item: null })}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  {modal.type === 'edit' ? 'Cancel' : 'Close'}
                </button>

                {modal.type === 'edit' ? (
                  <button
                    onClick={handleEdit}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading ? (
                      <>
                        <LoaderIcon className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                ) : (
                  <>
                    {modal.item.paystackKyc.status === 'submitted' && modal.type !== 'reject' && (
                      <button
                        onClick={startEdit}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                      >
                        Edit
                      </button>
                    )}
                    {modal.item.paystackKyc.status === 'submitted' && (
                      <>
                        {modal.type !== 'reject' ? (
                          <>
                            <button
                              onClick={() => setModal({ ...modal, type: 'reject' })}
                              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                            >
                              Reject
                            </button>
                            <button
                              onClick={handleApprove}
                              disabled={actionLoading}
                              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {actionLoading ? (
                                <>
                                  <LoaderIcon className="w-4 h-4 animate-spin" />
                                  Approving...
                                </>
                              ) : (
                                'Approve'
                              )}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={handleReject}
                            disabled={actionLoading || !modal.rejectReason}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {actionLoading ? (
                              <>
                                <LoaderIcon className="w-4 h-4 animate-spin" />
                                Rejecting...
                              </>
                            ) : (
                              'Confirm Rejection'
                            )}
                          </button>
                        )}
                      </>
                    )}
                    {(modal.item.paystackKyc.status === 'approved' || modal.item.paystackKyc.status === 'rejected') && (
                      <button
                        onClick={startEdit}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                      >
                        Edit
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
