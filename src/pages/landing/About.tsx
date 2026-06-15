import React from 'react';
import { Navbar } from '../../components/landing/Navbar';
import { Footer } from '../../components/landing/Footer';
import { motion } from 'motion/react';
import { Award, Users, Globe, Zap, CheckCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { useSiteContent } from '../../hooks/useSiteContent';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';

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
    pageBgColor: "#020617",
    // Core Values Data
    value1Title: t('about.value1Title') || "Operational Clarity",
    value1Desc: t('about.value1Desc') || "We build intuitive interfaces allowing rapid understanding over double entry finances in milliseconds.",
    value2Title: t('about.value2Title') || "Enterprise Growth",
    value2Desc: t('about.value2Desc') || "Supporting scaling ventures across multi-godown networks without performance compromises.",
    value3Title: t('about.value3Title') || "Global Alignment",
    value3Desc: t('about.value3Desc') || "Engineered for international statutory regulations with support for multi-currency transactions.",
    value4Title: t('about.value4Title') || "Uncompromised Trust",
    value4Desc: t('about.value4Desc') || "Rigid compliance rules with role-based permissions preventing leakages and tracking actions.",
    // Leadership Data
    leader1Name: "John Doe",
    leader1Role: t('about.roleCEO') || "Chief Executive Officer",
    leader1Img: "https://api.dicebear.com/7.x/micah/svg?seed=John&backgroundType=gradientLinear&backgroundRotation=140",
    leader2Name: "Jane Smith",
    leader2Role: t('about.roleCTO') || "Chief Technology Officer",
    leader2Img: "https://api.dicebear.com/7.x/micah/svg?seed=Jane&backgroundType=gradientLinear&backgroundRotation=140",
    leader3Name: "Mike Johnson",
    leader3Role: t('about.roleProduct') || "VP Product",
    leader3Img: "https://api.dicebear.com/7.x/micah/svg?seed=Mike&backgroundType=gradientLinear&backgroundRotation=140"
  };

  const { content: rawContent } = useSiteContent('about', DEFAULT_CONTENT);

  // Normalize content to use consistent dark theme backgrounds and colors, matching other pages
  const content = {
    ...rawContent,
    pageBgColor: !rawContent.pageBgColor || rawContent.pageBgColor === "#ffffff" ? "#020617" : rawContent.pageBgColor,
    missionTitleColor: rawContent.missionTitleColor === "#0a0a0a" ? "#ffffff" : rawContent.missionTitleColor || "#ffffff",
    missionDescColor: rawContent.missionDescColor === "#64748b" ? "#94a3b8" : rawContent.missionDescColor || "#94a3b8",
    bannerTitleColor: rawContent.bannerTitleColor === "#0a0a0a" ? "#ffffff" : rawContent.bannerTitleColor || "#ffffff",
    bannerSubtitleColor: rawContent.bannerSubtitleColor === "rgba(255,255,255,0.8)" || rawContent.bannerSubtitleColor === "#64748b" ? "#94a3b8" : rawContent.bannerSubtitleColor || "#94a3b8",
    bannerBgColor: !rawContent.bannerBgColor || rawContent.bannerBgColor === "#ffffff" ? "#020617" : rawContent.bannerBgColor,
    leadershipTitleColor: rawContent.leadershipTitleColor === "#0a0a0a" ? "#ffffff" : rawContent.leadershipTitleColor || "#ffffff",
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-blue-500/30" style={{ backgroundColor: content.pageBgColor || '#020617', color: '#ffffff' }}>
      <Navbar />
      
      <main className="flex-1 pt-32 pb-24 relative overflow-hidden" style={{ backgroundColor: content.pageBgColor || '#020617' }}>
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] -z-10 pointer-events-none">
          <div className="absolute top-12 left-1/3 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] opacity-80" />
          <div className="absolute top-24 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] opacity-60" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Mission Section */}
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-xs font-black uppercase tracking-[0.3em] bg-indigo-500/15 text-indigo-400 px-3 py-1.5 rounded-full border border-indigo-500/20 mb-6 inline-block">CORPORATE CREDENTIALS</span>
              <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight mb-8" style={{ color: content.missionTitleColor || '#ffffff' }}>
                {content.missionTitle}
              </h1>
              <p className="text-base md:text-lg max-w-3xl mx-auto leading-relaxed font-semibold" style={{ color: content.missionDescColor || '#94a3b8' }}>
                {content.missionDesc}
              </p>
            </motion.div>
          </div>

          {/* Banner Graphic Section */}
          <div className="relative h-[440px] rounded-3xl overflow-hidden mb-24 border border-slate-900 shadow-2xl group" style={{ backgroundColor: content.bannerBgColor || '#020617' }}>
            <img 
              src={content.missionImage} 
              alt="Our Corporate Workspace" 
              className="w-full h-full object-cover opacity-35 group-hover:scale-102 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
            
            <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
              <div className="max-w-2xl">
                <span className="text-xs font-black uppercase text-blue-400 tracking-[0.2em] mb-2 block">ESTABLISHED SUCCESS</span>
                <h2 className="text-3xl md:text-5xl font-black mb-3" style={{ color: content.bannerTitleColor || '#ffffff' }}>
                  {content.bannerTitle}
                </h2>
                <p className="text-sm md:text-base font-medium leading-relaxed" style={{ color: content.bannerSubtitleColor || '#94a3b8' }}>
                  {content.bannerSubtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Core Values Section */}
          <div className="mb-32">
            <div className="text-center mb-16">
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500 block mb-2">SYSTEM FOUNDATIONS</span>
              <h2 className="text-3xl font-extrabold tracking-tight text-white">Our Operating Philosophy</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: Zap,
                  title: content.value1Title || "Operational Clarity",
                  desc: content.value1Desc || "We build intuitive interfaces allowing rapid understanding over double entry finances in milliseconds.",
                  glow: 'from-blue-500/10 to-indigo-500/5 hover:border-blue-500/20'
                },
                {
                  icon: Users,
                  title: content.value2Title || "Enterprise Growth",
                  desc: content.value2Desc || "Supporting scaling ventures across multi-godown networks without performance compromises.",
                  glow: 'from-purple-500/10 to-pink-500/5 hover:border-purple-500/20'
                },
                {
                  icon: Globe,
                  title: content.value3Title || "Global Alignment",
                  desc: content.value3Desc || "Engineered for international statutory regulations with support for multi-currency transactions.",
                  glow: 'from-emerald-500/10 to-teal-500/5 hover:border-emerald-500/20'
                },
                {
                  icon: Award,
                  title: content.value4Title || "Uncompromised Trust",
                  desc: content.value4Desc || "Rigid compliance rules with role-based permissions preventing leakages and tracking actions.",
                  glow: 'from-amber-500/10 to-yellow-500/5 hover:border-amber-500/20'
                }
              ].map((value, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "p-8 border border-slate-900 rounded-3xl bg-gradient-to-b transition-all duration-300 hover:translate-y-[-4px]",
                    value.glow
                  )}
                >
                  <div className="w-12 h-12 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center justify-center mb-6">
                    <value.icon className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold mb-3 text-slate-100">{value.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                    {value.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
 
          {/* Leaders Section */}
          {content.showLeadership && (
            <div className="py-24 border-t border-slate-900">
              <div className="text-center mb-16">
                <span className="text-xs font-black uppercase tracking-[0.25em] bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-full border border-blue-500/20 mb-6 inline-block">EXECUTIVE FOUNDERS</span>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2" style={{ color: content.leadershipTitleColor || '#ffffff' }}>
                  {content.leadershipTitle}
                </h2>
                <p className="text-slate-400 text-sm font-medium">Empowering local enterprise scalability through digital tools.</p>
              </div>
 
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {[
                  { name: content.leader1Name || "John Doe", role: content.leader1Role || "Chief Executive Officer", img: content.leader1Img || "https://api.dicebear.com/7.x/micah/svg?seed=John&backgroundType=gradientLinear&backgroundRotation=140" },
                  { name: content.leader2Name || "Jane Smith", role: content.leader2Role || "Chief Technology Officer", img: content.leader2Img || "https://api.dicebear.com/7.x/micah/svg?seed=Jane&backgroundType=gradientLinear&backgroundRotation=140" },
                  { name: content.leader3Name || "Mike Johnson", role: content.leader3Role || "VP Product", img: content.leader3Img || "https://api.dicebear.com/7.x/micah/svg?seed=Mike&backgroundType=gradientLinear&backgroundRotation=140" }
                ].map((member, i) => (
                  <div key={i} className="p-8 bg-slate-900/30 border border-slate-900 hover:border-slate-800 rounded-3xl text-center transition-all hover:bg-slate-900/50">
                    <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-6 border-2 border-indigo-500/20 shadow-xl bg-slate-950">
                      <img src={member.img} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-100 mb-1">{member.name}</h3>
                    <p className="text-xs text-blue-400 uppercase tracking-widest font-black text-[9px]">{member.role}</p>
                    <div className="mt-4 flex justify-center gap-2">
                      <span className="text-[9px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-500 font-mono">AUTHORIZED SHA-256</span>
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
