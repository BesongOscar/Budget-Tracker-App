import { create } from "zustand";

interface CurrencyState {
  currencyCode: string;
  setCurrency: (code: string) => void;
}

export const useCurrencyStore = create<CurrencyState>((set) => ({
  currencyCode: "USD",
  setCurrency: (currencyCode) => set({ currencyCode }),
}));
