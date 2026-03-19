import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Plus, Trash2, Loader2, ArrowLeft, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createQuote,
  updateQuote,
  getQuote,
  getProfile,
  listQuoteAttachments,
  uploadQuoteAttachment,
  deleteQuoteAttachment,
  getAttachmentDisplayUrl,
  getQuoteSendLinks,
  sendQuote,
  downloadQuotePdf,
  type QuoteItemInput,
  type QuoteAttachment,
} from '../api/client';
import { useQuoteFormStore, useQuoteTotals, type QuoteFormItem } from '../stores/quoteFormStore';
import { useTranslation } from '../i18n/useTranslation';
// ExportPdfModal no longer used; export happens inline with stored fields

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

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function plus30Days(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

function normalizeDateToInput(value: string | null | undefined): string {
  if (!value) return '';
  // HTML date inputs expect `YYYY-MM-DD`.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  // Backend usually sends ISO timestamps: `YYYY-MM-DDTHH:mm:ssZ`.
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return value.slice(0, 10);
  // Treat other formats (e.g. `mm/dd/yyyy`) as invalid -> clear.
  return '';
}

function randomQuoteNo(): number {
  return Math.floor(Math.random() * 99) + 1;
}

function markQuoteSentLocally(quoteId: string) {
  if (typeof window === 'undefined') return;
  try {
    const key = 'sentQuotes';
    const raw = window.localStorage.getItem(key);
    const map: Record<string, { at: string }> = raw ? JSON.parse(raw) : {};
    map[quoteId] = { at: new Date().toISOString() };
    window.localStorage.setItem(key, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

export function QuoteEditorPage() {
  const { t, lang } = useTranslation();
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
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);
  const [quantityInputs, setQuantityInputs] = useState<Record<string, string>>({});
  const [unitPriceInputs, setUnitPriceInputs] = useState<Record<string, string>>({});

  // Inline send controls
  const [sendEmailTo, setSendEmailTo] = useState('');
  const [sendWhatsappTo, setSendWhatsappTo] = useState('');
  const [sendQuoteNumber, setSendQuoteNumber] = useState(randomQuoteNo);
  const [sendQuoteDate] = useState(todayISO);
  const [sendValidUntil, setSendValidUntil] = useState(plus30Days);
  const [freeText, setFreeText] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [openingWhatsapp, setOpeningWhatsapp] = useState(false);

  const {
    clientName,
    customerStreet,
    customerCity,
    vatRate,
    items,
    setQuoteId,
    setClientName,
    setCustomerStreet,
    setCustomerCity,
    setVatRate,
    addItem,
    updateItem,
    removeItem,
    loadQuote,
    reset,
  } = useQuoteFormStore() as any;
  const customerAddressCombined = [customerStreet, customerCity].map((s) => s.trim()).filter(Boolean).join(', ');
  const { subtotal, vat, total } = useQuoteTotals();

  const itemIds = items.map((it: QuoteFormItem) => it.id).join(',');
  useEffect(() => {
    const qtyNext: Record<string, string> = {};
    const priceNext: Record<string, string> = {};
    for (const it of items) {
      qtyNext[it.id] = Number.isFinite(it.quantity) ? String(it.quantity) : '';
      priceNext[it.id] = Number.isFinite(it.unitPrice) ? String(it.unitPrice) : '';
    }
    setQuantityInputs(qtyNext);
    setUnitPriceInputs(priceNext);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemIds]);

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
        })),
      );
      setSendValidUntil(normalizeDateToInput((quoteQuery.data as any).validUntil));
      setFreeText(((quoteQuery.data as any).freeText as string | null) ?? '');
      // When editing an existing quote, keep the saved quote number rather than a new random one.
      if (typeof quoteQuery.data.quoteNumber === 'number') {
        setSendQuoteNumber(quoteQuery.data.quoteNumber);
      }
    }
  }, [quoteQuery.data, loadQuote]);

  const createMutation = useMutation({
    mutationFn: (payload: { clientName?: string; customerAddress?: string; currency?: string; vatRate: number; items: QuoteItemInput[] }) =>
      createQuote(payload),
    onSuccess: async (created) => {
      try {
        if (pendingAttachments.length) {
          await Promise.all(
            pendingAttachments.map((file) => uploadQuoteAttachment(created.id, file))
          );
          setPendingAttachments([]);
          queryClient.invalidateQueries({ queryKey: ['quoteAttachments', created.id] });
        }
        queryClient.invalidateQueries({ queryKey: ['quotes'] });
        toast.success(t('quoteSaved'));
        reset();
        navigate('/quotes');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to upload attachments');
      }
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
          const normalizedValidUntil = normalizeDateToInput(sendValidUntil);
          const payload = {
            clientName: clientName.trim() || undefined,
            customerAddress: customerAddressCombined || undefined,
            freeText: freeText.trim() === '' ? null : freeText.trim(),
            currency,
            vatRate,
            quoteNumber: sendQuoteNumber,
            // quoteDate is no longer editable in UI; keep existing value on backend
            validUntil: normalizedValidUntil === '' ? null : normalizedValidUntil,
            items: items.map((i: QuoteFormItem) => ({
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
              {!isEdit ? t('addClientItems') : null}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate('/quotes')}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:flex-none"
          >
            {t('cancel')}
          </button>
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
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
            {isEdit && id && (
              <button
                type="button"
                onClick={async () => {
                  if (!sendQuoteDate || !sendQuoteNumber) {
                    toast.error(t('pdfFailed'));
                    return;
                  }
                  try {
                    // First persist latest form data to the database
                    const payload = {
                      clientName: clientName.trim() || undefined,
                      customerAddress: customerAddressCombined || undefined,
                      freeText: freeText.trim() === '' ? null : freeText.trim(),
                      currency,
                      vatRate,
                      quoteNumber: sendQuoteNumber,
                      quoteDate: sendQuoteDate,
                      validUntil: sendValidUntil === '' ? null : sendValidUntil,
                      items: items.map((i: QuoteFormItem) => ({
                        itemName: i.itemName.trim() || 'Item',
                        quantity: i.quantity,
                        unitPrice: i.unitPrice,
                      })),
                    };
                    await updateQuote(id, payload);

                    const num = Math.max(1, Math.floor(Number(sendQuoteNumber)) || 1);
                    await downloadQuotePdf(id, sendQuoteDate, sendValidUntil || '', lang as string, num);
                    toast.success(t('pdfGenerated'));
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : t('pdfFailed'));
                  }
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 sm:flex-none"
              >
                <Download className="size-4" />
                {t('exportPdf')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Client, VAT & Address */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 w-full sm:w-64">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            {t('quoteNo')}
          </label>
          <input
            type="number"
            min={1}
            value={sendQuoteNumber}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === '') {
                setSendQuoteNumber(1);
                return;
              }
              const n = Math.floor(Number(raw));
              setSendQuoteNumber(Number.isNaN(n) ? 1 : Math.max(1, n));
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
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
            <div className="relative">
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={Number.isFinite(vatRate) ? vatRate * 100 : 0}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isFinite(v)) {
                    // Store vatRate as decimal (0.19); UI shows percent (19).
                    setVatRate(Math.min(1, Math.max(0, v / 100)));
                  } else {
                    setVatRate(0);
                  }
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 pr-10 text-slate-900 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                %
              </span>
            </div>
          </div>

          {/* Customer address: street and city */}
          <div className="order-2 sm:order-3">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              {t('customerStreet')}
            </label>
            <input
              type="text"
              value={customerStreet}
              onChange={(e) => setCustomerStreet(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <div className="order-3 sm:order-4">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              {t('customerCity')}
            </label>
            <input
              type="text"
              value={customerCity}
              onChange={(e) => setCustomerCity(e.target.value)}
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
              {items.map((item: QuoteFormItem) => {
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
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={unit}
                      onChange={(e) => updateItem(item.id, { itemName: makeItemName(baseName, e.target.value) })}
                      placeholder={t('unit')}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={
                        quantityInputs[item.id] ??
                        (Number.isFinite(item.quantity) ? String(item.quantity) : '')
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        setQuantityInputs((prev) => ({ ...prev, [item.id]: value }));
                      }}
                      onBlur={(e) => {
                        const raw = e.target.value.replace(',', '.');
                        const normalized = raw === '' ? '' : raw.startsWith('.') ? `0${raw}` : raw;
                        const v = Number(normalized);
                        const numeric = Number.isFinite(v) && v >= 0 ? v : 0;
                        updateItem(item.id, { quantity: numeric });
                        setQuantityInputs((prev) => ({
                          ...prev,
                          [item.id]: numeric === 0 ? '' : String(numeric),
                        }));
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={
                        unitPriceInputs[item.id] ??
                        (Number.isFinite(item.unitPrice) ? String(item.unitPrice) : '')
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        setUnitPriceInputs((prev) => ({ ...prev, [item.id]: value }));
                      }}
                      onBlur={(e) => {
                        const raw = e.target.value.replace(',', '.');
                        const normalized = raw === '' ? '' : raw.startsWith('.') ? `0${raw}` : raw;
                        const v = Number(normalized);
                        const numeric = Number.isFinite(v) && v >= 0 ? v : 0;
                        updateItem(item.id, { unitPrice: numeric });
                        setUnitPriceInputs((prev) => ({
                          ...prev,
                          [item.id]: numeric === 0 ? '' : String(numeric),
                        }));
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
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
          {items.map((item: QuoteFormItem, idx: number) => {
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
                      value={
                        quantityInputs[item.id] ??
                        (Number.isFinite(item.quantity) ? String(item.quantity) : '')
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        setQuantityInputs((prev) => ({ ...prev, [item.id]: value }));
                      }}
                      onBlur={(e) => {
                        const raw = e.target.value.replace(',', '.');
                        const normalized = raw === '' ? '' : raw.startsWith('.') ? `0${raw}` : raw;
                        const v = Number(normalized);
                        const numeric = Number.isFinite(v) && v >= 0 ? v : 0;
                        updateItem(item.id, { quantity: numeric });
                        setQuantityInputs((prev) => ({
                          ...prev,
                          [item.id]: numeric === 0 ? '' : String(numeric),
                        }));
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
                      value={
                        unitPriceInputs[item.id] ??
                        (Number.isFinite(item.unitPrice) ? String(item.unitPrice) : '')
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        setUnitPriceInputs((prev) => ({ ...prev, [item.id]: value }));
                      }}
                      onBlur={(e) => {
                        const raw = e.target.value.replace(',', '.');
                        const normalized = raw === '' ? '' : raw.startsWith('.') ? `0${raw}` : raw;
                        const v = Number(normalized);
                        const numeric = Number.isFinite(v) && v >= 0 ? v : 0;
                        updateItem(item.id, { unitPrice: numeric });
                        setUnitPriceInputs((prev) => ({
                          ...prev,
                          [item.id]: numeric === 0 ? '' : String(numeric),
                        }));
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
                    src={getAttachmentDisplayUrl(previewAttachment)}
                    alt={previewAttachment.filename}
                    className="max-h-[70vh] max-w-full rounded-lg border border-slate-200 object-contain"
                  />
                </div>
              ) : isPdfAttachment(previewAttachment) ? (
                <iframe
                  src={getAttachmentDisplayUrl(previewAttachment)}
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

      {/* Summary (totals) */}
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

      {/* Valid until (between summary and attachments) */}
      <section className="mt-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-medium text-slate-700">
              {t('validUntil')}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={sendValidUntil}
                onChange={(e) => setSendValidUntil(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                type="button"
                onClick={() => setSendValidUntil('')}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-500 shadow-sm transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Clear date"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Free text under valid-until (printed under totals in PDF) */}
      <section className="mt-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          {t('quoteFreeText') ?? 'Additional text for PDF'}
        </label>
        <textarea
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
          placeholder={t('quoteFreeTextPlaceholder') ?? ''}
        />
      </section>

      {/* Attachments */}
      <section className="mt-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              {t('attachments')}
            </h2>
            <p className="text-xs text-slate-500">{t('attachmentsHint')}</p>
          </div>
          <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100">
            {uploadAttachmentMutation.isPending ? t('saving') : t('addAttachment')}
            <input
              type="file"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (id) {
                  uploadAttachmentMutation.mutate(file);
                } else {
                  setPendingAttachments((prev) => [...prev, file]);
                  toast.success(t('attachmentQueued') ?? 'Attachment will be uploaded when you save the quote.');
                }
                e.target.value = '';
              }}
            />
          </label>
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
                  onClick={() => window.open(getAttachmentDisplayUrl(att), '_blank', 'noopener,noreferrer')}
                  className="truncate text-left text-emerald-700 hover:underline"
                >
                  {att.filename}
                </button>
                <div className="flex items-center justify-start gap-2 shrink-0 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => {
                      if (isImageAttachment(att) || isPdfAttachment(att)) {
                        setPreviewAttachment(att);
                      }
                    }}
                    className={`rounded-lg border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100 ${
                      isImageAttachment(att) || isPdfAttachment(att)
                        ? ''
                        : 'invisible pointer-events-none'
                    }`}
                  >
                    {t('preview') ?? 'Preview'}
                  </button>
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
                </div>
              </li>
            ))}
          </ul>
        )}

        {!id && pendingAttachments.length > 0 && (
          <ul className="mt-3 space-y-2">
            {pendingAttachments.map((file, idx) => (
              <li
                key={`${file.name}-${file.size}-${file.lastModified}-${idx}`}
                className="grid grid-cols-[minmax(0,1fr)_140px] items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm text-slate-700"
              >
                <span className="truncate text-left text-slate-700">
                  {file.name}
                  <span className="ml-1 text-[10px] text-slate-400">
                    ({t('pending') ?? 'pending'})
                  </span>
                </span>
                <div className="flex items-center justify-start gap-2 shrink-0 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() =>
                      window.open(URL.createObjectURL(file), '_blank', 'noopener,noreferrer')
                    }
                    className="rounded-lg border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
                  >
                    {t('preview') ?? 'Preview'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPendingAttachments((prev) =>
                        prev.filter((_, i) => i !== idx)
                      )
                    }
                    className="rounded-lg border border-red-100 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50"
                  >
                    {t('delete') ?? 'Delete'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Send section (after attachments) */}
      <section className="mt-6 w-full rounded-2xl border border-emerald-300 bg-emerald-50/90 p-5 shadow-md sm:p-6 lg:max-w-xl transition-transform transition-shadow duration-300 ease-out hover:-translate-y-1 hover:shadow-xl focus-within:-translate-y-1 focus-within:shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-emerald-900 tracking-wide">
                {t('sendQuoteTitle')}
              </h3>
              <p className="mt-1 text-xs text-emerald-700">
                <img
                  src="/images/ew.png"
                  alt=""
                  className="h-10 sm:h-10 object-contain"
                />
              </p>
            </div>
            <span className="inline-flex items-center justify-center px-2 py-1">
              <img
                src="/images/send.png"
                alt=""
                className="h-25 w-auto object-contain"
              />
            </span>
          </div>

          <div className="mt-4 border-t border-emerald-200/70 pt-4 space-y-4">
            {/* Email row: address + button (always side-by-side, also on mobile) */}
            <div className="grid items-end gap-2 grid-cols-[minmax(0,1.3fr)_auto]">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">
                  {t('emailAddress')}
                </label>
                <input
                  type="email"
                  value={sendEmailTo}
                  onChange={(e) => setSendEmailTo(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={sendingEmail || !sendEmailTo.trim()}
                  onClick={async () => {
                    if (!sendQuoteDate) return;
                    const num = Math.max(1, Math.floor(Number(sendQuoteNumber)) || 1);
                  const normalizedValidUntil = normalizeDateToInput(sendValidUntil);
                    setSendingEmail(true);
                    try {
                      let quoteIdToUse = id;
                      if (!quoteIdToUse) {
                        // Save quote first
                        const payload = {
                          clientName: clientName.trim() || undefined,
                          customerAddress: customerAddressCombined || undefined,
                          freeText: freeText.trim() === '' ? null : freeText.trim(),
                          currency,
                          vatRate,
                        quoteNumber: num,
                          quoteDate: sendQuoteDate,
                        validUntil: normalizedValidUntil === '' ? null : normalizedValidUntil,
                          items: items.map((i: QuoteFormItem) => ({
                            itemName: i.itemName.trim() || 'Item',
                            quantity: i.quantity,
                            unitPrice: i.unitPrice,
                          })),
                        };
                        const created = await createQuote(payload);
                        quoteIdToUse = created.id;
                        setQuoteId(created.id);
                        // Upload any pending attachments
                        if (pendingAttachments.length) {
                          await Promise.all(
                            pendingAttachments.map((file) => uploadQuoteAttachment(created.id, file)),
                          );
                          setPendingAttachments([]);
                          queryClient.invalidateQueries({ queryKey: ['quoteAttachments', created.id] });
                        }
                    } else {
                      // Persist latest edits before generating/sending PDF
                      const payload = {
                        clientName: clientName.trim() || undefined,
                        customerAddress: customerAddressCombined || undefined,
                        freeText: freeText.trim() === '' ? null : freeText.trim(),
                        currency,
                        vatRate,
                        quoteNumber: num,
                        validUntil: normalizedValidUntil === '' ? null : normalizedValidUntil,
                        items: items.map((i: QuoteFormItem) => ({
                          itemName: i.itemName.trim() || 'Item',
                          quantity: i.quantity,
                          unitPrice: i.unitPrice,
                        })),
                      };
                      await updateQuote(quoteIdToUse, payload);
                      }
                      if (!quoteIdToUse) return;
                    await sendQuote(
                      quoteIdToUse,
                      'email',
                      sendEmailTo.trim(),
                      sendQuoteDate,
                      normalizedValidUntil,
                      num,
                      (lang as string) || 'de',
                    );
                      markQuoteSentLocally(quoteIdToUse);
                      toast.success(t('quoteSent'));
                      navigate('/quotes');
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : t('quoteSendFailed'));
                    } finally {
                      setSendingEmail(false);
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-xs font-medium text-emerald-800 shadow-md transition hover:bg-emerald-50 disabled:opacity-60 w-40 sm:w-40"
                >
                  {sendingEmail ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <img src="/images/email.png" alt="" className="size-4 shrink-0 object-contain" />
                  )}
                  <span>{t('sendByEmail')}</span>
                </button>
              </div>
            </div>

            {/* WhatsApp row: number + button (always side-by-side, also on mobile) */}
            <div className="grid items-end gap-2 grid-cols-[minmax(0,1.3fr)_auto]">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">
                  {t('whatsappNumber')}
                </label>
                <input
                  type="tel"
                  value={sendWhatsappTo}
                  onChange={(e) => setSendWhatsappTo(e.target.value)}
                  placeholder="+491701234567"
                  className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={openingWhatsapp || !sendWhatsappTo.trim()}
                  onClick={async () => {
                  if (!sendQuoteDate) return;
                  const num = Math.max(1, Math.floor(Number(sendQuoteNumber)) || 1);
                  const normalizedValidUntil = normalizeDateToInput(sendValidUntil);
                  setOpeningWhatsapp(true);
                  try {
                    let quoteIdToUse = id;
                    if (!quoteIdToUse) {
                      const payload = {
                        clientName: clientName.trim() || undefined,
                        customerAddress: customerAddressCombined || undefined,
                      freeText: freeText.trim() === '' ? null : freeText.trim(),
                        currency,
                        vatRate,
                        quoteNumber: num,
                        quoteDate: sendQuoteDate,
                        validUntil: normalizedValidUntil === '' ? null : normalizedValidUntil,
                        items: items.map((i: QuoteFormItem) => ({
                          itemName: i.itemName.trim() || 'Item',
                          quantity: i.quantity,
                          unitPrice: i.unitPrice,
                        })),
                      };
                      const created = await createQuote(payload);
                      quoteIdToUse = created.id;
                      setQuoteId(created.id);
                      if (pendingAttachments.length) {
                        await Promise.all(
                          pendingAttachments.map((file) => uploadQuoteAttachment(created.id, file)),
                        );
                        setPendingAttachments([]);
                        queryClient.invalidateQueries({ queryKey: ['quoteAttachments', created.id] });
                      }
                    } else {
                      // Persist latest edits before generating/sending PDF
                      const payload = {
                        clientName: clientName.trim() || undefined,
                        customerAddress: customerAddressCombined || undefined,
                      freeText: freeText.trim() === '' ? null : freeText.trim(),
                        currency,
                        vatRate,
                        quoteNumber: num,
                        validUntil: normalizedValidUntil === '' ? null : normalizedValidUntil,
                        items: items.map((i: QuoteFormItem) => ({
                          itemName: i.itemName.trim() || 'Item',
                          quantity: i.quantity,
                          unitPrice: i.unitPrice,
                        })),
                      };
                      await updateQuote(quoteIdToUse, payload);
                    }
                    if (!quoteIdToUse) return;
                      const { pdfUrl, attachmentUrls } = await getQuoteSendLinks(
                        quoteIdToUse,
                        sendQuoteDate,
                        normalizedValidUntil,
                        num,
                        (lang as string) || 'de',
                      );
                    const profile = await getProfile();
                    const companyLabel = (profile.companyName ?? 'Firma').trim();
                    const clientLabel = (clientName ?? '').trim();
                    const quoteNrLabelByLang: Record<string, string> = {
                      de: 'Angebot-Nr.:',
                      en: 'Quote No.',
                      it: 'Preventivo n.',
                      fr: 'Devis n°',
                      es: 'Presupuesto n.°',
                    };
                    const quoteNrLabel = quoteNrLabelByLang[lang] ?? quoteNrLabelByLang.de;
                    const intro = `${companyLabel} - ${quoteNrLabel} ${num} ${clientLabel}`.trim();
                    const pdfLabel = t('sendEmailPdfLabel') as string;
                    const attachmentsLabel = t('sendEmailAttachmentsLabel') as string;
                    const lines: string[] = [intro, '', pdfLabel, pdfUrl];
                    if (attachmentUrls.length > 0) {
                      lines.push('', attachmentsLabel);
                      attachmentUrls.forEach((a) => lines.push(`${a.filename}: ${a.url}`));
                    }
                    const body = lines.join('\n');
                    const phone = sendWhatsappTo.trim().replace(/\D/g, '');
                    if (!phone) {
                      toast.error(t('quoteSendFailed'));
                    } else {
                      const url = `https://wa.me/${phone}?text=${encodeURIComponent(body)}`;
                      window.open(url, '_blank', 'noopener,noreferrer');
                      markQuoteSentLocally(quoteIdToUse);
                      toast.success(t('sendWhatsAppComposeOpened'));
                      navigate('/quotes');
                    }
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : t('quoteSendFailed'));
                  } finally {
                    setOpeningWhatsapp(false);
                  }
                }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-xs font-medium text-emerald-800 shadow-md transition hover:bg-emerald-50 disabled:opacity-60 w-40 sm:w-40"
                >
                  {openingWhatsapp ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <img src="/images/whatsapp.jpg" alt="" className="size-4 shrink-0 object-contain" />
                  )}
                  <span>{t('sendByWhatsapp')}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

    </div>
  );
}
