import React from 'react';
import { Navbar } from '../../components/landing/Navbar';
import { Footer } from '../../components/landing/Footer';
import { motion } from 'motion/react';
import { Award, Users, Globe, Zap } from 'lucide-react';
import { useSiteContent } from '../../hooks/useSiteContent';
import { useLanguage } from '../../contexts/LanguageContext';

const DEFAULT_CONTENT = {
  missionTitle: "Our Mission",
  missionTitleColor: "#0a0a0a",
  missionDesc: "We are dedicated to empowering businesses of all sizes with the tools they need to thrive in a digital-first world. Our goal is to simplify complex operations and provide clarity through intelligent data.",
  missionDescColor: "#64748b",
  missionBgColor: "#ffffff",
  missionImage: "https://picsum.photos/seed/erp-office-team/1200/600",
  bannerTitle: "Built for Business",
  bannerTitleColor: "#ffffff",
  bannerSubtitle: "Founded in 2010, serving over 500+ companies worldwide.",
  bannerSubtitleColor: "rgba(255,255,255,0.8)",
  bannerBgColor: "#0a0a0a",
  leadershipTitle: "Our Leadership",
  leadershipTitleColor: "#0a0a0a",
  showLeadership: true,
  pageBgColor: "#ffffff"
};

export const About = () => {
  const { t } = useLanguage();
  const DEFAULT_CONTENT = {
    missionTitle: t('about.missionTitle'),
    missionTitleColor: "#0a0a0a",
    missionDesc: t('about.missionDesc'),
    missionDescColor: "#64748b",
    missionBgColor: "#ffffff",
    missionImage: "https://picsum.photos/seed/erp-office-team/1200/600",
    bannerTitle: t('about.bannerTitle'),
    bannerTitleColor: "#ffffff",
    bannerSubtitle: t('about.bannerSubtitle'),
    bannerSubtitleColor: "rgba(255,255,255,0.8)",
    bannerBgColor: "#0a0a0a",
    leadershipTitle: t('about.leadershipTitle'),
    leadershipTitleColor: "#0a0a0a",
    showLeadership: true,
    pageBgColor: "#ffffff"
  };

  const { content } = useSiteContent('about', DEFAULT_CONTENT);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: content.pageBgColor }}>
      <Navbar />
      
      <main className="flex-1 pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mission Section */}
          <div className="max-w-3xl mx-auto text-center mb-24 p-8 rounded-3xl" style={{ backgroundColor: content.missionBgColor }}>
            <h1 
              className="text-4xl md:text-6xl font-bold tracking-tight mb-8"
              style={{ color: content.missionTitleColor }}
            >
              {content.missionTitle}
            </h1>
            <p 
              className="text-xl leading-relaxed"
              style={{ color: content.missionDescColor }}
            >
              {content.missionDesc}
            </p>
          </div>

          {/* Image Section */}
          <div className="relative h-[400px] rounded-3xl overflow-hidden mb-24 shadow-2xl">
            <img 
              src={content.missionImage} 
              alt="Our Office" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: content.bannerBgColor + '66' }}>
              <div className="text-center p-8">
                <h2 
                  className="text-3xl md:text-5xl font-bold mb-4"
                  style={{ color: content.bannerTitleColor }}
                >
                  {content.bannerTitle}
                </h2>
                <p 
                  className="text-lg"
                  style={{ color: content.bannerSubtitleColor }}
                >
                  {content.bannerSubtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Values Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-32">
            {[
              {
                icon: Zap,
                title: t('about.value1Title'),
                desc: t('about.value1Desc')
              },
              {
                icon: Users,
                title: t('about.value2Title'),
                desc: t('about.value2Desc')
              },
              {
                icon: Globe,
                title: t('about.value3Title'),
                desc: t('about.value3Desc')
              },
              {
                icon: Award,
                title: t('about.value4Title'),
                desc: t('about.value4Desc')
              }
            ].map((value, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <value.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {value.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Team Section Preview */}
          {content.showLeadership && (
            <div className="py-24 border-t border-border text-center">
              <h2 
                className="text-3xl font-bold mb-12"
                style={{ color: content.leadershipTitleColor }}
              >
                {content.leadershipTitle}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                  { name: "John Doe", role: "CEO & Founder", img: "https://api.dicebear.com/7.x/pixel-art/svg?seed=John" },
                  { name: "Jane Smith", role: "CTO", img: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Jane" },
                  { name: "Mike Johnson", role: "Head of Product", img: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Mike" }
                ].map((member, i) => (
                  <div key={i} className="p-8 bg-card border border-border rounded-3xl">
                    <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-6 border-4 border-primary/20">
                      <img src={member.img} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                    <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold">{member.role}</p>
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

