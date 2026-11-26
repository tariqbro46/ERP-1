import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useLanguage } from '../../contexts/LanguageContext';

export interface InfoTocItem {
  id: string;
  number: string;
  title: string;
}

interface InfoPageLayoutProps {
  kicker: string;
  title: string;
  subtitle: string;
  metaLine: string;
  toc: InfoTocItem[];
  children: React.ReactNode;
}

export const InfoPageLayout: React.FC<InfoPageLayoutProps> = ({
  kicker,
  title,
  subtitle,
  metaLine,
  toc,
  children,
}) => {
  const { language, t } = useLanguage();
  const location = useLocation();
  const isBn = language === 'bn';

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-100 selection:bg-blue-100 selection:text-blue-900">
      <Navbar />

      <main className="flex-1 pt-24 sm:pt-28 pb-20">
        {/* Editorial Document Header */}
        <header className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-10 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-3xl">
            <nav
              aria-label="Breadcrumb"
              className="mb-4 flex items-center gap-1.5 text-[11.5px] font-mono text-slate-500 dark:text-slate-400"
            >
              <Link to="/" className="hover:text-slate-950 dark:hover:text-white transition-colors">
                {t('nav.breadcrumbHome')}
              </Link>
              <span aria-hidden="true">/</span>
              <span className="text-slate-900 dark:text-slate-200 font-medium truncate">{title}</span>
            </nav>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 mb-3">
              {kicker}
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-[2.65rem] font-bold tracking-tight text-slate-950 dark:text-white leading-[1.15] mb-4">
              {title}
            </h1>
            <p className="text-base sm:text-[17px] text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
              {subtitle}
            </p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
              {metaLine}
            </p>
          </div>
        </header>

        {/* Two-Column Document Body: Sticky TOC + Readable Measure */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 lg:pt-12">
          {/* Mobile Section Jump Control */}
          {toc.length > 0 && (
            <div className="lg:hidden mb-8 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 mb-2.5">
                {isBn ? 'দ্রুত সেকশন নেভিগেশন' : 'Jump to Section'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {toc.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollToSection(item.id)}
                    className="flex items-center justify-between text-left px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <span className="truncate">
                      <span className="text-slate-400 mr-1.5 tabular-nums">{item.number}.</span>
                      {item.title}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            {/* Desktop Sticky Table of Contents */}
            <aside className="hidden lg:block lg:col-span-3 sticky top-24">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400 mb-3">
                {isBn ? 'সূচিপত্র' : 'On This Page'}
              </p>
              <nav aria-label={isBn ? 'সেকশন সূচিপত্র' : 'Section Table of Contents'} className="space-y-1 border-t border-slate-200 dark:border-slate-800 pt-3">
                {toc.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollToSection(item.id)}
                    className="w-full text-left flex items-baseline gap-2 py-1.5 px-2 rounded-md text-[13px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                  >
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums shrink-0">
                      {item.number}.
                    </span>
                    <span className="leading-snug">{item.title}</span>
                  </button>
                ))}
              </nav>
            </aside>

            {/* Primary Document Content */}
            <article className="lg:col-span-9 max-w-3xl space-y-12">
              {children}
            </article>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
