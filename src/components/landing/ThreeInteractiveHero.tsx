import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  Compass, 
  BarChart3, 
  Receipt, 
  Lock, 
  ChevronDown, 
  ChevronRight, 
  Database,
  Cpu,
  Layers,
  CheckCircle2,
  Maximize2,
  CircleDot
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { LATEST_VERSION } from '../../data/releaseNotes';

interface ThreeInteractiveHeroProps {
  content: {
    heroTitle?: string;
    heroSubtitle?: string;
    heroCtaPrimary?: string;
    heroCtaSecondary?: string;
    [key: string]: any;
  };
  onOpenDemoModal?: () => void;
}

// Stations for the continuous fluid multi-axis Parallax Scrolling
interface Station {
  id: string;
  name: string;
  code: string;
  xPct: number; // horizontal parallax progression
  yPct: number; // vertical parallax progression
}

const STATIONS: Station[] = [
  { id: 'genesis', name: 'Enterprise Core', code: '01 // GENESIS', xPct: 0, yPct: 0 },
  { id: 'operations', name: 'Operational Matrix', code: '02 // ARCHITECTURE', xPct: 90, yPct: 100 },
  { id: 'intelligence', name: 'Financial Stream', code: '03 // TELEMETRY', xPct: 0, yPct: 200 },
  { id: 'resilience', name: 'Zero-Trust Shield', code: '04 // RESILIENCE', xPct: -90, yPct: 300 },
  { id: 'nexus', name: 'Launch Nexus', code: '05 // ONBOARDING', xPct: 0, yPct: 400 }
];

export const ThreeInteractiveHero: React.FC<ThreeInteractiveHeroProps> = ({
  content,
  onOpenDemoModal
}) => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const mountRef = useRef<HTMLDivElement>(null);

  // Parallax scroll state: target and smoothly damped scroll coordinates
  const [activeStationIndex, setActiveStationIndex] = useState(0);
  const targetScroll = useRef({ x: 0, y: 0 });
  const currentScroll = useRef({ x: 0, y: 0 });
  const [scrollProgress, setScrollProgress] = useState(0);

  // Mouse parallax coordinates for 3D depth
  const mouseCoord = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const [is3DReady, setIs3DReady] = useState(false);

  // Navigate smoothly to a specific station
  const goToStation = useCallback((index: number) => {
    const station = STATIONS[index];
    if (!station) return;
    targetScroll.current.x = station.xPct;
    targetScroll.current.y = station.yPct;
    setActiveStationIndex(index);
  }, []);

  // Continuous fluid Parallax Scroll Wheel handler (Non-PowerPoint)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const sensitivity = 0.055;
      const currentY = targetScroll.current.y;
      const nextY = Math.max(0, Math.min(400, currentY + e.deltaY * sensitivity));

      // Calculate continuous multi-axis coordinate curve
      let nextX = 0;
      if (nextY <= 100) {
        nextX = (nextY / 100) * 90;
      } else if (nextY <= 200) {
        nextX = 90 - ((nextY - 100) / 100) * 90;
      } else if (nextY <= 300) {
        nextX = -(((nextY - 200) / 100) * 90);
      } else {
        nextX = -90 + ((nextY - 300) / 100) * 90;
      }

      targetScroll.current.y = nextY;
      targetScroll.current.x = nextX;

      const nearestIdx = Math.min(
        STATIONS.length - 1,
        Math.max(0, Math.round(nextY / 100))
      );
      setActiveStationIndex(nearestIdx);
      setScrollProgress(nextY / 400);
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  // Touch swipe support for smooth mobile parallax navigation
  useEffect(() => {
    let startY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };
    const handleTouchMove = (e: TouchEvent) => {
      const deltaY = startY - e.touches[0].clientY;
      startY = e.touches[0].clientY;
      const currentY = targetScroll.current.y;
      const nextY = Math.max(0, Math.min(400, currentY + deltaY * 0.12));
      
      let nextX = 0;
      if (nextY <= 100) nextX = (nextY / 100) * 90;
      else if (nextY <= 200) nextX = 90 - ((nextY - 100) / 100) * 90;
      else if (nextY <= 300) nextX = -(((nextY - 200) / 100) * 90);
      else nextX = -90 + ((nextY - 300) / 100) * 90;

      targetScroll.current.y = nextY;
      targetScroll.current.x = nextX;
      setActiveStationIndex(Math.min(STATIONS.length - 1, Math.max(0, Math.round(nextY / 100))));
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  // Mouse move handler for silky 3D parallax tilt
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const halfW = window.innerWidth / 2;
      const halfH = window.innerHeight / 2;
      mouseCoord.current.targetX = (e.clientX - halfW) / halfW;
      mouseCoord.current.targetY = (e.clientY - halfH) / halfH;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // --------------------------------------------------------------------------
  // THREE.JS PROCEDURAL SCENE (MONOCHROMATIC DESIGN • 100% LIGHTWEIGHT)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let animationFrameId: number;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene, Camera, Renderer (Monochromatic Obsidian & Titanium)
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030712, 0.022);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 24);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // 2. Monochromatic Lighting Rig (Key White Studio Softbox + Platinum Rims)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    keyLight.position.set(12, 18, 14);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x94a3b8, 1.6);
    rimLight.position.set(-14, -12, -8);
    scene.add(rimLight);

    const coreLight = new THREE.PointLight(0xffffff, 3.0, 36);
    coreLight.position.set(0, 0, 0);
    scene.add(coreLight);

    // 3. Composite 3D Enterprise Core (Monochromatic Platinum & Silver Geometry)
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // A. Central Monochromatic Nucleus (Platinum Icosahedron + Wireframe facet)
    const coreGeo = new THREE.IcosahedronGeometry(2.4, 2);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.96,
      roughness: 0.15,
      emissive: 0x0f172a,
      emissiveIntensity: 0.5
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    rootGroup.add(coreMesh);

    const wireGeo = new THREE.IcosahedronGeometry(2.55, 1);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xf8fafc,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    rootGroup.add(wireMesh);

    // B. Orbital Gimbal Rings (Polished Silver / Brushed Chrome)
    const ringMat1 = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.98,
      roughness: 0.12
    });
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.05, 16, 80), ringMat1);
    ring1.rotation.x = Math.PI / 3;
    rootGroup.add(ring1);

    const ringMat2 = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.95,
      roughness: 0.2
    });
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(5.4, 0.045, 16, 80), ringMat2);
    ring2.rotation.y = Math.PI / 4;
    ring2.rotation.z = Math.PI / 6;
    rootGroup.add(ring2);

    const ringMat3 = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.92,
      roughness: 0.25
    });
    const ring3 = new THREE.Mesh(new THREE.TorusGeometry(6.6, 0.04, 16, 80), ringMat3);
    ring3.rotation.x = -Math.PI / 4;
    ring3.rotation.y = -Math.PI / 3;
    rootGroup.add(ring3);

    // C. Floating Titanium Data Nodes & Neural Segments
    const nodeCount = 12;
    const nodeGroup = new THREE.Group();
    rootGroup.add(nodeGroup);

    const nodeGeo = new THREE.SphereGeometry(0.26, 16, 16);
    const nodeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x64748b,
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.9
    });

    const nodesData: { mesh: THREE.Mesh; angle: number; radius: number; speed: number; yOffset: number }[] = [];
    const linePositions = new Float32Array(nodeCount * 6);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xe2e8f0,
      transparent: true,
      opacity: 0.28
    });
    const connectionLines = new THREE.LineSegments(lineGeo, lineMat);
    rootGroup.add(connectionLines);

    for (let i = 0; i < nodeCount; i++) {
      const mesh = new THREE.Mesh(nodeGeo, nodeMat);
      const angle = (i / nodeCount) * Math.PI * 2;
      const radius = 5.2 + (i % 3) * 1.4;
      const yOffset = ((i % 4) - 1.5) * 1.4;
      mesh.position.set(Math.cos(angle) * radius, yOffset, Math.sin(angle) * radius);
      nodeGroup.add(mesh);
      nodesData.push({ mesh, angle, radius, speed: 0.003 + (i % 3) * 0.0015, yOffset });
    }

    // D. Monochromatic Starlight Particle Field (Zero-lag, 420 points)
    const particleCount = 420;
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const radius = 7 + Math.random() * 24;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      particlePositions[i3] = radius * Math.cos(phi) * Math.sin(theta);
      particlePositions[i3 + 1] = radius * Math.sin(phi);
      particlePositions[i3 + 2] = radius * Math.cos(phi) * Math.cos(theta);
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.15,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // E. Monochromatic Floor Horizon Grid
    const gridHelper = new THREE.GridHelper(80, 50, 0x475569, 0x0f172a);
    gridHelper.position.y = -8;
    scene.add(gridHelper);

    // 4. Pre-compile shaders for instant zero-stutter rendering
    renderer.compile(scene, camera);
    setIs3DReady(true);

    // 5. Animation Loop with smooth exponential damping
    let lastTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Mouse damping
      mouseCoord.current.x = THREE.MathUtils.damp(mouseCoord.current.x, mouseCoord.current.targetX, 4.5, delta);
      mouseCoord.current.y = THREE.MathUtils.damp(mouseCoord.current.y, mouseCoord.current.targetY, 4.5, delta);

      // Multi-axis scroll damping
      currentScroll.current.x = THREE.MathUtils.damp(currentScroll.current.x, targetScroll.current.x, 5.0, delta);
      currentScroll.current.y = THREE.MathUtils.damp(currentScroll.current.y, targetScroll.current.y, 5.0, delta);

      // Core rotation
      coreMesh.rotation.y += 0.35 * delta;
      coreMesh.rotation.x += 0.2 * delta;
      wireMesh.rotation.y -= 0.25 * delta;
      ring1.rotation.z += 0.55 * delta;
      ring2.rotation.x += 0.45 * delta;
      ring3.rotation.y -= 0.4 * delta;

      // Satellites & neural lines
      const positions = lineGeo.attributes.position.array as Float32Array;
      nodesData.forEach((node, idx) => {
        node.angle += node.speed;
        const nx = Math.cos(node.angle) * node.radius;
        const nz = Math.sin(node.angle) * node.radius;
        const ny = node.yOffset + Math.sin(node.angle * 2) * 0.5;
        node.mesh.position.set(nx, ny, nz);

        const pIdx = idx * 6;
        positions[pIdx] = 0;
        positions[pIdx + 1] = 0;
        positions[pIdx + 2] = 0;
        positions[pIdx + 3] = nx;
        positions[pIdx + 4] = ny;
        positions[pIdx + 5] = nz;
      });
      lineGeo.attributes.position.needsUpdate = true;

      // Subtle particle swirl
      particleSystem.rotation.y += 0.06 * delta;

      // Dynamic 3D Camera coordinates responding to continuous Parallax Scrolling
      const scrollFactorY = currentScroll.current.y / 100;
      const scrollFactorX = currentScroll.current.x / 100;

      const targetCamX = scrollFactorX * 5.5 + mouseCoord.current.x * 2.2;
      const targetCamY = -scrollFactorY * 4.2 - mouseCoord.current.y * 1.8;
      const targetCamZ = 24 - Math.sin(scrollFactorY * Math.PI * 0.5) * 3.5;

      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamX, 4.0, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamY, 4.0, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamZ, 4.0, delta);

      camera.lookAt(scrollFactorX * 1.8, -scrollFactorY * 2.2, 0);
      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth || window.innerWidth;
      const newH = container.clientHeight || window.innerHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);

      coreGeo.dispose();
      coreMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      ringMat1.dispose();
      ringMat2.dispose();
      ringMat3.dispose();
      nodeGeo.dispose();
      nodeMat.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      gridHelper.dispose();
      renderer.dispose();

      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#030712] text-white selection:bg-white/20 selection:text-white">
      
      {/* 1. THREE.JS PROCEDURAL MONOCHROMATIC CANVAS */}
      <div 
        ref={mountRef} 
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ opacity: is3DReady ? 1 : 0, transition: 'opacity 0.6s ease-in' }}
      />

      {/* Monochromatic Atmospheric Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(3,7,18,0.7)_70%,rgba(3,7,18,0.96)_100%)] z-1" />

      {/* 2. CONTINUOUS FLUID MULTI-AXIS PARALLAX TRACK */}
      <div 
        className="relative z-10 w-full h-full will-change-transform"
        style={{
          transform: `translate3d(${-currentScroll.current.x}vw, ${-currentScroll.current.y}vh, 0)`,
          transition: 'transform 0.08s linear'
        }}
      >

        {/* ------------------------------------------------------------- */}
        {/* STATION 1: GENESIS / ENTERPRISE CORE (X: 0vw, Y: 0vh)         */}
        {/* ------------------------------------------------------------- */}
        <section className="absolute top-0 left-0 w-screen h-screen flex flex-col justify-between p-6 sm:p-12 lg:p-16">
          <div className="max-w-4xl pt-16 sm:pt-20 space-y-6">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-white/20 bg-white/[0.04] backdrop-blur-md text-[11px] font-mono tracking-widest text-slate-200">
              <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              <span>MONOCHROME 3D SPATIAL ARCHITECTURE</span>
              <span className="px-1.5 py-0.5 rounded bg-white/10 text-white text-[9px] font-bold">
                {LATEST_VERSION || 'v1.9.8'}
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] text-white">
              {content.heroTitle || (language === 'bn' ? 'বুদ্ধিমত্তার সাথে আপনার ব্যবসা পরিচালনা করুন' : 'Manage Your Business With Pure Intelligence')}
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-slate-300/90 max-w-2xl font-normal leading-relaxed">
              {content.heroSubtitle || (language === 'bn' 
                ? 'রিয়েল-টাইম ডাবল-এন্ট্রি অ্যাকাউন্টিং, অটো-সিরিয়াল ভাউচার ইঞ্জিন ও মাল্টি-গোডাউন ইনভেন্টরি সহ আধুনিক ক্লাউড ইআরপি।' 
                : 'High-precision cloud ERP with real-time double-entry accounting, zero-deep-scan speed, and spatial business intelligence.')}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link
                to={user ? "/dashboard" : "/login"}
                className="px-7 py-3.5 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-white/10 transition-all flex items-center gap-2.5 active:scale-95"
              >
                <span>{user ? (language === 'bn' ? 'ড্যাশবোর্ডে প্রবেশ করুন' : 'Enter Dashboard') : (content.heroCtaPrimary || t('home.startTrial'))}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {onOpenDemoModal && (
                <button
                  onClick={onOpenDemoModal}
                  className="px-6 py-3.5 rounded-xl border border-white/20 hover:border-white/40 bg-white/[0.04] hover:bg-white/[0.08] text-white text-sm font-semibold tracking-wide transition-all backdrop-blur-md flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-slate-300" />
                  <span>{language === 'bn' ? 'এক্সপেরিয়েন্স হাব (ডেমো)' : 'Experience Hub (Demo)'}</span>
                </button>
              )}

              <Link
                to="/pricing"
                className="px-5 py-3.5 text-xs text-slate-400 hover:text-white font-mono uppercase tracking-widest transition-colors flex items-center gap-1.5"
              >
                <span>View Pricing Models</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Quick Monochromatic Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl border-t border-white/10 pt-4 font-mono">
            <div>
              <div className="text-xl sm:text-2xl font-black text-white">99.98%</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Cloud Uptime SLA</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-200">0.02s</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Voucher Query Speed</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-300">100%</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Double-Entry Audit</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-400">Zero-Scan</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Quota Architecture</div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* STATION 2: OPERATIONAL MATRIX (X: +90vw, Y: +100vh)           */}
        {/* ------------------------------------------------------------- */}
        <section className="absolute top-[100vh] left-[90vw] w-screen h-screen flex items-center p-6 sm:p-12 lg:p-16">
          <div className="max-w-5xl space-y-8 bg-slate-950/80 border border-white/15 p-8 sm:p-12 rounded-3xl backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-2 text-slate-300 text-xs font-mono uppercase tracking-widest">
              <Layers className="w-4 h-4 text-white" />
              <span>Operational Matrix • Coordinate [+90X, +100Y]</span>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                {language === 'bn' ? 'স্মার্ট ভাউচার ও ডাবল-এন্ট্রি কোর' : 'Intelligent Vouchers & Double-Entry Core'}
              </h2>
              <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
                {language === 'bn'
                  ? 'সেলস, পারচেজ, ক্যাশ রিসিট, ব্যাংক পেমেন্ট ও জার্নাল এন্ট্রিগুলো স্বয়ংক্রিয়ভাবে ইনডেক্স হয়। একই তারিখে সেলস/পারচেজ পূর্বে এবং রিসিট/পেমেন্ট পরবর্তীতে সাজিয়ে নিখুঁত খতিয়ান প্রস্তুত থাকে।'
                  : 'Sales, Purchases, Receipts, and Payments synchronize atomically with strict date-priority sorting, running balance verification, and instant voucher serial tracking.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/30 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center mb-3">
                  <Receipt className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Dynamic Auto-Serials</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Dedicated counter doc authority ensures unique sequential numbering with zero deep scans.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/30 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center mb-3">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Pre-Aggregated Balances</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Instant O(1) balance lookups without scanning thousands of ledger documents, preserving quota.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/30 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center mb-3">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Stock Movement Engine</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Physical stock reconciliation, multi-godown allocation, and batch-expiry tracking in real time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* STATION 3: FINANCIAL STREAM (X: 0vw, Y: +200vh)               */}
        {/* ------------------------------------------------------------- */}
        <section className="absolute top-[200vh] left-0 w-screen h-screen flex items-center justify-end p-6 sm:p-12 lg:p-16">
          <div className="max-w-5xl w-full space-y-8 bg-slate-950/80 border border-white/15 p-8 sm:p-12 rounded-3xl backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-2 text-slate-300 text-xs font-mono uppercase tracking-widest">
              <BarChart3 className="w-4 h-4 text-white" />
              <span>Financial Intelligence • Coordinate [0X, +200Y]</span>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                {language === 'bn' ? 'রিয়েল-টাইম ব্যালেন্স শীট ও পি&এল' : 'Live Balance Sheet, P&L & Cash Flow'}
              </h2>
              <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
                {language === 'bn'
                  ? 'প্রতিটি ভাউচার পোস্ট করার সাথে সাথে স্বয়ংক্রিয়ভাবে ট্রায়াল ব্যালেন্স, লাভ-ক্ষতি হিসাব ও ব্যালেন্স শীট আপডেট হয়। কোনো ম্যানুয়াল রিক্যালকুলেশনের প্রয়োজন নেই।'
                  : 'Continuous financial audit streams generate accurate point-in-time statements with strict period discipline and Microsoft Word style cell alignment standard.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                <span className="text-xs font-mono text-slate-400 block mb-1">01 / AUDIT</span>
                <h4 className="text-sm font-bold text-white">Trial Balance</h4>
                <p className="text-xs text-slate-400 mt-1">Multi-tier grouping with debit/credit balance truth.</p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                <span className="text-xs font-mono text-slate-300 block mb-1">02 / PROFIT</span>
                <h4 className="text-sm font-bold text-white">Profit & Loss</h4>
                <p className="text-xs text-slate-400 mt-1">Gross profit, operating costs, and net margin calculation.</p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                <span className="text-xs font-mono text-slate-200 block mb-1">03 / ASSETS</span>
                <h4 className="text-sm font-bold text-white">Balance Sheet</h4>
                <p className="text-xs text-slate-400 mt-1">Assets, liabilities, equity, and closing stock valuation.</p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                <span className="text-xs font-mono text-white block mb-1">04 / FLOW</span>
                <h4 className="text-sm font-bold text-white">Daybook & Register</h4>
                <p className="text-xs text-slate-400 mt-1">Single-click PDF and print layouts with header pinning.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* STATION 4: ZERO-TRUST SHIELD (X: -90vw, Y: +300vh)            */}
        {/* ------------------------------------------------------------- */}
        <section className="absolute top-[300vh] left-[-90vw] w-screen h-screen flex items-center p-6 sm:p-12 lg:p-16">
          <div className="max-w-5xl space-y-8 bg-slate-950/80 border border-white/15 p-8 sm:p-12 rounded-3xl backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-2 text-slate-300 text-xs font-mono uppercase tracking-widest">
              <Lock className="w-4 h-4 text-white" />
              <span>Enterprise Resilience • Coordinate [-90X, +300Y]</span>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                {language === 'bn' ? 'অফলাইন-ফার্স্ট ক্যাশ ও কোটা প্রটেকশন' : 'Quota Armor & Offline-First Security'}
              </h2>
              <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
                {language === 'bn'
                  ? 'মেমোরি ও লোকালস্টোরেজ বাফার টেকনোলজি ব্যবহারের মাধ্যমে ফায়ারবেস রিড কোটা ৯০% পর্যন্ত হ্রাস পায়। ইন্টারনেট সাময়িক বিচ্ছিন্ন হলেও লোকাল ক্যাশ থেকে নির্বিঘ্নে কাজ করা যায়।'
                  : 'Client-side quota buffering throttles database calls, while 30-minute master cache retention guarantees blazing performance even on free-tier infrastructure.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
                <div className="flex items-center gap-2 text-white text-sm font-bold mb-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Role-Based Access (RBAC)</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Granular permission control across Admins, Accounts, Sales, Inventory, and Marketing Managers.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
                <div className="flex items-center gap-2 text-white text-sm font-bold mb-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Immutable Audit Trail</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Full historical logging for creation, modification, and deletion events with timestamp authority.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
                <div className="flex items-center gap-2 text-white text-sm font-bold mb-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Founder Multi-Tenant Panel</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Centralized organization management, subscription tiers, company limits, and design controls.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* STATION 5: LAUNCH NEXUS (X: 0vw, Y: +400vh)                   */}
        {/* ------------------------------------------------------------- */}
        <section className="absolute top-[400vh] left-0 w-screen h-screen flex flex-col items-center justify-center p-6 sm:p-12 text-center">
          <div className="max-w-3xl space-y-6 bg-slate-950/85 border border-white/20 p-10 sm:p-14 rounded-3xl backdrop-blur-2xl shadow-2xl shadow-black/80">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 text-white flex items-center justify-center mx-auto shadow-inner">
              <Zap className="w-7 h-7" />
            </div>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              {content.ctaTitle || (language === 'bn' ? 'আজই আপনার এন্টারপ্রাইজ যাত্রা শুরু করুন' : 'Elevate Your Business Operations Today')}
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
              {content.ctaSubtitle || (language === 'bn' 
                ? 'ক্লাউড অ্যাকাউন্টিং ও ইনভেন্টরির সম্পূর্ণ সক্ষমতা উপভোগ করুন। কোনো ক্রেডিট কার্ডের প্রয়োজন নেই।' 
                : 'Experience zero-lag financial engineering with full multi-godown control and real-time auditability.')}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                to={user ? "/dashboard" : "/register"}
                className="px-8 py-4 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-black text-sm tracking-wide shadow-2xl shadow-white/20 transition-all flex items-center gap-2 active:scale-95"
              >
                <span>{user ? 'Go to Dashboard' : (content.ctaButton || t('home.getStarted'))}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                onClick={() => goToStation(0)}
                className="px-6 py-4 rounded-xl border border-white/20 hover:border-white/40 bg-white/[0.04] text-slate-300 text-sm font-semibold tracking-wide transition-all"
              >
                Back to Top (Genesis)
              </button>
            </div>
          </div>
        </section>

      </div>

      {/* 3. SLEEK MONOCHROMATIC HUD (COMPLIANT WITH THREE.JS SKILL DIRECTIVES) */}
      
      {/* Top Coordinate Badge */}
      <div className="absolute top-6 left-6 z-30 hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-white/15 bg-slate-950/70 backdrop-blur-md font-mono text-[11px] text-slate-300">
        <Compass className="w-3.5 h-3.5 text-white animate-spin" style={{ animationDuration: '24s' }} />
        <span>SPATIAL VECTOR:</span>
        <span className="text-white font-bold">
          [X: {Math.round(currentScroll.current.x)}% | Y: {Math.round(currentScroll.current.y)}%]
        </span>
      </div>

      {/* Right-Side Parallax Station Pager */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-3">
        {STATIONS.map((station, idx) => (
          <button
            key={station.id}
            onClick={() => goToStation(idx)}
            className="group flex items-center gap-3 text-right focus:outline-none"
            title={station.name}
          >
            <span className={cn(
              "hidden md:block text-[10px] font-mono tracking-wider transition-all duration-300 opacity-0 group-hover:opacity-100 uppercase",
              activeStationIndex === idx ? "text-white opacity-100 font-bold" : "text-slate-400"
            )}>
              {station.name}
            </span>
            <div className={cn(
              "w-2.5 h-2.5 rounded-full border transition-all duration-300",
              activeStationIndex === idx 
                ? "bg-white border-white scale-125 shadow-md shadow-white/60" 
                : "bg-slate-900 border-slate-700 group-hover:border-slate-400"
            )} />
          </button>
        ))}
      </div>

      {/* Bottom Floating Spatial Bar (Scroll Guide & Stations) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-white/15 bg-slate-950/85 backdrop-blur-xl shadow-2xl max-w-[94vw]">
        <div className="flex items-center gap-2 pr-3 border-r border-white/15 text-[11px] font-mono text-slate-400">
          <CircleDot className="w-3 h-3 text-white" />
          <span className="hidden sm:inline">PARALLAX SCROLL:</span>
          <span className="text-white font-bold">{STATIONS[activeStationIndex].code}</span>
        </div>

        <div className="flex items-center gap-1">
          {STATIONS.map((station, idx) => (
            <button
              key={station.id}
              onClick={() => goToStation(idx)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all",
                activeStationIndex === idx
                  ? "bg-white text-slate-950 shadow-xs"
                  : "text-slate-400 hover:text-white hover:bg-white/10"
              )}
            >
              0{idx + 1}
            </button>
          ))}
        </div>

        <div className="pl-2 border-l border-white/15 flex items-center gap-1 text-[11px] text-slate-400">
          <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
        </div>
      </div>

    </div>
  );
};
