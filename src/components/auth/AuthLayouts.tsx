import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { AuthTemplate } from '../../types';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  Building2, 
  User, 
  Link2,
  KeyRound,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Home,
  ArrowLeft
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface AuthLayoutProps {
  template: AuthTemplate;
  title: string;
  subtitle?: string;
  titleColor?: string;
  subtitleColor?: string;
  brandName?: string;
  brandLogoUrl?: string;
  googleButtonText?: string;
  ssoButtonText?: string;
  dividerText?: string;
  switchPromptText?: string;
  switchLinkText?: string;
  footerCopyrightText?: string;
  testimonialQuote?: string;
  testimonialAuthorName?: string;
  testimonialAuthorTitle?: string;
  testimonialAuthorAvatar?: string;
  clientLogosText?: string;
  showChatSupport?: boolean;
  isRegister?: boolean;
  step?: number;
  totalSteps?: number;
  onToggle: () => void;
  onBackToHome?: () => void;
  bgImage?: string;
  imageTitle?: string;
  imageSubtitle?: string;
  imageTitleColor?: string;
  imageSubtitleColor?: string;
  onGoogleSignIn?: () => void;
  googleLoading?: boolean;
  systemLogo?: string;
  children?: React.ReactNode;
}

export const AUTH_TEMPLATE_OPTIONS = [
  {
    id: 'softr' as AuthTemplate,
    name: 'Softr Studio (Exact 1:1)',
    description: 'Exact Softr split screen with grid canvas, geometric rings, and floating client testimonial card.',
    badge: 'Softr Studio 1:1'
  },
  {
    id: 'softr-split' as AuthTemplate,
    name: 'Softr Minimal Centered',
    description: 'Pure centered Softr card on pristine light canvas with Google and SSO options.',
    badge: 'Clean Minimal'
  },
  {
    id: 'split' as AuthTemplate,
    name: 'Editorial Split Banner',
    description: 'Left high-resolution dynamic photography hero with right side auth form.',
    badge: 'Editorial'
  },
  {
    id: 'glass' as AuthTemplate,
    name: 'Holographic Glass Dark',
    description: 'Dark obsidian background with neon aurora mesh blur and translucent cards.',
    badge: 'Modern Dark'
  },
  {
    id: 'enterprise' as AuthTemplate,
    name: 'Enterprise Corporate',
    description: 'Clean corporate layout with top navbar, compliance badges, and structured tabs.',
    badge: 'Enterprise'
  }
];

export function HomeButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      id="auth-home-btn"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold shadow-sm transition-all active:scale-[0.98] cursor-pointer mb-6"
      title="Go to Home landing page"
    >
      <Home className="w-3.5 h-3.5 text-slate-600" />
      <span>Home</span>
    </button>
  );
}

export function GoogleButton({ onClick, loading, text }: { onClick?: () => void; loading?: boolean; text?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      id="google-auth-btn"
      className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-[13px] font-semibold transition-all duration-150 shadow-[0_1px_2px_rgba(0,0,0,0.04)] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
    >
      <svg className="w-4 h-4 shrink-0" viewBox="0 24 24" width="16" height="16">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        />
      </svg>
      <span>{text || "Continue with Google"}</span>
    </button>
  );
}

export function SSOButton({ onClick, text }: { onClick?: () => void; text?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      id="sso-auth-btn"
      className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-[13px] font-semibold transition-all duration-150 shadow-[0_1px_2px_rgba(0,0,0,0.04)] active:scale-[0.99] cursor-pointer"
    >
      <KeyRound className="w-3.5 h-3.5 text-slate-600 rotate-45" />
      <span>{text || "Continue with SSO"}</span>
    </button>
  );
}

export function SoftrDivider({ text }: { text?: string }) {
  return (
    <div className="relative flex py-2.5 items-center">
      <div className="flex-grow border-t border-slate-200"></div>
      <span className="flex-shrink mx-3 text-[10px] font-medium uppercase tracking-wider text-slate-400">
        {text || "OR"}
      </span>
      <div className="flex-grow border-t border-slate-200"></div>
    </div>
  );
}

export function ClientLogosRow({ clientLogosText }: { clientLogosText?: string }) {
  if (!clientLogosText || !clientLogosText.trim()) {
    return (
      <div className="pt-5 border-t border-slate-100 flex items-center justify-between gap-4 px-2 opacity-60 grayscale hover:grayscale-0 transition-all flex-wrap">
        <div className="text-[10px] font-extrabold text-slate-700 tracking-tighter uppercase">
          <span>UNIVERSAL</span>
        </div>
        <div className="text-[11px] font-black text-slate-800 tracking-widest">
          MIT
        </div>
        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800">
          <span className="font-mono text-purple-600">III</span> make
        </div>
        <div className="text-[11px] font-bold text-slate-700 tracking-tight">
          Google
        </div>
        <div className="text-[11px] font-bold text-slate-700">
          EvenUp
        </div>
        <div className="text-[11px] font-bold text-slate-700 font-serif">
          clay
        </div>
      </div>
    );
  }

  // Parse items from clientLogosText: can be comma, newline, or semicolon separated
  const items = clientLogosText
    .split(/[\n,;]+/)
    .map(i => i.trim())
    .filter(Boolean);

  if (items.length === 0) {
    return null;
  }

  const isUrlCheck = (str: string) =>
    str.startsWith('http://') ||
    str.startsWith('https://') ||
    str.startsWith('data:image/') ||
    str.startsWith('/') ||
    str.startsWith('blob:') ||
    /\.(png|jpg|jpeg|svg|webp|gif|ico|avif)($|\?)/i.test(str);

  // If there is only 1 item and it is an image, render it spanning the full left-to-right area of the testimonial card
  if (items.length === 1 && isUrlCheck(items[0])) {
    return (
      <div className="pt-5 border-t border-slate-100 w-full flex items-center justify-center">
        <img 
          src={items[0]} 
          alt="Client Logos" 
          className="w-full h-auto max-h-24 sm:max-h-28 object-contain filter grayscale hover:grayscale-0 opacity-80 hover:opacity-100 transition-all"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = 'none';
          }}
        />
      </div>
    );
  }

  return (
    <div className="pt-5 border-t border-slate-100 w-full flex items-center justify-center sm:justify-between gap-4 sm:gap-6 px-1 flex-wrap transition-all">
      {items.map((item, idx) => {
        const isUrl = isUrlCheck(item);

        if (isUrl) {
          return (
            <div key={idx} className="flex items-center justify-center max-h-10 sm:max-h-12 max-w-[150px] flex-1 min-w-[70px] transition-all">
              <img 
                src={item} 
                alt={`Client Logo ${idx + 1}`} 
                className="max-h-8 sm:max-h-10 max-w-full object-contain filter grayscale hover:grayscale-0 opacity-75 hover:opacity-100 transition-all"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  if (target.parentElement) {
                    const fallbackName = item.split('/').pop()?.split('?')[0]?.split('.')[0] || 'Partner';
                    target.parentElement.innerHTML = `<span class="text-[11px] font-bold text-slate-700 tracking-tight">${fallbackName}</span>`;
                  }
                }}
              />
            </div>
          );
        }

        return (
          <div key={idx} className="text-[11px] sm:text-xs font-bold text-slate-700 tracking-tight opacity-75 hover:opacity-100 transition-opacity">
            {item}
          </div>
        );
      })}
    </div>
  );
}

/**
 * 1. EXACT 1:1 SOFTR AUTH LAYOUT (Image 1 replica)
 */
export function SoftrAuthLayout({
  title,
  subtitle,
  titleColor,
  subtitleColor,
  brandName,
  brandLogoUrl,
  googleButtonText,
  ssoButtonText,
  dividerText,
  switchPromptText,
  switchLinkText,
  footerCopyrightText,
  testimonialQuote,
  testimonialAuthorName,
  testimonialAuthorTitle,
  testimonialAuthorAvatar,
  clientLogosText,
  showChatSupport = true,
  isRegister,
  onToggle,
  onBackToHome,
  onGoogleSignIn,
  googleLoading,
  children
}: AuthLayoutProps) {
  const defaultQuote = "“We have a very unique way of managing projects and collaborating — we're very process- and data-driven. With Softr, we were able to unite our project management in one platform.”";
  const defaultAuthor = "Natalie Neumann";
  const defaultTitle = "COO, Designity";
  const defaultAvatar = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80";

  return (
    <div className="min-h-screen w-full flex bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      {/* LEFT COLUMN: AUTH FORM */}
      <div className="w-full lg:w-[48%] xl:w-[46%] min-h-screen flex flex-col justify-between p-6 sm:p-10 md:p-14 lg:p-16 xl:p-20 bg-white z-10">
        <div className="w-full max-w-[360px] mx-auto my-auto py-6">
          {/* Top Left Home button */}
          <HomeButton onClick={onBackToHome} />

          {/* Softr Style Brand Logo */}
          <div className="flex items-center gap-2.5 mb-8">
            {brandLogoUrl ? (
              <img src={brandLogoUrl} alt={brandName || "Logo"} className="h-7 w-auto object-contain" />
            ) : (
              <div className="flex items-center gap-1">
                <div className="w-3.5 h-3.5 rounded-sm bg-[#f97316]" />
                <div className="w-3.5 h-3.5 rounded-sm bg-[#e11d48]" />
                <div className="w-3.5 h-3.5 rounded-sm bg-[#3b82f6]" />
                <div className="w-3.5 h-3.5 rounded-sm bg-[#eab308]" />
              </div>
            )}
            <span className="text-xl font-bold tracking-tight text-slate-900">
              {brandName || "softr"}
            </span>
          </div>

          {/* Heading & Subtitle */}
          <div className="mb-7">
            <h1 
              className="text-2xl font-bold text-slate-900 tracking-tight"
              style={titleColor ? { color: titleColor } : undefined}
            >
              {title || (isRegister ? "Start building with Softr" : "Nice seeing you again, pal!")}
            </h1>
            <p 
              className="text-[13px] text-slate-500 mt-1.5 leading-normal"
              style={subtitleColor ? { color: subtitleColor } : undefined}
            >
              {subtitle || (isRegister ? "Join thousands of teams building powerful portals." : "Can't wait to see what you build today")}
            </p>
          </div>

          {/* Social Auth Buttons */}
          <div className="space-y-2.5 mb-4">
            <GoogleButton onClick={onGoogleSignIn} loading={googleLoading} text={googleButtonText} />
            <SSOButton onClick={() => alert("SSO is available for Enterprise workspaces.")} text={ssoButtonText} />
          </div>

          {/* OR Divider */}
          <SoftrDivider text={dividerText} />

          {/* Form Body (Inputs & Sign in button) */}
          <div className="mt-4">
            {children}
          </div>

          {/* Switch link */}
          <div className="mt-6 text-center text-xs text-slate-500">
            {isRegister ? (
              <>
                {switchPromptText || "Already have an account?"}{' '}
                <button
                  type="button"
                  onClick={onToggle}
                  className="font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors cursor-pointer"
                >
                  {switchLinkText || "Sign in"}
                </button>
              </>
            ) : (
              <>
                {switchPromptText || "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={onToggle}
                  className="font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors cursor-pointer"
                >
                  {switchLinkText || "Sign up"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Footer copyright */}
        <div className="text-[11px] text-slate-400 text-center sm:text-left mt-4">
          {footerCopyrightText || `© ${new Date().getFullYear()} Softr Studio ERP. All rights reserved.`}
        </div>
      </div>

      {/* RIGHT COLUMN: SOFTR GEOMETRIC GRID & FLOATING TESTIMONIAL CARD */}
      <div className="hidden lg:flex flex-1 relative bg-[#fafafa] border-l border-slate-100 items-center justify-center p-8 xl:p-16 overflow-hidden select-none">
        {/* Subtle grid pattern background */}
        <div 
          className="absolute inset-0 opacity-[0.55]"
          style={{
            backgroundImage: `linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)`,
            backgroundSize: '88px 88px'
          }}
        />

        {/* Large Decorative Geometric Outlines */}
        <div className="absolute top-12 left-12 w-[340px] h-[340px] rounded-full border border-pink-300/60 pointer-events-none" />
        <div className="absolute top-28 right-8 w-[320px] h-[260px] rounded-[36px] border border-indigo-200/70 pointer-events-none" />
        <div className="absolute bottom-16 left-16 w-[360px] h-[240px] rounded-[32px] border border-blue-200/80 pointer-events-none" />
        <div className="absolute -bottom-10 right-20 w-[380px] h-[380px] rounded-[48px] border border-amber-200/60 pointer-events-none" />

        {/* Floating Testimonial Card */}
        <div className="relative z-20 w-full max-w-[480px] bg-white rounded-2xl p-7 shadow-[0_20px_50px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] border border-slate-100/80 animate-in fade-in zoom-in-95 duration-500">
          <p className="text-[13.5px] leading-relaxed text-slate-700 font-normal text-center mb-6">
            {testimonialQuote || defaultQuote}
          </p>

          <div className="flex flex-col items-center justify-center mb-6">
            <img 
              src={testimonialAuthorAvatar || defaultAvatar} 
              alt={testimonialAuthorName || defaultAuthor} 
              className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-100 mb-2.5 shadow-sm"
              referrerPolicy="no-referrer"
            />
            <h4 className="text-[13px] font-bold text-slate-900">
              {testimonialAuthorName || defaultAuthor}
            </h4>
            <p className="text-[11px] text-slate-400 font-medium">
              {testimonialAuthorTitle || defaultTitle}
            </p>
          </div>

          {/* Client Logos Row */}
          <ClientLogosRow clientLogosText={clientLogosText} />
        </div>

        {/* Floating Chat Support Bubble (Bottom Right) */}
        {showChatSupport && (
          <div className="absolute bottom-6 right-6 z-30">
            <button 
              type="button"
              className="w-10 h-10 rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-slate-200 flex items-center justify-center text-slate-700 hover:scale-105 hover:shadow-lg transition-all cursor-pointer"
              title="Chat support"
            >
              <MessageSquare className="w-4 h-4 text-slate-800" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 2. SOFTR MINIMAL CENTERED (Single Column clean card)
 */
export function SoftrSplitAuthLayout({
  title,
  subtitle,
  titleColor,
  subtitleColor,
  brandName,
  brandLogoUrl,
  googleButtonText,
  isRegister,
  onToggle,
  onBackToHome,
  onGoogleSignIn,
  googleLoading,
  children
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#f8fafc] text-slate-900 font-sans relative">
      {/* Absolute Home button */}
      <div className="absolute top-6 left-6 z-20">
        <HomeButton onClick={onBackToHome} />
      </div>

      <div className="w-full max-w-[420px] bg-white rounded-2xl p-8 sm:p-10 shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-slate-200/80 mt-8">
        <div className="flex items-center gap-2 mb-6">
          {brandLogoUrl ? (
            <img src={brandLogoUrl} alt="Logo" className="h-6 w-auto object-contain" />
          ) : (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-[#f97316]" />
              <div className="w-3 h-3 rounded-sm bg-[#e11d48]" />
              <div className="w-3 h-3 rounded-sm bg-[#3b82f6]" />
              <div className="w-3 h-3 rounded-sm bg-[#eab308]" />
            </div>
          )}
          <span className="text-lg font-bold text-slate-900">{brandName || "softr"}</span>
        </div>

        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900" style={titleColor ? { color: titleColor } : undefined}>
            {title || (isRegister ? "Create your account" : "Welcome back!")}
          </h1>
          <p className="text-xs text-slate-500 mt-1" style={subtitleColor ? { color: subtitleColor } : undefined}>
            {subtitle || "Please enter your details to continue."}
          </p>
        </div>

        <div className="space-y-2 mb-4">
          <GoogleButton onClick={onGoogleSignIn} loading={googleLoading} text={googleButtonText} />
        </div>

        <SoftrDivider />

        <div className="mt-4">{children}</div>

        <div className="mt-6 text-center text-xs text-slate-500">
          {isRegister ? (
            <>
              Already have an account?{' '}
              <button type="button" onClick={onToggle} className="font-semibold text-blue-600 hover:underline cursor-pointer">
                Sign in
              </button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button type="button" onClick={onToggle} className="font-semibold text-blue-600 hover:underline cursor-pointer">
                Sign up
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 3. CLASSIC SPLIT EDITORIAL
 */
export function ClassicSplitAuthLayout({
  title,
  subtitle,
  titleColor,
  subtitleColor,
  isRegister,
  onToggle,
  onBackToHome,
  bgImage,
  imageTitle,
  imageSubtitle,
  imageTitleColor,
  imageSubtitleColor,
  children
}: AuthLayoutProps) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen w-full flex bg-background text-foreground overflow-hidden">
      {/* Left side art banner */}
      <div className="hidden lg:block lg:w-[52%] relative overflow-hidden bg-slate-950">
        <img 
          src={bgImage || "https://picsum.photos/seed/dribbble-login/1200/1600"} 
          alt="Auth Backdrop" 
          className="absolute inset-0 w-full h-full object-cover opacity-80"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute top-8 left-8 z-20">
          <HomeButton onClick={onBackToHome} />
        </div>
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <h2 
            className="text-3xl font-bold tracking-tight mb-3"
            style={{ color: imageTitleColor || '#ffffff' }}
          >
            {imageTitle || "Streamline your business operations."}
          </h2>
          <p 
            className="text-sm font-medium opacity-90 max-w-md"
            style={{ color: imageSubtitleColor || 'rgba(255,255,255,0.8)' }}
          >
            {imageSubtitle || "The modern enterprise ERP system for intelligent teams."}
          </p>
        </div>
      </div>

      {/* Right side form */}
      <div className="flex-1 flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-y-auto">
        <div className="w-full max-w-md mx-auto my-auto">
          <div className="block lg:hidden mb-4">
            <HomeButton onClick={onBackToHome} />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold" style={titleColor ? { color: titleColor } : undefined}>
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1" style={subtitleColor ? { color: subtitleColor } : undefined}>
                {subtitle}
              </p>
            )}
          </div>

          {children}

          <div className="mt-8 pt-6 border-t border-border text-center text-sm text-muted-foreground">
            {isRegister ? (
              <>
                {t('auth.alreadyHaveAccount')}{' '}
                <button onClick={onToggle} className="font-bold text-foreground hover:underline cursor-pointer">
                  {t('auth.login')}
                </button>
              </>
            ) : (
              <>
                {t('auth.noAccount')}{' '}
                <button onClick={onToggle} className="font-bold text-foreground hover:underline cursor-pointer">
                  {t('auth.register')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 4. GLASSMORPHISM HOLOGRAPHIC
 */
export function GlassAuthLayout({
  title,
  subtitle,
  isRegister,
  onToggle,
  onBackToHome,
  children
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#090d16] text-white relative overflow-hidden">
      <div className="absolute top-6 left-6 z-20">
        <HomeButton onClick={onBackToHome} />
      </div>
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
      
      <div className="w-full max-w-md p-8 rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-2xl shadow-2xl relative z-10 mt-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>

        {children}

        <div className="mt-6 text-center text-xs text-slate-400">
          <button onClick={onToggle} className="text-blue-400 hover:underline cursor-pointer">
            {isRegister ? "Already have an account? Sign in" : "Need an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 5. ENTERPRISE MINIMAL
 */
export function EnterpriseAuthLayout({
  title,
  subtitle,
  isRegister,
  onToggle,
  onBackToHome,
  children
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-slate-100 dark:bg-slate-900 text-foreground p-6">
      <div className="w-full max-w-md mx-auto my-auto bg-card border border-border p-8 rounded-xl shadow-sm">
        <div className="mb-4">
          <HomeButton onClick={onBackToHome} />
        </div>
        <div className="mb-6">
          <h1 className="text-xl font-bold">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {children}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <button onClick={onToggle} className="font-semibold text-primary hover:underline cursor-pointer">
            {isRegister ? "Back to Login" : "Create New Enterprise Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
