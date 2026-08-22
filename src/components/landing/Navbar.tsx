import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, LayoutDashboard } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSiteContent } from '../../hooks/useSiteContent';

export const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { content: globalSettings } = useSiteContent('global', { 
    siteName: 'TallyFlow ERP',
    siteNameColor: '#0f172a',
    navbarBgColor: 'rgba(255, 255, 255, 0.85)',
    navbarTextColor: '#475569',
    registrationEnabled: true
  });

  const navLinks = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.features'), href: '/features' },
    { name: t('nav.pricing'), href: '/pricing' },
    { name: language === 'bn' ? 'ডকুমেন্টেশন' : 'Docs', href: '/docs' },
    { name: t('nav.about'), href: '/about' },
    { name: t('nav.contact'), href: '/contact' },
  ];

  return (
    <nav 
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/85 border-b border-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Colorful TallyFlow ERP Logo matching Login Page */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex items-center gap-1 p-1 rounded bg-slate-50 border border-slate-100 group-hover:border-slate-200 transition-all">
              <div className="w-2.5 h-2.5 rounded-[2px] bg-[#f97316]" />
              <div className="w-2.5 h-2.5 rounded-[2px] bg-[#e11d48]" />
              <div className="w-2.5 h-2.5 rounded-[2px] bg-[#3b82f6]" />
              <div className="w-2.5 h-2.5 rounded-[2px] bg-[#eab308]" />
            </div>
            <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
              {globalSettings.siteName || "TallyFlow ERP"}
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-[13.5px] font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                {link.name}
              </Link>
            ))}

            {/* Language Switcher */}
            <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
              <button 
                onClick={() => setLanguage('en')}
                className={cn(
                  "text-[11px] font-bold tracking-wider px-2 py-0.5 rounded transition-all cursor-pointer",
                  language === 'en' 
                    ? "bg-slate-900 text-white shadow-xs" 
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                )}
              >
                EN
              </button>
              <button 
                onClick={() => setLanguage('bn')}
                className={cn(
                  "text-[11px] font-bold tracking-wider px-2 py-0.5 rounded transition-all cursor-pointer",
                  language === 'bn' 
                    ? "bg-slate-900 text-white shadow-xs" 
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                )}
              >
                BN
              </button>
            </div>

            {user ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 bg-[#1e293b] hover:bg-[#0f172a] text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 active:scale-[0.99]"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                {t('nav.dashboard')}
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                >
                  {t('nav.signIn')}
                </Link>
                {globalSettings.registrationEnabled && (
                  <Link
                    to="/register"
                    className="px-4 py-2 bg-[#1e293b] hover:bg-[#0f172a] text-white rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-[0.99]"
                  >
                    {t('nav.getStarted')}
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "md:hidden absolute top-16 left-0 right-0 bg-white border-b border-slate-200 transition-all duration-300 ease-in-out overflow-hidden shadow-lg",
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-5 pt-3 pb-6 space-y-3 bg-white">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              onClick={() => setIsOpen(false)}
              className="block text-sm font-medium text-slate-700 hover:text-slate-900 py-1.5 transition-colors"
            >
              {link.name}
            </Link>
          ))}
          
          {/* Mobile Language Switcher */}
          <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-500">Language:</span>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => { setLanguage('en'); setIsOpen(false); }}
                className={cn(
                  "text-[11px] font-bold px-2.5 py-1 rounded border",
                  language === 'en' 
                    ? "bg-slate-900 text-white border-slate-900" 
                    : "text-slate-600 border-slate-200 bg-slate-50"
                )}
              >
                English
              </button>
              <button 
                onClick={() => { setLanguage('bn'); setIsOpen(false); }}
                className={cn(
                  "text-[11px] font-bold px-2.5 py-1 rounded border",
                  language === 'bn' 
                    ? "bg-slate-900 text-white border-slate-900" 
                    : "text-slate-600 border-slate-200 bg-slate-50"
                )}
              >
                বাংলা
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
            {user ? (
              <Link
                to="/dashboard"
                onClick={() => setIsOpen(false)}
                className="w-full py-2.5 bg-[#1e293b] hover:bg-[#0f172a] text-white rounded-lg text-center text-xs font-semibold flex items-center justify-center gap-2 shadow-sm"
              >
                <LayoutDashboard className="w-4 h-4" />
                {t('nav.dashboard')}
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-2 text-center text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg bg-white"
                >
                  {t('nav.signIn')}
                </Link>
                {globalSettings.registrationEnabled && (
                  <Link
                    to="/register"
                    onClick={() => setIsOpen(false)}
                    className="w-full py-2.5 bg-[#1e293b] hover:bg-[#0f172a] text-white rounded-lg text-center text-xs font-semibold shadow-sm"
                  >
                    {t('nav.getStarted')}
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
