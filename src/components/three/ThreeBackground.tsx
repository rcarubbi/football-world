"use client";

import { useRef, useMemo, useEffect, memo, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { useControls, folder } from "leva";
import { Leva } from "leva";

import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { SpotLightHelper, DirectionalLightHelper } from "three";
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
    pos: { value: [0, 0.2, 0], step: 0.01 },
    rot: { value: [1, 1, 1], step: 0.01 },
    scl: { value: 2.02, min: 0.1, max: 5, step: 0.01 },
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
    pos: { value: [0, 0.01, -0.1], step: 0.01 },
    rot: { value: [4.77, 0, 0], step: 0.01 },
    width: { value: 5, min: 5, max: 30, step: 0.01 },
    height: { value: 3, min: 3, max: 20, step: 0.01 },
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
    const lw = 3;
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = lw;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const stroke = (fn: () => void) => { fn(); ctx.stroke(); };
    const fill = (fn: () => void) => { fn(); ctx.fill(); };

    // All proportions based on 105×68m pitch, scaled to canvas
    const pad = 20;
    const pW = W - pad * 2;
    const pH = H - pad * 2;
    const sx = pW / 105; // pixels per meter (length)
    const sy = pH / 68;  // pixels per meter (width)

    // Pitch border
    stroke(() => ctx.strokeRect(pad, pad, pW, pH));

    // Halfway line
    stroke(() => { ctx.beginPath(); ctx.moveTo(W / 2, pad); ctx.lineTo(W / 2, H - pad); ctx.stroke(); });

    // Center circle (9.15m radius)
    const centerR = 9.15 * sx;
    stroke(() => { ctx.beginPath(); ctx.arc(W / 2, H / 2, centerR, 0, Math.PI * 2); ctx.stroke(); });

    // Center spot
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    fill(() => { ctx.beginPath(); ctx.arc(W / 2, H / 2, 3, 0, Math.PI * 2); ctx.fill(); });

    // Penalty areas (16.5m deep × 40.32m wide)
    const paW = 16.5 * sx;
    const paH = 40.32 * sy;
    const paY = (H - paH) / 2;
    stroke(() => { ctx.beginPath(); ctx.rect(pad, paY, paW, paH); ctx.stroke(); });
    stroke(() => { ctx.beginPath(); ctx.rect(W - pad - paW, paY, paW, paH); ctx.stroke(); });

    // Goal areas (5.5m deep × 18.32m wide)
    const gaW = 5.5 * sx;
    const gaH = 18.32 * sy;
    const gaY = (H - gaH) / 2;
    stroke(() => { ctx.beginPath(); ctx.rect(pad, gaY, gaW, gaH); ctx.stroke(); });
    stroke(() => { ctx.beginPath(); ctx.rect(W - pad - gaW, gaY, gaW, gaH); ctx.stroke(); });

    // Penalty spots (11m from goal line)
    const penX1 = pad + 11 * sx;
    const penX2 = W - pad - 11 * sx;
    fill(() => { ctx.beginPath(); ctx.arc(penX1, H / 2, 3, 0, Math.PI * 2); ctx.fill(); });
    fill(() => { ctx.beginPath(); ctx.arc(penX2, H / 2, 3, 0, Math.PI * 2); ctx.fill(); });

    // Penalty arcs (9.15m radius, outside penalty area)
    const arcR = 9.15 * sx;
    ctx.save();
    ctx.beginPath();
    ctx.rect(pad + paW, pad, pW - paW * 2, pH);
    ctx.clip();
    stroke(() => { ctx.beginPath(); ctx.arc(penX1, H / 2, arcR, 0, Math.PI * 2); ctx.stroke(); });
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.rect(pad, pad, pW - paW * 2, pH);
    ctx.clip();
    stroke(() => { ctx.beginPath(); ctx.arc(penX2, H / 2, arcR, 0, Math.PI * 2); ctx.stroke(); });
    ctx.restore();

    // Corner arcs (1m radius)
    const cornerR = 1 * sx;
    const corners = [
      [pad, pad, 0, Math.PI / 2],
      [W - pad, pad, Math.PI / 2, Math.PI],
      [W - pad, H - pad, Math.PI, Math.PI * 1.5],
      [pad, H - pad, -Math.PI / 2, 0],
    ] as const;
    for (const [cx, cy, a1, a2] of corners) {
      stroke(() => { ctx.beginPath(); ctx.arc(cx, cy, cornerR, a1, a2); ctx.stroke(); });
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

  const { posX, posY, posZ, rotX, rotY, rotZ, scl } = useControls("Stadium", {
    posX: { value: 0, min: -20, max: 20, step: 0.01 },
    posY: { value: 0, min: -20, max: 20, step: 0.01 },
    posZ: { value: 0, min: -20, max: 20, step: 0.01 },
    rotX: { value: 0.06, min: -Math.PI, max: Math.PI, step: 0.01 },
    rotY: { value: 3.14, min: -Math.PI, max: Math.PI, step: 0.01 },
    rotZ: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
    scl: { value: 0.04, min: 0.01, max: 2, step: 0.001 },
  });

  const position: [number, number, number] = [posX, posY, posZ];
  const rotation: [number, number, number] = [rotX, rotY, rotZ];

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
      <group rotation={rotation} scale={scl} position={position}>
        <primitive object={stadium} />
      </group>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SKY DOME — GLB skybox, scaled to surround entire scene
   ═══════════════════════════════════════════════════════════════════ */

useGLTF.preload("/sky.glb");

useGLTF.preload("/goal.glb");

function SkyDome() {
  const { scenes } = useGLTF("/sky.glb");
  const { isDark } = useTheme();

  const [{ skyPosX, skyPosY, skyPosZ, skyRotX, skyRotY, skyRotZ, skyScl, tintR, tintG, tintB }, setSky] = useControls(() => ({
    Sky: folder({
      skyPosX: { value: 0, min: -50, max: 50, step: 0.1 },
      skyPosY: { value: -13.5, min: -50, max: 50, step: 0.1 },
      skyPosZ: { value: 8.5, min: -50, max: 50, step: 0.1 },
      skyRotX: { value: 0.06, min: -Math.PI, max: Math.PI, step: 0.01 },
      skyRotY: { value: -1.23, min: -Math.PI, max: Math.PI, step: 0.01 },
      skyRotZ: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
      skyScl: { value: 74, min: 10, max: 500, step: 1 },
      tintR: { value: isDark ? 0 : 1, min: 0, max: 2, step: 0.01 },
      tintG: { value: isDark ? 0 : 1, min: 0, max: 2, step: 0.01 },
      tintB: { value: isDark ? 0.02 : 1, min: 0, max: 2, step: 0.01 },
    })
  }), []);

  useEffect(() => {
    setSky({ tintR: isDark ? 0 : 1, tintG: isDark ? 0 : 1, tintB: isDark ? 0.02 : 1 });
  }, [isDark, setSky]);

  const tex = useMemo(() => {
    let found: THREE.Texture | null = null;
    scenes[0].traverse((child) => {
      if (found) return;
      if (child instanceof THREE.Mesh && child.material) {
        const mat = child.material as THREE.MeshStandardMaterial;
        found = mat.emissiveMap || mat.map || null;
      }
    });
    return found;
  }, [scenes]);

  return (
    <mesh
      scale={skyScl}
      position={[skyPosX, skyPosY, skyPosZ]}
      rotation={[skyRotX, skyRotY, skyRotZ]}
      renderOrder={-999}
    >
      <sphereGeometry args={[1, 64, 32]} />
      <meshBasicMaterial
        map={tex}
        color={new THREE.Color(tintR, tintG, tintB)}
        side={THREE.BackSide}
        fog={false}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   GOALS — FBX model, two instances at each end of the pitch
   ═══════════════════════════════════════════════════════════════════ */

function Goals() {
  const { scene } = useGLTF("/goal.glb");

  const goal1 = useMemo(() => {
    const g = scene.clone();
    g.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = false;
        child.receiveShadow = false;
        if (child.material) {
          const oldMat = child.material as THREE.MeshStandardMaterial;
          child.material = new THREE.MeshBasicMaterial({
            color: oldMat.color,
            map: oldMat.map,
            transparent: oldMat.transparent,
            opacity: oldMat.opacity,
            side: oldMat.side,
          });
        }
      }
    });
    return g;
  }, [scene]);

  const goal2 = useMemo(() => goal1.clone(), [goal1]);

  const { pos1X, pos1Y, pos1Z, rot1X, rot1Y, rot1Z, scl1, showGoal1 } = useControls("Goal 1", {
    showGoal1: true,
    pos1X: { value: 2.24, min: -10, max: 10, step: 0.01 },
    pos1Y: { value: 0.12, min: -10, max: 10, step: 0.01 },
    pos1Z: { value: -0.37, min: -10, max: 10, step: 0.01 },
    rot1X: { value: 3.14, min: -Math.PI, max: Math.PI, step: 0.01 },
    rot1Y: { value: -1.71, min: -Math.PI, max: Math.PI, step: 0.01 },
    rot1Z: { value: 3.08, min: -Math.PI, max: Math.PI, step: 0.01 },
    scl1: { value: 0.05, min: 0.001, max: 0.1, step: 0.001 },
  });

  const { pos2X, pos2Y, pos2Z, rot2X, rot2Y, rot2Z, scl2, showGoal2 } = useControls("Goal 2", {
    showGoal2: true,
    pos2X: { value: -2.24, min: -10, max: 10, step: 0.01 },
    pos2Y: { value: 0.12, min: -10, max: 10, step: 0.01 },
    pos2Z: { value: -0.37, min: -10, max: 10, step: 0.01 },
    rot2X: { value: 0.36, min: -Math.PI, max: Math.PI, step: 0.01 },
    rot2Y: { value: 0.91, min: -Math.PI, max: Math.PI, step: 0.01 },
    rot2Z: { value: -0.41, min: -Math.PI, max: Math.PI, step: 0.01 },
    scl2: { value: 0.05, min: 0.001, max: 0.1, step: 0.001 },
  });

  return (
    <>
      {showGoal1 && (
        <primitive
          object={goal1}
          position={[pos1X, pos1Y, pos1Z]}
          rotation={[rot1X, rot1Y, rot1Z]}
          scale={scl1}
        />
      )}
      {showGoal2 && (
        <primitive
          object={goal2}
          position={[pos2X, pos2Y, pos2Z]}
          rotation={[rot2X, rot2Y, rot2Z]}
          scale={scl2}
        />
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   LIGHT HELPER — visual debug for light positions
   ═══════════════════════════════════════════════════════════════════ */

function LightHelper({
  type,
  target,
  visible,
  size = 1,
}: {
  type: "directional" | "spot";
  target: THREE.Light;
  visible: boolean;
  size?: number;
}) {
  const { scene } = useThree();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const helperRef = useRef<any>(null);
  useEffect(() => {
    if (!visible || !target) return;
    const helper =
      type === "directional"
        ? new DirectionalLightHelper(target as THREE.DirectionalLight, size)
        : new SpotLightHelper(target as THREE.SpotLight, size);
    scene.add(helper);
    helperRef.current = helper;
    return () => {
      scene.remove(helper);
      helper.dispose();
      helperRef.current = null;
    };
  }, [visible, target, scene, type, size]);
  useFrame(() => {
    if (helperRef.current) helperRef.current.update();
  });
  return null;
}

/* ═══════════════════════════════════════════════════════════════════
   SCENE — Orchestrator
   ═══════════════════════════════════════════════════════════════════ */

const Scene = memo(function Scene() {
  const { scene, camera } = useThree();
  const { colors, isDark } = useTheme();
  const pathname = usePathname();

  const [cam, setCamera] = useControls(() => ({
    Camera: folder({
      camX: { value: 0.02, min: -20, max: 20, step: 0.01 },
      camY: { value: 0.992, min: -20, max: 20, step: 0.01 },
      camZ: { value: -2.441, min: -20, max: 20, step: 0.01 },
      lookX: { value: 0, min: -20, max: 20, step: 0.01 },
      lookY: { value: -0.3, min: -20, max: 20, step: 0.01 },
      lookZ: { value: 0, min: -20, max: 20, step: 0.01 },
      rotX: { value: -2.802, min: -Math.PI, max: Math.PI, step: 0.01 },
      rotY: { value: 0.008, min: -Math.PI, max: Math.PI, step: 0.01 },
      rotZ: { value: 3.138, min: -Math.PI, max: Math.PI, step: 0.01 },
      fov: { value: 110, min: 10, max: 120, step: 0.1 },
      useRotation: false,
      editMode: false,
      override: false,
    }),
  }));

  const [{ light1X, light1Y, light1Z, light2X, light2Y, light2Z, lightIntensity, sunIntensity, sunX, sunY, sunZ, sunRotX, sunRotY, sunRotZ, sunLength, showSunHelper, showPost1Helper, showPost2Helper }, setLights] = useControls(() => ({
    Lights: folder({
      sunX: { value: 13.6, min: -20, max: 20, step: 0.1 },
      sunY: { value: 3.3, min: 0, max: 20, step: 0.1 },
      sunZ: { value: 8.1, min: -20, max: 20, step: 0.1 },
      sunRotX: { value: -0.22, min: -Math.PI, max: Math.PI, step: 0.01 },
      sunRotY: { value: -2.6, min: -Math.PI, max: Math.PI, step: 0.01 },
      sunRotZ: { value: -0.34, min: -Math.PI, max: Math.PI, step: 0.01 },
      sunLength: { value: 15.7, min: 1, max: 50, step: 0.1 },
      sunIntensity: { value: isDark ? 0 : 5.3, min: 0, max: 20, step: 0.1 },
      light1X: { value: 2.6, min: -10, max: 10, step: 0.1 },
      light1Y: { value: 1.61, min: 0, max: 10, step: 0.1 },
      light1Z: { value: 2.34, min: -10, max: 10, step: 0.1 },
      light2X: { value: -2.61, min: -10, max: 10, step: 0.1 },
      light2Y: { value: 1.65, min: 0, max: 10, step: 0.1 },
      light2Z: { value: 2.25, min: -10, max: 10, step: 0.1 },
      lightIntensity: { value: isDark ? 20 : 0, min: 0, max: 20, step: 0.1 },
      showSunHelper: false,
      showPost1Helper: false,
      showPost2Helper: false,
    })
  }), []);

  useEffect(() => {
    setLights({ sunIntensity: isDark ? 0 : 5.3, lightIntensity: isDark ? 20 : 0 });
  }, [isDark, setLights]);

  const { bloomThreshold, bloomIntensity, bloomSmoothing, vignetteOffset, vignetteDarkness } = useControls("PostProcessing", {
    bloomThreshold: { value: 0.4, min: 0, max: 2, step: 0.01 },
    bloomIntensity: { value: 0.5, min: 0, max: 3, step: 0.01 },
    bloomSmoothing: { value: 0.9, min: 0, max: 1, step: 0.01 },
    vignetteOffset: { value: 0.3, min: 0, max: 1, step: 0.01 },
    vignetteDarkness: { value: 0.5, min: 0, max: 1, step: 0.01 },
  });

  const targetPos = useRef(new THREE.Vector3(0.02, 0.992, -2.441));
  const targetLookAt = useRef(new THREE.Vector3(0, -0.3, 0));

  // Light refs for helpers
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const sunTargetRef = useRef<THREE.Object3D>(new THREE.Object3D());
  const spot1Ref = useRef<THREE.SpotLight>(null);
  const spot2Ref = useRef<THREE.SpotLight>(null);
  const spot1TargetRef = useRef<THREE.Object3D>(new THREE.Object3D());
  const spot2TargetRef = useRef<THREE.Object3D>(new THREE.Object3D());

  // Edit mode state refs
  const editModeRef = useRef(false);
  const keysRef = useRef(new Set<string>());
  const mouseDelta = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  // Sync editMode ref + dispatch event for ThreeBackground
  useEffect(() => {
    editModeRef.current = cam.editMode;
    window.dispatchEvent(new CustomEvent("camera-edit", { detail: cam.editMode }));
  }, [cam.editMode]);

  // Keyboard handlers — WASD + arrows for camera movement
  useEffect(() => {
    if (!cam.editMode) return;

    const isInput = () => {
      const el = document.activeElement;
      return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isInput()) return;
      keysRef.current.add(e.code);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      keysRef.current.clear();
    };
  }, [cam.editMode]);

  // Mouse drag for camera rotation
  useEffect(() => {
    if (!cam.editMode) return;

    const onMouseDown = () => { isDragging.current = true; };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      mouseDelta.current.x += e.movementX;
      mouseDelta.current.y += e.movementY;
    };
    const onMouseUp = () => { isDragging.current = false; };

    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      isDragging.current = false;
      mouseDelta.current.x = 0;
      mouseDelta.current.y = 0;
    };
  }, [cam.editMode]);

  // Scroll wheel for FOV zoom
  useEffect(() => {
    if (!cam.editMode) return;
    const onWheel = (e: WheelEvent) => {
      const p = camera as THREE.PerspectiveCamera;
      if (!("fov" in p)) return;
      p.fov = Math.max(10, Math.min(120, p.fov + e.deltaY * 0.05));
      p.updateProjectionMatrix();
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => window.removeEventListener("wheel", onWheel);
  }, [cam.editMode, camera]);

  // Capture handler — writes camera state to leva
  useEffect(() => {
    const onCapture = () => {
      const p = camera as THREE.PerspectiveCamera;
      setCamera({
          camX: +camera.position.x.toFixed(3),
          camY: +camera.position.y.toFixed(3),
          camZ: +camera.position.z.toFixed(3),
          rotX: +camera.rotation.x.toFixed(3),
          rotY: +camera.rotation.y.toFixed(3),
          rotZ: +camera.rotation.z.toFixed(3),
          fov: +("fov" in p ? p.fov : 50).toFixed(1),
          useRotation: true,
          override: true,
          editMode: false,
      });
    };
    window.addEventListener("capture-camera", onCapture);
    return () => window.removeEventListener("capture-camera", onCapture);
  }, [camera, setCamera]);

  // Exit edit mode handler
  useEffect(() => {
    const onExit = () => {
      setCamera({ editMode: false });
    };
    window.addEventListener("camera-edit-exit", onExit);
    return () => window.removeEventListener("camera-edit-exit", onExit);
  }, [setCamera]);

  // Transparent background — sky dome handles the sky
  useEffect(() => {
    scene.background = null;
    scene.fog = null;
  }, [scene]);

  // Camera targets per route
  useEffect(() => {
    if (pathname === "/") {
      targetPos.current.set(0.02, 0.992, -2.441);
      targetLookAt.current.set(0, -0.3, 0);
    } else if (pathname.startsWith("/leagues")) {
      targetPos.current.set(-2, 2.5, -2);
      targetLookAt.current.set(0, -1, 0);
    } else if (pathname.startsWith("/teams")) {
      targetPos.current.set(2, 2, -2);
      targetLookAt.current.set(0, -1, 0);
    } else if (pathname.startsWith("/players")) {
      targetPos.current.set(0, 3, -3);
      targetLookAt.current.set(0, -1, 0);
    } else if (pathname.startsWith("/world-cup")) {
      targetPos.current.set(-1.5, 1, -2);
      targetLookAt.current.set(0, -0.5, 0);
    } else {
      targetPos.current.set(0.02, 0.992, -2.441);
      targetLookAt.current.set(0, -0.3, 0);
    }
  }, [pathname]);

  // Camera update
  useFrame((_, delta) => {
    if (editModeRef.current) {
      // FPS-style camera controls
      const speed = 3 * delta;
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      const right = new THREE.Vector3()
        .crossVectors(forward, new THREE.Vector3(0, 1, 0))
        .normalize();

      const keys = keysRef.current;
      if (keys.has("ArrowUp") || keys.has("KeyW"))
        camera.position.addScaledVector(forward, speed);
      if (keys.has("ArrowDown") || keys.has("KeyS"))
        camera.position.addScaledVector(forward, -speed);
      if (keys.has("ArrowLeft") || keys.has("KeyA"))
        camera.position.addScaledVector(right, -speed);
      if (keys.has("ArrowRight") || keys.has("KeyD"))
        camera.position.addScaledVector(right, speed);
      if (keys.has("ShiftLeft") || keys.has("ShiftRight"))
        camera.position.y += speed;
      if (keys.has("ControlLeft") || keys.has("ControlRight"))
        camera.position.y -= speed;

      // Mouse rotation (drag to look)
      const dx = mouseDelta.current.x;
      const dy = mouseDelta.current.y;
      if (dx !== 0 || dy !== 0) {
        // Yaw — rotate around world Y
        const yaw = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0),
          -dx * 0.003
        );
        camera.quaternion.premultiply(yaw);

        // Pitch — rotate around camera's local X
        const pitchAxis = new THREE.Vector3(1, 0, 0).applyQuaternion(
          camera.quaternion
        );
        const pitch = new THREE.Quaternion().setFromAxisAngle(
          pitchAxis,
          -dy * 0.003
        );
        camera.quaternion.premultiply(pitch);

        mouseDelta.current.x = 0;
        mouseDelta.current.y = 0;
      }
    } else if (cam.override) {
      camera.position.set(cam.camX, cam.camY, cam.camZ);
      if (cam.useRotation) {
        camera.rotation.set(cam.rotX, cam.rotY, cam.rotZ);
      } else {
        camera.lookAt(cam.lookX, cam.lookY, cam.lookZ);
      }
      if ("fov" in camera) {
        (camera as THREE.PerspectiveCamera).fov = cam.fov;
        camera.updateProjectionMatrix();
      }
    } else {
      const t = 1 - Math.pow(0.01, delta);
      camera.position.lerp(targetPos.current, t);
      camera.lookAt(targetLookAt.current);
    }

    // Update sun target from rotation + length
    if (dirLightRef.current) {
      sunTargetRef.current.position.set(
        sunX + sunLength * Math.cos(sunRotY) * Math.cos(sunRotX),
        sunY + sunLength * Math.sin(sunRotX),
        sunZ + sunLength * Math.sin(sunRotY) * Math.cos(sunRotX),
      );
      dirLightRef.current.target = sunTargetRef.current;
    }
  });

  return (
    <>
      {/* Sky behind everything */}
      <SkyDome />

      {/* Lighting — sun in light mode, spotlights in dark mode */}
      <ambientLight intensity={isDark ? 0.3 : 0.5} color={colors.ambient} />
      <primitive object={sunTargetRef.current} />
      <directionalLight
        ref={dirLightRef}
        position={[sunX, sunY, sunZ]}
        intensity={sunIntensity}
        color="#FFF5E6"
        castShadow
        shadow-mapSize={1024}
      />
      <primitive object={spot1TargetRef.current} position={[light1X, 0, light1Z]} />
      <primitive object={spot2TargetRef.current} position={[light2X, 0, light2Z]} />
      <spotLight ref={spot1Ref} position={[light1X, light1Y, light1Z]} target={spot1TargetRef.current} intensity={isDark ? lightIntensity : 0} color="#FFFFFF" angle={0.6} penumbra={0.4} distance={20} castShadow />
      <spotLight ref={spot2Ref} position={[light2X, light2Y, light2Z]} target={spot2TargetRef.current} intensity={isDark ? lightIntensity : 0} color="#FFFFFF" angle={0.6} penumbra={0.4} distance={20} castShadow />

      {/* Light helpers */}
      <LightHelper type="directional" target={dirLightRef.current!} visible={showSunHelper} />
      <LightHelper type="spot" target={spot1Ref.current!} visible={showPost1Helper} size={0.3} />
      <LightHelper type="spot" target={spot2Ref.current!} visible={showPost2Helper} size={0.3} />

      {/* Scene objects */}
      <Football />
      <GrassPitch />
      <Stadium />
      <Goals />

      {/* Camera controls — disabled in edit mode */}
      <OrbitControls
        enabled={!cam.editMode}
        enableZoom={false}
        enablePan={false}
        autoRotate={!cam.editMode}
        autoRotateSpeed={0.2}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
        dampingFactor={0.05}
        enableDamping
        target={[0, -0.3, 0]}
      />

      {/* Post-processing — temporarily disabled to test stadium textures
      <EffectComposer>
        <Bloom luminanceThreshold={bloomThreshold} luminanceSmoothing={bloomSmoothing} intensity={bloomIntensity} />
        <Vignette offset={vignetteOffset} darkness={vignetteDarkness} />
      </EffectComposer>
      */}
    </>
  );
});

/* ═══════════════════════════════════════════════════════════════════
   EXPORT
   ═══════════════════════════════════════════════════════════════════ */

export function ThreeBackground() {
  const { interactive, setInteractive } = use3DInteractive();
  const [levaHidden, setLevaHidden] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Listen for edit mode changes from Scene
  useEffect(() => {
    const onEdit = (e: Event) => {
      const active = (e as CustomEvent).detail as boolean;
      setEditMode(active);
      setInteractive(active);
    };
    window.addEventListener("camera-edit", onEdit);
    return () => window.removeEventListener("camera-edit", onEdit);
  }, [setInteractive]);

  const handleCapture = useCallback(() => {
    window.dispatchEvent(new Event("capture-camera"));
  }, []);

  const handleExit = useCallback(() => {
    window.dispatchEvent(new Event("camera-edit-exit"));
  }, []);

  return (
    <>
      {/* Leva panel — hidden in edit mode */}
      {!editMode && <Leva hidden={levaHidden} />}

      {/* Controls toggle — hidden in edit mode */}
      {!editMode && (
        <button
          onClick={() => setLevaHidden((h) => !h)}
          className="fixed top-2 right-2 z-50 rounded bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm hover:bg-black/80"
          style={{ pointerEvents: "auto" }}
        >
          {levaHidden ? "Show Controls" : "Hide Controls"}
        </button>
      )}

      {/* Capture + Exit buttons — only in edit mode */}
      {editMode && (
        <div
          className="fixed top-2 right-2 z-[10000] flex gap-2"
          style={{ pointerEvents: "auto" }}
        >
          <button
            onClick={handleCapture}
            className="rounded bg-green-600/80 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-green-700"
          >
            Capture Camera
          </button>
          <button
            onClick={handleExit}
            className="rounded bg-red-600/80 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-red-700"
          >
            Exit
          </button>
        </div>
      )}

      {/* Canvas — z-9999 in edit mode to cover all HTML */}
      <div
        className="fixed inset-0"
        style={{
          zIndex: editMode ? 9999 : 0,
          pointerEvents: interactive ? "auto" : "none",
        }}
      >
        <Canvas
          camera={{ position: [0.02, 0.992, -2.441], fov: 110 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          dpr={[1, 2]}
          shadows="percentage"
        >
          <Scene />
        </Canvas>
      </div>
    </>
  );
}
