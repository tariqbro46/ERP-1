import React from 'react';
import { Navbar } from '../../components/landing/Navbar';
import { Footer } from '../../components/landing/Footer';
import { 
  BarChart3, 
  Shield, 
  Zap, 
  Users, 
  CheckCircle2,
  Database,
  Printer,
  Cpu,
  FileText,
  TrendingUp,
  Activity,
  Globe
} from 'lucide-react';
import { motion } from 'motion/react';

export const Features = () => {
  const features = [
    {
      title: "Financial Management",
      desc: "Complete control over your finances with real-time reporting, automated bookkeeping, and advanced analytics.",
      icon: BarChart3,
      image: "https://picsum.photos/seed/erp-finance-dashboard/1200/800",
      details: [
        "Automated Balance Sheets",
        "Profit & Loss Statements",
        "Real-time Cash Flow Tracking",
        "Multi-currency Support"
      ]
    },
    {
      title: "Inventory & Warehouse",
      desc: "Manage your stock levels across multiple locations, optimize reordering, and track every item in your supply chain.",
      icon: Database,
      image: "https://picsum.photos/seed/erp-inventory-stock/1200/800",
      details: [
        "Multi-godown Management",
        "Batch & Expiry Tracking",
        "Automated Stock Alerts",
        "Barcode Integration"
      ]
    },
    {
      title: "Production & Manufacturing",
      desc: "Streamline your manufacturing process from order to delivery with integrated production planning and machine management.",
      icon: Cpu,
      image: "https://picsum.photos/seed/erp-production-line/1200/800",
      details: [
        "Order Management",
        "Machine Efficiency Tracking",
        "Production Reports",
        "Resource Allocation"
      ]
    },
    {
      title: "Payroll & HR",
      desc: "Manage your most valuable asset—your people. Handle payroll, attendance, and employee records in one place.",
      icon: Users,
      image: "https://picsum.photos/seed/erp-payroll-hr/1200/800",
      details: [
        "Automated Salary Sheets",
        "Employee Master Records",
        "Attendance Tracking",
        "Performance Analytics"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Powerful Features for <br />
              <span className="text-primary">Modern Enterprises</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Explore the comprehensive suite of tools designed to help your business 
              operate more efficiently and grow faster.
            </p>
          </div>

          <div className="space-y-32 mb-32">
            {features.map((feature, i) => (
              <div 
                key={i} 
                className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-12 items-center`}
              >
                <div className="flex-1 space-y-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <feature.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold">{feature.title}</h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {feature.details.map((detail, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm font-medium">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1 w-full">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="relative rounded-3xl overflow-hidden shadow-2xl border border-border aspect-video"
                  >
                    <img 
                      src={feature.image} 
                      alt={feature.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </motion.div>
                </div>
              </div>
            ))}
          </div>

          {/* Grid of smaller features */}
          <div className="py-24 border-t border-border">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">And Much More</h2>
              <p className="text-muted-foreground">Every detail considered for your business success.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: Shield, title: "Data Security", desc: "Your data is encrypted and backed up daily." },
                { icon: Zap, title: "Instant Sync", desc: "Real-time updates across all your devices." },
                { icon: Printer, title: "Custom Printing", desc: "Design and print invoices, reports, and more." },
                { icon: Globe, title: "Global Access", desc: "Secure access from any browser, anywhere." },
                { icon: Activity, title: "Ratio Analysis", desc: "Advanced financial health indicators." },
                { icon: TrendingUp, title: "Growth Tracking", desc: "Monitor your business progress over time." },
                { icon: FileText, title: "Voucher Entry", desc: "Simplified accounting for non-accountants." },
                { icon: Users, title: "User Roles", desc: "Granular permission control for your team." }
              ].map((item, i) => (
                <div key={i} className="p-6 bg-card border border-border rounded-2xl">
                  <item.icon className="w-6 h-6 text-primary mb-4" />
                  <h3 className="font-bold mb-2">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
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
