import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Edit2, PowerOff, CheckCircle, XCircle, AlertCircle, Clock,
  Loader, Building2, X, Landmark, ChevronRight, RefreshCw, Star
} from 'lucide-react';
import toast from 'react-hot-toast';
import { branchPayoutAPI, financeAPI } from '../../services/api';

interface SubaccountStatus {
  status: 'none' | 'pending' | 'active' | 'inactive' | 'failed';
  subaccountCode?: string;
  businessName?: string;
  settlementBank?: { bankCode: string; bankName: string; accountNumber: string; accountName: string };
  createdAt?: string;
  deactivatedAt?: string;
  lastError?: string;
}

interface BranchPayout {
  _id: string;
  name: string;
  code: string;
  paystackSubaccount?: SubaccountStatus;
}

interface Bank { code: string; name: string }

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  none:     { label: 'Not Configured', cls: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',        dot: 'bg-gray-400' },
  pending:  { label: 'Pending',        cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', dot: 'bg-amber-400' },
  active:   { label: 'Active',         cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', dot: 'bg-green-500' },
  inactive: { label: 'Inactive',       cls: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',    dot: 'bg-slate-400' },
  failed:   { label: 'Failed',         cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',         dot: 'bg-red-500' },
};

const StatusBadge = ({ status }: { status: string }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.none;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// ── Configure / Edit modal ────────────────────────────────────────────────────

// Ghana mobile money providers with Paystack bank codes
const MOMO_PROVIDERS = [
  { code: 'MTN', name: 'MTN' },
  { code: 'ATL', name: 'AirtelTigo' },
  { code: 'VOD', name: 'Vodafone' },
];

type PayoutType = 'bank' | 'mobile_money';

const PayoutForm = ({ branch, banks, onClose, onSuccess }: {
  branch: BranchPayout; banks: Bank[]; onClose: () => void; onSuccess: () => void;
}) => {
  const isEdit = branch.paystackSubaccount?.status === 'active';
  const existing = branch.paystackSubaccount?.settlementBank;

  const [payoutType, setPayoutType] = useState<PayoutType>('mobile_money');
  const [bankCode, setBankCode] = useState(existing?.bankCode || '');
  const [accountNumber, setAccountNumber] = useState(existing?.accountNumber || '');
  const [resolvedName, setResolvedName] = useState(existing?.accountName || '');
  const [accountName, setAccountName] = useState(branch.paystackSubaccount?.businessName || branch.name);
  const [resolving, setResolving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isMomo = payoutType === 'mobile_money';

  const resolveAccount = useCallback(async () => {
    if (isMomo || !bankCode || accountNumber.length < 10) return;
    setResolving(true);
    setResolvedName('');
    try {
      const res = await financeAPI.resolveAccountNumber({ accountNumber, bankCode });
      const name = res.data?.data?.account_name;
      if (name) setResolvedName(name);
      else toast.error('Could not resolve account. Check the details and try again.');
    } catch {
      toast.error('Account resolution failed. Please verify account number and bank.');
    } finally {
      setResolving(false);
    }
  }, [isMomo, bankCode, accountNumber]);

  useEffect(() => {
    if (!isMomo && bankCode && accountNumber.length >= 10) {
      const t = setTimeout(resolveAccount, 800);
      return () => clearTimeout(t);
    }
  }, [isMomo, bankCode, accountNumber, resolveAccount]);

  // Reset fields when switching type
  const switchType = (t: PayoutType) => {
    setPayoutType(t);
    setBankCode('');
    setAccountNumber('');
    setResolvedName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankCode) { toast.error(isMomo ? 'Please select a mobile money provider' : 'Please select a bank'); return; }
    if (accountNumber.length < 10) { toast.error(isMomo ? 'Enter a valid phone number' : 'Enter a valid account number'); return; }
    if (!isMomo && !resolvedName) { toast.error('Please wait for account verification'); return; }
    if (!accountName.trim()) { toast.error('Please enter the account name'); return; }
    setSubmitting(true);
    try {
      const payload = { settlementBankCode: bankCode, accountNumber, businessName: accountName.trim() };
      if (isEdit) {
        await branchPayoutAPI.updateSubaccount(branch._id, payload);
        toast.success('Payout account updated');
      } else {
        await branchPayoutAPI.createSubaccount(branch._id, payload);
        toast.success('Subaccount created — Paystack will settle funds to this account');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save subaccount');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = 'w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-750 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700';
  const labelCls = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {isEdit ? 'Update' : 'Set Up'} Payout Account
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">{branch.name} · {branch.code}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* Bank / Mobile Money tab */}
          <div className="flex rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
            {(['bank', 'mobile_money'] as PayoutType[]).map(t => (
              <button key={t} type="button" onClick={() => switchType(t)}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                  payoutType === t
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}>
                {t === 'bank' ? 'Bank' : 'Mobile Money'}
              </button>
            ))}
          </div>

          {/* Bank fields */}
          {!isMomo && (
            <div>
              <label className={labelCls}>Bank <span className="text-red-500">*</span></label>
              <select value={bankCode} onChange={e => { setBankCode(e.target.value); setResolvedName(''); }}
                className={inputCls}>
                <option value="">Select a bank…</option>
                {banks.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
              </select>
            </div>
          )}

          {/* Mobile Money provider selector */}
          {isMomo && (
            <div>
              <label className={labelCls}>Provider <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-3 gap-2">
                {MOMO_PROVIDERS.map(p => (
                  <button key={p.code} type="button" onClick={() => setBankCode(p.code)}
                    className={`py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                      bankCode === p.code
                        ? 'bg-primary-600 border-primary-600 text-white'
                        : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                    }`}>
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Account number / Phone number */}
          <div>
            <label className={labelCls}>
              {isMomo ? 'Phone Number' : 'Account Number'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={e => { setAccountNumber(e.target.value); setResolvedName(''); }}
              maxLength={isMomo ? 10 : 13}
              className={inputCls}
              placeholder={isMomo ? 'e.g. 0241234567' : 'Enter account number'}
            />
          </div>

          {/* Bank account verification (bank only) */}
          {!isMomo && (
            <div>
              {resolving ? (
                <div className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400">
                  <Loader size={14} className="animate-spin" /> Verifying account…
                </div>
              ) : resolvedName ? (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <CheckCircle size={15} className="text-green-600 dark:text-green-400 shrink-0" />
                  <div>
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium uppercase tracking-wide">Account Verified</p>
                    <p className="text-sm font-semibold text-green-800 dark:text-green-300">{resolvedName}</p>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Account Name (subaccount label shown on Paystack) */}
          <div>
            <label className={labelCls}>Account Name <span className="text-red-500">*</span></label>
            <input type="text" value={accountName} onChange={e => setAccountName(e.target.value)}
              className={inputCls} placeholder="e.g. Grace Chapel — Accra Branch" />
            <p className="text-xs text-gray-400 mt-1">Name shown on your Paystack subaccount</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancel
            </button>
            <button type="submit"
              disabled={submitting || !bankCode || accountNumber.length < 10 || (!isMomo && !resolvedName) || !accountName.trim()}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors">
              {submitting && <Loader size={14} className="animate-spin" />}
              {isEdit ? 'Update Account' : 'Create Subaccount'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Branch card ───────────────────────────────────────────────────────────────

const BranchCard = ({ branch, isPrimary, onConfigure, onDeactivate, deactivating }: {
  branch: BranchPayout;
  isPrimary: boolean;
  onConfigure: () => void;
  onDeactivate: () => void;
  deactivating: boolean;
}) => {
  const sub = branch.paystackSubaccount;
  const status = sub?.status || 'none';
  const isActive = status === 'active';
  const isNoneOrFailed = status === 'none' || status === 'failed';
  const isInactive = status === 'inactive';
  // Primary branch is always "settled" via the main Paystack account
  const isSettled = isPrimary || isActive;

  return (
    <div className={`relative rounded-2xl border transition-all ${
      isSettled
        ? isPrimary
          ? 'border-primary-200 dark:border-primary-800 bg-white dark:bg-gray-800'
          : 'border-green-200 dark:border-green-800 bg-white dark:bg-gray-800'
        : isNoneOrFailed
          ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60'
    }`}>
      {/* Top accent */}
      {!isPrimary && isActive && <div className="absolute top-0 left-0 right-0 h-0.5 bg-green-500 rounded-t-2xl" />}

      <div className="p-5">
        {/* Branch identity */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isPrimary ? 'bg-primary-100 dark:bg-primary-900/30'
              : isActive ? 'bg-green-100 dark:bg-green-900/30'
              : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              {isPrimary
                ? <Star size={18} className="text-primary-600 dark:text-primary-400" />
                : <Building2 size={18} className={isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-400'} />
              }
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{branch.name}</p>
              <p className="text-xs text-gray-400 font-mono">{branch.code}</p>
            </div>
          </div>
          {isPrimary ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
              <Star size={11} /> Primary Account
            </span>
          ) : (
            <StatusBadge status={status} />
          )}
        </div>

        {/* Bank info (active/inactive) */}
        {sub?.settlementBank && (
          <div className="flex items-center gap-3 mb-4 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50">
            <Landmark size={15} className="text-gray-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{sub.settlementBank.bankName}</p>
              <p className="text-xs text-gray-400 truncate">{sub.settlementBank.accountName} · ****{sub.settlementBank.accountNumber.slice(-4)}</p>
            </div>
          </div>
        )}

        {/* Error message */}
        {status === 'failed' && sub?.lastError && (
          <div className="flex items-start gap-2 mb-4 px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
            <XCircle size={13} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-600 dark:text-red-400">{sub.lastError}</p>
          </div>
        )}

        {/* Primary branch description */}
        {isPrimary && (
          <div className="flex items-start gap-2 mb-4 px-3 py-2.5 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800">
            <CheckCircle size={13} className="text-primary-500 shrink-0 mt-0.5" />
            <p className="text-sm text-primary-700 dark:text-primary-400">
              Settles to your church's main Paystack account. No subaccount setup required.
            </p>
          </div>
        )}

        {/* Empty state prompt */}
        {!isPrimary && status === 'none' && (
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
            No payout account configured. Set up a subaccount so this branch can access Giving features.
          </p>
        )}

        {/* Actions — primary branch needs no action */}
        {!isPrimary && (
        <div className="flex gap-2">
          {(isNoneOrFailed || isInactive) && (
            <button onClick={onConfigure}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
              <Plus size={13} />
              {status === 'none' ? 'Set Up Payout' : isInactive ? 'Reconfigure' : 'Retry'}
            </button>
          )}
          {isActive && (
            <>
              <button onClick={onConfigure}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <Edit2 size={12} /> Edit
              </button>
              <button onClick={onDeactivate} disabled={deactivating}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50">
                {deactivating ? <Loader size={12} className="animate-spin" /> : <PowerOff size={12} />}
                Deactivate
              </button>
            </>
          )}
        </div>
        )}
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

const BranchPayoutSettings = () => {
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [mainBranchId, setMainBranchId] = useState<string | null>(null);
  const [branches, setBranches] = useState<BranchPayout[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [configuring, setConfiguring] = useState<BranchPayout | null>(null);
  const [deactivating, setDeactivating] = useState<string | null>(null);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const kycRes = await financeAPI.getKycStatus();
      const status = kycRes.data?.data?.status || 'not_started';
      setKycStatus(status);
      setMainBranchId(kycRes.data?.data?.mainBranch || null);
      if (status === 'approved') {
        const [branchRes, bankRes] = await Promise.all([
          branchPayoutAPI.listPayouts(),
          financeAPI.getBanksList()
        ]);
        setBranches(branchRes.data?.data || []);
        // Also pick up mainBranchId from the payout list response if available
        if (branchRes.data?.mainBranchId) setMainBranchId(branchRes.data.mainBranchId);
        setBanks(bankRes.data?.data || []);
      }
    } catch {
      toast.error('Failed to load payout settings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDeactivate = async (branch: BranchPayout) => {
    if (!window.confirm(`Deactivate payout for ${branch.name}? Payments will settle to the church's main account.`)) return;
    setDeactivating(branch._id);
    try {
      await branchPayoutAPI.deactivateSubaccount(branch._id);
      toast.success(`${branch.name} subaccount deactivated`);
      await loadData(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to deactivate');
    } finally {
      setDeactivating(null);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader size={22} className="animate-spin text-primary-500" />
    </div>
  );

  // ── KYC not approved ───────────────────────────────────────────────────────
  if (kycStatus !== 'approved') return (
    <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10 p-6">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
          <AlertCircle size={18} className="text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h3 className="font-semibold text-amber-900 dark:text-amber-300">Finance KYC Required</h3>
          <p className="text-sm text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
            Your church's Finance KYC must be approved before configuring branch payout accounts.
            Once approved, each branch can have its own Paystack subaccount so donations settle directly
            to that branch's bank/Momo account.
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-400 mt-2">
            Go to <strong>Giving</strong> → open any giving feature to start the KYC wizard.
          </p>
        </div>
      </div>
    </div>
  );

  // ── Stats summary ─────────────────────────────────────────────────────────
  // A branch is "settled" if it IS the main KYC branch or has an active subaccount
  const isSettled = (b: BranchPayout) =>
    b._id === mainBranchId || b.paystackSubaccount?.status === 'active';
  const configured = branches.filter(isSettled).length;
  const total = branches.length;

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      {total > 0 && (
        <div className="flex items-center justify-between px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{configured}<span className="text-gray-400 font-normal text-lg">/{total}</span></p>
              <p className="text-xs text-gray-400 mt-0.5">Branches configured</p>
            </div>
            {configured < total && (
              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-full">
                <Clock size={12} />
                {total - configured} branch{total - configured !== 1 ? 'es' : ''} using default settlement
              </div>
            )}
            {configured === total && total > 0 && (
              <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-full">
                <CheckCircle size={12} /> All branches configured
              </div>
            )}
          </div>
          <button onClick={() => loadData(true)} disabled={refreshing}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      )}

      {/* Branch cards grid */}
      {branches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
            <Building2 size={28} className="text-gray-300 dark:text-gray-500" />
          </div>
          <p className="text-base font-medium text-gray-900 dark:text-white mb-1">No branches found</p>
          <p className="text-sm text-gray-400 max-w-xs">Create branches first via Branch Management, then return here to set up their payout accounts.</p>
          <a href="/branches" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">
            Go to Branch Management <ChevronRight size={14} />
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {branches.map(branch => (
            <BranchCard
              key={branch._id}
              branch={branch}
              isPrimary={branch._id === mainBranchId}
              onConfigure={() => setConfiguring(branch)}
              onDeactivate={() => handleDeactivate(branch)}
              deactivating={deactivating === branch._id}
            />
          ))}
        </div>
      )}

      {/* Footer note */}
      {branches.length > 0 && (
        <div className="flex items-start gap-3 px-4 py-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <AlertCircle size={18} className="text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed space-y-1">
            <p className="font-semibold">Payout account required for Public Giving</p>
            <p>
              Branches without a configured payout account cannot enable Public Giving on events.
              When a church admin creates an event and tries to share a giving link, the branch must
              have either a Paystack subaccount (set up here) or be the primary church account selected
              during KYC — otherwise the giving link will be blocked.
            </p>
          </div>
        </div>
      )}

      {/* Configure/Edit modal */}
      {configuring && (
        <PayoutForm
          branch={configuring}
          banks={banks}
          onClose={() => setConfiguring(null)}
          onSuccess={() => loadData(true)}
        />
      )}
    </div>
  );
};

export default BranchPayoutSettings;
