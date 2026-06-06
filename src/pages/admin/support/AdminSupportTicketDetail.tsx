import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  LifeBuoy,
  Paperclip,
  Send,
  X,
  Loader2,
  RefreshCw,
  FileText,
  Image as ImageIcon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Building2,
  User
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminSupportAPI } from '../../../services/api';
import toast from 'react-hot-toast';

interface Message {
  _id: string;
  sender: { _id: string; name: string; email: string };
  senderRole: 'merchant_user' | 'super_admin';
  body: string;
  attachments: { url: string; originalName: string; resourceType: string }[];
  createdAt: string;
}

interface Ticket {
  _id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  messages: Message[];
  merchant: { _id: string; name: string; subdomain: string; email: string };
  createdBy: { _id: string; name: string; email: string };
  createdAt: string;
  resolvedAt?: string;
  closedAt?: string;
  cancelledAt?: string;
  cancelledBy?: { name: string; email: string };
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

const PRIORITY_BADGE: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
};

const AdminSupportTicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyBody, setReplyBody] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchTicket = async (silent = false) => {
    if (!id) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await adminSupportAPI.getTicket(id);
      setTicket(res.data.data);
    } catch {
      toast.error('Failed to load ticket');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchTicket(); }, [id]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (attachments.length + files.length > 5) {
      toast.error('Maximum 5 attachments');
      return;
    }
    setAttachments(prev => [...prev, ...files]);
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim() || !id) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('body', replyBody);
      attachments.forEach(f => fd.append('attachments', f));
      const res = await adminSupportAPI.replyToTicket(id, fd);
      setTicket(res.data.data);
      setReplyBody('');
      setAttachments([]);
      toast.success('Reply sent');
    } catch {
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!id || !ticket) return;
    setUpdatingStatus(true);
    try {
      const res = await adminSupportAPI.updateStatus(id, { status: newStatus });
      setTicket(res.data.data);
      toast.success(`Status updated to ${STATUS_LABELS[newStatus]}`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    if (!id) return;
    try {
      const res = await adminSupportAPI.updateStatus(id, { priority: newPriority });
      setTicket(res.data.data);
      toast.success('Priority updated');
    } catch {
      toast.error('Failed to update priority');
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    setCancelling(true);
    try {
      await adminSupportAPI.cancelTicket(id);
      toast.success('Ticket cancelled');
      navigate('/admin/support');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to cancel ticket');
    } finally {
      setCancelling(false);
      setShowCancelConfirm(false);
    }
  };

  const isClosed = ticket && ['cancelled'].includes(ticket.status);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 text-gray-400">
        <AlertTriangle className="w-12 h-12 mb-3" />
        <p>Ticket not found</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Back */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => navigate('/admin/support')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to tickets
        </button>
        <button
          onClick={() => fetchTicket(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Thread */}
        <div className="lg:col-span-2 space-y-4">
          {/* Ticket Header */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex-shrink-0">
                <LifeBuoy className="w-5 h-5 text-primary-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-mono text-gray-400 mb-0.5">{ticket.ticketNumber}</p>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white leading-snug">{ticket.subject}</h1>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[ticket.status]}`}>
                    {STATUS_LABELS[ticket.status]}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PRIORITY_BADGE[ticket.priority]}`}>
                    {ticket.priority} priority
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 capitalize">
                    {ticket.category}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(ticket.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Message Thread */}
          <div className="space-y-3">
            {ticket.messages.map((msg, idx) => {
              const isAdmin = msg.senderRole === 'super_admin';
              return (
                <div key={msg._id || idx} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    isAdmin
                      ? 'bg-primary-600 text-white rounded-tr-sm'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-tl-sm'
                  }`}>
                    <div className={`flex items-center gap-2 mb-1.5 ${isAdmin ? 'justify-end' : ''}`}>
                      <span className={`text-xs font-medium ${isAdmin ? 'text-primary-100' : 'text-primary-600 dark:text-primary-400'}`}>
                        {isAdmin ? 'Support Team (You)' : msg.sender?.name || 'Church User'}
                      </span>
                      <span className={`text-xs ${isAdmin ? 'text-primary-200' : 'text-gray-400'}`}>
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className={`text-sm whitespace-pre-wrap leading-relaxed ${isAdmin ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                      {msg.body}
                    </p>
                    {msg.attachments?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {msg.attachments.map((att, ai) => (
                          <a
                            key={ai}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-1.5 text-xs underline underline-offset-2 ${
                              isAdmin ? 'text-primary-100' : 'text-primary-600 dark:text-primary-400'
                            }`}
                          >
                            {att.resourceType === 'image' ? <ImageIcon className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                            {att.originalName || 'Attachment'}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply Box */}
          {!isClosed ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <form onSubmit={handleReply} className="space-y-3">
                <textarea
                  rows={4}
                  value={replyBody}
                  onChange={e => setReplyBody(e.target.value)}
                  placeholder="Type your reply to the church..."
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
                {attachments.length > 0 && (
                  <ul className="space-y-1">
                    {attachments.map((f, i) => (
                      <li key={i} className="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-700 rounded px-3 py-1.5">
                        <span className="truncate text-gray-700 dark:text-gray-300">{f.name}</span>
                        <button type="button" onClick={() => setAttachments(a => a.filter((_, j) => j !== i))} className="ml-2 text-gray-400 hover:text-red-500">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex items-center gap-2 justify-between">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Paperclip className="w-3.5 h-3.5" /> Attach
                  </button>
                  <input ref={fileInputRef} type="file" multiple accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
                  <button
                    type="submit"
                    disabled={sending || !replyBody.trim()}
                    className="flex items-center gap-2 px-4 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send Reply
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              This ticket has been cancelled.
            </div>
          )}
        </div>

        {/* Right: Info & Controls */}
        <div className="space-y-4">
          {/* Church Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Church</h3>
            <div className="flex items-start gap-2.5">
              <Building2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{ticket.merchant?.name}</p>
                <p className="text-xs text-gray-400">{ticket.merchant?.subdomain}</p>
                <p className="text-xs text-gray-400">{ticket.merchant?.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 mt-3">
              <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{ticket.createdBy?.name}</p>
                <p className="text-xs text-gray-400">{ticket.createdBy?.email}</p>
              </div>
            </div>
          </div>

          {/* Status Control */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Update Status</h3>
            <div className="space-y-2">
              {[
                { value: 'open', label: 'Open' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'pending_church', label: 'Pending Church Response' },
                { value: 'resolved', label: 'Mark Resolved' },
                { value: 'closed', label: 'Close Ticket' }
              ].map(opt => (
                <button
                  key={opt.value}
                  disabled={updatingStatus || ticket.status === opt.value || ticket.status === 'cancelled'}
                  onClick={() => handleStatusChange(opt.value)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg border transition-colors disabled:opacity-50 ${
                    ticket.status === opt.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium'
                      : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {updatingStatus && ticket.status !== opt.value ? (
                    <span className="flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" />{opt.label}</span>
                  ) : opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority Control */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Priority</h3>
            <select
              value={ticket.priority}
              onChange={e => handlePriorityChange(e.target.value)}
              disabled={ticket.status === 'cancelled'}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* Cancel */}
          {ticket.status !== 'cancelled' && (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <XCircle className="w-4 h-4" /> Cancel Ticket
            </button>
          )}

          {ticket.resolvedAt && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-xs text-green-700 dark:text-green-300">
              <CheckCircle2 className="w-4 h-4" />
              Resolved {new Date(ticket.resolvedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {/* Cancel Confirm Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Cancel Ticket?</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              Cancel ticket <strong>{ticket.ticketNumber}</strong>? The church will be notified via in-app notification.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Keep Ticket
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Cancel Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSupportTicketDetail;
