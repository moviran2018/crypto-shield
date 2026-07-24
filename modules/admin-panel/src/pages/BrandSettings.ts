export interface BrandSettingsProps {
  brandName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  customDomain: string;
  telegramBotToken: string;
  onSave: (settings: Record<string, string>) => void;
  onUploadLogo: () => void;
}

export function renderBrandSettingsPage(props: BrandSettingsProps): string {
  const { brandName, logoUrl, primaryColor, secondaryColor, customDomain, telegramBotToken, onSave, onUploadLogo } = props;

  return `
    <div class="brand-settings-page">
      <header>
        <h1>Brand Settings</h1>
        <button class="btn-primary" onclick="saveSettings()">Save Changes</button>
      </header>
      <div class="settings-form">
        <div class="form-group">
          <label>Brand Name</label>
          <input type="text" value="${brandName}" id="brandName" class="form-input" />
        </div>
        <div class="form-group">
          <label>Logo</label>
          <div class="logo-upload">
            <img src="${logoUrl}" alt="Logo" class="logo-preview" />
            <button class="btn-secondary" onclick="uploadLogo()">Upload Logo</button>
          </div>
        </div>
        <div class="form-group">
          <label>Primary Color</label>
          <div class="color-picker-group">
            <input type="color" value="${primaryColor}" id="primaryColor" class="color-input" />
            <span class="color-hex">${primaryColor}</span>
          </div>
        </div>
        <div class="form-group">
          <label>Secondary Color</label>
          <div class="color-picker-group">
            <input type="color" value="${secondaryColor}" id="secondaryColor" class="color-input" />
            <span class="color-hex">${secondaryColor}</span>
          </div>
        </div>
        <div class="form-group">
          <label>Custom Domain</label>
          <input type="text" value="${customDomain}" id="customDomain" placeholder="yourdomain.com" class="form-input" />
        </div>
        <div class="form-group">
          <label>Telegram Bot Token</label>
          <input type="password" value="${telegramBotToken}" id="telegramBotToken" class="form-input" />
        </div>
      </div>
    </div>
  `.trim();
}