export interface AdManagerProps {
  banners: Array<{
    id: string;
    title: string;
    link: string;
    imageUrl: string;
    position: string;
    startDate: number;
    endDate: number;
    clicks: number;
    views: number;
  }>;
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function renderAdManagerPage(props: AdManagerProps): string {
  const { banners, onAdd, onEdit, onDelete } = props;

  const bannerRows = banners.map(b => `
    <tr data-id="${b.id}">
      <td><img src="${b.imageUrl}" alt="" width="50" height="50" /></td>
      <td>${b.title}</td>
      <td>${b.position}</td>
      <td>${b.views}</td>
      <td>${b.clicks}</td>
      <td>${b.views > 0 ? ((b.clicks / b.views) * 100).toFixed(2) : '0'}%</td>
      <td>${new Date(b.startDate).toLocaleDateString()}</td>
      <td>${new Date(b.endDate).toLocaleDateString()}</td>
      <td>
        <button class="btn-sm btn-edit" data-id="${b.id}">Edit</button>
        <button class="btn-sm btn-delete" data-id="${b.id}">Delete</button>
      </td>
    </tr>
  `).join('');

  return `
    <div class="ad-manager-page">
      <header>
        <h1>Ad Manager</h1>
        <button class="btn-primary" onclick="addBanner()">+ Add Banner</button>
      </header>
      <table class="ads-table">
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