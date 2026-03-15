import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { downloadQuotePdf } from '../api/client';
import { useTranslation } from '../i18n/useTranslation';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function plus30Days(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

function randomQuoteNo(): number {
  return Math.floor(Math.random() * 99) + 1;
}

export function ExportPdfModal({
  quoteId,
  onClose,
}: {
  quoteId: string;
  onClose: () => void;
}) {
  const { t, lang } = useTranslation();
  const [quoteNumber, setQuoteNumber] = useState(randomQuoteNo);
  const [quoteDate, setQuoteDate] = useState(todayISO);
  const [validUntil, setValidUntil] = useState(plus30Days);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    if (!quoteDate || !validUntil) return;
    const num = Math.max(1, Math.min(99, Math.floor(Number(quoteNumber)) || 1));
    setLoading(true);
    try {
      await downloadQuotePdf(quoteId, quoteDate, validUntil, lang, num);
      toast.success(t('pdfGenerated'));
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('pdfFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-slate-900">{t('exportPdfTitle')}</h2>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {t('quoteNo')}
              <span className="text-red-500" aria-hidden="true"> *</span>
            </label>
            <input
              type="number"
              min={1}
              max={99}
              value={quoteNumber}
              required
              aria-required="true"
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === '') { setQuoteNumber(1); return; }
                const n = Math.floor(Number(raw));
                setQuoteNumber(Number.isNaN(n) ? 1 : Math.max(1, Math.min(99, n)));
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {t('quoteDate')}
            </label>
            <input
              type="date"
              value={quoteDate}
              onChange={(e) => setQuoteDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
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
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
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
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !quoteDate || !validUntil || quoteNumber < 1 || quoteNumber > 99}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t('generating')}
              </>
            ) : (
              t('generate')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
