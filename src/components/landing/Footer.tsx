import React from 'react';
import { Link } from 'react-router-dom';

import { useSiteContent } from '../../hooks/useSiteContent';
import { useLanguage } from '../../contexts/LanguageContext';

export const Footer = () => {
  const { t } = useLanguage();
  const { content: globalSettings } = useSiteContent('global', { 
    siteName: 'TallyFlow ERP',
    siteNameColor: '#0f172a',
    footerText: `© 2026 TallyFlow ERP. All rights reserved.`,
    footerTextColor: '#64748b',
    footerBgColor: '#fafafa'
  });

  return (
    <footer className="border-t border-slate-100 py-12 bg-[#fafafa]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1 p-1 rounded bg-white border border-slate-200/60 shadow-xs">
                <div className="w-2.5 h-2.5 rounded-[2px] bg-[#f97316]" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-[#e11d48]" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-[#3b82f6]" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-[#eab308]" />
              </div>
              <span className="text-base font-bold tracking-tight text-slate-900">{globalSettings.siteName || 'TallyFlow ERP'}</span>
            </div>
            <p className="text-xs sm:text-sm max-w-xs text-slate-500 leading-relaxed">
              {t('footer.description')}
            </p>
          </div>
          
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">{t('footer.product')}</h4>
            <ul className="space-y-2">
              <li><Link to="/features" className="text-xs sm:text-sm text-slate-600 hover:text-slate-900 transition-colors">{t('nav.features')}</Link></li>
              <li><Link to="/about" className="text-xs sm:text-sm text-slate-600 hover:text-slate-900 transition-colors">{t('nav.about')}</Link></li>
              <li><Link to="/contact" className="text-xs sm:text-sm text-slate-600 hover:text-slate-900 transition-colors">{t('nav.contact')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">{t('footer.legal')}</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-xs sm:text-sm text-slate-600 hover:text-slate-900 transition-colors">{t('footer.privacy')}</a></li>
              <li><a href="#" className="text-xs sm:text-sm text-slate-600 hover:text-slate-900 transition-colors">{t('footer.terms')}</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-6 border-t border-slate-200/60 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
          <p>
            {globalSettings.footerText || `© ${new Date().getFullYear()} TallyFlow ERP. All rights reserved.`}
          </p>
          <div className="flex gap-4">
            <span className="text-slate-500 font-medium">Enterprise Precision</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
