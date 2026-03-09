import { Link } from 'react-router-dom';
import { FileText, Pencil, Trash2, Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listQuotes, deleteQuote } from '../api/client';
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

export function QuoteListPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: quotes, isLoading } = useQuery({
    queryKey: ['quotes'],
    queryFn: listQuotes,
  });
  const deleteMutation = useMutation({
    mutationFn: deleteQuote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success(t('quoteDeleted'));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Loader2 className="size-10 animate-spin text-emerald-500" />
        <p className="text-sm font-medium text-slate-600">{t('loadingQuotes')}</p>
      </div>
    );
  }

  if (!quotes?.length) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('myQuotes')}</h1>
          <p className="mt-1 text-slate-600">{t('manageQuotes')}</p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-16 px-6 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-slate-200/80 text-slate-500">
            <FileText className="size-8" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-800">{t('noQuotesYet')}</h2>
          <p className="mt-2 max-w-sm text-sm text-slate-500">{t('noQuotesDesc')}</p>
          <Link
            to="/quotes/new"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-medium text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Plus className="size-5" />
            {t('newQuote')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('myQuotes')}</h1>
          <p className="mt-1 text-slate-600">
            {quotes.length} {quotes.length !== 1 ? t('navQuotes').toLowerCase() : t('quote').toLowerCase()}
          </p>
        </div>
        <Link
          to="/quotes/new"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-medium text-white shadow-sm transition hover:bg-emerald-700 sm:w-auto"
        >
          <Plus className="size-5" />
          {t('newQuote')}
        </Link>
      </div>

      <ul className="space-y-3">
        {quotes.map((q) => (
          <li
            key={q.id}
            className="group flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:shadow-md sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:p-5"
          >
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900">
                {q.clientName || t('quote')}
              </p>
              <p className="mt-0.5 text-sm text-slate-500">{formatDate(q.createdAt)}</p>
            </div>
            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <span className="text-lg font-bold tabular-nums text-slate-900">
                {formatMoney(q.total)}
              </span>
              <div className="flex items-center gap-1">
                <Link
                  to={`/quotes/${q.id}`}
                  className="flex size-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label={t('editQuote')}
                >
                  <Pencil className="size-5" />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(t('deleteConfirm'))) {
                      deleteMutation.mutate(q.id);
                    }
                  }}
                  className="flex size-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                  aria-label={t('quoteDeleted')}
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
