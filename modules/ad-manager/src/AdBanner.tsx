import type { AdBanner, AdPosition } from './types.js';

interface AdBannerProps {
  banner: AdBanner;
  position: AdPosition;
  onImpression?: (bannerId: string) => void;
  onClick?: (bannerId: string) => void;
}

export function renderAdBanner(props: AdBannerProps): string {
  const { banner, position, onImpression, onClick } = props;

  const isActive = banner.isActive &&
    Date.now() >= banner.startDate &&
    Date.now() <= banner.endDate;

  if (!isActive) return '';

  const impressionAttr = onImpression
    ? `data-impression="true" data-banner-id="${banner.id}"`
    : '';

  const clickAttr = onClick
    ? `data-click="true" data-banner-id="${banner.id}"`
    : '';

  return `
    <div class="ad-banner ad-banner--${position}" ${impressionAttr}>
      <a href="${banner.link}" target="_blank" rel="noopener noreferrer" ${clickAttr}>
        <img src="${banner.imageUrl}" alt="${banner.title}" loading="lazy" />
        <span class="ad-banner__title">${banner.title}</span>
      </a>
    </div>
  `.trim();
}