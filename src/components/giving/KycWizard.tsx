import React, { useState, useEffect } from 'react';
import {
  Loader, CheckCircle, XCircle, ChevronRight, ChevronLeft,
  Upload, X, Plus, Trash2, FileText, ShieldCheck,
  Building2, ArrowRight, Info
} from 'lucide-react';
import { financeAPI, branchAPI } from '../../services/api';
import toast from 'react-hot-toast';
import DatePicker from '../ui/DatePicker';

// ── Types ──────────────────────────────────────────────────────────────────────

export type RegistrationType =
  | 'Private Company'
  | 'Public Company'
  | 'External Company'
  | 'Sole Proprietor'
  | 'Limited Liability Partnership';

interface BusinessForm {
  legalBusinessName: string;
  businessRegistrationType: RegistrationType | '';
  businessEmail: string;
  businessAddress: string;
  websiteOrSocial: string;
}

interface PayoutForm {
  payoutType: 'bank' | 'mobile_wallet';
  settlementBank: string;
  settlementBankCode: string;
  accountNumber: string;
  accountName: string;
  bankBranch: string;
  mobileWalletProvider: string;
  mobileWalletPhone: string;
  mobileWalletAccountName: string;
  payoutSchedule: 'weekly' | 'monthly' | '';
  payoutScheduleWeekDay: string;
  payoutScheduleMonthDate: string;
}

interface DocumentsForm {
  businessCertificate: File | null;
  formA: File[];
  formB: File[];
  tinNumber: string;
}

interface Director {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nationality: string;
  address: string;
  city: string;
  ghanaCard: File | null;
  utilityBill: File | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const REGISTRATION_TYPES: RegistrationType[] = [
  'Private Company',
  'Public Company',
  'External Company',
  'Sole Proprietor',
  'Limited Liability Partnership',
];

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const MONTH_DATES = Array.from({ length: 28 }, (_, i) => String(i + 1));
const WALLET_PROVIDERS = ['MTN', 'Telecel', 'AirtelTigo'];

const emptyDirector = (): Director => ({
  name: '', email: '', phone: '', dateOfBirth: '',
  nationality: '', address: '', city: '',
  ghanaCard: null, utilityBill: null,
});

// ── Shared sub-components ─────────────────────────────────────────────────────

const FileUploadField: React.FC<{
  label: string;
  required?: boolean;
  file: File | null;
  onChange: (f: File | null) => void;
  accept?: string;
}> = ({ label, required, file, onChange, accept = '.pdf,.jpg,.jpeg,.png' }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {file ? (
      <div className="flex items-center gap-3 px-4 py-3 border border-green-300 dark:border-green-700 rounded-lg bg-green-50 dark:bg-green-900/20">
        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
        <span className="text-sm text-green-700 dark:text-green-400 truncate flex-1">{file.name}</span>
        <button type="button" onClick={() => onChange(null)} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    ) : (
      <label className="flex flex-col items-center justify-center gap-2 px-6 py-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50/40 dark:hover:bg-primary-900/10 transition-colors">
        <Upload className="w-6 h-6 text-slate-400" />
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Click to upload</span>
        <span className="text-xs text-slate-400 dark:text-slate-500">PDF, JPG or PNG</span>
        <input type="file" accept={accept} className="hidden" onChange={e => onChange(e.target.files?.[0] || null)} />
      </label>
    )}
  </div>
);

const MultiFileUploadField: React.FC<{
  label: string;
  required?: boolean;
  files: File[];
  onChange: (files: File[]) => void;
  accept?: string;
}> = ({ label, required, files, onChange, accept = '.pdf,.jpg,.jpeg,.png' }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="space-y-2">
      {files.map((file, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-2.5 border border-green-300 dark:border-green-700 rounded-lg bg-green-50 dark:bg-green-900/20">
          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
          <span className="text-sm text-green-700 dark:text-green-400 truncate flex-1">{file.name}</span>
          <button type="button" onClick={() => onChange(files.filter((_, j) => j !== i))}
            className="text-slate-400 hover:text-slate-600 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      <label className="flex flex-col items-center justify-center gap-2 px-6 py-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50/40 dark:hover:bg-primary-900/10 transition-colors">
        <Upload className="w-6 h-6 text-slate-400" />
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {files.length > 0 ? 'Add another file' : 'Click to upload'}
        </span>
        <span className="text-xs text-slate-400 dark:text-slate-500">PDF, JPG or PNG — multiple allowed</span>
        <input type="file" accept={accept} multiple className="hidden"
          onChange={e => {
            const added = Array.from(e.target.files || []);
            if (added.length) onChange([...files, ...added]);
            e.target.value = '';
          }} />
      </label>
    </div>
  </div>
);

// ── Step panels ───────────────────────────────────────────────────────────────

const StepBusiness: React.FC<{
  value: BusinessForm;
  onChange: (v: BusinessForm) => void;
}> = ({ value: b, onChange }) => {
  const set = (patch: Partial<BusinessForm>) => onChange({ ...b, ...patch });
  const inputCls = 'w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm';
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Legal Business Name <span className="text-red-500">*</span>
        </label>
        <input type="text" value={b.legalBusinessName} onChange={e => set({ legalBusinessName: e.target.value })}
          className={inputCls} placeholder="Church of Grace Ltd." />
      </div>
      <div className="col-span-2">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Business Registration Type <span className="text-red-500">*</span>
        </label>
        <select value={b.businessRegistrationType}
          onChange={e => set({ businessRegistrationType: e.target.value as RegistrationType })}
          className={inputCls}>
          <option value="">Select type...</option>
          {REGISTRATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Business Email <span className="text-red-500">*</span>
        </label>
        <input type="email" value={b.businessEmail} onChange={e => set({ businessEmail: e.target.value })}
          className={inputCls} placeholder="finance@church.org" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Website or Social Handle</label>
        <input type="text" value={b.websiteOrSocial} onChange={e => set({ websiteOrSocial: e.target.value })}
          className={inputCls} placeholder="www.church.org or @handle" />
      </div>
      <div className="col-span-2">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Business Address <span className="text-red-500">*</span>
        </label>
        <textarea value={b.businessAddress} onChange={e => set({ businessAddress: e.target.value })}
          rows={2} className={`${inputCls} resize-none`} placeholder="12 Church Street, Accra, Ghana" />
      </div>
    </div>
  );
};

const StepPayout: React.FC<{
  value: PayoutForm;
  onChange: (v: PayoutForm) => void;
  banks: any[];
  resolvingAccount: boolean;
  onResolveAccount: () => void;
}> = ({ value: p, onChange, banks, resolvingAccount, onResolveAccount }) => {
  const set = (patch: Partial<PayoutForm>) => onChange({ ...p, ...patch });
  const inputCls = 'w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm';
  return (
    <div className="space-y-4">
      {/* Payout type toggle */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Payout Method</label>
        <div className="flex gap-3">
          {[{ value: 'mobile_wallet', label: 'Mobile Money' }, { value: 'bank', label: 'Bank Account' }].map(opt => (
            <button key={opt.value} type="button"
              onClick={() => set({ payoutType: opt.value as PayoutForm['payoutType'] })}
              className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                p.payoutType === opt.value
                  ? 'bg-primary-600 border-primary-600 text-white'
                  : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-primary-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile money */}
      {p.payoutType === 'mobile_wallet' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Provider <span className="text-red-500">*</span></label>
            <select value={p.mobileWalletProvider} onChange={e => set({ mobileWalletProvider: e.target.value })} className={inputCls}>
              {WALLET_PROVIDERS.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number <span className="text-red-500">*</span></label>
            <input type="tel" value={p.mobileWalletPhone} onChange={e => set({ mobileWalletPhone: e.target.value })}
              className={inputCls} placeholder="0201234567" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Account Name <span className="text-red-500">*</span></label>
            <input type="text" value={p.mobileWalletAccountName} onChange={e => set({ mobileWalletAccountName: e.target.value })}
              className={inputCls} placeholder="Church of Grace" />
          </div>
        </div>
      )}

      {/* Bank */}
      {p.payoutType === 'bank' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bank <span className="text-red-500">*</span></label>
            <select value={p.settlementBankCode}
              onChange={e => {
                const bank = banks.find((b: any) => b.code === e.target.value);
                set({ settlementBankCode: e.target.value, settlementBank: bank?.name || '' });
              }}
              className={inputCls}>
              <option value="">Select bank...</option>
              {banks.map((b: any) => <option key={b.code} value={b.code}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Account Number <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              <input type="text" value={p.accountNumber}
                onChange={e => set({ accountNumber: e.target.value, accountName: '' })}
                onBlur={onResolveAccount}
                className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 text-sm"
                placeholder="0123456789" />
              {resolvingAccount && <Loader className="w-5 h-5 animate-spin text-primary-500 self-center" />}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Account Name</label>
            <input type="text" value={p.accountName} readOnly
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm"
              placeholder="Auto-filled" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bank Branch <span className="text-red-500">*</span></label>
            <input type="text" value={p.bankBranch} onChange={e => set({ bankBranch: e.target.value })}
              className={inputCls} placeholder="Accra Main Branch" />
          </div>
        </div>
      )}

      {/* Schedule */}
      <div className="grid grid-cols-2 gap-4 pt-2">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Payout Schedule <span className="text-red-500">*</span></label>
          <select value={p.payoutSchedule}
            onChange={e => set({ payoutSchedule: e.target.value as PayoutForm['payoutSchedule'], payoutScheduleWeekDay: '', payoutScheduleMonthDate: '' })}
            className={inputCls}>
            <option value="">Select...</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        {p.payoutSchedule === 'weekly' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Day of Week <span className="text-red-500">*</span></label>
            <select value={p.payoutScheduleWeekDay} onChange={e => set({ payoutScheduleWeekDay: e.target.value })} className={inputCls}>
              <option value="">Select...</option>
              {WEEK_DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        )}
        {p.payoutSchedule === 'monthly' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Day of Month <span className="text-red-500">*</span></label>
            <select value={p.payoutScheduleMonthDate} onChange={e => set({ payoutScheduleMonthDate: e.target.value })} className={inputCls}>
              <option value="">Select...</option>
              {MONTH_DATES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Currency</label>
          <div className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm">
            GHS — Ghanaian Cedi
          </div>
        </div>
      </div>
    </div>
  );
};

const StepDocuments: React.FC<{
  value: DocumentsForm;
  onChange: (v: DocumentsForm) => void;
  businessRegistrationType: RegistrationType | '';
}> = ({ value: d, onChange, businessRegistrationType }) => {
  const set = (patch: Partial<DocumentsForm>) => onChange({ ...d, ...patch });
  const isSole = businessRegistrationType === 'Sole Proprietor';
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 dark:text-slate-400 pb-1">
        Business type: <span className="font-medium text-slate-700 dark:text-slate-300">{businessRegistrationType || '—'}</span>
        {isSole ? ' — Form A required' : ' — Form B required'}
      </p>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Tax Identification Number (TIN) <span className="text-red-500">*</span>
        </label>
        <input type="text" value={d.tinNumber} onChange={e => set({ tinNumber: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 text-sm"
          placeholder="C0000000000" />
      </div>
      <FileUploadField label="Business Certificate" required
        file={d.businessCertificate} onChange={f => set({ businessCertificate: f })} />
      {isSole
        ? <MultiFileUploadField label="Form A" required files={d.formA} onChange={f => set({ formA: f })} />
        : <MultiFileUploadField label="Form B" required files={d.formB} onChange={f => set({ formB: f })} />
      }
    </div>
  );
};

const StepDirectors: React.FC<{
  value: Director[];
  onChange: (v: Director[]) => void;
}> = ({ value: dirs, onChange }) => {
  const inputCls = 'w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 text-sm';
  const update = (i: number, patch: Partial<Director>) =>
    onChange(dirs.map((d, j) => j === i ? { ...d, ...patch } : d));
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        At least 2 directors are required. All fields and documents are mandatory.
      </p>
      {dirs.map((dir, i) => (
        <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Director {i + 1}</h4>
            {dirs.length > 2 && (
              <button type="button" onClick={() => onChange(dirs.filter((_, j) => j !== i))}
                className="text-red-500 hover:text-red-700 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Full Name — full row */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Full Name <span className="text-red-500">*</span></label>
              <input type="text" value={dir.name} onChange={e => update(i, { name: e.target.value })}
                className={inputCls} placeholder="John Doe" />
            </div>

            {/* Email | Phone */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Email <span className="text-red-500">*</span></label>
              <input type="email" value={dir.email} onChange={e => update(i, { email: e.target.value })}
                className={inputCls} placeholder="john@church.org" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Phone <span className="text-red-500">*</span></label>
              <input type="tel" value={dir.phone} onChange={e => update(i, { phone: e.target.value })}
                className={inputCls} placeholder="+233201234567" />
            </div>

            {/* Date of Birth | Nationality */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Date of Birth <span className="text-red-500">*</span></label>
              <DatePicker value={dir.dateOfBirth} onChange={v => update(i, { dateOfBirth: v })} max={today} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Nationality <span className="text-red-500">*</span></label>
              <input type="text" value={dir.nationality} onChange={e => update(i, { nationality: e.target.value })}
                className={inputCls} placeholder="Ghanaian" />
            </div>

            {/* City | Residential Address */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">City <span className="text-red-500">*</span></label>
              <input type="text" value={dir.city} onChange={e => update(i, { city: e.target.value })}
                className={inputCls} placeholder="Accra" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Residential Address <span className="text-red-500">*</span></label>
              <input type="text" value={dir.address} onChange={e => update(i, { address: e.target.value })}
                className={inputCls} placeholder="12 High Street, Accra" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FileUploadField label="Ghana Card" required file={dir.ghanaCard}
              onChange={f => update(i, { ghanaCard: f })} />
            <FileUploadField label="Utility Bill" required file={dir.utilityBill}
              onChange={f => update(i, { utilityBill: f })} />
          </div>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...dirs, emptyDirector()])}
        className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium transition-colors">
        <Plus className="w-4 h-4" />
        Add Another Director
      </button>
    </div>
  );
};

const StepAgreement: React.FC<{
  agreed: boolean;
  onToggle: (v: boolean) => void;
  legalBusinessName: string;
}> = ({ agreed, onToggle, legalBusinessName }) => (
  <div className="space-y-5">
    <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
      <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
        <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Finance Service Agreement</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">Please read and accept the terms below to complete your application</p>
      </div>
    </div>

    <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-5 max-h-72 overflow-y-auto text-sm text-slate-600 dark:text-slate-400 leading-relaxed space-y-4">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
        The Church HQ — Finance Services Agreement
      </p>
      <p>
        This Finance Services Agreement ("Agreement") is entered into between{' '}
        <strong className="text-slate-800 dark:text-slate-200">{legalBusinessName || 'your organisation'}</strong>{' '}
        ("Church" or "you") and{' '}
        <strong className="text-slate-800 dark:text-slate-200">The Church HQ</strong>{' '}
        ("Platform"), and governs your use of the Finance module, including digital collections,
        disbursements, and financial reporting features available on the Platform.
      </p>
      {[
        ['1. Accuracy of Information', 'You confirm that all information provided in this KYC application — including business registration details, payout account information, identification documents, and director details — is true, complete, and accurate to the best of your knowledge. You accept full responsibility for any consequences arising from the submission of false or misleading information.'],
        ['2. Authorisation to Process Payments', 'By submitting this application you authorise The Church HQ, through its payment partner Paystack, to facilitate the collection of donations, tithes, offerings, and other contributions on your behalf and to credit the proceeds — less applicable processing fees — to the payout account you have designated.'],
        ['3. Compliance with Laws', 'You agree to use the Finance module only for lawful purposes and in compliance with all applicable Ghanaian laws and regulations, including but not limited to the Payment Systems and Services Act, 2019 (Act 987), the Anti-Money Laundering Act, 2020 (Act 1044), and the guidelines issued by the Bank of Ghana. You warrant that the funds processed through the Platform will not be derived from or used to facilitate any illegal activity.'],
        ['4. Data Privacy', 'You consent to The Church HQ collecting, processing, and securely storing the personal and business information submitted in this application for the purposes of identity verification, payment processing, fraud prevention, and regulatory compliance. Your data will be handled in accordance with our Privacy Policy and will not be sold or shared with third parties except as required to deliver the service or comply with legal obligations.'],
        ['5. Third-Party Payment Terms', "You acknowledge that payment processing is facilitated by Paystack (a third-party provider) and that by using the Finance module you also agree to Paystack's applicable terms of service and acceptable use policy. The Church HQ is not liable for any disruption, delay, or loss caused by the third-party payment infrastructure."],
        ['6. Approval, Suspension, and Revocation', 'The Church HQ reserves the right to approve, reject, suspend, or permanently revoke access to the Finance module at its sole discretion, including where there is reasonable suspicion of misuse, regulatory non-compliance, or material inaccuracy in the submitted information. You will be notified of any such action.'],
        ['7. Fees', 'Transaction fees, platform fees, and any applicable charges will be disclosed to you prior to each transaction. You authorise The Church HQ to deduct applicable fees from amounts collected on your behalf before settlement.'],
        ['8. Amendments', 'The Church HQ may update these terms from time to time. Continued use of the Finance module after notice of an update constitutes your acceptance of the revised terms.'],
      ].map(([heading, body]) => (
        <div key={heading}>
          <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">{heading}</p>
          <p>{body}</p>
        </div>
      ))}
      <p className="text-xs text-slate-400 dark:text-slate-500">
        Last updated: June 2026. For questions contact support@thechurchhq.com.
      </p>
    </div>

    <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
      agreed ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-200 dark:border-slate-600 hover:border-primary-300'
    }`}>
      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
        agreed ? 'bg-primary-600' : 'border-2 border-slate-300 dark:border-slate-500'
      }`}>
        {agreed && <CheckCircle className="w-4 h-4 text-white" />}
      </div>
      <input type="checkbox" className="sr-only" checked={agreed} onChange={e => onToggle(e.target.checked)} />
      <span className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        I, on behalf of{' '}
        <strong className="text-slate-900 dark:text-slate-100">{legalBusinessName || 'our organisation'}</strong>,
        have read and understood the Finance Services Agreement above and agree to be bound by its terms and conditions.
      </span>
    </label>

    <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
      <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
      Your submission is encrypted and stored securely. Documents are reviewed only by authorised staff.
    </div>
  </div>
);

// ── Get Started screen ────────────────────────────────────────────────────────

const NEEDS = [
  'Legal business name & registration type',
  'Bank account or mobile money for payouts',
  'Business certificate (PDF or image)',
  'Form A (Sole Proprietor) or Form B (all other types)',
  'Director details + Ghana Card + Utility Bill (LLP only)',
];


interface GetStartedScreenProps {
  rejectionReason: string | null;
  onStart: (mainBranchId: string) => void;
}

const GetStartedScreen: React.FC<GetStartedScreenProps> = ({ rejectionReason, onStart }) => {
  const [branches, setBranches] = useState<any[]>([]);
  const [mainBranchId, setMainBranchId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    branchAPI.getBranches({ limit: 100 })
      .then((res: any) => {
        const list = res.data?.data?.branches ?? [];
        setBranches(Array.isArray(list) ? list : []);
        if (list.length === 1) setMainBranchId(list[0]._id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleStart = () => {
    if (!mainBranchId) {
      toast.error('Please select the branch that represents your main church entity');
      return;
    }
    onStart(mainBranchId);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden">

        {/* Top banner */}
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 px-8 py-8 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Finance KYC Setup</h2>
              <p className="text-primary-100 text-sm">One-time verification to unlock your Giving module</p>
            </div>
          </div>
          <p className="text-primary-100 text-sm leading-relaxed mt-4">
            To accept digital payments for tithes, offerings, and giving projects, your church needs
            a verified Paystack account. This process takes
            2 minutes and creates your church's global payout account — once approved,
            you can also set up individual payout accounts for each branch.
          </p>
        </div>

        {rejectionReason && (
          <div className="mx-8 mt-6 flex items-start gap-3 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-700 dark:text-red-400 text-sm font-semibold">Previous Application Rejected</p>
              <p className="text-red-600 dark:text-red-300 text-sm mt-0.5">{rejectionReason}</p>
            </div>
          </div>
        )}

        <div className="px-8 py-6 space-y-6">

          {/* What you'll need */}
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">What you'll need</p>
            <ul className="space-y-2">
              {NEEDS.map(need => (
                <li key={need} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  {need}
                </li>
              ))}
            </ul>
          </div>

          {/* Branch selector */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-2">
              <Building2 className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Main Church Branch</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Select the branch that represents your church's main entity. This branch will be
                  associated with your global Paystack account. Once approved, other branches can
                  set up their own subaccounts via Settings → Branch Payouts.
                </p>
              </div>
            </div>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-slate-400 py-1">
                <Loader className="w-4 h-4 animate-spin" /> Loading branches...
              </div>
            ) : branches.length === 0 ? (
              <div className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                No branches found. Please create at least one branch before setting up KYC.
              </div>
            ) : (
              <select
                value={mainBranchId}
                onChange={e => setMainBranchId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              >
                <option value="">Select main branch...</option>
                {branches.map((b: any) => (
                  <option key={b._id} value={b._id}>{b.name} {b.type === 'main' ? '(Main)' : ''}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 flex justify-end">
          <button
            onClick={handleStart}
            disabled={!mainBranchId || loading}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ── KycWizard ─────────────────────────────────────────────────────────────────

interface KycWizardProps {
  rejectionReason: string | null;
  onSubmitted: () => void;
}

const KycWizard: React.FC<KycWizardProps> = ({ rejectionReason, onSubmitted }) => {
  const [showIntro, setShowIntro] = useState(true);
  const [mainBranchId, setMainBranchId] = useState('');
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [banks, setBanks] = useState<any[]>([]);
  const [resolvingAccount, setResolvingAccount] = useState(false);

  const [business, setBusiness] = useState<BusinessForm>({
    legalBusinessName: '', businessRegistrationType: '',
    businessEmail: '', businessAddress: '', websiteOrSocial: '',
  });

  const [payout, setPayout] = useState<PayoutForm>({
    payoutType: 'mobile_wallet',
    settlementBank: '', settlementBankCode: '', accountNumber: '',
    accountName: '', bankBranch: '',
    mobileWalletProvider: 'MTN', mobileWalletPhone: '', mobileWalletAccountName: '',
    payoutSchedule: '', payoutScheduleWeekDay: '', payoutScheduleMonthDate: '',
  });

  const [docs, setDocs] = useState<DocumentsForm>({
    businessCertificate: null, formA: [], formB: [], tinNumber: '',
  });

  const [directors, setDirectors] = useState<Director[]>([emptyDirector(), emptyDirector()]);
  const [agreed, setAgreed] = useState(false);

  const isLLP = business.businessRegistrationType === 'Limited Liability Partnership';
  const isSole = business.businessRegistrationType === 'Sole Proprietor';

  const STEPS = isLLP
    ? ['Business Details', 'Payout', 'Documents', 'Directors', 'Agreement']
    : ['Business Details', 'Payout', 'Documents', 'Agreement'];

  useEffect(() => {
    financeAPI.getBanksList()
      .then((res: any) => setBanks(res.data.data || []))
      .catch(() => {});
  }, []);

  const handleAccountResolve = async () => {
    if (!payout.settlementBankCode || payout.accountNumber.length < 10) return;
    setResolvingAccount(true);
    try {
      const res = await financeAPI.resolveAccountNumber({
        accountNumber: payout.accountNumber,
        bankCode: payout.settlementBankCode,
      });
      setPayout(p => ({ ...p, accountName: res.data.data?.account_name || '' }));
    } catch {
      toast.error('Could not resolve account number');
    } finally {
      setResolvingAccount(false);
    }
  };

  const validateStep = (): boolean => {
    if (step === 0) {
      if (!business.legalBusinessName || !business.businessRegistrationType || !business.businessEmail || !business.businessAddress) {
        toast.error('Please fill in all required business details');
        return false;
      }
    }
    if (step === 1) {
      if (!payout.payoutSchedule) { toast.error('Please select a payout schedule'); return false; }
      if (payout.payoutSchedule === 'weekly' && !payout.payoutScheduleWeekDay) { toast.error('Please select a payout day'); return false; }
      if (payout.payoutSchedule === 'monthly' && !payout.payoutScheduleMonthDate) { toast.error('Please select a payout date'); return false; }
      if (payout.payoutType === 'bank') {
        if (!payout.settlementBankCode || !payout.accountNumber || !payout.bankBranch) { toast.error('Please fill in all bank details'); return false; }
      } else {
        if (!payout.mobileWalletProvider || !payout.mobileWalletPhone || !payout.mobileWalletAccountName) { toast.error('Please fill in all mobile money details'); return false; }
      }
    }
    if (step === 2) {
      if (!docs.tinNumber) { toast.error('TIN Number is required'); return false; }
      if (!docs.businessCertificate) { toast.error('Business certificate is required'); return false; }
      if (isSole && docs.formA.length === 0) { toast.error('At least one Form A file is required for Sole Proprietors'); return false; }
      if (!isSole && docs.formB.length === 0) { toast.error('At least one Form B file is required for your business type'); return false; }
    }
    if (step === 3 && isLLP) {
      for (let i = 0; i < directors.length; i++) {
        const d = directors[i];
        if (!d.name || !d.email || !d.phone || !d.dateOfBirth || !d.nationality || !d.address || !d.city) {
          toast.error(`Please fill in all fields for Director ${i + 1}`); return false;
        }
        if (!d.ghanaCard) { toast.error(`Ghana Card is required for Director ${i + 1}`); return false; }
        if (!d.utilityBill) { toast.error(`Utility Bill is required for Director ${i + 1}`); return false; }
      }
    }
    if (step === STEPS.length - 1 && !agreed) {
      toast.error('You must agree to the terms before submitting');
      return false;
    }
    return true;
  };

  const handleNext = () => { if (validateStep()) setStep(s => s + 1); };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
 
      // Business
      formData.append('legalBusinessName', business.legalBusinessName);
      formData.append('businessRegistrationType', business.businessRegistrationType);
      formData.append('businessEmail', business.businessEmail);
      formData.append('businessAddress', business.businessAddress);
      formData.append('websiteOrSocial', business.websiteOrSocial);

      // Payout
      formData.append('payoutType', payout.payoutType);
      formData.append('payoutSchedule', payout.payoutSchedule);
      if (payout.payoutSchedule === 'weekly') formData.append('payoutScheduleWeekDay', payout.payoutScheduleWeekDay);
      if (payout.payoutSchedule === 'monthly') formData.append('payoutScheduleMonthDate', payout.payoutScheduleMonthDate);
      if (payout.payoutType === 'bank') {
        formData.append('settlementBank', payout.settlementBank);
        formData.append('settlementBankCode', payout.settlementBankCode);
        formData.append('accountNumber', payout.accountNumber);
        formData.append('accountName', payout.accountName);
        formData.append('bankBranch', payout.bankBranch);
      } else {
        formData.append('mobileWalletProvider', payout.mobileWalletProvider);
        formData.append('mobileWalletPhone', payout.mobileWalletPhone);
        formData.append('mobileWalletAccountName', payout.mobileWalletAccountName);
      }

      // Main branch association
      if (mainBranchId) formData.append('mainBranchId', mainBranchId);

      // Documents
      formData.append('tinNumber', docs.tinNumber);
      if (docs.businessCertificate) formData.append('businessCertificate', docs.businessCertificate);
      if (isSole) docs.formA.forEach(f => formData.append('formA', f));
      if (!isSole) docs.formB.forEach(f => formData.append('formB', f));

      // Directors (LLP only)
      if (isLLP) {
        const directorMeta = directors.map(d => ({
          name: d.name, email: d.email, phone: d.phone,
          dateOfBirth: d.dateOfBirth, nationality: d.nationality,
          address: d.address, city: d.city,
        }));
        formData.append('directors', JSON.stringify(directorMeta));
        directors.forEach((d, i) => {
          if (d.ghanaCard) formData.append(`ghanaCard_${i}`, d.ghanaCard);
          if (d.utilityBill) formData.append(`utilityBill_${i}`, d.utilityBill);
        });
      }

      await financeAPI.submitKyc(formData);
      toast.success('KYC submitted! We will review and get back to you shortly.');
      onSubmitted();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (showIntro) {
    return (
      <GetStartedScreen
        rejectionReason={rejectionReason}
        onStart={(branchId) => { setMainBranchId(branchId); setShowIntro(false); }}
      />
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-3xl w-full">

        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Giving KYC Verification</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Complete this form to unlock the Giving module for your church.
          </p>

          {rejectionReason && (
            <div className="mt-4 flex items-start gap-3 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-700 dark:text-red-400 text-sm font-semibold">Application Rejected</p>
                <p className="text-red-600 dark:text-red-300 text-sm mt-0.5">{rejectionReason}</p>
              </div>
            </div>
          )}

          {/* Step progress */}
          <div className="flex items-center mt-6">
            {STEPS.map((label, i) => (
              <React.Fragment key={label}>
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors flex-shrink-0 ${
                    i < step ? 'bg-green-500 text-white' :
                    i === step ? 'bg-primary-600 text-white' :
                    'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400'
                  }`}>
                    {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-xs font-medium text-center leading-tight ${
                    i === step ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mb-4 mx-1 ${i < step ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-600'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="px-8 py-6 min-h-[340px]">
          {step === 0 && <StepBusiness value={business} onChange={setBusiness} />}
          {step === 1 && (
            <StepPayout value={payout} onChange={setPayout} banks={banks}
              resolvingAccount={resolvingAccount} onResolveAccount={handleAccountResolve} />
          )}
          {step === 2 && (
            <StepDocuments value={docs} onChange={setDocs}
              businessRegistrationType={business.businessRegistrationType} />
          )}
          {step === 3 && isLLP && (
            <StepDirectors value={directors} onChange={setDirectors} />
          )}
          {step === STEPS.length - 1 && (
            <StepAgreement agreed={agreed} onToggle={setAgreed}
              legalBusinessName={business.legalBusinessName} />
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-slate-200 dark:border-slate-700 flex justify-between">
          <button type="button" onClick={() => setStep(s => s - 1)} disabled={step === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button type="button" onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={submitting || !agreed}
              className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              {submitting ? 'Submitting...' : 'Agree & Submit KYC'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default KycWizard;
