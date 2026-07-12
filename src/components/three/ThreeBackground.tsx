"use client";

import { useRef, useMemo, useEffect, memo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { useControls } from "leva";

import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeProvider";
import { use3DInteractive } from "./InteractiveContext";

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════ */

const LEAGUES = [
  { slug: "premier-league", lat: 53.5, lng: -2 },
  { slug: "la-liga", lat: 40, lng: -4 },
  { slug: "bundesliga", lat: 51, lng: 10 },
  { slug: "serie-a", lat: 42, lng: 12 },
  { slug: "ligue-1", lat: 47, lng: 2 },
  { slug: "champions-league", lat: 48, lng: 9 },
  { slug: "fifa-world-cup", lat: 25, lng: 50 },
  { slug: "brasileirao-serie-a", lat: -14, lng: -51 },
];

function latLngToSphere(lat: number, lng: number, r: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return [
    -(r * Math.sin(phi) * Math.cos(theta)),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  ];
}

/* ═══════════════════════════════════════════════════════════════════
   FOOTBALL — Texture-mapped ball from GLB (ThreeJS-Kit-Customizer)
   ═══════════════════════════════════════════════════════════════════ */

useGLTF.preload("/ballLime.glb");

const Football = memo(function Football() {
  const ref = useRef<THREE.Group>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const { nodes, materials } = useGLTF("/ballLime.glb");

  const { pos, rot, scl } = useControls("Football", {
    pos: { value: [0, -0.8, 0], step: 0.1 },
    rot: { value: [0, 0, 0], step: 0.01 },
    scl: { value: 1.2, min: 0.1, max: 5, step: 0.05 },
  });

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.3;
    ref.current.rotation.x += (mouse.current.y * 0.15 - ref.current.rotation.x) * delta * 2;
    ref.current.rotation.z += (-mouse.current.x * 0.15 - ref.current.rotation.z) * delta * 2;
  });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <group ref={ref} dispose={null} scale={scl} position={pos as [number, number, number]} rotation={rot as [number, number, number]}>
      <mesh geometry={(nodes.FootBall as THREE.Mesh).geometry} material={materials.FootBall}>
        <mesh geometry={(nodes.Seams as THREE.Mesh).geometry} material={materials.Seams} />
      </mesh>
    </group>
  );
});

/* ═══════════════════════════════════════════════════════════════════
   GRASS PITCH — Canvas texture with stripes + pitch markings
   ═══════════════════════════════════════════════════════════════════ */

const GrassPitch = memo(function GrassPitch() {
  const { colors } = useTheme();

  const { pos, rot, width, height } = useControls("Pitch", {
    pos: { value: [0, -2.2, 0], step: 0.1 },
    rot: { value: [-Math.PI / 2, 0, 0], step: 0.01 },
    width: { value: 16, min: 5, max: 30, step: 0.1 },
    height: { value: 10.5, min: 3, max: 20, step: 0.1 },
  });

  const tex = useMemo(() => {
    const W = 2048;
    const H = 1365; // 105/68 ratio
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d")!;

    // -- Grass base: alternating stripes --
    const stripeCount = 14;
    const stripeH = H / stripeCount;
    for (let i = 0; i < stripeCount; i++) {
      ctx.fillStyle = i % 2 === 0 ? colors.grass1 : colors.grass2;
      ctx.fillRect(0, i * stripeH, W, stripeH);
    }

    // -- Grass grain noise --
    const imgData = ctx.getImageData(0, 0, W, H);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const b = (Math.random() - 0.5) * 15;
      d[i] = Math.max(0, Math.min(255, d[i] + b));
      d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + b));
      d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + b));
    }
    ctx.putImageData(imgData, 0, 0);

    // -- White lines helper --
    const lw = 6;
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = lw;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const line = (fn: () => void) => { fn(); ctx.stroke(); };
    const fill = (fn: () => void) => { fn(); ctx.fill(); };

    const pad = 40; // padding from edge
    const pW = W - pad * 2;
    const pH = H - pad * 2;

    // Pitch border
    line(() => ctx.strokeRect(pad, pad, pW, pH));

    // Halfway line
    line(() => { ctx.beginPath(); ctx.moveTo(W / 2, pad); ctx.lineTo(W / 2, H - pad); ctx.stroke(); });

    // Center circle (9.15m radius on 105m pitch → 9.15/105 * pW)
    const centerR = (9.15 / 105) * pW;
    line(() => { ctx.beginPath(); ctx.arc(W / 2, H / 2, centerR, 0, Math.PI * 2); ctx.stroke(); });

    // Center spot
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    fill(() => { ctx.beginPath(); ctx.arc(W / 2, H / 2, 6, 0, Math.PI * 2); ctx.fill(); });

    // Penalty areas (16.5m × 40.32m)
    const paW = (16.5 / 105) * pW;
    const paH = (40.32 / 68) * pH;
    const paY = (H - paH) / 2;
    line(() => { ctx.beginPath(); ctx.rect(pad, paY, paW, paH); ctx.stroke(); });
    line(() => { ctx.beginPath(); ctx.rect(W - pad - paW, paY, paW, paH); ctx.stroke(); });

    // Goal areas (5.5m × 18.32m)
    const gaW = (5.5 / 105) * pW;
    const gaH = (18.32 / 68) * pH;
    const gaY = (H - gaH) / 2;
    line(() => { ctx.beginPath(); ctx.rect(pad, gaY, gaW, gaH); ctx.stroke(); });
    line(() => { ctx.beginPath(); ctx.rect(W - pad - gaW, gaY, gaW, gaH); ctx.stroke(); });

    // Penalty spots (11m from goal line)
    const penX1 = pad + (11 / 105) * pW;
    const penX2 = W - pad - (11 / 105) * pW;
    fill(() => { ctx.beginPath(); ctx.arc(penX1, H / 2, 5, 0, Math.PI * 2); ctx.fill(); });
    fill(() => { ctx.beginPath(); ctx.arc(penX2, H / 2, 5, 0, Math.PI * 2); ctx.fill(); });

    // Penalty arcs (outside penalty area, 9.15m radius)
    const arcR = centerR;
    ctx.save();
    ctx.beginPath();
    ctx.rect(pad + paW, pad, pW - paW * 2, pH);
    ctx.clip();
    line(() => { ctx.beginPath(); ctx.arc(penX1, H / 2, arcR, 0, Math.PI * 2); ctx.stroke(); });
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.rect(pad, pad, pW - paW * 2, pH);
    ctx.clip();
    line(() => { ctx.beginPath(); ctx.arc(penX2, H / 2, arcR, 0, Math.PI * 2); ctx.stroke(); });
    ctx.restore();

    // Corner arcs (1m radius → 1/105 * pW)
    const cornerR = (1 / 105) * pW;
    const corners = [
      [pad, pad, 0, Math.PI / 2],
      [W - pad, pad, Math.PI / 2, Math.PI],
      [W - pad, H - pad, Math.PI, Math.PI * 1.5],
      [pad, H - pad, -Math.PI / 2, 0],
    ] as const;
    for (const [cx, cy, a1, a2] of corners) {
      line(() => { ctx.beginPath(); ctx.arc(cx, cy, cornerR, a1, a2); ctx.stroke(); });
    }

    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [colors]); // rebuild on theme change

  return (
    <mesh rotation={rot as [number, number, number]} position={pos as [number, number, number]} receiveShadow>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial map={tex} roughness={0.85} metalness={0} />
    </mesh>
  );
});

/* ═══════════════════════════════════════════════════════════════════
   STADIUM — GLB model (Craven Cottage)
   Scale: model pitch is ~105×68m, target pitch is 16×10.5m → ~0.152
   Model is Z-up (Blender), rotated -90° X to Y-up (Three.js)
   ═══════════════════════════════════════════════════════════════════ */

useGLTF.preload("/stadium.glb");

// Pitch mesh names to hide (model has its own pitch, we use procedural one)
const PITCH_MESH_NAMES = new Set([
  "st081_pitch_0",
  "st081_pitch_1",
  "field_1",
  "field_2",
]);

function Stadium() {
  const { scene } = useGLTF("/stadium.glb");
  const { isDark } = useTheme();

  const { pos, rot, scl } = useControls("Stadium", {
    pos: { value: [0, -2.2, 0], step: 0.1 },
    rot: { value: [-Math.PI / 2, 0, 0], step: 0.01 },
    scl: { value: 0.152, min: 0.01, max: 1, step: 0.001 },
  });

  const stadium = useMemo(() => {
    const g = scene.clone();

    // Hide built-in pitch meshes, enable shadows on everything else
    g.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const name = child.parent?.name || child.name;
        if (PITCH_MESH_NAMES.has(name) || PITCH_MESH_NAMES.has(child.name)) {
          child.visible = false;
          return;
        }
        child.castShadow = true;
        child.receiveShadow = true;

        // Ensure materials use standard pipeline
        if (child.material) {
          const mat = child.material as THREE.MeshStandardMaterial;
          if ("roughness" in mat) {
            mat.roughness = Math.max(mat.roughness, 0.5);
            mat.needsUpdate = true;
          }
        }
      }
    });

    return g;
  }, [scene]);

  return (
    <>
      {/* Rotate Z-up → Y-up, scale to match pitch dimensions */}
      <group rotation={rot as [number, number, number]} scale={scl} position={pos as [number, number, number]}>
        <primitive object={stadium} />
      </group>

      {/* Stadium overhead light */}
      <pointLight
        position={[0, 18 * scl + pos[1], 0]}
        intensity={isDark ? 3 : 2}
        color={isDark ? "#ffddaa" : "#ffffff"}
        distance={30}
      />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SKY DOME — GLB skybox, scaled to surround entire scene
   ═══════════════════════════════════════════════════════════════════ */

useGLTF.preload("/sky.glb");

function SkyDome() {
  const { scene } = useGLTF("/sky.glb");

  const { scl, posY } = useControls("Sky", {
    scl: { value: 200, min: 10, max: 500, step: 1 },
    posY: { value: -2.2, min: -50, max: 50, step: 0.1 },
  });

  const sky = useMemo(() => {
    const g = scene.clone();

    // Make sky render behind everything, unaffected by lighting
    g.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.renderOrder = -1;
        child.frustumCulled = false;

        // Replace material with unlit sky material
        if (child.material) {
          const oldMat = child.material as THREE.MeshStandardMaterial;
          const skyMat = new THREE.MeshBasicMaterial({
            map: oldMat.map,
            side: THREE.BackSide,
            fog: false,
          });
          child.material = skyMat;
        }
      }
    });

    return g;
  }, [scene]);

  return (
    <primitive object={sky} scale={scl} position={[0, posY, 0]} />
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SCENE — Orchestrator
   ═══════════════════════════════════════════════════════════════════ */

const Scene = memo(function Scene() {
  const { scene, camera } = useThree();
  const { colors, isDark } = useTheme();
  const pathname = usePathname();

  const targetPos = useRef(new THREE.Vector3(0, 1.5, 5.5));
  const targetLookAt = useRef(new THREE.Vector3(0, -0.3, 0));

  // Transparent background — sky dome handles the sky
  useEffect(() => {
    scene.background = null;
    scene.fog = null;
  }, [scene]);

  // Camera targets per route
  useEffect(() => {
    if (pathname === "/") {
      targetPos.current.set(0, 1.5, 5.5);
      targetLookAt.current.set(0, -0.3, 0);
    } else if (pathname.startsWith("/leagues")) {
      targetPos.current.set(-2, 2.5, 4);
      targetLookAt.current.set(0, -1, 0);
    } else if (pathname.startsWith("/teams")) {
      targetPos.current.set(2, 2, 4.5);
      targetLookAt.current.set(0, -1, 0);
    } else if (pathname.startsWith("/players")) {
      targetPos.current.set(0, 3, 3.5);
      targetLookAt.current.set(0, -1, 0);
    } else if (pathname.startsWith("/world-cup")) {
      targetPos.current.set(-1.5, 1, 5);
      targetLookAt.current.set(0, -0.5, 0);
    } else {
      targetPos.current.set(0, 1.5, 5.5);
      targetLookAt.current.set(0, -0.3, 0);
    }
  }, [pathname]);

  // Smooth camera lerp in useFrame (delta-safe)
  useFrame((_, delta) => {
    const t = 1 - Math.pow(0.01, delta); // frame-rate independent lerp
    camera.position.lerp(targetPos.current, t);
    camera.lookAt(targetLookAt.current);
  });

  return (
    <>
      {/* Sky behind everything */}
      <SkyDome />

      {/* Lighting — only 2 shadow-casting lights for performance */}
      <ambientLight intensity={isDark ? 0.3 : 0.5} color={colors.ambient} />
      <spotLight
        position={[-5, 8, 3]}
        angle={0.5}
        penumbra={0.6}
        intensity={isDark ? 3 : 2}
        color={colors.spot}
        castShadow
        shadow-mapSize={1024}
      />
      <spotLight
        position={[5, 8, -3]}
        angle={0.5}
        penumbra={0.6}
        intensity={isDark ? 2.5 : 1.8}
        color={colors.spot}
      />
      <spotLight position={[0, 9, 0]} angle={0.7} penumbra={0.8} intensity={isDark ? 1.5 : 1.2} color="#FFFFFF" />
      <directionalLight position={[3, 6, 5]} intensity={isDark ? 0.5 : 0.4} color="#FFF5E6" />

      {/* Scene objects */}
      <Football />
      <GrassPitch />
      <Stadium />

      {/* Camera controls */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.2}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
        dampingFactor={0.05}
        enableDamping
        target={[0, -0.3, 0]}
      />

      {/* Post-processing */}
      <EffectComposer>
        <Bloom luminanceThreshold={isDark ? 0.4 : 0.7} luminanceSmoothing={0.9} intensity={isDark ? 0.5 : 0.2} />
        <Vignette offset={0.3} darkness={isDark ? 0.5 : 0.3} />
      </EffectComposer>
    </>
  );
});

/* ═══════════════════════════════════════════════════════════════════
   EXPORT
   ═══════════════════════════════════════════════════════════════════ */

export function ThreeBackground() {
  const { interactive } = use3DInteractive();

  return (
    <div className="fixed inset-0 z-0" style={{ pointerEvents: interactive ? "auto" : "none" }}>
      <Canvas
        camera={{ position: [0, 1.5, 5.5], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 2]}
        shadows="percentage"
      >
        <Scene />
      </Canvas>
    </div>
  );
}
