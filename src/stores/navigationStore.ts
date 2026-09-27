import { create } from "zustand";

export type AppTab = "chats" | "profile";

export interface NavigationState {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  activeTab: "chats",
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
