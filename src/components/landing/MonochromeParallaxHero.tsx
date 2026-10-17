import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { 
  ArrowRight, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  Zap, 
  TrendingUp, 
  Database, 
  Boxes, 
  Check, 
  FileText, 
  ChevronRight,
  Sparkles,
  Maximize2
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
    [key: string]: any;
  };
  onOpenDemoModal?: () => void;
}

export const MonochromeParallaxHero: React.FC<MonochromeParallaxHeroProps> = ({
  content,
  onOpenDemoModal
}) => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const { companyName = 'TallyFlow ERP' } = useSettings();

  const canvasMountRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parallax scroll states (continuous, non-snapping)
  const [scrollY, setScrollY] = useState(0);
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);

  // Enterprise modules for continuous horizontal parallax track
  const enterpriseModules = [
    {
      id: 'core-gl',
      tag: 'FINANCIAL CORE',
      title: language === 'bn' ? 'ডাবল-এন্ট্রি লেজার ইঞ্জিন' : 'Double-Entry Ledger Architecture',
      desc: language === 'bn' ? 'মিলি-সেকেন্ডে প্রাক-হিসাবকৃত ব্যালেন্স ও রিয়েল-টাইম ব্যালেন্স শীট' : 'Sub-millisecond balance computation with zero-delay trial balance & statements',
      metric: '৳ 1.84M Net Inflow',
      status: 'VERIFIED DR/CR'
    },
    {
      id: 'smart-stock',
      tag: 'INVENTORY LOGISTICS',
      title: language === 'bn' ? 'রিয়েল-টাইম স্টক ও গোডাউন মুভমেন্ট' : 'Multi-Godown Stock Valuation',
      desc: language === 'bn' ? 'অ্যাটোমিক ব্যাচ ট্র্যাকিং ও স্বয়ংক্রিয় রিয়র্ডারিং অ্যালার্ট' : 'FIFO & moving average valuation with zero background sweep overhead',
      metric: '4,280 Pcs Audited',
      status: 'OPTIMAL LEVELS'
    },
    {
      id: 'payroll-engine',
      tag: 'HUMAN CAPITAL',
      title: language === 'bn' ? 'অটোমেটেড পেরোল ও উপস্থিতি' : 'Automated Payroll & Compliance',
      desc: language === 'bn' ? 'এক ক্লিকে স্যালারি স্লিপ, ব্যাংক ট্রান্সফার ড্রাফট ও প্রভিডেন্ট ফান্ড' : 'Instant pay-slip generation, tax deductions & statutory compliance vaults',
      metric: '100% On-Time Disbursed',
      status: 'AUDIT COMPLIANT'
    },
    {
      id: 'analytics-bi',
      tag: 'DECISION ENGINE',
      title: language === 'bn' ? 'ব্যবসায়িক ইন্টেলিজেন্স ও পূর্বাভাস' : 'Executive BI & Expense Matrix',
      desc: language === 'bn' ? 'সরাসরি আর্থিক রেকর্ড থেকে সঠিক ক্যাশফ্লো ও ব্যয়ের অ্যানালাইসিস' : 'Authentic transaction-grounded trends with strictly zero mock projections',
      metric: '+32.4% Margin Surge',
      status: 'REALTIME STREAM'
    }
  ];

  // Continuous scroll listener for smooth parallax calculations
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const topOffset = -rect.top;
            setScrollY(Math.max(0, topOffset));
          } else {
            setScrollY(window.scrollY);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Three.js Scene Setup with procedural Monochromatic 3D Assets
  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    // Dimensions
    const width = mount.clientWidth || window.innerWidth;
    const height = mount.clientHeight || window.innerHeight;

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x09090b); // Deep obsidian monochromatic black
    scene.fog = new THREE.FogExp2(0x09090b, 0.022);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 5.5);

    // Renderer
    const isHeadless = navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);
    const renderer = new THREE.WebGLRenderer({
      antialias: !isHeadless,
      powerPreference: 'high-performance',
      alpha: false
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = !isHeadless;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mount.appendChild(renderer.domElement);

    // Procedural Studio Environment Reflection
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Lighting Rig (Key, Fill, Rim with Monochromatic Silver/White Highlights)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(4, 6, 4);
    keyLight.castShadow = !isHeadless;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const fillLight = new THREE.HemisphereLight(0xffffff, 0x18181b, 0.7);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xd4d4d8, 1.8);
    rimLight.position.set(-4, 3, -3);
    scene.add(rimLight);

    // Procedural Monochromatic 7-Part Master Asset Group
    const masterGroup = new THREE.Group();
    masterGroup.position.set(0, 0, 0);
    scene.add(masterGroup);

    // 1. Central Core: Monochromatic Crystal Octahedron / Hex Prism (Primary Silhouette)
    const coreGeometry = new THREE.OctahedronGeometry(1.2, 1);
    const coreMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x18181b,
      metalness: 0.9,
      roughness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      reflectivity: 0.9,
      transmission: 0.2,
      thickness: 0.8
    });
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    coreMesh.castShadow = !isHeadless;
    coreMesh.receiveShadow = !isHeadless;
    masterGroup.add(coreMesh);

    // 2. Wireframe Precision Outer Shell (Accent Detail)
    const wireframeGeometry = new THREE.OctahedronGeometry(1.22, 1);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.22
    });
    const wireframeMesh = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
    masterGroup.add(wireframeMesh);

    // 3. Dual Titanium Orbital Rings (Secondary Read)
    const ring1Geo = new THREE.TorusGeometry(1.9, 0.015, 16, 100);
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0xe4e4e7,
      metalness: 0.95,
      roughness: 0.25
    });
    const ring1 = new THREE.Mesh(ring1Geo, ringMaterial);
    ring1.rotation.x = Math.PI / 3;
    masterGroup.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(2.3, 0.012, 16, 100);
    const ring2 = new THREE.Mesh(ring2Geo, ringMaterial);
    ring2.rotation.x = -Math.PI / 4;
    ring2.rotation.y = Math.PI / 6;
    masterGroup.add(ring2);

    // 4. Floating Satellite Nodes (InstancedMesh)
    const nodeCount = 24;
    const nodeGeo = new THREE.BoxGeometry(0.06, 0.06, 0.06);
    const nodeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.8,
      roughness: 0.2
    });
    const instancedNodes = new THREE.InstancedMesh(nodeGeo, nodeMat, nodeCount);
    instancedNodes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const nodePositions: THREE.Vector3[] = [];
    const dummy = new THREE.Object3D();
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const radius = 2.1 + (i % 3) * 0.4;
      const y = (Math.sin(i * 1.5) * 0.7);
      const pos = new THREE.Vector3(
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius
      );
      nodePositions.push(pos);
      dummy.position.copy(pos);
      dummy.updateMatrix();
      instancedNodes.setMatrixAt(i, dummy.matrix);
    }
    instancedNodes.instanceMatrix.needsUpdate = true;
    instancedNodes.computeBoundingSphere();
    masterGroup.add(instancedNodes);

    // 5. Contact Shadow Plane Grounding
    const shadowGeo = new THREE.PlaneGeometry(5, 5);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.35,
      depthWrite: false
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.6;
    masterGroup.add(shadowPlane);

    // 6. Monochromatic Ground Spatial Grid
    const gridHelper = new THREE.GridHelper(30, 30, 0x52525b, 0x18181b);
    gridHelper.position.y = -1.61;
    scene.add(gridHelper);

    // Shader Pre-warm
    renderer.compile(scene, camera);

    // Mouse movement parallax damping
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Handle Resize
    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const render = () => {
      animationFrameId = requestAnimationFrame(render);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Exponential damping on mouse tracking
      mouse.x = THREE.MathUtils.damp(mouse.x, mouse.targetX, 4, delta);
      mouse.y = THREE.MathUtils.damp(mouse.y, mouse.targetY, 4, delta);

      // Continuous scroll parallax interpolation (dual axis)
      const currentScrollRatio = Math.min(1.5, scrollY / 600);

      // Smooth camera motion responding to scroll & mouse
      const targetCamX = mouse.x * 0.45 + (currentScrollRatio * 0.4);
      const targetCamY = 1.2 - (currentScrollRatio * 0.8) + (mouse.y * 0.3);
      const targetCamZ = 5.5 - (currentScrollRatio * 0.5);

      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamX, 3.5, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamY, 3.5, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamZ, 3.5, delta);
      camera.lookAt(0, -currentScrollRatio * 0.3, 0);

      // Rotate 3D Monolith
      coreMesh.rotation.y = elapsed * 0.25;
      coreMesh.rotation.x = Math.sin(elapsed * 0.15) * 0.1;

      wireframeMesh.rotation.y = -elapsed * 0.2;
      wireframeMesh.rotation.x = Math.cos(elapsed * 0.15) * 0.1;

      // Orbiting Rings
      ring1.rotation.z = elapsed * 0.4;
      ring2.rotation.z = -elapsed * 0.35;

      // Orbiting Instanced Satellite Nodes
      for (let i = 0; i < nodeCount; i++) {
        const basePos = nodePositions[i];
        const theta = (i / nodeCount) * Math.PI * 2 + (elapsed * 0.3);
        const radius = 2.1 + (i % 3) * 0.4;
        
        dummy.position.set(
          Math.cos(theta) * radius,
          basePos.y + Math.sin(elapsed * 1.5 + i) * 0.12,
          Math.sin(theta) * radius
        );
        dummy.rotation.x = elapsed + i;
        dummy.rotation.y = elapsed * 0.5;
        dummy.updateMatrix();
        instancedNodes.setMatrixAt(i, dummy.matrix);
      }
      instancedNodes.instanceMatrix.needsUpdate = true;

      // Subtle vertical bobbing of master group
      masterGroup.position.y = Math.sin(elapsed * 0.8) * 0.08;

      renderer.render(scene, camera);
    };

    render();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      // Dispose Three.js objects
      coreGeometry.dispose();
      coreMaterial.dispose();
      wireframeGeometry.dispose();
      wireframeMaterial.dispose();
      ring1Geo.dispose();
      ring2Geo.dispose();
      ringMaterial.dispose();
      nodeGeo.dispose();
      nodeMat.dispose();
      instancedNodes.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      renderer.dispose();

      if (mount && renderer.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [scrollY]);

  // Compute smooth continuous dual-axis parallax values
  // No PPT snap: as the user scrolls, values shift continuously
  const progress = Math.min(1, scrollY / 800);
  const horizontalShiftLeft = Math.max(-60, -progress * 60);
  const horizontalShiftRight = Math.min(60, progress * 60);
  const horizontalTrackOffset = -progress * 240; // horizontal continuous conveyor translation

  return (
    <div 
      ref={containerRef}
      className="relative w-full bg-[#09090b] text-[#f4f4f5] overflow-hidden selection:bg-neutral-800 selection:text-white"
    >
      {/* 1. WebGL Three.js Spatial Background Canvas */}
      <div 
        ref={canvasMountRef} 
        className="absolute inset-0 z-0 pointer-events-none opacity-90 transition-opacity duration-1000"
      />

      {/* 2. Monochromatic Ambient Vignette & Grain Micro-Overlay */}
      <div 
        className="absolute inset-0 z-1 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(9,9,11,0.1)_0%,rgba(9,9,11,0.85)_100%)]"
      />
      <div 
        className="absolute inset-0 z-1 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />

      {/* 3. Hero Layer (Foreground Parallax: Speed 1.0) */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-36 pb-20">
        
        {/* Monochromatic Status Pill Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-white/15 bg-white/[0.04] backdrop-blur-md text-[11px] font-mono tracking-widest uppercase text-neutral-300 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            <span className="text-white font-bold">{companyName}</span>
            <span className="w-px h-3 bg-white/20" />
            <span className="text-neutral-400">THREE.JS MONOCHROMATIC ENGINE</span>
            <span className="w-px h-3 bg-white/20" />
            <span className="text-neutral-400">{LATEST_VERSION}</span>
          </div>
        </div>

        {/* Hero Title with Monochromatic Architectural Typography */}
        <div 
          className="text-center max-w-4xl mx-auto transition-transform duration-100 ease-out"
          style={{
            transform: `translateY(${-progress * 40}px)`,
            opacity: Math.max(0.2, 1 - progress * 1.2)
          }}
        >
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08] mb-6">
            {content.heroTitle || (language === 'bn' 
              ? 'পরম নির্ভুলতায় ব্যবসা পরিচালনা করুন' 
              : 'Precision Architecture for Enterprise Commerce'
            )}
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-neutral-400 max-w-2xl mx-auto mb-10 font-normal leading-relaxed">
            {content.heroSubtitle || (language === 'bn'
              ? 'ডাবল-এন্ট্রি অ্যাকাউন্টিং, মাল্টি-গোডাউন স্টক এবং এআই অ্যানালিটিক্সের হাই-পারফরম্যান্স প্ল্যাটফর্ম।'
              : 'Zero-latency double-entry bookkeeping, real-time inventory reconciliation, and boardroom financial intelligence.'
            )}
          </p>

          {/* Primary Monochromatic Call-To-Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={user ? "/dashboard" : "/login"}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white text-black font-bold text-sm tracking-wide hover:bg-neutral-200 transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
            >
              <span>{user ? (language === 'bn' ? 'ড্যাশবোর্ডে প্রবেশ করুন' : 'Enter Dashboard') : (content.heroCtaPrimary || (language === 'bn' ? 'ফ্রি ট্রায়াল শুরু করুন' : 'Get Started Now'))}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </Link>

            <button
              onClick={() => onOpenDemoModal ? onOpenDemoModal() : null}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl border border-white/20 bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-md text-white font-semibold text-sm tracking-wide transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Cpu className="w-4 h-4 text-neutral-300" />
              <span>{language === 'bn' ? 'এক্সপেরিয়েন্স হাব (ডেমো)' : 'Experience Hub (Demo)'}</span>
            </button>
          </div>
        </div>

        {/* 4. Dual-Axis Continuous Parallax Floating Cards (Vertical & Horizontal Glide) */}
        <div className="mt-16 sm:mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          
          {/* Left Parallax Card (Glides in from Left as you scroll) */}
          <div 
            className="p-6 rounded-2xl border border-white/10 bg-[#121214]/80 backdrop-blur-md transition-all duration-200 ease-out flex flex-col justify-between shadow-xl"
            style={{
              transform: `translate(${horizontalShiftLeft}px, ${-progress * 25}px)`
            }}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono tracking-wider uppercase px-2.5 py-1 rounded bg-white/5 border border-white/10 text-neutral-300">
                  REAL-TIME LEDGER
                </span>
                <span className="text-[10px] font-mono text-neutral-500">LIVE FEED</span>
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                {language === 'bn' ? 'স্বয়ংক্রিয় ব্যালেন্স রিকনসিলিয়েশন' : 'Instant Balance Truth'}
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {language === 'bn' 
                  ? 'প্রতিটি ভাউচার এন্ট্রির সাথে সাথে অ্যাকাউন্টস লেজার ও গ্রাহক দেনা-পাওনা শতভাগ নিখুঁতভাবে আপগ্রেড হয়।'
                  : 'Zero deep scans on routine entries. Balances update atomically with deterministic Dr/Cr balance verification.'
                }
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between font-mono text-xs">
              <span className="text-neutral-400">Dr/Cr Equilibrium</span>
              <span className="text-white font-bold">100.00%</span>
            </div>
          </div>

          {/* Center Monolithic Focal Card */}
          <div 
            className="p-6 rounded-2xl border border-white/20 bg-[#18181b]/90 backdrop-blur-md transition-all duration-200 ease-out flex flex-col justify-between shadow-2xl relative overflow-hidden"
            style={{
              transform: `scale(${1 + progress * 0.04}) translateY(${-progress * 15}px)`
            }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.04] rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono tracking-wider uppercase px-2.5 py-1 rounded bg-white text-black font-extrabold">
                  ENTERPRISE HUB
                </span>
                <span className="text-[10px] font-mono text-neutral-400">STATUS: ACTIVE</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {language === 'bn' ? 'সেন্ট্রালাইজড কমান্ড ড্যাশবোর্ড' : 'Centralized Command Grid'}
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                {language === 'bn'
                  ? 'সেলস, পারচেজ, ক্যাশ-ফ্লো, এবং স্টক ইনফ্লোর রিয়েল-টাইম এক্সিকিউটিভ ভিউ একক উইন্ডোতে।'
                  : 'Holistic operational clarity with instant voucher audit trails, WhatsApp/Email dispatches, and export vaults.'
                }
              </p>
            </div>

            {/* Quick Metrics Monochromatic Row */}
            <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-2 gap-3 font-mono">
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                <span className="text-[9px] text-neutral-400 block uppercase">Query Speed</span>
                <span className="text-xs font-bold text-white">&lt; 12ms</span>
              </div>
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                <span className="text-[9px] text-neutral-400 block uppercase">Quota Read Buffer</span>
                <span className="text-xs font-bold text-white">10s Debounced</span>
              </div>
            </div>
          </div>

          {/* Right Parallax Card (Glides in from Right as you scroll) */}
          <div 
            className="p-6 rounded-2xl border border-white/10 bg-[#121214]/80 backdrop-blur-md transition-all duration-200 ease-out flex flex-col justify-between shadow-xl"
            style={{
              transform: `translate(${horizontalShiftRight}px, ${-progress * 25}px)`
            }}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono tracking-wider uppercase px-2.5 py-1 rounded bg-white/5 border border-white/10 text-neutral-300">
                  SECURITY & AUDIT
                </span>
                <span className="text-[10px] font-mono text-neutral-500">AES-256</span>
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                {language === 'bn' ? 'নিরবচ্ছিন্ন ব্যাকআপ ও অডিট ট্রেইল' : 'Continuous Integrity Vault'}
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {language === 'bn'
                  ? 'প্রত্যেকটি লেনদেনের সংশোধন ইতিহাস, ব্যবহারকারী রোল ও ক্যাশ মেমোরি ফেইল-সেফ সুরক্ষা।'
                  : 'Role-based access controls, granular permissions matrix, and complete historical ledger immutability.'
                }
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between font-mono text-xs">
              <span className="text-neutral-400">System State</span>
              <span className="text-white font-bold">ALL GREEN</span>
            </div>
          </div>

        </div>

        {/* 5. Continuous Horizontal Parallax Module Conveyor (Horizontally glides on vertical mouse scroll) */}
        <div className="mt-20 pt-10 border-t border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-400 block mb-1">
                PARALLAX CONVEYOR // HORIZONTAL FLUID AXIS
              </span>
              <h3 className="text-lg font-bold text-white">
                {language === 'bn' ? 'সিস্টেম মডিউলস আর্কিটেকচার' : 'System Architecture Pipeline'}
              </h3>
            </div>
            <span className="text-xs font-mono text-neutral-500">
              Scroll page to glide through layers • {Math.round(progress * 100)}% Depth
            </span>
          </div>

          {/* Smooth Horizontal Track */}
          <div className="overflow-hidden py-3">
            <div 
              className="flex gap-4 transition-transform duration-150 ease-out"
              style={{
                transform: `translateX(${horizontalTrackOffset}px)`
              }}
            >
              {enterpriseModules.map((mod, idx) => (
                <div
                  key={mod.id}
                  onClick={() => setActiveModuleIndex(idx)}
                  className={cn(
                    "min-w-[280px] sm:min-w-[340px] p-5 rounded-xl border cursor-pointer transition-all duration-300 shrink-0",
                    activeModuleIndex === idx
                      ? "bg-white text-black border-white shadow-xl scale-[1.02]"
                      : "bg-[#121214] text-white border-white/10 hover:border-white/30"
                  )}
                >
                  <div className="flex items-center justify-between mb-3 text-[10px] font-mono tracking-wider uppercase">
                    <span className={activeModuleIndex === idx ? "font-bold text-neutral-800" : "text-neutral-400"}>
                      {mod.tag}
                    </span>
                    <span className={activeModuleIndex === idx ? "text-neutral-600 font-bold" : "text-neutral-500"}>
                      #{idx + 1}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold mb-2">
                    {mod.title}
                  </h4>
                  <p className={cn(
                    "text-xs leading-relaxed mb-4",
                    activeModuleIndex === idx ? "text-neutral-700" : "text-neutral-400"
                  )}>
                    {mod.desc}
                  </p>
                  <div className={cn(
                    "pt-3 border-t flex items-center justify-between text-[11px] font-mono",
                    activeModuleIndex === idx ? "border-black/10" : "border-white/10"
                  )}>
                    <span className="font-bold">{mod.metric}</span>
                    <span className={activeModuleIndex === idx ? "text-neutral-600 font-bold" : "text-neutral-400"}>
                      {mod.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
