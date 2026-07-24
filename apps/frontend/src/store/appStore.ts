import { create } from 'zustand';
import type { ContractAnalysis } from '@crypto-shield/core-analyzer';

interface AppState {
  // Auth
  isAuthenticated: boolean;
  user: { id: string; email: string } | null;
  setUser: (user: { id: string; email: string } | null) => void;

  // Analysis
  currentAnalysis: ContractAnalysis | null;
  isAnalyzing: boolean;
  setCurrentAnalysis: (analysis: ContractAnalysis | null) => void;
  setIsAnalyzing: (loading: boolean) => void;

  // Monitoring
  monitoredContracts: string[];
  addMonitoredContract: (address: string) => void;
  removeMonitoredContract: (address: string) => void;

  // Subscription
  subscriptionStatus: 'free' | 'premium';
  dailyAnalysisCount: number;
  incrementAnalysisCount: () => void;
  resetDailyCount: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isAuthenticated: false,
  user: null,
  setUser: (user) => set({ user, isAuthenticated: !!user }),

  currentAnalysis: null,
  isAnalyzing: false,
  setCurrentAnalysis: (analysis) => set({ currentAnalysis: analysis }),
  setIsAnalyzing: (loading) => set({ isAnalyzing: loading }),

  monitoredContracts: [],
  addMonitoredContract: (address) =>
    set((state) => ({
      monitoredContracts: state.monitoredContracts.includes(address)
        ? state.monitoredContracts
        : [...state.monitoredContracts, address],
    })),
  removeMonitoredContract: (address) =>
    set((state) => ({
      monitoredContracts: state.monitoredContracts.filter((a) => a !== address),
    })),

  subscriptionStatus: 'free',
  dailyAnalysisCount: 0,
  incrementAnalysisCount: () =>
    set((state) => ({ dailyAnalysisCount: state.dailyAnalysisCount + 1 })),
  resetDailyCount: () => set({ dailyAnalysisCount: 0 }),
}));
