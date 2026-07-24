export type AdPosition = 'sidebar_top' | 'sidebar_bottom' | 'header' | 'footer' | 'between_results' | 'popup';

export interface AdBanner {
  id: string;
  adminId: string;
  title: string;
  link: string;
  imageUrl: string;
  position: AdPosition;
  startDate: number;
  endDate: number;
  clicks: number;
  views: number;
  isActive: boolean;
  createdAt: number;
}

export interface AdStats {
  totalImpressions: number;
  totalClicks: number;
  ctr: number;
  activeBanners: number;
  topPerforming: AdBanner[];
}