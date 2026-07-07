import React, { useEffect, useState } from 'react';
import {
  CheckCircle, XCircle, Clock, Eye, AlertCircle,
  Loader as LoaderIcon, X, KeyRound, Trash2, ExternalLink, Upload,
  FlaskConical, Zap
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import Loader from '../../components/ui/Loader';
import { useTheme } from '../../context/ThemeContext';

interface Director {
  name: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  nationality?: string;
  address?: string;
  city?: string;
  ghanaCardUrl?: string;
  utilityBillUrl?: string;
}

interface KYCSubmission {
  _id: string;
  name: string;
  email: string;
  phone: string;
  paystackKyc: {
    status: 'submitted' | 'processing' | 'approved' | 'rejected';
    paystackMode?: 'test' | 'live';
    submittedAt: string;
    rejectionReason?: string;
    // Main branch
    mainBranch?: { _id: string; name: string; code: string };
    // Business Details
    legalBusinessName?: string;
    businessRegistrationType?: string;
    businessEmail?: string;
    businessAddress?: string;
    websiteOrSocial?: string;
    // Payout
    payoutType?: 'bank' | 'mobile_wallet';
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
    // Documents
    tinNumber?: string;
    businessCertificateUrl?: string;
    formAUrl?: string;
    formAUrls?: { url: string; publicId: string }[];
    formBUrl?: string;
    formBUrls?: { url: string; publicId: string }[];
    // Directors
    directors?: Director[];
  };
  subscription?: { plan: string };
  paystackKeysConfigured?: boolean;
}

interface EditData {
  legalBusinessName: string;
  businessRegistrationType: string;
  businessEmail: string;
  businessAddress: string;
  websiteOrSocial: string;
  settlementBank: string;
  settlementBankCode: string;
  accountNumber: string;
  accountName: string;
  bankBranch: string;
  mobileWalletProvider: string;
  mobileWalletPhone: string;
  mobileWalletAccountName: string;
  tinNumber: string;
  businessCertificate: File | null;
  formA: File | null;
  formB: File | null;
}

const DocLink: React.FC<{ label: string; url?: string | null }> = ({ label, url }) => (
  <div>
    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{label}</p>
    {url ? (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 font-medium text-sm"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        View {label}
      </a>
    ) : (
      <span className="text-sm text-slate-400 dark:text-slate-500">Not uploaded</span>
    )}
  </div>
);

const InfoRow: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <div>
    <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
    <p className="font-medium text-slate-900 dark:text-slate-100">{value || '-'}</p>
  </div>
);

const FileEditField: React.FC<{
  label: string;
  existingUrl?: string | null;
  file: File | null;
  onChange: (f: File | null) => void;
}> = ({ label, existingUrl, file, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
    {existingUrl && !file && (
      <div className="mb-2">
        <a href={existingUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline">
          <ExternalLink className="w-3.5 h-3.5" /> View current file
        </a>
      </div>
    )}
    {file ? (
      <div className="flex items-center gap-3 px-3 py-2 border border-green-300 dark:border-green-700 rounded-lg bg-green-50 dark:bg-green-900/20">
        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
        <span className="text-sm text-green-700 dark:text-green-400 truncate flex-1">{file.name}</span>
        <button type="button" onClick={() => onChange(null)} className="text-slate-400 hover:text-slate-600">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    ) : (
      <label className="flex items-center gap-2 px-3 py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-primary-400 transition-colors">
        <Upload className="w-4 h-4 text-slate-400" />
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {existingUrl ? 'Upload replacement' : 'Upload file'}
        </span>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
          onChange={e => onChange(e.target.files?.[0] || null)} />
      </label>
    )}
  </div>
);

export default function FinanceKYCManagement() {
  useTheme();

  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('submitted');
  const [actionLoading, setActionLoading] = useState(false);

  // View / Approve / Reject modal
  const [modal, setModal] = useState<{
    type: 'view' | 'approve' | 'reject' | 'edit';
    item: KYCSubmission | null;
    rejectReason: string;
    paystackPublicKey: string;
    paystackSecretKey: string;
    paystackMode: 'test' | 'live';
    editData: EditData | null;
  }>({ type: 'view', item: null, rejectReason: '', paystackPublicKey: '', paystackSecretKey: '', paystackMode: 'test', editData: null });

  const [keysModal, setKeysModal] = useState<{
    open: boolean; item: KYCSubmission | null;
    publicKey: string; secretKey: string;
    paystackMode: 'test' | 'live'; saving: boolean;
  }>({ open: false, item: null, publicKey: '', secretKey: '', paystackMode: 'test', saving: false });

  const [deleteModal, setDeleteModal] = useState<{
    open: boolean; item: KYCSubmission | null; deleting: boolean;
  }>({ open: false, item: null, deleting: false });

  const limit = 20;

  useEffect(() => { fetchSubmissions(); }, [page, statusFilter]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.financeKyc.listPending({ status: statusFilter, page, limit });
      if (res.data.success) {
        setSubmissions(res.data.data);
        setTotal(res.data.pagination.total);
      }
    } catch {
      toast.error('Failed to load KYC submissions');
    } finally {
      setLoading(false);
    }
  };

  const openView = (item: KYCSubmission) =>
    setModal({ type: 'view', item, rejectReason: '', paystackPublicKey: '', paystackSecretKey: '', paystackMode: 'test', editData: null });

  const openEdit = (item: KYCSubmission) => {
    const k = item.paystackKyc;
    setModal({
      type: 'edit', item, rejectReason: '', paystackPublicKey: '', paystackSecretKey: '', paystackMode: k.paystackMode || 'test',
      editData: {
        legalBusinessName: k.legalBusinessName || '',
        businessRegistrationType: k.businessRegistrationType || '',
        businessEmail: k.businessEmail || '',
        businessAddress: k.businessAddress || '',
        websiteOrSocial: k.websiteOrSocial || '',
        settlementBank: k.settlementBank || '',
        settlementBankCode: k.settlementBankCode || '',
        accountNumber: k.accountNumber || '',
        accountName: k.accountName || '',
        bankBranch: k.bankBranch || '',
        mobileWalletProvider: k.mobileWalletProvider || '',
        mobileWalletPhone: k.mobileWalletPhone || '',
        mobileWalletAccountName: k.mobileWalletAccountName || '',
        tinNumber: k.tinNumber || '',
        businessCertificate: null, formA: null, formB: null
      }
    });
  };

  const closeModal = () =>
    setModal({ type: 'view', item: null, rejectReason: '', paystackPublicKey: '', paystackSecretKey: '', paystackMode: 'test', editData: null });

  const handleApprove = async () => {
    if (!modal.item) return;
    if (!modal.paystackPublicKey || !modal.paystackSecretKey) {
      toast.error('Please provide both Paystack keys');
      return;
    }
    setActionLoading(true);
    try {
      await adminAPI.financeKyc.approve(modal.item._id, {
        paystackPublicKey: modal.paystackPublicKey,
        paystackSecretKey: modal.paystackSecretKey,
        paystackMode: modal.paystackMode
      });
      toast.success('KYC approved successfully');
      closeModal();
      fetchSubmissions();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve KYC');
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
      await adminAPI.financeKyc.reject(modal.item._id, { rejectionReason: modal.rejectReason });
      toast.success('KYC rejected');
      closeModal();
      fetchSubmissions();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject KYC');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!modal.item || !modal.editData) return;
    setActionLoading(true);
    try {
      const formData = new FormData();
      const d = modal.editData;
      const append = (key: string, val: string) => { if (val) formData.append(`paystackKyc[${key}]`, val); };

      append('legalBusinessName', d.legalBusinessName);
      append('businessRegistrationType', d.businessRegistrationType);
      append('businessEmail', d.businessEmail);
      append('businessAddress', d.businessAddress);
      formData.append('paystackKyc[websiteOrSocial]', d.websiteOrSocial);
      append('settlementBank', d.settlementBank);
      append('settlementBankCode', d.settlementBankCode);
      append('accountNumber', d.accountNumber);
      append('accountName', d.accountName);
      append('bankBranch', d.bankBranch);
      append('mobileWalletProvider', d.mobileWalletProvider);
      append('mobileWalletPhone', d.mobileWalletPhone);
      append('mobileWalletAccountName', d.mobileWalletAccountName);
      append('tinNumber', d.tinNumber);
      if (d.businessCertificate) formData.append('businessCertificate', d.businessCertificate);
      if (d.formA) formData.append('formA', d.formA);
      if (d.formB) formData.append('formB', d.formB);

      await adminAPI.financeKyc.update(modal.item._id, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('KYC updated successfully');
      closeModal();
      fetchSubmissions();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update KYC');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePaystackKeys = async () => {
    if (!keysModal.item || !keysModal.publicKey || !keysModal.secretKey) {
      toast.error('Please provide both Paystack keys');
      return;
    }
    const switchingToLive = keysModal.paystackMode === 'live' &&
      keysModal.item.paystackKyc.paystackMode !== 'live';
    if (switchingToLive && !window.confirm(
      `Switching to LIVE mode will re-create all active branch subaccounts using the new live keys. This cannot be undone. Proceed?`
    )) return;

    setKeysModal(p => ({ ...p, saving: true }));
    try {
      const res = await adminAPI.financeKyc.updatePaystackKeys(keysModal.item._id, {
        paystackPublicKey: keysModal.publicKey,
        paystackSecretKey: keysModal.secretKey,
        paystackMode: keysModal.paystackMode
      });
      if (switchingToLive && res.data?.data?.branchSubaccounts?.length) {
        const failed = res.data.data.branchSubaccounts.filter((b: any) => b.status !== 'recreated');
        if (failed.length) {
          toast.error(`Live mode set but ${failed.length} branch subaccount(s) failed to re-create — check Branch Payouts settings`);
        } else {
          toast.success(`Switched to live mode — ${res.data.data.branchSubaccounts.length} branch subaccount(s) re-created`);
        }
      } else {
        toast.success('Paystack keys updated');
      }
      setKeysModal({ open: false, item: null, publicKey: '', secretKey: '', paystackMode: 'test', saving: false });
      fetchSubmissions();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update keys');
    } finally {
      setKeysModal(p => ({ ...p, saving: false }));
    }
  };

  const handleDeleteKyc = async () => {
    if (!deleteModal.item) return;
    setDeleteModal(p => ({ ...p, deleting: true }));
    try {
      await adminAPI.financeKyc.deleteKyc(deleteModal.item._id);
      toast.success('KYC submission deleted');
      setDeleteModal({ open: false, item: null, deleting: false });
      fetchSubmissions();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete KYC');
      setDeleteModal(p => ({ ...p, deleting: false }));
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      submitted: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
      processing: 'bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
      approved: 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200',
      rejected: 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200'
    };
    const icons: Record<string, React.ReactNode> = {
      submitted: <Clock className="w-3.5 h-3.5" />,
      processing: <LoaderIcon className="w-3.5 h-3.5 animate-spin" />,
      approved: <CheckCircle className="w-3.5 h-3.5" />,
      rejected: <XCircle className="w-3.5 h-3.5" />
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${map[status] || map.submitted}`}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const regTypeBadge = (type?: string) => {
    if (!type) return '-';
    const color = type === 'Limited Liability Partnership'
      ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200'
      : type === 'Sole Proprietor'
      ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200'
      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
    return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${color}`}>{type}</span>;
  };

  const payoutSummary = (kyc: KYCSubmission['paystackKyc']) => {
    if (kyc.payoutType === 'mobile_wallet') {
      return (
        <div>
          <p className="font-medium text-slate-900 dark:text-slate-100">{kyc.mobileWalletProvider || '-'}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{kyc.mobileWalletPhone || ''}</p>
        </div>
      );
    }
    if (kyc.payoutType === 'bank') {
      return (
        <div>
          <p className="font-medium text-slate-900 dark:text-slate-100">{kyc.settlementBank || '-'}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {kyc.accountNumber ? `****${kyc.accountNumber.slice(-4)}` : ''}
          </p>
        </div>
      );
    }
    return <span className="text-slate-400 dark:text-slate-500 text-sm">-</span>;
  };

  if (loading && submissions.length === 0) return <Loader />;

  const item = modal.item;
  const kyc = item?.paystackKyc;
  const isLimitedLiability = kyc?.businessRegistrationType === 'Limited Liability Partnership';
  const isSoleProprietor = kyc?.businessRegistrationType === 'Sole Proprietor';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Finance KYC Management</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Review and approve church finance account applications</p>
      </div>

      {/* Status filter */}
      <div className="flex gap-3 flex-wrap">
        {['submitted', 'processing', 'approved', 'rejected'].map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              statusFilter === s
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Church</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Business</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Payout</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Submitted</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
            {submissions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                  No KYC submissions found
                </td>
              </tr>
            ) : submissions.map(sub => (
              <tr key={sub._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="px-6 py-4">
                  <p className="font-medium text-slate-900 dark:text-slate-100">{sub.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{sub.email}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">
                    {sub.paystackKyc.legalBusinessName || '-'}
                  </p>
                  {regTypeBadge(sub.paystackKyc.businessRegistrationType)}
                </td>
                <td className="px-6 py-4 text-sm">{payoutSummary(sub.paystackKyc)}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    {statusBadge(sub.paystackKyc.status)}
                    {sub.paystackKyc.status === 'approved' && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold w-fit ${
                        sub.paystackKyc.paystackMode === 'live'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                      }`}>
                        {sub.paystackKyc.paystackMode === 'live'
                          ? <><Zap className="w-3 h-3" /> Live</>
                          : <><FlaskConical className="w-3 h-3" /> Test</>
                        }
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                  {new Date(sub.paystackKyc.submittedAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => setKeysModal({ open: true, item: sub, publicKey: '', secretKey: '', paystackMode: sub.paystackKyc.paystackMode || 'test', saving: false })}
                      title={sub.paystackKeysConfigured ? 'Update Paystack Keys' : 'Add Paystack Keys'}
                      className={`inline-flex items-center gap-1 text-sm font-medium ${
                        sub.paystackKeysConfigured
                          ? 'text-green-600 dark:text-green-400 hover:text-green-800'
                          : 'text-amber-600 dark:text-amber-400 hover:text-amber-800'
                      }`}
                    >
                      <KeyRound className="w-4 h-4" /> Keys
                    </button>
                    <button
                      onClick={() => openView(sub)}
                      className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800"
                    >
                      <Eye className="w-4 h-4" /> View
                    </button>
                    <button
                      onClick={() => setDeleteModal({ open: true, item: sub, deleting: false })}
                      className="inline-flex items-center gap-1 text-sm font-medium text-red-500 dark:text-red-400 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50">
              Previous
            </button>
            <button onClick={() => setPage(p => p * limit < total ? p + 1 : p)} disabled={page * limit >= total}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50">
              Next
            </button>
          </div>
        </div>
      )}

      {/* ── View / Edit / Approve / Reject Modal ── */}
      {item && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">

            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-600 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                  {modal.type === 'edit' ? 'Edit KYC Details' : 'KYC Details'}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{item.name}</p>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-7">

              {/* Church Info */}
              <section>
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Church Account</h3>
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Church Name" value={item.name} />
                  <InfoRow label="Email" value={item.email} />
                  <InfoRow label="Phone" value={item.phone} />
                  <InfoRow label="Plan" value={item.subscription?.plan} />
                  <InfoRow label="Status" value={kyc?.status} />
                  <InfoRow label="Submitted" value={kyc?.submittedAt ? new Date(kyc.submittedAt).toLocaleDateString() : undefined} />
                  <div className="col-span-2">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Main Church Branch</p>
                    {kyc?.mainBranch ? (
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {kyc.mainBranch.name}
                        <span className="ml-2 text-xs font-mono text-slate-400 dark:text-slate-500">{kyc.mainBranch.code}</span>
                      </p>
                    ) : (
                      <p className="text-sm text-slate-400 dark:text-slate-500">Not specified</p>
                    )}
                  </div>
                </div>
                {kyc?.rejectionReason && (
                  <div className="mt-3 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700">
                    <p className="text-sm font-medium text-red-700 dark:text-red-400">Rejection reason: {kyc.rejectionReason}</p>
                  </div>
                )}
              </section>

              {/* Business Details */}
              <section>
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Business Details</h3>
                {modal.type === 'edit' && modal.editData ? (
                  <div className="grid grid-cols-2 gap-4">
                    {([
                      ['legalBusinessName', 'Legal Business Name', 'text'],
                      ['businessEmail', 'Business Email', 'email'],
                      ['websiteOrSocial', 'Website / Social Handle', 'text']
                    ] as [keyof EditData, string, string][]).map(([field, label, type]) => (
                      <div key={field}>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
                        <input type={type} value={modal.editData![field] as string}
                          onChange={e => setModal(m => ({ ...m, editData: { ...m.editData!, [field]: e.target.value } }))}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                      </div>
                    ))}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Registration Type</label>
                      <select value={modal.editData.businessRegistrationType}
                        onChange={e => setModal(m => ({ ...m, editData: { ...m.editData!, businessRegistrationType: e.target.value } }))}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500">
                        <option value="">Select...</option>
                        {['Private Company', 'Public Company', 'External Company', 'Sole Proprietor', 'Limited Liability Partnership'].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Business Address</label>
                      <textarea value={modal.editData.businessAddress} rows={2}
                        onChange={e => setModal(m => ({ ...m, editData: { ...m.editData!, businessAddress: e.target.value } }))}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 resize-none" />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <InfoRow label="Legal Business Name" value={kyc?.legalBusinessName} />
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Registration Type</p>
                      <div className="mt-1">{regTypeBadge(kyc?.businessRegistrationType)}</div>
                    </div>
                    <InfoRow label="Business Email" value={kyc?.businessEmail} />
                    <InfoRow label="Website / Social" value={kyc?.websiteOrSocial} />
                    <div className="col-span-2">
                      <InfoRow label="Business Address" value={kyc?.businessAddress} />
                    </div>
                  </div>
                )}
              </section>

              {/* Payout */}
              <section>
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Payout Configuration</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Payout Method</p>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold mt-1 ${
                      kyc?.payoutType === 'bank'
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                        : 'bg-purple-50 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200'
                    }`}>
                      {kyc?.payoutType === 'bank' ? 'Bank Account' : 'Mobile Money'}
                    </span>
                  </div>
                  <InfoRow label="Payout Schedule" value={
                    kyc?.payoutSchedule
                      ? `${kyc.payoutSchedule.charAt(0).toUpperCase() + kyc.payoutSchedule.slice(1)}${
                          kyc.payoutSchedule === 'weekly' && kyc.payoutScheduleWeekDay ? ` (${kyc.payoutScheduleWeekDay}s)` :
                          kyc.payoutSchedule === 'monthly' && kyc.payoutScheduleMonthDate ? ` (Day ${kyc.payoutScheduleMonthDate})` : ''
                        }` : undefined
                  } />
                  <InfoRow label="Currency" value={kyc?.currency || 'GHS'} />
                </div>

                {kyc?.payoutType === 'bank' && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-600">
                    {modal.type === 'edit' && modal.editData ? (
                      <div className="grid grid-cols-2 gap-4">
                        {([
                          ['settlementBank', 'Bank Name'],
                          ['accountNumber', 'Account Number'],
                          ['accountName', 'Account Name'],
                          ['bankBranch', 'Branch']
                        ] as [keyof EditData, string][]).map(([field, label]) => (
                          <div key={field}>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
                            <input type="text" value={modal.editData![field] as string}
                              onChange={e => setModal(m => ({ ...m, editData: { ...m.editData!, [field]: e.target.value } }))}
                              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <InfoRow label="Bank" value={kyc.settlementBank} />
                        <InfoRow label="Account Number" value={kyc.accountNumber} />
                        <InfoRow label="Account Name" value={kyc.accountName} />
                        <InfoRow label="Branch" value={kyc.bankBranch} />
                      </div>
                    )}
                  </div>
                )}

                {kyc?.payoutType === 'mobile_wallet' && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-600">
                    {modal.type === 'edit' && modal.editData ? (
                      <div className="grid grid-cols-2 gap-4">
                        {([
                          ['mobileWalletProvider', 'Provider'],
                          ['mobileWalletPhone', 'Phone'],
                          ['mobileWalletAccountName', 'Account Name']
                        ] as [keyof EditData, string][]).map(([field, label]) => (
                          <div key={field}>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
                            <input type="text" value={modal.editData![field] as string}
                              onChange={e => setModal(m => ({ ...m, editData: { ...m.editData!, [field]: e.target.value } }))}
                              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <InfoRow label="Provider" value={kyc.mobileWalletProvider} />
                        <InfoRow label="Phone" value={kyc.mobileWalletPhone} />
                        <div className="col-span-2">
                          <InfoRow label="Account Name" value={kyc.mobileWalletAccountName} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Documents */}
              <section>
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Documents</h3>
                {modal.type === 'edit' && modal.editData ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">TIN Number</label>
                      <input type="text" value={modal.editData.tinNumber}
                        onChange={e => setModal(m => ({ ...m, editData: { ...m.editData!, tinNumber: e.target.value } }))}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="C0000000000" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FileEditField label="Business Certificate" existingUrl={kyc?.businessCertificateUrl}
                        file={modal.editData.businessCertificate}
                        onChange={f => setModal(m => ({ ...m, editData: { ...m.editData!, businessCertificate: f } }))} />
                      {isSoleProprietor ? (
                        <FileEditField label="Form A" existingUrl={kyc?.formAUrl}
                          file={modal.editData.formA}
                          onChange={f => setModal(m => ({ ...m, editData: { ...m.editData!, formA: f } }))} />
                      ) : (
                        <FileEditField label="Form B" existingUrl={kyc?.formBUrl}
                          file={modal.editData.formB}
                          onChange={f => setModal(m => ({ ...m, editData: { ...m.editData!, formB: f } }))} />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <InfoRow label="TIN Number" value={kyc?.tinNumber} />
                    <div />
                    <DocLink label="Business Certificate" url={kyc?.businessCertificateUrl} />
                    <div>
                      {isSoleProprietor ? (
                        <>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Form A</p>
                          {(kyc?.formAUrls?.length ? kyc.formAUrls : kyc?.formAUrl ? [{ url: kyc.formAUrl }] : []).length > 0
                            ? (kyc?.formAUrls?.length ? kyc.formAUrls : [{ url: kyc!.formAUrl! }]).map((f, i) => (
                                <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 px-3 py-1.5 mb-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 font-medium text-sm mr-2">
                                  <ExternalLink className="w-3.5 h-3.5" /> Form A {kyc?.formAUrls && kyc.formAUrls.length > 1 ? i + 1 : ''}
                                </a>
                              ))
                            : <span className="text-sm text-slate-400 dark:text-slate-500">Not uploaded</span>
                          }
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Form B</p>
                          {(kyc?.formBUrls?.length ? kyc.formBUrls : kyc?.formBUrl ? [{ url: kyc.formBUrl }] : []).length > 0
                            ? (kyc?.formBUrls?.length ? kyc.formBUrls : [{ url: kyc!.formBUrl! }]).map((f, i) => (
                                <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 px-3 py-1.5 mb-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 font-medium text-sm mr-2">
                                  <ExternalLink className="w-3.5 h-3.5" /> Form B {kyc?.formBUrls && kyc.formBUrls.length > 1 ? i + 1 : ''}
                                </a>
                              ))
                            : <span className="text-sm text-slate-400 dark:text-slate-500">Not uploaded</span>
                          }
                        </>
                      )}
                    </div>
                  </div>
                )}
              </section>

              {/* Directors */}
              {isLimitedLiability && kyc?.directors && kyc.directors.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                    Directors ({kyc.directors.length})
                  </h3>
                  <div className="space-y-4">
                    {kyc.directors.map((dir, i) => (
                      <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Director {i + 1}</p>
                        <div className="grid grid-cols-3 gap-3">
                          <InfoRow label="Name" value={dir.name} />
                          <InfoRow label="Email" value={dir.email} />
                          <InfoRow label="Phone" value={dir.phone} />
                          <InfoRow label="Date of Birth" value={dir.dateOfBirth ? new Date(dir.dateOfBirth).toLocaleDateString() : undefined} />
                          <InfoRow label="Nationality" value={dir.nationality} />
                          <InfoRow label="City" value={dir.city} />
                          <div className="col-span-3">
                            <InfoRow label="Address" value={dir.address} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                          <DocLink label="Ghana Card" url={dir.ghanaCardUrl} />
                          <DocLink label="Utility Bill" url={dir.utilityBillUrl} />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Approve — Paystack Keys + Mode */}
              {modal.type === 'view' && kyc?.status === 'submitted' && (
                <section>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      Create the merchant's Paystack Business Account and paste their credentials here before approving.
                      Paystack provides <strong>test keys</strong> while reviewing KYC — select <strong>Test Mode</strong> for now.
                      Switch to <strong>Live Mode</strong> only when Paystack has approved and issued live keys.
                    </p>
                  </div>

                  {/* Mode toggle */}
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Paystack Mode *</label>
                    <div className="flex gap-3">
                      {(['test', 'live'] as const).map(mode => (
                        <button key={mode} type="button"
                          onClick={() => setModal(m => ({ ...m, paystackMode: mode }))}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                            modal.paystackMode === mode
                              ? mode === 'live'
                                ? 'bg-green-600 border-green-600 text-white'
                                : 'bg-amber-500 border-amber-500 text-white'
                              : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-indigo-400'
                          }`}>
                          {mode === 'live' ? <Zap className="w-3.5 h-3.5" /> : <FlaskConical className="w-3.5 h-3.5" />}
                          {mode === 'live' ? 'Live Mode' : 'Test Mode'}
                        </button>
                      ))}
                    </div>
                    {modal.paystackMode === 'test' && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">
                        Test mode — transactions go to Paystack's sandbox. Switch to Live once Paystack approves the account.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Paystack Public Key * <span className="font-normal text-slate-400">({modal.paystackMode === 'live' ? 'pk_live_...' : 'pk_test_...'})</span>
                      </label>
                      <input type="text" value={modal.paystackPublicKey}
                        onChange={e => setModal(m => ({ ...m, paystackPublicKey: e.target.value }))}
                        placeholder={modal.paystackMode === 'live' ? 'pk_live_...' : 'pk_test_...'}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Paystack Secret Key * <span className="font-normal text-slate-400">({modal.paystackMode === 'live' ? 'sk_live_...' : 'sk_test_...'})</span>
                      </label>
                      <input type="password" value={modal.paystackSecretKey}
                        onChange={e => setModal(m => ({ ...m, paystackSecretKey: e.target.value }))}
                        placeholder={modal.paystackMode === 'live' ? 'sk_live_...' : 'sk_test_...'}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                    </div>
                  </div>
                </section>
              )}

              {/* Reject — Reason input */}
              {modal.type === 'reject' && (
                <section>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Rejection Reason *</label>
                  <textarea rows={4} value={modal.rejectReason}
                    onChange={e => setModal(m => ({ ...m, rejectReason: e.target.value }))}
                    placeholder="Explain why this KYC is being rejected..."
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-red-500 resize-none" />
                </section>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-2 border-t border-slate-200 dark:border-slate-600">
                <button onClick={closeModal}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-700">
                  {modal.type === 'edit' ? 'Cancel' : 'Close'}
                </button>

                {modal.type === 'edit' ? (
                  <button onClick={handleEdit} disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
                    {actionLoading ? <><LoaderIcon className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Changes'}
                  </button>
                ) : modal.type === 'reject' ? (
                  <button onClick={handleReject} disabled={actionLoading || !modal.rejectReason}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                    {actionLoading ? <><LoaderIcon className="w-4 h-4 animate-spin" /> Rejecting...</> : 'Confirm Rejection'}
                  </button>
                ) : (
                  <>
                    <button onClick={() => openEdit(item)}
                      className="px-4 py-2 bg-slate-600 text-white rounded-lg font-medium text-sm hover:bg-slate-700">
                      Edit
                    </button>
                    {kyc?.status === 'submitted' && (
                      <>
                        <button onClick={() => setModal(m => ({ ...m, type: 'reject' }))}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700">
                          Reject
                        </button>
                        <button onClick={handleApprove} disabled={actionLoading}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                          {actionLoading ? <><LoaderIcon className="w-4 h-4 animate-spin" /> Approving...</> : 'Approve'}
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Paystack Keys Modal ── */}
      {keysModal.open && keysModal.item && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full">
            <div className="border-b border-slate-200 dark:border-slate-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Paystack Keys — {keysModal.item.name}</h2>
              </div>
              <button onClick={() => setKeysModal({ open: false, item: null, publicKey: '', secretKey: '', paystackMode: 'test', saving: false })}
                className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium ${
                keysModal.item.paystackKeysConfigured
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                  : 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300'
              }`}>
                {keysModal.item.paystackKeysConfigured
                  ? <><CheckCircle className="w-4 h-4" /> Keys configured — current mode: <strong className="ml-1">{keysModal.item.paystackKyc.paystackMode === 'live' ? 'Live' : 'Test'}</strong></>
                  : <><AlertCircle className="w-4 h-4" /> No keys set — create the church's Paystack account first</>
                }
              </div>

              {/* Mode toggle */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Paystack Mode</label>
                <div className="flex gap-3">
                  {(['test', 'live'] as const).map(mode => (
                    <button key={mode} type="button"
                      onClick={() => setKeysModal(p => ({ ...p, paystackMode: mode }))}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        keysModal.paystackMode === mode
                          ? mode === 'live'
                            ? 'bg-green-600 border-green-600 text-white'
                            : 'bg-amber-500 border-amber-500 text-white'
                          : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-indigo-400'
                      }`}>
                      {mode === 'live' ? <Zap className="w-3.5 h-3.5" /> : <FlaskConical className="w-3.5 h-3.5" />}
                      {mode === 'live' ? 'Live Mode' : 'Test Mode'}
                    </button>
                  ))}
                </div>
                {keysModal.paystackMode === 'live' && keysModal.item.paystackKyc.paystackMode !== 'live' && (
                  <p className="text-xs text-green-700 dark:text-green-400 mt-1.5 font-medium">
                    ⚡ Switching to live will automatically re-create all active branch subaccounts with the new live keys.
                  </p>
                )}
                {keysModal.paystackMode === 'test' && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">
                    Test mode — transactions go to Paystack's sandbox, not real bank accounts.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Paystack Public Key *
                </label>
                <input type="text" value={keysModal.publicKey}
                  onChange={e => setKeysModal(p => ({ ...p, publicKey: e.target.value }))}
                  placeholder={keysModal.paystackMode === 'live' ? 'pk_live_...' : 'pk_test_...'}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Paystack Secret Key *
                </label>
                <input type="password" value={keysModal.secretKey}
                  onChange={e => setKeysModal(p => ({ ...p, secretKey: e.target.value }))}
                  placeholder={keysModal.paystackMode === 'live' ? 'sk_live_...' : 'sk_test_...'}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setKeysModal({ open: false, item: null, publicKey: '', secretKey: '', paystackMode: 'test', saving: false })}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-700">
                  Cancel
                </button>
                <button onClick={handleUpdatePaystackKeys} disabled={keysModal.saving || !keysModal.publicKey || !keysModal.secretKey}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {keysModal.saving ? <><LoaderIcon className="w-4 h-4 animate-spin" /> Saving...</> : <><KeyRound className="w-4 h-4" /> Save Keys</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      {deleteModal.open && deleteModal.item && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full">
            <div className="border-b border-slate-200 dark:border-slate-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Delete KYC Submission</h2>
              </div>
              <button onClick={() => setDeleteModal({ open: false, item: null, deleting: false })}
                className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                <p className="text-sm font-medium text-red-800 dark:text-red-300">This action cannot be undone.</p>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                  The following will be permanently removed for <strong>{deleteModal.item.name}</strong>:
                </p>
                <ul className="mt-2 text-sm text-red-700 dark:text-red-400 list-disc list-inside space-y-1">
                  <li>KYC submission data (business details, payout, documents)</li>
                  <li>All uploaded documents (certificate, Form A/B, director Ghana Cards & utility bills)</li>
                  <li>Paystack API keys</li>
                  <li>Transfer recipient code</li>
                </ul>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                The church will need to resubmit their KYC to regain access to the giving module.
              </p>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setDeleteModal({ open: false, item: null, deleting: false })}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-700">
                  Cancel
                </button>
                <button onClick={handleDeleteKyc} disabled={deleteModal.deleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {deleteModal.deleting ? <><LoaderIcon className="w-4 h-4 animate-spin" /> Deleting...</> : <><Trash2 className="w-4 h-4" /> Delete KYC</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
