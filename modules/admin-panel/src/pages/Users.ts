import type { AdminUser } from '../store/adminStore.js';

export interface UsersProps {
  users: AdminUser[];
  onSearch: (query: string) => void;
  onFilterStatus: (status: string) => void;
  onUpdateSubscription: (userId: string, status: 'free' | 'premium', expiry: number | null) => void;
}

export function renderUsersPage(props: UsersProps): string {
  const { users, onSearch, onFilterStatus, onUpdateSubscription } = props;

  const userRows = users.map(user => `
    <tr class="user-row" data-id="${user.id}">
      <td>${user.email}</td>
      <td><span class="badge badge--${user.subscriptionStatus}">${user.subscriptionStatus}</span></td>
      <td>${user.subscriptionExpiry ? new Date(user.subscriptionExpiry).toLocaleDateString() : 'N/A'}</td>
      <td>${user.totalAnalyses.toLocaleString()}</td>
      <td>${new Date(user.createdAt).toLocaleDateString()}</td>
      <td>
        <select class="subs-status-select" data-user-id="${user.id}">
          <option value="free" ${user.subscriptionStatus === 'free' ? 'selected' : ''}>Free</option>
          <option value="premium" ${user.subscriptionStatus === 'premium' ? 'selected' : ''}>Premium</option>
        </select>
      </td>
    </tr>
  `).join('');

  return `
    <div class="users-page">
      <header class="users-header">
        <h1>User Management</h1>
        <div class="users-filters">
          <input type="text" placeholder="Search by email..." class="search-input" oninput="searchUsers(this.value)" />
          <select class="filter-select" onchange="filterStatus(this.value)">
            <option value="all">All</option>
            <option value="free">Free</option>
            <option value="premium">Premium</option>
          </select>
        </div>
      </header>
      <table class="users-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Status</th>
            <th>Expiry</th>
            <th>Analyses</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>${userRows}</tbody>
      </table>
    </div>
  `.trim();
}