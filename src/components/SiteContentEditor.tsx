import React, { useState, useEffect } from 'react';
import { erpService } from '../services/erpService';
import { useNotification } from '../contexts/NotificationContext';
import { Save, RefreshCw, Layout, Type, Image as ImageIcon, MousePointer2, Eye, EyeOff, Palette, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '../lib/utils';

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
      primaryColor: '#3b82f6',
      accentColor: '#10b981',
      siteName: 'ERP System',
      siteNameColor: '#0a0a0a',
      navbarBgColor: 'rgba(255, 255, 255, 0.8)',
      navbarTextColor: '#0a0a0a',
      footerText: '© 2026 ERP System. All rights reserved.',
      footerTextColor: '#64748b',
      footerBgColor: '#ffffff'
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
      title: "Powerful Features for Modern Enterprises",
      titleColor: "#ffffff",
      subtitle: "Explore the comprehensive suite of tools designed to help your business operate more efficiently and grow faster.",
      subtitleColor: "#94a3b8",
      pageBgColor: "#020617",
      cardBgColor: "#0b1329",
      cardTitleColor: "#ffffff",
      cardDescColor: "#94a3b8",
      feature1Title: "Financial Management",
      feature1Desc: "Complete control over your finances with real-time reporting, automated bookkeeping, and advanced analytics.",
      feature1Image: "https://picsum.photos/seed/finance/800/600",
      feature2Title: "Inventory & Warehouse",
      feature2Desc: "Manage your stock levels across multiple locations, optimize reordering, and track every item in your supply chain.",
      feature2Image: "https://picsum.photos/seed/inventory/800/600",
      feature3Title: "Production & Manufacturing",
      feature3Desc: "Streamline your manufacturing process from order to delivery with integrated production planning and machine management.",
      feature3Image: "https://picsum.photos/seed/production/800/600",
      feature4Title: "Payroll & HR",
      feature4Desc: "Manage your most valuable asset—your people. Handle payroll, attendance, and employee records in one place.",
      feature4Image: "https://picsum.photos/seed/payroll/800/600",
      moreTitle: "And Much More",
      moreSubtitle: "Every detail considered for your business success.",
      showMore: true
    }
  },
  {
    id: 'about',
    name: 'About Page',
    defaultContent: {
      missionTitle: "Our Mission",
      missionTitleColor: "#ffffff",
      missionDesc: "We are dedicated to empowering businesses of all sizes with the tools they need to thrive in a digital-first world. Our goal is to simplify complex operations and provide clarity through intelligent data.",
      missionDescColor: "#94a3b8",
      missionBgColor: "#0f172a",
      missionImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
      bannerTitle: "Built for Business",
      bannerTitleColor: "#ffffff",
      bannerSubtitle: "Founded in 2026, serving over 500+ companies worldwide.",
      bannerSubtitleColor: "rgba(244,244,244,0.8)",
      bannerBgColor: "#020617",
      pageBgColor: "#020617",
      // Core Values Data
      value1Title: "Operational Clarity",
      value1Desc: "We build intuitive interfaces allowing rapid understanding over double entry finances in milliseconds.",
      value2Title: "Enterprise Growth",
      value2Desc: "Supporting scaling ventures across multi-godown networks without performance compromises.",
      value3Title: "Global Alignment",
      value3Desc: "Engineered for international statutory regulations with support for multi-currency transactions.",
      value4Title: "Uncompromised Trust",
      value4Desc: "Rigid compliance rules with role-based permissions preventing leakages and tracking actions.",
      // Leadership Section
      leadershipTitle: "Our Leadership Team",
      leadershipTitleColor: "#ffffff",
      showLeadership: true,
      leader1Name: "John Doe",
      leader1Role: "Chief Executive Officer",
      leader1Img: "https://api.dicebear.com/7.x/micah/svg?seed=John&backgroundType=gradientLinear&backgroundRotation=140",
      leader2Name: "Jane Smith",
      leader2Role: "Chief Technology Officer",
      leader2Img: "https://api.dicebear.com/7.x/micah/svg?seed=Jane&backgroundType=gradientLinear&backgroundRotation=140",
      leader3Name: "Mike Johnson",
      leader3Role: "VP Product",
      leader3Img: "https://api.dicebear.com/7.x/micah/svg?seed=Mike&backgroundType=gradientLinear&backgroundRotation=140"
    }
  },
  {
    id: 'contact',
    name: 'Contact Page',
    defaultContent: {
      title: "Get in Touch",
      titleColor: "#ffffff",
      subtitle: "Have questions? We're here to help. Send us a message and our team will get back to you within 24 hours.",
      subtitleColor: "#94a3b8",
      pageBgColor: "#020617",
      formBgColor: "#0f172a",
      formTitleColor: "#ffffff",
      formSubtitleColor: "#94a3b8",
      inputBgColor: "#090d16",
      inputTextColor: "#ffffff",
      buttonBgColor: "#2563eb",
      buttonTextColor: "#ffffff",
      emailLabel: "Email Us",
      email1: "support@erpsystem.com",
      email2: "sales@erpsystem.com",
      phoneLabel: "Call Us",
      phone1: "+1 (555) 123-4567",
      phone2: "Mon-Fri, 9am-6pm EST",
      addressLabel: "Visit Our Office",
      addressLine1: "123 Business Avenue, Suite 500",
      addressLine2: "Silicon Valley, CA 94025",
      addressLine3: "United States"
    }
  },
  {
    id: 'login',
    name: 'Login Page',
    defaultContent: {
      title: "Sign in to ERP System",
      titleColor: "#0a0a0a",
      subtitle: "Enter your details below to access your account.",
      subtitleColor: "#64748b",
      imageTitle: "Streamline your business operations.",
      imageTitleColor: "#ffffff",
      imageSubtitle: "The most powerful ERP solution for modern enterprises.",
      imageSubtitleColor: "rgba(255,255,255,0.8)",
      loginImage: "https://picsum.photos/seed/dribbble-login/1200/1600",
      forgotTitle: "Forgot Password?",
      forgotTitleColor: "#0a0a0a",
      forgotSubtitle: "Enter your email and we'll send you a link to reset your password.",
      forgotSubtitleColor: "#64748b",
      resetImageTitle: "Recover your account.",
      resetImageTitleColor: "#ffffff",
      resetImageSubtitle: "Don't worry, it happens to the best of us.",
      resetImageSubtitleColor: "rgba(255,255,255,0.8)",
      resetImage: "https://picsum.photos/seed/auth-bg/1200/1600"
    }
  },
  {
    id: 'register',
    name: 'Register Page',
    defaultContent: {
      title: "Create your Account",
      titleColor: "#0a0a0a",
      imageTitle: "Join the future of ERP.",
      imageTitleColor: "#ffffff",
      imageSubtitle: "Create your account and start managing your business today.",
      imageSubtitleColor: "rgba(255,255,255,0.8)",
      registerImage: "https://picsum.photos/seed/dribbble-reg/1200/1600"
    }
  }
];

export function SiteContentEditor() {
  const [selectedPage, setSelectedPage] = useState(PAGES[0]);
  const [content, setContent] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showNotification } = useNotification();

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
      showNotification('Content updated successfully');
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

  const renderInput = (key: string) => {
    const label = key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());
    
    const value = content[key];
    const isBoolean = typeof selectedPage.defaultContent[key] === 'boolean';
    const isColor = key.toLowerCase().includes('color');
    const isImage = key.toLowerCase().includes('image');
    const isLongText = typeof value === 'string' && (value.length > 100 || key.toLowerCase().includes('subtitle') || key.toLowerCase().includes('desc'));

    if (isBoolean) {
      return (
        <div key={key} className="flex items-center justify-between p-2.5 px-3 bg-muted/10 border border-border rounded-lg h-[52px]">
          <div className="flex items-center gap-2">
            {value ? <Eye className="w-3.5 h-3.5 text-primary" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />}
            <label className="text-xs font-semibold text-foreground/95">{label}</label>
          </div>
          <button
            onClick={() => updateField(key, !value)}
            className={cn(
              "w-10 h-5.5 rounded-full transition-all relative shrink-0",
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

    return (
      <div key={key} className={cn("space-y-1.5", isLongText && "md:col-span-2")}>
        <div className="flex items-center gap-1.5">
          {isColor ? <Palette className="w-3.5 h-3.5 text-primary/60" /> : 
           isImage ? <ImageIcon className="w-3.5 h-3.5 text-primary/60" /> :
           <Type className="w-3.5 h-3.5 text-primary/60" />}
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {label}
          </label>
        </div>
        {isColor ? (
          <div className="flex gap-2">
            <input
              type="color"
              value={value || '#ffffff'}
              onChange={(e) => updateField(key, e.target.value)}
              className="w-9 h-9 rounded-md cursor-pointer bg-background border border-border p-0.5 shrink-0"
            />
            <input
              type="text"
              value={value || ''}
              onChange={(e) => updateField(key, e.target.value)}
              className="flex-1 bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-primary outline-none transition-all font-mono"
              placeholder="#ffffff"
            />
          </div>
        ) : isLongText ? (
          <textarea
            value={value || ''}
            onChange={(e) => updateField(key, e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-xs focus:ring-2 focus:ring-primary outline-none transition-all min-h-[72px] resize-y"
            placeholder={`Enter ${label.toLowerCase()}...`}
          />
        ) : (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => updateField(key, e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-xs focus:ring-2 focus:ring-primary outline-none transition-all"
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
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 px-2">Pages</h3>
          {PAGES.map((page) => (
            <button
              key={page.id}
              onClick={() => setSelectedPage(page)}
              className={cn(
                "w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-3",
                selectedPage.id === page.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {page.id === 'global' ? <SettingsIcon className="w-4 h-4" /> : <Layout className="w-4 h-4" />}
              {page.name}
            </button>
          ))}
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
            <div>
              <h2 className="text-lg font-bold">{selectedPage.name} Editor</h2>
              <p className="text-xs text-muted-foreground">Customize the {selectedPage.name.toLowerCase()} content and appearance.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-foreground/5 rounded-lg transition-colors"
                title="Reset to Default"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>

          <div className="p-8 space-y-8 max-h-[600px] overflow-y-auto no-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {Object.keys(selectedPage.defaultContent).map((key) => renderInput(key))}
              </div>
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
          <h4 className="text-sm font-bold text-primary mb-1">Live Preview Tip</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Changes saved here will reflect instantly on the public pages. You can open the site in a new tab to see the live updates as you save.
          </p>
        </div>
      </div>
    </div>
  );
}
