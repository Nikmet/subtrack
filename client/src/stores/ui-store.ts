import { create } from "zustand";

interface UiStoreState {
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
}

export const useUiStore = create<UiStoreState>((set) => ({
  isMobileMenuOpen: false,
  toggleMobileMenu: () => {
    set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen }));
  },
  closeMobileMenu: () => {
    set({ isMobileMenuOpen: false });
  },
}));
