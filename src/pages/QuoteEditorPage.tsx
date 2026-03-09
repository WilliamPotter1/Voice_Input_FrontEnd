import { useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Plus, Trash2, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createQuote,
  updateQuote,
  getQuote,
  type QuoteItemInput,
} from '../api/client';
import { useQuoteFormStore, useQuoteTotals } from '../stores/quoteFormStore';
import { useTranslation } from '../i18n/useTranslation';

const VAT_OPTIONS = [
  { value: 0, label: '0%' },
  { value: 0.07, label: '7%' },
  { value: 0.19, label: '19%' },
  { value: 0.22, label: '22%' },
];

function formatMoney(n: number): string {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function QuoteEditorPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);
  const extractedItems = (location.state as { extractedItems?: QuoteItemInput[] } | null)?.extractedItems;

  const {
    clientName,
    vatRate,
    items,
    setQuoteId,
    setClientName,
    setVatRate,
    addItem,
    updateItem,
    removeItem,
    loadQuote,
    reset,
  } = useQuoteFormStore();
  const { subtotal, vat, total } = useQuoteTotals();

  const quoteQuery = useQuery({
    queryKey: ['quote', id],
    queryFn: () => getQuote(id!),
    enabled: isEdit && !!id,
  });

  useEffect(() => {
    if (id) {
      setQuoteId(id);
    } else if (extractedItems?.length) {
      loadQuote('', 0.19, extractedItems);
    } else {
      reset();
    }
    return () => { reset(); };
  }, [id, setQuoteId, reset, loadQuote, extractedItems]);

  useEffect(() => {
    if (quoteQuery.data) {
      loadQuote(
        quoteQuery.data.clientName,
        quoteQuery.data.vatRate,
        quoteQuery.data.items.map((i) => ({
          itemName: i.itemName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        }))
      );
    }
  }, [quoteQuery.data, loadQuote]);

  const createMutation = useMutation({
    mutationFn: (payload: { clientName?: string; vatRate: number; items: QuoteItemInput[] }) =>
      createQuote(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success(t('quoteSaved'));
      reset();
      navigate('/quotes');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { clientName?: string; vatRate: number; items: QuoteItemInput[] }) =>
      updateQuote(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quote', id] });
      toast.success(t('quoteUpdated'));
      navigate('/quotes');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleSave() {
    const payload = {
      clientName: clientName.trim() || undefined,
      vatRate,
      items: items.map((i) => ({
        itemName: i.itemName.trim() || 'Item',
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
    };
    if (isEdit && id) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  }

  const saving = createMutation.isPending || updateMutation.isPending;
  const loadingQuote = isEdit && quoteQuery.isLoading;

  if (loadingQuote) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <Loader2 className="size-10 animate-spin text-emerald-500" />
        <p className="text-sm font-medium text-slate-600">{t('loadingQuotes')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/quotes')}
            className="flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            aria-label={t('backToQuotes')}
          >
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {isEdit ? t('editQuote') : t('newQuote')}
            </h1>
            <p className="text-sm text-slate-500">
              {isEdit ? t('updateItemsTotals') : t('addClientItems')}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/quotes')}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:flex-none"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60 sm:flex-none"
          >
            {saving ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                {t('saving')}
              </>
            ) : (
              t('saveQuote')
            )}
          </button>
        </div>
      </div>

      {/* Client & VAT */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">{t('clientName')}</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder={t('clientPlaceholder')}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">{t('vatRate')}</label>
            <select
              value={vatRate}
              onChange={(e) => setVatRate(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-slate-900 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
            >
              {VAT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Line items — Desktop: table, Mobile: cards */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        {/* Desktop table */}
        <div className="hidden sm:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="px-4 py-3.5 font-semibold text-slate-700">{t('item')}</th>
                <th className="w-24 px-4 py-3.5 font-semibold text-slate-700">{t('qty')}</th>
                <th className="w-32 px-4 py-3.5 font-semibold text-slate-700">{t('unitPrice')}</th>
                <th className="w-32 px-4 py-3.5 font-semibold text-slate-700">{t('total')}</th>
                <th className="w-14 px-4 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="transition hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={item.itemName}
                      onChange={(e) => updateItem(item.id, { itemName: e.target.value })}
                      placeholder={t('description')}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(item.id, { quantity: Math.max(1, parseInt(e.target.value, 10) || 1) })
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.unitPrice || ''}
                      onChange={(e) =>
                        updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium tabular-nums text-slate-700">
                    {formatMoney(item.quantity * item.unitPrice)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="flex size-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="divide-y divide-slate-100 sm:hidden">
          {items.map((item, idx) => (
            <div key={item.id} className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <input
                type="text"
                value={item.itemName}
                onChange={(e) => updateItem(item.id, { itemName: e.target.value })}
                placeholder={t('description')}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">{t('qty')}</label>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(item.id, { quantity: Math.max(1, parseInt(e.target.value, 10) || 1) })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">{t('unitPrice')}</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={item.unitPrice || ''}
                    onChange={(e) =>
                      updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">{t('total')}</label>
                  <div className="flex h-[38px] items-center rounded-lg bg-slate-50 px-3 text-sm font-semibold tabular-nums text-slate-700">
                    {formatMoney(item.quantity * item.unitPrice)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200 p-3">
          <button
            type="button"
            onClick={() => addItem()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 sm:w-auto sm:px-6"
          >
            <Plus className="size-4" />
            {t('addItem')}
          </button>
        </div>
      </section>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-full rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:w-auto sm:min-w-[280px] sm:p-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>{t('subtotal')}</span>
              <span className="tabular-nums font-medium">{formatMoney(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>{t('vat')} ({(vatRate * 100).toFixed(0)}%)</span>
              <span className="tabular-nums font-medium">{formatMoney(vat)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-900">
              <span>{t('total')}</span>
              <span className="tabular-nums">{formatMoney(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
