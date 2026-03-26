import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Pencil, Trash2, Plus, Loader2, Download, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listInvoices, deleteInvoice, downloadInvoicePdf } from '../api/client';
import { useTranslation } from '../i18n/useTranslation';

function formatMoney(n: number): string {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function InvoicesListPage() {
  const { t, lang } = useTranslation();
  const queryClient = useQueryClient();
  const [sentMap, setSentMap] = useState<Record<string, string>>({});
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: listInvoices,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem('sentInvoices');
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, { at?: string }>;
      const flattened: Record<string, string> = {};
      Object.entries(parsed).forEach(([id, val]) => {
        if (val && typeof val.at === 'string') {
          flattened[id] = val.at;
        }
      });
      setSentMap(flattened);
    } catch {
      // ignore parse errors
    }
  }, []);

  const deleteMutation = useMutation({
    mutationFn: deleteInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success(t('invoiceDeleted'));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Loader2 className="size-10 animate-spin text-emerald-500" />
        <p className="text-sm font-medium text-slate-600">{t('loadingInvoices')}</p>
      </div>
    );
  }

  if (!invoices?.length) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('myInvoices')}</h1>
          <p className="mt-1 text-slate-600">{t('manageInvoices')}</p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-16 px-6 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-slate-200/80 text-slate-500">
            <FileText className="size-8" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-800">{t('noInvoicesYet')}</h2>
          <p className="mt-2 max-w-sm text-sm text-slate-500">{t('noInvoicesDesc')}</p>
          <Link
            to="/invoices/new"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-medium text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Plus className="size-5" />
            {t('newInvoice')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('myInvoices')}</h1>
          <p className="mt-1 text-slate-600">{t('manageInvoices')}</p>
        </div>
        <Link
          to="/invoices/new"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-medium text-white shadow-sm transition hover:bg-emerald-700 sm:w-auto"
        >
          <Plus className="size-5" />
          {t('newInvoice')}
        </Link>
      </div>

      <ul className="space-y-3">
        {invoices.map((inv) => (
          <li
            key={inv.id}
            className="group flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:shadow-md sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:p-5"
          >
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900">
                {typeof inv.invoiceNumber === 'number'
                  ? `${t('invoiceNo')} ${inv.invoiceNumber}${inv.clientName ? ` ${inv.clientName}` : ''}`
                  : inv.clientName || t('invoice')}
              </p>
              <p className="mt-0.5 text-sm text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span>{formatDate(inv.createdAt)}</span>
                {sentMap[inv.id] && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>
                      {new Date(sentMap[inv.id]).toLocaleDateString(undefined, {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                      })}{' '}
                      {new Date(sentMap[inv.id]).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <span className="text-lg font-bold tabular-nums text-slate-900">{formatMoney(inv.total)}</span>
              <div className="flex items-center gap-1">
                {sentMap[inv.id] && (
                  <div
                    className="hidden sm:flex size-10 items-center justify-center rounded-xl text-emerald-600"
                    title={t('quoteSent')}
                    aria-label={t('quoteSent')}
                  >
                    <CheckCircle2 className="size-5" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    if (!inv.invoiceNumber) {
                      toast.error(t('pdfFailed'));
                      return;
                    }
                    try {
                      await downloadInvoicePdf(
                        inv.id,
                        inv.invoiceDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
                        inv.dueDate?.slice(0, 10) ?? '',
                        lang as string,
                        inv.invoiceNumber,
                      );
                      toast.success(t('pdfGenerated'));
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : t('pdfFailed'));
                    }
                  }}
                  className="flex size-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600"
                  aria-label={t('exportPdf')}
                  title={t('exportPdf')}
                >
                  <Download className="size-5" />
                </button>
                <Link
                  to={`/invoices/${inv.id}`}
                  className="flex size-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label={t('editInvoice')}
                  title={t('editInvoice')}
                >
                  <Pencil className="size-5" />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(t('deleteInvoiceConfirm'))) {
                      deleteMutation.mutate(inv.id);
                    }
                  }}
                  className="flex size-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                  aria-label={t('invoiceDeleted')}
                >
                  <Trash2 className="size-5" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

