import React from 'react';
import { Navbar } from '../../components/landing/Navbar';
import { Footer } from '../../components/landing/Footer';
import { motion } from 'motion/react';
import { Award, Users, Globe, Zap, CheckCircle, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { useSiteContent } from '../../hooks/useSiteContent';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';

export const About = () => {
  const { t } = useLanguage();
  const DEFAULT_CONTENT = {
    missionTitle: t('about.missionTitle') || "Our Mission",
    missionTitleColor: "#0f172a",
    missionDesc: t('about.missionDesc') || "We are dedicated to empowering businesses of all sizes with the tools they need to thrive in a digital-first world. Our goal is to simplify complex operations and provide clarity through intelligent data.",
    missionDescColor: "#64748b",
    missionBgColor: "#ffffff",
    missionImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
    bannerTitle: t('about.bannerTitle') || "Built for Business",
    bannerTitleColor: "#ffffff",
    bannerSubtitle: t('about.bannerSubtitle') || "Founded in 2026, serving over 500+ companies worldwide.",
    bannerSubtitleColor: "rgba(255,255,255,0.9)",
    bannerBgColor: "#0f172a",
    leadershipTitle: t('about.leadershipTitle') || "Our Leadership Team",
    leadershipTitleColor: "#0f172a",
    showLeadership: true,
    pageBgColor: "#ffffff",
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

  // Normalize content to clean light theme
  const content = {
    ...rawContent,
    pageBgColor: "#ffffff",
    missionTitleColor: "#0f172a",
    missionDescColor: "#64748b",
    leadershipTitleColor: "#0f172a"
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-blue-100">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-24 relative overflow-hidden bg-white">
        {/* Geometric Grid Pattern matching Login & Home */}
        <div 
          className="absolute inset-0 pointer-events-none -z-10"
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% 0%, rgba(241, 245, 249, 0.8) 0%, rgba(255, 255, 255, 1) 75%),
              linear-gradient(to right, #f1f5f9 1px, transparent 1px),
              linear-gradient(to bottom, #f1f5f9 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 88px 88px, 88px 88px'
          }}
        />

        {/* Ambient Pastel Glows */}
        <div className="absolute top-12 left-1/3 w-[500px] h-[500px] bg-indigo-100/40 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="absolute top-24 right-1/4 w-[400px] h-[400px] bg-blue-100/40 rounded-full blur-[120px] pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Mission Section */}
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] bg-indigo-50 text-indigo-700 px-3.5 py-1.5 rounded-full border border-indigo-100 mb-6 inline-block shadow-2xs">
                COMPANY MISSION & VISION
              </span>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 text-slate-900">
                {content.missionTitle}
              </h1>
              <p className="text-base sm:text-lg max-w-3xl mx-auto leading-relaxed font-normal text-slate-600">
                {content.missionDesc}
              </p>
            </motion.div>
          </div>

          {/* Banner Graphic Section */}
          <div className="relative h-[380px] md:h-[440px] rounded-2xl overflow-hidden mb-24 border border-slate-200 shadow-xl shadow-slate-200/50 group bg-slate-900">
            <img 
              src={content.missionImage} 
              alt="Our Corporate Workspace" 
              className="w-full h-full object-cover opacity-60 group-hover:scale-102 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
            
            <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
              <div className="max-w-2xl">
                <span className="text-[11px] font-bold uppercase text-blue-400 tracking-[0.2em] mb-2 block">
                  ESTABLISHED EXCELLENCE
                </span>
                <h2 className="text-3xl md:text-5xl font-extrabold mb-3 text-white">
                  {content.bannerTitle}
                </h2>
                <p className="text-sm md:text-base font-normal leading-relaxed text-slate-200">
                  {content.bannerSubtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Core Values Section */}
          <div className="mb-28">
            <div className="text-center mb-14">
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] bg-blue-50 text-blue-700 px-3.5 py-1.5 rounded-full border border-blue-100 mb-3 inline-block shadow-2xs">
                CORE PRINCIPLES
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">Our Operating Philosophy</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: Zap,
                  title: content.value1Title || "Operational Clarity",
                  desc: content.value1Desc || "We build intuitive interfaces allowing rapid understanding over double entry finances in milliseconds.",
                  iconColor: 'bg-blue-50 text-blue-600 border-blue-100'
                },
                {
                  icon: Users,
                  title: content.value2Title || "Enterprise Growth",
                  desc: content.value2Desc || "Supporting scaling ventures across multi-godown networks without performance compromises.",
                  iconColor: 'bg-purple-50 text-purple-600 border-purple-100'
                },
                {
                  icon: Globe,
                  title: content.value3Title || "Global Alignment",
                  desc: content.value3Desc || "Engineered for international statutory regulations with support for multi-currency transactions.",
                  iconColor: 'bg-emerald-50 text-emerald-600 border-emerald-100'
                },
                {
                  icon: Award,
                  title: content.value4Title || "Uncompromised Trust",
                  desc: content.value4Desc || "Rigid compliance rules with role-based permissions preventing leakages and tracking actions.",
                  iconColor: 'bg-amber-50 text-amber-600 border-amber-100'
                }
              ].map((value, i) => (
                <div 
                  key={i} 
                  className="p-7 border border-slate-200/90 rounded-2xl bg-white hover:bg-slate-50/50 transition-all duration-300 hover:translate-y-[-2px] shadow-xs hover:shadow-md"
                >
                  <div className={cn("w-12 h-12 rounded-xl border flex items-center justify-center mb-5", value.iconColor)}>
                    <value.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold mb-2 text-slate-900">{value.title}</h3>
                  <p className="text-slate-600 text-xs leading-relaxed font-normal">
                    {value.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
 
          {/* Leaders Section */}
          {content.showLeadership && (
            <div className="py-20 border-t border-slate-100">
              <div className="text-center mb-14">
                <span className="text-[11px] font-bold uppercase tracking-[0.25em] bg-blue-50 text-blue-700 px-3.5 py-1.5 rounded-full border border-blue-100 mb-4 inline-block shadow-2xs">
                  LEADERSHIP
                </span>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-slate-900">
                  {content.leadershipTitle}
                </h2>
                <p className="text-slate-600 text-sm font-medium">Empowering enterprise scalability through digital precision.</p>
              </div>
 
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {[
                  { name: content.leader1Name || "John Doe", role: content.leader1Role || "Chief Executive Officer", img: content.leader1Img || "https://api.dicebear.com/7.x/micah/svg?seed=John&backgroundType=gradientLinear&backgroundRotation=140" },
                  { name: content.leader2Name || "Jane Smith", role: content.leader2Role || "Chief Technology Officer", img: content.leader2Img || "https://api.dicebear.com/7.x/micah/svg?seed=Jane&backgroundType=gradientLinear&backgroundRotation=140" },
                  { name: content.leader3Name || "Mike Johnson", role: content.leader3Role || "VP Product", img: content.leader3Img || "https://api.dicebear.com/7.x/micah/svg?seed=Mike&backgroundType=gradientLinear&backgroundRotation=140" }
                ].map((member, i) => (
                  <div key={i} className="p-7 bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl text-center transition-all hover:shadow-md shadow-xs">
                    <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 border-2 border-slate-100 bg-slate-50 shadow-xs">
                      <img src={member.img} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-0.5">{member.name}</h3>
                    <p className="text-xs text-blue-700 font-semibold tracking-wide">{member.role}</p>
                    <div className="mt-4 flex justify-center">
                      <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-mono font-medium">TALLYFLOW EXECUTIVE</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick CTA Banner */}
          <div className="mt-16 p-8 md:p-12 rounded-2xl bg-slate-900 text-white text-center flex flex-col items-center justify-center gap-4 relative overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 pointer-events-none" />
            <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight">Ready to elevate your business operations?</h3>
            <p className="text-slate-300 text-sm max-w-xl">
              Experience the fast, reliable, double-entry financial platform tailored for scaling enterprises.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
              <Link
                to="/register"
                className="px-6 py-2.5 bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-lg text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-[0.99]"
              >
                Get Started Free
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/contact"
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs border border-slate-700 transition-all"
              >
                Contact Support
              </Link>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};
