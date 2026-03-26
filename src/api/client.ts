import { useAuthStore } from '../stores/authStore';

const API_BASE =
  import.meta.env.VITE_API_URL != null && import.meta.env.VITE_API_URL !== ''
    ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
    : '/api';

/** Base URL for static uploads (no /api). Use for attachment preview/download links. */
function uploadsBase(): string {
  const u = import.meta.env.VITE_API_URL;
  if (u != null && u !== '') {
    const base = String(u).replace(/\/$/, '').replace(/\/api\/?$/, '');
    if (base.startsWith('http')) return base;
  }
  return typeof window !== 'undefined' ? window.location.origin : '';
}

function getAuthHeaders(): HeadersInit {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

function getAuthJsonHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
  };
}

export interface User {
  id: string;
  email: string;
}

function apiUrl(path: string): string {
  const full = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  return full.startsWith('http') ? full : new URL(full, window.location.origin).href;
}

export async function transcribeAudio(
  file: File,
  options?: { language?: string }
): Promise<{ text: string; language?: string }> {
  const form = new FormData();
  form.append('file', file);
  const url = new URL(apiUrl('/transcribe'));
  if (options?.language) url.searchParams.set('language', options.language);
  const token = useAuthStore.getState().token;
  const headers: HeadersInit = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetchApi(url.toString(), { method: 'POST', body: form, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? 'Transcription failed');
  }
  return res.json();
}

export async function extractQuoteItems(
  text: string,
  options?: { language?: string }
): Promise<{ items: QuoteItemInput[]; customerName?: string | null; customerAddress?: string | null; vatRate?: number | null; currency?: string | null }> {
  const res = await fetchApi(apiUrl('/extract-quote-items'), {
    method: 'POST',
    headers: getAuthJsonHeaders(),
    body: JSON.stringify({ text, language: options?.language }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? 'Extraction failed');
  }
  return res.json();
}

export interface QuoteItemInput {
  itemName: string;
  quantity: number;
  unitPrice: number;
}

export interface QuoteItem extends QuoteItemInput {
  id?: string;
  total?: number;
}

export interface QuotePayload {
  clientName?: string;
  customerAddress?: string;
  freeText?: string | null;
  currency?: string;
  vatRate?: number;
  quoteNumber?: number;
  quoteDate?: string;
  validUntil?: string | null;
  items: QuoteItemInput[];
}

export interface QuoteSummary {
  id: string;
  clientName: string | null;
  customerAddress: string | null;
  freeText: string | null;
  currency: string | null;
  subtotal: number;
  vat: number;
  total: number;
  createdAt: string;
  quoteNumber: number | null;
  quoteDate: string | null;
  validUntil: string | null;
}

export interface QuoteDetail extends QuoteSummary {
  vatRate: number;
  quoteNumber: number | null;
  quoteDate: string | null;
  validUntil: string | null;
  items: (QuoteItemInput & { id: string; total: number })[];
}

export interface QuoteAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

export interface InvoiceItemInput {
  itemName: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoicePayload {
  clientName?: string | null;
  customerAddress?: string | null;
  additionalInfo?: string | null;
  currency?: string | null;
  vatRate?: number;
  invoiceNumber?: number | null;
  invoiceDate?: string | null;
  deliveryDate?: string | null;
  dueDate?: string | null;
  items: InvoiceItemInput[];
}

export interface InvoiceSummary {
  id: string;
  quoteId: string | null;
  clientName: string | null;
  customerAddress: string | null;
  additionalInfo: string | null;
  currency: string | null;
  subtotal: number;
  vat: number;
  total: number;
  invoiceNumber: number | null;
  invoiceDate: string | null;
  deliveryDate: string | null;
  dueDate: string | null;
  sentAt: string | null;
  sentByEmail: boolean;
  sentByWhats: boolean;
  createdAt: string;
}

export interface InvoiceDetail extends InvoiceSummary {
  vatRate: number;
  items: (InvoiceItemInput & { id: string; total: number })[];
}

/** Full URL for viewing/downloading an attachment (uses /uploads, not /api). */
export function getAttachmentDisplayUrl(att: QuoteAttachment): string {
  const path = att.url.startsWith('http')
    ? att.url
    : att.url.startsWith('/')
      ? att.url
      : `/${att.url}`;
  if (path.startsWith('http')) return path;
  const base = uploadsBase();
  return base ? `${base}${path}` : path;
}

async function fetchApi(
  url: string,
  options: RequestInit
): Promise<Response> {
  try {
    return await fetch(url, options);
  } catch (err) {
    const isFailedFetch = err instanceof TypeError && err.message === 'Failed to fetch';
    const isProduction = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');
    const message = isFailedFetch
      ? isProduction
        ? 'Cannot reach server. Set VITE_API_URL in the frontend build and CORS_ORIGIN in the backend, then redeploy both.'
        : 'Cannot reach server. Check backend URL (VITE_API_URL) and CORS.'
      : err instanceof Error
        ? err.message
        : 'Network error';
    throw new Error(message);
  }
}

export async function login(email: string, password: string): Promise<{ user: User; token: string }> {
  const res = await fetchApi(apiUrl('/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Login failed');
  return data;
}

export async function register(
  email: string,
  password: string
): Promise<{ user: User; token: string }> {
  const res = await fetchApi(apiUrl('/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Registration failed');
  return data;
}

export async function createQuote(payload: QuotePayload): Promise<QuoteDetail> {
  const res = await fetchApi(apiUrl('/quotes'), {
    method: 'POST',
    headers: getAuthJsonHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Failed to create quote');
  return data;
}

export async function listQuotes(): Promise<QuoteSummary[]> {
  const res = await fetchApi(apiUrl('/quotes'), { headers: getAuthHeaders() });
  if (!res.ok) {
    if (res.status === 401) throw new Error('Unauthorized');
    throw new Error('Failed to load quotes');
  }
  return res.json();
}

export async function getNextQuoteNumber(): Promise<number> {
  const quotes = await listQuotes();
  const max = quotes.reduce((acc, q) => {
    if (typeof q.quoteNumber === 'number' && Number.isFinite(q.quoteNumber) && q.quoteNumber > acc) {
      return q.quoteNumber;
    }
    return acc;
  }, 0);
  return max + 1;
}

export async function getQuote(id: string): Promise<QuoteDetail> {
  const res = await fetchApi(apiUrl(`/quotes/${id}`), { headers: getAuthHeaders() });
  if (!res.ok) {
    if (res.status === 404) throw new Error('Quote not found');
    if (res.status === 401) throw new Error('Unauthorized');
    throw new Error('Failed to load quote');
  }
  return res.json();
}

export async function updateQuote(id: string, payload: Partial<QuotePayload>): Promise<QuoteDetail> {
  const res = await fetchApi(apiUrl(`/quotes/${id}`), {
    method: 'PATCH',
    headers: getAuthJsonHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Failed to update quote');
  return data;
}

export async function deleteQuote(id: string): Promise<void> {
  const res = await fetchApi(apiUrl(`/quotes/${id}`), {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok && res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? 'Failed to delete quote');
  }
}

export async function listInvoices(): Promise<InvoiceSummary[]> {
  const res = await fetchApi(apiUrl('/invoices'), { headers: getAuthHeaders() });
  if (!res.ok) {
    if (res.status === 401) throw new Error('Unauthorized');
    throw new Error('Failed to load invoices');
  }
  return res.json();
}

export async function getNextInvoiceNumber(): Promise<number> {
  const invoices = await listInvoices();
  const max = invoices.reduce((acc, inv) => {
    if (typeof inv.invoiceNumber === 'number' && Number.isFinite(inv.invoiceNumber) && inv.invoiceNumber > acc) {
      return inv.invoiceNumber;
    }
    return acc;
  }, 0);
  return max + 1;
}

export async function getInvoice(id: string): Promise<InvoiceDetail> {
  const res = await fetchApi(apiUrl(`/invoices/${id}`), { headers: getAuthHeaders() });
  if (!res.ok) {
    if (res.status === 404) throw new Error('Invoice not found');
    if (res.status === 401) throw new Error('Unauthorized');
    throw new Error('Failed to load invoice');
  }
  return res.json();
}

export async function createInvoice(payload: InvoicePayload): Promise<InvoiceDetail> {
  const res = await fetchApi(apiUrl('/invoices'), {
    method: 'POST',
    headers: getAuthJsonHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Failed to create invoice');
  return data;
}

export async function updateInvoice(id: string, payload: Partial<InvoicePayload>): Promise<InvoiceDetail> {
  const res = await fetchApi(apiUrl(`/invoices/${id}`), {
    method: 'PATCH',
    headers: getAuthJsonHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Failed to update invoice');
  return data;
}

export async function deleteInvoice(id: string): Promise<void> {
  const res = await fetchApi(apiUrl(`/invoices/${id}`), {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok && res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? 'Failed to delete invoice');
  }
}

export async function createInvoiceFromQuote(quoteId: string): Promise<InvoiceDetail> {
  const res = await fetchApi(apiUrl(`/invoices/from-quote/${quoteId}`), {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Failed to create invoice from quote');
  return data;
}

export async function downloadInvoicePdf(
  invoiceId: string,
  invoiceDate: string,
  dueDate: string,
  lang: string,
  invoiceNumber: number,
): Promise<string> {
  const params = new URLSearchParams({ invoiceDate, dueDate, lang, invoiceNumber: String(invoiceNumber) });
  const url = apiUrl(`/invoices/${invoiceId}/pdf?${params.toString()}`);
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? 'Failed to generate invoice PDF');
  }
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') ?? '';
  const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
  const filename = filenameMatch?.[1] ?? `Invoice-${invoiceId.slice(0, 8)}.pdf`;
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
  return filename;
}

export async function listQuoteAttachments(quoteId: string): Promise<QuoteAttachment[]> {
  const res = await fetchApi(apiUrl(`/quotes/${quoteId}/attachments`), {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error('Failed to load attachments');
  }
  return res.json();
}

export async function uploadQuoteAttachment(quoteId: string, file: File): Promise<QuoteAttachment> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetchApi(apiUrl(`/quotes/${quoteId}/attachments`), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? 'Failed to upload attachment');
  }
  return data as QuoteAttachment;
}

export async function deleteQuoteAttachment(quoteId: string, attachmentId: string): Promise<void> {
  const res = await fetchApi(apiUrl(`/quotes/${quoteId}/attachments/${attachmentId}`), {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok && res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? 'Failed to delete attachment');
  }
}

// ---- Profile ----------------------------------------------------------------

export interface UserProfile {
  name: string;
  phone: string;
  email: string;
  taxRate: number | null;
  websiteUrl: string;
  companyName: string;
  companyAddress: string;
  companyCity: string;
  bankName: string;
  blz: string;
  kto: string;
  iban: string;
  bic: string;
  taxNumber: string;
  taxOfficeName: string;
  avatarUrl: string | null;
}

// Base required fields that must always be present.
// Bank account requirement (IBAN vs. BLZ+KTO) is handled separately in isProfileComplete.
const REQUIRED_PROFILE_FIELDS: (keyof UserProfile)[] = [
  'name',
  'companyName',
  'companyAddress',
  'companyCity',
  'bankName',
  'bic',
  'taxNumber',
  'taxOfficeName',
];

export function isProfileComplete(profile: UserProfile): boolean {
  // 1) Base fields must be non-empty strings.
  const baseOk = REQUIRED_PROFILE_FIELDS.every((key) => {
    const val = profile[key];
    return typeof val === 'string' && val.trim().length > 0;
  });

  if (!baseOk) return false;

  // 2) Bank details: either IBAN is filled, OR both BLZ and KTO are filled.
  const iban = profile.iban?.trim() ?? '';
  const blz = profile.blz?.trim() ?? '';
  const kto = profile.kto?.trim() ?? '';

  const hasIban = iban.length > 0;
  const hasBlzAndKto = blz.length > 0 && kto.length > 0;

  return hasIban || hasBlzAndKto;
}

export async function getProfile(): Promise<UserProfile> {
  const res = await fetchApi(apiUrl('/profile'), { headers: getAuthHeaders() });
  if (!res.ok) {
    if (res.status === 401) throw new Error('Unauthorized');
    throw new Error('Failed to load profile');
  }
  return res.json();
}

export async function updateProfile(data: Partial<Omit<UserProfile, 'email' | 'avatarUrl'>>): Promise<UserProfile> {
  const res = await fetchApi(apiUrl('/profile'), {
    method: 'PATCH',
    headers: getAuthJsonHeaders(),
    body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error ?? 'Failed to update profile');
  return body;
}

export async function uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetchApi(apiUrl('/profile/avatar'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: form,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error ?? 'Failed to upload avatar');
  return body as { avatarUrl: string };
}

// ---- PDF Export -------------------------------------------------------------

/** Fetches the quote PDF, triggers a download, and returns the suggested filename. */
export async function downloadQuotePdf(
  quoteId: string,
  quoteDate: string,
  validUntil: string,
  lang: string,
  quoteNumber: number,
): Promise<string> {
  const params = new URLSearchParams({ quoteDate, validUntil, lang, quoteNumber: String(quoteNumber) });
  const url = apiUrl(`/quotes/${quoteId}/pdf?${params.toString()}`);
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? 'Failed to generate PDF');
  }
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') ?? '';
  const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
  const filename = filenameMatch?.[1] ?? `Angebot-${quoteId.slice(0, 8)}.pdf`;
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
  return filename;
}

// ---- Send quote links (for email body pre-fill) -----------------------------

export interface QuoteSendLinks {
  pdfUrl: string;
  attachmentUrls: { filename: string; url: string }[];
}

export async function getQuoteSendLinks(
  quoteId: string,
  quoteDate: string,
  validUntil: string,
  quoteNumber: number,
  lang: string,
): Promise<QuoteSendLinks> {
  const res = await fetchApi(apiUrl(`/quotes/${quoteId}/send-links`), {
    method: 'POST',
    headers: getAuthJsonHeaders(),
    body: JSON.stringify({ quoteDate, validUntil, quoteNumber, lang }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((body as { error?: string }).error ?? 'Failed to get send links');
  }
  return body as QuoteSendLinks;
}

// ---- Send quote (email / WhatsApp) -----------------------------------------

export async function sendQuote(
  quoteId: string,
  channel: 'email' | 'whatsapp',
  recipient: string,
  quoteDate: string,
  validUntil: string,
  quoteNumber: number,
  lang: string,
): Promise<void> {
  const res = await fetchApi(apiUrl(`/quotes/${quoteId}/send`), {
    method: 'POST',
    headers: getAuthJsonHeaders(),
    body: JSON.stringify({ channel, recipient, quoteDate, validUntil, quoteNumber, lang }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((body as { error?: string }).error ?? 'Failed to send quote');
  }
}
