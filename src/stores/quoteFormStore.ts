import { create } from 'zustand';
import type { QuoteItemInput } from '../api/client';

export interface QuoteFormItem extends QuoteItemInput {
  id: string;
}

function makeId() {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface QuoteFormState {
  quoteId: string | null;
  clientName: string;
  vatRate: number;
  items: QuoteFormItem[];
  setQuoteId: (id: string | null) => void;
  setClientName: (name: string) => void;
  setVatRate: (rate: number) => void;
  setItems: (items: QuoteFormItem[]) => void;
  addItem: (item?: Partial<QuoteItemInput>) => void;
  updateItem: (id: string, patch: Partial<QuoteItemInput>) => void;
  removeItem: (id: string) => void;
  loadQuote: (clientName: string | null, vatRate: number, items: QuoteItemInput[]) => void;
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
  vatRate: 0.19,
  items: [defaultItem()],
};

export const useQuoteFormStore = create<QuoteFormState>((set) => ({
  ...initialState,
  setQuoteId: (quoteId) => set({ quoteId }),
  setClientName: (clientName) => set({ clientName }),
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
  loadQuote: (clientName, vatRate, items) =>
    set({
      clientName: clientName ?? '',
      vatRate,
      items:
        items.length > 0
          ? items.map((it) => ({ ...it, id: makeId() }))
          : [defaultItem()],
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
