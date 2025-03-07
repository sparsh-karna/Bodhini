// store/pageStore.ts
import { create } from 'zustand';

type PageType = 'chat' | 'government' | 'reservations' | 'calendar' | 'orders' | 'travel' | 'profile';

interface PageStore {
  currentPage: PageType;
  handler: ((message: string) => void) | null; // Add handler function
  setPage: (page: PageType, handler?: (message: string) => void) => void;
}

export const usePageStore = create<PageStore>((set) => ({
  currentPage: 'chat',
  handler: null, // Initialize handler as null
  setPage: (page, handler) => set({ currentPage: page, handler }), // Update setPage to accept handler
}));