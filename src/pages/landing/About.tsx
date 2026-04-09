import React from 'react';
import { Navbar } from '../../components/landing/Navbar';
import { Footer } from '../../components/landing/Footer';
import { motion } from 'motion/react';
import { Award, Users, Globe, Zap } from 'lucide-react';

export const About = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mission Section */}
          <div className="max-w-3xl mx-auto text-center mb-24">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">Our Mission</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              We are dedicated to empowering businesses of all sizes with the tools they need 
              to thrive in a digital-first world. Our goal is to simplify complex operations 
              and provide clarity through intelligent data.
            </p>
          </div>

          {/* Image Section */}
          <div className="relative h-[400px] rounded-3xl overflow-hidden mb-24 shadow-2xl">
            <img 
              src="https://picsum.photos/seed/office/1200/600" 
              alt="Our Office" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="text-center text-white p-8">
                <h2 className="text-3xl md:text-5xl font-bold mb-4">Built for Business</h2>
                <p className="text-lg opacity-80">Founded in 2010, serving over 500+ companies worldwide.</p>
              </div>
            </div>
          </div>

          {/* Values Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-32">
            {[
              {
                icon: Zap,
                title: "Innovation",
                desc: "We constantly push the boundaries of what's possible in ERP technology."
              },
              {
                icon: Users,
                title: "Customer First",
                desc: "Our customers' success is our primary metric for our own success."
              },
              {
                icon: Globe,
                title: "Global Reach",
                desc: "Supporting businesses across continents with localized solutions."
              },
              {
                icon: Award,
                title: "Excellence",
                desc: "We strive for perfection in every line of code and every support interaction."
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
          <div className="py-24 border-t border-border text-center">
            <h2 className="text-3xl font-bold mb-12">Our Leadership</h2>
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
        </div>
      </main>

      <Footer />
    </div>
  );
};
