import React from 'react';
import { Navbar } from '../../components/landing/Navbar';
import { Footer } from '../../components/landing/Footer';
import { Mail, Phone, MapPin, Send, HelpCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSiteContent } from '../../hooks/useSiteContent';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';

export const Contact = () => {
  const { t } = useLanguage();
  const DEFAULT_CONTENT = {
    title: t('contact.title') || "Get in Touch with TallyFlow",
    titleColor: "#ffffff",
    subtitle: t('contact.subtitle') || "Have questions? We're here to help. Send us a message and our team will get back to you within 24 hours.",
    subtitleColor: "#94a3b8",
    pageBgColor: "#020617",
    formBgColor: "#0f172a",
    formTitleColor: "#ffffff",
    formSubtitleColor: "#94a3b8",
    inputBgColor: "#090d16",
    inputTextColor: "#ffffff",
    buttonBgColor: "#2563eb",
    buttonTextColor: "#ffffff",
    emailLabel: t('contact.emailLabel') || "Email Us",
    email1: "support@tallyflow-erp.com",
    email2: "sales@tallyflow-erp.com",
    phoneLabel: t('contact.phoneLabel') || "Call Us",
    phone1: "+880 1712 345678",
    phone2: t('contact.phone2') || "Mon-Fri, 9am-6pm BST",
    addressLabel: t('contact.addressLabel') || "Visit Our Office",
    addressLine1: "Planners Tower, Level 14",
    addressLine2: "13/A Bir Uttam CR Datta Road",
    addressLine3: "Dhaka - 1205, Bangladesh"
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
    setIsSubmitted(true);
    setFormState({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setIsSubmitted(false), 8000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white selection:bg-blue-500/30">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-24 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] -z-10 pointer-events-none">
          <div className="absolute top-12 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] opacity-80" />
          <div className="absolute top-24 right-1/3 w-[450px] h-[450px] bg-indigo-500/5 rounded-full blur-[120px] opacity-60" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-xs font-black uppercase tracking-[0.3em] bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-full border border-blue-500/20 mb-6 inline-block">CONTACT HELP-DESK</span>
              <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                {content.title}
              </h1>
              <p className="text-base text-slate-400 max-w-2xl mx-auto leading-relaxed font-semibold">
                {content.subtitle}
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-32">
            
            {/* Contact Details Column */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                {/* Email module card */}
                <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/40 hover:bg-slate-900/60 hover:border-slate-800 transition-all">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/15 mb-4">
                    <Mail className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-200 mb-1">{content.emailLabel}</h3>
                  <p className="text-xs font-mono text-slate-400 select-all">{content.email1}</p>
                  <p className="text-xs font-mono text-slate-400 select-all">{content.email2}</p>
                </div>

                {/* Telephone module card */}
                <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/40 hover:bg-slate-900/60 hover:border-slate-800 transition-all">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/15 mb-4">
                    <Phone className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-200 mb-1">{content.phoneLabel}</h3>
                  <p className="text-xs font-mono text-slate-400">{content.phone1}</p>
                  <p className="text-xs font-mono text-slate-400">{content.phone2}</p>
                </div>
              </div>

              {/* Physical Geographic Marker Card */}
              <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950 overflow-hidden relative group min-h-[180px] flex flex-col justify-end">
                <img 
                  src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80" 
                  alt="Corporate Location" 
                  className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:scale-102 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
                
                <div className="relative z-10 w-full">
                  <div className="w-10 h-10 bg-indigo-500/15 rounded-xl flex items-center justify-center border border-indigo-500/20 mb-4 whitespace-nowrap">
                    <MapPin className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-200 mb-1">{content.addressLabel}</h3>
                  <p className="text-xs leading-relaxed text-slate-400 font-medium">
                    {content.addressLine1}<br />
                    {content.addressLine2}<br />
                    {content.addressLine3}
                  </p>
                </div>
              </div>

            </div>

            {/* Form Section Column */}
            <div className="lg:col-span-7">
              <div className="border border-slate-900 rounded-3xl p-8 md:p-10 bg-slate-900/25 backdrop-blur shadow-2xl relative overflow-hidden">
                
                <AnimatePresence>
                  {isSubmitted && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="absolute inset-0 z-20 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-8 text-center rounded-3xl"
                    >
                      <div className="space-y-4 max-w-sm">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full border border-emerald-500/20 flex items-center justify-center mx-auto">
                          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-black text-white">{t('contact.successTitle') || 'Message Sent!'}</h3>
                        <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                          We have recorded your inquiry. TallyFlow support desk will reach out via the provided address in under 12 hours.
                        </p>
                        <button 
                          onClick={() => setIsSubmitted(false)}
                          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-98"
                        >
                          {t('common.close') || 'Close'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="text-left mb-4">
                    <h3 className="text-lg font-bold text-slate-100">Send an Inquiry</h3>
                    <p className="text-xs text-slate-500">All communication is cryptographically secured.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{t('contact.fullName')}</label>
                      <input 
                        type="text" 
                        required
                        value={formState.name}
                        onChange={(e) => setFormState({...formState, name: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-xl px-4 py-3 text-xs text-white outline-none transition-all placeholder-slate-700 font-semibold"
                        placeholder={t('contact.fullNamePlaceholder') || "e.g. Rafiqul Islam"}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{t('contact.emailAddress')}</label>
                      <input 
                        type="email" 
                        required
                        value={formState.email}
                        onChange={(e) => setFormState({...formState, email: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-xl px-4 py-3 text-xs text-white outline-none transition-all placeholder-slate-700 font-semibold"
                        placeholder={t('contact.emailPlaceholder') || "e.g. rafiq@gmail.com"}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{t('contact.subject')}</label>
                    <input 
                      type="text" 
                      required
                      value={formState.subject}
                      onChange={(e) => setFormState({...formState, subject: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-xl px-4 py-3 text-xs text-white outline-none transition-all placeholder-slate-700 font-semibold"
                      placeholder={t('contact.subjectPlaceholder') || "e.g. Requesting Custom Platinum Demo Plan"}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{t('contact.message')}</label>
                    <textarea 
                      required
                      rows={5}
                      value={formState.message}
                      onChange={(e) => setFormState({...formState, message: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-xl px-4 py-3 text-xs text-white outline-none transition-all resize-none placeholder-slate-700 font-semibold"
                      placeholder={t('contact.messagePlaceholder') || "Describe your business scale or godown limits..."}
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg"
                  >
                    <Send className="w-4 h-4" />
                    {t('contact.sendMessage') || 'Send Secured Message'}
                  </button>
                </form>

              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
