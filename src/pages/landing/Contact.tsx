import React from 'react';
import { Navbar } from '../../components/landing/Navbar';
import { Footer } from '../../components/landing/Footer';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { useSiteContent } from '../../hooks/useSiteContent';

const DEFAULT_CONTENT = {
  title: "Get in Touch",
  subtitle: "Have questions? We're here to help. Send us a message and our team will get back to you within 24 hours.",
  bgColor: "#ffffff",
  emailLabel: "Email Us",
  email1: "support@erpsystem.com",
  email2: "sales@erpsystem.com",
  phoneLabel: "Call Us",
  phone1: "+1 (555) 123-4567",
  phone2: "Mon-Fri, 9am-6pm EST",
  addressLabel: "Visit Our Office",
  addressLine1: "123 Business Avenue, Suite 500",
  addressLine2: "Silicon Valley, CA 94025",
  addressLine3: "United States"
};

export const Contact = () => {
  const { content } = useSiteContent('contact', DEFAULT_CONTENT);
  const [formState, setFormState] = React.useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you'd send this to your backend
    alert('Thank you for your message! We will get back to you soon.');
    setFormState({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: content.bgColor }}>
      <Navbar />
      
      <main className="flex-1 pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">{content.title}</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {content.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-32">
            {/* Contact Info */}
            <div className="space-y-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="p-8 bg-card border border-border rounded-3xl">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{content.emailLabel}</h3>
                  <p className="text-sm text-muted-foreground">{content.email1}</p>
                  <p className="text-sm text-muted-foreground">{content.email2}</p>
                </div>
                <div className="p-8 bg-card border border-border rounded-3xl">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{content.phoneLabel}</h3>
                  <p className="text-sm text-muted-foreground">{content.phone1}</p>
                  <p className="text-sm text-muted-foreground">{content.phone2}</p>
                </div>
              </div>

              <div className="p-8 bg-card border border-border rounded-3xl overflow-hidden relative group h-64">
                <img 
                  src="https://picsum.photos/seed/erp-map/800/600" 
                  alt="Office Location" 
                  className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                <div className="relative z-10 h-full flex flex-col justify-end">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{content.addressLabel}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {content.addressLine1}<br />
                    {content.addressLine2}<br />
                    {content.addressLine3}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-card border border-border rounded-3xl p-8 md:p-12 shadow-xl">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={formState.name}
                      onChange={(e) => setFormState({...formState, name: e.target.value})}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={formState.email}
                      onChange={(e) => setFormState({...formState, email: e.target.value})}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Subject</label>
                  <input 
                    type="text" 
                    required
                    value={formState.subject}
                    onChange={(e) => setFormState({...formState, subject: e.target.value})}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="How can we help?"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Message</label>
                  <textarea 
                    required
                    rows={5}
                    value={formState.message}
                    onChange={(e) => setFormState({...formState, message: e.target.value})}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                    placeholder="Tell us more about your needs..."
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-4 bg-foreground text-background rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <Send className="w-4 h-4" />
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

