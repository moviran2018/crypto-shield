import type { DashboardMetrics } from '../store/adminStore.js';

export interface DashboardProps {
  metrics: DashboardMetrics;
  onRefresh: () => void;
}

export function renderDashboard(props: DashboardProps): string {
  const { metrics, onRefresh } = props;

  return `
    <div class="admin-dashboard">
      <header class="dashboard-header">
        <h1>Dashboard Overview</h1>
        <button class="btn-refresh" onclick="refresh()">Refresh</button>
      </header>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon">👥</div>
          <div class="metric-content">
            <span class="metric-value">${metrics.totalUsers.toLocaleString()}</span>
            <span class="metric-label">Total Users</span>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon">💎</div>
          <div class="metric-content">
            <span class="metric-value">${metrics.activeSubscriptions.toLocaleString()}</span>
            <span class="metric-label">Active Subscriptions</span>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon">💰</div>
          <div class="metric-content">
            <span class="metric-value">$${metrics.monthlyRevenue.toLocaleString()}</span>
            <span class="metric-label">Monthly Revenue</span>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon">📊</div>
          <div class="metric-content">
            <span class="metric-value">${metrics.todayRequests.toLocaleString()}</span>
            <span class="metric-label">Today's Requests</span>
          </div>
        </div>
      </div>
      <div class="charts-section">
        <div class="chart-container">
          <h3>User Growth</h3>
          <div class="chart-placeholder" id="userGrowthChart"></div>
        </div>
        <div class="chart-container">
          <h3>Revenue</h3>
          <div class="chart-placeholder" id="revenueChart"></div>
        </div>
      </div>
    </div>
  `.trim();
}