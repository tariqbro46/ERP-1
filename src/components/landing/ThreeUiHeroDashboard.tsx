import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { 
  Activity, 
  TrendingUp, 
  Package, 
  CreditCard, 
  Users, 
  Sparkles, 
  ArrowRight, 
  Zap, 
  ShieldCheck, 
  Layers, 
  Clock, 
  Rotate3d, 
  ChevronRight, 
  Search,
  Settings,
  BookOpen,
  FileText,
  Scale,
  Boxes,
  Printer,
  Cpu,
  BarChart3,
  Receipt,
  Truck,
  Network,
  HelpCircle,
  CheckCircle2,
  ChevronDown,
  ChevronsUpDown,
  PanelLeftClose,
  Maximize2
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

interface ThreeUiHeroDashboardProps {
  content: {
    heroTitle?: string;
    heroSubtitle?: string;
    heroCtaPrimary?: string;
    heroCtaSecondary?: string;
    [key: string]: any;
  };
  onOpenDemoModal?: () => void;
  themeVariant?: 'cyber-dark' | 'glass-light' | 'aurora-navy' | 'emerald-obsidian';
  glowColor?: 'cyan' | 'emerald' | 'indigo' | 'amber';
  perspectiveLevel?: 'subtle' | 'cinematic' | 'extreme';
  showParticles?: boolean;
  showFloatingBadges?: boolean;
  showExperienceHubDemo?: boolean;
  showSimulateVoucher?: boolean;
}

export const ThreeUiHeroDashboard: React.FC<ThreeUiHeroDashboardProps> = ({
  content,
  onOpenDemoModal,
  themeVariant = 'aurora-navy',
  glowColor = 'cyan',
  perspectiveLevel = 'cinematic',
  showParticles = true,
  showFloatingBadges = true,
  showExperienceHubDemo = true,
  showSimulateVoucher = true
}) => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [is3DOrbitActive, setIs3DOrbitActive] = useState(true);
  const [activeCardHover, setActiveCardHover] = useState<string | null>(null);
  const [livePulse, setLivePulse] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [activeNav, setActiveNav] = useState('dashboard');

  // Motion values for smooth 3D tilt tracking mouse
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring physics for buttery smooth motion
  const springConfig = { damping: 25, stiffness: 180, mass: 0.5 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  const rotMultiplier = perspectiveLevel === 'subtle' ? 6 : perspectiveLevel === 'extreme' ? 16 : 10;
  const rotateX = useTransform(smoothMouseY, [-0.5, 0.5], [rotMultiplier, -rotMultiplier]);
  const rotateY = useTransform(smoothMouseX, [-0.5, 0.5], [-rotMultiplier, rotMultiplier]);

  // Live real-time clock matching "04:13:39 PM | Mon, Aug 31, 2026"
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' });
      setCurrentTime(timeStr);
      setCurrentDate(dateStr);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle Mouse movement across Hero container
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !is3DOrbitActive) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const xPct = (clientX / width) - 0.5;
    const yPct = (clientY / height) - 0.5;

    mouseX.set(xPct);
    mouseY.set(yPct);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Simulated Live Transaction Trigger
  const triggerSimulationPulse = () => {
    setLivePulse(true);
    setTimeout(() => setLivePulse(false), 1500);
  };

  // Background Procedural Particle Canvas
  useEffect(() => {
    if (!showParticles || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    window.addEventListener('resize', handleResize);

    const particleCount = Math.min(Math.floor((width * height) / 14000), 55);
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      alpha: number;
      color: string;
    }> = [];

    const colors = glowColor === 'emerald' 
      ? ['#10b981', '#34d399', '#059669', '#6ee7b7'] 
      : glowColor === 'indigo'
      ? ['#6366f1', '#818cf8', '#a855f7', '#38bdf8']
      : glowColor === 'amber'
      ? ['#f59e0b', '#fbbf24', '#f97316', '#fb923c']
      : ['#06b6d4', '#38bdf8', '#3b82f6', '#818cf8'];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 2 + 0.8,
        alpha: Math.random() * 0.5 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            ctx.beginPath();
            ctx.strokeStyle = particles[i].color;
            ctx.globalAlpha = (1 - dist / 110) * 0.15;
            ctx.lineWidth = 0.8;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fill();
      }

      ctx.shadowBlur = 0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [showParticles, glowColor]);

  // Visual Theme styling presets
  const themeStyles = {
    'aurora-navy': {
      bgGradient: 'from-[#070b19] via-[#09112a] to-[#040714]',
      glowRgba: 'rgba(6, 182, 212, 0.25)',
      badgeBg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
      heroTitleColor: 'text-white',
      secondaryText: 'text-slate-400'
    },
    'cyber-dark': {
      bgGradient: 'from-[#030712] via-[#0b0f19] to-[#02040a]',
      glowRgba: 'rgba(16, 185, 129, 0.25)',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
      heroTitleColor: 'text-white',
      secondaryText: 'text-slate-400'
    },
    'emerald-obsidian': {
      bgGradient: 'from-[#02130d] via-[#041f16] to-[#010906]',
      glowRgba: 'rgba(52, 211, 153, 0.25)',
      badgeBg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200',
      heroTitleColor: 'text-white',
      secondaryText: 'text-emerald-300/70'
    },
    'glass-light': {
      bgGradient: 'from-slate-100 via-white to-blue-50/50',
      glowRgba: 'rgba(59, 130, 246, 0.15)',
      badgeBg: 'bg-blue-50 border-blue-200 text-blue-700',
      heroTitleColor: 'text-slate-900',
      secondaryText: 'text-slate-600'
    }
  }[themeVariant] || {
    bgGradient: 'from-[#070b19] via-[#09112a] to-[#040714]',
    glowRgba: 'rgba(6, 182, 212, 0.25)',
    badgeBg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
    heroTitleColor: 'text-white',
    secondaryText: 'text-slate-400'
  };

  const glowAccent = glowColor === 'emerald'
    ? 'from-emerald-500/20 via-teal-500/10 to-transparent'
    : glowColor === 'indigo'
    ? 'from-indigo-500/20 via-purple-500/10 to-transparent'
    : glowColor === 'amber'
    ? 'from-amber-500/20 via-orange-500/10 to-transparent'
    : 'from-cyan-500/20 via-blue-500/10 to-transparent';

  // 6 Primary Executive Action Cards from User's Actual Dashboard
  const dashboardCards = [
    {
      id: 'voucher',
      title: 'NEW VOUCHER ENTRY',
      desc: 'Log sales, receipts, payments & purchases',
      badge: 'TRANSACTIONS',
      icon: FileText,
      iconColor: 'bg-blue-600 text-white',
      badgeBg: 'bg-blue-50 text-blue-600 border border-blue-100',
      glowBorder: 'hover:border-blue-500 hover:shadow-[0_10px_25px_rgba(37,99,235,0.15)]',
      route: '/vouchers/new'
    },
    {
      id: 'ledgers',
      title: 'LEDGERS REGISTRY',
      desc: 'Monitor company accounts & opening credits',
      badge: 'ACCOUNTING',
      icon: Users,
      iconColor: 'bg-emerald-600 text-white',
      badgeBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      glowBorder: 'hover:border-emerald-500 hover:shadow-[0_10px_25px_rgba(16,185,129,0.15)]',
      route: '/accounts'
    },
    {
      id: 'inventory',
      title: 'INVENTORY STOCK',
      desc: 'View active items, batch definitions & stores',
      badge: 'INVENTORY',
      icon: Package,
      iconColor: 'bg-orange-500 text-white',
      badgeBg: 'bg-orange-50 text-orange-600 border border-orange-100',
      glowBorder: 'hover:border-orange-500 hover:shadow-[0_10px_25px_rgba(249,115,22,0.15)]',
      route: '/inventory/items'
    },
    {
      id: 'reports',
      title: 'REPORTS GATEWAY',
      desc: 'Unlock financial summaries & trial balances',
      badge: 'ANALYTICS',
      icon: TrendingUp,
      iconColor: 'bg-pink-600 text-white',
      badgeBg: 'bg-pink-50 text-pink-600 border border-pink-100',
      glowBorder: 'hover:border-pink-500 hover:shadow-[0_10px_25px_rgba(219,39,119,0.15)]',
      route: '/reports'
    },
    {
      id: 'daybook',
      title: 'DAYBOOK STREAM',
      desc: "Examine today's running register list",
      badge: 'AUDIT TRAIL',
      icon: Clock,
      iconColor: 'bg-purple-600 text-white',
      badgeBg: 'bg-purple-50 text-purple-600 border border-purple-100',
      glowBorder: 'hover:border-purple-500 hover:shadow-[0_10px_25px_rgba(147,51,234,0.15)]',
      route: '/reports/daybook'
    },
    {
      id: 'settings',
      title: 'GENERAL CONFIGS',
      desc: 'Adjust enterprise layouts, rules & metrics',
      badge: 'PREFERENCES',
      icon: ShieldCheck,
      iconColor: 'bg-cyan-500 text-white',
      badgeBg: 'bg-cyan-50 text-cyan-600 border border-cyan-100',
      glowBorder: 'hover:border-cyan-500 hover:shadow-[0_10px_25px_rgba(6,182,212,0.15)]',
      route: '/settings'
    }
  ];

  return (
    <section 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative min-h-[95vh] pt-24 sm:pt-32 pb-24 overflow-hidden bg-gradient-to-b flex flex-col justify-center select-none transition-colors duration-500",
        themeStyles.bgGradient
      )}
      style={{ perspective: 1300 }}
    >
      {/* Background Procedural Particle Canvas */}
      {showParticles && (
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
        />
      )}

      {/* Cyber Grid Isometric Matrix Floor */}
      <div 
        className="absolute inset-0 opacity-[0.16] pointer-events-none z-0"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)`,
          backgroundSize: '54px 54px',
          maskImage: 'radial-gradient(ellipse at 50% 50%, black 40%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 50%, black 40%, transparent 80%)'
        }}
      />

      {/* Dynamic Ambient Radiant Light Glow */}
      <div 
        className={cn(
          "absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] rounded-full blur-[150px] pointer-events-none opacity-60 bg-gradient-to-tr",
          glowAccent
        )} 
      />

      <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 relative z-10 w-full">
        
        {/* Top Hero Text & Live Engine Status */}
        <div className="text-center max-w-4xl mx-auto mb-8 sm:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center"
          >
            {/* Holographic Pill Badge */}
            {(content.heroBadgeText || content.heroBadgeTag) && (
              <div className={cn(
                "inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border backdrop-blur-md text-xs font-mono font-bold tracking-wide shadow-lg mb-5",
                themeStyles.badgeBg
              )}>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                {content.heroBadgeText && <span>{content.heroBadgeText}</span>}
                {content.heroBadgeText && content.heroBadgeTag && <span className="w-1 h-3 bg-current opacity-30" />}
                {content.heroBadgeTag && (
                  <span className="text-[10px] uppercase font-bold tracking-widest opacity-85">
                    {content.heroBadgeTag}
                  </span>
                )}
              </div>
            )}

            {/* Main Headline */}
            {content.heroTitle && (
              <h1 className={cn(
                "text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-4 leading-tight",
                themeStyles.heroTitleColor
              )}>
                {content.heroTitle}
              </h1>
            )}

            {/* Subtitle */}
            {content.heroSubtitle && (
              <p className={cn(
                "text-sm sm:text-base lg:text-lg max-w-2xl mx-auto mb-7 font-normal leading-relaxed",
                themeStyles.secondaryText
              )}>
                {content.heroSubtitle}
              </p>
            )}

            {/* Primary Action Button Cluster */}
            <div className="flex flex-wrap items-center justify-center gap-3.5 w-full sm:w-auto">
              {content.heroCtaPrimary && (
                <Link
                  to={user ? "/dashboard" : "/register"}
                  id="threeui-hero-primary-cta"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer border border-cyan-300/30"
                >
                  {user ? t('nav.dashboard') : content.heroCtaPrimary}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}

              {showExperienceHubDemo && onOpenDemoModal && !user && content.heroExperienceHubButtonText && (
                <button
                  type="button"
                  onClick={onOpenDemoModal}
                  id="threeui-hero-demo-cta"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-200 transition-all backdrop-blur-md shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                  {content.heroExperienceHubButtonText}
                </button>
              )}

              {/* Live Interactive Simulation Trigger */}
              {showSimulateVoucher && content.heroSimulateVoucherButtonText && (
                <button
                  type="button"
                  onClick={triggerSimulationPulse}
                  id="threeui-hero-simulate-cta"
                  className="w-full sm:w-auto px-5 py-3.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider border border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white transition-all backdrop-blur-md active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                  title="Click to simulate live voucher and financial transaction"
                >
                  <Zap className={cn("w-3.5 h-3.5 text-amber-400", livePulse && "animate-bounce")} />
                  <span>{content.heroSimulateVoucherButtonText}</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>

        {/* =========================================================================
            THREEUI 3D ISOMETRIC INTERACTIVE DASHBOARD MATRIX
            Modeled with 100% precision from actual App Dashboard Screenshot
           ========================================================================= */}
        <div className="relative w-full max-w-[1360px] mx-auto mt-4 sm:mt-8 perspective-[1600px]">
          
          {/* Main 3D Tilted Card Stage */}
          <motion.div
            style={{
              rotateX: is3DOrbitActive ? rotateX : 0,
              rotateY: is3DOrbitActive ? rotateY : 0,
              transformStyle: 'preserve-3d',
            }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="relative rounded-2xl sm:rounded-3xl border border-slate-700/60 bg-[#0f172a]/95 backdrop-blur-2xl shadow-[0_30px_100px_rgba(0,0,0,0.75),0_0_60px_rgba(6,182,212,0.18)] overflow-hidden transition-shadow duration-300 text-left"
          >
            {/* Top Unified Application Navbar (Exact copy from real App Screenshot) */}
            <div className="border-b border-slate-200/90 px-4 sm:px-6 py-3 flex items-center justify-between bg-white text-slate-800 select-none">
              
              {/* Top Left: Company Selector & Identity */}
              <div className="flex items-center gap-3 min-w-[200px]">
                {content.heroDashboardAvatarInitials && (
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-xs font-black shadow-xs shrink-0">
                    {content.heroDashboardAvatarInitials}
                  </div>
                )}
                <div className="flex flex-col text-left">
                  {content.heroDashboardCompanyName && (
                    <div className="flex items-center gap-1.5 font-black text-slate-900 text-xs sm:text-sm leading-none cursor-pointer hover:text-emerald-700 transition-colors">
                      <span>{content.heroDashboardCompanyName}</span>
                      <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  )}
                  {content.heroDashboardCompanyLocation && (
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-tight mt-0.5">
                      {content.heroDashboardCompanyLocation}
                    </span>
                  )}
                </div>
              </div>

              {/* Top Center: Clean DASHBOARD Title */}
              <div className="flex items-center justify-center">
                {content.heroDashboardTitle && (
                  <h2 className="text-xs sm:text-sm font-black uppercase tracking-[0.25em] text-slate-900 font-mono">
                    {content.heroDashboardTitle}
                  </h2>
                )}
              </div>

              {/* Top Right: 3D Gyro Toggle & Profile Avatar */}
              <div className="flex items-center justify-end gap-3 min-w-[200px]">
                <button
                  type="button"
                  onClick={() => setIs3DOrbitActive(!is3DOrbitActive)}
                  className={cn(
                    "hidden sm:flex px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider items-center gap-1.5 transition-all border cursor-pointer",
                    is3DOrbitActive 
                      ? "bg-cyan-50 border-cyan-300 text-cyan-700 shadow-xs" 
                      : "bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-700"
                  )}
                  title="Toggle 3D Mouse Gyroscope Tracking"
                >
                  <Rotate3d className="w-3 h-3" />
                  <span>3D Tilt: {is3DOrbitActive ? 'ON' : 'PAUSED'}</span>
                </button>

                {content.heroDashboardAvatarInitials && (
                  <div className="relative">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-rose-600 to-amber-600 text-white font-bold flex items-center justify-center text-xs shadow-xs ring-2 ring-white cursor-pointer hover:ring-rose-200 transition-all">
                      {content.heroDashboardAvatarInitials}
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white absolute bottom-0 right-0" />
                  </div>
                )}
              </div>
            </div>

            {/* Application Mockup Layout (Sidebar + Widescreen Main Workspace) */}
            <div className="flex flex-col lg:flex-row min-h-[580px] lg:min-h-[660px] bg-[#f8fafc] text-slate-800">
              
              {/* =========================================================================
                  SIDEBAR (Exact copy from real App Screenshot)
                 ========================================================================= */}
              <div className="w-full lg:w-60 shrink-0 bg-[#f8fafc] border-r border-slate-200/90 flex flex-col justify-between p-3.5 select-none text-[11px]">
                
                <div className="space-y-4">
                  {/* Primary Nav List */}
                  <div className="space-y-0.5">
                    <button 
                      type="button" 
                      onClick={() => setActiveNav('dashboard')}
                      className={cn(
                        "w-full px-3 py-2 rounded-lg flex items-center justify-between font-bold transition-all text-left",
                        activeNav === 'dashboard' 
                          ? "bg-blue-50 text-blue-600 border border-blue-200/70 shadow-xs" 
                          : "text-slate-700 hover:bg-slate-200/50"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Activity className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold">Dashboard</span>
                      </div>
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    </button>

                    <button 
                      type="button" 
                      onClick={() => setActiveNav('search')}
                      className="w-full px-3 py-2 rounded-lg flex items-center gap-2.5 font-medium text-slate-600 hover:bg-slate-200/50 transition-all text-left"
                    >
                      <Search className="w-4 h-4 text-slate-500" />
                      <span>Search</span>
                    </button>
                  </div>

                  {/* Menu Group: MASTERS */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider px-2">
                      <span>MASTERS</span>
                      <ChevronDown className="w-3 h-3" />
                    </div>
                    <div className="space-y-0.5 pl-1">
                      <div className="px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-200/40 flex items-center gap-2 cursor-pointer transition-colors">
                        <Settings className="w-3.5 h-3.5 text-slate-400" />
                        <span>Create / Alter</span>
                      </div>
                      <div className="px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-200/40 flex items-center gap-2 cursor-pointer transition-colors">
                        <Package className="w-3.5 h-3.5 text-slate-400" />
                        <span>Item Master</span>
                      </div>
                      <div className="px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-200/40 flex items-center gap-2 cursor-pointer transition-colors">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        <span>Chart of Accounts</span>
                      </div>
                    </div>
                  </div>

                  {/* Menu Group: TRANSACTIONS */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider px-2">
                      <span>TRANSACTIONS</span>
                      <ChevronDown className="w-3 h-3" />
                    </div>
                    <div className="space-y-0.5 pl-1">
                      <div className="px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-200/40 flex items-center gap-2 cursor-pointer transition-colors">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>Voucher Entry</span>
                      </div>
                      <div className="px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-200/40 flex items-center gap-2 cursor-pointer transition-colors">
                        <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                        <span>Daybook</span>
                      </div>
                    </div>
                  </div>

                  {/* Menu Group: REPORTS */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider px-2">
                      <span>REPORTS</span>
                      <ChevronDown className="w-3 h-3" />
                    </div>
                    <div className="space-y-0.5 pl-1">
                      <div className="px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-200/40 flex items-center gap-2 cursor-pointer transition-colors">
                        <Scale className="w-3.5 h-3.5 text-slate-400" />
                        <span>Balance Sheet</span>
                      </div>
                      <div className="px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-200/40 flex items-center gap-2 cursor-pointer transition-colors">
                        <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                        <span>Profit & Loss</span>
                      </div>
                      <div className="px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-200/40 flex items-center gap-2 cursor-pointer transition-colors">
                        <Boxes className="w-3.5 h-3.5 text-slate-400" />
                        <span>Stock Summary</span>
                      </div>
                      <div className="px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-200/40 flex items-center gap-2 cursor-pointer transition-colors">
                        <Activity className="w-3.5 h-3.5 text-slate-400" />
                        <span>Ratio Analysis</span>
                      </div>
                      <div className="px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-200/40 flex items-center gap-2 cursor-pointer transition-colors">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        <span>Display More Reports</span>
                      </div>
                    </div>
                  </div>

                  {/* Menu Group: PRODUCTION */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider px-2">
                      <span>PRODUCTION</span>
                      <ChevronDown className="w-3 h-3" />
                    </div>
                    <div className="space-y-0.5 pl-1">
                      <div className="px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-200/40 flex items-center gap-2 cursor-pointer transition-colors">
                        <Printer className="w-3.5 h-3.5 text-slate-400" />
                        <span>Order Management</span>
                      </div>
                      <div className="px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-200/40 flex items-center gap-2 cursor-pointer transition-colors">
                        <Cpu className="w-3.5 h-3.5 text-slate-400" />
                        <span>Machine Management</span>
                      </div>
                      <div className="px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-200/40 flex items-center gap-2 cursor-pointer transition-colors">
                        <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Production Reports</span>
                      </div>
                    </div>
                  </div>

                  {/* Menu Group: ADVANCED MODULES */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider px-2">
                      <span>ADVANCED MODULES</span>
                      <ChevronDown className="w-3 h-3" />
                    </div>
                    <div className="space-y-0.5 pl-1">
                      <div className="px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-200/40 flex items-center gap-2 cursor-pointer transition-colors">
                        <Receipt className="w-3.5 h-3.5 text-slate-400" />
                        <span>Tax & VAT</span>
                      </div>
                      <div className="px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-200/40 flex items-center gap-2 cursor-pointer transition-colors">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Customer Relationship (CRM)</span>
                      </div>
                      <div className="px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-200/40 flex items-center gap-2 cursor-pointer transition-colors">
                        <Truck className="w-3.5 h-3.5 text-slate-400" />
                        <span>Supply Chain Management</span>
                      </div>
                      <div className="px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-200/40 flex items-center gap-2 cursor-pointer transition-colors">
                        <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                        <span>AI Business Insights</span>
                      </div>
                    </div>
                  </div>

                  {/* Menu Group: PAYROLL */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider px-2">
                      <span>PAYROLL</span>
                      <ChevronDown className="w-3 h-3" />
                    </div>
                    <div className="space-y-0.5 pl-1">
                      <div className="px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-200/40 flex items-center gap-2 cursor-pointer transition-colors">
                        <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                        <span>Payroll Management</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar Footer Usage & Collapse */}
                <div className="mt-4 pt-3 border-t border-slate-200/80 space-y-2">
                  <div className="px-2.5 py-1.5 bg-white rounded-md border border-slate-200/80 text-[9px] font-mono flex items-center justify-between text-slate-600">
                    <span className="font-bold">USAGE (TODAY):</span>
                    <span className="text-emerald-600 font-bold">0%</span>
                  </div>
                  <div className="flex items-center justify-between px-2 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1 hover:text-slate-600 cursor-pointer">
                      <PanelLeftClose className="w-3 h-3" /> Collapse
                    </span>
                    <span className="text-emerald-500 font-bold">● v1.8.2</span>
                  </div>
                </div>

              </div>

              {/* =========================================================================
                  MAIN DASHBOARD WORKSPACE (Exact Widescreen copy from Screenshot)
                 ========================================================================= */}
              <div className="flex-1 flex flex-col justify-between p-6 sm:p-9 lg:p-12 relative overflow-hidden bg-slate-50/50">
                
                {/* Central Welcome Greeting Area */}
                <div className="text-center mt-1 sm:mt-3 mb-6 sm:mb-8 space-y-2.5">
                  {/* Enterprise Hub Badge */}
                  {content.heroDashboardBadgeText && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200/70 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-blue-600 font-mono shadow-xs">
                      <Sparkles className="w-3 h-3 text-blue-500 animate-pulse" />
                      <span>{content.heroDashboardBadgeText}</span>
                    </div>
                  )}

                  {/* Main User Greeting */}
                  {content.heroDashboardGreeting && (
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                      {content.heroDashboardGreeting}
                    </h1>
                  )}

                  {/* Slogan */}
                  {content.heroDashboardSlogan && (
                    <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                      {content.heroDashboardSlogan}
                    </p>
                  )}

                  {/* Live Clock and Date */}
                  <div className="flex items-center justify-center gap-2 pt-1 text-[10px] sm:text-xs text-slate-500 font-mono">
                    <span className="flex items-center gap-1 text-blue-600 font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      {currentTime || '04:13:39 PM'}
                    </span>
                    <span className="text-slate-300">|</span>
                    <span>{currentDate || 'Mon, Aug 31, 2026'}</span>
                  </div>
                </div>

                {/* 6 Executive Action Shortcut Cards Grid (3 Columns x 2 Rows) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto w-full">
                  {dashboardCards.map((card) => {
                    const Icon = card.icon;
                    return (
                      <div
                        key={card.id}
                        onMouseEnter={() => setActiveCardHover(card.id)}
                        onMouseLeave={() => setActiveCardHover(null)}
                        className={cn(
                          "p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group text-left",
                          card.glowBorder,
                          activeCardHover === card.id && "ring-1 ring-primary/20 shadow-md"
                        )}
                        onClick={onOpenDemoModal}
                      >
                        <div>
                          {/* Card Header with Icon and Category Badge */}
                          <div className="flex items-center justify-between mb-3">
                            <div className={cn(
                              "w-9 h-9 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform",
                              card.iconColor
                            )}>
                              <Icon className="w-4.5 h-4.5 stroke-[2.2]" />
                            </div>
                            <span className={cn(
                              "text-[8px] sm:text-[9px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-md",
                              card.badgeBg
                            )}>
                              {card.badge}
                            </span>
                          </div>

                          {/* Card Title and Description */}
                          <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide group-hover:text-blue-600 transition-colors">
                            {card.title}
                          </h3>
                          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 leading-relaxed">
                            {card.desc}
                          </p>
                        </div>

                        {/* Bottom Launch Link */}
                        <div className="mt-4 pt-2 border-t border-slate-100 flex items-center gap-1 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-slate-400 group-hover:text-blue-600 font-mono transition-colors">
                          <span>LAUNCH CONSOLE</span>
                          <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Footer Notice */}
                {content.heroDashboardNotice && (
                  <div className="text-center pt-8 mt-2 opacity-70">
                    <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-[0.2em] font-mono">
                      {content.heroDashboardNotice}
                    </p>
                  </div>
                )}

                {/* Floating Bottom-Right Help Book Button */}
                <div className="absolute bottom-6 right-6 hidden sm:flex">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center cursor-pointer transition-all hover:scale-105">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white absolute -top-0.5 -right-0.5" />
                  </div>
                </div>

              </div>
            </div>
          </motion.div>

          {/* =========================================================================
              FLOATING 3D SATELLITE CHIPS & TELEMETRY BADGES (TranslateZ: 60px)
             ========================================================================= */}
          {showFloatingBadges && (
            <>
              {/* Floating Badge 1 (Top Right - Instant Bank Liquidity) */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                style={{
                  transform: 'translateZ(60px)',
                  transformStyle: 'preserve-3d'
                }}
                className="hidden md:flex absolute -top-8 -right-6 p-3.5 rounded-xl bg-[#09132e]/95 border border-cyan-500/40 shadow-[0_15px_40px_rgba(0,0,0,0.7),0_0_20px_rgba(6,182,212,0.3)] backdrop-blur-xl flex-col gap-1 text-left z-30 pointer-events-none"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300">
                    Real-time Liquidity Balance
                  </span>
                </div>
                <div className="text-sm font-mono font-bold text-white">
                  ৳4,280,000 <span className="text-[10px] text-slate-400 font-normal">Corporate Bank</span>
                </div>
                <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Auto-Reconciled
                </div>
              </motion.div>

              {/* Floating Badge 2 (Bottom Left - Realtime Voucher Notification) */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                style={{
                  transform: 'translateZ(70px)',
                  transformStyle: 'preserve-3d'
                }}
                className="hidden md:flex absolute -bottom-6 -left-6 p-3.5 rounded-xl bg-[#09132e]/95 border border-emerald-500/40 shadow-[0_15px_40px_rgba(0,0,0,0.7),0_0_20px_rgba(16,185,129,0.3)] backdrop-blur-xl items-center gap-3 text-left z-30 pointer-events-none"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase font-bold text-emerald-300">
                    Auto-Post Journal Event
                  </div>
                  <div className="text-xs font-mono font-bold text-white">
                    Debit: Bank A/C ৳50,000
                  </div>
                  <div className="text-[9px] font-mono text-slate-400">
                    Credit: Customer Ledger #9824
                  </div>
                </div>
              </motion.div>
            </>
          )}

        </div>

      </div>
    </section>
  );
};
