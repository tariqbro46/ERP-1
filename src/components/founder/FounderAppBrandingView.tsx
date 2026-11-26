import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Check,
  FileImage,
  Globe,
  Info,
  Palette,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  Zap,
} from 'lucide-react';
import {
  AppBrandingConfig,
  DEFAULT_APP_BRANDING,
  escapeHtml,
  sanitizeAssetUrl,
  sanitizeCssColor,
} from '../../constants/appIdentity';
import { useSettings } from '../../contexts/SettingsContext';
import { cn } from '../../lib/utils';

interface FounderAppBrandingViewProps {
  onDirtyChange: (dirty: boolean) => void;
  showNotification: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

const QUICK_BG_PRESETS = [
  { id: 'transparent', label: 'Transparent', hex: 'transparent', checker: true },
  { id: '#ffffff', label: 'Pure White', hex: '#ffffff', checker: false },
  { id: '#0f172a', label: 'Dark Slate', hex: '#0f172a', checker: false },
  { id: '#1a73e8', label: 'Azure Blue', hex: '#1a73e8', checker: false },
  { id: '#059669', label: 'Emerald', hex: '#059669', checker: false },
  { id: '#4f46e5', label: 'Indigo', hex: '#4f46e5', checker: false },
];

export const FounderAppBrandingView: React.FC<FounderAppBrandingViewProps> = ({
  onDirtyChange,
  showNotification,
}) => {
  const { appIdentity, updateAppIdentity } = useSettings();
  const [draft, setDraft] = useState<AppBrandingConfig>(appIdentity);
  const [isSaving, setIsSaving] = useState(false);

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(appIdentity),
    [draft, appIdentity]
  );

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    return () => onDirtyChange(false);
  }, [onDirtyChange]);

  useEffect(() => {
    if (!isDirty) {
      setDraft(appIdentity);
    }
  }, [appIdentity]);

  const sanitizedLogoPreview = useMemo(() => sanitizeAssetUrl(draft.appLogoUrl), [draft.appLogoUrl]);
  const sanitizedFaviconPreview = useMemo(() => sanitizeAssetUrl(draft.faviconUrl), [draft.faviconUrl]);
  const hasUnsafeLogoUrl = Boolean(draft.appLogoUrl.trim()) && !sanitizedLogoPreview;
  const hasUnsafeFaviconUrl = Boolean(draft.faviconUrl.trim()) && !sanitizedFaviconPreview;
  const safeLogoBg = useMemo(
    () => sanitizeCssColor(draft.appLogoBgColor, DEFAULT_APP_BRANDING.appLogoBgColor),
    [draft.appLogoBgColor]
  );
  const safeAccent = useMemo(
    () => sanitizeCssColor(draft.brandAccentColor, DEFAULT_APP_BRANDING.brandAccentColor),
    [draft.brandAccentColor]
  );

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'appLogoUrl' | 'faviconUrl',
    maxBytes: number,
    label: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > maxBytes) {
      showNotification(`${label} must be smaller than ${Math.round(maxBytes / 1024)}KB.`, 'error');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const clean = sanitizeAssetUrl(result);
      if (!clean) {
        showNotification(`Unsupported image format for ${label} (SVG data URIs are blocked for security).`, 'error');
        return;
      }
      setDraft((p) => ({ ...p, [field]: clean }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (hasUnsafeLogoUrl || hasUnsafeFaviconUrl) {
      showNotification('Please replace unsafe Logo or Favicon URLs before saving.', 'error');
      return;
    }
    setIsSaving(true);
    try {
      await updateAppIdentity({
        ...draft,
        appName: draft.appName.trim() || DEFAULT_APP_BRANDING.appName,
        appShortName: draft.appShortName.trim() || DEFAULT_APP_BRANDING.appShortName,
        appLogoUrl: sanitizedLogoPreview,
        faviconUrl: sanitizedFaviconPreview,
        appLogoBgColor: safeLogoBg,
        brandAccentColor: safeAccent,
      });
      showNotification('App Identity & Branding saved to /system/app_identity.', 'success');
    } catch {
      showNotification('Failed to save App Identity.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const escapedMetaSnippet = useMemo(
    () =>
      `<title>${escapeHtml(draft.appName || DEFAULT_APP_BRANDING.appName)}</title>\n<meta name="description" content="${escapeHtml(draft.appTagline || DEFAULT_APP_BRANDING.appTagline)}" />\n<footer>${escapeHtml(draft.softwareFooterText)}</footer>`,
    [draft.appName, draft.appTagline, draft.softwareFooterText]
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">App Identity &amp; Branding</h2>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold inline-flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Isolated from Company Legal Identity
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Controls software brand name, favicon, sidebar shell emblem, login header, and software attribution footer (/system/app_identity). Never overwrites tenant Legal Name, VAT/TIN, or print headers.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => setDraft({ ...DEFAULT_APP_BRANDING })}
            className="px-3.5 py-2 border border-border rounded-xl text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restore Defaults
          </button>
          {isDirty && (
            <button
              type="button"
              onClick={() => setDraft(appIdentity)}
              className="px-3.5 py-2 border border-border rounded-xl text-[10px] font-bold uppercase tracking-widest text-foreground hover:bg-muted"
            >
              Cancel Changes
            </button>
          )}
          <button
            type="button"
            disabled={isSaving || (!isDirty && JSON.stringify(draft) === JSON.stringify(appIdentity))}
            onClick={handleSave}
            className="px-5 py-2 bg-primary text-primary-foreground rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-md hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? 'Saving...' : 'Save App Identity'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Editing Forms */}
        <div className="lg:col-span-7 space-y-5">
          {/* Core Identity Fields */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Globe className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Platform Names &amp; Support Metadata
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                  App Name
                </label>
                <input
                  type="text"
                  value={draft.appName}
                  onChange={(e) => setDraft((p) => ({ ...p, appName: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                  Short Name (Sidebar / Mobile)
                </label>
                <input
                  type="text"
                  value={draft.appShortName}
                  onChange={(e) => setDraft((p) => ({ ...p, appShortName: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                  App Tagline
                </label>
                <input
                  type="text"
                  value={draft.appTagline}
                  onChange={(e) => setDraft((p) => ({ ...p, appTagline: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                  Default Auth Heading
                </label>
                <input
                  type="text"
                  value={draft.defaultAuthHeading}
                  onChange={(e) => setDraft((p) => ({ ...p, defaultAuthHeading: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                  Platform Support Email
                </label>
                <input
                  type="email"
                  value={draft.supportEmail}
                  onChange={(e) => setDraft((p) => ({ ...p, supportEmail: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>
          </div>

          {/* Logo, Favicon & Colors */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-5 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <FileImage className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                App Logo, Favicon &amp; Brand Colors
              </h3>
            </div>

            {/* App Logo */}
            <div className="p-4 bg-muted/10 border border-border rounded-xl space-y-3">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">
                Application Logo (&lt; 1MB)
              </label>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div
                  className="w-16 h-16 border border-dashed border-border flex items-center justify-center rounded-lg overflow-hidden shrink-0"
                  style={{ backgroundColor: safeLogoBg !== 'transparent' ? safeLogoBg : undefined }}
                >
                  {sanitizedLogoPreview ? (
                    <img src={sanitizedLogoPreview} alt="App Logo" className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
                  ) : (
                    <Building2 className="w-6 h-6 text-muted-foreground opacity-30" />
                  )}
                </div>
                <div className="flex-1 space-y-2 w-full">
                  <div className="flex gap-2">
                    <label className="flex-1 cursor-pointer bg-background border border-border hover:bg-muted p-2 text-center rounded-lg text-xs font-bold uppercase tracking-wider">
                      Upload App Logo
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={(e) => handleFileUpload(e, 'appLogoUrl', 1024 * 1024, 'App Logo')}
                        className="hidden"
                      />
                    </label>
                    {draft.appLogoUrl && (
                      <button
                        type="button"
                        onClick={() => setDraft((p) => ({ ...p, appLogoUrl: '' }))}
                        className="p-2 border border-border text-rose-500 hover:bg-rose-500/10 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={draft.appLogoUrl}
                    onChange={(e) => setDraft((p) => ({ ...p, appLogoUrl: e.target.value }))}
                    placeholder="https://example.com/app-logo.png"
                    className="w-full bg-background border border-border rounded-lg p-2 text-xs font-mono outline-none"
                  />
                  {hasUnsafeLogoUrl && (
                    <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Unsafe URL protocol or SVG data URI blocked by sanitizer.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Favicon */}
            <div className="p-4 bg-muted/10 border border-border rounded-xl space-y-3">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">
                Browser Favicon &amp; PWA Launcher Icon (&lt; 512KB)
              </label>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="w-14 h-14 border border-dashed border-border flex items-center justify-center rounded-lg bg-card overflow-hidden shrink-0">
                  {sanitizedFaviconPreview ? (
                    <img src={sanitizedFaviconPreview} alt="Favicon" className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
                  ) : (
                    <Zap className="w-5 h-5 text-muted-foreground opacity-30" />
                  )}
                </div>
                <div className="flex-1 space-y-2 w-full">
                  <div className="flex gap-2">
                    <label className="flex-1 cursor-pointer bg-background border border-border hover:bg-muted p-2 text-center rounded-lg text-xs font-bold uppercase tracking-wider">
                      Upload Favicon
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/x-icon"
                        onChange={(e) => handleFileUpload(e, 'faviconUrl', 512 * 1024, 'Favicon')}
                        className="hidden"
                      />
                    </label>
                    {draft.faviconUrl && (
                      <button
                        type="button"
                        onClick={() => setDraft((p) => ({ ...p, faviconUrl: '' }))}
                        className="p-2 border border-border text-rose-500 hover:bg-rose-500/10 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={draft.faviconUrl}
                    onChange={(e) => setDraft((p) => ({ ...p, faviconUrl: e.target.value }))}
                    placeholder="https://example.com/favicon.png"
                    className="w-full bg-background border border-border rounded-lg p-2 text-xs font-mono outline-none"
                  />
                  {hasUnsafeFaviconUrl && (
                    <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Unsafe favicon URL blocked by sanitizer.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">
                  Logo Container Background
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_BG_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setDraft((prev) => ({ ...prev, appLogoBgColor: p.hex }))}
                      className={cn(
                        'px-2 py-1 rounded border text-[10px] font-bold flex items-center gap-1.5',
                        draft.appLogoBgColor.toLowerCase() === p.hex.toLowerCase()
                          ? 'border-primary ring-1 ring-primary'
                          : 'border-border'
                      )}
                    >
                      <span
                        className="w-3 h-3 rounded-sm border border-black/15"
                        style={{
                          backgroundColor: p.hex !== 'transparent' ? p.hex : undefined,
                          backgroundImage: p.checker
                            ? 'repeating-conic-gradient(#cbd5e1 0% 25%, #ffffff 0% 50%) 50% / 6px 6px'
                            : undefined,
                        }}
                      />
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="color"
                    value={safeLogoBg.startsWith('#') ? safeLogoBg : '#ffffff'}
                    onChange={(e) => setDraft((p) => ({ ...p, appLogoBgColor: e.target.value }))}
                    className="w-9 h-8 p-0.5 rounded border border-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={draft.appLogoBgColor}
                    onChange={(e) => setDraft((p) => ({ ...p, appLogoBgColor: e.target.value }))}
                    className="flex-1 bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">
                  Brand Accent Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={safeAccent.startsWith('#') ? safeAccent : '#3b82f6'}
                    onChange={(e) => setDraft((p) => ({ ...p, brandAccentColor: e.target.value }))}
                    className="w-9 h-9 p-0.5 rounded border border-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={draft.brandAccentColor}
                    onChange={(e) => setDraft((p) => ({ ...p, brandAccentColor: e.target.value }))}
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Validated CSS hex / rgb color used across software identity surfaces.
                </p>
              </div>
            </div>
          </div>

          {/* Software Footer & Copyright */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Info className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Software Footer &amp; Copyright Attribution
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                  Software Footer Text
                </label>
                <input
                  type="text"
                  value={draft.softwareFooterText}
                  onChange={(e) => setDraft((p) => ({ ...p, softwareFooterText: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                  Alignment
                </label>
                <select
                  value={draft.softwareFooterAlignment}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      softwareFooterAlignment: e.target.value as 'left' | 'center' | 'right',
                    }))
                  }
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-3">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                  Copyright Text
                </label>
                <input
                  type="text"
                  value={draft.copyrightText}
                  onChange={(e) => setDraft((p) => ({ ...p, copyrightText: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Multi-Surface Live Preview */}
        <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-24">
          <div className="bg-card border border-border rounded-xl p-5 space-y-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Multi-Surface Live Preview
                </h3>
              </div>
              <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">
                Sanitized Output
              </span>
            </div>

            {/* Browser Tab Preview */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Browser Tab
              </span>
              <div className="bg-muted/60 border border-border rounded-t-xl px-3 pt-2 flex items-center">
                <div className="bg-background border border-b-0 border-border rounded-t-lg px-3 py-1.5 flex items-center gap-2 max-w-[260px]">
                  {sanitizedFaviconPreview ? (
                    <img src={sanitizedFaviconPreview} alt="" className="w-4 h-4 object-contain shrink-0" referrerPolicy="no-referrer" />
                  ) : (
                    <Zap className="w-3.5 h-3.5 shrink-0" style={{ color: safeAccent }} />
                  )}
                  <span className="text-xs font-semibold truncate text-foreground">
                    {draft.appName || DEFAULT_APP_BRANDING.appName}
                  </span>
                </div>
              </div>
            </div>

            {/* Sidebar Shell Preview */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Sidebar App Brand Shell
              </span>
              <div className="p-3 rounded-xl border border-border bg-slate-900 text-white flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden shrink-0 border border-white/15"
                    style={{ backgroundColor: safeLogoBg !== 'transparent' ? safeLogoBg : undefined }}
                  >
                    {sanitizedLogoPreview ? (
                      <img src={sanitizedLogoPreview} alt="" className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-xs font-black" style={{ color: safeAccent }}>
                        {(draft.appShortName || 'TF').slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{draft.appShortName || DEFAULT_APP_BRANDING.appShortName}</p>
                    <p className="text-[10px] text-slate-400 truncate">{draft.appTagline}</p>
                  </div>
                </div>
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>
            </div>

            {/* Auth Greeting Preview */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Auth Screen Greeting
              </span>
              <div className="p-4 rounded-xl border border-border bg-background space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: safeAccent }}>
                  {draft.appName}
                </p>
                <p className="text-base font-extrabold text-foreground">{draft.defaultAuthHeading}</p>
                <p className="text-[11px] text-muted-foreground">{draft.supportEmail}</p>
              </div>
            </div>

            {/* Software Footer Preview */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Software Footer Strip
              </span>
              <div
                className={cn(
                  'p-3 rounded-xl border border-border bg-muted/30 space-y-0.5',
                  draft.softwareFooterAlignment === 'left'
                    ? 'text-left'
                    : draft.softwareFooterAlignment === 'right'
                    ? 'text-right'
                    : 'text-center'
                )}
              >
                <p className="text-xs font-semibold text-foreground">{draft.softwareFooterText}</p>
                <p className="text-[10px] text-muted-foreground">{draft.copyrightText}</p>
              </div>
            </div>

            {/* Escaped HTML / Meta Output Preview */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                HTML Escaped Meta Output
              </span>
              <pre className="p-3 rounded-xl border border-border bg-muted/50 text-[10px] font-mono text-muted-foreground whitespace-pre-wrap break-all">
                {escapedMetaSnippet}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
