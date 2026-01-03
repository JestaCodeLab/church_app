import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, DollarSign, Download, Filter, Calendar,
  User, Mail, Phone, MessageSquare, CheckCircle,
  XCircle, Clock, TrendingUp, RefreshCw
} from 'lucide-react';
import { showToast } from '../../../utils/toasts';
import { format } from 'date-fns';
import { eventAPI } from '../../../services/api';

interface Donation {
  _id: string;
  donor: {
    type: 'member' | 'guest' | 'anonymous';
    member?: any;
    name: string;
    email: string;
    phone?: string;
  };
  payment: {
    amount: number;
    currency: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
    transactionReference: string;
    paidAt?: Date;
  };
  isAnonymous: boolean;
  message?: string;
  createdAt: Date;
}

interface Stats {
  totalRaised: number;
  totalDonations: number;
}

const EventDonations: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState<Stats>({ totalRaised: 0, totalDonations: 0 });
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchEvent();
    fetchDonations();
  }, [id, currentPage, statusFilter]);

  const fetchEvent = async () => {
    try {
      const response = await eventAPI.getEvent(id);
      setEvent(response.data.data.event);
    } catch (error) {
      console.error('Failed to load event:', error);
    }
  };

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 20
      };

      if (statusFilter) {
        params.status = statusFilter;
      }

      const response = await eventAPI.getDonations(id, { params });

      setDonations(response.data.data.donations);
      setStats(response.data.data.stats);
      setTotalPages(response.data.data.pagination.pages);
    } catch (error: any) {
      showToast.error('Failed to load donations');
      console.error('Failed to load donations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await eventAPI.exportDonations(id);

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `event-donations-${id}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      showToast.success('Donations exported successfully');
    } catch (error) {
      showToast.error('Failed to export donations');
      console.error('Failed to export donations:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.all([fetchEvent(), fetchDonations()]);
      showToast.success('Data refreshed successfully');
    } catch (error) {
      showToast.error('Failed to refresh data');
      console.error('Failed to refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: any }> = {
      completed: {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-800 dark:text-green-200',
        icon: CheckCircle
      },
      pending: {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-800 dark:text-yellow-200',
        icon: Clock
      },
      failed: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-800 dark:text-red-200',
        icon: XCircle
      },
      processing: {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-800 dark:text-blue-200',
        icon: Clock
      }
    };

    const style = styles[status] || styles.pending;
    const Icon = style.icon;

    return (
      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        <Icon className="w-3 h-3" />
        <span className="capitalize">{status}</span>
      </span>
    );
  };

  if (loading && donations.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading donations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/events/${id}`)}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Event Details</span>
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Event Donations
              </h1>
              {event && (
                <p className="text-gray-600 dark:text-gray-400">
                  {event.title}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh donations data"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                onClick={handleExport}
                disabled={exporting || donations.length === 0}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center space-x-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {exporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Export CSV</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-green-100 text-sm mb-1">Total Raised</p>
                <p className="text-3xl font-bold">
                  {event?.donations?.goal?.currency || 'GHS'} {stats.totalRaised.toLocaleString()}
                </p>
              </div>
              <div className="p-2 bg-white/20 rounded-full">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-blue-100 text-sm mb-1">Fundraising Goal</p>
                <p className="text-3xl font-bold">
                  {event?.donations?.goal?.amount 
                    ? `${event.donations.goal.currency} ${event.donations.goal.amount.toLocaleString()}`
                    : 'No Goal Set'
                  }
                </p>
              </div>
              <div className="p-2 bg-white/20 rounded-full">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-purple-100 text-sm mb-1">Total Donors</p>
                <p className="text-3xl font-bold">
                  {stats.totalDonations}
                </p>
              </div>
              <div className="p-2 bg-white/20 rounded-full">
                <User className="w-5 h-5" />
              </div>
            </div>
          </div>

          {+event?.donations?.goal?.amount > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-orange-200 dark:border-orange-800 shadow-lg">
              <div className="mb-3">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Goal Progress</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {Math.round((stats.totalRaised / event.donations.goal.amount) * 100)}%
                </p>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
                <div
                  className="bg-gradient-to-r from-orange-400 to-orange-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                  style={{
                    width: `${Math.min((stats.totalRaised / event.donations.goal.amount) * 100, 100)}%`
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {event.donations.goal.currency} {(event.donations.goal.amount - stats.totalRaised).toLocaleString()} remaining
              </p>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 mb-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                <Filter className="w-5 h-5 text-primary-600" />
                <span className="font-medium">Filter by:</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Status</option>
                <option value="completed">✓ Completed</option>
                <option value="pending">⏱ Pending</option>
                <option value="failed">✗ Failed</option>
                <option value="processing">↻ Processing</option>
              </select>
            </div>
            {donations.length > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing <span className="font-semibold text-gray-700 dark:text-gray-300">{donations.length}</span> donation{donations.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {/* Donations Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-md">
          {donations.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                <DollarSign className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {statusFilter ? 'No donations found' : 'No donations yet'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                {statusFilter 
                  ? 'Try changing the filter to see more results' 
                  : 'Donations will appear here once people start supporting this event'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Donor Information
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Message
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {donations.map((donation) => (
                    <tr key={donation._id} className="hover:bg-blue-50/50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-md">
                              <User className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {donation.isAnonymous ? 'Anonymous Donor' : donation.donor.name}
                            </div>
                            {!donation.isAnonymous && (
                              <>
                                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-1 mt-1">
                                  <Mail className="w-3 h-3" />
                                  <span>{donation.donor.email}</span>
                                </div>
                                {donation.donor.phone && (
                                  <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                                    <Phone className="w-3 h-3" />
                                    <span>{donation.donor.phone}</span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">
                          {donation.payment.currency} {donation.payment.amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        {getStatusBadge(donation.payment.status)}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-start space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {donation.payment.paidAt
                                ? format(new Date(donation.payment.paidAt), 'MMM d, yyyy')
                                : format(new Date(donation.createdAt), 'MMM d, yyyy')
                              }
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {donation.payment.paidAt
                                ? format(new Date(donation.payment.paidAt), 'h:mm a')
                                : format(new Date(donation.createdAt), 'h:mm a')
                              }
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 max-w-xs">
                        {donation.message ? (
                          <div className="flex items-start space-x-2">
                            <MessageSquare className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 italic">
                              "{donation.message}"
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No message</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDonations;
