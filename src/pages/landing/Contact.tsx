import React from 'react';
import { Navbar } from '../../components/landing/Navbar';
import { Footer } from '../../components/landing/Footer';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { useSiteContent } from '../../hooks/useSiteContent';
import { useLanguage } from '../../contexts/LanguageContext';

const DEFAULT_CONTENT = {
  title: "Get in Touch",
  titleColor: "#0a0a0a",
  subtitle: "Have questions? We're here to help. Send us a message and our team will get back to you within 24 hours.",
  subtitleColor: "#64748b",
  pageBgColor: "#ffffff",
  formBgColor: "#f5f5f5",
  formTitleColor: "#0a0a0a",
  formSubtitleColor: "#64748b",
  inputBgColor: "#ffffff",
  inputTextColor: "#0a0a0a",
  buttonBgColor: "#0a0a0a",
  buttonTextColor: "#ffffff",
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
  const { t } = useLanguage();
  const DEFAULT_CONTENT = {
    title: t('contact.title'),
    titleColor: "#0a0a0a",
    subtitle: t('contact.subtitle'),
    subtitleColor: "#64748b",
    pageBgColor: "#ffffff",
    formBgColor: "#f5f5f5",
    formTitleColor: "#0a0a0a",
    formSubtitleColor: "#64748b",
    inputBgColor: "#ffffff",
    inputTextColor: "#0a0a0a",
    buttonBgColor: "#0a0a0a",
    buttonTextColor: "#ffffff",
    emailLabel: t('contact.emailLabel'),
    email1: "support@erpsystem.com",
    email2: "sales@erpsystem.com",
    phoneLabel: t('contact.phoneLabel'),
    phone1: "+1 (555) 123-4567",
    phone2: t('contact.phone2'),
    addressLabel: t('contact.addressLabel'),
    addressLine1: "123 Business Avenue, Suite 500",
    addressLine2: "Silicon Valley, CA 94025",
    addressLine3: "United States"
  };

  const { content } = useSiteContent('contact', DEFAULT_CONTENT);
  const [formState, setFormState] = React.useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you'd send this to your backend
    setIsSubmitted(true);
    setFormState({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setIsSubmitted(false), 5000);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: content.pageBgColor }}>
      <Navbar />
      
      <main className="flex-1 pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 
              className="text-4xl md:text-6xl font-bold tracking-tight mb-4"
              style={{ color: content.titleColor }}
            >
              {content.title}
            </h1>
            <p 
              className="text-xl max-w-2xl mx-auto"
              style={{ color: content.subtitleColor }}
            >
              {content.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-32">
            {/* Contact Info */}
            <div className="space-y-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="p-8 border border-border rounded-3xl" style={{ backgroundColor: content.formBgColor }}>
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: content.formTitleColor }}>{content.emailLabel}</h3>
                  <p className="text-sm" style={{ color: content.formSubtitleColor }}>{content.email1}</p>
                  <p className="text-sm" style={{ color: content.formSubtitleColor }}>{content.email2}</p>
                </div>
                <div className="p-8 border border-border rounded-3xl" style={{ backgroundColor: content.formBgColor }}>
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: content.formTitleColor }}>{content.phoneLabel}</h3>
                  <p className="text-sm" style={{ color: content.formSubtitleColor }}>{content.phone1}</p>
                  <p className="text-sm" style={{ color: content.formSubtitleColor }}>{content.phone2}</p>
                </div>
              </div>

              <div className="p-8 border border-border rounded-3xl overflow-hidden relative group h-64" style={{ backgroundColor: content.formBgColor }}>
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
                  <h3 className="text-lg font-bold mb-2" style={{ color: content.formTitleColor }}>{content.addressLabel}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: content.formSubtitleColor }}>
                    {content.addressLine1}<br />
                    {content.addressLine2}<br />
                    {content.addressLine3}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="border border-border rounded-3xl p-8 md:p-12 shadow-xl relative" style={{ backgroundColor: content.formBgColor }}>
              {isSubmitted && (
                <div className="absolute inset-0 z-10 bg-card/90 backdrop-blur-sm flex items-center justify-center p-8 text-center animate-in fade-in duration-300 rounded-3xl">
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                      <Send className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h3 className="text-xl font-bold">{t('contact.successTitle') || 'Message Sent!'}</h3>
                    <p className="text-muted-foreground">{t('contact.successMessage')}</p>
                    <button 
                      onClick={() => setIsSubmitted(false)}
                      className="px-6 py-2 bg-foreground text-background rounded-full text-sm font-bold"
                    >
                      {t('common.close') || 'Close'}
                    </button>
                  </div>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest" style={{ color: content.formSubtitleColor }}>{t('contact.fullName')}</label>
                    <input 
                      type="text" 
                      required
                      value={formState.name}
                      onChange={(e) => setFormState({...formState, name: e.target.value})}
                      className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                      style={{ backgroundColor: content.inputBgColor, color: content.inputTextColor }}
                      placeholder={t('contact.fullNamePlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest" style={{ color: content.formSubtitleColor }}>{t('contact.emailAddress')}</label>
                    <input 
                      type="email" 
                      required
                      value={formState.email}
                      onChange={(e) => setFormState({...formState, email: e.target.value})}
                      className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                      style={{ backgroundColor: content.inputBgColor, color: content.inputTextColor }}
                      placeholder={t('contact.emailPlaceholder')}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest" style={{ color: content.formSubtitleColor }}>{t('contact.subject')}</label>
                  <input 
                    type="text" 
                    required
                    value={formState.subject}
                    onChange={(e) => setFormState({...formState, subject: e.target.value})}
                    className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                    style={{ backgroundColor: content.inputBgColor, color: content.inputTextColor }}
                    placeholder={t('contact.subjectPlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest" style={{ color: content.formSubtitleColor }}>{t('contact.message')}</label>
                  <textarea 
                    required
                    rows={5}
                    value={formState.message}
                    onChange={(e) => setFormState({...formState, message: e.target.value})}
                    className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                    style={{ backgroundColor: content.inputBgColor, color: content.inputTextColor }}
                    placeholder={t('contact.messagePlaceholder')}
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: content.buttonBgColor, color: content.buttonTextColor }}
                >
                  <Send className="w-4 h-4" />
                  {t('contact.sendMessage')}
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

