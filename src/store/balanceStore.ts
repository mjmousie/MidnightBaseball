import { create } from 'zustand';

const STARTING_BALANCE = 1000;

interface BalanceState {
  balance: number;
  deduct: (amount: number) => void;
  add: (amount: number) => void;
  reset: () => void;
}

export const useBalanceStore = create<BalanceState>()((set) => ({
  balance: STARTING_BALANCE,
  deduct: (amount) => set((s) => ({ balance: s.balance - amount })),
  add: (amount) => set((s) => ({ balance: s.balance + amount })),
  reset: () => set({ balance: STARTING_BALANCE }),
}));
