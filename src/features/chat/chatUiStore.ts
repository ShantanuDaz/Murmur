import { create } from "zustand";

interface ChatUiState {
  selectedAccountId: string | null;
  setSelectedAccountId: (id: string | null) => void;
}

export const useChatUiStore = create<ChatUiState>((set) => ({
  selectedAccountId: null,
  setSelectedAccountId: (id) => set({ selectedAccountId: id }),
}));
