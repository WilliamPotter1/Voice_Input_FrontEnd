import { useAuthStore } from '../stores/authStore';

const API_BASE =
  import.meta.env.VITE_API_URL != null && import.meta.env.VITE_API_URL !== ''
    ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
    : '/api';

function getAuthHeaders(): HeadersInit {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
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
  const res = await fetchApi(url.toString(), { method: 'POST', body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? 'Transcription failed');
  }
  return res.json();
}

export async function extractQuoteItems(
  text: string,
  options?: { language?: string }
): Promise<{ items: QuoteItemInput[] }> {
  const res = await fetchApi(apiUrl('/extract-quote-items'), {
    method: 'POST',
    headers: getAuthHeaders(),
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
  vatRate?: number;
  items: QuoteItemInput[];
}

export interface QuoteSummary {
  id: string;
  clientName: string | null;
  subtotal: number;
  vat: number;
  total: number;
  createdAt: string;
}

export interface QuoteDetail extends QuoteSummary {
  vatRate: number;
  items: (QuoteItemInput & { id: string; total: number })[];
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
    headers: getAuthHeaders(),
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
    headers: getAuthHeaders(),
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
