import { create } from "zustand";

export type ShortCustomer = { id: string | null; name: string; phone?: string } | null;

type CashierState = {
  selectedCustomer: ShortCustomer;    
   guestCount: number;           // null = Khách lẻ (mặc định)
  setSelectedCustomer: (c: ShortCustomer) => void;
  clearSelectedCustomer: () => void;  
  
  
  setGuestCount: (n: number) => void;
  resetGuestCount: () => void;// đưa về Khách lẻ
};

export const useCashierStore = create<CashierState>((set) => ({
  selectedCustomer: null,
    guestCount: 0,
  setSelectedCustomer: (c) => set({ selectedCustomer: c }),
  clearSelectedCustomer: () => set({ selectedCustomer: null }),
  
  setGuestCount: (n) => set({ guestCount: Math.max(0, n) }),
  resetGuestCount: () => set({ guestCount: 0 }),
}));
