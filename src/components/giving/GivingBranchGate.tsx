import React, { useState, useEffect, useCallback } from 'react';
import { GitBranch, Loader, Clock, ChevronRight, FlaskConical, AlertCircle, Settings } from 'lucide-react';
import { useBranch } from '../../context/BranchContext';
import { financeAPI, branchPayoutAPI } from '../../services/api';
import KycWizard from './KycWizard';

interface GivingBranchGateProps {
  children: React.ReactNode;
}

type KycStatus = 'not_started' | 'submitted' | 'processing' | 'approved' | 'rejected';

const GivingBranchGate: React.FC<GivingBranchGateProps> = ({ children }) => {
  const { selectedBranch, setSelectedBranch, branches } = useBranch();
  const [kycStatus, setKycStatus] = useState<KycStatus>('not_started');
  const [paystackMode, setPaystackMode] = useState<'test' | 'live'>('test');
  const [mainBranchId, setMainBranchId] = useState<string | null>(null);
  const [kycLoading, setKycLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);

  // Settlement check for the selected branch
  const [settlementChecking, setSettlementChecking] = useState(false);
  const [settlementOk, setSettlementOk] = useState<boolean | null>(null);

  const fetchKycStatus = useCallback(async () => {
    try {
      const res = await financeAPI.getKycStatus();
      setKycStatus(res.data.data?.status || 'not_started');
      setPaystackMode(res.data.data?.paystackMode || 'test');
      setMainBranchId(res.data.data?.mainBranch || null);
      setRejectionReason(res.data.data?.rejectionReason || null);
    } catch {
      setKycStatus('not_started');
    } finally {
      setKycLoading(false);
    }
  }, []);

  useEffect(() => { fetchKycStatus(); }, [fetchKycStatus]);

  // When a branch is selected, verify it has a settlement destination.
  // Primary branch (mainBranchId) → always settled.
  // Other branches → check for active Paystack subaccount via API.
  useEffect(() => {
    if (!selectedBranch || kycStatus !== 'approved') {
      setSettlementOk(null);
      return;
    }
    if (mainBranchId && (selectedBranch as any)._id === mainBranchId) {
      setSettlementOk(true);
      return;
    }
    let cancelled = false;
    setSettlementChecking(true);
    branchPayoutAPI.getPayoutStatus((selectedBranch as any)._id)
      .then(res => {
        if (cancelled) return;
        const status = res.data?.data?.paystackSubaccount?.status;
        setSettlementOk(status === 'active');
      })
      .catch(() => { if (!cancelled) setSettlementOk(false); })
      .finally(() => { if (!cancelled) setSettlementChecking(false); });
    return () => { cancelled = true; };
  }, [selectedBranch, mainBranchId, kycStatus]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (kycLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader className="w-8 h-8 animate-spin text-primary-500" />
    </div>
  );

  // ── Pending review ─────────────────────────────────────────────────────────
  if (kycStatus === 'submitted' || kycStatus === 'processing') return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-yellow-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">Under Review</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
          Your Finance KYC documents are being reviewed by our team. We will notify you once
          a decision has been made — this typically takes 1–3 business days.
        </p>
        <div className="mt-6 px-4 py-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700">
          <p className="text-xs text-yellow-700 dark:text-yellow-400 font-medium">
            Status: {kycStatus === 'submitted' ? 'Documents Submitted' : 'Processing'}
          </p>
        </div>
      </div>
    </div>
  );

  // ── KYC wizard (not started or rejected) ──────────────────────────────────
  if (kycStatus === 'not_started' || kycStatus === 'rejected') return (
    <KycWizard
      rejectionReason={rejectionReason}
      onSubmitted={() => setKycStatus('submitted')}
    />
  );

  // ── Branch picker (approved, no branch selected yet) ──────────────────────
  if (!selectedBranch) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
            <GitBranch className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Select a Branch</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Choose which branch to manage giving for</p>
          </div>
        </div>
        <div className="space-y-2">
          {branches.map((branch: any) => {
            // In the picker, we know primary branch is settled; others we don't
            // know until selected — show a subtle indicator for primary only
            const isPrimary = mainBranchId && branch._id === mainBranchId;
            return (
              <button
                key={branch._id}
                onClick={() => setSelectedBranch(branch)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{branch.name}</p>
                  {isPrimary && (
                    <p className="text-xs text-primary-500 dark:text-primary-400 mt-0.5">Primary account</p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
              </button>
            );
          })}
          {branches.length === 0 && (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
              No branches configured for your church.
            </p>
          )}
        </div>
      </div>
    </div>
  );

  // ── Settlement checking spinner ────────────────────────────────────────────
  if (settlementChecking || settlementOk === null) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader className="w-8 h-8 animate-spin text-primary-500" />
    </div>
  );

  // ── Settlement gate — branch selected but no payout destination ───────────
  if (settlementOk === false) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2">Payout Not Configured</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-1">
          <strong className="text-slate-700 dark:text-slate-300">{(selectedBranch as any).name}</strong> does not have a payout account set up.
        </p>
        <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed">
          Configure a Paystack subaccount for this branch so giving payments can settle to its own Bank/Momo account.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <a
            href="/settings?tab=branch-payouts"
            className="flex items-center justify-center gap-2 px-5 py-3 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Set Up Branch Payout
          </a>
          <button
            onClick={() => setSelectedBranch(null)}
            className="px-5 py-2.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            ← Choose a different branch
          </button>
        </div>
      </div>
    </div>
  );

  // ── Approved + settled branch — render content ────────────────────────────
  return (
    <>
      {paystackMode === 'test' && (
        <div className="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
          <FlaskConical className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Paystack Test Mode</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              Your Paystack account is currently in test mode — transactions are not real and no money is collected.
              Once Paystack approves your business account and issues live keys, your platform administrator will switch you to Live Mode.
            </p>
          </div>
        </div>
      )}
      {children}
    </>
  );
};

export default GivingBranchGate;
