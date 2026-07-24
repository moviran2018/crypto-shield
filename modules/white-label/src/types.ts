export interface BrandSettings {
  instanceId: string;
  logoUrl: string;
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  customDomain: string | null;
  telegramBotToken: string | null;
  theme: 'dark' | 'light';
  fontFamily: string;
  createdAt: number;
  updatedAt: number;
}

export interface BrandTheme {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  isDark: boolean;
}

export const BUILT_IN_THEMES: BrandTheme[] = [
  {
    name: 'Crypto Shield Default',
    primaryColor: '#E87A00',
    secondaryColor: '#FFD700',
    accentColor: '#F5F0E8',
    isDark: true,
  },
  {
    name: 'Emerald Guardian',
    primaryColor: '#00E87A',
    secondaryColor: '#00FFD7',
    accentColor: '#F0FFF5',
    isDark: true,
  },
  {
    name: 'Royal Purple',
    primaryColor: '#7A00E8',
    secondaryColor: '#D700FF',
    accentColor: '#F5F0FF',
    isDark: true,
  },
  {
    name: 'Ocean Deep',
    primaryColor: '#007AE8',
    secondaryColor: '#00D7FF',
    accentColor: '#F0F5FF',
    isDark: true,
  },
  {
    name: 'Light Enterprise',
    primaryColor: '#E87A00',
    secondaryColor: '#FFD700',
    accentColor: '#1A1A2E',
    isDark: false,
  },
];