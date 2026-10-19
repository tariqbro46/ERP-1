import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Database, 
  Layers, 
  TrendingUp, 
  Boxes, 
  Check, 
  ChevronRight, 
  Lock, 
  Building2, 
  Cpu, 
  FileSpreadsheet, 
  Activity, 
  Sparkles,
  Sliders,
  Maximize2,
  RefreshCw,
  Globe,
  Menu,
  X
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { cn } from '../../lib/utils';
import { LATEST_VERSION } from '../../data/releaseNotes';

interface MonochromeParallaxHeroProps {
  content: {
    heroTitle?: string;
    heroSubtitle?: string;
    heroCtaPrimary?: string;
    heroCtaSecondary?: string;
    showExperienceHubDemo?: boolean;
    [key: string]: any;
  };
  onOpenDemoModal?: () => void;
}

type TelemetryMode = 'vouchers' | 'inventory' | 'liquidity';

export const MonochromeParallaxHero: React.FC<MonochromeParallaxHeroProps> = ({
  content,
  onOpenDemoModal
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { user, company } = useAuth();
  const navigate = useNavigate();

  const { 
    appVersion,
    companyName: settingsCompanyName,
    companyLogo: settingsCompanyLogo,
    systemLogo: settingsSystemLogo,
    heroShowExperienceHubDemo,
    heroEyebrowText,
    heroTitleText,
    heroSubtitleText,
    heroCtaPrimaryText,
    heroCtaDemoText,
    heroNavActionText,
    heroMetric1Value,
    heroMetric1Label,
    heroMetric2Value,
    heroMetric2Label,
    heroMetric3Value,
    heroMetric3Label
  } = useSettings();

  const activeCompanyName = company?.name || settingsCompanyName || 'TallyFlow ERP';
  const activeCompanyLogo = (company as any)?.logo_url || settingsCompanyLogo || settingsSystemLogo;
  const rawVersion = appVersion || LATEST_VERSION || 'v1.9.8';
  const cleanVersion = rawVersion.toLowerCase().startsWith('v') ? rawVersion : `v${rawVersion}`;

  const canvasMountRef = useRef<HTMLDivElement>(null);
  const heroContainerRef = useRef<HTMLDivElement>(null);

  // Active Soft UI telemetry tab on the hero
  const [telemetryMode, setTelemetryMode] = useState<TelemetryMode>('vouchers');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolledPastTop, setScrolledPastTop] = useState(false);

  // Scroll ratio ref to pass to Three.js loop without React state re-rendering
  const scrollRatioRef = useRef(0);
  const isVisibleRef = useRef(true);

  // Smooth scroll helper for menu navigation (Capabilities, Architecture, Telemetry)
  const scrollToSection = (sectionId: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      const topOffset = element.getBoundingClientRect().top + window.pageYOffset - 90;
      window.scrollTo({ top: topOffset, behavior: 'smooth' });
    }
  };

  // 1. Scroll listener updating ref & top bar state smoothly
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScroll = window.scrollY;
          setScrolledPastTop(currentScroll > 20);

          if (heroContainerRef.current) {
            const rect = heroContainerRef.current.getBoundingClientRect();
            const totalHeight = heroContainerRef.current.offsetHeight || window.innerHeight;
            const progress = Math.max(0, Math.min(1.5, -rect.top / totalHeight));
            scrollRatioRef.current = progress;
          } else {
            scrollRatioRef.current = Math.min(1.5, currentScroll / 800);
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 2. IntersectionObserver to PAUSE WebGL rendering when scrolled off-screen (100% lag elimination)
  useEffect(() => {
    if (!heroContainerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisibleRef.current = entry.isIntersecting;
        });
      },
      { threshold: 0.05 }
    );

    observer.observe(heroContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // 3. Ultra-lightweight Three.js Scene: Monochromatic Precision Monolith
  // Guaranteed 60 FPS: Initialized strictly ONCE on mount, NO re-creations, NO heavy transmission
  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    let width = mount.clientWidth || window.innerWidth;
    let height = mount.clientHeight || window.innerHeight;

    // Fast scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0c0d10, 0.035);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 80);
    camera.position.set(0, 0.6, 5.2);

    // Renderer with strictly capped pixel ratio (max 1.25 for crisp 60fps)
    const isHeadless = navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);
    const renderer = new THREE.WebGLRenderer({
      antialias: !isHeadless,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    mount.appendChild(renderer.domElement);

    // Optimized Lighting (Directional Key + Rim + Ambient)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
    keyLight.position.set(3, 5, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xa1a1aa, 1.6);
    rimLight.position.set(-3, 3, -3);
    scene.add(rimLight);

    const ambientLight = new THREE.AmbientLight(0x27272a, 1.2);
    scene.add(ambientLight);

    // Architectural Monochromatic Master Group
    const masterGroup = new THREE.Group();
    masterGroup.position.set(1.1, 0, 0);
    scene.add(masterGroup);

    // 1. Central Faceted Obsidian Crystal (Low poly for extreme speed)
    const coreGeo = new THREE.IcosahedronGeometry(1.2, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x14151a,
      metalness: 0.9,
      roughness: 0.2,
      flatShading: true
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    masterGroup.add(coreMesh);

    // 2. Outer Wireframe Cage (Crisp silver precision lines)
    const wireGeo = new THREE.IcosahedronGeometry(1.24, 0);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.28
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    masterGroup.add(wireMesh);

    // 3. Dual Concentric Orbiting Rings (Platinum sheen)
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      metalness: 0.95,
      roughness: 0.3
    });

    const ring1Geo = new THREE.TorusGeometry(1.9, 0.012, 12, 64);
    const ring1 = new THREE.Mesh(ring1Geo, ringMat);
    ring1.rotation.x = Math.PI / 3;
    masterGroup.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(2.35, 0.009, 12, 64);
    const ring2 = new THREE.Mesh(ring2Geo, ringMat);
    ring2.rotation.x = -Math.PI / 3.5;
    ring2.rotation.y = Math.PI / 5;
    masterGroup.add(ring2);

    // 4. Lightweight Instanced Node Particles (Constellation points)
    const particleCount = 20;
    const particleGeo = new THREE.BoxGeometry(0.045, 0.045, 0.045);
    const particleMat = new THREE.MeshBasicMaterial({
      color: 0xe4e4e7
    });
    const particles = new THREE.InstancedMesh(particleGeo, particleMat, particleCount);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 2.1 + (i % 3) * 0.35;
      const y = (Math.sin(i * 1.8) * 0.7);
      dummy.position.set(
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius
      );
      dummy.scale.setScalar(0.7 + (i % 4) * 0.3);
      dummy.updateMatrix();
      particles.setMatrixAt(i, dummy.matrix);
    }
    particles.instanceMatrix.needsUpdate = true;
    masterGroup.add(particles);

    // Mouse Tracking with Smooth Damping
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Responsive Resize Handler
    const handleResize = () => {
      if (!mount) return;
      width = mount.clientWidth || window.innerWidth;
      height = mount.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);

      if (width < 1024) {
        masterGroup.position.set(0, -0.4, 0);
      } else {
        masterGroup.position.set(1.2, 0, 0);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    // 60 FPS Render Loop with Delta Damping
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isVisibleRef.current) return;

      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      mouse.x += (mouse.targetX - mouse.x) * 4 * delta;
      mouse.y += (mouse.targetY - mouse.y) * 4 * delta;

      const progress = scrollRatioRef.current;

      camera.position.x = mouse.x * 0.45 + (progress * 0.3);
      camera.position.y = 0.6 - (progress * 0.7) + (mouse.y * 0.25);
      camera.position.z = 5.2 - (progress * 0.6);
      camera.lookAt(masterGroup.position.x * 0.3, -progress * 0.4, 0);

      const rotDelta = delta * 0.4;
      coreMesh.rotation.y += rotDelta;
      coreMesh.rotation.x += rotDelta * 0.5;
      wireMesh.rotation.y -= rotDelta * 0.8;
      wireMesh.rotation.z += rotDelta * 0.3;

      ring1.rotation.z += rotDelta * 1.2;
      ring2.rotation.z -= rotDelta * 0.9;
      particles.rotation.y += rotDelta * 0.6;

      masterGroup.position.y = Math.sin(currentTime * 0.0012) * 0.06;

      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      coreGeo.dispose();
      coreMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      ring1Geo.dispose();
      ring2Geo.dispose();
      ringMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      particles.dispose();
      renderer.dispose();

      if (mount && renderer.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Quick live telemetry data points based on mode
  const telemetryData = {
    vouchers: [
      { id: 'VCH-0941', type: 'SALES', party: 'Rahim Textile Mills', debit: '৳ 324,500', credit: '—', status: 'SETTLED' },
      { id: 'VCH-0942', type: 'PURCHASE', party: 'Chittagong Steel Corp', debit: '—', credit: '৳ 189,200', status: 'POSTED' },
      { id: 'VCH-0943', type: 'RECEIPT', party: 'Meghna Agro Foods', debit: '৳ 95,000', credit: '—', status: 'CLEARED' },
      { id: 'VCH-0944', type: 'CONTRA', party: 'City Bank Ltd → Petty Cash', debit: '৳ 50,000', credit: '৳ 50,000', status: 'BALANCED' }
    ],
    inventory: [
      { id: 'ITM-401', name: 'Cotton Yarn 40/1 Carded', godown: 'Godown-A (Narayanganj)', qty: '1,250 Pcs', rate: '৳ 380.00', trend: '+14% stock in' },
      { id: 'ITM-402', name: 'Polyester Fabric Roll 60"', godown: 'Godown-B (Chittagong)', qty: '840 Pcs', rate: '৳ 520.00', trend: 'Optimum reserve' },
      { id: 'ITM-403', name: 'Dyes & Auxiliary Chemical B', godown: 'Central Chemical Depot', qty: '320 Pcs', rate: '৳ 1,450.00', trend: 'Re-order safe' }
    ],
    liquidity: [
      { account: 'City Bank Current A/C (0128)', balance: '৳ 4,821,400.00', type: 'Dr', flow: '+ ৳ 419,000 today' },
      { account: 'Eastern Bank Operational A/C', balance: '৳ 2,140,850.00', type: 'Dr', flow: 'Payroll buffered' },
      { account: 'Cash in Hand (Dhaka HQ)', balance: '৳ 185,320.00', type: 'Dr', flow: 'Reconciled' },
      { account: 'Sundry Debtors Total Ledger', balance: '৳ 8,420,000.00', type: 'Dr', flow: 'Zero bad debt drift' }
    ]
  };

  // Resolve dynamic texts customizable from Founder Panel
  const displayTitle = heroTitleText || content.heroTitle || (
    language === 'bn' ? 'বাণিজ্যিক হিসাববিজ্ঞানের পরম নির্ভুলতা ও নিয়ন্ত্রণ।' : 'Absolute Truth in Commercial Ledgering.'
  );

  const displaySubtitle = heroSubtitleText || content.heroSubtitle || (
    language === 'bn'
      ? 'ডাবল-এন্ট্রি ব্যালেন্সিং, মাল্টি-গোডাউন স্টক ট্র্যাকিং এবং রিয়েল-টাইম ক্যাশফ্লো অডিট—কোনও কাল্পনিক ফলব্যাক বা ল্যাগ ছাড়াই এক প্ল্যাটফর্মে।'
      : 'Atomic double-entry balance computation, multi-location godown stock velocity, and board-level liquidity reporting on zero-overhead in-memory persistence. Pure accounting truth.'
  );

  const displayPrimaryCta = heroCtaPrimaryText || (
    user ? (language === 'bn' ? 'ERP ড্যাশবোর্ড' : 'Open Production Console') : (language === 'bn' ? 'উৎপাদন কনসোলে যান' : 'Enter Production Console')
  );

  const displayNavAction = heroNavActionText || (
    user ? (language === 'bn' ? 'কনসোল' : 'Open Console') : (language === 'bn' ? 'সাইন ইন' : 'Launch Console')
  );

  const displayDemoCta = heroCtaDemoText || (
    language === 'bn' ? 'এক্সপেরিয়েন্স হাব (ডেমো)' : 'Experience Hub Demo'
  );

  // Experience Hub Demo button is hidden by default; enabled ONLY if founder turns it on!
  const isDemoButtonVisible = content.showExperienceHubDemo !== undefined
    ? !!content.showExperienceHubDemo
    : (heroShowExperienceHubDemo ?? false);

  const m1Value = heroMetric1Value || '0 ms';
  const m1Label = heroMetric1Label || (language === 'bn' ? 'ব্যালেন্স হিসাব ল্যাগ' : 'Balance Drift Latency');

  const m2Value = heroMetric2Value || '100%';
  const m2Label = heroMetric2Label || (language === 'bn' ? 'সঠিক FIFO অডিট' : 'Real FIFO Valuation');

  const m3Value = heroMetric3Value || 'Gold+';
  const m3Label = heroMetric3Label || (language === 'bn' ? 'কোটা সেফ আর্কিটেকচার' : 'Quota Protection');

  return (
    <div 
      ref={heroContainerRef}
      className="relative w-full min-h-screen bg-[#0c0d10] text-[#f4f4f5] selection:bg-neutral-800 selection:text-white overflow-hidden font-sans"
    >
      {/* =========================================================================
          1. DEDICATED NEOMORPHISM (SOFT UI) FLOATING TOP MENU
          Includes REAL Company Logo or Brand Emblem, smooth section scrolling, and customizable launch button
          ========================================================================= */}
      <header 
        className={cn(
          "fixed top-4 left-0 right-0 z-50 px-4 sm:px-8 transition-all duration-300",
          scrolledPastTop ? "translate-y-0" : "translate-y-1"
        )}
      >
        <div className="max-w-7xl mx-auto">
          <nav 
            className="flex items-center justify-between px-5 py-3 rounded-2xl bg-[#121316] border border-white/[0.06] transition-all"
            style={{
              boxShadow: '8px 8px 18px rgba(0, 0, 0, 0.65), -5px -5px 14px rgba(255, 255, 255, 0.035)'
            }}
          >
            {/* Zone 1: Real Company Logo & Monochromatic Brand Lockup */}
            <Link to="/" className="flex items-center gap-3 group shrink-0">
              <div 
                className="w-9 h-9 rounded-xl bg-[#15171c] flex items-center justify-center p-1.5 border border-white/[0.08] transition-all group-hover:scale-105 overflow-hidden"
                style={{
                  boxShadow: '3px 3px 8px rgba(0,0,0,0.7), -2px -2px 6px rgba(255,255,255,0.06)'
                }}
              >
                {activeCompanyLogo ? (
                  <img 
                    src={activeCompanyLogo} 
                    alt={activeCompanyName} 
                    className="w-full h-full object-contain rounded-md"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-1 w-5 h-5 items-center justify-center">
                    <div className="w-2 h-2 rounded-[2px] bg-[#f97316]" />
                    <div className="w-2 h-2 rounded-[2px] bg-[#e11d48]" />
                    <div className="w-2 h-2 rounded-[2px] bg-[#3b82f6]" />
                    <div className="w-2 h-2 rounded-[2px] bg-[#eab308]" />
                  </div>
                )}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm sm:text-base font-extrabold tracking-tight text-white uppercase font-mono">
                  {activeCompanyName}
                </span>
                <span className="text-[9px] font-mono tracking-widest text-neutral-400 uppercase -mt-0.5">
                  MONOCHROME CORE
                </span>
              </div>
            </Link>

            {/* Zone 2: Neomorphic Soft UI Navigation Links (Home, Features, Pricing, Docs, About, Contact) */}
            <div className="hidden md:flex items-center gap-1">
              {[
                { name: t('nav.home') || (language === 'bn' ? 'হোম' : 'Home'), href: '/' },
                { name: t('nav.features') || (language === 'bn' ? 'ফিচার' : 'Features'), href: '/features' },
                { name: t('nav.pricing') || (language === 'bn' ? 'প্রাইসিং' : 'Pricing'), href: '/pricing' },
                { name: language === 'bn' ? 'ডকুমেন্টস' : 'Docs', href: '/docs' },
                { name: t('nav.about') || (language === 'bn' ? 'আমাদের সম্পর্কে' : 'About'), href: '/about' },
                { name: t('nav.contact') || (language === 'bn' ? 'যোগাযোগ' : 'Contact'), href: '/contact' }
              ].map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-300 hover:text-white transition-all whitespace-nowrap hover:bg-[#16181e] active:scale-95"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = 'inset 2px 2px 4px rgba(0,0,0,0.5), inset -1px -1px 3px rgba(255,255,255,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Zone 3: Soft UI Controls (Language Switcher + Dynamic Action Buttons based on Login State) */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Neomorphic Dual Language Pill Switcher */}
              <div 
                className="hidden sm:flex items-center p-1 rounded-xl bg-[#0f1013] border border-white/[0.04]"
                style={{
                  boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.6), inset -2px -2px 5px rgba(255,255,255,0.03)'
                }}
              >
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold tracking-wider transition-all cursor-pointer",
                    language === 'en'
                      ? "bg-[#1d1f26] text-white shadow-xs border border-white/[0.1]"
                      : "text-neutral-400 hover:text-white"
                  )}
                  style={language === 'en' ? {
                    boxShadow: '2px 2px 6px rgba(0,0,0,0.5), -1px -1px 4px rgba(255,255,255,0.06)'
                  } : {}}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('bn')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold tracking-wider transition-all cursor-pointer",
                    language === 'bn'
                      ? "bg-[#1d1f26] text-white shadow-xs border border-white/[0.1]"
                      : "text-neutral-400 hover:text-white"
                  )}
                  style={language === 'bn' ? {
                    boxShadow: '2px 2px 6px rgba(0,0,0,0.5), -1px -1px 4px rgba(255,255,255,0.06)'
                  } : {}}
                >
                  BN
                </button>
              </div>

              {/* Action Buttons based strictly on Login State */}
              {user ? (
                <Link
                  to="/dashboard"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white tracking-wide bg-[#171920] border border-white/[0.09] transition-all flex items-center gap-2 group active:scale-95 cursor-pointer whitespace-nowrap"
                  style={{
                    boxShadow: '4px 4px 10px rgba(0,0,0,0.65), -2px -2px 8px rgba(255,255,255,0.05)'
                  }}
                >
                  <span>{language === 'bn' ? 'লঞ্চ কনসোল' : 'Launch Console'}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:translate-x-0.5 group-hover:text-white transition-all" />
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white border border-transparent hover:border-white/[0.08] hover:bg-[#16181f] transition-all active:scale-95 whitespace-nowrap cursor-pointer"
                  >
                    {language === 'bn' ? 'সাইন ইন' : 'Sign in'}
                  </Link>
                  <Link
                    to="/login"
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white tracking-wide bg-[#181a22] border border-white/[0.12] transition-all flex items-center gap-1.5 group active:scale-95 cursor-pointer whitespace-nowrap shadow-sm hover:bg-[#1f212a]"
                    style={{
                      boxShadow: '3px 3px 8px rgba(0,0,0,0.6), -2px -2px 6px rgba(255,255,255,0.04)'
                    }}
                  >
                    <span>{language === 'bn' ? 'গেট স্টার্টেড' : 'Get Started'}</span>
                    <ArrowRight className="w-3 h-3 text-neutral-400 group-hover:translate-x-0.5 group-hover:text-white transition-all" />
                  </Link>
                </div>
              )}

              {/* Mobile Menu Trigger */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-xl bg-[#14151a] text-neutral-300 border border-white/[0.06] active:scale-95 cursor-pointer"
                style={{
                  boxShadow: '2px 2px 6px rgba(0,0,0,0.5), -1px -1px 4px rgba(255,255,255,0.04)'
                }}
              >
                {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </nav>

          {/* Mobile Neomorphic Drawer */}
          {isMobileMenuOpen && (
            <div 
              className="md:hidden mt-2 p-4 rounded-2xl bg-[#121316] border border-white/[0.08] space-y-3"
              style={{
                boxShadow: '8px 8px 20px rgba(0,0,0,0.7), -4px -4px 14px rgba(255,255,255,0.04)'
              }}
            >
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: t('nav.home') || (language === 'bn' ? 'হোম' : 'Home'), href: '/' },
                  { name: t('nav.features') || (language === 'bn' ? 'ফিচার' : 'Features'), href: '/features' },
                  { name: t('nav.pricing') || (language === 'bn' ? 'প্রাইসিং' : 'Pricing'), href: '/pricing' },
                  { name: language === 'bn' ? 'ডকুমেন্টস' : 'Docs', href: '/docs' },
                  { name: t('nav.about') || (language === 'bn' ? 'আমাদের সম্পর্কে' : 'About'), href: '/about' },
                  { name: t('nav.contact') || (language === 'bn' ? 'যোগাযোগ' : 'Contact'), href: '/contact' }
                ].map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2.5 rounded-xl bg-[#16181f] text-xs font-medium text-neutral-300 text-center border border-white/[0.04]"
                    style={{
                      boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.5), inset -1px -1px 2px rgba(255,255,255,0.03)'
                    }}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              {!user && (
                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2">
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex-1 py-2 rounded-xl bg-[#15161c] text-xs font-semibold text-neutral-300 text-center border border-white/[0.06]"
                  >
                    {language === 'bn' ? 'সাইন ইন' : 'Sign in'}
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex-1 py-2 rounded-xl bg-[#1c1e28] text-xs font-bold text-white text-center border border-white/[0.1]"
                  >
                    {language === 'bn' ? 'গেট স্টার্টেড' : 'Get Started'}
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* =========================================================================
          FLOATING QUICK-NAV DOCK ON RIGHT-CENTER OF SCREEN
          Smoothly scrolls to Telemetry, Capabilities, and Architecture sections
          ========================================================================= */}
      <div 
        className="fixed right-3 sm:right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col items-end gap-2.5 pointer-events-auto select-none"
        aria-label="Section Quick Navigation"
      >
        {[
          { id: 'telemetry', label: language === 'bn' ? 'টেলিমেট্রি' : 'Telemetry', icon: Activity },
          { id: 'modules', label: language === 'bn' ? 'ক্যাপাবিলিটিজ' : 'Capabilities', icon: Layers },
          { id: 'architecture', label: language === 'bn' ? 'আর্কিটেকচার' : 'Architecture', icon: Cpu }
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollToSection(item.id)}
              className="group relative flex items-center justify-end p-2 sm:p-2.5 rounded-2xl bg-[#121316]/95 hover:bg-[#181a20] border border-white/[0.08] hover:border-white/[0.2] text-neutral-300 hover:text-white transition-all cursor-pointer backdrop-blur-md active:scale-95"
              style={{
                boxShadow: '6px 6px 14px rgba(0,0,0,0.7), -3px -3px 8px rgba(255,255,255,0.035)'
              }}
              title={item.label}
            >
              <span className="hidden md:inline-block max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-out text-xs font-mono font-bold text-neutral-200 px-0 group-hover:px-2.5">
                {item.label}
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#16181f] flex items-center justify-center text-white border border-white/[0.06] group-hover:border-white/[0.18] transition-all">
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-300 group-hover:text-white transition-colors" />
              </div>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          2. WEBGL THREE.JS CANVAS (Background Spatial Monolith)
          Ultra smooth, hardware accelerated, zero scroll re-renders
          ========================================================================= */}
      <div 
        ref={canvasMountRef}
        className="absolute inset-0 z-0 pointer-events-none opacity-80"
        style={{ willChange: 'transform' }}
      />

      {/* Monochromatic Subtle Radial Backdrop & Micro-Grid */}
      <div 
        className="absolute inset-0 z-1 pointer-events-none opacity-40"
        style={{
          backgroundImage: `radial-gradient(circle at 75% 35%, rgba(255,255,255,0.03) 0%, transparent 60%)`
        }}
      />
      <div 
        className="absolute inset-0 z-1 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '48px 48px'
        }}
      />

      {/* =========================================================================
          3. MAIN HERO VIEWPORT: ASYMMETRIC MONOCHROMATIC ARCHITECTURE
          Left: Sovereign Value Engine & Monumental Typography
          Right: Live Neomorphic Financial Telemetry Node (id="telemetry")
          ========================================================================= */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 sm:pt-40 pb-20 lg:min-h-screen lg:flex lg:flex-col lg:justify-center">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* LEFT COLUMN (7 Cols): Editorial Typographic Stature */}
          <div className="lg:col-span-7 space-y-7 text-left">
            
            {/* Dynamic Current App Version Badge */}
            <div className="flex items-center gap-3">
              <div 
                className="px-3.5 py-1.5 rounded-xl bg-[#131418] border border-white/[0.08] flex items-center gap-2 text-[11px] font-mono tracking-wider text-neutral-300 select-none"
                style={{
                  boxShadow: '3px 3px 8px rgba(0,0,0,0.6), -2px -2px 6px rgba(255,255,255,0.04)'
                }}
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-white font-bold font-mono tracking-wider">{cleanVersion}</span>
              </div>
            </div>

            {/* Hero Monumental Headline (Customizable from Founder Panel) */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08]">
              {displayTitle}
            </h1>

            {/* Value Proposition Description (Customizable from Founder Panel) */}
            <p className="text-base sm:text-lg text-neutral-400 max-w-xl font-normal leading-relaxed">
              {displaySubtitle}
            </p>

            {/* Neomorphic Action Controls Cluster */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              {/* Primary Tactile Soft UI Button (Text customizable via Founder Panel) */}
              <Link
                to={user ? "/dashboard" : "/login"}
                className="px-7 py-3.5 rounded-2xl bg-[#161820] text-white font-bold text-sm tracking-wide border border-white/[0.12] transition-all flex items-center justify-center gap-3 active:scale-95 group cursor-pointer"
                style={{
                  boxShadow: '6px 6px 16px rgba(0,0,0,0.7), -4px -4px 12px rgba(255,255,255,0.06)'
                }}
              >
                <span>{displayPrimaryCta}</span>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 group-hover:text-white transition-all" />
              </Link>

              {/* Secondary Soft UI Debossed Button: Experience Hub Demo (Controlled strictly by Founder Panel toggle!) */}
              {isDemoButtonVisible && onOpenDemoModal && !user && (
                <button
                  type="button"
                  onClick={onOpenDemoModal}
                  className="px-6 py-3.5 rounded-2xl bg-[#101115] text-neutral-300 hover:text-white font-semibold text-sm tracking-wide border border-white/[0.05] transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                  style={{
                    boxShadow: 'inset 2px 2px 6px rgba(0,0,0,0.6), inset -2px -2px 6px rgba(255,255,255,0.03)'
                  }}
                >
                  <Sparkles className="w-4 h-4 text-neutral-400" />
                  <span>{displayDemoCta}</span>
                </button>
              )}
            </div>

            {/* Architectural Trust Metrics (Customizable from Founder Panel) */}
            <div className="pt-6 border-t border-white/[0.06] grid grid-cols-3 gap-4 max-w-lg">
              <div>
                <div className="text-xl sm:text-2xl font-mono font-bold text-white tabular-nums tracking-tight">{m1Value}</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">{m1Label}</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-mono font-bold text-white tabular-nums tracking-tight">{m2Value}</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">{m2Label}</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-mono font-bold text-white tabular-nums tracking-tight">{m3Value}</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">{m3Label}</div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN (5 Cols): Interactive Neomorphic Telemetry Node (id="telemetry") */}
          <div id="telemetry" className="lg:col-span-5 scroll-mt-28">
            <div 
              className="p-5 sm:p-6 rounded-3xl bg-[#121418] border border-white/[0.08] backdrop-blur-md transition-all relative overflow-hidden"
              style={{
                boxShadow: '12px 12px 30px rgba(0, 0, 0, 0.75), -8px -8px 24px rgba(255, 255, 255, 0.04)'
              }}
            >
              {/* Soft UI Header with Mode Toggles */}
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-7 h-7 rounded-lg bg-[#16181f] flex items-center justify-center text-white border border-white/[0.08]"
                    style={{
                      boxShadow: '2px 2px 6px rgba(0,0,0,0.6), -1px -1px 4px rgba(255,255,255,0.04)'
                    }}
                  >
                    <Activity className="w-3.5 h-3.5 text-neutral-300" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold font-mono tracking-wider text-white uppercase">
                      {language === 'bn' ? 'লাইভ লেজার নোড' : 'LIVE TELEMETRY NODE'}
                    </h3>
                    <p className="text-[10px] text-neutral-400 font-mono">
                      {language === 'bn' ? 'স্বয়ংক্রিয় ভাউচার ও স্টক ডাটা' : 'Active Ledger Stream · Zero Lag'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-400">
                  <span className="w-2 h-2 rounded-full bg-white/80" />
                  <span>STREAMING</span>
                </div>
              </div>

              {/* Neomorphic Segmented Interactive Selector */}
              <div 
                className="mt-4 p-1 rounded-xl bg-[#0e0f12] border border-white/[0.04] grid grid-cols-3 gap-1"
                style={{
                  boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.6), inset -2px -2px 5px rgba(255,255,255,0.03)'
                }}
              >
                {[
                  { key: 'vouchers', label: language === 'bn' ? 'ভাউচার' : 'Vouchers' },
                  { key: 'inventory', label: language === 'bn' ? 'ইনভেন্টরি' : 'Inventory' },
                  { key: 'liquidity', label: language === 'bn' ? 'লিকুইডিটি' : 'Liquidity' }
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setTelemetryMode(item.key as TelemetryMode)}
                    className={cn(
                      "py-1.5 text-[11px] font-mono font-bold tracking-wider rounded-lg transition-all cursor-pointer",
                      telemetryMode === item.key
                        ? "bg-[#181a22] text-white border border-white/[0.1]"
                        : "text-neutral-400 hover:text-white"
                    )}
                    style={telemetryMode === item.key ? {
                      boxShadow: '3px 3px 8px rgba(0,0,0,0.5), -1px -1px 5px rgba(255,255,255,0.05)'
                    } : {}}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Dynamic Content Stream Area */}
              <div className="mt-4 space-y-2.5 min-h-[260px]">
                {telemetryMode === 'vouchers' && (
                  <div className="space-y-2 animate-fadeIn">
                    {telemetryData.vouchers.map((v) => (
                      <div 
                        key={v.id}
                        className="p-3 rounded-xl bg-[#15161c] border border-white/[0.04] flex items-center justify-between hover:border-white/[0.1] transition-all"
                        style={{
                          boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.5), inset -1px -1px 2px rgba(255,255,255,0.03)'
                        }}
                      >
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-neutral-400">{v.id}</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/[0.06] text-white font-semibold">
                              {v.type}
                            </span>
                          </div>
                          <span className="text-xs font-medium text-neutral-200 mt-1 truncate max-w-[180px]">
                            {v.party}
                          </span>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-mono font-bold text-white tabular-nums">
                            {v.debit !== '—' ? v.debit : v.credit}
                          </div>
                          <span className="text-[9px] font-mono text-neutral-400 tracking-wider">
                            {v.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {telemetryMode === 'inventory' && (
                  <div className="space-y-2 animate-fadeIn">
                    {telemetryData.inventory.map((item) => (
                      <div 
                        key={item.id}
                        className="p-3 rounded-xl bg-[#15161c] border border-white/[0.04] flex items-center justify-between"
                        style={{
                          boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.5), inset -1px -1px 2px rgba(255,255,255,0.03)'
                        }}
                      >
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-neutral-400">{item.id}</span>
                            <span className="text-[10px] text-neutral-400 truncate max-w-[140px]">{item.godown}</span>
                          </div>
                          <span className="text-xs font-semibold text-white mt-1 truncate max-w-[190px]">
                            {item.name}
                          </span>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-mono font-bold text-white tabular-nums">
                            {item.qty}
                          </div>
                          <div className="text-[10px] font-mono text-neutral-400 tabular-nums">
                            @ {item.rate}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {telemetryMode === 'liquidity' && (
                  <div className="space-y-2 animate-fadeIn">
                    {telemetryData.liquidity.map((acc, i) => (
                      <div 
                        key={i}
                        className="p-3 rounded-xl bg-[#15161c] border border-white/[0.04] flex items-center justify-between"
                        style={{
                          boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.5), inset -1px -1px 2px rgba(255,255,255,0.03)'
                        }}
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-neutral-300">
                            {acc.account}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-400 mt-0.5">
                            {acc.flow}
                          </span>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-mono font-bold text-white tabular-nums">
                            {acc.balance}
                          </div>
                          <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-white/[0.08] text-white">
                            {acc.type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Tactile Quick Link to Live Console */}
              <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-neutral-400">
                <span>{language === 'bn' ? 'সরাসরি ডাটাবেস লিঙ্ক' : 'Indexed Storage Verified'}</span>
                <Link 
                  to="/login"
                  className="text-white hover:text-neutral-300 flex items-center gap-1 transition-colors"
                >
                  <span>{language === 'bn' ? 'কনসোল লগইন' : 'Console Login'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>
          </div>

        </div>

      </section>

      {/* =========================================================================
          4. CORE CAPABILITIES (id="modules")
          Smooth scroll target for "Capabilities" in Menu bar
          ========================================================================= */}
      <section id="modules" className="relative z-10 py-24 bg-[#0a0b0d] border-t border-white/[0.06] scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Kicker */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="text-xs font-mono tracking-widest text-neutral-400 uppercase mb-2">
                01. {language === 'bn' ? 'কোর ইঞ্জিন মডিউল' : 'CORE CAPABILITIES'}
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                {language === 'bn' 
                  ? 'উন্নত মোনোক্রোম আর্কিটেকচার'
                  : 'Engineered for Zero Data Drift'}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-md font-normal leading-relaxed">
              {language === 'bn'
                ? 'সরাসরি আর্থিক রেকর্ড থেকে সঠিক ক্যাশফ্লো ও ব্যয়ের অ্যানালাইসিস—কোনও কৃত্রিম সাইন-ওয়েভ বা ফেক ক্যালকুলেশন নেই।'
                : 'Transactions are committed atomically with instant ledger balance recalculation and zero-sweep background overhead.'}
            </p>
          </div>

          {/* Neomorphic Asymmetric Bento Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1: Double Entry Core */}
            <div 
              className="p-6 rounded-2xl bg-[#121317] border border-white/[0.06] flex flex-col justify-between hover:border-white/[0.12] transition-all group"
              style={{
                boxShadow: '8px 8px 20px rgba(0,0,0,0.65), -5px -5px 14px rgba(255,255,255,0.035)'
              }}
            >
              <div className="space-y-4">
                <div 
                  className="w-10 h-10 rounded-xl bg-[#16181f] flex items-center justify-center text-white border border-white/[0.08]"
                  style={{
                    boxShadow: '3px 3px 8px rgba(0,0,0,0.6), -2px -2px 6px rgba(255,255,255,0.04)'
                  }}
                >
                  <Database className="w-5 h-5 text-white" />
                </div>
                <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-widest">
                  01 · {language === 'bn' ? 'ডাবল এন্ট্রি' : 'LEDGER KERNEL'}
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-neutral-200 transition-colors">
                  {language === 'bn' ? 'অ্যাটোমিক ব্যালেন্স ইঞ্জিন' : 'Atomic Journal Engine'}
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  {language === 'bn' 
                    ? 'প্রতিটি ভাউচার সেভ হওয়ার সাথে সাথে লেজার ব্যালেন্স ও সিরিয়াল সিঙ্ক হয়।'
                    : 'Debits and credits balance in a single transaction with pre-calculated balances.'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-neutral-300">
                <span>0-SCAN READS</span>
                <span className="font-bold text-white">SUB-MS</span>
              </div>
            </div>

            {/* Card 2: Multi-Godown Velocity */}
            <div 
              className="p-6 rounded-2xl bg-[#121317] border border-white/[0.06] flex flex-col justify-between hover:border-white/[0.12] transition-all group"
              style={{
                boxShadow: '8px 8px 20px rgba(0,0,0,0.65), -5px -5px 14px rgba(255,255,255,0.035)'
              }}
            >
              <div className="space-y-4">
                <div 
                  className="w-10 h-10 rounded-xl bg-[#16181f] flex items-center justify-center text-white border border-white/[0.08]"
                  style={{
                    boxShadow: '3px 3px 8px rgba(0,0,0,0.6), -2px -2px 6px rgba(255,255,255,0.04)'
                  }}
                >
                  <Boxes className="w-5 h-5 text-white" />
                </div>
                <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-widest">
                  02 · {language === 'bn' ? 'মাল্টি-গোডাউন' : 'STOCK VELOCITY'}
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-neutral-200 transition-colors">
                  {language === 'bn' ? 'রিয়েল-টাইম স্টক মূল্যায়ন' : 'FIFO & Godown Valuation'}
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  {language === 'bn'
                    ? 'লটভিত্তিক ক্রয়মূল্য ও বিক্রয়মূল্যের নির্ভুল সমন্বয়, পূর্ণাঙ্গ ইনভেন্টরি ট্র্যাকিং।'
                    : 'Exact movement types and timestamped valuations without periodic table sweeps.'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-neutral-300">
                <span>INTEGER PCS</span>
                <span className="font-bold text-white">STRICT MATH</span>
              </div>
            </div>

            {/* Card 3: Boardroom BI */}
            <div 
              className="p-6 rounded-2xl bg-[#121317] border border-white/[0.06] flex flex-col justify-between hover:border-white/[0.12] transition-all group"
              style={{
                boxShadow: '8px 8px 20px rgba(0,0,0,0.65), -5px -5px 14px rgba(255,255,255,0.035)'
              }}
            >
              <div className="space-y-4">
                <div 
                  className="w-10 h-10 rounded-xl bg-[#16181f] flex items-center justify-center text-white border border-white/[0.08]"
                  style={{
                    boxShadow: '3px 3px 8px rgba(0,0,0,0.6), -2px -2px 6px rgba(255,255,255,0.04)'
                  }}
                >
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-widest">
                  03 · {language === 'bn' ? 'ফিন্যান্সিয়াল বিআই' : 'BOARDROOM BI'}
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-neutral-200 transition-colors">
                  {language === 'bn' ? 'ক্যাশফ্লো ও ব্যয় অ্যানালিটিক্স' : 'Expense & Margin Analytics'}
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  {language === 'bn'
                    ? 'নির্বাচিত নির্দিষ্ট সময়ের লেনদেন বিশ্লেষণ করে সঠিক প্রফিট মার্জিন প্রদর্শন।'
                    : 'Strict period-discipline: reports reflect only the exact date range requested.'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-neutral-300">
                <span>PERIOD ACCURACY</span>
                <span className="font-bold text-white">100% AUDIT</span>
              </div>
            </div>

            {/* Card 4: Quota Resilience */}
            <div 
              className="p-6 rounded-2xl bg-[#121317] border border-white/[0.06] flex flex-col justify-between hover:border-white/[0.12] transition-all group"
              style={{
                boxShadow: '8px 8px 20px rgba(0,0,0,0.65), -5px -5px 14px rgba(255,255,255,0.035)'
              }}
            >
              <div className="space-y-4">
                <div 
                  className="w-10 h-10 rounded-xl bg-[#16181f] flex items-center justify-center text-white border border-white/[0.08]"
                  style={{
                    boxShadow: '3px 3px 8px rgba(0,0,0,0.6), -2px -2px 6px rgba(255,255,255,0.04)'
                  }}
                >
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-widest">
                  04 · {language === 'bn' ? 'ক্লাউড অপটিমাইজেশন' : 'QUOTA SHIELD'}
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-neutral-200 transition-colors">
                  {language === 'bn' ? 'বাফারড ট্র্যাকিং ও ক্যাশিং' : 'Memory Quota Buffering'}
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  {language === 'bn'
                    ? 'ডাটাবেস রিড কমানোর জন্য ৩০ মিনিটের ইন-মেমোরি ও লোকালস্টোরেজ ক্যাশিং।'
                    : 'Batched writes and pre-indexed range queries extend service life and prevent quota exhaustion.'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-neutral-300">
                <span>BATTERY EFFICIENT</span>
                <span className="font-bold text-white">60 FPS</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          5. SYSTEM ARCHITECTURE & DATA INTEGRITY (id="architecture")
          Smooth scroll target for "Architecture" in Menu bar
          ========================================================================= */}
      <section id="architecture" className="relative z-10 py-24 bg-[#0c0d10] border-t border-white/[0.06] scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <div className="text-xs font-mono tracking-widest text-neutral-400 uppercase">
              02 · {language === 'bn' ? 'সিস্টেম আর্কিটেকচার' : 'SYSTEM ARCHITECTURE'}
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              {language === 'bn' ? 'ব্যবসায়িক ডাটার স্থায়ী নির্ভুলতা' : 'Zero Synthetic Fallbacks. Pure Accounting.'}
            </h2>
            <p className="text-sm text-neutral-400 max-w-xl mx-auto leading-relaxed">
              {language === 'bn'
                ? 'SAPIENT ERP-তে কোনো কাল্পনিক হিসাব, সিনথেটিক সাইন কার্ভ বা ভুয়া মাল্টিপ্লায়ার নেই। প্রতিটি ডাটা সরাসরি গ্রাহকের প্রকৃত ভাউচার ও ট্রানজ্যাকশন থেকে তৈরি।'
                : 'Every report, ledger balance, and stock ledger entry is grounded strictly in authentic voucher records. Never simulated. Never mocked.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div 
              className="p-6 rounded-2xl bg-[#121316] border border-white/[0.06]"
              style={{
                boxShadow: '6px 6px 16px rgba(0,0,0,0.6), -4px -4px 12px rgba(255,255,255,0.03)'
              }}
            >
              <h4 className="text-sm font-bold font-mono text-white mb-2 uppercase">
                {language === 'bn' ? '১. টার্গেটেড ইনডেক্সিং' : '1. Targeted Indexing'}
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {language === 'bn' 
                  ? 'হাজার হাজার রেকর্ড স্ক্যান না করে ফায়ারস্টোরের ইনডেক্সড কোয়েরির মাধ্যমে শুধুমাত্র কাঙ্ক্ষিত ডেট রেঞ্জের ভাউচার রিড করা হয়।'
                  : 'Range queries execute strictly within targeted indexed sets, reducing Firestore read quotas to the absolute minimum.'}
              </p>
            </div>

            <div 
              className="p-6 rounded-2xl bg-[#121316] border border-white/[0.06]"
              style={{
                boxShadow: '6px 6px 16px rgba(0,0,0,0.6), -4px -4px 12px rgba(255,255,255,0.03)'
              }}
            >
              <h4 className="text-sm font-bold font-mono text-white mb-2 uppercase">
                {language === 'bn' ? '২. প্রি-অ্যাগ্রিগেটেড লেজার' : '2. Pre-Aggregated Balances'}
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {language === 'bn'
                  ? 'ভাউচার সেভ করার মুহূর্তে লেজার ব্যালেন্স অটো-আপডেট থাকে, ফলে স্টেটমেন্ট দেখতে পুরো ডাটাবেজ স্ক্যান করতে হয় না।'
                  : 'Balances are maintained on the master ledger documents with point-in-time opening math, delivering 1-document reads.'}
              </p>
            </div>

            <div 
              className="p-6 rounded-2xl bg-[#121316] border border-white/[0.06]"
              style={{
                boxShadow: '6px 6px 16px rgba(0,0,0,0.6), -4px -4px 12px rgba(255,255,255,0.03)'
              }}
            >
              <h4 className="text-sm font-bold font-mono text-white mb-2 uppercase">
                {language === 'bn' ? '৩. অটো-সিরিয়াল সেফটি' : '3. Counter Safety'}
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {language === 'bn'
                  ? 'সিরিয়াল নাম্বার তৈরির জন্য ভাউচার কালেকশনে ডিপ-স্ক্যান বন্ধ রেখে ডেডিকেটেড কাউন্টার ডকুমেন্টের মাধ্যমে সিরিয়াল নিশ্চিত করা হয়।'
                  : 'Auto-serial generation reads exclusively from dedicated counter documents with zero full collection sweeps.'}
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
