import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  PhoneCall, 
  Mail, 
  CheckCircle2, 
  X, 
  Clock, 
  ShieldAlert, 
  Sparkles, 
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuotaResetRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
}

export function QuotaResetRequestModal({ isOpen, onClose, companyName }: QuotaResetRequestModalProps) {
  const [copiedPhone, setCopiedPhone] = React.useState(false);
  const [copiedEmail, setCopiedEmail] = React.useState(false);

  const founderPhone = "+880 1742 058246";
  const founderPhoneRaw = "+8801742058246";
  const founderEmail = "sapientman46@gmail.com";

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('has-active-modal');
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('has-active-modal');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('has-active-modal');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(founderPhoneRaw);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(founderEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return createPortal(
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100"
        >
          {/* Header */}
          <div className="relative px-6 pt-6 pb-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border-b border-slate-800">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                <CheckCircle2 className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold tracking-wider uppercase border border-emerald-500/20 mb-1">
                  Request Sent / রিকোয়েস্ট পাঠানো হয়েছে
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Quota Reset Request Submitted
                </h3>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* Status Information */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Company Name:</span>
                <span className="text-emerald-400 font-semibold">{companyName || 'Your Company'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Status:</span>
                <span className="inline-flex items-center gap-1.5 text-amber-400 font-semibold">
                  <Clock className="w-3.5 h-3.5 animate-spin" /> Pending Founder Approval
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed pt-1 border-t border-slate-800/80">
                আপনার কোম্পানির কোটা রিসেটের অনুরোধ সফলভাবে সিস্টেম অ্যাডমিন / ফাউন্ডারের কাছে রেকর্ড হয়েছে। ফাউন্ডার অনুরোধটি দেখে কোটা রিসেট সম্পন্ন করবেন।
              </p>
            </div>

            {/* Direct Quick Service Call-out Banner */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-rose-500/15 border-2 border-amber-500/40 p-4 text-center shadow-lg">
              <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
              <p className="text-[11px] font-extrabold text-amber-400 uppercase tracking-widest flex items-center justify-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5" /> Instant Support & Reset
              </p>
              <h4 className="text-base sm:text-lg font-black text-amber-200 tracking-tight">
                For quick service, please call now
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                জরুরি প্রয়োজনে দ্রুত সেবা পেতে সরাসরি কল করুন
              </p>
            </div>

            {/* Contact Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Direct Phone Call */}
              <div className="p-3.5 bg-slate-800/60 hover:bg-slate-800/90 border border-slate-700/80 hover:border-amber-500/40 rounded-xl transition-all flex flex-col justify-between gap-3 group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                      <PhoneCall className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Founder Phone</p>
                      <p className="text-xs font-mono font-bold text-white tracking-wide">{founderPhone}</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleCopyPhone}
                    className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-700/60 transition-colors"
                    title="Copy Phone Number"
                  >
                    {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <a
                  href={`tel:${founderPhoneRaw}`}
                  className="w-full py-2 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all cursor-pointer"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call Directly Now (এখনই কল করুন)</span>
                </a>
              </div>

              {/* Direct Email */}
              <div className="p-3.5 bg-slate-800/60 hover:bg-slate-800/90 border border-slate-700/80 hover:border-indigo-500/40 rounded-xl transition-all flex flex-col justify-between gap-3 group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 shrink-0 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Founder Email</p>
                      <p className="text-xs font-medium text-white truncate">{founderEmail}</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleCopyEmail}
                    className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-700/60 transition-colors shrink-0"
                    title="Copy Email"
                  >
                    {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <a
                  href={`mailto:${founderEmail}?subject=URGENT%20Daily%20Quota%20Reset%20Request%20-%20${encodeURIComponent(companyName)}`}
                  className="w-full py-2 px-3 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 border border-slate-600 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Send Email (মেইল করুন)</span>
                </a>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
