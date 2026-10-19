import React from 'react';
import { Link } from 'react-router-dom';

import { useSiteContent } from '../../hooks/useSiteContent';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';

interface FooterProps {
  isMonochrome?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ isMonochrome = false }) => {
  const { t, language } = useLanguage();
  const { content: globalSettings } = useSiteContent('global', { 
    siteName: 'TallyFlow ERP',
    siteNameColor: '#0f172a',
    footerText: `© 2026 TallyFlow ERP. All rights reserved.`,
    footerTextColor: '#64748b',
    footerBgColor: '#fafafa'
  });

  return (
    <footer className={cn(
      "border-t py-12 transition-colors",
      isMonochrome 
        ? "bg-[#090a0d] border-white/[0.06] text-neutral-400" 
        : "border-slate-100 bg-[#fafafa]"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className={cn(
                "flex items-center gap-1 p-1 rounded border shadow-xs",
                isMonochrome ? "bg-[#14151a] border-white/[0.08]" : "bg-white border-slate-200/60"
              )}>
                <div className="w-2.5 h-2.5 rounded-[2px] bg-white/90" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-neutral-400" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-neutral-600" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-neutral-800" />
              </div>
              <span className={cn(
                "text-base font-bold tracking-tight",
                isMonochrome ? "text-white" : "text-slate-900"
              )}>
                {globalSettings.siteName || 'SAPIENT ERP'}
              </span>
            </div>
            <p className={cn(
              "text-xs sm:text-sm max-w-xs leading-relaxed",
              isMonochrome ? "text-neutral-400" : "text-slate-500"
            )}>
              {t('footer.description')}
            </p>
          </div>
          
          <div>
            <h4 className={cn(
              "text-xs font-bold uppercase tracking-wider mb-4",
              isMonochrome ? "text-white" : "text-slate-900"
            )}>{t('footer.product')}</h4>
            <ul className="space-y-2">
              <li><Link to="/features" className={cn("text-xs sm:text-sm transition-colors", isMonochrome ? "text-neutral-400 hover:text-white" : "text-slate-600 hover:text-slate-900")}>{t('nav.features')}</Link></li>
              <li><Link to="/docs" className={cn("text-xs sm:text-sm transition-colors", isMonochrome ? "text-neutral-400 hover:text-white" : "text-slate-600 hover:text-slate-900")}>{language === 'bn' ? 'ডকুমেন্টেশন ও গাইড' : 'Help Documentation'}</Link></li>
              <li><Link to="/about" className={cn("text-xs sm:text-sm transition-colors", isMonochrome ? "text-neutral-400 hover:text-white" : "text-slate-600 hover:text-slate-900")}>{t('nav.about')}</Link></li>
              <li><Link to="/contact" className={cn("text-xs sm:text-sm transition-colors", isMonochrome ? "text-neutral-400 hover:text-white" : "text-slate-600 hover:text-slate-900")}>{t('nav.contact')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className={cn(
              "text-xs font-bold uppercase tracking-wider mb-4",
              isMonochrome ? "text-white" : "text-slate-900"
            )}>{t('footer.legal')}</h4>
            <ul className="space-y-2">
              <li><a href="#" className={cn("text-xs sm:text-sm transition-colors", isMonochrome ? "text-neutral-400 hover:text-white" : "text-slate-600 hover:text-slate-900")}>{t('footer.privacy')}</a></li>
              <li><a href="#" className={cn("text-xs sm:text-sm transition-colors", isMonochrome ? "text-neutral-400 hover:text-white" : "text-slate-600 hover:text-slate-900")}>{t('footer.terms')}</a></li>
            </ul>
          </div>
        </div>
        
        <div className={cn(
          "mt-12 pt-6 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-xs",
          isMonochrome ? "border-white/[0.06] text-neutral-500" : "border-slate-200/60 text-slate-400"
        )}>
          <p>
            {globalSettings.footerText || `© ${new Date().getFullYear()} SAPIENT ERP. All rights reserved.`}
          </p>
          <div className="flex gap-4">
            <span className={cn(isMonochrome ? "text-neutral-400 font-medium" : "text-slate-500 font-medium")}>Enterprise Precision</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
