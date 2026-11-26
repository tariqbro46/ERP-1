import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { useSiteContent } from '../../hooks/useSiteContent';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { isLegacyAppBrandString, sanitizeAssetUrl } from '../../constants/appIdentity';
import { getGroupedPublicNavigation } from '../../constants/publicNavigation';
import { cn } from '../../lib/utils';

interface FooterProps {
  isMonochrome?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ isMonochrome = false }) => {
  const { t, language } = useLanguage();
  const { appIdentity } = useSettings();
  const isBn = language === 'bn';

  const { content: globalSettings } = useSiteContent('global', {
    siteName: appIdentity.appName,
    siteNameColor: '#0f172a',
    footerText: appIdentity.copyrightText,
    footerTextColor: '#64748b',
    footerBgColor: '#fafafa',
  });

  const displayAppName =
    globalSettings.siteName && !isLegacyAppBrandString(globalSettings.siteName)
      ? globalSettings.siteName
      : appIdentity.appName;
  const displayFooterText =
    globalSettings.footerText && !isLegacyAppBrandString(globalSettings.footerText)
      ? globalSettings.footerText
      : appIdentity.copyrightText;
  const safeAppLogo = sanitizeAssetUrl(appIdentity.appLogoUrl || globalSettings.systemLogo);

  const groupedNav = useMemo(() => getGroupedPublicNavigation(), []);

  return (
    <footer
      className={cn(
        'border-t py-12 transition-colors',
        isMonochrome
          ? 'bg-[#090a0d] border-white/[0.06] text-neutral-400'
          : 'border-slate-200/80 dark:border-slate-800 bg-[#fafafa] dark:bg-[#0b101b]'
      )}
      style={{ fontFamily: "'DM Sans', 'Hind Siliguri', sans-serif" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              {safeAppLogo ? (
                <img
                  src={safeAppLogo}
                  alt={displayAppName}
                  className="h-6 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div
                  className={cn(
                    'flex items-center gap-1 p-1 rounded border shadow-xs',
                    isMonochrome
                      ? 'bg-[#14151a] border-white/[0.08]'
                      : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-700'
                  )}
                >
                  <div className="w-2.5 h-2.5 rounded-[2px] bg-white/90" />
                  <div className="w-2.5 h-2.5 rounded-[2px] bg-neutral-400" />
                  <div className="w-2.5 h-2.5 rounded-[2px] bg-neutral-600" />
                  <div className="w-2.5 h-2.5 rounded-[2px] bg-neutral-800" />
                </div>
              )}
              <span
                className={cn(
                  'text-base font-bold tracking-tight',
                  isMonochrome ? 'text-white' : 'text-slate-900 dark:text-white'
                )}
              >
                {displayAppName}
              </span>
            </Link>
            <p
              className={cn(
                'text-xs sm:text-sm max-w-xs leading-relaxed',
                isMonochrome ? 'text-neutral-400' : 'text-slate-500 dark:text-slate-400'
              )}
            >
              {t('footer.description')}
            </p>
          </div>

          {groupedNav.map((group) => {
            const title = t(group.titleKey);
            const resolvedTitle =
              title && title !== group.titleKey
                ? title
                : isBn
                  ? group.defaultTitleBn
                  : group.defaultTitleEn;

            return (
              <div key={group.id}>
                <h4
                  className={cn(
                    'text-xs font-bold uppercase tracking-wider mb-4',
                    isMonochrome ? 'text-white' : 'text-slate-900 dark:text-slate-100'
                  )}
                >
                  {resolvedTitle}
                </h4>
                <ul className="space-y-2.5">
                  {group.items.map((item) => {
                    const labelVal = t(item.labelKey);
                    const resolvedLabel =
                      labelVal && labelVal !== item.labelKey
                        ? labelVal
                        : isBn
                          ? item.defaultLabelBn
                          : item.defaultLabelEn;

                    return (
                      <li key={item.id}>
                        <Link
                          to={item.path}
                          className={cn(
                            'text-xs sm:text-sm transition-colors',
                            isMonochrome
                              ? 'text-neutral-400 hover:text-white'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                          )}
                        >
                          {resolvedLabel}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        <div
          className={cn(
            'mt-12 pt-6 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-xs',
            isMonochrome
              ? 'border-white/[0.06] text-neutral-500'
              : 'border-slate-200/60 dark:border-slate-800 text-slate-400 dark:text-slate-500'
          )}
        >
          <p>{displayFooterText}</p>
          <div className="flex gap-4">
            <span
              className={cn(
                isMonochrome
                  ? 'text-neutral-400 font-medium'
                  : 'text-slate-500 dark:text-slate-400 font-medium'
              )}
            >
              Enterprise Precision
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
