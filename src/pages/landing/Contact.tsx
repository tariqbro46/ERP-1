import React from 'react';
import { Navbar } from '../../components/landing/Navbar';
import { Footer } from '../../components/landing/Footer';
import { Mail, Phone, MapPin, Send, HelpCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSiteContent } from '../../hooks/useSiteContent';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';
import { db } from '../../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export const Contact = () => {
  const { t } = useLanguage();
  const DEFAULT_CONTENT = {
    title: t('contact.title') || "Get in Touch with TallyFlow",
    titleColor: "#0f172a",
    subtitle: t('contact.subtitle') || "Have questions? We're here to help. Send us a message and our team will get back to you within 24 hours.",
    subtitleColor: "#64748b",
    pageBgColor: "#ffffff",
    formBgColor: "#ffffff",
    formTitleColor: "#0f172a",
    formSubtitleColor: "#64748b",
    inputBgColor: "#f8fafc",
    inputTextColor: "#0f172a",
    buttonBgColor: "#1e293b",
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

  const { content: rawContent } = useSiteContent('contact', DEFAULT_CONTENT);
  const content = {
    ...rawContent,
    titleColor: "#0f172a",
    subtitleColor: "#64748b",
    pageBgColor: "#ffffff"
  };

  const [formState, setFormState] = React.useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'inquiries'), {
        name: formState.name,
        email: formState.email,
        subject: formState.subject,
        message: formState.message,
        createdAt: Timestamp.now()
      });
      setIsSubmitted(true);
      setFormState({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setIsSubmitted(false), 8000);
    } catch (err) {
      console.error('Error submitting inquiry:', err);
    } finally {
      setIsSubmitting(false);
    }
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
        <div className="absolute top-12 left-1/4 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="absolute top-24 right-1/3 w-[450px] h-[450px] bg-indigo-100/40 rounded-full blur-[120px] pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] bg-blue-50 text-blue-700 px-3.5 py-1.5 rounded-full border border-blue-100 mb-6 inline-block shadow-2xs">
                CONNECT WITH US
              </span>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 text-slate-900">
                {content.title}
              </h1>
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
                {content.subtitle}
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-24 max-w-6xl mx-auto">
            
            {/* Contact Details Column */}
            <div className="lg:col-span-5 space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                {/* Email module card */}
                <div className="p-6 rounded-2xl border border-slate-200/90 bg-white hover:bg-slate-50/50 hover:border-slate-300 transition-all shadow-xs">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100 mb-4 text-blue-600">
                    <Mail className="w-5 h-5" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{content.emailLabel}</h3>
                  <p className="text-xs font-medium text-slate-800 select-all font-mono">{content.email1}</p>
                  <p className="text-xs font-medium text-slate-800 select-all font-mono">{content.email2}</p>
                </div>

                {/* Telephone module card */}
                <div className="p-6 rounded-2xl border border-slate-200/90 bg-white hover:bg-slate-50/50 hover:border-slate-300 transition-all shadow-xs">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100 mb-4 text-amber-600">
                    <Phone className="w-5 h-5" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{content.phoneLabel}</h3>
                  <p className="text-xs font-bold text-slate-900 font-mono">{content.phone1}</p>
                  <p className="text-xs text-slate-500 font-normal">{content.phone2}</p>
                </div>
              </div>

              {/* Physical Geographic Marker Card */}
              <div className="p-6 rounded-2xl border border-slate-200 bg-slate-900 overflow-hidden relative group min-h-[190px] flex flex-col justify-end text-white shadow-md">
                <img 
                  src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80" 
                  alt="Corporate Location" 
                  className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:scale-102 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
                
                <div className="relative z-10 w-full">
                  <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-400/30 mb-3 text-indigo-300">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">{content.addressLabel}</h3>
                  <p className="text-xs leading-relaxed text-slate-200 font-normal">
                    {content.addressLine1}<br />
                    {content.addressLine2}<br />
                    {content.addressLine3}
                  </p>
                </div>
              </div>

            </div>

            {/* Form Section Column */}
            <div className="lg:col-span-7">
              <div className="border border-slate-200/90 rounded-2xl p-7 md:p-9 bg-white shadow-sm relative overflow-hidden">
                
                <AnimatePresence>
                  {isSubmitted && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="absolute inset-0 z-20 bg-white/95 backdrop-blur-xs flex items-center justify-center p-8 text-center rounded-2xl"
                    >
                      <div className="space-y-4 max-w-sm">
                        <div className="w-14 h-14 bg-emerald-50 rounded-full border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
                          <CheckCircle2 className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">{t('contact.successTitle') || 'Message Sent!'}</h3>
                        <p className="text-slate-600 text-xs leading-relaxed font-normal">
                          We have recorded your inquiry. The TallyFlow team will respond to your email within 24 hours.
                        </p>
                        <button 
                          onClick={() => setIsSubmitted(false)}
                          className="px-5 py-2 bg-[#1e293b] hover:bg-[#0f172a] text-white rounded-lg text-xs font-bold cursor-pointer transition-all active:scale-98"
                        >
                          {t('common.close') || 'Close'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="text-left mb-2">
                    <h3 className="text-lg font-bold text-slate-900">Send an Inquiry</h3>
                    <p className="text-xs text-slate-500">Fill in the fields below and our operations specialist will get in touch.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">{t('contact.fullName')}</label>
                      <input 
                        type="text" 
                        required
                        value={formState.name}
                        onChange={(e) => setFormState({...formState, name: e.target.value})}
                        className="w-full bg-slate-50/60 border border-slate-200 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none transition-all placeholder-slate-400 font-medium"
                        placeholder={t('contact.fullNamePlaceholder') || "e.g. Rafiqul Islam"}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">{t('contact.emailAddress')}</label>
                      <input 
                        type="email" 
                        required
                        value={formState.email}
                        onChange={(e) => setFormState({...formState, email: e.target.value})}
                        className="w-full bg-slate-50/60 border border-slate-200 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none transition-all placeholder-slate-400 font-medium"
                        placeholder={t('contact.emailPlaceholder') || "e.g. rafiq@gmail.com"}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">{t('contact.subject')}</label>
                    <input 
                      type="text" 
                      required
                      value={formState.subject}
                      onChange={(e) => setFormState({...formState, subject: e.target.value})}
                      className="w-full bg-slate-50/60 border border-slate-200 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none transition-all placeholder-slate-400 font-medium"
                      placeholder={t('contact.subjectPlaceholder') || "e.g. Requesting Custom Platinum Demo Plan"}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">{t('contact.message')}</label>
                    <textarea 
                      required
                      rows={4}
                      value={formState.message}
                      onChange={(e) => setFormState({...formState, message: e.target.value})}
                      className="w-full bg-slate-50/60 border border-slate-200 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none transition-all resize-none placeholder-slate-400 font-medium"
                      placeholder={t('contact.messagePlaceholder') || "Describe your business requirements or godown scale..."}
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-[#1e293b] hover:bg-[#0f172a] active:scale-[0.99] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        {t('contact.sendMessage') || 'Send Message'}
                      </>
                    )}
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
