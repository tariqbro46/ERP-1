import React from 'react';
import { Navbar } from '../../components/landing/Navbar';
import { Footer } from '../../components/landing/Footer';
import { 
  BarChart3, 
  Shield, 
  Zap, 
  Users, 
  CheckCircle2,
  Database,
  Printer,
  Cpu,
  FileText,
  TrendingUp,
  Activity,
  Globe,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';
import { useSiteContent } from '../../hooks/useSiteContent';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';

const DEFAULT_CONTENT = {
  title: "Powerful Features for Modern Enterprises",
  titleColor: "#0a0a0a",
  subtitle: "Explore the comprehensive suite of tools designed to help your business operate more efficiently and grow faster.",
  subtitleColor: "#64748b",
  pageBgColor: "#ffffff",
  cardBgColor: "#f5f5f5",
  cardTitleColor: "#0a0a0a",
  cardDescColor: "#64748b",
  feature1Title: "Financial Management",
  feature1Desc: "Complete control over your finances with real-time reporting, automated bookkeeping, and advanced analytics.",
  feature1Image: "https://picsum.photos/seed/erp-finance-dashboard/1200/800",
  feature2Title: "Inventory & Warehouse",
  feature2Desc: "Manage your stock levels across multiple locations, optimize reordering, and track every item in your supply chain.",
  feature2Image: "https://picsum.photos/seed/erp-inventory-stock/1200/800",
  feature3Title: "Production & Manufacturing",
  feature3Desc: "Streamline your manufacturing process from order to delivery with integrated production planning and machine management.",
  feature3Image: "https://picsum.photos/seed/erp-production-line/1200/800",
  feature4Title: "Payroll & HR",
  feature4Desc: "Manage your most valuable asset—your people. Handle payroll, attendance, and employee records in one place.",
  feature4Image: "https://picsum.photos/seed/erp-payroll-hr/1200/800",
  moreTitle: "And Much More",
  moreSubtitle: "Every detail considered for your business success.",
  showMore: true
};

export const Features = () => {
  const { t } = useLanguage();
  const { appFeatures } = useSettings();
  const DEFAULT_CONTENT = {
    title: t('features.title'),
    titleColor: "#1e293b",
    subtitle: t('features.subtitle'),
    subtitleColor: "#334155",
    pageBgColor: "#f1f5f9",
    cardBgColor: "#ffffff",
    cardTitleColor: "#1e293b",
    cardDescColor: "#334155",
    feature1Title: t('features.feature1Title'),
    feature1Desc: t('features.feature1Desc'),
    feature1Image: "https://picsum.photos/seed/erp-finance-dashboard/1200/800",
    feature2Title: t('features.feature2Title'),
    feature2Desc: t('features.feature2Desc'),
    feature2Image: "https://picsum.photos/seed/erp-inventory-stock/1200/800",
    feature3Title: t('features.feature3Title'),
    feature3Desc: t('features.feature3Desc'),
    feature3Image: "https://picsum.photos/seed/erp-production-line/1200/800",
    feature4Title: t('features.feature4Title'),
    feature4Desc: t('features.feature4Desc'),
    feature4Image: "https://picsum.photos/seed/erp-payroll-hr/1200/800",
    moreTitle: t('features.moreTitle'),
    moreSubtitle: t('features.moreSubtitle'),
    showMore: true
  };

  const { content } = useSiteContent('features', DEFAULT_CONTENT);

  const features = [
    {
      title: content.feature1Title,
      desc: content.feature1Desc,
      icon: BarChart3,
      image: content.feature1Image,
      details: [
        t('features.feature1Detail1'),
        t('features.feature1Detail2'),
        t('features.feature1Detail3'),
        t('features.feature1Detail4')
      ]
    },
    {
      title: content.feature2Title,
      desc: content.feature2Desc,
      icon: Database,
      image: content.feature2Image,
      details: [
        t('features.feature2Detail1'),
        t('features.feature2Detail2'),
        t('features.feature2Detail3'),
        t('features.feature2Detail4')
      ]
    },
    {
      title: content.feature3Title,
      desc: content.feature3Desc,
      icon: Cpu,
      image: content.feature3Image,
      details: [
        t('features.feature3Detail1'),
        t('features.feature3Detail2'),
        t('features.feature3Detail3'),
        t('features.feature3Detail4')
      ]
    },
    {
      title: content.feature4Title,
      desc: content.feature4Desc,
      icon: Users,
      image: content.feature4Image,
      details: [
        t('features.feature4Detail1'),
        t('features.feature4Detail2'),
        t('features.feature4Detail3'),
        t('features.feature4Detail4')
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: content.pageBgColor }}>
      <Navbar />
      
      <main className="flex-1 pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <h1 
              className="text-4xl md:text-6xl font-bold tracking-tight mb-6 whitespace-pre-line"
              style={{ color: content.titleColor }}
            >
              {content.title}
            </h1>
            <p 
              className="text-xl max-w-2xl mx-auto"
              style={{ color: content.subtitleColor }}
            >
              {content.subtitle}
            </p>
          </div>

          <div className="space-y-32 mb-32">
            {features.map((feature, i) => (
              <div 
                key={i} 
                className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-12 items-center`}
              >
                <div className="flex-1 space-y-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <feature.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold" style={{ color: content.cardTitleColor }}>{feature.title}</h2>
                  <p className="text-lg leading-relaxed" style={{ color: content.cardDescColor }}>
                    {feature.desc}
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {feature.details.map((detail, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm font-medium" style={{ color: content.cardDescColor }}>
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1 w-full">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="relative rounded-3xl overflow-hidden shadow-2xl border border-border aspect-video"
                  >
                    <img 
                      src={feature.image} 
                      alt={feature.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </motion.div>
                </div>
              </div>
            ))}
          </div>

          {content.showMore && (
            <div className="py-24 border-t border-border">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4" style={{ color: content.titleColor }}>{content.moreTitle}</h2>
                <p style={{ color: content.subtitleColor }}>{content.moreSubtitle}</p>
              </div>
              <div className="space-y-16">
                {appFeatures.map((category) => (
                  <div key={category.id} className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="h-[1px] flex-1 bg-border/50" />
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 whitespace-nowrap">
                        {category.label}
                      </h3>
                      <div className="h-[1px] flex-1 bg-border/50" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {category.features.map((feature) => (
                        <div 
                          key={feature.id} 
                          className="group relative p-6 border border-border rounded-2xl hover:border-primary/50 transition-all hover:translate-y-[-4px]" 
                          style={{ backgroundColor: content.cardBgColor }}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <Zap className="w-5 h-5 text-primary opacity-50" />
                            {feature.description && (
                              <div className="relative group/info">
                                <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help hover:text-primary transition-colors" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-popover text-popover-foreground text-[10px] font-medium leading-relaxed rounded-xl shadow-2xl border border-border opacity-0 group-hover/info:opacity-100 pointer-events-none transition-all z-10">
                                  {feature.description}
                                </div>
                              </div>
                            )}
                          </div>
                          <h4 className="text-sm font-bold mb-1 uppercase tracking-wider" style={{ color: content.cardTitleColor }}>{feature.label}</h4>
                          <span className="text-[8px] font-mono text-muted-foreground uppercase opacity-40">Feature ID: {feature.id}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

