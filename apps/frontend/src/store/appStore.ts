import { create } from 'zustand';

interface AnalysisData {
  contractAddress: string;
  chain: 'bsc' | 'ethereum';
  trustScore: number;
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  trafficLight: 'green' | 'yellow' | 'red';
  summary: string;
  warnings: string[];
  sources: Array<{ source: string; score: number; isAvailable: boolean }>;
  details: {
    buyTax: number;
    sellTax: number;
    isHoneypot: boolean;
    isProxy: boolean;
    isMintable: boolean;
    hasBlacklist: boolean;
    ownerRenounced: boolean;
    isVerified: boolean;
    liquidityLocked: boolean;
    ownerAddress: string | null;
  };
  scannedAt: number;
}

interface AppState {
  isAuthenticated: boolean;
  user: { id: string; email: string } | null;
  setUser: (user: { id: string; email: string } | null) => void;

  currentAnalysis: AnalysisData | null;
  isAnalyzing: boolean;
  setCurrentAnalysis: (analysis: AnalysisData | null) => void;
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
