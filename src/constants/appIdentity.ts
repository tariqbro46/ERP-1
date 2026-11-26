export interface AppBrandingConfig {
  appName: string;
  appShortName: string;
  appTagline: string;
  appLogoUrl: string;
  appLogoBgColor: string;
  faviconUrl: string;
  brandAccentColor: string;
  softwareFooterText: string;
  softwareFooterAlignment: 'left' | 'center' | 'right';
  copyrightText: string;
  supportEmail: string;
  defaultAuthHeading: string;
}

export interface CompanyLegalIdentity {
  legalName: string;
  companyName: string;
  tradeName?: string;
  companyLogo?: string;
  companyAddress: string;
  printHeader?: string;
  printPhone?: string;
  printEmail?: string;
  printWebsite?: string;
  vatBinTin?: string;
  printFooter?: string;
}

export const DEFAULT_APP_BRANDING: AppBrandingConfig = {
  appName: 'TallyFlow ERP',
  appShortName: 'TallyFlow',
  appTagline: 'Enterprise ERP Solution',
  appLogoUrl: '',
  appLogoBgColor: 'transparent',
  faviconUrl: '',
  brandAccentColor: '#3b82f6',
  softwareFooterText: 'Powered by TallyFlow ERP',
  softwareFooterAlignment: 'center',
  copyrightText: `© ${new Date().getFullYear()} TallyFlow ERP. All rights reserved.`,
  supportEmail: 'support@tallyflow-erp.com',
  defaultAuthHeading: 'Welcome back',
};

export const APP_IDENTITY_STORAGE_KEY = 'swr_app_identity';

export const APP_IDENTITY_PROTECTED_KEYS = [
  'appIdentity',
  'updateAppIdentity',
  'systemLogo',
  'systemLogoBgColor',
  'systemFavicon',
  'developerContactText',
  'developerContactAlignment',
  'appVersion',
] as const;

const LEGACY_APP_BRAND_NAMES = new Set([
  'tallyflow',
  'tallyflow erp',
  'tallyflow erp cloud',
  'tallyflow erp enterprise',
  'sapient erp',
  'sapient',
  'softr',
  'softr studio',
  'softr studio erp',
]);

export function isLegacyAppBrandString(value?: unknown): boolean {
  if (typeof value !== 'string') return false;
  return LEGACY_APP_BRAND_NAMES.has(value.trim().toLowerCase());
}

/**
 * Escapes untrusted dynamic strings before interpolating into HTML / Print / SVG templates.
 */
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Allows only safe image asset URLs (https:, http:, relative paths, blob:, or raster data:image URIs).
 * Rejects javascript:, vbscript:, and SVG data URIs to prevent script injection in print/DOM contexts.
 */
export function sanitizeAssetUrl(url: unknown): string {
  if (typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('data:text/') ||
    lower.startsWith('data:image/svg')
  ) {
    return '';
  }

  if (
    lower.startsWith('https://') ||
    lower.startsWith('http://') ||
    lower.startsWith('/') ||
    lower.startsWith('./') ||
    lower.startsWith('blob:')
  ) {
    return trimmed;
  }

  if (/^data:image\/(png|jpeg|jpg|webp|gif|x-icon|vnd\.microsoft\.icon);base64,[a-z0-9+/=]+$/i.test(trimmed)) {
    return trimmed;
  }

  return '';
}

export function sanitizeCssColor(color: unknown, fallback: string = 'transparent'): string {
  if (typeof color !== 'string') return fallback;
  const trimmed = color.trim();
  if (!trimmed) return fallback;
  if (trimmed.toLowerCase() === 'transparent') return 'transparent';
  if (/^#[0-9a-f]{3,8}$/i.test(trimmed)) return trimmed;
  if (/^(rgb|rgba|hsl|hsla)\([0-9.,%\s+-]+\)$/i.test(trimmed)) return trimmed;
  return fallback;
}

export function resolveAppBranding(
  appIdentityDoc?: Partial<AppBrandingConfig> | null,
  legacySystemConfig?: Record<string, any> | null
): AppBrandingConfig {
  const docData = appIdentityDoc || {};
  const sysData = legacySystemConfig || {};

  const rawAppName = (docData.appName || '').trim();
  const appName = rawAppName || DEFAULT_APP_BRANDING.appName;

  const rawShortName = (docData.appShortName || '').trim();
  const appShortName = rawShortName || (rawAppName ? rawAppName.split(/\s+/)[0] : DEFAULT_APP_BRANDING.appShortName);

  const rawAlignment = docData.softwareFooterAlignment || sysData.developerContactAlignment;
  const softwareFooterAlignment: 'left' | 'center' | 'right' =
    rawAlignment === 'left' || rawAlignment === 'right' || rawAlignment === 'center'
      ? rawAlignment
      : DEFAULT_APP_BRANDING.softwareFooterAlignment;

  const appLogoUrl = sanitizeAssetUrl(docData.appLogoUrl || sysData.systemLogo || '');
  const faviconUrl = sanitizeAssetUrl(docData.faviconUrl || sysData.systemFavicon || '');
  const appLogoBgColor = sanitizeCssColor(
    docData.appLogoBgColor || sysData.systemLogoBgColor || sysData.logoBgColor,
    DEFAULT_APP_BRANDING.appLogoBgColor
  );
  const brandAccentColor = sanitizeCssColor(docData.brandAccentColor, DEFAULT_APP_BRANDING.brandAccentColor);

  const softwareFooterText =
    (docData.softwareFooterText || sysData.developerContactText || '').trim() ||
    `Powered by ${appName}`;

  const copyrightText =
    (docData.copyrightText || '').trim() ||
    `© ${new Date().getFullYear()} ${appName}. All rights reserved.`;

  return {
    appName,
    appShortName,
    appTagline: (docData.appTagline || '').trim() || DEFAULT_APP_BRANDING.appTagline,
    appLogoUrl,
    appLogoBgColor,
    faviconUrl,
    brandAccentColor,
    softwareFooterText,
    softwareFooterAlignment,
    copyrightText,
    supportEmail: (docData.supportEmail || '').trim() || DEFAULT_APP_BRANDING.supportEmail,
    defaultAuthHeading: (docData.defaultAuthHeading || '').trim() || DEFAULT_APP_BRANDING.defaultAuthHeading,
  };
}

/**
 * Resolves strict tenant Company Legal Identity without ever leaking App Identity names/logos.
 */
export function resolveCompanyLegalIdentity(
  settings?: Record<string, any> | null,
  company?: { name?: string; legalName?: string; tradeName?: string; address?: string; logo?: string; vatBinTin?: string } | null
): CompanyLegalIdentity {
  const s = settings || {};
  const rawSettingsLegal = typeof s.legalName === 'string' ? s.legalName.trim() : '';
  const rawSettingsName = typeof s.companyName === 'string' ? s.companyName.trim() : '';
  const rawCompanyName = typeof company?.name === 'string' ? company.name.trim() : '';
  const rawCompanyLegal = typeof company?.legalName === 'string' ? company.legalName.trim() : '';

  const cleanSettingsName = rawSettingsName && !isLegacyAppBrandString(rawSettingsName) ? rawSettingsName : '';
  const cleanSettingsLegal = rawSettingsLegal && !isLegacyAppBrandString(rawSettingsLegal) ? rawSettingsLegal : '';

  const companyName = cleanSettingsName || rawCompanyName || cleanSettingsLegal || rawCompanyLegal || '';
  const legalName = cleanSettingsLegal || rawCompanyLegal || companyName;

  const rawPrintEmail = typeof s.printEmail === 'string' ? s.printEmail.trim() : '';
  const cleanPrintEmail = rawPrintEmail.toLowerCase() === 'info@tallyflow.erp' ? '' : rawPrintEmail;
  const rawPrintWebsite = typeof s.printWebsite === 'string' ? s.printWebsite.trim() : '';
  const cleanPrintWebsite = rawPrintWebsite.toLowerCase() === 'www.tallyflow.erp' ? '' : rawPrintWebsite;

  return {
    legalName,
    companyName,
    tradeName: (typeof s.tradeName === 'string' ? s.tradeName.trim() : '') || company?.tradeName || '',
    companyLogo: sanitizeAssetUrl(s.companyLogo || company?.logo || ''),
    companyAddress: (typeof s.companyAddress === 'string' ? s.companyAddress : '') || company?.address || '',
    printHeader: typeof s.printHeader === 'string' ? s.printHeader : '',
    printPhone: typeof s.printPhone === 'string' ? s.printPhone : '',
    printEmail: cleanPrintEmail,
    printWebsite: cleanPrintWebsite,
    vatBinTin: (typeof s.vatBinTin === 'string' ? s.vatBinTin.trim() : '') || company?.vatBinTin || '',
    printFooter: typeof s.printFooter === 'string' ? s.printFooter : '',
  };
}

export function stripProtectedAppIdentityFields<T extends Record<string, any>>(payload: T): Partial<T> {
  if (!payload || typeof payload !== 'object') return payload;
  const sanitized: Record<string, any> = { ...payload };
  for (const key of APP_IDENTITY_PROTECTED_KEYS) {
    delete sanitized[key];
  }
  return sanitized as Partial<T>;
}
