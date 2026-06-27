import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { adminSupportAPI } from '../../../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Ticket {
  _id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  merchant: { _id: string; name: string; subdomain: string };
  createdBy: { name: string; email: string };
}

interface Stats {
  open: number;
  inProgress: number;
  pendingChurch: number;
  resolved: number;
  closed: number;
  cancelled: number;
  total: number;
}

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  pending_church: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  closed: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  pending_church: 'Pending Church',
  resolved: 'Resolved',
  closed: 'Closed',
  cancelled: 'Cancelled'
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-gray-500',
  medium: 'text-blue-600',
  high: 'text-orange-500',
  urgent: 'text-red-600 font-semibold'
};

const AdminSupport: React.FC = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ticketsRes, statsRes] = await Promise.all([
        adminSupportAPI.getTickets({
          page,
          limit: 20,
          ...(statusFilter && { status: statusFilter }),
          ...(priorityFilter && { priority: priorityFilter }),
          ...(categoryFilter && { category: categoryFilter }),
          ...(searchQuery && { search: searchQuery })
        }),
        adminSupportAPI.getStats()
      ]);
      setTickets(ticketsRes.data.data);
      setTotalPages(ticketsRes.data.pagination.pages);
      setTotal(ticketsRes.data.pagination.total);
      setStats(statsRes.data.data);
    } catch {
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, statusFilter, priorityFilter, categoryFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const statCards = stats ? [
    { label: 'Open', value: stats.open, icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'In Progress', value: stats.inProgress, icon: TrendingUp, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { label: 'Pending Church', value: stats.pendingChurch, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
  ] : [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-8xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
            <LifeBuoy className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Support Tickets</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage all church support requests</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {statCards.map(card => (
            <div key={card.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by ticket # or subject..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors">
              Search
            </button>
          </form>
          <div className="flex gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Statuses</option>
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <select
              value={priorityFilter}
              onChange={e => { setPriorityFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <select
              value={categoryFilter}
              onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Categories</option>
              <option value="billing">Billing</option>
              <option value="technical">Technical</option>
              <option value="account">Account</option>
              <option value="general">General</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <LifeBuoy className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-base font-medium">No tickets found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Ticket #</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Subject</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Church</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">Category</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden lg:table-cell">Priority</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden xl:table-cell">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {tickets.map(ticket => (
                    <tr
                      key={ticket._id}
                      onClick={() => navigate(`/admin/support/${ticket._id}`)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {ticket.ticketNumber}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white max-w-xs truncate">
                        {ticket.subject}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="text-gray-800 dark:text-gray-200 font-medium text-xs">{ticket.merchant?.name}</div>
                        <div className="text-gray-400 text-xs">{ticket.merchant?.subdomain}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 capitalize hidden sm:table-cell">
                        {ticket.category}
                      </td>
                      <td className={`px-4 py-3 capitalize hidden lg:table-cell ${PRIORITY_COLORS[ticket.priority]}`}>
                        {ticket.priority}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[ticket.status]}`}>
                          {STATUS_LABELS[ticket.status] || ticket.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap hidden xl:table-cell">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
              <span className="text-xs text-gray-400">{total} total tickets</span>
              <div className="flex items-center gap-3">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <span className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {totalPages}</span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminSupport;
