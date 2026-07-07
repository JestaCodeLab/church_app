import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  HandCoins, Loader2, CheckCircle, XCircle, AlertCircle,
  User, Phone, ChevronRight, Sparkles
} from 'lucide-react';
import { eventAPI } from '../../services/api';

type Stage = 'loading' | 'error' | 'form' | 'paying' | 'success' | 'failed';

interface OfferingType {
  _id: string;
  name: string;
  isDefault: boolean;
}

interface EventData {
  eventId: string;
  uniqueId: string;
  title: string;
  date?: string;
  coverImage?: string;
  merchant: { name: string; logo?: string };
  branch?: { name: string } | null;
  giving: { goal?: { amount: number }; totalRaised?: number };
  offeringTypes: OfferingType[];
}

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(n);

const inputCls =
  'w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-secondary-400 focus:border-transparent text-sm transition-shadow';

const PublicEventGiving: React.FC = () => {
  const { uniqueId } = useParams<{ uniqueId: string }>();
  const [searchParams] = useSearchParams();

  const [stage, setStage] = useState<Stage>('loading');
  const [event, setEvent] = useState<EventData | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [amount, setAmount] = useState('');
  const [offeringTypeId, setOfferingTypeId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [amountPaid, setAmountPaid] = useState(0);

  useEffect(() => {
    if (!uniqueId) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await eventAPI.getPublicGivingEvent(uniqueId);
        if (cancelled) return;
        setEvent(res.data.data);
        const ref = searchParams.get('reference') || searchParams.get('trxref');
        if (ref) {
          setStage('paying');
          const vRes = await eventAPI.verifyGiving(uniqueId, ref);
          if (cancelled) return;
          setAmountPaid(vRes.data.data?.amount ?? 0);
          setStage('success');
          return;
        }
        setStage('form');
      } catch (err: any) {
        if (cancelled) return;
        setErrorMsg(err?.response?.data?.message || 'This giving page is unavailable.');
        setStage('error');
      }
    })();

    return () => { cancelled = true; };
  }, [uniqueId]);


  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || !firstName.trim() || !phone.trim()) return;
    setStage('paying');
    try {
      const res = await eventAPI.initiateGiving(uniqueId!, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),

        amount: amt, // send in GHS — backend/paystackConfig converts to pesewas
        category: 'offering',
        ...(offeringTypeId ? { offeringTypeId } : {})
      });
      window.location.href = res.data.data.authorizationUrl;
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to initiate payment. Please try again.');
      setStage('form');
    }
  };

  // ── Shell — soft secondary-tinted background ────────────────────────────

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-white to-secondary-50/40 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-md space-y-4">{children}</div>
    </div>
  );

  // ── State screens ─────────────────────────────────────────────────────────

  if (stage === 'error') return shell(
    <div className="bg-white rounded-2xl p-8 text-center shadow-md border border-red-100">
      <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-7 h-7 text-red-400" />
      </div>
      <h2 className="text-lg font-semibold text-slate-800 mb-1">Page Unavailable</h2>
      <p className="text-sm text-slate-500">{errorMsg}</p>
    </div>
  );

  if (stage === 'paying') return shell(
    <div className="flex flex-col items-center py-24 gap-3">
      <Loader2 className="w-9 h-9 animate-spin text-secondary-500" />
      <p className="text-sm text-slate-500">Verifying your payment…</p>
    </div>
  );

  if (stage === 'success') return shell(
    <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-secondary-100">
      {/* Success header */}
      <div className="bg-gradient-to-br from-secondary-500 to-secondary-700 px-8 py-10 text-center">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
          <CheckCircle className="w-9 h-9 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">Thank You!</h2>
        {amountPaid > 0 && (
          <p className="text-3xl font-bold text-white mt-1">{fmtCurrency(amountPaid)}</p>
        )}
      </div>
      <div className="px-8 py-6 text-center">
        <div className="flex items-center justify-center gap-1.5 mb-2">
          <Sparkles className="w-4 h-4 text-secondary-400" />
          <span className="text-sm font-semibold text-slate-700">
            Your offering has been received
          </span>
          <Sparkles className="w-4 h-4 text-secondary-400" />
        </div>
        <p className="text-sm text-slate-500 leading-relaxed">
          for <strong className="text-slate-700">{event?.title}</strong>. God bless you abundantly!
        </p>
        {event?.merchant?.name && (
          <p className="text-xs text-slate-400 mt-5 pt-4 border-t border-slate-100">
            {event.merchant.name}
          </p>
        )}
      </div>
    </div>
  );

  if (stage === 'failed') return shell(
    <div className="bg-white rounded-2xl p-8 text-center shadow-md border border-red-100">
      <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
        <XCircle className="w-7 h-7 text-red-400" />
      </div>
      <h2 className="text-lg font-semibold text-slate-800 mb-1">Payment Unsuccessful</h2>
      <p className="text-sm text-slate-500 mb-6">
        We couldn't confirm your payment. Please try again or contact your church.
      </p>
      <button onClick={() => setStage('form')}
        className="px-6 py-2.5 bg-secondary-600 text-white rounded-xl text-sm font-medium hover:bg-secondary-700 transition-colors">
        Try Again
      </button>
    </div>
  );

  // ── Form ──────────────────────────────────────────────────────────────────

  return shell(
    <>
      {/* Church / Event header card */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-slate-100">
        {event?.coverImage ? (
          <img src={event.coverImage} alt={event.title} className="w-full h-44 object-cover" />
        ) : (
          <div className="h-10 bg-gradient-to-r from-secondary-400 to-secondary-600" />
        )}
        <div className="px-6 py-5">
          {event?.merchant?.logo && (
            <img src={event.merchant.logo} alt={event.merchant.name}
              className="h-9 mb-3 rounded-lg object-contain" />
          )}
          <p className="text-xs font-semibold text-secondary-600 uppercase tracking-widest mb-1">
            {event?.merchant?.name}
          </p>
          <h1 className="text-xl font-bold text-slate-800">{event?.title}</h1>
          {event?.branch && (
            <p className="text-xs text-slate-400 mt-0.5">{event.branch.name}</p>
          )}
          {event?.date && (
            <p className="text-xs text-slate-400 mt-0.5">
              {new Date(event.date).toLocaleDateString('en-GH', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
              })}
            </p>
          )}
        </div>
      </div>

      {/* Give form */}
      <form onSubmit={handlePay} className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">

        {/* Form header */}
        <div className="bg-secondary-50 px-6 py-5 border-b border-secondary-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary-100 flex items-center justify-center">
              <HandCoins className="w-5 h-5 text-secondary-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-secondary-800">Make a Gift</h2>
              <p className="text-xs text-secondary-600/70">Your generosity makes a difference</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {errorMsg && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* Offering type — only shown when the church has types configured */}
          {event?.offeringTypes && event.offeringTypes.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2.5 uppercase tracking-wider">
                Offering Type <span className="text-slate-400 font-normal normal-case">(optional)</span>
              </label>
              <select
                value={offeringTypeId}
                onChange={e => setOfferingTypeId(e.target.value)}
                className={inputCls}
              >
                <option value="">General</option>
                {event.offeringTypes.map(t => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2.5 uppercase tracking-wider">
              Amount (GHS)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-semibold text-slate-400">₵</span>
              <input type="number" min="1" step="0.01" value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00" required
                className="w-full pl-8 pr-4 py-3.5 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-secondary-400 focus:border-transparent text-xl font-bold transition-shadow" />
            </div>
          </div>

          {/* Quick amounts */}
          <div>
            <p className="text-xs text-slate-400 mb-2">Quick select</p>
            <div className="flex gap-2 flex-wrap">
              {[10, 20, 50, 100, 200].map(q => (
                <button key={q} type="button" onClick={() => setAmount(String(q))}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    amount === String(q)
                      ? 'bg-secondary-50 border-secondary-400 text-secondary-700'
                      : 'border-slate-200 text-slate-500 bg-slate-50 hover:border-secondary-300 hover:bg-secondary-50'
                  }`}>
                  GHS {q}
                </button>
              ))}
            </div>
          </div>

          {/* Personal details */}
          <div className="space-y-3 pt-1 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 pt-2 uppercase tracking-wider">Your Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                  placeholder="First name" required className={`${inputCls} pl-10`} />
              </div>
              <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                placeholder="Last name" className={inputCls} />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="Phone number" required className={`${inputCls} pl-10`} />
            </div>
          </div>

          {/* Submit */}
          <button type="submit"
            disabled={!amount || parseFloat(amount) <= 0 || !firstName || !phone}
            className="w-full flex items-center justify-center gap-2 py-4 bg-secondary-600 text-white rounded-xl text-sm font-bold hover:bg-secondary-700 active:bg-secondary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md">
            {amount && parseFloat(amount) > 0
              ? `Give ${fmtCurrency(parseFloat(amount))}`
              : 'Give via Paystack'}
            <ChevronRight className="w-4 h-4" />
          </button>

          <p className="text-xs text-center text-slate-400 pb-1">
            🔒 Secured by Paystack — your payment details are never stored.
          </p>
        </div>
      </form>
    </>
  );
};

export default PublicEventGiving;
