import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Plus, Trash2, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createQuote,
  updateQuote,
  getQuote,
  listQuoteAttachments,
  uploadQuoteAttachment,
  deleteQuoteAttachment,
  type QuoteItemInput,
  type QuoteAttachment,
} from '../api/client';
import { useQuoteFormStore, useQuoteTotals } from '../stores/quoteFormStore';
import { useTranslation } from '../i18n/useTranslation';

function getUnitFromItemName(name: string): string {
  const match = name.match(/\(([^)]+)\)\s*$/);
  return match ? match[1].trim() : '';
}

function getBaseNameFromItemName(name: string): string {
  const match = name.match(/\(([^)]+)\)\s*$/);
  return match ? name.slice(0, match.index).trim() : name.trim();
}

function makeItemName(base: string, unit: string): string {
  const cleanBase = base.trim() || 'Item';
  const cleanUnit = unit.trim();
  return cleanUnit ? `${cleanBase} (${cleanUnit})` : cleanBase;
}

function getCurrencySymbol(code: string | null | undefined): string {
  const c = (code || 'EUR').toUpperCase();
  switch (c) {
    case 'EUR':
      return '€';
    case 'USD':
      return '$';
    case 'CHF':
      return 'CHF';
    case 'GBP':
      return '£';
    default:
      return c;
  }
}

function formatMoney(n: number, currency: string): string {
  const safeCurrency = currency && currency.length === 3 ? currency.toUpperCase() : 'EUR';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: safeCurrency,
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
  const locationState = location.state as {
    extractedItems?: QuoteItemInput[];
    extractedCustomerName?: string;
    extractedCustomerAddress?: string;
    extractedVatRate?: number;
    extractedCurrency?: string;
    transcription?: string;
  } | null;
  const extractedItems = locationState?.extractedItems;
  const extractedCustomerName = locationState?.extractedCustomerName;
  const extractedCustomerAddress = locationState?.extractedCustomerAddress;
  const extractedVatRate = locationState?.extractedVatRate;
  const extractedCurrency = locationState?.extractedCurrency;
  const transcription = locationState?.transcription ?? '';
  const [showFullTranscription, setShowFullTranscription] = useState(false);
  const [currency, setCurrency] = useState<string>(extractedCurrency || 'EUR');
  const [previewAttachment, setPreviewAttachment] = useState<QuoteAttachment | null>(null);

  const {
    clientName,
    customerAddress,
    vatRate,
    items,
    setQuoteId,
    setClientName,
    setCustomerAddress,
    setVatRate,
    addItem,
    updateItem,
    removeItem,
    loadQuote,
    reset,
  } = useQuoteFormStore();
  const { subtotal, vat, total } = useQuoteTotals();

  const attachmentsQuery = useQuery({
    queryKey: ['quoteAttachments', id],
    queryFn: () => listQuoteAttachments(id!),
    enabled: isEdit && !!id,
  });
  const attachments: QuoteAttachment[] = attachmentsQuery.data ?? [];

  const uploadAttachmentMutation = useMutation({
    mutationFn: (file: File) => uploadQuoteAttachment(id!, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quoteAttachments', id] });
      toast.success(t('attachmentUploaded'));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function getAttachmentUrl(att: QuoteAttachment): string {
    // att.url is a path like "/quotes/:id/attachments/:attachmentId/download" or with /api prefix.
    if (att.url.startsWith('http://') || att.url.startsWith('https://')) return att.url;
    // Ensure a single leading "/"
    const path = att.url.startsWith('/') ? att.url : `/${att.url}`;
    // Our backend is mounted under /api, so prefix if not already there.
    return path.startsWith('/api') ? `/api${path}` : `/api/api${path}`;
  }

  function isImageAttachment(att: QuoteAttachment): boolean {
    return att.mimeType.startsWith('image/');
  }

  function isPdfAttachment(att: QuoteAttachment): boolean {
    return att.mimeType === 'application/pdf';
  }

  const quoteQuery = useQuery({
    queryKey: ['quote', id],
    queryFn: () => getQuote(id!),
    enabled: isEdit && !!id,
  });

  useEffect(() => {
    if (id) {
      setQuoteId(id);
    } else if (extractedItems?.length) {
      if (extractedCurrency) {
        setCurrency(extractedCurrency);
      }
      loadQuote(
        extractedCustomerName ?? '',
        extractedCustomerAddress ?? '',
        extractedVatRate ?? 0.19,
        extractedItems
      );
    } else {
      reset();
    }
    return () => { reset(); };
  }, [id, setQuoteId, reset, loadQuote, extractedItems, extractedCustomerName, extractedVatRate]);

  useEffect(() => {
    if (quoteQuery.data) {
      if ((quoteQuery.data as any).currency) {
        setCurrency((quoteQuery.data as any).currency);
      }
      loadQuote(
        quoteQuery.data.clientName,
        quoteQuery.data.customerAddress,
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
    mutationFn: (payload: { clientName?: string; customerAddress?: string; currency?: string; vatRate: number; items: QuoteItemInput[] }) =>
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
    mutationFn: (payload: { clientName?: string; customerAddress?: string; currency?: string; vatRate: number; items: QuoteItemInput[] }) =>
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
      customerAddress: customerAddress.trim() || undefined,
      currency,
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

      {/* Client, VAT & Address */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        {/* Desktop: client + VAT on first row, address full-width on second row.
            Mobile: client, then address, then VAT. */}
        <div className="flex flex-col gap-4 sm:grid sm:grid-cols-2 sm:gap-6">
          {/* Client name */}
          <div className="order-1">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              {t('clientName')}
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder={t('clientPlaceholder')}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* VAT rate */}
          <div className="order-3 sm:order-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              {t('vatRate')}
            </label>
            <input
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={vatRate}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (Number.isFinite(v)) {
                  setVatRate(Math.min(1, Math.max(0, v)));
                } else {
                  setVatRate(0);
                }
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-slate-900 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
            />
            <p className="mt-1 text-xs text-slate-500">{t('vatRateHint')}</p>
          </div>

          {/* Customer address */}
          <div className="order-2 sm:order-3 sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              {t('customerAddress')}
            </label>
            <input
              type="text"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>
      </section>

      {/* Transcription preview (from voice input) */}
      {!isEdit && transcription && (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
            {t('transcription')}
          </h2>
          {(() => {
            const lines = transcription.split(/\r?\n/);
            const MAX_LINES = 2;
            const preview =
              lines.length <= MAX_LINES ? transcription : lines.slice(0, MAX_LINES).join('\n');
            const hasMore = lines.length > MAX_LINES;
            return (
              <>
                <p className="whitespace-pre-wrap text-sm text-slate-700">
                  {showFullTranscription ? transcription : preview}
                  {!showFullTranscription && hasMore && ' …'}
                </p>
                {hasMore && (
                  <button
                    type="button"
                    onClick={() => setShowFullTranscription((v) => !v)}
                    className="mt-2 text-xs font-medium text-emerald-700 hover:text-emerald-800"
                  >
                    {showFullTranscription ? 'Show less' : 'Show more'}
                  </button>
                )}
              </>
            );
          })()}
        </section>
      )}

      {/* Line items — Desktop: table, Mobile: cards */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        {/* Desktop table */}
        <div className="hidden sm:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="px-4 py-3.5 text-xs font-semibold leading-tight text-slate-700 whitespace-normal break-words">
                  {t('item')}
                </th>
                <th className="w-28 px-4 py-3.5 text-xs font-semibold leading-tight text-slate-700 whitespace-normal break-words">
                  {t('unit')}
                </th>
                <th className="w-24 px-4 py-3.5 text-xs font-semibold leading-tight text-slate-700 whitespace-normal break-words">
                  {t('qty')}
                </th>
                <th className="w-32 px-4 py-3.5 text-xs font-semibold leading-tight text-slate-700 whitespace-normal break-words">
                  {`${t('unitPrice')} (${getCurrencySymbol(currency)})`}
                </th>
                <th className="w-32 px-4 py-3.5 text-xs font-semibold leading-tight text-slate-700 whitespace-normal break-words">
                  {`${t('total')} (${getCurrencySymbol(currency)})`}
                </th>
                <th className="w-14 px-4 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => {
                const unit = getUnitFromItemName(item.itemName);
                const baseName = getBaseNameFromItemName(item.itemName);
                return (
                <tr key={item.id} className="transition hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={baseName}
                      onChange={(e) => updateItem(item.id, { itemName: makeItemName(e.target.value, unit) })}
                      placeholder={t('description')}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={unit}
                      onChange={(e) => updateItem(item.id, { itemName: makeItemName(baseName, e.target.value) })}
                      placeholder={t('unit')}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={Number.isFinite(item.quantity) ? String(item.quantity) : ''}
                      onChange={(e) => {
                        const raw = e.target.value.replace(',', '.');
                        const normalized = raw.startsWith('.') ? `0${raw}` : raw;
                        const v = Number(normalized);
                        updateItem(item.id, {
                          quantity: Number.isFinite(v) && v >= 0 ? v : 0,
                        });
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={Number.isFinite(item.unitPrice) ? String(item.unitPrice) : ''}
                      onChange={(e) => {
                        const raw = e.target.value.replace(',', '.');
                        const normalized = raw.startsWith('.') ? `0${raw}` : raw;
                        const v = Number(normalized);
                        updateItem(item.id, {
                          unitPrice: Number.isFinite(v) && v >= 0 ? v : 0,
                        });
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex h-[40px] items-center justify-end rounded-lg bg-slate-50 px-3 text-xs font-semibold sm:text-sm tabular-nums text-slate-700 whitespace-nowrap overflow-hidden text-ellipsis">
                      {formatMoney(item.quantity * item.unitPrice, currency)}
                    </div>
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
              )})}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="divide-y divide-slate-100 sm:hidden">
          {items.map((item, idx) => {
            const unit = getUnitFromItemName(item.itemName);
            const baseName = getBaseNameFromItemName(item.itemName);
            return (
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
                  value={baseName}
                  onChange={(e) =>
                    updateItem(item.id, { itemName: makeItemName(e.target.value, unit) })
                  }
                  placeholder={t('description')}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="mb-1 block text-[10px] font-medium text-slate-500 whitespace-nowrap">
                      {t('qty')}
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={Number.isFinite(item.quantity) ? String(item.quantity) : ''}
                      onChange={(e) => {
                        const raw = e.target.value.replace(',', '.');
                        const normalized = raw.startsWith('.') ? `0${raw}` : raw;
                        const v = Number(normalized);
                        updateItem(item.id, {
                          quantity: Number.isFinite(v) && v >= 0 ? v : 0,
                        });
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-medium text-slate-500 whitespace-nowrap">
                      {t('unit')}
                    </label>
                    <input
                      type="text"
                      value={unit}
                      onChange={(e) =>
                        updateItem(item.id, { itemName: makeItemName(baseName, e.target.value) })
                      }
                      placeholder={t('unit')}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-medium text-slate-500 whitespace-nowrap">
                      {`${t('unitPrice')} (${getCurrencySymbol(currency)})`}
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={Number.isFinite(item.unitPrice) ? String(item.unitPrice) : ''}
                      onChange={(e) => {
                        const raw = e.target.value.replace(',', '.');
                        const normalized = raw.startsWith('.') ? `0${raw}` : raw;
                        const v = Number(normalized);
                        updateItem(item.id, {
                          unitPrice: Number.isFinite(v) && v >= 0 ? v : 0,
                        });
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-medium text-slate-500 whitespace-nowrap">
                      {`${t('total')} (${getCurrencySymbol(currency)})`}
                    </label>
                    <div className="flex h-[40px] items-center rounded-lg bg-slate-50 px-3 text-xs font-semibold sm:text-sm tabular-nums text-slate-700 overflow-hidden text-ellipsis whitespace-nowrap">
                      {formatMoney(item.quantity * item.unitPrice, currency)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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

      {/* Attachments */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              {t('attachments')}
            </h2>
            <p className="text-xs text-slate-500">{t('attachmentsHint')}</p>
          </div>
          {isEdit && id ? (
            <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100">
              {uploadAttachmentMutation.isPending ? t('saving') : t('addAttachment')}
              <input
                type="file"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  uploadAttachmentMutation.mutate(file);
                  e.target.value = '';
                }}
              />
            </label>
          ) : (
            <p className="text-xs text-slate-400 sm:text-right">{t('attachmentsSaveFirst')}</p>
          )}
        </div>

        {attachments.length > 0 && (
          <ul className="mt-3 space-y-2">
            {attachments.map((att) => (
              <li
                key={att.id}
                className="grid grid-cols-[minmax(0,1fr)_140px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm text-slate-700"
              >
                <button
                  type="button"
                  onClick={() => window.open(getAttachmentUrl(att), '_blank', 'noopener,noreferrer')}
                  className="truncate text-left text-emerald-700 hover:underline"
                >
                  {att.filename}
                </button>
                <div className="flex items-center justify-end gap-2 shrink-0 whitespace-nowrap">
                  {(isImageAttachment(att) || isPdfAttachment(att)) && (
                    <button
                      type="button"
                      onClick={() => setPreviewAttachment(att)}
                      className="rounded-lg border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
                    >
                      {t('preview') ?? 'Preview'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      if (!id) return;
                      try {
                        await deleteQuoteAttachment(id, att.id);
                        queryClient.invalidateQueries({ queryKey: ['quoteAttachments', id] });
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : 'Failed to delete attachment');
                      }
                    }}
                    className="rounded-lg border border-red-100 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50"
                  >
                    {t('delete') ?? 'Delete'}
                  </button>
                  <span className="text-[11px] text-slate-500">
                    {(att.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {previewAttachment && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="min-w-0 pr-3">
                <p className="truncate text-sm font-medium text-slate-900">
                  {previewAttachment.filename}
                </p>
                <p className="text-xs text-slate-500">
                  {(previewAttachment.size / 1024).toFixed(1)} KB · {previewAttachment.mimeType}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewAttachment(null)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                {t('close') ?? 'Close'}
              </button>
            </div>
            <div className="max-h-[80vh] overflow-auto bg-slate-50">
              {isImageAttachment(previewAttachment) ? (
                <div className="flex items-center justify-center p-4">
                  <img
                    src={getAttachmentUrl(previewAttachment)}
                    alt={previewAttachment.filename}
                    className="max-h-[70vh] max-w-full rounded-lg border border-slate-200 object-contain"
                  />
                </div>
              ) : isPdfAttachment(previewAttachment) ? (
                <iframe
                  src={getAttachmentUrl(previewAttachment)}
                  title={previewAttachment.filename}
                  className="h-[70vh] w-full border-0 bg-white"
                />
              ) : (
                <div className="p-4 text-sm text-slate-600">
                  {t('previewNotAvailable') ?? 'Preview is not available for this file type.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-full rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:w-auto sm:min-w-[280px] sm:p-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>{t('subtotal')}</span>
              <span className="tabular-nums font-medium">{formatMoney(subtotal, currency)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>{t('vat')} ({(vatRate * 100).toFixed(0)}%)</span>
              <span className="tabular-nums font-medium">{formatMoney(vat, currency)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-900">
              <span>{t('total')}</span>
              <span className="tabular-nums">{formatMoney(total, currency)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
