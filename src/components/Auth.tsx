import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { erpService } from '../services/erpService';
import { doc, setDoc, getDoc, collection, serverTimestamp, query, where, getDocs, limit } from 'firebase/firestore';
import { Loader2, AlertCircle, Eye, EyeOff, Mail, Lock, Building, MapPin, Globe, Phone, FileText, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSiteContent } from '../hooks/useSiteContent';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  AuthTemplate 
} from '../types';
import {
  AuthLayoutProps,
  SoftrAuthLayout,
  SoftrSplitAuthLayout,
  ClassicSplitAuthLayout,
  GlassAuthLayout,
  EnterpriseAuthLayout
} from './auth/AuthLayouts';

export const LOGIN_DEFAULT = {
  template: 'softr' as AuthTemplate,
  brandName: 'softr',
  brandLogoUrl: '',
  title: "Nice seeing you again, pal!",
  titleColor: "",
  subtitle: "Can't wait to see what you build today",
  subtitleColor: "",
  googleButtonText: "Continue with Google",
  ssoButtonText: "Continue with SSO",
  dividerText: "OR",
  emailLabel: "Email",
  emailPlaceholder: "your@email.com",
  passwordLabel: "Password",
  passwordPlaceholder: "Password",
  forgotPasswordLinkText: "Forgot password?",
  signInButtonText: "Sign in",
  noAccountText: "Don't have an account?",
  signUpLinkText: "Sign up",
  footerCopyrightText: "© 2026 Softr Studio ERP. All rights reserved.",
  testimonialQuote: "“We have a very unique way of managing projects and collaborating — we're very process- and data-driven. With Softr, we were able to unite our project management in one platform.”",
  testimonialAuthorName: "Natalie Neumann",
  testimonialAuthorTitle: "COO, Designity",
  testimonialAuthorAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80",
  clientLogosText: "UNIVERSAL, MIT, make, Google, EvenUp, clay",
  showChatSupport: true,
  loginImage: "https://picsum.photos/seed/dribbble-login/1200/1600",
  imageTitle: "Streamline your business operations.",
  imageTitleColor: "#ffffff",
  imageSubtitle: "The most powerful ERP solution for modern enterprises.",
  imageSubtitleColor: "rgba(255,255,255,0.8)",
  forgotTitle: "Forgot password?",
  forgotTitleColor: "",
  forgotSubtitle: "Enter your email and we'll send you a link to reset your password.",
  forgotSubtitleColor: "",
  sendResetButtonText: "Send reset link",
  cancelButtonText: "Cancel",
  resetImageTitle: "Recover your account.",
  resetImageTitleColor: "#ffffff",
  resetImageSubtitle: "Don't worry, it happens to the best of us.",
  resetImageSubtitleColor: "rgba(255,255,255,0.8)",
  resetImage: "https://picsum.photos/seed/auth-bg/1200/1600"
};

export const REGISTER_DEFAULT = {
  template: 'softr' as AuthTemplate,
  brandName: 'softr',
  brandLogoUrl: '',
  title: "Start building with Softr",
  titleColor: "",
  subtitle: "Join thousands of teams building powerful portals.",
  subtitleColor: "",
  googleButtonText: "Continue with Google",
  ssoButtonText: "Continue with SSO",
  dividerText: "OR",
  fullNameLabel: "Full Name",
  fullNamePlaceholder: "Your full name",
  emailLabel: "Email",
  emailPlaceholder: "your@email.com",
  passwordLabel: "Password",
  passwordPlaceholder: "Password (min 6 characters)",
  companyNameLabel: "Company Name",
  companyNamePlaceholder: "e.g. Acme Corp",
  sloganLabel: "Slogan",
  sloganPlaceholder: "Innovating the future",
  addressLabel: "Address",
  registerButtonText: "Create Account",
  alreadyAccountText: "Already have an account?",
  signInLinkText: "Sign in",
  footerCopyrightText: "© 2026 Softr Studio ERP. All rights reserved.",
  testimonialQuote: "“We have a very unique way of managing projects and collaborating — we're very process- and data-driven. With Softr, we were able to unite our project management in one platform.”",
  testimonialAuthorName: "Natalie Neumann",
  testimonialAuthorTitle: "COO, Designity",
  testimonialAuthorAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80",
  clientLogosText: "UNIVERSAL, MIT, make, Google, EvenUp, clay",
  showChatSupport: true,
  imageTitle: "Join the future of ERP.",
  imageTitleColor: "#ffffff",
  imageSubtitle: "Create your account and start managing your business today.",
  imageSubtitleColor: "rgba(255,255,255,0.8)",
  registerImage: "https://picsum.photos/seed/dribbble-reg/1200/1600"
};

export const Login: React.FC<{ onToggle: () => void; overrideTemplate?: AuthTemplate }> = ({ onToggle, overrideTemplate }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { content } = useSiteContent('login', LOGIN_DEFAULT);
  const { content: globalSettings } = useSiteContent('global', { registrationEnabled: true, systemLogo: '', authTemplate: 'softr' });
  
  const [email, setEmail] = useState(() => localStorage.getItem('erp_remembered_email') || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('erp_remembered_email'));
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const activeTemplate: AuthTemplate = overrideTemplate || content.template || globalSettings.authTemplate || 'softr';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    try {
      if (rememberMe && cleanEmail) {
        localStorage.setItem('erp_remembered_email', cleanEmail);
      } else {
        localStorage.removeItem('erp_remembered_email');
      }

      await signInWithEmailAndPassword(auth, cleanEmail, password);
    } catch (err: any) {
      console.error("Login error:", err);
      const code = err?.code || '';
      if (code === 'auth/operation-not-allowed') {
        setError('Email/Password authentication is not enabled in Firebase Console.');
      } else if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        setError('Incorrect email or password. Please verify your credentials, reset password, or sign up if you do not have an account yet.');
      } else if (code === 'auth/user-not-found') {
        setError('No account found with this email. Please check the spelling or sign up.');
      } else if (code === 'auth/invalid-email') {
        setError('Invalid email address format.');
      } else if (code === 'auth/user-disabled') {
        setError('This user account has been disabled.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please wait a moment or reset your password.');
      } else if (code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(err.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const gUser = result.user;

      if (gUser) {
        const cleanEmail = gUser.email?.toLowerCase() || '';
        const userRef = doc(db, 'users', gUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          let existingCompanyId = '';
          let existingRole: any = cleanEmail === 'sapientman46@gmail.com' ? 'Founder' : 'Admin';
          
          try {
            const q = query(collection(db, 'users'), where('email', '==', cleanEmail), limit(1));
            const existingDocs = await getDocs(q);
            if (!existingDocs.empty) {
              const oldData = existingDocs.docs[0].data();
              existingCompanyId = oldData.companyId;
              if (cleanEmail === 'sapientman46@gmail.com') {
                existingRole = 'Founder';
              } else {
                existingRole = oldData.role || 'Admin';
              }
            }
          } catch (e) {
            console.error("Error querying existing user by email:", e);
          }

          if (existingCompanyId) {
            await setDoc(userRef, {
              uid: gUser.uid,
              email: cleanEmail,
              displayName: gUser.displayName || cleanEmail.split('@')[0],
              companyId: existingCompanyId,
              role: existingRole,
              createdAt: serverTimestamp()
            });
          } else {
            const companyRef = doc(collection(db, 'companies'));
            const trialExpiry = new Date();
            trialExpiry.setDate(trialExpiry.getDate() + 14);
            const compName = gUser.displayName ? `${gUser.displayName}'s Organization` : 'My Enterprise';

            await setDoc(companyRef, {
              id: companyRef.id,
              name: compName,
              slogan: 'Enterprise ERP Solution',
              email: cleanEmail,
              ownerId: gUser.uid,
              createdBy: gUser.uid,
              createdAt: serverTimestamp(),
              subscriptionStatus: 'trial',
              planType: 'free',
              expiryDate: trialExpiry.toISOString(),
              isAccessEnabled: true
            });

            await setDoc(userRef, {
              uid: gUser.uid,
              email: cleanEmail,
              displayName: gUser.displayName || cleanEmail.split('@')[0],
              companyId: companyRef.id,
              role: cleanEmail === 'sapientman46@gmail.com' ? 'Founder' : 'Admin',
              createdAt: serverTimestamp()
            });

            await setDoc(doc(db, 'settings', companyRef.id), {
              companyId: companyRef.id,
              companyName: compName,
              slogan: 'Enterprise ERP Solution',
              financialYearStart: '2024-04-01',
              baseCurrencySymbol: '৳',
              timezone: 'Asia/Dhaka',
              printHeader: compName,
              showPrintHeader: true,
              updatedAt: serverTimestamp()
            });

            const groups = await erpService.seedDefaultGroups(companyRef.id);
            const getGroupId = (name: string) => groups.find(g => g.name === name)?.id;
            const defaultLedgers = [
              { name: 'Sales A/c', group_id: getGroupId('Sales Accounts'), opening_balance: 0 },
              { name: 'Purchase A/c', group_id: getGroupId('Purchase Accounts'), opening_balance: 0 },
              { name: 'Cash', group_id: getGroupId('Cash-in-Hand'), opening_balance: 0 },
              { name: 'Bank', group_id: getGroupId('Bank Accounts'), opening_balance: 0 },
              { name: 'Profit & Loss A/c', group_id: getGroupId('Indirect Expenses'), opening_balance: 0 },
            ];
            for (const ledger of defaultLedgers) {
              if (ledger.group_id) {
                await erpService.createLedger(companyRef.id, ledger);
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        // User intentionally dismissed popup
      } else if (err.code === 'auth/popup-blocked') {
        setError('Google Sign-in popup was blocked by browser. Please allow popups for this page.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Google provider is not enabled in Firebase Console. Please log in with email/password.');
      } else {
        setError(err.message || 'Google sign-in failed.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setResetSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please verify the email address.');
    } finally {
      setLoading(false);
    }
  };

  // Password Reset View
  if (showReset) {
    const layoutProps: AuthLayoutProps = {
      template: activeTemplate,
      brandName: content.brandName,
      brandLogoUrl: content.brandLogoUrl,
      title: content.forgotTitle || "Forgot password?",
      subtitle: content.forgotSubtitle || "Enter your email and we'll send you a link to reset your password.",
      titleColor: content.forgotTitleColor,
      subtitleColor: content.forgotSubtitleColor,
      isRegister: false,
      onToggle: () => { setShowReset(false); setResetSent(false); },
      onBackToHome: () => { setShowReset(false); setResetSent(false); navigate('/'); },
      bgImage: content.resetImage || content.loginImage,
      imageTitle: content.resetImageTitle || content.imageTitle,
      imageSubtitle: content.resetImageSubtitle || content.imageSubtitle,
      imageTitleColor: content.resetImageTitleColor || content.imageTitleColor,
      imageSubtitleColor: content.resetImageSubtitleColor || content.imageSubtitleColor,
      testimonialQuote: content.testimonialQuote,
      testimonialAuthorName: content.testimonialAuthorName,
      testimonialAuthorTitle: content.testimonialAuthorTitle,
      testimonialAuthorAvatar: content.testimonialAuthorAvatar,
      clientLogosText: content.clientLogosText,
      showChatSupport: content.showChatSupport,
      footerCopyrightText: content.footerCopyrightText,
      onGoogleSignIn: handleGoogleSignIn,
      googleLoading,
      systemLogo: globalSettings.systemLogo,
    };

    const resetBody = (
      <div className="space-y-4">
        {resetSent ? (
          <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Mail className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-emerald-800">
              {content.resetSentText || "Password reset link has been sent to your email!"}
            </p>
            <button 
              onClick={() => { setShowReset(false); setResetSent(false); }}
              className="w-full py-2.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-black transition-colors"
            >
              {content.signInLinkText || "Back to Sign in"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[12px] font-medium text-slate-700">{content.emailLabel || "Email"}</label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-[13px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                placeholder={content.emailPlaceholder || "your@email.com"}
                required
              />
            </div>

            {error && (
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-lg flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowReset(false)}
                className="flex-1 py-2.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {content.cancelButtonText || "Cancel"}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] py-2.5 bg-[#1e293b] hover:bg-[#0f172a] text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (content.sendResetButtonText || "Send reset link")}
              </button>
            </div>
          </form>
        )}
      </div>
    );

    if (activeTemplate === 'softr') {
      return <SoftrAuthLayout {...layoutProps}>{resetBody}</SoftrAuthLayout>;
    }
    if (activeTemplate === 'softr-split') {
      return <SoftrSplitAuthLayout {...layoutProps}>{resetBody}</SoftrSplitAuthLayout>;
    }
    if (activeTemplate === 'glass') {
      return <GlassAuthLayout {...layoutProps}>{resetBody}</GlassAuthLayout>;
    }
    if (activeTemplate === 'enterprise') {
      return <EnterpriseAuthLayout {...layoutProps}>{resetBody}</EnterpriseAuthLayout>;
    }
    return <ClassicSplitAuthLayout {...layoutProps}>{resetBody}</ClassicSplitAuthLayout>;
  }

  // Exact Softr Login Form Body (Image 1 replica)
  const loginFormBody = (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      {/* Email Input */}
      <div className="space-y-1">
        <label className="text-[12px] font-medium text-slate-700 block">{content.emailLabel || "Email"}</label>
        <input
          type="email"
          id="login-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-[13px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
          placeholder={content.emailPlaceholder || "your@email.com"}
          required
          autoComplete="email"
        />
      </div>

      {/* Password Input with show/hide toggle */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <label className="text-[12px] font-medium text-slate-700">{content.passwordLabel || "Password"}</label>
          <button 
            type="button"
            onClick={() => setShowReset(true)}
            className="text-[12px] font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
          >
            {content.forgotPasswordLinkText || "Forgot password?"}
          </button>
        </div>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            id="login-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-3.5 pr-10 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-[13px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
            placeholder={content.passwordPlaceholder || "Password"}
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 space-y-2">
          <div className="flex items-start gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1 border-t border-rose-200/60 text-[11px]">
            <button
              type="button"
              onClick={() => {
                setResetEmail(email.trim());
                setShowReset(true);
              }}
              className="text-rose-800 hover:text-rose-950 font-bold underline cursor-pointer"
            >
              Reset Password
            </button>
            <span className="text-rose-300">•</span>
            <button
              type="button"
              onClick={onToggle}
              className="text-rose-800 hover:text-rose-950 font-bold underline cursor-pointer"
            >
              Sign Up Instead
            </button>
            <span className="text-rose-300">•</span>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer"
            >
              Sign in with Google
            </button>
          </div>
        </div>
      )}

      {/* Sign in Button */}
      <button
        type="submit"
        disabled={loading}
        id="login-submit-btn"
        className="w-full py-2.5 px-4 rounded-lg bg-[#1e293b] hover:bg-[#0f172a] text-white text-[13px] font-semibold transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 mt-2 cursor-pointer"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Signing in...</span>
          </>
        ) : (
          <span>{content.signInButtonText || "Sign in"}</span>
        )}
      </button>
    </form>
  );

  const sharedLayoutProps: AuthLayoutProps = {
    template: activeTemplate,
    brandName: content.brandName,
    brandLogoUrl: content.brandLogoUrl,
    title: content.title || "Nice seeing you again, pal!",
    subtitle: content.subtitle || "Can't wait to see what you build today",
    titleColor: content.titleColor,
    subtitleColor: content.subtitleColor,
    googleButtonText: content.googleButtonText,
    ssoButtonText: content.ssoButtonText,
    dividerText: content.dividerText,
    switchPromptText: content.noAccountText,
    switchLinkText: content.signUpLinkText,
    footerCopyrightText: content.footerCopyrightText,
    testimonialQuote: content.testimonialQuote,
    testimonialAuthorName: content.testimonialAuthorName,
    testimonialAuthorTitle: content.testimonialAuthorTitle,
    testimonialAuthorAvatar: content.testimonialAuthorAvatar,
    clientLogosText: content.clientLogosText,
    showChatSupport: content.showChatSupport,
    isRegister: false,
    onToggle,
    onBackToHome: () => navigate('/'),
    bgImage: content.loginImage,
    imageTitle: content.imageTitle,
    imageSubtitle: content.imageSubtitle,
    imageTitleColor: content.imageTitleColor,
    imageSubtitleColor: content.imageSubtitleColor,
    onGoogleSignIn: handleGoogleSignIn,
    googleLoading,
    systemLogo: globalSettings.systemLogo,
    children: loginFormBody
  };

  if (activeTemplate === 'softr') {
    return <SoftrAuthLayout {...sharedLayoutProps} />;
  }
  if (activeTemplate === 'softr-split') {
    return <SoftrSplitAuthLayout {...sharedLayoutProps} />;
  }
  if (activeTemplate === 'glass') {
    return <GlassAuthLayout {...sharedLayoutProps} />;
  }
  if (activeTemplate === 'enterprise') {
    return <EnterpriseAuthLayout {...sharedLayoutProps} />;
  }
  return <ClassicSplitAuthLayout {...sharedLayoutProps} />;
};

export const Register: React.FC<{ onToggle: () => void; overrideTemplate?: AuthTemplate }> = ({ onToggle, overrideTemplate }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { content } = useSiteContent('register', REGISTER_DEFAULT);
  const { content: globalSettings } = useSiteContent('global', { registrationEnabled: true, systemLogo: '', authTemplate: 'softr' });

  useEffect(() => {
    if (globalSettings.registrationEnabled === false) {
      onToggle();
    }
  }, [globalSettings.registrationEnabled, onToggle]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  const [slogan, setSlogan] = useState('');
  const [address, setAddress] = useState('');
  const [financialYearStart, setFinancialYearStart] = useState('2024-04-01');
  const [currencySymbol, setCurrencySymbol] = useState('৳');
  const [timezone, setTimezone] = useState('Asia/Dhaka');
  const [printHeader, setPrintHeader] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [printFooter, setPrintFooter] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [step, setStep] = useState(1);

  const activeTemplate: AuthTemplate = overrideTemplate || content.template || globalSettings.authTemplate || 'softr';

  const handleGoogleSignUp = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const gUser = result.user;

      if (gUser) {
        const cleanEmail = gUser.email?.toLowerCase() || '';
        const userRef = doc(db, 'users', gUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          let existingCompanyId = '';
          let existingRole: any = cleanEmail === 'sapientman46@gmail.com' ? 'Founder' : 'Admin';
          
          try {
            const q = query(collection(db, 'users'), where('email', '==', cleanEmail), limit(1));
            const existingDocs = await getDocs(q);
            if (!existingDocs.empty) {
              const oldData = existingDocs.docs[0].data();
              existingCompanyId = oldData.companyId;
              if (cleanEmail === 'sapientman46@gmail.com') {
                existingRole = 'Founder';
              } else {
                existingRole = oldData.role || 'Admin';
              }
            }
          } catch (e) {
            console.error("Error querying existing user by email:", e);
          }

          if (existingCompanyId) {
            await setDoc(userRef, {
              uid: gUser.uid,
              email: cleanEmail,
              displayName: gUser.displayName || cleanEmail.split('@')[0],
              companyId: existingCompanyId,
              role: existingRole,
              createdAt: serverTimestamp()
            });
          } else {
            const companyRef = doc(collection(db, 'companies'));
            const trialExpiry = new Date();
            trialExpiry.setDate(trialExpiry.getDate() + 14);
            const compName = gUser.displayName ? `${gUser.displayName}'s Organization` : 'My Enterprise';

            await setDoc(companyRef, {
              id: companyRef.id,
              name: compName,
              slogan: 'Enterprise ERP Solution',
              email: cleanEmail,
              ownerId: gUser.uid,
              createdBy: gUser.uid,
              createdAt: serverTimestamp(),
              subscriptionStatus: 'trial',
              planType: 'free',
              expiryDate: trialExpiry.toISOString(),
              isAccessEnabled: true
            });

            await setDoc(userRef, {
              uid: gUser.uid,
              email: cleanEmail,
              displayName: gUser.displayName || cleanEmail.split('@')[0],
              companyId: companyRef.id,
              role: cleanEmail === 'sapientman46@gmail.com' ? 'Founder' : 'Admin',
              createdAt: serverTimestamp()
            });

            await setDoc(doc(db, 'settings', companyRef.id), {
              companyId: companyRef.id,
              companyName: compName,
              slogan: 'Enterprise ERP Solution',
              financialYearStart: '2024-04-01',
              baseCurrencySymbol: '৳',
              timezone: 'Asia/Dhaka',
              printHeader: compName,
              showPrintHeader: true,
              updatedAt: serverTimestamp()
            });

            const groups = await erpService.seedDefaultGroups(companyRef.id);
            const getGroupId = (name: string) => groups.find(g => g.name === name)?.id;
            const defaultLedgers = [
              { name: 'Sales A/c', group_id: getGroupId('Sales Accounts'), opening_balance: 0 },
              { name: 'Purchase A/c', group_id: getGroupId('Purchase Accounts'), opening_balance: 0 },
              { name: 'Cash', group_id: getGroupId('Cash-in-Hand'), opening_balance: 0 },
              { name: 'Bank', group_id: getGroupId('Bank Accounts'), opening_balance: 0 },
              { name: 'Profit & Loss A/c', group_id: getGroupId('Indirect Expenses'), opening_balance: 0 },
            ];
            for (const ledger of defaultLedgers) {
              if (ledger.group_id) {
                await erpService.createLedger(companyRef.id, ledger);
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.error("Google sign up error:", err);
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        // Dismissed
      } else if (err.code === 'auth/popup-blocked') {
        setError('Google Sign-in popup was blocked by browser.');
      } else {
        setError(err.message || 'Google sign-up failed.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      const companyRef = doc(collection(db, 'companies'));
      const trialExpiry = new Date();
      trialExpiry.setDate(trialExpiry.getDate() + 14);

      await setDoc(companyRef, {
        id: companyRef.id,
        name: companyName,
        slogan,
        address,
        phone: contactPhone,
        email: contactEmail || email,
        website: websiteUrl,
        ownerId: user.uid,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        subscriptionStatus: 'trial',
        planType: 'free',
        expiryDate: trialExpiry.toISOString(),
        isAccessEnabled: true
      });

      const isFounder = email.toLowerCase() === 'sapientman46@gmail.com';
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: displayName || email.split('@')[0],
        companyId: companyRef.id,
        role: isFounder ? 'Founder' : 'Admin',
        createdAt: serverTimestamp()
      });

      await setDoc(doc(db, 'settings', companyRef.id), {
        companyId: companyRef.id,
        companyName,
        slogan: slogan || 'Enterprise ERP Solution',
        companyAddress: address,
        financialYearStart,
        baseCurrencySymbol: currencySymbol,
        timezone,
        printHeader: printHeader || companyName,
        printPhone: contactPhone,
        printEmail: contactEmail || email,
        printWebsite: websiteUrl,
        printFooter: printFooter,
        showPrintHeader: true,
        showPrintPhone: true,
        showPrintEmail: true,
        showPrintWebsite: !!websiteUrl,
        showPrintFooter: true,
        updatedAt: serverTimestamp()
      });

      const groups = await erpService.seedDefaultGroups(companyRef.id);
      const getGroupId = (name: string) => groups.find(g => g.name === name)?.id;

      const defaultLedgers = [
        { name: 'Sales A/c', group_id: getGroupId('Sales Accounts'), opening_balance: 0 },
        { name: 'Purchase A/c', group_id: getGroupId('Purchase Accounts'), opening_balance: 0 },
        { name: 'Cash', group_id: getGroupId('Cash-in-Hand'), opening_balance: 0 },
        { name: 'Bank', group_id: getGroupId('Bank Accounts'), opening_balance: 0 },
        { name: 'Profit & Loss A/c', group_id: getGroupId('Indirect Expenses'), opening_balance: 0 },
        { name: 'Bad Debts', group_id: getGroupId('Indirect Expenses'), opening_balance: 0 },
        { name: 'Management Cost', group_id: getGroupId('Indirect Expenses'), opening_balance: 0 },
        { name: 'Utility Bill', group_id: getGroupId('Indirect Expenses'), opening_balance: 0 },
      ];

      for (const ledger of defaultLedgers) {
        if (ledger.group_id) {
          await erpService.createLedger(companyRef.id, ledger);
        }
      }

    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password authentication is not enabled in Firebase Console.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use at least 6 characters.');
      } else {
        setError(err.message || 'Registration failed. Please verify your details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const registerFormBody = (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      {/* Step 1: User credentials */}
      {step === 1 && (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[12px] font-medium text-slate-700 block">{content.fullNameLabel || "Full Name"}</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-[13px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
              placeholder={content.fullNamePlaceholder || "Your full name"}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[12px] font-medium text-slate-700 block">{content.emailLabel || "Email"}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-[13px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
              placeholder={content.emailPlaceholder || "your@email.com"}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[12px] font-medium text-slate-700 block">{content.passwordLabel || "Password"}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-3.5 pr-10 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-[13px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                placeholder={content.passwordPlaceholder || "Password (min 6 characters)"}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Company Info */}
      {step === 2 && (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[12px] font-medium text-slate-700 block">{content.companyNameLabel || "Company Name"}</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-[13px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
              placeholder={content.companyNamePlaceholder || "Acme Corp"}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[12px] font-medium text-slate-700 block">{content.sloganLabel || "Slogan"}</label>
            <input
              type="text"
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-[13px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
              placeholder={content.sloganPlaceholder || "Innovating the future"}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[12px] font-medium text-slate-700 block">{content.addressLabel || "Address"}</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-[13px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all resize-none"
              placeholder="123 Business St, City"
              rows={2}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-700 block">FY Start</label>
              <input
                type="date"
                value={financialYearStart}
                onChange={(e) => setFinancialYearStart(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-900 outline-none"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-700 block">Currency</label>
              <input
                type="text"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-900 outline-none"
                placeholder="৳ or $"
                required
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Contact details */}
      {step === 3 && (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[12px] font-medium text-slate-700 block">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-[13px] text-slate-900 outline-none"
            >
              <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
              <option value="UTC">UTC (Universal)</option>
              <option value="Asia/Kolkata">Asia/Kolkata (GMT+5:30)</option>
              <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[12px] font-medium text-slate-700 block">Phone</label>
            <input
              type="text"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-[13px] text-slate-900 placeholder:text-slate-400 outline-none"
              placeholder="+880..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-[12px] font-medium text-slate-700 block">Website</label>
            <input
              type="text"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-[13px] text-slate-900 placeholder:text-slate-400 outline-none"
              placeholder="https://..."
            />
          </div>
        </div>
      )}

      {error && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-600 flex items-start gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2 pt-1">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="flex-1 py-2.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Back
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex-[2] py-2.5 px-4 rounded-lg bg-[#1e293b] hover:bg-[#0f172a] text-white text-[13px] font-semibold transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Registering...</span>
            </>
          ) : (
            <span>{step === 3 ? (content.registerButtonText || "Create Account") : `Next (Step ${step} of 3)`}</span>
          )}
        </button>
      </div>
    </form>
  );

  const sharedLayoutProps: AuthLayoutProps = {
    template: activeTemplate,
    brandName: content.brandName,
    brandLogoUrl: content.brandLogoUrl,
    title: content.title || "Start building with Softr",
    subtitle: content.subtitle || "Join thousands of teams building powerful portals.",
    titleColor: content.titleColor,
    subtitleColor: content.subtitleColor,
    googleButtonText: content.googleButtonText,
    ssoButtonText: content.ssoButtonText,
    dividerText: content.dividerText,
    switchPromptText: content.alreadyAccountText,
    switchLinkText: content.signInLinkText,
    footerCopyrightText: content.footerCopyrightText,
    testimonialQuote: content.testimonialQuote,
    testimonialAuthorName: content.testimonialAuthorName,
    testimonialAuthorTitle: content.testimonialAuthorTitle,
    testimonialAuthorAvatar: content.testimonialAuthorAvatar,
    clientLogosText: content.clientLogosText,
    showChatSupport: content.showChatSupport,
    isRegister: true,
    step,
    totalSteps: 3,
    onToggle,
    onBackToHome: () => navigate('/'),
    bgImage: content.registerImage,
    imageTitle: content.imageTitle,
    imageSubtitle: content.imageSubtitle,
    imageTitleColor: content.imageTitleColor,
    imageSubtitleColor: content.imageSubtitleColor,
    onGoogleSignIn: handleGoogleSignUp,
    googleLoading,
    systemLogo: globalSettings.systemLogo,
    children: registerFormBody
  };

  if (activeTemplate === 'softr') {
    return <SoftrAuthLayout {...sharedLayoutProps} />;
  }
  if (activeTemplate === 'softr-split') {
    return <SoftrSplitAuthLayout {...sharedLayoutProps} />;
  }
  if (activeTemplate === 'glass') {
    return <GlassAuthLayout {...sharedLayoutProps} />;
  }
  if (activeTemplate === 'enterprise') {
    return <EnterpriseAuthLayout {...sharedLayoutProps} />;
  }
  return <ClassicSplitAuthLayout {...sharedLayoutProps} />;
};
