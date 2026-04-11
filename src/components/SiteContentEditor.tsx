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
      footerText: '© 2026 ERP System. All rights reserved.'
    }
  },
  {
    id: 'home',
    name: 'Home Page',
    defaultContent: {
      heroTitle: "Manage Your Business With Intelligence",
      heroTitleColor: "#0a0a0a",
      heroSubtitle: "The all-in-one ERP solution for modern enterprises. Streamline operations, gain real-time insights, and scale your business with confidence.",
      heroSubtitleColor: "#64748b",
      heroCtaPrimary: "Start Free Trial",
      heroCtaSecondary: "View Features",
      heroImage: "https://picsum.photos/seed/erp-hero/1200/800",
      heroBgColor: "#ffffff",
      showHero: true,
      statsClients: "500+",
      statsUptime: "99.9%",
      statsSupport: "24/7",
      statsExperience: "15+",
      showStats: true,
      featuresTitle: "Everything You Need",
      featuresTitleColor: "#0a0a0a",
      featuresSubtitle: "Powerful tools to help you manage every aspect of your business from a single, unified platform.",
      featuresSubtitleColor: "#64748b",
      showFeatures: true,
      ctaTitle: "Ready to Transform Your Business?",
      ctaTitleColor: "#ffffff",
      ctaSubtitle: "Join hundreds of successful companies already using our ERP system to power their growth.",
      ctaSubtitleColor: "rgba(255,255,255,0.7)",
      ctaButton: "Get Started Now",
      showCta: true
    }
  },
  {
    id: 'features',
    name: 'Features Page',
    defaultContent: {
      title: "Powerful Features for Modern Enterprises",
      titleColor: "#0a0a0a",
      subtitle: "Explore the comprehensive suite of tools designed to help your business operate more efficiently and grow faster.",
      subtitleColor: "#64748b",
      bgColor: "#f8fafc",
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
      missionTitleColor: "#0a0a0a",
      missionDesc: "We are dedicated to empowering businesses of all sizes with the tools they need to thrive in a digital-first world. Our goal is to simplify complex operations and provide clarity through intelligent data.",
      missionDescColor: "#64748b",
      missionImage: "https://picsum.photos/seed/mission/1200/600",
      bannerTitle: "Built for Business",
      bannerTitleColor: "#ffffff",
      bannerSubtitle: "Founded in 2010, serving over 500+ companies worldwide.",
      bannerSubtitleColor: "rgba(255,255,255,0.8)",
      leadershipTitle: "Our Leadership",
      leadershipTitleColor: "#0a0a0a",
      showLeadership: true
    }
  },
  {
    id: 'contact',
    name: 'Contact Page',
    defaultContent: {
      title: "Get in Touch",
      titleColor: "#0a0a0a",
      subtitle: "Have questions? We're here to help. Send us a message and our team will get back to you within 24 hours.",
      subtitleColor: "#64748b",
      bgColor: "#ffffff",
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
      setContent(saved || selectedPage.defaultContent);
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
        <div key={key} className="flex items-center justify-between p-4 bg-background border border-border rounded-xl">
          <div className="flex items-center gap-3">
            {value ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
            <label className="text-sm font-medium">{label}</label>
          </div>
          <button
            onClick={() => updateField(key, !value)}
            className={cn(
              "w-12 h-6 rounded-full transition-all relative",
              value ? "bg-primary" : "bg-muted"
            )}
          >
            <div className={cn(
              "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
              value ? "left-7" : "left-1"
            )} />
          </button>
        </div>
      );
    }

    return (
      <div key={key} className="space-y-3">
        <div className="flex items-center gap-2">
          {isColor ? <Palette className="w-4 h-4 text-primary/60" /> : 
           isImage ? <ImageIcon className="w-4 h-4 text-primary/60" /> :
           <Type className="w-4 h-4 text-primary/60" />}
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {label}
          </label>
        </div>
        {isColor ? (
          <div className="flex gap-3">
            <input
              type="color"
              value={value || '#ffffff'}
              onChange={(e) => updateField(key, e.target.value)}
              className="w-12 h-12 rounded-lg cursor-pointer bg-background border border-border p-1"
            />
            <input
              type="text"
              value={value || ''}
              onChange={(e) => updateField(key, e.target.value)}
              className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all font-mono"
              placeholder="#ffffff"
            />
          </div>
        ) : isLongText ? (
          <textarea
            value={value || ''}
            onChange={(e) => updateField(key, e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all min-h-[100px] resize-none"
            placeholder={`Enter ${label.toLowerCase()}...`}
          />
        ) : (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => updateField(key, e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
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
              <div className="grid grid-cols-1 gap-8">
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
