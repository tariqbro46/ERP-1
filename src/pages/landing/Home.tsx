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
  CheckCircle2,
  Globe,
  Database
} from 'lucide-react';
import { motion } from 'motion/react';

export const Home = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">
                  Manage Your Business <br />
                  <span className="text-primary">With Intelligence</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                  The all-in-one ERP solution for modern enterprises. Streamline operations, 
                  gain real-time insights, and scale your business with confidence.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link
                    to="/register"
                    className="px-8 py-4 bg-foreground text-background rounded-full text-lg font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    Start Free Trial
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    to="/features"
                    className="px-8 py-4 bg-background border border-border rounded-full text-lg font-bold hover:bg-foreground/5 transition-colors"
                  >
                    View Features
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Background Decoration */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 opacity-20 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px]" />
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 border-y border-border bg-foreground/[0.02]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <p className="text-3xl font-bold mb-1">500+</p>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Active Clients</p>
              </div>
              <div>
                <p className="text-3xl font-bold mb-1">99.9%</p>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Uptime Rate</p>
              </div>
              <div>
                <p className="text-3xl font-bold mb-1">24/7</p>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Expert Support</p>
              </div>
              <div>
                <p className="text-3xl font-bold mb-1">15+</p>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Years Experience</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Preview */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Everything You Need</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Powerful tools to help you manage every aspect of your business from a single, unified platform.
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
                  className="p-8 bg-card border border-border rounded-3xl hover:shadow-xl transition-all"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-foreground text-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-8">Ready to Transform Your Business?</h2>
            <p className="text-background/70 max-w-xl mx-auto mb-10 text-lg">
              Join hundreds of successful companies already using our ERP system to power their growth.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-background text-foreground rounded-full text-lg font-bold hover:opacity-90 transition-opacity"
            >
              Get Started Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
