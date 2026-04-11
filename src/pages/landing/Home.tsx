import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/landing/Navbar';
import { Footer } from '../../components/landing/Footer';
import { 
  BarChart3, 
  Shield, 
  Zap, 
  Users, 
  ArrowRight,
  Globe,
  Database
} from 'lucide-react';
import { motion } from 'motion/react';
import { useSiteContent } from '../../hooks/useSiteContent';

const DEFAULT_CONTENT = {
  heroTitle: "Manage Your Business With Intelligence",
  heroTitleColor: "#0a0a0a",
  heroSubtitle: "The all-in-one ERP solution for modern enterprises. Streamline operations, gain real-time insights, and scale your business with confidence.",
  heroSubtitleColor: "#64748b",
  heroCtaPrimary: "Start Free Trial",
  heroCtaPrimaryBg: "#0a0a0a",
  heroCtaPrimaryText: "#ffffff",
  heroCtaSecondary: "View Features",
  heroCtaSecondaryBg: "#ffffff",
  heroCtaSecondaryText: "#0a0a0a",
  heroImage: "https://picsum.photos/seed/erp-hero-dashboard/1600/900",
  heroBgColor: "#ffffff",
  showHero: true,
  statsClients: "500+",
  statsUptime: "99.9%",
  statsSupport: "24/7",
  statsExperience: "15+",
  statsSectionBg: "#f9fafb",
  statsTitleColor: "#0a0a0a",
  statsSubtitleColor: "#64748b",
  showStats: true,
  featuresTitle: "Everything You Need",
  featuresTitleColor: "#0a0a0a",
  featuresSubtitle: "Powerful tools to help you manage every aspect of your business from a single, unified platform.",
  featuresSubtitleColor: "#64748b",
  featuresSectionBg: "#ffffff",
  featureCardBg: "#f5f5f5",
  featureCardTitleColor: "#0a0a0a",
  featureCardDescColor: "#64748b",
  showFeatures: true,
  ctaTitle: "Ready to Transform Your Business?",
  ctaTitleColor: "#ffffff",
  ctaSubtitle: "Join hundreds of successful companies already using our ERP system to power their growth.",
  ctaSubtitleColor: "rgba(255,255,255,0.7)",
  ctaSectionBg: "#0a0a0a",
  ctaButton: "Get Started Now",
  ctaButtonBg: "#ffffff",
  ctaButtonText: "#0a0a0a",
  showCta: true
};

export const Home = () => {
  const { content } = useSiteContent('home', DEFAULT_CONTENT);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: content.heroBgColor }}>
      <Navbar />
      
      <main className="flex-1 pt-16">
        {/* Hero Section */}
        {content.showHero && (
          <section className="relative py-20 overflow-hidden" style={{ backgroundColor: content.heroBgColor }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h1 
                    className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 whitespace-pre-line"
                    style={{ color: content.heroTitleColor }}
                  >
                    {content.heroTitle}
                  </h1>
                  <p 
                    className="text-xl max-w-2xl mx-auto mb-10"
                    style={{ color: content.heroSubtitleColor }}
                  >
                    {content.heroSubtitle}
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link
                      to="/register"
                      className="px-8 py-4 rounded-full text-lg font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                      style={{ backgroundColor: content.heroCtaPrimaryBg, color: content.heroCtaPrimaryText }}
                    >
                      {content.heroCtaPrimary}
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                    <Link
                      to="/features"
                      className="px-8 py-4 border border-border rounded-full text-lg font-bold hover:bg-foreground/5 transition-colors"
                      style={{ backgroundColor: content.heroCtaSecondaryBg, color: content.heroCtaSecondaryText }}
                    >
                      {content.heroCtaSecondary}
                    </Link>
                  </div>
                </motion.div>

                {/* Hero Image */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="mt-20 relative max-w-5xl mx-auto"
                >
                  <div className="relative rounded-3xl overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.3)] border border-border bg-card">
                    <img 
                      src={content.heroImage} 
                      alt="ERP Dashboard Preview" 
                      className="w-full h-auto"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
                  </div>
                  {/* Floating Elements */}
                  <div className="absolute -top-6 -right-6 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                  <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
                </motion.div>
              </div>
            </div>

            {/* Background Decoration */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 opacity-20 pointer-events-none">
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-[120px]" />
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px]" />
            </div>
          </section>
        )}

        {/* Stats Section */}
        {content.showStats && (
          <section className="py-12 border-y border-border" style={{ backgroundColor: content.statsSectionBg }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                <div>
                  <p className="text-3xl font-bold mb-1" style={{ color: content.statsTitleColor }}>{content.statsClients}</p>
                  <p className="text-xs uppercase tracking-widest font-bold" style={{ color: content.statsSubtitleColor }}>Active Clients</p>
                </div>
                <div>
                  <p className="text-3xl font-bold mb-1" style={{ color: content.statsTitleColor }}>{content.statsUptime}</p>
                  <p className="text-xs uppercase tracking-widest font-bold" style={{ color: content.statsSubtitleColor }}>Uptime Rate</p>
                </div>
                <div>
                  <p className="text-3xl font-bold mb-1" style={{ color: content.statsTitleColor }}>{content.statsSupport}</p>
                  <p className="text-xs uppercase tracking-widest font-bold" style={{ color: content.statsSubtitleColor }}>Expert Support</p>
                </div>
                <div>
                  <p className="text-3xl font-bold mb-1" style={{ color: content.statsTitleColor }}>{content.statsExperience}</p>
                  <p className="text-xs uppercase tracking-widest font-bold" style={{ color: content.statsSubtitleColor }}>Years Experience</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Features Preview */}
        {content.showFeatures && (
          <section className="py-24" style={{ backgroundColor: content.featuresSectionBg }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 
                  className="text-3xl md:text-5xl font-bold tracking-tight mb-4"
                  style={{ color: content.featuresTitleColor }}
                >
                  {content.featuresTitle}
                </h2>
                <p 
                  className="max-w-xl mx-auto"
                  style={{ color: content.featuresSubtitleColor }}
                >
                  {content.featuresSubtitle}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    icon: BarChart3,
                    title: "Financial Insights",
                    desc: "Real-time reporting and analytics to help you make data-driven decisions."
                  },
                  {
                    icon: Database,
                    title: "Inventory Control",
                    desc: "Track stock levels, manage warehouses, and optimize your supply chain."
                  },
                  {
                    icon: Users,
                    title: "Team Collaboration",
                    desc: "Manage employees, payroll, and permissions with ease."
                  },
                  {
                    icon: Shield,
                    title: "Enterprise Security",
                    desc: "Bank-grade security to keep your sensitive business data safe."
                  },
                  {
                    icon: Zap,
                    title: "Fast Performance",
                    desc: "Optimized for speed to ensure your business never slows down."
                  },
                  {
                    icon: Globe,
                    title: "Cloud Access",
                    desc: "Access your business data from anywhere in the world, on any device."
                  }
                ].map((feature, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ y: -5 }}
                    className="p-8 border border-border rounded-3xl hover:shadow-xl transition-all"
                    style={{ backgroundColor: content.featureCardBg }}
                  >
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-3" style={{ color: content.featureCardTitleColor }}>{feature.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: content.featureCardDescColor }}>
                      {feature.desc}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        {content.showCta && (
          <section className="py-24" style={{ backgroundColor: content.ctaSectionBg }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 
                className="text-3xl md:text-5xl font-bold mb-8"
                style={{ color: content.ctaTitleColor }}
              >
                {content.ctaTitle}
              </h2>
              <p 
                className="max-w-xl mx-auto mb-10 text-lg"
                style={{ color: content.ctaSubtitleColor }}
              >
                {content.ctaSubtitle}
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-lg font-bold hover:opacity-90 transition-opacity"
                style={{ backgroundColor: content.ctaButtonBg, color: content.ctaButtonText }}
              >
                {content.ctaButton}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

