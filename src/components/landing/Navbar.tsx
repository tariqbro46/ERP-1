import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, LayoutDashboard, Menu, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useSiteContent } from '../../hooks/useSiteContent';
import { isLegacyAppBrandString, sanitizeAssetUrl } from '../../constants/appIdentity';
import {
  getGroupedPublicNavigation,
  PublicNavGroupId,
} from '../../constants/publicNavigation';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<PublicNavGroupId | null>(null);
  const [mobileExpandedGroup, setMobileExpandedGroup] = useState<PublicNavGroupId | null>('product');

  const navRef = useRef<HTMLElement | null>(null);
  const hoverCloseTimerRef = useRef<number | null>(null);

  const location = useLocation();
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { appIdentity } = useSettings();
  const isBn = language === 'bn';

  const { content: globalSettings } = useSiteContent('global', {
    siteName: appIdentity.appName,
    siteNameColor: '#0f172a',
    navbarBgColor: 'rgba(255, 255, 255, 0.85)',
    navbarTextColor: '#475569',
    registrationEnabled: true,
  });

  const displayAppName =
    globalSettings.siteName && !isLegacyAppBrandString(globalSettings.siteName)
      ? globalSettings.siteName
      : appIdentity.appName;
  const safeAppLogo = sanitizeAssetUrl(appIdentity.appLogoUrl || globalSettings.systemLogo);

  const groupedNav = useMemo(() => getGroupedPublicNavigation(), []);

  // Resolve translated group title & item label/desc safely with fallback
  const resolveText = (key: string, enFallback: string, bnFallback: string) => {
    const val = t(key);
    const fallbackTitle = isBn ? bnFallback : enFallback;
    if (!val || val === key) return fallbackTitle;
    // Handle LanguageContext intelligent fallback capitalization when key isn't registered
    if (key.includes('.')) {
      return val;
    }
    return val;
  };

  // Close dropdown and mobile drawer on route changes
  useEffect(() => {
    setOpenGroup(null);
    setIsOpen(false);
    const activeGroup = groupedNav.find((g) =>
      g.items.some((item) => item.path === location.pathname)
    );
    if (activeGroup) {
      setMobileExpandedGroup(activeGroup.id);
    }
  }, [location.pathname, groupedNav]);

  // Close dropdown on outside click and Escape key
  useEffect(() => {
    const handleOutsideMouseDown = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenGroup(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenGroup(null);
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
      if (hoverCloseTimerRef.current) {
        window.clearTimeout(hoverCloseTimerRef.current);
      }
    };
  }, []);

  const handleGroupMouseEnter = (groupId: PublicNavGroupId) => {
    if (hoverCloseTimerRef.current) {
      window.clearTimeout(hoverCloseTimerRef.current);
      hoverCloseTimerRef.current = null;
    }
    setOpenGroup(groupId);
  };

  const handleGroupMouseLeave = () => {
    if (hoverCloseTimerRef.current) {
      window.clearTimeout(hoverCloseTimerRef.current);
    }
    hoverCloseTimerRef.current = window.setTimeout(() => {
      setOpenGroup(null);
    }, 120);
  };

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/90 dark:bg-[#090d16]/90 border-b border-slate-200/80 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all"
      style={{ fontFamily: "'DM Sans', 'Hind Siliguri', sans-serif" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center gap-6">
          {/* Zone 1: Brand Logo & Wordmark (Clicking returns to Home) */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            {safeAppLogo ? (
              <img
                src={safeAppLogo}
                alt={displayAppName}
                className="h-7 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex items-center gap-1 p-1 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 group-hover:border-slate-300 dark:group-hover:border-slate-700 transition-all">
                <div className="w-2.5 h-2.5 rounded-[2px] bg-[#f97316]" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-[#e11d48]" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-[#3b82f6]" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-[#eab308]" />
              </div>
            )}
            <span className="text-base sm:text-lg font-bold tracking-tight text-slate-950 dark:text-white whitespace-nowrap">
              {displayAppName}
            </span>
          </Link>

          {/* Zone 2: Grouped Dropdown Navigation (Desktop) */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link
              to="/"
              className={cn(
                'px-3 py-2 rounded-lg text-[13.5px] font-medium transition-colors whitespace-nowrap shrink-0',
                location.pathname === '/'
                  ? 'text-slate-950 dark:text-white bg-slate-100/80 dark:bg-slate-800/70'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
              )}
            >
              {resolveText('nav.home', 'Home', 'হোম')}
            </Link>

            {groupedNav.map((group) => {
              const isExpanded = openGroup === group.id;
              const isGroupActive = group.items.some((item) => item.path === location.pathname);
              const groupTitle = resolveText(
                group.titleKey,
                group.defaultTitleEn,
                group.defaultTitleBn
              );

              return (
                <div
                  key={group.id}
                  className="relative"
                  onMouseEnter={() => handleGroupMouseEnter(group.id)}
                  onMouseLeave={handleGroupMouseLeave}
                >
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    aria-haspopup="menu"
                    onClick={() => setOpenGroup((prev) => (prev === group.id ? null : group.id))}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13.5px] font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0',
                      isExpanded || isGroupActive
                        ? 'text-slate-950 dark:text-white bg-slate-100/85 dark:bg-slate-800/70'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
                    )}
                  >
                    <span>{groupTitle}</span>
                    <ChevronDown
                      className={cn(
                        'w-3.5 h-3.5 text-slate-400 transition-transform duration-150',
                        isExpanded && 'rotate-180 text-slate-700 dark:text-slate-200'
                      )}
                    />
                  </button>

                  {isExpanded && (
                    <div
                      role="menu"
                      aria-label={groupTitle}
                      className="absolute left-0 top-full pt-2 w-[330px] z-50"
                    >
                      <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0d1320] shadow-[0_18px_48px_-16px_rgba(15,23,42,0.16)] p-2">
                        <div className="px-3 py-1.5 mb-1 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                          <span className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 font-semibold">
                            {groupTitle}
                          </span>
                          <span className="text-[10.5px] font-mono text-slate-400 dark:text-slate-500 tabular-nums">
                            {String(group.items.length).padStart(2, '0')}
                          </span>
                        </div>

                        <div className="space-y-0.5">
                          {group.items.map((item) => {
                            const Icon = item.icon;
                            const active = location.pathname === item.path;
                            const label = resolveText(
                              item.labelKey,
                              item.defaultLabelEn,
                              item.defaultLabelBn
                            );
                            const desc = resolveText(
                              item.descKey,
                              item.defaultDescEn,
                              item.defaultDescBn
                            );

                            return (
                              <Link
                                key={item.id}
                                role="menuitem"
                                to={item.path}
                                onClick={() => setOpenGroup(null)}
                                className={cn(
                                  'group/item flex items-start gap-3 px-2.5 py-2.5 rounded-lg transition-colors',
                                  active
                                    ? 'bg-slate-100/80 dark:bg-slate-800/75'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-900/70'
                                )}
                              >
                                <div
                                  className={cn(
                                    'w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors',
                                    active
                                      ? 'bg-slate-950 dark:bg-blue-600 border-slate-950 dark:border-blue-600 text-white'
                                      : 'bg-slate-50/90 dark:bg-slate-900 border-slate-200/85 dark:border-slate-800 text-slate-600 dark:text-slate-300 group-hover/item:text-blue-700 dark:group-hover/item:text-blue-400 group-hover/item:border-blue-200 dark:group-hover/item:border-blue-800'
                                  )}
                                >
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <p
                                    className={cn(
                                      'text-[13px] font-semibold leading-tight truncate',
                                      active
                                        ? 'text-slate-950 dark:text-white'
                                        : 'text-slate-900 dark:text-slate-100 group-hover/item:text-blue-700 dark:group-hover/item:text-blue-400'
                                    )}
                                  >
                                    {label}
                                  </p>
                                  <p className="text-[11.5px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5 line-clamp-1">
                                    {desc}
                                  </p>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Zone 3: Language Switcher & Auth-Aware Primary Actions */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-800 pr-3">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={cn(
                  'text-[11px] font-bold tracking-wider px-2 py-0.5 rounded transition-all cursor-pointer',
                  language === 'en'
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('bn')}
                className={cn(
                  'text-[11px] font-bold tracking-wider px-2 py-0.5 rounded transition-all cursor-pointer',
                  language === 'bn'
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                BN
              </button>
            </div>

            {user ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 bg-[#1e293b] dark:bg-blue-600 hover:bg-[#0f172a] dark:hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 active:scale-[0.99] whitespace-nowrap shrink-0"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>{isBn ? 'ড্যাশবোর্ড' : 'Dashboard'}</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
                >
                  {isBn ? 'সাইন ইন' : 'Sign in'}
                </Link>
                {globalSettings.registrationEnabled && (
                  <Link
                    to="/register"
                    className="px-4 py-2 bg-[#1e293b] dark:bg-blue-600 hover:bg-[#0f172a] dark:hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-[0.99] whitespace-nowrap shrink-0"
                  >
                    {isBn ? 'গেট স্টার্টেড' : 'Get Started'}
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              aria-expanded={isOpen}
              aria-label={isBn ? 'মেনু খুলুন বা বন্ধ করুন' : 'Toggle navigation menu'}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer with Grouped Accordions */}
      <div
        className={cn(
          'md:hidden absolute top-16 left-0 right-0 bg-white dark:bg-[#090d16] border-b border-slate-200 dark:border-slate-800 transition-all duration-200 ease-out overflow-hidden shadow-xl',
          isOpen ? 'max-h-[82vh] opacity-100 overflow-y-auto' : 'max-h-0 opacity-0 pointer-events-none'
        )}
      >
        <div className="px-4 pt-3 pb-6 space-y-3 bg-white dark:bg-[#090d16]">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className={cn(
              'block px-3 py-2 rounded-lg text-sm font-semibold transition-colors',
              location.pathname === '/'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900'
            )}
          >
            {resolveText('nav.home', 'Home', 'হোম')}
          </Link>

          <div className="space-y-1.5">
            {groupedNav.map((group) => {
              const isExpanded = mobileExpandedGroup === group.id;
              const groupTitle = resolveText(
                group.titleKey,
                group.defaultTitleEn,
                group.defaultTitleBn
              );

              return (
                <div
                  key={group.id}
                  className="rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setMobileExpandedGroup((prev) => (prev === group.id ? null : group.id))
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 dark:bg-slate-900/60 flex items-center justify-between text-xs font-mono uppercase tracking-[0.1em] font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <span>{groupTitle}</span>
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 text-slate-400 transition-transform',
                        isExpanded && 'rotate-180'
                      )}
                    />
                  </button>

                  {isExpanded && (
                    <div className="p-1.5 space-y-1 bg-white dark:bg-[#0d1320]">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const active = location.pathname === item.path;
                        const label = resolveText(
                          item.labelKey,
                          item.defaultLabelEn,
                          item.defaultLabelBn
                        );
                        const desc = resolveText(
                          item.descKey,
                          item.defaultDescEn,
                          item.defaultDescBn
                        );

                        return (
                          <Link
                            key={item.id}
                            to={item.path}
                            onClick={() => setIsOpen(false)}
                            className={cn(
                              'flex items-start gap-3 p-2.5 rounded-lg transition-colors',
                              active
                                ? 'bg-slate-100 dark:bg-slate-800'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-900'
                            )}
                          >
                            <div className="w-8 h-8 rounded-lg border border-slate-200/85 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0 mt-0.5">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-950 dark:text-white">
                                {label}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                                {desc}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile Language Switcher */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isBn ? 'ভাষা নির্বাচন:' : 'Language:'}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setLanguage('en');
                  setIsOpen(false);
                }}
                className={cn(
                  'text-[11px] font-bold px-2.5 py-1 rounded border cursor-pointer',
                  language === 'en'
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 border-slate-900 dark:border-slate-100'
                    : 'text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'
                )}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => {
                  setLanguage('bn');
                  setIsOpen(false);
                }}
                className={cn(
                  'text-[11px] font-bold px-2.5 py-1 rounded border cursor-pointer',
                  language === 'bn'
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 border-slate-900 dark:border-slate-100'
                    : 'text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'
                )}
              >
                বাংলা
              </button>
            </div>
          </div>

          {/* Mobile Auth Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5">
            {user ? (
              <Link
                to="/dashboard"
                onClick={() => setIsOpen(false)}
                className="w-full py-2.5 bg-[#1e293b] dark:bg-blue-600 hover:bg-[#0f172a] text-white rounded-lg text-center text-xs font-semibold flex items-center justify-center gap-2 shadow-sm"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>{isBn ? 'ড্যাশবোর্ড' : 'Dashboard'}</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-2 text-center text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
                >
                  {isBn ? 'সাইন ইন' : 'Sign in'}
                </Link>
                {globalSettings.registrationEnabled && (
                  <Link
                    to="/register"
                    onClick={() => setIsOpen(false)}
                    className="w-full py-2.5 bg-[#1e293b] dark:bg-blue-600 hover:bg-[#0f172a] text-white rounded-lg text-center text-xs font-semibold shadow-sm"
                  >
                    {isBn ? 'গেট স্টার্টেড' : 'Get Started'}
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
