import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';
import { createInvoice, getInvoice, updateInvoice } from '../api/client';
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

export function InvoiceEditorPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { data, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => getInvoice(id as string),
    enabled: isEdit,
  });

  const [clientName, setClientName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [vatRate, setVatRate] = useState(0.19);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<InvoiceItemForm[]>([defaultItem]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!data || initialized) return;
    setClientName(data.clientName ?? '');
    setCustomerAddress(data.customerAddress ?? '');
    setAdditionalInfo(data.additionalInfo ?? '');
    setCurrency((data.currency ?? 'EUR').toUpperCase());
    setVatRate(data.vatRate ?? 0.19);
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

  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0),
    [items]
  );
  const vat = subtotal * vatRate;
  const total = subtotal + vat;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const cleanItems = items
        .map((it) => ({
          itemName: it.itemName.trim(),
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
        }))
        .filter((it) => it.itemName && it.quantity > 0);

      if (!cleanItems.length) throw new Error(t('addAtLeastOneItem'));

      const payload = {
        clientName: clientName.trim() || null,
        customerAddress: customerAddress.trim() || null,
        additionalInfo: additionalInfo.trim() || null,
        currency: currency.trim() || 'EUR',
        vatRate,
        invoiceNumber: invoiceNumber.trim() ? Number(invoiceNumber) : null,
        invoiceDate: invoiceDate || null,
        deliveryDate: deliveryDate || null,
        dueDate: dueDate || null,
        items: cleanItems,
      };

      if (isEdit && id) return updateInvoice(id, payload);
      return createInvoice(payload);
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.setQueryData(['invoice', saved.id], saved);
      toast.success(isEdit ? t('invoiceUpdated') : t('invoiceSaved'));
      navigate(`/invoices/${saved.id}`);
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
      <div className="flex items-center justify-between">
        <Link to="/invoices" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft className="size-4" />
          {t('backToInvoices')}
        </Link>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
        <h1 className="text-xl font-semibold text-slate-900">{isEdit ? t('editInvoice') : t('newInvoice')}</h1>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm text-slate-700">{t('clientName')}</span>
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-slate-700">{t('customerAddress')}</span>
            <input
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-slate-700">{t('invoiceNo')}</span>
            <input
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value.replace(/[^\d]/g, ''))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-slate-700">{t('vatRate')}</span>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={vatRate}
              onChange={(e) => setVatRate(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-slate-700">{t('invoiceDate')}</span>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-slate-700">{t('deliveryDate')}</span>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-slate-700">{t('dueDate')}</span>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-slate-700">{t('currency')}</span>
            <input
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
        <label className="mt-4 block space-y-1">
          <span className="text-sm text-slate-700">{t('quoteFreeText')}</span>
          <textarea
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">{t('item')}</h2>
          <button
            type="button"
            onClick={() => setItems((prev) => [...prev, { ...defaultItem }])}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            <Plus className="size-4" />
            {t('addItem')}
          </button>
        </div>
        <div className="space-y-3">
          {items.map((it, idx) => (
            <div key={idx} className="grid gap-2 sm:grid-cols-[1fr_120px_140px_auto]">
              <input
                placeholder={t('description')}
                value={it.itemName}
                onChange={(e) =>
                  setItems((prev) => prev.map((row, i) => (i === idx ? { ...row, itemName: e.target.value } : row)))
                }
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                type="number"
                step="0.01"
                value={it.quantity}
                onChange={(e) =>
                  setItems((prev) =>
                    prev.map((row, i) => (i === idx ? { ...row, quantity: Number(e.target.value) } : row))
                  )
                }
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                type="number"
                step="0.01"
                value={it.unitPrice}
                onChange={(e) =>
                  setItems((prev) =>
                    prev.map((row, i) => (i === idx ? { ...row, unitPrice: Number(e.target.value) } : row))
                  )
                }
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev))}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-3 py-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                aria-label={t('delete')}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between">
            <span>{t('subtotal')}</span>
            <span>{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>{t('vat')}</span>
            <span>{vat.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between font-semibold text-slate-900">
            <span>{t('total')}</span>
            <span>{total.toFixed(2)}</span>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-70"
          >
            {saveMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? t('saveInvoice') : t('createInvoice')}
          </button>
        </div>
      </section>
    </div>
  );
}

