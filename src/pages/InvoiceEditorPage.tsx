import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, Download, Loader2, Plus, Trash2 } from 'lucide-react';
import {
  createInvoice,
  deleteInvoiceAttachment,
  downloadInvoicePdf,
  getInvoice,
  getInvoiceSendLinks,
  getNextInvoiceNumber,
  getProfile,
  getQuote,
  listInvoiceAttachments,
  sendInvoice,
  updateInvoice,
  uploadInvoiceAttachment,
  type InvoiceAttachment,
  type QuoteItemInput,
} from '../api/client';
import { splitCustomerAddress } from '../stores/quoteFormStore';
import { useTranslation } from '../i18n/useTranslation';

type InvoiceItemForm = {
  itemName: string;
  quantity: number;
  unitPrice: number;
};

const defaultItem: InvoiceItemForm = { itemName: '', quantity: 1, unitPrice: 0 };

function toInputDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

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
  if (c === 'EUR') return '€';
  if (c === 'USD') return '$';
  if (c === 'CHF') return 'CHF';
  if (c === 'GBP') return '£';
  return c;
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

function markInvoiceSentLocally(invoiceId: string) {
  if (typeof window === 'undefined') return;
  try {
    const key = 'sentInvoices';
    const raw = window.localStorage.getItem(key);
    const map: Record<string, { at: string }> = raw ? JSON.parse(raw) : {};
    map[invoiceId] = { at: new Date().toISOString() };
    window.localStorage.setItem(key, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

export function InvoiceEditorPage() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const locationState = location.state as {
    fromQuoteId?: string;
    extractedItems?: QuoteItemInput[];
    extractedCustomerName?: string;
    extractedCustomerAddress?: string;
    extractedVatRate?: number;
    extractedCurrency?: string;
    transcription?: string;
  } | null;
  const fromQuoteId = locationState?.fromQuoteId;
  const extractedItems = locationState?.extractedItems;
  const extractedCustomerName = locationState?.extractedCustomerName;
  const extractedCustomerAddress = locationState?.extractedCustomerAddress;
  const extractedVatRate = locationState?.extractedVatRate;
  const extractedCurrency = locationState?.extractedCurrency;
  const transcription = locationState?.transcription ?? '';
  const [showFullTranscription, setShowFullTranscription] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => getInvoice(id as string),
    enabled: isEdit,
  });
  const { data: sourceQuote } = useQuery({
    queryKey: ['quote', fromQuoteId],
    queryFn: () => getQuote(fromQuoteId as string),
    enabled: !isEdit && Boolean(fromQuoteId),
  });
  const attachmentsQuery = useQuery({
    queryKey: ['invoiceAttachments', id],
    queryFn: () => listInvoiceAttachments(id!),
    enabled: isEdit && !!id,
  });
  const attachments: InvoiceAttachment[] = attachmentsQuery.data ?? [];

  const [clientName, setClientName] = useState('');
  const [customerStreet, setCustomerStreet] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [vatRate, setVatRate] = useState(0.19);
  const [vatRateInput, setVatRateInput] = useState<string | null>(null);
  const customerAddressCombined = [customerStreet, customerCity].map((s) => s.trim()).filter(Boolean).join(', ');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<InvoiceItemForm[]>([defaultItem]);
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);
  const [sendEmailTo, setSendEmailTo] = useState('');
  const [sendWhatsappTo, setSendWhatsappTo] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [initialized, setInitialized] = useState(false);

  async function persistPendingAttachments(invoiceId: string) {
    if (!pendingAttachments.length) return;
    await Promise.all(pendingAttachments.map((file) => uploadInvoiceAttachment(invoiceId, file)));
    setPendingAttachments([]);
    queryClient.invalidateQueries({ queryKey: ['invoiceAttachments', invoiceId] });
  }

  useEffect(() => {
    // When route or navigation state changes, allow form re-initialization.
    setInitialized(false);
  }, [id, fromQuoteId, location.key]);

  useEffect(() => {
    if (!data || initialized) return;
    setClientName(data.clientName ?? '');
    const addr = splitCustomerAddress(data.customerAddress);
    setCustomerStreet(addr.street);
    setCustomerCity(addr.city);
    setAdditionalInfo(data.additionalInfo ?? '');
    setCurrency((data.currency ?? 'EUR').toUpperCase());
    setVatRate(data.vatRate ?? 0.19);
    setVatRateInput(null);
    setInvoiceNumber(data.invoiceNumber != null ? String(data.invoiceNumber) : '');
    setInvoiceDate(toInputDate(data.invoiceDate));
    setDeliveryDate(toInputDate(data.deliveryDate));
    setDueDate(toInputDate(data.dueDate));
    setItems(
      data.items.length
        ? data.items.map((i) => ({
            itemName: i.itemName,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          }))
        : [defaultItem]
    );
    setInitialized(true);
  }, [data, initialized]);

  useEffect(() => {
    if (isEdit || initialized || !sourceQuote) return;
    setClientName(sourceQuote.clientName ?? '');
    const qAddr = splitCustomerAddress(sourceQuote.customerAddress);
    setCustomerStreet(qAddr.street);
    setCustomerCity(qAddr.city);
    setAdditionalInfo('');
    setCurrency((sourceQuote.currency ?? 'EUR').toUpperCase());
    setVatRate(sourceQuote.vatRate ?? 0.19);
    setInvoiceDate(new Date().toISOString().slice(0, 10));
    setDeliveryDate(new Date().toISOString().slice(0, 10));
    setDueDate(new Date().toISOString().slice(0, 10));
    setItems(
      sourceQuote.items.length
        ? sourceQuote.items.map((i) => ({
            itemName: i.itemName,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          }))
        : [defaultItem]
    );
    setInitialized(true);
  }, [isEdit, initialized, sourceQuote]);

  useEffect(() => {
    if (isEdit || initialized) return;
    if (!extractedItems?.length || fromQuoteId) return;
    setClientName(extractedCustomerName ?? '');
    const addr = splitCustomerAddress(extractedCustomerAddress ?? '');
    setCustomerStreet(addr.street);
    setCustomerCity(addr.city);
    setAdditionalInfo('');
    setCurrency((extractedCurrency ?? 'EUR').toUpperCase());
    setVatRate(extractedVatRate ?? 0.19);
    setVatRateInput(null);
    const today = new Date().toISOString().slice(0, 10);
    setInvoiceDate(today);
    setDeliveryDate(today);
    setDueDate(today);
    setItems(
      extractedItems.map((i) => ({
        itemName: i.itemName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      }))
    );
    setInitialized(true);
  }, [
    isEdit,
    initialized,
    fromQuoteId,
    extractedItems,
    extractedCustomerName,
    extractedCustomerAddress,
    extractedVatRate,
    extractedCurrency,
  ]);

  useEffect(() => {
    if (isEdit) return;
    if (invoiceNumber.trim() !== '') return;
    getNextInvoiceNumber()
      .then((n) => setInvoiceNumber(String(n)))
      .catch(() => setInvoiceNumber('1'));
  }, [isEdit, invoiceNumber]);

  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0),
    [items]
  );
  const vat = subtotal * vatRate;
  const total = subtotal + vat;

  function buildInvoicePayload() {
    const cleanItems = items
      .map((it) => ({
        itemName: it.itemName.trim(),
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice),
      }))
      .filter((it) => it.itemName && it.quantity > 0);
    if (!cleanItems.length) throw new Error(t('addAtLeastOneItem'));
    return {
      quoteId: !isEdit && fromQuoteId ? fromQuoteId : null,
      clientName: clientName.trim() || null,
      customerAddress: customerAddressCombined.trim() || null,
      additionalInfo: additionalInfo.trim() || null,
      currency: currency.trim() || 'EUR',
      vatRate,
      invoiceNumber: invoiceNumber.trim() ? Number(invoiceNumber) : null,
      invoiceDate: invoiceDate || null,
      deliveryDate: deliveryDate || null,
      dueDate: dueDate || null,
      items: cleanItems,
    };
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = buildInvoicePayload();

      if (isEdit && id) return updateInvoice(id, payload);
      return createInvoice(payload);
    },
    onSuccess: (saved) => {
      persistPendingAttachments(saved.id).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.setQueryData(['invoice', saved.id], saved);
      toast.success(isEdit ? t('invoiceUpdated') : t('invoiceSaved'));
      navigate('/invoices');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isEdit && isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Loader2 className="size-10 animate-spin text-emerald-500" />
        <p className="text-sm font-medium text-slate-600">{t('loadingInvoice')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link to="/invoices" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft className="size-4" />
          {t('backToInvoices')}
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:flex-none"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-70 sm:flex-none"
          >
            {saveMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            {!isEdit ? t('createInvoice') : t('saveInvoice')}
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                const payload = buildInvoicePayload();
                const saved = isEdit && id ? await updateInvoice(id, payload) : await createInvoice(payload);
                await persistPendingAttachments(saved.id);
                const invoiceId = saved.id;
                const num = Math.max(1, Number(saved.invoiceNumber) || 1);
                await downloadInvoicePdf(
                  invoiceId,
                  saved.invoiceDate?.slice(0, 10) || invoiceDate || new Date().toISOString().slice(0, 10),
                  saved.dueDate?.slice(0, 10) || dueDate || '',
                  lang as string,
                  num,
                );
                queryClient.invalidateQueries({ queryKey: ['invoices'] });
                queryClient.setQueryData(['invoice', invoiceId], saved);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : t('pdfFailed'));
              }
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 sm:flex-none"
          >
            <Download className="size-4" />
            {t('exportPdf')}

          </button>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        {isEdit && <h1 className="mb-4 text-xl font-semibold text-slate-900">{t('editInvoice')}</h1>}
        <div className="mb-4 w-full sm:w-64">
          <label className="mb-2 block text-sm font-medium text-slate-700">{t('invoiceNo')}</label>
          <input
            type="text"
            inputMode="numeric"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value.replace(/[^\d]/g, ''))}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <div className="flex flex-col gap-4 sm:grid sm:grid-cols-2 sm:gap-6">
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">{t('clientName')}</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder={t('clientPlaceholder')}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">{t('customerCity')}</label>
            <input
              type="text"
              value={customerCity}
              onChange={(e) => setCustomerCity(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">{t('customerStreet')}</label>
            <input
              type="text"
              value={customerStreet}
              onChange={(e) => setCustomerStreet(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">{t('invoiceDate')}</span>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">{t('deliveryDate')}</span>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">{t('dueDate')}</span>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
            />
          </label>
        </div>
        <div className="mt-6">
          <label className="mb-2 block text-sm font-medium text-slate-700">{t('vatRate')}</label>
          <div className="inline-flex items-center gap-[2px]">
            <input
              type="text"
              inputMode="decimal"
              value={
                vatRateInput ?? (Number.isFinite(vatRate) ? String(Number((vatRate * 100).toFixed(2))) : '')
              }
              onChange={(e) => setVatRateInput(e.target.value)}
              onBlur={(e) => {
                const raw = e.target.value.replace(',', '.');
                const normalized = raw === '' ? '' : raw.startsWith('.') ? `0${raw}` : raw;
                const v = Number(normalized);
                const numeric = Number.isFinite(v) && v >= 0 ? v : 0;
                const clamped = Math.min(100, numeric);
                const rounded = Number(clamped.toFixed(2));
                setVatRate(rounded / 100);
                setVatRateInput(null);
              }}
              className="w-15 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
            />
            <span className="text-xs text-slate-500">%</span>
          </div>
        </div>
      </section>

      {!isEdit && transcription && (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-500">{t('transcription')}</h2>
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

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="hidden sm:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="px-4 py-3.5 text-xs font-semibold leading-tight text-slate-700">{t('item')}</th>
                <th className="w-28 px-4 py-3.5 text-xs font-semibold leading-tight text-slate-700">{t('unit')}</th>
                <th className="w-24 px-4 py-3.5 text-xs font-semibold leading-tight text-slate-700">{t('qty')}</th>
                <th className="w-32 px-4 py-3.5 text-xs font-semibold leading-tight text-slate-700">{`${t('unitPrice')} (${getCurrencySymbol(currency)})`}</th>
                <th className="w-32 px-4 py-3.5 text-xs font-semibold leading-tight text-slate-700">{`${t('total')} (${getCurrencySymbol(currency)})`}</th>
                <th className="w-14 px-4 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((it, idx) => {
                const unit = getUnitFromItemName(it.itemName);
                const baseName = getBaseNameFromItemName(it.itemName);
                return (
                  <tr key={idx} className="transition hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={baseName}
                        onChange={(e) =>
                          setItems((prev) => prev.map((row, i) => (i === idx ? { ...row, itemName: makeItemName(e.target.value, unit) } : row)))
                        }
                        placeholder={t('description')}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={unit}
                        onChange={(e) =>
                          setItems((prev) => prev.map((row, i) => (i === idx ? { ...row, itemName: makeItemName(baseName, e.target.value) } : row)))
                        }
                        placeholder={t('unit')}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={it.quantity}
                        onChange={(e) =>
                          setItems((prev) => prev.map((row, i) => (i === idx ? { ...row, quantity: Number(e.target.value) } : row)))
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={it.unitPrice}
                        onChange={(e) =>
                          setItems((prev) => prev.map((row, i) => (i === idx ? { ...row, unitPrice: Number(e.target.value) } : row)))
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold sm:text-sm tabular-nums text-slate-700 text-right whitespace-nowrap overflow-hidden text-ellipsis">
                        {formatMoney(it.quantity * it.unitPrice, currency)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev))}
                        className="flex size-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="divide-y divide-slate-100 sm:hidden">
          {items.map((it, idx) => {
            const unit = getUnitFromItemName(it.itemName);
            const baseName = getBaseNameFromItemName(it.itemName);
            return (
              <div key={idx} className="space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">#{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev))}
                    className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <input
                  type="text"
                  value={baseName}
                  onChange={(e) => setItems((prev) => prev.map((row, i) => (i === idx ? { ...row, itemName: makeItemName(e.target.value, unit) } : row)))}
                  placeholder={t('description')}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
                />
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="mb-1 block text-[10px] font-medium text-slate-500 whitespace-nowrap">{t('qty')}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={it.quantity}
                      onChange={(e) => setItems((prev) => prev.map((row, i) => (i === idx ? { ...row, quantity: Number(e.target.value) } : row)))}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-medium text-slate-500 whitespace-nowrap">{t('unit')}</label>
                    <input
                      type="text"
                      value={unit}
                      onChange={(e) => setItems((prev) => prev.map((row, i) => (i === idx ? { ...row, itemName: makeItemName(baseName, e.target.value) } : row)))}
                      placeholder={t('unit')}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-medium text-slate-500 whitespace-nowrap">{`${t('unitPrice')} (${getCurrencySymbol(currency)})`}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={it.unitPrice}
                      onChange={(e) => setItems((prev) => prev.map((row, i) => (i === idx ? { ...row, unitPrice: Number(e.target.value) } : row)))}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-medium text-slate-500 whitespace-nowrap">{`${t('total')} (${getCurrencySymbol(currency)})`}</label>
                    <div className="flex w-full items-center rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold sm:text-sm tabular-nums text-slate-700 overflow-hidden text-ellipsis whitespace-nowrap">
                      {formatMoney(it.quantity * it.unitPrice, currency)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => setItems((prev) => [...prev, { ...defaultItem }])}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 sm:w-auto sm:px-6"
          >
            <Plus className="size-4" />
            {t('addItem')}
          </button>
        </div>
      </section>

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

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">{t('quoteFreeText')}</span>
          <textarea
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
          />
        </label>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">{t('attachments')}</h2>
            <p className="text-xs text-slate-500">{t('attachmentsHint')}</p>
          </div>
          <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100">
            {t('addAttachment')}
            <input
              type="file"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (id) {
                  uploadInvoiceAttachment(id, file)
                    .then(() => queryClient.invalidateQueries({ queryKey: ['invoiceAttachments', id] }))
                    .catch((err) => toast.error(err instanceof Error ? err.message : 'Failed to upload attachment'));
                } else {
                  setPendingAttachments((prev) => [...prev, file]);
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
                  onClick={() => window.open(att.url, '_blank', 'noopener,noreferrer')}
                  className="truncate text-left text-emerald-700 hover:underline"
                >
                  {att.filename}
                </button>
                <div className="flex items-center justify-start gap-2 shrink-0 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => window.open(att.url, '_blank', 'noopener,noreferrer')}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
                  >
                    {t('preview')}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!id) return;
                      try {
                        await deleteInvoiceAttachment(id, att.id);
                        queryClient.invalidateQueries({ queryKey: ['invoiceAttachments', id] });
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : 'Failed to delete attachment');
                      }
                    }}
                    className="rounded-lg border border-red-100 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50"
                  >
                    {t('delete')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {pendingAttachments.length > 0 && (
          <ul className="mt-3 space-y-2">
            {pendingAttachments.map((file, idx) => (
              <li
                key={`${file.name}-${file.size}-${file.lastModified}-${idx}`}
                className="grid grid-cols-[minmax(0,1fr)_140px] items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm text-slate-700"
              >
                <span className="truncate text-left text-slate-700">
                  {file.name}
                  <span className="ml-1 text-[10px] text-slate-400">({t('pending') ?? 'pending'})</span>
                </span>
                <div className="flex items-center justify-start gap-2 shrink-0 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => window.open(URL.createObjectURL(file), '_blank', 'noopener,noreferrer')}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
                  >
                    {t('preview')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingAttachments((prev) => prev.filter((_, i) => i !== idx))}
                    className="rounded-lg border border-red-100 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50"
                  >
                    {t('delete')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 w-full rounded-2xl border border-emerald-300 bg-emerald-50/90 p-5 shadow-md sm:p-6 lg:max-w-xl transition-transform transition-shadow duration-300 ease-out hover:-translate-y-1 hover:shadow-xl focus-within:-translate-y-1 focus-within:shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-emerald-900 tracking-wide">{t('sendInvoiceTitle')}</h3>
            <p className="mt-1 text-xs text-emerald-700">
              <img src="/images/ew.png" alt="" className="h-10 sm:h-10 object-contain" />
            </p>
          </div>
          <span className="inline-flex items-center justify-center px-2 py-1">
            <img src="/images/send.png" alt="" className="h-25 w-auto object-contain" />
          </span>
        </div>
        <div className="mt-4 border-t border-emerald-200/70 pt-4 space-y-4">
          <div className="grid items-end gap-2 grid-cols-[minmax(0,1.8fr)_auto]">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">{t('emailAddress')}</label>
              <input
                type="email"
                value={sendEmailTo}
                onChange={(e) => setSendEmailTo(e.target.value)}
                className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
            <button
              type="button"
              onClick={async () => {
                if (!sendEmailTo.trim()) return;
                setSendingEmail(true);
                try {
                  const payload = buildInvoicePayload();
                  const saved = isEdit && id ? await updateInvoice(id, payload) : await createInvoice(payload);
                  await persistPendingAttachments(saved.id);
                  await sendInvoice(
                    saved.id,
                    'email',
                    sendEmailTo.trim(),
                    saved.invoiceDate?.slice(0, 10) || invoiceDate || new Date().toISOString().slice(0, 10),
                    saved.dueDate?.slice(0, 10) || dueDate || '',
                    Math.max(1, Number(saved.invoiceNumber) || 1),
                    lang as string,
                  );
                  markInvoiceSentLocally(saved.id);
                  toast.success(t('quoteSent'));
                  navigate('/invoices');
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : t('quoteSendFailed'));
                } finally {
                  setSendingEmail(false);
                }
              }}
              disabled={!sendEmailTo.trim() || sendingEmail}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-medium text-emerald-800 shadow-md transition hover:bg-emerald-50 disabled:opacity-60 w-28 sm:w-32"
            >
              {sendingEmail ? <Loader2 className="size-3 animate-spin" /> : t('sendByEmail')}
            </button>
          </div>
          <div className="grid items-end gap-2 grid-cols-[minmax(0,1.8fr)_auto]">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700 whitespace-nowrap">{t('whatsappNumber')}</label>
              <input
                type="tel"
                value={sendWhatsappTo}
                onChange={(e) => setSendWhatsappTo(e.target.value)}
                className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
            <button
              type="button"
              onClick={async () => {
                if (!sendWhatsappTo.trim()) return;
                try {
                  const payload = buildInvoicePayload();
                  const saved = isEdit && id ? await updateInvoice(id, payload) : await createInvoice(payload);
                  await persistPendingAttachments(saved.id);
                  const num = Math.max(1, Number(saved.invoiceNumber) || 1);
                  const invoiceDateToUse = saved.invoiceDate?.slice(0, 10) || invoiceDate || new Date().toISOString().slice(0, 10);
                  const dueDateToUse = saved.dueDate?.slice(0, 10) || dueDate || '';
                  const { pdfUrl, attachmentUrls } = await getInvoiceSendLinks(
                    saved.id,
                    invoiceDateToUse,
                    dueDateToUse,
                    num,
                    lang as string,
                  );
                  const profile = await getProfile();
                  const companyLabel = (profile.companyName ?? 'Firma').trim();
                  const clientLabel = (clientName ?? '').trim();
                  const invoiceNrLabelByLang: Record<string, string> = {
                    de: 'Rechnungs-Nr.:',
                    en: 'Invoice No.',
                    it: 'Fattura n.',
                    fr: 'Facture n°',
                    es: 'Factura n.°',
                  };
                  const invoiceNrLabel = invoiceNrLabelByLang[lang] ?? invoiceNrLabelByLang.de;
                  const intro = `${companyLabel} - ${invoiceNrLabel} ${num} ${clientLabel}`.trim();
                  const pdfLabel = t('sendEmailPdfLabel') as string;
                  const attachmentsLabel = t('sendEmailAttachmentsLabel') as string;
                  const lines: string[] = [intro, '', pdfLabel, pdfUrl];
                  if (attachmentUrls.length > 0) {
                    lines.push('', attachmentsLabel);
                    attachmentUrls.forEach((a) => lines.push(`${a.filename}: ${a.url}`));
                  }
                  const body = lines.join('\n');
                  const phone = sendWhatsappTo.trim().replace(/\D/g, '');
                  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(body)}`, '_blank', 'noopener,noreferrer');
                  markInvoiceSentLocally(saved.id);
                  toast.success(t('sendWhatsAppComposeOpened'));
                  navigate('/invoices');
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : t('quoteSendFailed'));
                }
              }}
              disabled={!sendWhatsappTo.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-medium text-emerald-800 shadow-md transition hover:bg-emerald-50 disabled:opacity-60 w-28 sm:w-32"
            >
              <span className="text-[10px] sm:text-xs whitespace-nowrap">{t('sendByWhatsapp')}</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

