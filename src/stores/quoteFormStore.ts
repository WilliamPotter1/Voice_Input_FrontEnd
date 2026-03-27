import { create } from 'zustand';
import type { QuoteItemInput } from '../api/client';

export interface QuoteFormItem extends QuoteItemInput {
  id: string;
}

function makeId() {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Remove comma-separated placeholder tokens models sometimes emit (e.g. "85386 Eching, null, null, null"). */
export function stripNullAddressSegments(full: string | null | undefined): string {
  if (!full) return '';
  const segments = full
    .split(',')
    .map((p) => p.trim())
    .filter(
      (p) =>
        p.length > 0 &&
        !/^null$/i.test(p) &&
        p.toLowerCase() !== 'undefined' &&
        !/^n\/?a$/i.test(p),
    );
  return segments.join(', ').trim();
}

/** Split combined customer address into street and city for form display. Mirrors ProfilePage logic. */
export function splitCustomerAddress(full: string | null | undefined): { street: string; city: string } {
  if (!full) return { street: '', city: '' };
  const s = stripNullAddressSegments(full);
  if (!s) return { street: '', city: '' };

  // Prefer "street, ZIP City" style.
  const parts = s.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 2) {
    const [first, second] = parts;
    if (/^\d{5}\b/.test(second)) return { street: first, city: second };
    if (/^\d{5}\b/.test(first)) return { street: second, city: first };
    // If no ZIP digits are present, assume "street, city".
    return { street: first, city: second };
  }

  // Fallback: split on "-" separators.
  const dashParts = s.split(/-/).map((p) => p.trim()).filter(Boolean);
  if (dashParts.length === 2) {
    const [left, right] = dashParts;
    if (/^\d{5}\b/.test(left)) return { street: right, city: left };
    if (/^\d{5}\b/.test(right)) return { street: left, city: right };
  }

  // If string starts with ZIP, treat leading "ZIP City, rest" as city.
  const zipCityMatch = s.match(/^(\d{5}\s+\S+(?:\s+\S+)*)(?:,\s*(.*))?$/);
  if (zipCityMatch) {
    const city = zipCityMatch[1];
    const street = zipCityMatch[2] ?? '';
    return { street: street.trim(), city: city.trim() };
  }

  // Otherwise treat whole as street.
  return { street: s, city: '' };
}

interface QuoteFormState {
  quoteId: string | null;
  clientName: string;
  customerStreet: string;
  customerCity: string;
  vatRate: number;
  items: QuoteFormItem[];
  setQuoteId: (id: string | null) => void;
  setClientName: (name: string) => void;
  setCustomerStreet: (street: string) => void;
  setCustomerCity: (city: string) => void;
  setVatRate: (rate: number) => void;
  setItems: (items: QuoteFormItem[]) => void;
  addItem: (item?: Partial<QuoteItemInput>) => void;
  updateItem: (id: string, patch: Partial<QuoteItemInput>) => void;
  removeItem: (id: string) => void;
  loadQuote: (clientName: string | null, customerAddress: string | null, vatRate: number, items: QuoteItemInput[]) => void;
  reset: () => void;
}

const defaultItem = (): QuoteFormItem => ({
  id: makeId(),
  itemName: '',
  quantity: 1,
  unitPrice: 0,
});

const initialState = {
  quoteId: null,
  clientName: '',
  customerStreet: '',
  customerCity: '',
  vatRate: 0.19,
  items: [defaultItem()],
};

export const useQuoteFormStore = create<QuoteFormState>((set) => ({
  ...initialState,
  setQuoteId: (quoteId) => set({ quoteId }),
  setClientName: (clientName) => set({ clientName }),
  setCustomerStreet: (customerStreet) => set({ customerStreet }),
  setCustomerCity: (customerCity) => set({ customerCity }),
  setVatRate: (vatRate) => set({ vatRate }),
  setItems: (items) => set({ items }),
  addItem: (item) =>
    set((state) => ({
      items: [...state.items, { ...defaultItem(), ...item, id: makeId() }],
    })),
  updateItem: (id, patch) =>
    set((state) => ({
      items: state.items.map((it) =>
        it.id === id ? { ...it, ...patch } : it
      ),
    })),
  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((it) => it.id !== id).length
        ? state.items.filter((it) => it.id !== id)
        : [defaultItem()],
    })),
  loadQuote: (clientName, customerAddress, vatRate, items) =>
    set(() => {
      const { street, city } = splitCustomerAddress(customerAddress);
      return {
        clientName: clientName ?? '',
        customerStreet: street,
        customerCity: city,
        vatRate,
        items:
          items.length > 0
            ? items.map((it) => ({ ...it, id: makeId() }))
            : [defaultItem()],
      };
    }),
  reset: () => set(initialState),
}));

export function useQuoteTotals() {
  const items = useQuoteFormStore((s) => s.items);
  const vatRate = useQuoteFormStore((s) => s.vatRate);
  const subtotal = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
  const vat = subtotal * vatRate;
  const total = subtotal + vat;
  return { subtotal, vat, total };
}
