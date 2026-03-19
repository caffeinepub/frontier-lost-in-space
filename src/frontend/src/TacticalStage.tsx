/**
 * TacticalStage — Main game view.
 *
 * Layout (portrait mobile-first):
 *   ┌──────────────────┐
 *   │ PortraitStatusBar │  ← target/scan/cmd
 *   ├──────────────────┤
 *   │   3D Canvas        │  ← Earth + space + threats + cockpit frame
 *   ├──────────────────┤
 *   │ WeaponControlDeck │  ← PULSE / RAIL GUN / MISSILE
 *   ├──────────────────┤
 *   │ BottomCommandNav  │  ← CMD SCAN WPN SHIP LOG
 *   └──────────────────┘
 */
import { Canvas } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { useWeaponsStore } from "./combat/useWeapons";
import BottomCommandNav from "./components/game/BottomCommandNav";
import CameraController from "./components/game/CameraController";
import CockpitFrame from "./components/game/CockpitFrame";
import CombatEffectsLayer from "./components/game/CombatEffectsLayer";
import EarthGlobe from "./components/game/EarthGlobe";
import MobileJoystick from "./components/game/MobileJoystick";
import PortraitCommandDrawer from "./components/game/PortraitCommandDrawer";
import PortraitStatusBar from "./components/game/PortraitStatusBar";
import RadarSystem from "./components/game/RadarSystem";
import RightDragZone from "./components/game/RightDragZone";
import ShipMotionLayer from "./components/game/ShipMotionLayer";
import SpaceBackground from "./components/game/SpaceBackground";
import TacticalLogPanel from "./components/game/TacticalLogPanel";
import ThreatManager from "./components/game/ThreatManager";
import TutorialOverlay from "./components/game/TutorialOverlay";
import UpperCanopy from "./components/game/UpperCanopy";
import VelocityIndicator from "./components/game/VelocityIndicator";
import WeaponControlDeck from "./components/game/WeaponControlDeck";
import { useIntroStore } from "./intro/useIntroStore";
import { useShipMovementSetup } from "./motion/useShipMovementSetup";
import { useTacticalLogStore } from "./tacticalLog/useTacticalLogStore";
import { useTutorialStore } from "./tutorial/useTutorialStore";

// Fix 1: Drive weapon cooldowns via rAF loop
function WeaponsTick() {
  useEffect(() => {
    let last = performance.now();
    let raf: number;
    const loop = (now: number) => {
      const dt = now - last;
      last = now;
      useWeaponsStore.getState().tick(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return null;
}

// Fix 2: Tutorial auto-start disabled for stability — user triggers manually
function TutorialBootstrap() {
  const pendingTutorialStart = useIntroStore((s) => s.pendingTutorialStart);
  const consumeTutorialStart = useIntroStore((s) => s.consumeTutorialStart);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    if (!pendingTutorialStart) return;
    hasRun.current = true;
    consumeTutorialStart();
    // Tutorial auto-start disabled for stability — user triggers manually
  }, [pendingTutorialStart, consumeTutorialStart]);

  return null;
}

function GameBootstrap() {
  // Boot movement engine + keyboard/mouse listeners
  useShipMovementSetup();

  // Log system startup
  useEffect(() => {
    const addEntry = useTacticalLogStore.getState().addEntry;
    addEntry({ type: "system", message: "A.E.G.I.S. TACTICAL COMMAND ONLINE" });
    addEntry({ type: "system", message: "ALL SYSTEMS NOMINAL" });
  }, []);

  return null;
}

export default function TacticalStage() {
  return (
    <div
      style={{
        width: "100%",
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "#000008",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <GameBootstrap />
      <TutorialBootstrap />
      <WeaponsTick />

      {/* ────── TOP STATUS BAR ────── */}
      <PortraitStatusBar />

      {/* ────── MAIN VIEWPORT ────── */}
      <div
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        {/* 3D Canvas — fills the viewport area */}
        <Canvas
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
          }}
          camera={{ fov: 55, near: 0.1, far: 200, position: [0, 0.9, 5] }}
          gl={{ antialias: true, alpha: false }}
        >
          <CameraController />
          <SpaceBackground />
          <EarthGlobe />
          <ThreatManager />
          <CombatEffectsLayer />
        </Canvas>

        {/* Cockpit frame overlay — wraps the 3D viewport */}
        <ShipMotionLayer factor={0.55} zIndex={15} leanMult={1}>
          <CockpitFrame />
          <UpperCanopy />
        </ShipMotionLayer>

        {/* Velocity indicator — bottom-left of viewport */}
        <div
          style={{
            position: "absolute",
            bottom: "clamp(12px, 3vh, 28px)",
            left: "clamp(10px, 2.5vw, 20px)",
            zIndex: 22,
            pointerEvents: "none",
          }}
        >
          <VelocityIndicator />
        </div>

        {/* Radar — bottom-right of viewport */}
        <RadarSystem />

        {/* Touch zones */}
        <MobileJoystick />
        <RightDragZone />
      </div>

      {/* ────── WEAPON DECK ────── */}
      <WeaponControlDeck portrait />

      {/* ────── BOTTOM NAV ────── */}
      <BottomCommandNav />

      {/* ────── OVERLAYS & DRAWERS ────── */}
      <PortraitCommandDrawer />
      <TacticalLogPanel />
      <TutorialOverlay />
    </div>
  );
}
