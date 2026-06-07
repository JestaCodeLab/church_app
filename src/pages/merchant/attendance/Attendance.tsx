import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Search, Users, Calendar, Download, CheckCircle, XCircle,
  ChevronDown, X, Loader, MinusCircle
} from 'lucide-react';
import { eventAPI, memberAPI } from '../../../services/api';
import { showToast } from '../../../utils/toasts';
import DatePicker from '../../../components/ui/DatePicker';
import { format } from 'date-fns';

const EVENT_TYPES_EXCLUDE_SERVICE = 'conference,seminar,workshop,social,outreach,meeting,other';

type Tab = 'services' | 'events';

const nameInitials = (name: string) => {
  const parts = (name || '').trim().split(/\s+/);
  const f = parts[0]?.[0] || '?';
  const l = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (f + l).toUpperCase();
};

const fullName = (person: any) =>
  person ? `${person.firstName || ''} ${person.lastName || ''}`.trim() || person.name || 'Unknown' : 'Unknown';

// Windowed page numbers: 1 … 4 5 6 … 20
const pageItems = (current: number, total: number): (number | '…')[] => {
  const items: (number | '…')[] = [];
  for (let p = 1; p <= total; p++) {
    if (p === 1 || p === total || (p >= current - 1 && p <= current + 1)) {
      items.push(p);
    } else if (items[items.length - 1] !== '…') {
      items.push('…');
    }
  }
  return items;
};

const PaginationBar: React.FC<{
  page: number;
  totalPages: number;
  total: number;
  loading?: boolean;
  onChange: (p: number) => void;
}> = ({ page, totalPages, total, loading, onChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between flex-wrap gap-3">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {total.toLocaleString()} records · Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1 || loading}
          className="px-3 h-9 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Prev
        </button>
        {pageItems(page, totalPages).map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className="px-2 text-gray-400 select-none">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              disabled={loading}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                p === page
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages || loading}
          className="px-3 h-9 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
};

const Attendance: React.FC = () => {
  const [tab, setTab] = useState<Tab>('services');

  // Event selector
  const [eventOptions, setEventOptions] = useState<any[]>([]);
  const [eventSearch, setEventSearch] = useState('');
  const [showEventDropdown, setShowEventDropdown] = useState(false);
  const [eventLoading, setEventLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const eventDropdownRef = useRef<HTMLDivElement>(null);

  // Date range (recurring only)
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Member filter
  const [memberSearch, setMemberSearch] = useState('');
  const [memberOptions, setMemberOptions] = useState<any[]>([]);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [memberFilter, setMemberFilter] = useState<any>(null);
  const memberDropdownRef = useRef<HTMLDivElement>(null);

  // Results
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  // Recurring grid (server-aggregated)
  const [gridDates, setGridDates] = useState<string[]>([]);
  const [gridRows, setGridRows] = useState<any[]>([]);
  const [gridSummary, setGridSummary] = useState<{
    totalRecords: number; members: number; guests: number;
    uniqueAttendees: number; avgAttendance: number; perDate: Record<string, number>;
  }>({ totalRecords: 0, members: 0, guests: 0, uniqueAttendees: 0, avgAttendance: 0, perDate: {} });
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const gridScrollRef = useRef<HTMLDivElement>(null);

  const isRecurring = selectedEvent?.isRecurring || false;

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (eventDropdownRef.current && !eventDropdownRef.current.contains(e.target as Node))
        setShowEventDropdown(false);
      if (memberDropdownRef.current && !memberDropdownRef.current.contains(e.target as Node))
        setShowMemberDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Reset on tab change
  useEffect(() => {
    setSelectedEvent(null);
    setEventSearch('');
    setDateFrom('');
    setDateTo('');
    setMemberFilter(null);
    setMemberSearch('');
    setAttendanceRecords([]);
    setGridDates([]);
    setGridRows([]);
    setHasSearched(false);
    loadEventOptions('');
  }, [tab]);

  const loadEventOptions = async (search: string) => {
    setEventLoading(true);
    try {
      const eventType = tab === 'services' ? 'service' : EVENT_TYPES_EXCLUDE_SERVICE;
      const res = await eventAPI.getEvents({
        eventType,
        limit: 10,
        search: search || undefined,
        status: 'published'
      });
      setEventOptions(res.data.data.events || []);
    } catch {}
    finally { setEventLoading(false); }
  };

  // Debounced event search
  useEffect(() => {
    const t = setTimeout(() => loadEventOptions(eventSearch), 300);
    return () => clearTimeout(t);
  }, [eventSearch]);

  // Member autocomplete
  useEffect(() => {
    if (!memberSearch) { setMemberOptions([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await memberAPI.getMembers({ search: memberSearch, limit: 10, status: 'active' });
        setMemberOptions(res.data.data.members || []);
        setShowMemberDropdown(true);
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [memberSearch]);

  const clearEvent = () => {
    setSelectedEvent(null);
    setEventSearch('');
    setAttendanceRecords([]);
    setGridDates([]);
    setGridRows([]);
    setHasSearched(false);
    setPage(1);
    setTotalPages(1);
    setTotalRecords(0);
  };

  const fetchAttendance = async (targetPage = 1) => {
    if (!selectedEvent) return;

    // Validate 2-month max range for recurring events
    if (isRecurring && dateFrom && dateTo) {
      const from = new Date(dateFrom);
      const to = new Date(dateTo);
      const diffMonths = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
      if (diffMonths > 2 || to < from) {
        showToast.error('Date range cannot exceed 2 months');
        return;
      }
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const params: any = { limit: 50, page: targetPage };
      if (dateFrom) params.startDate = dateFrom;
      if (dateTo) params.endDate = dateTo;

      if (isRecurring) {
        // Server-aggregated cross-reference grid
        if (memberFilter) params.memberId = memberFilter._id;
        const res = await eventAPI.getAttendanceGrid(selectedEvent._id, params);
        const d = res.data.data;
        setGridDates(d.dates || []);
        setGridRows(d.rows || []);
        setGridSummary(d.summary || { totalRecords: 0, members: 0, guests: 0, uniqueAttendees: 0, avgAttendance: 0, perDate: {} });
        setPage(d.pagination?.page || targetPage);
        setTotalPages(d.pagination?.pages || 1);
        setTotalRecords(d.pagination?.totalRows || 0);
      } else {
        // One-time event: flat record list
        const res = await eventAPI.getAttendance(selectedEvent._id, params);
        const records = res.data.data.attendance || [];
        const pagination = res.data.data.pagination || {};
        setAttendanceRecords(records);
        setPage(pagination.page || targetPage);
        setTotalPages(pagination.pages || 1);
        setTotalRecords(pagination.total || records.length);
      }
      gridScrollRef.current?.scrollTo({ top: 0, left: 0 });
    } catch {
      showToast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  // Derived
  const displayStats = useMemo(() => {
    if (isRecurring) {
      return { total: gridSummary.totalRecords, members: gridSummary.members, guests: gridSummary.guests };
    }
    const members = attendanceRecords.filter(r => r.attendeeType === 'member').length;
    const guests = attendanceRecords.filter(r => r.attendeeType === 'guest').length;
    return { total: members + guests, members, guests };
  }, [isRecurring, gridSummary, attendanceRecords]);

  const oneTimeList = useMemo(() => {
    if (isRecurring) return [];
    return [
      ...attendanceRecords.filter(r => r.attendeeType === 'member'),
      ...attendanceRecords.filter(r => r.attendeeType === 'guest'),
    ];
  }, [attendanceRecords, isRecurring]);

  const handleExport = async () => {
    if (!selectedEvent) return;
    setExporting(true);
    try {
      const res = await eventAPI.exportAttendance(
        selectedEvent._id,
        dateFrom || undefined,
        dateTo || undefined
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-${selectedEvent.title}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch { showToast.error('Export failed'); }
    finally { setExporting(false); }
  };

  const formatColDate = (dateStr: string) =>
    format(new Date(dateStr), 'EEE d MMM');

  return (
    <div className="p-2 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Attendance</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and track attendance across services and events
          </p>
        </div>
        {hasSearched && attendanceRecords.length > 0 && (
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {(['services', 'events'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Selection card — single row */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex flex-wrap gap-4 items-end">

          {/* Event selector */}
          <div className="flex-1 min-w-[200px]" ref={eventDropdownRef}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {tab === 'services' ? 'Service' : 'Event'}
            </label>
            <div className="relative">
              <div className="no-focus-ring flex items-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 px-3 py-2 gap-2">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={selectedEvent ? selectedEvent.title : eventSearch}
                  onChange={(e) => {
                    if (selectedEvent) clearEvent();
                    setEventSearch(e.target.value);
                    setShowEventDropdown(true);
                  }}
                  onFocus={() => setShowEventDropdown(true)}
                  placeholder={`Search ${tab}…`}
                  className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 outline-none focus:outline-none focus:ring-0 min-w-0"
                />
                {selectedEvent
                  ? <button onClick={clearEvent}><X className="w-4 h-4 text-gray-400 hover:text-gray-600" /></button>
                  : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                }
              </div>
              {showEventDropdown && !selectedEvent && (
                <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
                  {eventLoading ? (
                    <div className="p-4 text-sm text-gray-500 flex items-center gap-2">
                      <Loader className="w-4 h-4 animate-spin" /> Loading…
                    </div>
                  ) : eventOptions.length === 0 ? (
                    <div className="p-4 text-sm text-gray-500">No {tab} found</div>
                  ) : (
                    <div className="max-h-56 overflow-y-auto">
                      {eventOptions.map(ev => (
                        <button
                          key={ev._id}
                          onClick={() => { setSelectedEvent(ev); setShowEventDropdown(false); setEventSearch(''); }}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors"
                        >
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{ev.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {ev.isRecurring ? 'Recurring' : 'One-time'} · {ev.eventType}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Date range — recurring only */}
          {isRecurring && (
            <>
              <div className="w-36">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From</label>
                <DatePicker value={dateFrom} onChange={setDateFrom} placeholder="Start date" />
              </div>
              <div className="w-36">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To</label>
                <DatePicker value={dateTo} onChange={setDateTo} placeholder="End date" />
              </div>
            </>
          )}

          {/* Member filter — recurring only */}
          {isRecurring && (
            <div className="w-48" ref={memberDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Member <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <div className="no-focus-ring flex items-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 px-3 py-2 gap-2">
                  <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={memberFilter ? fullName(memberFilter) : memberSearch}
                    onChange={(e) => {
                      if (memberFilter) setMemberFilter(null);
                      setMemberSearch(e.target.value);
                    }}
                    placeholder="Search…"
                    className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 outline-none focus:outline-none focus:ring-0 min-w-0"
                  />
                  {memberFilter && (
                    <button onClick={() => { setMemberFilter(null); setMemberSearch(''); }}>
                      <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>
                {showMemberDropdown && memberOptions.length > 0 && !memberFilter && (
                  <div className="absolute z-20 w-64 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {memberOptions.map(m => (
                      <button
                        key={m._id}
                        onClick={() => { setMemberFilter(m); setMemberSearch(''); setShowMemberDropdown(false); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors"
                      >
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{fullName(m)}</p>
                        <p className="text-xs text-gray-500">{m.phone || m.email || ''}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* View button */}
          <div className="flex items-end">
            <button
              onClick={() => fetchAttendance(1)}
              disabled={!selectedEvent || loading}
              className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              View Attendance
            </button>
          </div>

        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center py-16">
          <Loader className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      )}

      {/* Results */}
      {!loading && hasSearched && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {(isRecurring
              ? [
                  { label: 'Total Check-ins', value: gridSummary.totalRecords, color: 'text-gray-900 dark:text-gray-100', bg: 'bg-gray-50 dark:bg-gray-700' },
                  { label: 'Member Check-ins', value: gridSummary.members, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-900/20' },
                  { label: 'Guest Check-ins', value: gridSummary.guests, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
                ]
              : [
                  { label: 'Total Attended', value: displayStats.total, color: 'text-gray-900 dark:text-gray-100', bg: 'bg-gray-50 dark:bg-gray-700' },
                  { label: 'Members', value: displayStats.members, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-900/20' },
                  { label: 'Guests', value: displayStats.guests, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
                ]
            ).map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center`}>
                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {(isRecurring ? gridRows.length === 0 : attendanceRecords.length === 0) ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 py-16 text-center">
              <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No attendance records found for this period</p>
            </div>

          ) : isRecurring ? (
            /* ── Recurring: Cross-reference grid ── */
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {totalRecords} {totalRecords === 1 ? 'person' : 'people'} · {gridDates.length} {gridDates.length === 1 ? 'date' : 'dates'}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Attended</span>
                  <span className="flex items-center gap-1"><XCircle className="w-3.5 h-3.5 text-red-500" /> Absent</span>
                  <span className="flex items-center gap-1"><MinusCircle className="w-3.5 h-3.5 text-gray-300" /> N/A</span>
                </div>
              </div>
              <div ref={gridScrollRef} className="overflow-auto max-h-[calc(100vh-260px)]">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="sticky left-0 top-0 z-30 bg-gray-50 dark:bg-gray-700 px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide min-w-[220px] border-r border-b border-gray-200 dark:border-gray-600">
                        Name
                      </th>
                      <th className="sticky top-0 z-20 bg-gray-50 dark:bg-gray-700 px-3 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap min-w-[90px] border-r border-b border-gray-200 dark:border-gray-600">
                        Attended
                      </th>
                      {gridDates.map(date => (
                        <th key={date} className="sticky top-0 z-20 bg-gray-50 dark:bg-gray-700 px-3 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-[100px] border-b border-gray-200 dark:border-gray-600">
                          {formatColDate(date)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {gridRows.map(row => (
                      <tr key={row.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="sticky left-0 z-10 bg-white dark:bg-gray-800 hover:bg-gray-50/60 dark:hover:bg-gray-700/30 px-5 py-3 border-r border-gray-200 dark:border-gray-600">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                              row.type === 'member'
                                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }`}>
                              {nameInitials(row.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {row.name}
                              </p>
                              <span className={`text-xs ${
                                row.type === 'member'
                                  ? 'text-primary-500 dark:text-primary-400'
                                  : 'text-gray-400 dark:text-gray-500'
                              }`}>
                                {row.type === 'member' ? 'Member' : 'Guest'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center border-r border-gray-100 dark:border-gray-700">
                          <span className={`inline-flex items-center justify-center min-w-[42px] px-2 py-0.5 rounded-full text-xs font-semibold ${
                            row.attendedCount === 0
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                              : 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                          }`}>
                            {row.type === 'member' ? `${row.attendedCount}/${gridDates.length}` : row.attendedCount}
                          </span>
                        </td>
                        {gridDates.map(date => {
                          const status = row.cells[date];
                          return (
                            <td key={date} className="px-3 py-3 text-center">
                              {status === 'attended'
                                ? <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                                : status === 'absent'
                                  ? <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                                  : <MinusCircle className="w-4 h-4 text-gray-300 dark:text-gray-600 mx-auto" />
                              }
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationBar page={page} totalPages={totalPages} total={totalRecords} loading={loading} onChange={fetchAttendance} />
            </div>

          ) : (
            /* ── One-time: Clean list ── */
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Showing ({oneTimeList.length}) of {totalRecords} attendees
                </p>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {oneTimeList.map(record => {
                  const person = record.attendeeType === 'member' ? record.member : record.guest;
                  const name = fullName(person);
                  const time = record.checkIn?.timestamp
                    ? format(new Date(record.checkIn.timestamp), 'h:mm a')
                    : '—';
                  const isMember = record.attendeeType === 'member';
                  return (
                    <div key={record._id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        isMember
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {(name[0] || '?').toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{person?.phone || person?.email || ''}</p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                        isMember
                          ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}>
                        {isMember ? 'Member' : 'Guest'}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0 w-16 text-right">{time}</span>
                      <span className="text-xs text-gray-400 capitalize flex-shrink-0 w-20 text-right">
                        {record.checkIn?.method || ''}
                      </span>
                    </div>
                  );
                })}
              </div>
              <PaginationBar page={page} totalPages={totalPages} total={totalRecords} loading={loading} onChange={fetchAttendance} />
            </div>
          )}
        </>
      )}

      {/* Pre-search empty state */}
      {!hasSearched && !loading && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 py-24 text-center">
          <Users className="w-14 h-14 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Select a {tab === 'services' ? 'service' : 'event'} above to view attendance
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            For recurring {tab}, set a date range to see the attendance grid
          </p>
        </div>
      )}
    </div>
  );
};

export default Attendance;
