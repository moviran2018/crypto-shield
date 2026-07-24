import type { AdBanner, AdStats, AdPosition } from './types.js';

interface AdDashboardProps {
  banners: AdBanner[];
  stats: AdStats;
  onAddBanner: (banner: Omit<AdBanner, 'id' | 'clicks' | 'views' | 'createdAt'>) => void;
  onEditBanner: (id: string, updates: Partial<AdBanner>) => void;
  onDeleteBanner: (id: string) => void;
}

export function renderAdDashboard(props: AdDashboardProps): string {
  const { banners, stats, onAddBanner, onEditBanner, onDeleteBanner } = props;

  const bannerRows = banners.map(banner => `
    <tr class="ad-dashboard__row" data-id="${banner.id}">
      <td><img src="${banner.imageUrl}" alt="" width="50" height="50" /></td>
      <td>${banner.title}</td>
      <td>${banner.position}</td>
      <td>${banner.views.toLocaleString()}</td>
      <td>${banner.clicks.toLocaleString()}</td>
      <td>${stats.ctr.toFixed(2)}%</td>
      <td>${new Date(banner.startDate).toLocaleDateString()}</td>
      <td>${new Date(banner.endDate).toLocaleDateString()}</td>
      <td>
        <button class="btn-edit" data-id="${banner.id}">Edit</button>
        <button class="btn-delete" data-id="${banner.id}">Delete</button>
      </td>
    </tr>
  `).join('');

  return `
    <div class="ad-dashboard">
      <header class="ad-dashboard__header">
        <h2>Ad Manager</h2>
        <button class="btn-add" onclick="addBanner()">+ Add Banner</button>
      </header>
      <div class="ad-dashboard__stats">
        <div class="stat-card">
          <span class="stat-value">${stats.totalImpressions.toLocaleString()}</span>
          <span class="stat-label">Total Impressions</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${stats.totalClicks.toLocaleString()}</span>
          <span class="stat-label">Total Clicks</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${stats.ctr.toFixed(2)}%</span>
          <span class="stat-label">CTR</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${stats.activeBanners}</span>
          <span class="stat-label">Active Banners</span>
        </div>
      </div>
      <table class="ad-dashboard__table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Title</th>
            <th>Position</th>
            <th>Views</th>
            <th>Clicks</th>
            <th>CTR</th>
            <th>Start</th>
            <th>End</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>${bannerRows}</tbody>
      </table>
    </div>
  `.trim();
}