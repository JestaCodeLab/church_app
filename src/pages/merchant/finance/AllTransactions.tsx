import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Download, CreditCard, CheckCircle, XCircle, Clock,
  FileText, HandCoins, HeartHandshake, MessageSquare, DollarSign
} from 'lucide-react';
import { financeAPI, settingsAPI, messagingAPI } from '../../../services/api';
import { showToast } from '../../../utils/toasts';
import { format } from 'date-fns';

// ── Types ─────────────────────────────────────────────────────────────────────

interface IncomeRow {
  _id: string;
  amount: number;
  currency?: string;
  status: string;
  createdAt: string;
  date: string;
  monthPaid?: string;
  paymentMethod?: string;
  paystackReference?: string;
  source: string;
  category: string;
  isGuest?: boolean;
  member?: { _id: string; firstName: string; lastName: string };
  offeringType?: { _id: string; name: string } | string;
}

interface TransactionRow {
  _id: string;
  amount: number;
  currency?: string;
  status: string;
  createdAt: string;
  transactionType?: string;
  type?: string;
  payerName?: string;
  customerName?: string;
  payerEmail?: string;
  planName?: string;
  plan?: string;
  invoiceNumber?: string;
  channel?: string;
  transactionDate?: string;
  paymentDate?: string;
  paymentReference?: string;
}

type TabKey = 'offerings' | 'tithes' | 'subscriptions' | 'sms';

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtCurrency = (amount: number, currency = 'GHS') =>
  new Intl.NumberFormat('en-GH', { style: 'currency', currency }).format(amount);

const StatusBadge = ({ status }: { status: string }) => {
  const s = status?.toLowerCase();
  const cfg: Record<string, { cls: string; Icon: typeof CheckCircle }> = {
    success:   { cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', Icon: CheckCircle },
    completed: { cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', Icon: CheckCircle },
    verified:  { cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', Icon: CheckCircle },
    pending:   { cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', Icon: Clock },
    failed:    { cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', Icon: XCircle },
    cancelled: { cls: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', Icon: XCircle },
  };
  const { cls, Icon } = cfg[s] || cfg.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      <Icon className="w-3 h-3" />
      {status ? status.charAt(0).toUpperCase() + status.slice(1) : ''}
    </span>
  );
};

const tdDate = (dateStr: string) => (
  <>
    <div className="font-medium text-gray-900 dark:text-gray-100">{format(new Date(dateStr), 'MMM dd, yyyy')}</div>
    <div className="text-xs text-gray-400">{format(new Date(dateStr), 'hh:mm a')}</div>
  </>
);

const inputCls = 'px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500';
const thCls = 'px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide';
const tdCls = 'px-4 py-3';

// ── Pagination ────────────────────────────────────────────────────────────────

interface PagState { page: number; limit: number; total: number; pages: number }
const initPag = (): PagState => ({ page: 1, limit: 20, total: 0, pages: 0 });

const PaginationBar = ({ pag, onPage }: { pag: PagState; onPage: (p: number) => void }) => {
  if (pag.pages <= 1) return null;
  return (
    <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
      <span>{((pag.page - 1) * pag.limit) + 1}–{Math.min(pag.page * pag.limit, pag.total)} of {pag.total}</span>
      <div className="flex gap-2">
        <button onClick={() => onPage(pag.page - 1)} disabled={pag.page === 1}
          className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800">
          Previous
        </button>
        <span className="px-3 py-1.5">Page {pag.page} of {pag.pages}</span>
        <button onClick={() => onPage(pag.page + 1)} disabled={pag.page >= pag.pages}
          className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800">
          Next
        </button>
      </div>
    </div>
  );
};

// ── Filter bar ────────────────────────────────────────────────────────────────

const FilterBar = ({
  search, onSearch, onSearchCommit, dateFrom, dateTo, onDateFrom, onDateTo
}: {
  search: string; onSearch: (v: string) => void; onSearchCommit: () => void;
  dateFrom: string; dateTo: string; onDateFrom: (v: string) => void; onDateTo: (v: string) => void;
}) => (
  <div className="flex flex-wrap gap-3 mb-4">
    <div className="relative flex-1 min-w-48">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input type="text" value={search} onChange={e => onSearch(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onSearchCommit()}
        placeholder="Search..."
        className={`w-full pl-9 pr-4 ${inputCls}`} />
    </div>
    <input type="date" value={dateFrom} onChange={e => onDateFrom(e.target.value)} className={inputCls} />
    <input type="date" value={dateTo} onChange={e => onDateTo(e.target.value)} className={inputCls} />
  </div>
);

// ── Offerings / Tithes (Income model) ────────────────────────────────────────

const IncomeTab = ({ category }: { category: 'offering' | 'tithe' }) => {
  const [rows, setRows] = useState<IncomeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [pag, setPag] = useState(initPag());

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const apiMethod = category === 'tithe' ? financeAPI.tithe : financeAPI.offering;
      const res = await apiMethod.getAll({
        page,
        limit: pag.limit,
        ...(search ? { search } : {}),
        ...(dateFrom ? { startDate: dateFrom } : {}),
        ...(dateTo ? { endDate: dateTo } : {}),
      });
      // Income response: { success, data: [...], stats, pagination: { page, limit, total, pages } }
      const records = Array.isArray(res.data?.data) ? res.data.data : [];
      const pg = res.data?.pagination;
      setRows(records);
      if (pg) setPag(p => ({ ...p, page, total: pg.total ?? 0, pages: pg.pages ?? 0 }));
    } catch (err: any) {
      showToast.error(err?.response?.data?.message || `Failed to load ${category}s`);
    } finally {
      setLoading(false);
    }
  }, [category, pag.limit, search, dateFrom, dateTo]);

  useEffect(() => { load(1); }, [category, dateFrom, dateTo]);

  const offeringTypeName = (row: IncomeRow) => {
    if (!row.offeringType) return '—';
    if (typeof row.offeringType === 'object') return row.offeringType.name;
    return '—'; // unpopulated ObjectId, skip
  };

  const columns = category === 'offering'
    ? ['Date', 'Member / Source', 'Offering Type', 'Method', 'Amount', 'Status']
    : ['Date', 'Member / Source', 'Month', 'Method', 'Amount', 'Status'];

  return (
    <>
      <FilterBar search={search} onSearch={setSearch} onSearchCommit={() => load(1)}
        dateFrom={dateFrom} dateTo={dateTo} onDateFrom={setDateFrom} onDateTo={setDateTo} />
      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>{columns.map(h => <th key={h} className={thCls}>{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900">
              {loading ? (
                <tr><td colSpan={6} className="py-10 text-center">
                  <div className="animate-spin mx-auto h-6 w-6 rounded-full border-b-2 border-primary-600" />
                </td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400 dark:text-gray-500">
                  {category === 'offering'
                    ? <HeartHandshake className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    : <HandCoins className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  }
                  <p className="text-sm">No {category}s found</p>
                </td></tr>
              ) : rows.map(row => (
                <tr key={row._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className={tdCls}>{tdDate(row.date || row.createdAt)}</td>
                  <td className={tdCls}>
                    {row.member
                      ? <div className="font-medium text-gray-900 dark:text-gray-100">{row.member.firstName} {row.member.lastName}</div>
                      : <div className="text-gray-600 dark:text-gray-300">{row.source || (row.isGuest ? 'Guest' : '—')}</div>
                    }
                    {row.paystackReference && <div className="text-xs font-mono text-gray-400">{row.paystackReference}</div>}
                  </td>
                  <td className={tdCls}>
                    {category === 'offering'
                      ? <span className="px-2 py-0.5 rounded-full text-xs bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-400">{offeringTypeName(row)}</span>
                      : <span className="text-gray-700 dark:text-gray-300">{row.monthPaid || '—'}</span>
                    }
                  </td>
                  <td className={`${tdCls} text-gray-600 dark:text-gray-300 capitalize`}>{row.paymentMethod?.replace(/_/g, ' ') || '—'}</td>
                  <td className={`${tdCls} font-semibold text-gray-900 dark:text-gray-100`}>{fmtCurrency(row.amount, row.currency)}</td>
                  <td className={tdCls}><StatusBadge status={row.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PaginationBar pag={pag} onPage={p => load(p)} />
      </div>
    </>
  );
};

// ── Subscriptions (GET /api/v1/settings/billing-history → raw Paystack txns) ──

const SubscriptionsTab = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [pag, setPag] = useState(initPag());

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await settingsAPI.getBillingHistory({ page, limit: pag.limit });
      // { data: { transactions: [...Paystack raw], pagination: { page, limit, total } } }
      const d = res.data?.data;
      setRows(d?.transactions ?? []);
      const pg = d?.pagination;
      if (pg) setPag(p => ({ ...p, page, total: pg.total ?? 0, pages: Math.ceil((pg.total ?? 0) / pag.limit) }));
    } catch (err: any) {
      showToast.error(err?.response?.data?.message || 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  }, [pag.limit]);

  useEffect(() => { load(1); }, []);

  return (
    <>
      <div className="flex flex-wrap gap-3 mb-4">
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={inputCls} />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={inputCls} />
      </div>
      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {['Date', 'Reference', 'Channel', 'Amount', 'Status'].map(h => (
                  <th key={h} className={thCls}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900">
              {loading ? (
                <tr><td colSpan={5} className="py-10 text-center">
                  <div className="animate-spin mx-auto h-6 w-6 rounded-full border-b-2 border-primary-600" />
                </td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-gray-400 dark:text-gray-500">
                  <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No subscription transactions found</p>
                </td></tr>
              ) : rows.map((row, i) => (
                <tr key={row.id ?? i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className={tdCls}>{tdDate(row.paid_at || row.created_at || row.createdAt)}</td>
                  <td className={tdCls}>
                    <div className="flex items-center gap-1 font-mono text-xs text-gray-700 dark:text-gray-300">
                      <CreditCard className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      {row.reference || '—'}
                    </div>
                  </td>
                  <td className={`${tdCls} text-gray-600 dark:text-gray-300 capitalize`}>{row.channel || '—'}</td>
                  <td className={`${tdCls} font-semibold text-gray-900 dark:text-gray-100`}>
                    {fmtCurrency((row.amount ?? 0) / 100, row.currency || 'GHS')}
                  </td>
                  <td className={tdCls}><StatusBadge status={row.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PaginationBar pag={pag} onPage={p => load(p)} />
      </div>
    </>
  );
};

// ── SMS Purchase (GET /api/v1/sms/purchase-history → SmsCreditPurchase docs) ──

const SmsPurchaseTab = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pag, setPag] = useState(initPag());

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await messagingAPI.credits.getHistory({ page, limit: pag.limit });
      // { data: { purchases: [...], pagination: { totalItems, totalPages } } }
      const d = res.data?.data;
      setRows(d?.purchases ?? []);
      const pg = d?.pagination;
      if (pg) setPag(p => ({ ...p, page, total: pg.totalItems ?? 0, pages: pg.totalPages ?? 0 }));
    } catch (err: any) {
      showToast.error(err?.response?.data?.message || 'Failed to load SMS purchases');
    } finally {
      setLoading(false);
    }
  }, [pag.limit]);

  useEffect(() => { load(1); }, []);

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {['Date', 'Reference', 'Package', 'Credits', 'Amount', 'Status'].map(h => (
                  <th key={h} className={thCls}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900">
              {loading ? (
                <tr><td colSpan={6} className="py-10 text-center">
                  <div className="animate-spin mx-auto h-6 w-6 rounded-full border-b-2 border-primary-600" />
                </td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400 dark:text-gray-500">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No SMS purchases found</p>
                </td></tr>
              ) : rows.map(row => (
                <tr key={row._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className={tdCls}>{tdDate(row.createdAt)}</td>
                  <td className={tdCls}>
                    <div className="flex items-center gap-1 font-mono text-xs text-gray-700 dark:text-gray-300">
                      <CreditCard className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      {row.payment?.paystackReference || row.payment?.transactionReference || row._id.slice(-8)}
                    </div>
                  </td>
                  <td className={tdCls}>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400">
                      {row.package?.name || '—'}
                    </span>
                  </td>
                  <td className={`${tdCls} text-gray-700 dark:text-gray-300 font-medium`}>
                    {row.package?.credits?.toLocaleString() ?? '—'}
                  </td>
                  <td className={`${tdCls} font-semibold text-gray-900 dark:text-gray-100`}>
                    {fmtCurrency(row.package?.price?.amount ?? 0, row.package?.price?.currency || 'GHS')}
                  </td>
                  <td className={tdCls}><StatusBadge status={row.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PaginationBar pag={pag} onPage={p => load(p)} />
      </div>
    </>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'offerings',     label: 'Offerings',    icon: HeartHandshake },
  { key: 'tithes',        label: 'Tithes',        icon: HandCoins },
  { key: 'subscriptions', label: 'Subscriptions', icon: DollarSign },
  { key: 'sms',           label: 'SMS Purchase',  icon: MessageSquare },
];

const AllTransactions = () => {
  const [active, setActive] = useState<TabKey>('offerings');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-primary-600" />
          Transactions
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">View transactions by category</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActive(key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                active === key
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </nav>
      </div>

      <div>
        {active === 'offerings'     && <IncomeTab category="offering" />}
        {active === 'tithes'        && <IncomeTab category="tithe" />}
        {active === 'subscriptions' && <SubscriptionsTab />}
        {active === 'sms'           && <SmsPurchaseTab />}
      </div>
    </div>
  );
};

export default AllTransactions;
