import { create } from 'zustand';

const STARTING_BALANCE = 1000;
const STORAGE_KEY = 'mb_balance';

function loadBalance(): number {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v !== null) {
      const n = Number(v);
      if (!isNaN(n) && n >= 0) return n;
    }
  } catch {}
  return STARTING_BALANCE;
}

function saveBalance(n: number) {
  try { localStorage.setItem(STORAGE_KEY, String(n)); } catch {}
}

interface BalanceState {
  balance: number;
  deduct: (amount: number) => void;
  add: (amount: number) => void;
  reset: () => void;
}

export const useBalanceStore = create<BalanceState>()((set) => ({
  balance: loadBalance(),
  deduct: (amount) => set((s) => {
    const balance = s.balance - amount;
    saveBalance(balance);
    return { balance };
  }),
  add: (amount) => set((s) => {
    const balance = s.balance + amount;
    saveBalance(balance);
    return { balance };
  }),
  reset: () => {
    saveBalance(STARTING_BALANCE);
    set({ balance: STARTING_BALANCE });
  },
}));
