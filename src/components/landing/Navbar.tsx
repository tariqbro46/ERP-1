import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, LayoutDashboard, Globe, Sun, Moon } from 'lucide-react';
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

  const [landingTheme, setLandingTheme] = React.useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('landing_theme') as 'dark' | 'light') || 'dark';
  });

  const toggleLandingTheme = () => {
    const newTheme = landingTheme === 'dark' ? 'light' : 'dark';
    setLandingTheme(newTheme);
    localStorage.setItem('landing_theme', newTheme);
    window.dispatchEvent(new Event('landing_theme_changed'));
  };

  const navLinks = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.features'), href: '/features' },
    { name: t('nav.pricing'), href: '/pricing' },
    { name: t('nav.about'), href: '/about' },
    { name: t('nav.contact'), href: '/contact' },
  ];

  const activeNavbarBg = landingTheme === 'dark' ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)';
  const activeNavbarText = landingTheme === 'dark' ? '#f1f5f9' : '#0f172a';
  const activeSiteNameColor = landingTheme === 'dark' ? '#ffffff' : '#0f172a';

  return (
    <nav 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b",
        landingTheme === 'dark' ? "border-slate-900 bg-slate-950/80" : "border-slate-200 bg-white/80"
      )}
      style={{ backgroundColor: activeNavbarBg }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-sm flex items-center justify-center",
              landingTheme === 'dark' ? "bg-white" : "bg-slate-900"
            )}>
              <span className={cn(
                "font-bold",
                landingTheme === 'dark' ? "text-slate-950" : "text-white"
              )}>{globalSettings.siteName?.charAt(0)}</span>
            </div>
            <span className="text-lg font-bold uppercase tracking-tighter" style={{ color: activeSiteNameColor }}>{globalSettings.siteName}</span>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-sm font-semibold transition-colors hover:opacity-85"
                style={{ color: activeNavbarText }}
              >
                {link.name}
              </Link>
            ))}

            {/* Landing Hero Theme Switcher */}
            <button
              onClick={toggleLandingTheme}
              className={cn(
                "p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center overflow-hidden active:scale-95",
                landingTheme === 'dark' 
                  ? "border-slate-800 bg-slate-900/40 text-rose-400 hover:text-white" 
                  : "border-slate-200 bg-slate-100/60 text-indigo-600 hover:text-indigo-900"
              )}
              title="Toggle Hero Theme (Light/Dark)"
            >
              {landingTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Language Switcher */}
            <div className={cn(
              "flex items-center gap-1.5 border-l pl-4",
              landingTheme === 'dark' ? "border-slate-800" : "border-slate-200"
            )}>
              <button 
                onClick={() => setLanguage('en')}
                className={cn(
                  "text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md transition-all cursor-pointer",
                  language === 'en' 
                    ? (landingTheme === 'dark' ? "bg-white text-slate-950" : "bg-slate-950 text-white") 
                    : (landingTheme === 'dark' ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-950")
                )}
              >
                EN
              </button>
              <button 
                onClick={() => setLanguage('bn')}
                className={cn(
                  "text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md transition-all cursor-pointer",
                  language === 'bn' 
                    ? (landingTheme === 'dark' ? "bg-white text-slate-950" : "bg-slate-950 text-white") 
                    : (landingTheme === 'dark' ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-950")
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
          "md:hidden absolute top-16 left-0 right-0 transition-all duration-300 ease-in-out overflow-hidden border-b",
          landingTheme === 'dark' ? "bg-slate-950 border-slate-900" : "bg-white border-slate-200",
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-4 pt-2 pb-6 space-y-4">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "block text-base font-semibold transition-colors",
                landingTheme === 'dark' ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-950"
              )}
            >
              {link.name}
            </Link>
          ))}
          
          {/* Mobile Theme Switcher */}
          <div className={cn(
            "flex items-center justify-between pt-3 border-t",
            landingTheme === 'dark' ? "border-slate-900" : "border-slate-200"
          )}>
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Theme Mode:</span>
            <button 
              onClick={() => { toggleLandingTheme(); setIsOpen(false); }}
              className={cn(
                "text-[10px] font-bold uppercase tracking-[0.1em] px-3.5 py-1.5 rounded-lg border flex items-center gap-2 cursor-pointer active:scale-95",
                landingTheme === 'dark' 
                  ? "border-slate-800 bg-slate-900/60 text-rose-400" 
                  : "border-slate-200 bg-slate-100 text-indigo-600"
              )}
            >
              {landingTheme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-rose-400" /> Light Theme
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-500" /> Dark Theme
                </>
              )}
            </button>
          </div>

          {/* Mobile Language Switcher */}
          <div className={cn(
            "flex items-center justify-between pt-3 border-t",
            landingTheme === 'dark' ? "border-slate-900" : "border-slate-200"
          )}>
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground font-sans">Language:</span>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => { setLanguage('en'); setIsOpen(false); }}
                className={cn(
                  "text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border cursor-pointer",
                  language === 'en' 
                    ? (landingTheme === 'dark' ? "bg-white text-slate-950 border-white" : "bg-slate-950 text-white border-slate-950") 
                    : "text-muted-foreground border-border"
                )}
              >
                English
              </button>
              <button 
                onClick={() => { setLanguage('bn'); setIsOpen(false); }}
                className={cn(
                  "text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border cursor-pointer",
                  language === 'bn' 
                    ? (landingTheme === 'dark' ? "bg-white text-slate-950 border-white" : "bg-slate-950 text-white border-slate-950") 
                    : "text-muted-foreground border-border"
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
