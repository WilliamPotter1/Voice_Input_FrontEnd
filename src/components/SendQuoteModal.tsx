import { useState } from 'react';
import { Loader2, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { getQuoteSendLinks } from '../api/client';
import { useTranslation } from '../i18n/useTranslation';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function randomQuoteNo(): number {
  return Math.floor(Math.random() * 99) + 1;
}

type EmailProvider = 'gmail' | 'outlook' | 'yahoo' | 'other';

const EMAIL_PROVIDER_IMAGES: Record<EmailProvider, string> = {
  gmail: '/images/gmail.png',
  outlook: '/images/outlook.jpg',
  yahoo: '/images/yahoo.jpg',
  other: '/images/other.jpg',
};

function buildComposeUrl(
  provider: EmailProvider,
  to: string,
  subject: string,
  body: string,
): string {
  const enc = encodeURIComponent;
  const toEnc = enc(to.trim());
  const subEnc = enc(subject);
  const bodyEnc = enc(body);
  switch (provider) {
    case 'gmail':
      return `https://mail.google.com/mail/?view=cm&to=${toEnc}&su=${subEnc}&body=${bodyEnc}`;
    case 'outlook':
      return `https://outlook.live.com/mail/0/deeplink/compose?to=${toEnc}&subject=${subEnc}&body=${bodyEnc}`;
    case 'yahoo':
      return `https://compose.mail.yahoo.com/?to=${toEnc}&subject=${subEnc}&body=${bodyEnc}`;
    default:
      return `mailto:${to.trim()}?subject=${subEnc}&body=${bodyEnc}`;
  }
}

export function SendQuoteModal({
  quoteId,
  onClose,
}: {
  quoteId: string;
  onClose: () => void;
}) {
  const { t, lang } = useTranslation();
  const [channel, setChannel] = useState<'email' | 'whatsapp'>('email');
  const [recipient, setRecipient] = useState('');
  const [quoteNumber, setQuoteNumber] = useState(randomQuoteNo);
  const [quoteDate, setQuoteDate] = useState(todayISO);
  const [validUntil, setValidUntil] = useState(todayISO);
  const [loading, setLoading] = useState(false);

  async function handleEmailProvider(provider: EmailProvider) {
    if (!recipient?.trim() || !quoteDate || !validUntil) return;
    const num = Math.max(1, Math.floor(Number(quoteNumber)) || 1);
    setLoading(true);
    try {
      const { pdfUrl, attachmentUrls } = await getQuoteSendLinks(
        quoteId,
        quoteDate,
        validUntil,
        num,
        lang,
      );
      const intro = t('sendEmailBodyLinksIntro') as string;
      const pdfLabel = t('sendEmailPdfLabel') as string;
      const attachmentsLabel = t('sendEmailAttachmentsLabel') as string;
      const bodyLines = [intro, '', pdfLabel, pdfUrl];
      if (attachmentUrls.length > 0) {
        bodyLines.push('', attachmentsLabel);
        attachmentUrls.forEach((a) => bodyLines.push(`${a.filename}: ${a.url}`));
      }
      const body = bodyLines.join('\n');
      const subject = t('sendEmailSubject') as string;
      const url = buildComposeUrl(provider, recipient.trim(), subject, body);
      window.open(url, '_blank', 'noopener,noreferrer');
      toast.success(t('sendEmailComposeOpened'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('quoteSendFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function handleWhatsAppSend() {
    if (!recipient?.trim() || !quoteDate || !validUntil) return;
    const num = Math.max(1, Math.floor(Number(quoteNumber)) || 1);
    setLoading(true);
    try {
      const { pdfUrl, attachmentUrls } = await getQuoteSendLinks(
        quoteId,
        quoteDate,
        validUntil,
        num,
        lang,
      );
      const intro = t('sendEmailBodyLinksIntro') as string;
      const pdfLabel = t('sendEmailPdfLabel') as string;
      const attachmentsLabel = t('sendEmailAttachmentsLabel') as string;
      const bodyLines = [intro, '', pdfLabel, pdfUrl];
      if (attachmentUrls.length > 0) {
        bodyLines.push('', attachmentsLabel);
        attachmentUrls.forEach((a) => bodyLines.push(`${a.filename}: ${a.url}`));
      }
      const body = bodyLines.join('\n');
      const phone = recipient.trim().replace(/\D/g, '');
      if (!phone) {
        toast.error(t('quoteSendFailed'));
        return;
      }
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(body)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      toast.success(t('sendWhatsAppComposeOpened'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('quoteSendFailed'));
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = recipient?.trim() && quoteDate && validUntil && quoteNumber >= 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-slate-900">{t('sendQuoteTitle')}</h2>

        <div className="mt-5 space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setChannel('email'); setRecipient(''); }}
              className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium ${
                channel === 'email'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}
            >
              <Mail className="size-4" />
              {t('sendByEmail')}
            </button>
            <button
              type="button"
              onClick={() => { setChannel('whatsapp'); setRecipient(''); }}
              className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium ${
                channel === 'whatsapp'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}
            >
              <img src="/images/whatsapp.jpg" alt="" className="size-5 shrink-0 object-contain" />
              {t('sendByWhatsapp')}
            </button>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {t('quoteNo')}
              <span className="text-red-500" aria-hidden="true"> *</span>
            </label>
            <input
              type="number"
              min={1}
              value={quoteNumber}
              required
              aria-required="true"
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === '') { setQuoteNumber(1); return; }
                const n = Math.floor(Number(raw));
                setQuoteNumber(Number.isNaN(n) ? 1 : Math.max(1, n));
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {channel === 'email' ? t('emailAddress') : t('whatsappNumber')}
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
              placeholder={channel === 'email' ? 'name@example.com' : '+491701234567'}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                {t('quoteDate')}
              </label>
              <input
                type="date"
                value={quoteDate}
                onChange={(e) => setQuoteDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                {t('validUntil')}
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {channel === 'email' && (
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">{t('emailProvider')}</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleEmailProvider('gmail')}
                  disabled={!canSubmit || loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                  aria-label={t('openGmail')}
                >
                  {loading ? (
                    <Loader2 className="size-5 shrink-0 animate-spin" />
                  ) : (
                    <img src={EMAIL_PROVIDER_IMAGES.gmail} alt="" className="size-6 shrink-0 object-contain" />
                  )}
                  {t('openGmail')}
                </button>
                <button
                  type="button"
                  onClick={() => handleEmailProvider('outlook')}
                  disabled={!canSubmit || loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                  aria-label={t('openOutlook')}
                >
                  {loading ? (
                    <Loader2 className="size-5 shrink-0 animate-spin" />
                  ) : (
                    <img src={EMAIL_PROVIDER_IMAGES.outlook} alt="" className="size-6 shrink-0 object-contain" />
                  )}
                  {t('openOutlook')}
                </button>
                <button
                  type="button"
                  onClick={() => handleEmailProvider('yahoo')}
                  disabled={!canSubmit || loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                  aria-label={t('openYahoo')}
                >
                  {loading ? (
                    <Loader2 className="size-5 shrink-0 animate-spin" />
                  ) : (
                    <img src={EMAIL_PROVIDER_IMAGES.yahoo} alt="" className="size-6 shrink-0 object-contain" />
                  )}
                  {t('openYahoo')}
                </button>
                <button
                  type="button"
                  onClick={() => handleEmailProvider('other')}
                  disabled={!canSubmit || loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                  aria-label={t('openOtherEmail')}
                >
                  {loading ? (
                    <Loader2 className="size-5 shrink-0 animate-spin" />
                  ) : (
                    <img src={EMAIL_PROVIDER_IMAGES.other} alt="" className="size-6 shrink-0 object-contain" />
                  )}
                  {t('openOtherEmail')}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {t('cancel')}
          </button>
          {channel === 'whatsapp' && (
            <button
              type="button"
              onClick={handleWhatsAppSend}
              disabled={loading || !canSubmit}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t('sending')}
                </>
              ) : (
                t('send')
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
