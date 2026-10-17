import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Sparkles, 
  Activity, 
  Box, 
  Compass, 
  TrendingUp, 
  ChevronRight, 
  ChevronDown,
  Layers,
  Database,
  Lock,
  Cpu
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { LATEST_VERSION } from '../../data/releaseNotes';

interface ThreeMatrixHeroProps {
  content: {
    heroTitle?: string;
    heroSubtitle?: string;
    heroCtaPrimary?: string;
    heroCtaSecondary?: string;
    [key: string]: any;
  };
  onOpenDemoModal?: () => void;
}

interface MatrixStation {
  id: string;
  label: string;
  xPct: number;
  yPct: number;
}

const MATRIX_STATIONS: MatrixStation[] = [
  { id: 'nexus', label: '01 • Quantum Grid', xPct: 0, yPct: 0 },
  { id: 'ledger-flow', label: '02 • Ledger Flow', xPct: 80, yPct: 100 },
  { id: 'analytics', label: '03 • BI Telemetry', xPct: 0, yPct: 200 },
  { id: 'security', label: '04 • Zero-Trust Cloud', xPct: -80, yPct: 300 },
  { id: 'action', label: '05 • Launch Nexus', xPct: 0, yPct: 400 }
];

export const ThreeMatrixHero: React.FC<ThreeMatrixHeroProps> = ({
  content,
  onOpenDemoModal
}) => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const canvasRef = useRef<HTMLDivElement>(null);

  const [activeIdx, setActiveIdx] = useState(0);
  const targetScroll = useRef({ x: 0, y: 0 });
  const currentScroll = useRef({ x: 0, y: 0 });
  const mouse = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const [ready, setReady] = useState(false);

  const goToStation = useCallback((idx: number) => {
    const s = MATRIX_STATIONS[idx];
    if (!s) return;
    targetScroll.current.x = s.xPct;
    targetScroll.current.y = s.yPct;
    setActiveIdx(idx);
  }, []);

  // Smooth wheel listener
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const sensitivity = 0.05;
      const currentY = targetScroll.current.y;
      const nextY = Math.max(0, Math.min(400, currentY + e.deltaY * sensitivity));
      
      let nextX = 0;
      if (nextY <= 100) nextX = (nextY / 100) * 80;
      else if (nextY <= 200) nextX = 80 - ((nextY - 100) / 100) * 80;
      else if (nextY <= 300) nextX = -(((nextY - 200) / 100) * 80);
      else nextX = -80 + ((nextY - 300) / 100) * 80;

      targetScroll.current.y = nextY;
      targetScroll.current.x = nextX;

      const nearest = Math.min(MATRIX_STATIONS.length - 1, Math.max(0, Math.round(nextY / 100)));
      setActiveIdx(nearest);
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  // Cursor parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const halfW = window.innerWidth / 2;
      const halfH = window.innerHeight / 2;
      mouse.current.targetX = (e.clientX - halfW) / halfW;
      mouse.current.targetY = (e.clientY - halfH) / halfH;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Three.js Procedural Matrix & Kinetic Wave
  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;

    let animId: number;
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030712, 0.025);

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    camera.position.set(0, 5, 22);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0x0f172a, 2.0);
    scene.add(ambient);

    const dirLight1 = new THREE.DirectionalLight(0x10b981, 2.2);
    dirLight1.position.set(10, 20, 10);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x06b6d4, 1.8);
    dirLight2.position.set(-10, -10, -5);
    scene.add(dirLight2);

    // 1. Kinetic Wave Plane (Grid of points undulating as financial flow)
    const gridX = 40;
    const gridY = 40;
    const pointCount = gridX * gridY;
    const wavePositions = new Float32Array(pointCount * 3);

    for (let ix = 0; ix < gridX; ix++) {
      for (let iy = 0; iy < gridY; iy++) {
        const idx = (ix * gridY + iy) * 3;
        wavePositions[idx] = (ix - gridX / 2) * 1.2;
        wavePositions[idx + 1] = -5;
        wavePositions[idx + 2] = (iy - gridY / 2) * 1.2;
      }
    }

    const waveGeo = new THREE.BufferGeometry();
    waveGeo.setAttribute('position', new THREE.BufferAttribute(wavePositions, 3));
    const waveMat = new THREE.PointsMaterial({
      color: 0x10b981,
      size: 0.14,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    const wavePoints = new THREE.Points(waveGeo, waveMat);
    scene.add(wavePoints);

    // 2. Floating Procedural Isometric Cubes (Business Intelligence nodes)
    const cubeGroup = new THREE.Group();
    scene.add(cubeGroup);

    const cubeGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const cubeEdgesGeo = new THREE.EdgesGeometry(cubeGeo);
    const cubeMat = new THREE.MeshStandardMaterial({
      color: 0x065f46,
      metalness: 0.85,
      roughness: 0.2,
      transparent: true,
      opacity: 0.75
    });
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.8 });

    const cubes: { mesh: THREE.Group; baseY: number; speed: number; rotX: number; rotY: number }[] = [];
    const cubeCount = 8;

    for (let i = 0; i < cubeCount; i++) {
      const g = new THREE.Group();
      const m = new THREE.Mesh(cubeGeo, cubeMat);
      const e = new THREE.LineSegments(cubeEdgesGeo, edgeMat);
      g.add(m);
      g.add(e);

      const rad = 6.5 + (i % 3) * 1.8;
      const angle = (i / cubeCount) * Math.PI * 2;
      const x = Math.cos(angle) * rad;
      const z = Math.sin(angle) * rad;
      const y = ((i % 3) - 1) * 2;

      g.position.set(x, y, z);
      cubeGroup.add(g);
      cubes.push({
        mesh: g,
        baseY: y,
        speed: 0.001 + (i % 2) * 0.001,
        rotX: 0.01 + Math.random() * 0.02,
        rotY: 0.015 + Math.random() * 0.02
      });
    }

    setReady(true);

    let lastT = performance.now();
    let waveOffset = 0;

    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop);
      const now = performance.now();
      const dt = Math.min((now - lastT) / 1000, 0.1);
      lastT = now;

      // Mouse damping
      mouse.current.x = THREE.MathUtils.damp(mouse.current.x, mouse.current.targetX, 4, dt);
      mouse.current.y = THREE.MathUtils.damp(mouse.current.y, mouse.current.targetY, 4, dt);

      // Scroll damping
      currentScroll.current.x = THREE.MathUtils.damp(currentScroll.current.x, targetScroll.current.x, 5, dt);
      currentScroll.current.y = THREE.MathUtils.damp(currentScroll.current.y, targetScroll.current.y, 5, dt);

      // Undulate wave points
      waveOffset += 2.0 * dt;
      const pArr = waveGeo.attributes.position.array as Float32Array;
      for (let ix = 0; ix < gridX; ix++) {
        for (let iy = 0; iy < gridY; iy++) {
          const idx = (ix * gridY + iy) * 3;
          pArr[idx + 1] = -5 + Math.sin(ix * 0.3 + waveOffset) * 0.8 + Math.cos(iy * 0.3 + waveOffset) * 0.8;
        }
      }
      waveGeo.attributes.position.needsUpdate = true;

      // Rotate floating blocks
      cubes.forEach(c => {
        c.mesh.rotation.x += c.rotX;
        c.mesh.rotation.y += c.rotY;
        c.mesh.position.y = c.baseY + Math.sin(now * c.speed) * 0.5;
      });
      cubeGroup.rotation.y += 0.15 * dt;

      // Camera coordinates from spatial scroll + mouse parallax
      const sy = currentScroll.current.y / 100;
      const sx = currentScroll.current.x / 100;

      const camTargetX = sx * 7 + mouse.current.x * 2.5;
      const camTargetY = 5 - sy * 4 - mouse.current.y * 2.0;
      const camTargetZ = 22 - Math.sin(sy * Math.PI * 0.5) * 3;

      camera.position.x = THREE.MathUtils.damp(camera.position.x, camTargetX, 4, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, camTargetY, 4, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, camTargetZ, 4, dt);
      camera.lookAt(sx * 2, -sy * 2, 0);

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(renderLoop);

    const onResize = () => {
      if (!container) return;
      const nw = container.clientWidth || window.innerWidth;
      const nh = container.clientHeight || window.innerHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      waveGeo.dispose();
      waveMat.dispose();
      cubeGeo.dispose();
      cubeEdgesGeo.dispose();
      cubeMat.dispose();
      edgeMat.dispose();
      renderer.dispose();
      if (renderer.domElement?.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#030712] text-white selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Three.js Canvas */}
      <div 
        ref={canvasRef} 
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ opacity: ready ? 1 : 0, transition: 'opacity 0.6s ease-in' }}
      />

      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(3,7,18,0.7)_70%,rgba(3,7,18,0.95)_100%)] z-1" />

      {/* Spatial 2D World */}
      <div 
        className="relative z-10 w-full h-full will-change-transform"
        style={{
          transform: `translate3d(${-currentScroll.current.x}vw, ${-currentScroll.current.y}vh, 0)`,
          transition: 'transform 0.08s linear'
        }}
      >
        {/* Station 1: Quantum Grid */}
        <section className="absolute top-0 left-0 w-screen h-screen flex flex-col justify-between p-6 sm:p-12 lg:p-16">
          <div className="max-w-4xl pt-16 sm:pt-20 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 backdrop-blur-md text-[11px] font-mono tracking-widest text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>THREE.JS KINETIC MATRIX • ACTIVE SYSTEM</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                {LATEST_VERSION || 'v1.9.8'}
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] text-white">
              {content.heroTitle || (language === 'bn' ? 'অত্যাধুনিক 3D ক্লাউড ইআরপি সিস্টেম' : 'High-Precision 3D Cloud ERP System')}
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              {content.heroSubtitle || (language === 'bn'
                ? 'রিয়েল-টাইম গতি, কোটা অপটিমাইজেশন এবং নিখুঁত অ্যাকাউন্টস নিয়ে আপনার বিজনেসের জন্য বিশ্বস্ত প্ল্যাটফর্ম।'
                : 'Real-time financial telemetry with sub-millisecond execution and seamless multi-branch synchronization.')}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link
                to={user ? "/dashboard" : "/login"}
                className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2.5 active:scale-95"
              >
                <span>{user ? 'Enter Dashboard' : (content.heroCtaPrimary || t('home.startTrial'))}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {onOpenDemoModal && (
                <button
                  onClick={onOpenDemoModal}
                  className="px-6 py-3.5 rounded-xl border border-slate-700 hover:border-emerald-500/60 bg-slate-900/60 text-slate-200 text-sm font-semibold tracking-wide transition-all backdrop-blur-md flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Interactive Hub</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Station 2: Ledger Flow */}
        <section className="absolute top-[100vh] left-[80vw] w-screen h-screen flex items-center p-6 sm:p-12 lg:p-16">
          <div className="max-w-4xl space-y-6 bg-slate-950/80 border border-emerald-500/30 p-8 sm:p-12 rounded-3xl backdrop-blur-xl">
            <div className="text-emerald-400 text-xs font-mono uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span>Real-Time Transaction Stream</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white">Continuous Ledger Flow</h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Every financial event ripples across journals, inventory balances, and tax books with mathematical zero-difference precision.
            </p>
          </div>
        </section>

        {/* Station 3: BI Telemetry */}
        <section className="absolute top-[200vh] left-0 w-screen h-screen flex items-center justify-end p-6 sm:p-12 lg:p-16">
          <div className="max-w-4xl space-y-6 bg-slate-950/80 border border-teal-500/30 p-8 sm:p-12 rounded-3xl backdrop-blur-xl">
            <div className="text-teal-400 text-xs font-mono uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>Analytics & Metrics</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white">Executive BI Intelligence</h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Instant cash-flow charts, debtors/creditors aging, stock valuation with exact FIFO logic, and period discipline.
            </p>
          </div>
        </section>

        {/* Station 4: Zero-Trust Cloud */}
        <section className="absolute top-[300vh] left-[-80vw] w-screen h-screen flex items-center p-6 sm:p-12 lg:p-16">
          <div className="max-w-4xl space-y-6 bg-slate-950/80 border border-slate-800 p-8 sm:p-12 rounded-3xl backdrop-blur-xl">
            <div className="text-indigo-400 text-xs font-mono uppercase tracking-widest flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span>Enterprise Resilience</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white">Immutable Security & Quota Buffer</h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Protected by multi-tier RBAC permissions, encrypted session tokens, and automated database fail-over.
            </p>
          </div>
        </section>

        {/* Station 5: Launch Nexus */}
        <section className="absolute top-[400vh] left-0 w-screen h-screen flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-2xl space-y-6 bg-slate-950/80 border border-emerald-500/30 p-10 sm:p-14 rounded-3xl backdrop-blur-2xl">
            <h2 className="text-3xl sm:text-5xl font-black text-white">Ready for Pure Efficiency?</h2>
            <p className="text-slate-300 text-sm sm:text-base">
              Step into the high-performance ERP environment built for modern businesses.
            </p>
            <div className="flex justify-center gap-4 pt-4">
              <Link
                to={user ? "/dashboard" : "/register"}
                className="px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm tracking-wide transition-all active:scale-95"
              >
                Get Started Free
              </Link>
              <button
                onClick={() => goToStation(0)}
                className="px-6 py-4 rounded-xl border border-slate-700 bg-slate-900/60 text-slate-300 text-sm font-semibold"
              >
                Back to Top
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Navigation HUD */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur-xl">
        <div className="flex items-center gap-2 pr-3 border-r border-slate-800 text-[11px] font-mono text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>{MATRIX_STATIONS[activeIdx].label}</span>
        </div>
        <div className="flex items-center gap-1">
          {MATRIX_STATIONS.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => goToStation(idx)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all",
                activeIdx === idx
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "text-slate-400 hover:text-white"
              )}
            >
              0{idx + 1}
            </button>
          ))}
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 animate-bounce" />
      </div>
    </div>
  );
};
