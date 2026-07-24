export interface AdminState {
  sidebarOpen: boolean;
  currentPage: AdminPage;
  metrics: DashboardMetrics;
  users: AdminUser[];
  isLoading: boolean;
  error: string | null;
}

export type AdminPage = 'dashboard' | 'users' | 'subscriptions' | 'ad-manager' | 'brand-settings';

export interface DashboardMetrics {
  totalUsers: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  todayRequests: number;
  userGrowth: number[];
  revenueHistory: number[];
  requestHistory: number[];
}

export interface AdminUser {
  id: string;
  email: string;
  subscriptionStatus: 'free' | 'premium';
  subscriptionExpiry: number | null;
  totalAnalyses: number;
  createdAt: number;
  isActive: boolean;
}

let state: AdminState = {
  sidebarOpen: true,
  currentPage: 'dashboard',
  metrics: {
    totalUsers: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    todayRequests: 0,
    userGrowth: [],
    revenueHistory: [],
    requestHistory: [],
  },
  users: [],
  isLoading: false,
  error: null,
};

const listeners: Array<() => void> = [];

function notify(): void {
  listeners.forEach(fn => fn());
}

export function subscribe(fn: () => void): () => void {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

export function getState(): AdminState {
  return { ...state };
}

export function setPage(page: AdminPage): void {
  state = { ...state, currentPage: page };
  notify();
}

export function toggleSidebar(): void {
  state = { ...state, sidebarOpen: !state.sidebarOpen };
  notify();
}

export function setMetrics(metrics: DashboardMetrics): void {
  state = { ...state, metrics };
  notify();
}

export function setUsers(users: AdminUser[]): void {
  state = { ...state, users };
  notify();
}

export function updateUser(id: string, updates: Partial<AdminUser>): void {
  state = {
    ...state,
    users: state.users.map(u => u.id === id ? { ...u, ...updates } : u),
  };
  notify();
}

export function setLoading(loading: boolean): void {
  state = { ...state, isLoading: loading };
  notify();
}

export function setError(error: string | null): void {
  state = { ...state, error };
  notify();
}