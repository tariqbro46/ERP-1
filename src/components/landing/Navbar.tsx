import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, LayoutDashboard, Globe } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

import { useSiteContent } from '../../hooks/useSiteContent';

export const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { content: globalSettings } = useSiteContent('global', { 
    siteName: 'ERP System',
    siteNameColor: '#1e293b',
    navbarBgColor: 'rgba(241, 245, 249, 0.8)',
    navbarTextColor: '#1e293b',
    registrationEnabled: true
  });

  const navLinks = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.features'), href: '/features' },
    { name: t('nav.pricing'), href: '/pricing' },
    { name: t('nav.about'), href: '/about' },
    { name: t('nav.contact'), href: '/contact' },
  ];

  return (
    <nav 
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-border"
      style={{ backgroundColor: globalSettings.navbarBgColor }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-foreground rounded-sm flex items-center justify-center">
              <span className="text-background font-bold">{globalSettings.siteName?.charAt(0)}</span>
            </div>
            <span className="text-lg font-bold uppercase tracking-tighter" style={{ color: globalSettings.siteNameColor }}>{globalSettings.siteName}</span>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-sm font-medium transition-colors"
                style={{ color: globalSettings.navbarTextColor }}
              >
                {link.name}
              </Link>
            ))}

            {/* Language Switcher */}
            <div className="flex items-center gap-2 border-l border-border pl-4">
              <button 
                onClick={() => setLanguage('en')}
                className={cn(
                  "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded transition-all",
                  language === 'en' ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                )}
              >
                EN
              </button>
              <button 
                onClick={() => setLanguage('bn')}
                className={cn(
                  "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded transition-all",
                  language === 'bn' ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                )}
              >
                BN
              </button>
            </div>

            {user ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 bg-foreground text-background rounded-full text-sm font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                {t('nav.dashboard')}
              </Link>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  to="/login"
                  className="text-sm font-medium transition-colors"
                  style={{ color: globalSettings.navbarTextColor }}
                >
                  {t('nav.signIn')}
                </Link>
                {globalSettings.registrationEnabled && (
                  <Link
                    to="/register"
                    className="px-4 py-2 bg-foreground text-background rounded-full text-sm font-bold hover:opacity-90 transition-opacity"
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
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "md:hidden absolute top-16 left-0 right-0 bg-background border-b border-border transition-all duration-300 ease-in-out overflow-hidden",
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-4 pt-2 pb-6 space-y-4">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              onClick={() => setIsOpen(false)}
              className="block text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.name}
            </Link>
          ))}
          
          {/* Mobile Language Switcher */}
          <div className="flex items-center gap-4 pt-2">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Language:</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => { setLanguage('en'); setIsOpen(false); }}
                className={cn(
                  "text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border border-border",
                  language === 'en' ? "bg-foreground text-background" : "text-muted-foreground"
                )}
              >
                English
              </button>
              <button 
                onClick={() => { setLanguage('bn'); setIsOpen(false); }}
                className={cn(
                  "text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border border-border",
                  language === 'bn' ? "bg-foreground text-background" : "text-muted-foreground"
                )}
              >
                বাংলা
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex flex-col gap-4">
            {user ? (
              <Link
                to="/dashboard"
                onClick={() => setIsOpen(false)}
                className="w-full py-3 bg-foreground text-background rounded-xl text-center font-bold flex items-center justify-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                {t('nav.dashboard')}
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-3 text-center font-medium text-muted-foreground hover:text-foreground"
                >
                  {t('nav.signIn')}
                </Link>
                {globalSettings.registrationEnabled && (
                  <Link
                    to="/register"
                    onClick={() => setIsOpen(false)}
                    className="w-full py-3 bg-foreground text-background rounded-xl text-center font-bold"
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
