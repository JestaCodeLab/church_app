import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
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
  Tag,
  ShieldAlert
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { supportAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
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
  createdBy: { _id: string; name: string; email: string };
  createdAt: string;
  resolvedAt?: string;
  closedAt?: string;
  cancelledAt?: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  open:           { bg: 'bg-blue-50 dark:bg-blue-900/20',   text: 'text-blue-700 dark:text-blue-300',   dot: 'bg-blue-500',   label: 'Open' },
  in_progress:    { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-300', dot: 'bg-yellow-500', label: 'In Progress' },
  pending_church: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500', label: 'Awaiting Your Response' },
  resolved:       { bg: 'bg-green-50 dark:bg-green-900/20',  text: 'text-green-700 dark:text-green-300',  dot: 'bg-green-500',  label: 'Resolved' },
  closed:         { bg: 'bg-gray-100 dark:bg-gray-700',      text: 'text-gray-600 dark:text-gray-300',    dot: 'bg-gray-400',   label: 'Closed' },
  cancelled:      { bg: 'bg-red-50 dark:bg-red-900/20',      text: 'text-red-700 dark:text-red-300',      dot: 'bg-red-500',    label: 'Cancelled' },
};

const PRIORITY_STYLES: Record<string, string> = {
  low:    'text-gray-500 dark:text-gray-400',
  medium: 'text-blue-600 dark:text-blue-400',
  high:   'text-orange-600 dark:text-orange-400',
  urgent: 'text-red-600 dark:text-red-400 font-semibold',
};

const getInitials = (name: string) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

const SupportTicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyBody, setReplyBody] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTicket = async (silent = false) => {
    if (!id) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await supportAPI.getTicket(id);
      setTicket(res.data.data);
    } catch {
      toast.error('Failed to load ticket');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchTicket(); }, [id]);

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
      const res = await supportAPI.replyToTicket(id, fd);
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

  const handleCancel = async () => {
    if (!id) return;
    setCancelling(true);
    try {
      await supportAPI.cancelTicket(id);
      toast.success('Ticket cancelled');
      navigate('/support');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to cancel ticket');
    } finally {
      setCancelling(false);
      setShowCancelConfirm(false);
    }
  };

  const isClosed = ticket && ['resolved', 'closed', 'cancelled'].includes(ticket.status);
  const canCancel = ticket && ['open', 'pending_church'].includes(ticket.status);

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

  const statusStyle = STATUS_STYLES[ticket.status] || STATUS_STYLES.open;

  return (
    <div className="p-4 sm:p-4 lg:p-4 max-w-7xl mx-auto">

      {/* Back nav */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/support')}
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

      {/* Page title */}
      <div className="mb-5">
        <p className="text-xs font-mono font-medium text-primary-600 dark:text-primary-400 mb-1 tracking-wide">
          {ticket.ticketNumber}
        </p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
          {ticket.subject}
        </h1>
      </div>

      {/* Ticket metadata bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">

          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Status</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
              {statusStyle.label}
            </span>
          </div>

          <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 hidden sm:block" />

          {/* Priority */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Priority</span>
            <span className={`text-sm capitalize ${PRIORITY_STYLES[ticket.priority]}`}>
              {ticket.priority}
            </span>
          </div>

          <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 hidden sm:block" />

          {/* Category */}
          <div className="flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">{ticket.category}</span>
          </div>

          <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 hidden sm:block" />

          {/* Opened date */}
          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Opened {new Date(ticket.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>

          {ticket.resolvedAt && (
            <>
              <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 hidden sm:block" />
              <div className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Resolved {new Date(ticket.resolvedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </>
          )}

          {/* Cancel action — pushed right */}
          {canCancel && (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" /> Cancel Ticket
            </button>
          )}
        </div>

        {/* Pending church banner */}
        {ticket.status === 'pending_church' && (
          <div className="flex items-start gap-2.5 mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 rounded-lg">
            <ShieldAlert className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-orange-700 dark:text-orange-300">
              The support team is waiting for your response. Please reply below to continue.
            </p>
          </div>
        )}
      </div>

      {/* Message thread */}
      <div className="space-y-0 mb-4">
        {ticket.messages.map((msg, idx) => {
          const isAdmin = msg.senderRole === 'super_admin';
          const senderName = isAdmin ? 'Support Team' : (msg.sender?.name || 'You');
          const initials = isAdmin ? 'ST' : getInitials(senderName);

          return (
            <div key={msg._id || idx} className="relative">
              {/* Connector line between messages */}
              {idx < ticket.messages.length - 1 && (
                <div className="absolute left-5 top-12 bottom-0 w-px bg-gray-200 dark:bg-gray-700 z-0" />
              )}

              <div className="relative z-10 flex gap-3 py-4">
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  isAdmin
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
                }`}>
                  {initials}
                </div>

                {/* Message card */}
                <div className="flex-1 min-w-0">
                  {/* Header row */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{senderName}</span>
                    {isAdmin && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                        Support
                      </span>
                    )}
                    <span className="text-xs text-gray-400 ml-auto">
                      {new Date(msg.createdAt).toLocaleString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>

                  {/* Body */}
                  <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    isAdmin
                      ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/50 text-gray-800 dark:text-gray-200'
                      : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200'
                  }`}>
                    {msg.body}

                    {/* Attachments */}
                    {msg.attachments?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-1.5">
                        {msg.attachments.map((att, ai) => (
                          <a
                            key={ai}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs text-primary-600 dark:text-primary-400 hover:underline"
                          >
                            {att.resourceType === 'image'
                              ? <ImageIcon className="w-3.5 h-3.5 flex-shrink-0" />
                              : <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                            }
                            {att.originalName || 'Attachment'}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply box */}
      {!isClosed ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-4 pt-4 pb-1">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Reply</p>
            <form onSubmit={handleReply} className="space-y-3">
              <textarea
                rows={5}
                value={replyBody}
                onChange={e => setReplyBody(e.target.value)}
                placeholder="Write your reply here..."
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />

              {attachments.length > 0 && (
                <ul className="space-y-1">
                  {attachments.map((f, i) => (
                    <li key={i} className="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Paperclip className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate text-gray-700 dark:text-gray-300">{f.name}</span>
                        <span className="text-gray-400 flex-shrink-0">({(f.size / 1024).toFixed(0)} KB)</span>
                      </div>
                      <button type="button" onClick={() => setAttachments(a => a.filter((_, j) => j !== i))} className="ml-2 text-gray-400 hover:text-red-500 flex-shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex items-center justify-between pb-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  Attach file
                  {attachments.length > 0 && <span className="ml-1 text-primary-600">({attachments.length})</span>}
                </button>
                <input ref={fileInputRef} type="file" multiple accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
                <button
                  type="submit"
                  disabled={sending || !replyBody.trim()}
                  className="flex items-center gap-2 px-5 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sending ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className={`flex items-start gap-3 p-4 rounded-xl border text-sm ${
          ticket.status === 'resolved'
            ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800 text-green-700 dark:text-green-300'
            : ticket.status === 'cancelled'
            ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800 text-red-700 dark:text-red-300'
            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
        }`}>
          {ticket.status === 'resolved' && <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          {ticket.status === 'cancelled' && <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          {ticket.status === 'closed' && <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          <div>
            <p className="font-medium">
              {ticket.status === 'resolved' && 'This ticket has been resolved.'}
              {ticket.status === 'closed' && 'This ticket is closed.'}
              {ticket.status === 'cancelled' && 'This ticket has been cancelled.'}
            </p>
            {(ticket.status === 'resolved' || ticket.status === 'closed') && (
              <p className="text-xs mt-1 opacity-80">If you need further assistance, please open a new ticket.</p>
            )}
          </div>
        </div>
      )}

      {/* Cancel confirm modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Cancel this ticket?</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              You're about to cancel <strong className="text-gray-700 dark:text-gray-200">{ticket.ticketNumber}</strong>.
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-5">This action cannot be undone.</p>
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
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportTicketDetail;
