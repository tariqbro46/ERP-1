import React, { useState, useEffect } from 'react';
import { erpService } from '../services/erpService';
import { 
  Save, 
  RefreshCw, 
  Palette, 
  Type, 
  Image as ImageIcon, 
  Layout, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ExternalLink, 
  Sliders, 
  MousePointer2, 
  Settings as SettingsIcon, 
  Lock,
  Layers,
  HelpCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { AUTH_TEMPLATE_OPTIONS } from './auth/AuthLayouts';
import { AuthTemplate } from '../types';
import { Login, Register } from './Auth';
import { useNotification } from '../contexts/NotificationContext';

interface PageContent {
  id: string;
  name: string;
  defaultContent: any;
}

const PAGES: PageContent[] = [
  {
    id: 'global',
    name: 'Global Settings',
    defaultContent: {
      registrationEnabled: true,
      authTemplate: 'softr',
      primaryColor: '#3b82f6',
      accentColor: '#10b981',
      siteName: 'ERP System',
      siteNameColor: '#ffffff',
      navbarBgColor: 'rgba(2, 6, 23, 0.8)',
      navbarTextColor: '#ffffff',
      footerText: '© 2026 ERP System. All rights reserved.',
      footerTextColor: '#94a3b8',
      footerBgColor: '#020617'
    }
  },
  {
    id: 'login',
    name: 'Login & Forgot Password',
    defaultContent: {
      template: 'softr',
      brandName: 'softr',
      brandLogoUrl: '',
      title: "Nice seeing you again, pal!",
      titleColor: "#0f172a",
      subtitle: "Can't wait to see what you build today",
      subtitleColor: "#64748b",
      googleButtonText: "Continue with Google",
      ssoButtonText: "Continue with SSO",
      dividerText: "OR",
      emailLabel: "Email",
      emailPlaceholder: "your@email.com",
      passwordLabel: "Password",
      passwordPlaceholder: "Password",
      forgotPasswordLinkText: "Forgot password?",
      signInButtonText: "Sign in",
      noAccountText: "Don't have an account?",
      signUpLinkText: "Sign up",
      footerCopyrightText: "© 2026 Softr Studio ERP. All rights reserved.",
      testimonialQuote: "“We have a very unique way of managing projects and collaborating — we're very process- and data-driven. With Softr, we were able to unite our project management in one platform.”",
      testimonialAuthorName: "Natalie Neumann",
      testimonialAuthorTitle: "COO, Designity",
      testimonialAuthorAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80",
      clientLogosText: "UNIVERSAL, MIT, make, Google, EvenUp, clay",
      showChatSupport: true,
      loginImage: "https://picsum.photos/seed/dribbble-login/1200/1600",
      imageTitle: "Streamline your business operations.",
      imageTitleColor: "#ffffff",
      imageSubtitle: "The most powerful ERP solution for modern enterprises.",
      imageSubtitleColor: "rgba(255,255,255,0.8)",
      forgotTitle: "Forgot password?",
      forgotTitleColor: "#0f172a",
      forgotSubtitle: "Enter your email and we'll send you a link to reset your password.",
      forgotSubtitleColor: "#64748b",
      sendResetButtonText: "Send reset link",
      cancelButtonText: "Cancel",
      resetImageTitle: "Recover your account.",
      resetImageTitleColor: "#ffffff",
      resetImageSubtitle: "Don't worry, it happens to the best of us.",
      resetImageSubtitleColor: "rgba(255,255,255,0.8)",
      resetImage: "https://picsum.photos/seed/auth-bg/1200/1600"
    }
  },
  {
    id: 'register',
    name: 'Sign Up / Register Page',
    defaultContent: {
      template: 'softr',
      brandName: 'softr',
      brandLogoUrl: '',
      title: "Start building with Softr",
      titleColor: "#0f172a",
      subtitle: "Join thousands of teams building powerful portals.",
      subtitleColor: "#64748b",
      googleButtonText: "Continue with Google",
      ssoButtonText: "Continue with SSO",
      dividerText: "OR",
      fullNameLabel: "Full Name",
      fullNamePlaceholder: "Your full name",
      emailLabel: "Email",
      emailPlaceholder: "your@email.com",
      passwordLabel: "Password",
      passwordPlaceholder: "Password (min 6 characters)",
      companyNameLabel: "Company Name",
      companyNamePlaceholder: "e.g. Acme Corp",
      sloganLabel: "Slogan",
      sloganPlaceholder: "Innovating the future",
      addressLabel: "Address",
      registerButtonText: "Create Account",
      alreadyAccountText: "Already have an account?",
      signInLinkText: "Sign in",
      footerCopyrightText: "© 2026 Softr Studio ERP. All rights reserved.",
      testimonialQuote: "“We have a very unique way of managing projects and collaborating — we're very process- and data-driven. With Softr, we were able to unite our project management in one platform.”",
      testimonialAuthorName: "Natalie Neumann",
      testimonialAuthorTitle: "COO, Designity",
      testimonialAuthorAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80",
      clientLogosText: "UNIVERSAL, MIT, make, Google, EvenUp, clay",
      showChatSupport: true,
      imageTitle: "Join the future of ERP.",
      imageTitleColor: "#ffffff",
      imageSubtitle: "Create your account and start managing your business today.",
      imageSubtitleColor: "rgba(255,255,255,0.8)",
      registerImage: "https://picsum.photos/seed/dribbble-reg/1200/1600"
    }
  },
  {
    id: 'home',
    name: 'Home Page',
    defaultContent: {
      heroTitle: "Manage Your Business With Intelligence",
      heroTitleColor: "#ffffff",
      heroSubtitle: "The all-in-one ERP solution for modern enterprises. Streamline operations, gain real-time insights, and scale your business with confidence.",
      heroSubtitleColor: "#94a3b8",
      heroCtaPrimary: "Start Free Trial",
      heroCtaPrimaryBg: "#3b82f6",
      heroCtaPrimaryText: "#ffffff",
      heroCtaSecondary: "View Features",
      heroCtaSecondaryBg: "transparent",
      heroCtaSecondaryText: "#ffffff",
      heroImage: "https://picsum.photos/seed/erp-hero/1200/800",
      heroBgColor: "#020617",
      showHero: true,
      adaptiveLoaderEnabled: true,
      skeletonLoaderEnabled: true,
      statsClients: "500+",
      statsUptime: "99.9%",
      statsSupport: "24/7",
      statsExperience: "15+",
      statsSectionBg: "#090d16",
      statsTitleColor: "#ffffff",
      statsSubtitleColor: "#64748b",
      showStats: true,
      featuresTitle: "Everything You Need",
      featuresTitleColor: "#ffffff",
      featuresSubtitle: "Powerful tools to help you manage every aspect of your business from a single, unified platform.",
      featuresSubtitleColor: "#94a3b8",
      featuresSectionBg: "#020617",
      featureCardBg: "#0b1329",
      featureCardTitleColor: "#ffffff",
      featureCardDescColor: "#94a3b8",
      showFeatures: true,
      ctaTitle: "Ready to Transform Your Business?",
      ctaTitleColor: "#ffffff",
      ctaSubtitle: "Join hundreds of successful companies already using our ERP system to power their growth.",
      ctaSubtitleColor: "rgba(255,255,255,0.7)",
      ctaSectionBg: "#020617",
      ctaButton: "Get Started Now",
      ctaButtonBg: "#ffffff",
      ctaButtonText: "#020617",
      showCta: true
    }
  },
  {
    id: 'features',
    name: 'Features Page',
    defaultContent: {
      title: "Powerful Features for Modern Business",
      titleColor: "#ffffff",
      subtitle: "Everything you need to streamline operations, boost productivity, and drive growth.",
      subtitleColor: "#94a3b8",
      bgColor: "#020617",
      cardBg: "#0b1329",
      cardTitleColor: "#ffffff",
      cardDescColor: "#94a3b8",
      featuresBadge: "ENTERPRISE GRADE",
      featuresBadgeBg: "#1e293b",
      featuresBadgeColor: "#60a5fa",
      showCategoryFilters: true,
      featuresCtaTitle: "Experience the Full Power of ERP",
      featuresCtaSubtitle: "Start your 14-day free trial today. No credit card required.",
      featuresCtaButton: "Start Free Trial",
      showFeaturesCta: true
    }
  },
  {
    id: 'pricing',
    name: 'Pricing Page',
    defaultContent: {
      title: "Simple, Transparent Pricing",
      titleColor: "#ffffff",
      subtitle: "Choose the plan that's right for your business. Upgrade or downgrade at any time.",
      subtitleColor: "#94a3b8",
      bgColor: "#020617",
      cardBg: "#0b1329",
      cardTitleColor: "#ffffff",
      cardPriceColor: "#ffffff",
      cardDescColor: "#94a3b8",
      popularBadgeText: "MOST POPULAR",
      popularBadgeBg: "#3b82f6",
      popularBadgeColor: "#ffffff",
      freePlanPrice: "Free",
      freePlanPeriod: "forever",
      basicPlanPrice: "৳2,500",
      basicPlanPeriod: "per month",
      standardPlanPrice: "৳5,000",
      standardPlanPeriod: "per month",
      goldPlanPrice: "৳10,000",
      goldPlanPeriod: "per month",
      platinumPlanPrice: "৳20,000",
      platinumPlanPeriod: "per month",
      pricingCtaTitle: "Need a Custom Solution?",
      pricingCtaSubtitle: "Contact our sales team for custom enterprise plans tailored to your specific needs.",
      pricingCtaButton: "Contact Enterprise Sales",
      showFaq: true,
      faqTitle: "Frequently Asked Questions",
      faqTitleColor: "#ffffff",
      faqSubtitle: "Have questions about our pricing? We're here to help.",
      faqSubtitleColor: "#94a3b8"
    }
  },
  {
    id: 'contact',
    name: 'Contact Page',
    defaultContent: {
      title: "Get in Touch",
      titleColor: "#ffffff",
      subtitle: "Have questions or need assistance? We'd love to hear from you. Send us a message and we'll respond as soon as possible.",
      subtitleColor: "#94a3b8",
      bgColor: "#020617",
      cardBg: "#0b1329",
      cardTitleColor: "#ffffff",
      cardTextColor: "#94a3b8",
      email: "contact@erpsystem.com",
      phone: "+880 1234-567890",
      address: "Dhaka, Bangladesh",
      businessHours: "Sunday - Thursday: 9:00 AM - 6:00 PM",
      showContactForm: true,
      formTitle: "Send us a Message",
      formTitleColor: "#ffffff",
      formSubmitButtonText: "Send Message",
      formSubmitButtonBg: "#3b82f6",
      formSubmitButtonTextColor: "#ffffff"
    }
  },
  {
    id: 'about',
    name: 'About Page',
    defaultContent: {
      title: "About Our Platform",
      titleColor: "#ffffff",
      subtitle: "Empowering businesses across Bangladesh with intelligent ERP solutions.",
      subtitleColor: "#94a3b8",
      bgColor: "#020617",
      missionTitle: "Our Mission",
      missionText: "To provide small and medium enterprises with enterprise-grade tools that are intuitive, affordable, and powerful enough to scale with their ambitions.",
      missionTitleColor: "#ffffff",
      missionTextColor: "#94a3b8",
      visionTitle: "Our Vision",
      visionText: "To be the most trusted business management platform in the region, recognized for excellence, innovation, and customer success.",
      visionTitleColor: "#ffffff",
      visionTextColor: "#94a3b8",
      statsYears: "10+",
      statsYearsLabel: "Years in Business",
      statsBusinesses: "1,000+",
      statsBusinessesLabel: "Businesses Powered",
      statsTransactions: "৳500M+",
      statsTransactionsLabel: "Transactions Managed",
      statsSupportRate: "99.8%",
      statsSupportRateLabel: "Satisfaction Rate"
    }
  }
];

export const SiteContentEditor: React.FC<{ showNotification?: (msg: string, type?: 'success' | 'error') => void }> = ({ showNotification: propShowNotification }) => {
  const notificationContext = useNotification();
  const showNotification = propShowNotification || notificationContext?.showNotification || ((msg: string) => console.log(msg));
  const [selectedPage, setSelectedPage] = useState<PageContent>(PAGES[1]); // Default to login
  const [content, setContent] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<AuthTemplate | null>(null);

  useEffect(() => {
    fetchContent();
  }, [selectedPage]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const saved = await erpService.getSiteContent(selectedPage.id);
      setContent({ ...selectedPage.defaultContent, ...saved });
    } catch (error) {
      console.error('Error fetching site content:', error);
      showNotification('Failed to load content', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await erpService.updateSiteContent(selectedPage.id, content);
      
      // If updating template on login or register, sync to global & corresponding page as well for consistent experience
      if (content.template) {
        if (selectedPage.id === 'login') {
          await erpService.updateSiteContent('register', { template: content.template });
          await erpService.updateSiteContent('global', { authTemplate: content.template });
        } else if (selectedPage.id === 'register') {
          await erpService.updateSiteContent('login', { template: content.template });
          await erpService.updateSiteContent('global', { authTemplate: content.template });
        }
      }

      showNotification('Content and text/image changes saved successfully!');
    } catch (error) {
      console.error('Error saving site content:', error);
      showNotification('Failed to save content', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset to default content?')) {
      setContent(selectedPage.defaultContent);
    }
  };

  const updateField = (key: string, value: any) => {
    setContent((prev: any) => ({ ...prev, [key]: value }));
  };

  const isAuthPage = selectedPage.id === 'login' || selectedPage.id === 'register';

  const renderInput = (key: string) => {
    if (key === 'template' || key === 'authTemplate') return null;

    const label = key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());
    
    const value = content[key];
    const isBoolean = typeof selectedPage.defaultContent[key] === 'boolean';
    const isColor = key.toLowerCase().includes('color');
    const isClientLogos = key === 'clientLogosText';
    const isImage = !isClientLogos && (key.toLowerCase().includes('image') || key.toLowerCase().includes('logo') || key.toLowerCase().includes('avatar'));
    const isLongText = isClientLogos || (typeof value === 'string' && (value.length > 80 || key.toLowerCase().includes('subtitle') || key.toLowerCase().includes('quote') || key.toLowerCase().includes('desc') || key.toLowerCase().includes('address')));

    if (isBoolean) {
      return (
        <div key={key} className="flex items-center justify-between p-3 bg-muted/20 border border-border rounded-xl">
          <div className="flex items-center gap-2">
            {value ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
            <label className="text-xs font-semibold text-foreground/95">{label}</label>
          </div>
          <button
            type="button"
            onClick={() => updateField(key, !value)}
            className={cn(
              "w-10 h-5.5 rounded-full transition-all relative shrink-0 cursor-pointer",
              value ? "bg-primary" : "bg-muted"
            )}
          >
            <div className={cn(
              "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all",
              value ? "left-5.5" : "left-0.5"
            )} />
          </button>
        </div>
      );
    }

    if (isClientLogos) {
      const parsedLogos = (value || '')
        .split(/[\n,;]+/)
        .map((i: string) => i.trim())
        .filter(Boolean);

      return (
        <div key={key} className="space-y-2 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
              <label className="text-[11px] font-bold tracking-wide text-foreground/80">
                {label} (Image URLs or Brand Names)
              </label>
            </div>
            <span className="text-[10px] text-muted-foreground">
              Comma or newline separated
            </span>
          </div>

          <textarea
            value={value || ''}
            onChange={(e) => updateField(key, e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-primary outline-none transition-all min-h-[70px] resize-y"
            placeholder="Enter comma-separated logo image URLs or names (e.g., https://example.com/logo1.svg, https://example.com/logo2.png, Google, MIT)"
          />

          {parsedLogos.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/30 border border-border/70 space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Client Logos Preview ({parsedLogos.length})
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {parsedLogos.map((item: string, idx: number) => {
                  const isUrl = 
                    item.startsWith('http://') || 
                    item.startsWith('https://') || 
                    item.startsWith('data:image/') || 
                    item.startsWith('/') ||
                    /\.(png|jpg|jpeg|svg|webp|gif|ico|avif)($|\?)/i.test(item);

                  if (isUrl) {
                    return (
                      <div key={idx} className="p-1.5 bg-white rounded border border-slate-200 flex items-center justify-center max-h-8 max-w-[100px] shadow-sm">
                        <img 
                          src={item} 
                          alt={`Logo ${idx + 1}`} 
                          className="max-h-6 max-w-full object-contain"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    );
                  }

                  return (
                    <span key={idx} className="px-2 py-1 bg-muted rounded text-[11px] font-bold text-foreground border border-border">
                      {item}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={key} className={cn("space-y-1.5", isLongText && "md:col-span-2")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {isColor ? <Palette className="w-3.5 h-3.5 text-primary/70" /> : 
             isImage ? <ImageIcon className="w-3.5 h-3.5 text-blue-500" /> :
             <Type className="w-3.5 h-3.5 text-slate-500" />}
            <label className="text-[11px] font-bold tracking-wide text-foreground/80">
              {label}
            </label>
          </div>
          {isImage && value && (
            <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[150px]">
              Active URL
            </span>
          )}
        </div>

        {isColor ? (
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={value || '#000000'}
              onChange={(e) => updateField(key, e.target.value)}
              className="w-10 h-10 rounded-lg cursor-pointer bg-background border border-border p-1 shrink-0 shadow-sm"
            />
            <input
              type="text"
              value={value || ''}
              onChange={(e) => updateField(key, e.target.value)}
              className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-primary outline-none transition-all font-mono"
              placeholder="#000000"
            />
          </div>
        ) : isImage ? (
          <div className="space-y-2">
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={value || ''}
                onChange={(e) => updateField(key, e.target.value)}
                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder={`https://... (Enter image/logo/avatar URL)`}
              />
            </div>
            {value && (
              <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 border border-border/70">
                <img 
                  src={value} 
                  alt="Preview" 
                  className="w-12 h-12 rounded-md object-cover border border-border bg-white"
                  referrerPolicy="no-referrer"
                  onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                />
                <div className="text-[11px] text-muted-foreground truncate">
                  Image Preview
                </div>
              </div>
            )}
          </div>
        ) : isLongText ? (
          <textarea
            value={value || ''}
            onChange={(e) => updateField(key, e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-primary outline-none transition-all min-h-[76px] resize-y"
            placeholder={`Enter ${label.toLowerCase()}...`}
          />
        ) : (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => updateField(key, e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-primary outline-none transition-all"
            placeholder={`Enter ${label.toLowerCase()}...`}
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar - Page Selection */}
        <div className="w-full md:w-64 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 px-2">Pages & Layouts</h3>
          {PAGES.map((page) => (
            <button
              key={page.id}
              onClick={() => setSelectedPage(page)}
              className={cn(
                "w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between cursor-pointer",
                selectedPage.id === page.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                {page.id === 'global' ? <SettingsIcon className="w-4 h-4" /> : 
                 page.id === 'login' || page.id === 'register' ? <Lock className="w-4 h-4" /> :
                 <Layout className="w-4 h-4" />}
                <span>{page.name}</span>
              </div>
              {(page.id === 'login' || page.id === 'register') && (
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                  UI/UX
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span>{selectedPage.name} Content Editor</span>
                {isAuthPage && (
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                    Live UI/UX Switcher
                  </span>
                )}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Customize every text, image, quote, author avatar, button text, and design template.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-foreground/5 rounded-lg transition-colors cursor-pointer"
                title="Reset to Default"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm cursor-pointer"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>

          <div className="p-8 space-y-8 max-h-[700px] overflow-y-auto no-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Dedicated Template Selector for Login / Register */}
                {isAuthPage && (
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-slate-50/50 dark:from-slate-900/90 dark:via-indigo-950/30 dark:to-slate-900/90 border border-blue-200/70 dark:border-blue-900/50 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <h3 className="text-sm font-bold text-foreground">Select Login & Sign-Up UI/UX Design</h3>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Choose from the available login and register page layouts. Changes will instantly apply across all users.
                        </p>
                      </div>
                      <span className="text-xs font-mono font-bold text-primary px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 shrink-0 self-start sm:self-auto">
                        Active: {content.template || 'softr'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {AUTH_TEMPLATE_OPTIONS.map((tmpl) => {
                        const isSelected = (content.template || 'softr') === tmpl.id;
                        return (
                          <div
                            key={tmpl.id}
                            onClick={() => updateField('template', tmpl.id)}
                            className={cn(
                              "relative group p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between text-left",
                              isSelected 
                                ? "bg-card border-primary shadow-md ring-2 ring-primary/20" 
                                : "bg-card/70 hover:bg-card border-border hover:border-primary/50"
                            )}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className={cn(
                                  "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                                  tmpl.badge === 'Softr Studio 1:1' ? "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400 font-extrabold" :
                                  tmpl.badge === 'Clean Minimal' ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400" :
                                  "bg-muted border-border text-muted-foreground"
                                )}>
                                  {tmpl.badge}
                                </span>

                                {isSelected && (
                                  <div className="flex items-center gap-1 text-primary text-xs font-bold">
                                    <CheckCircle2 className="w-4 h-4 fill-primary text-white" />
                                    <span>Active</span>
                                  </div>
                                )}
                              </div>

                              <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                                {tmpl.name}
                              </h4>
                              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                                {tmpl.description}
                              </p>
                            </div>

                            <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewTemplate(tmpl.id);
                                }}
                                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Preview Live</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateField('template', tmpl.id);
                                }}
                                className={cn(
                                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                                  isSelected 
                                    ? "bg-primary text-primary-foreground" 
                                    : "bg-muted text-muted-foreground hover:text-foreground"
                                )}
                              >
                                {isSelected ? 'Selected' : 'Use Design'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Content fields */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-2">
                      <Sliders className="w-3.5 h-3.5 text-primary" />
                      Text, Images, Logos & Overrides
                    </h3>
                    <span className="text-[11px] text-muted-foreground">
                      {Object.keys(selectedPage.defaultContent).length} customizable items
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    {Object.keys(selectedPage.defaultContent).map((key) => renderInput(key))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Live Preview Tip */}
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-start gap-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <MousePointer2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-primary mb-1">Founder UI/UX Customization</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            All text, headers, images, testimonials, and layout choices configured here update in real-time across both <strong>/login</strong>, <strong>/register</strong>, and <strong>Forgot Password</strong> pages for all users.
          </p>
        </div>
      </div>

      {/* Live Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-5xl h-[85vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-border">
            {/* Modal Top Bar */}
            <div className="p-4 bg-card border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-bold text-sm">Design Preview:</span>
                <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                  {AUTH_TEMPLATE_OPTIONS.find(t => t.id === previewTemplate)?.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    updateField('template', previewTemplate);
                    setPreviewTemplate(null);
                    showNotification(`Applied ${previewTemplate} template! Click Save Changes to store.`);
                  }}
                  className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Apply This Design
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTemplate(null)}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content - Live interactive preview */}
            <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-950">
              {selectedPage.id === 'register' ? (
                <Register onToggle={() => {}} overrideTemplate={previewTemplate} />
              ) : (
                <Login onToggle={() => {}} overrideTemplate={previewTemplate} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
