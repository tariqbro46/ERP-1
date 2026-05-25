import React from 'react';
import { Navbar } from '../../components/landing/Navbar';
import { Footer } from '../../components/landing/Footer';
import { motion } from 'motion/react';
import { Award, Users, Globe, Zap, CheckCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { useSiteContent } from '../../hooks/useSiteContent';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';
import { useLandingTheme } from '../../hooks/useLandingTheme';

export const About = () => {
  const { t } = useLanguage();
  const DEFAULT_CONTENT = {
    missionTitle: t('about.missionTitle') || "Our Mission",
    missionTitleColor: "#ffffff",
    missionDesc: t('about.missionDesc') || "We are dedicated to empowering businesses of all sizes with the tools they need to thrive in a digital-first world. Our goal is to simplify complex operations and provide clarity through intelligent data.",
    missionDescColor: "#94a3b8",
    missionBgColor: "#0f172a",
    missionImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
    bannerTitle: t('about.bannerTitle') || "Built for Business",
    bannerTitleColor: "#ffffff",
    bannerSubtitle: t('about.bannerSubtitle') || "Founded in 2026, serving over 500+ companies worldwide.",
    bannerSubtitleColor: "#94a3b8",
    bannerBgColor: "#020617",
    leadershipTitle: t('about.leadershipTitle') || "Our Leadership Team",
    leadershipTitleColor: "#ffffff",
    showLeadership: true,
    pageBgColor: "#020617"
  };

  const { content } = useSiteContent('about', DEFAULT_CONTENT);
  const landingTheme = useLandingTheme();
  const isDark = landingTheme === 'dark';

  return (
    <div className="min-h-screen flex flex-col selection:bg-blue-500/30 transition-colors duration-300" style={{ backgroundColor: isDark ? '#020617' : '#f8fafc', color: isDark ? '#ffffff' : '#0f172a' }}>
      <Navbar />
      
      <main className="flex-1 pt-32 pb-24 relative overflow-hidden transition-colors duration-300" style={{ backgroundColor: isDark ? '#020617' : '#f8fafc' }}>
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] -z-10 pointer-events-none">
          <div className={cn(
            "absolute top-12 left-1/3 w-[500px] h-[500px] rounded-full blur-[140px] opacity-80",
            isDark ? "bg-indigo-600/10" : "bg-indigo-400/5"
          )} />
          <div className={cn(
            "absolute top-24 right-1/4 w-[400px] h-[400px] rounded-full blur-[120px] opacity-60",
            isDark ? "bg-blue-500/5" : "bg-blue-400/5"
          )} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Mission Section */}
          <div className="text-center mb-20 animate-fade-in">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-xs font-black uppercase tracking-[0.3em] bg-indigo-500/15 text-indigo-500 px-3 py-1.5 rounded-full border border-indigo-500/20 mb-6 inline-block">CORPORATE CREDENTIALS</span>
              <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight mb-8 animate-fade-in" style={{ color: isDark ? (content.missionTitleColor || '#ffffff') : '#0f172a' }}>
                {content.missionTitle}
              </h1>
              <p className="text-base md:text-lg max-w-3xl mx-auto leading-relaxed font-semibold" style={{ color: isDark ? (content.missionDescColor || '#94a3b8') : '#475569' }}>
                {content.missionDesc}
              </p>
            </motion.div>
          </div>

          {/* Banner Graphic Section */}
          <div className={cn(
            "relative h-[440px] rounded-3xl overflow-hidden mb-24 border shadow-2xl group transition-all duration-300",
            isDark ? "border-slate-900 bg-slate-950" : "border-slate-200 bg-white"
          )}>
            <img 
              src={content.missionImage} 
              alt="Our Corporate Workspace" 
              className="w-full h-full object-cover opacity-35 group-hover:scale-102 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            <div className={cn(
              "absolute inset-0 bg-gradient-to-t to-transparent",
              isDark ? "from-slate-950 via-slate-950/70" : "from-slate-100 via-slate-100/70"
            )} />
            
            <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
              <div className="max-w-2xl">
                <span className="text-xs font-black uppercase text-indigo-500 tracking-[0.2em] mb-2 block">ESTABLISHED SUCCESS</span>
                <h2 className="text-3xl md:text-5xl font-black mb-3" style={{ color: isDark ? (content.bannerTitleColor || '#ffffff') : '#0f172a' }}>
                  {content.bannerTitle}
                </h2>
                <p className="text-sm md:text-base font-semibold leading-relaxed" style={{ color: isDark ? (content.bannerSubtitleColor || '#94a3b8') : '#475569' }}>
                  {content.bannerSubtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Core Values Section */}
          <div className="mb-32">
            <div className="text-center mb-16 animate-fade-in">
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500 block mb-2">SYSTEM FOUNDATIONS</span>
              <h2 className={cn("text-3xl font-extrabold tracking-tight", isDark ? "text-white" : "text-slate-900")}>Our Operating Philosophy</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: Zap,
                  title: t('about.value1Title') || "Operational Clarity",
                  desc: t('about.value1Desc') || "We build intuitive interfaces allowing rapid understanding over double entry finances in milliseconds.",
                  glow: isDark ? 'from-blue-500/10 to-indigo-500/5 hover:border-blue-500/20' : 'from-blue-50/20 to-indigo-50/10 hover:border-blue-200'
                },
                {
                  icon: Users,
                  title: t('about.value2Title') || "Enterprise Growth",
                  desc: t('about.value2Desc') || "Supporting scaling ventures across multi-godown networks without performance compromises.",
                  glow: isDark ? 'from-purple-500/10 to-pink-500/5 hover:border-purple-500/20' : 'from-purple-50/20 to-pink-50/10 hover:border-purple-200'
                },
                {
                  icon: Globe,
                  title: t('about.value3Title') || "Global Alignment",
                  desc: t('about.value3Desc') || "Engineered for international statutory regulations with support for multi-currency transactions.",
                  glow: isDark ? 'from-emerald-500/10 to-teal-500/5 hover:border-emerald-500/20' : 'from-emerald-50/20 to-teal-50/10 hover:border-emerald-200'
                },
                {
                  icon: Award,
                  title: t('about.value4Title') || "Uncompromised Trust",
                  desc: t('about.value4Desc') || "Rigid compliance rules with role-based permissions preventing leakages and tracking actions.",
                  glow: isDark ? 'from-amber-500/10 to-yellow-500/5 hover:border-amber-500/20' : 'from-amber-50/20 to-yellow-50/10 hover:border-amber-200'
                }
              ].map((value, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "p-8 border rounded-3xl bg-gradient-to-b transition-all duration-300 hover:translate-y-[-4px]",
                    isDark ? "border-slate-900 bg-slate-950/20" : "border-slate-200 bg-white shadow-sm",
                    value.glow
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl border flex items-center justify-center mb-6",
                    isDark ? "bg-slate-900/80 border-slate-800" : "bg-slate-100 border-slate-250"
                  )}>
                    <value.icon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className={cn("text-lg font-bold mb-3", isDark ? "text-slate-100" : "text-slate-900")}>{value.title}</h3>
                  <p className={cn("text-xs leading-relaxed font-semibold", isDark ? "text-slate-400" : "text-slate-600")}>
                    {value.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Leaders Section */}
          {content.showLeadership && (
            <div className={cn("py-24 border-t transition-colors duration-300", isDark ? "border-slate-900" : "border-slate-200")}>
              <div className="text-center mb-16">
                <span className="text-xs font-black uppercase tracking-[0.25em] bg-blue-500/10 text-blue-500 px-3 py-1.5 rounded-full border border-blue-500/20 mb-6 inline-block">EXECUTIVE FOUNDERS</span>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 animate-fade-in" style={{ color: isDark ? (content.leadershipTitleColor || '#ffffff') : '#0f172a' }}>
                  {content.leadershipTitle}
                </h2>
                <p className={cn("text-sm font-semibold", isDark ? "text-slate-400" : "text-slate-600")}>Empowering local enterprise scalability through digital tools.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {[
                  { name: "John Doe", role: t('about.roleCEO') || "Chief Executive Officer", img: "https://api.dicebear.com/7.x/micah/svg?seed=John&backgroundType=gradientLinear&backgroundRotation=140" },
                  { name: "Jane Smith", role: t('about.roleCTO') || "Chief Technology Officer", img: "https://api.dicebear.com/7.x/micah/svg?seed=Jane&backgroundType=gradientLinear&backgroundRotation=140" },
                  { name: "Mike Johnson", role: t('about.roleProduct') || "VP Product", img: "https://api.dicebear.com/7.x/micah/svg?seed=Mike&backgroundType=gradientLinear&backgroundRotation=140" }
                ].map((member, i) => (
                  <div key={i} className={cn(
                    "p-8 border rounded-3xl text-center transition-all duration-350",
                    isDark 
                      ? "bg-slate-900/35 border-slate-900 hover:border-slate-800 hover:bg-slate-900/50" 
                      : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md"
                  )}>
                    <div className={cn(
                      "w-24 h-24 rounded-full overflow-hidden mx-auto mb-6 border-2 shadow-xl",
                      isDark ? "border-indigo-500/20 bg-slate-950" : "border-indigo-100 bg-slate-50"
                    )}>
                      <img src={member.img} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <h3 className={cn("text-lg font-bold mb-1", isDark ? "text-slate-100" : "text-slate-900")}>{member.name}</h3>
                    <p className="text-xs text-indigo-600 uppercase tracking-widest font-black text-[9px]">{member.role}</p>
                    <div className="mt-4 flex justify-center gap-2">
                      <span className={cn(
                        "text-[9px] px-2 py-0.5 rounded border font-mono",
                        isDark ? "bg-slate-950 border-slate-800 text-slate-500" : "bg-slate-100 border-slate-200 text-slate-500"
                      )}>AUTHORIZED SHA-256</span>
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
