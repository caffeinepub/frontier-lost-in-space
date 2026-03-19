/**
 * TacticalStage — Main game view.
 *
 * Layout (portrait mobile-first):
 *   ┌──────────────────┐
 *   │ PortraitStatusBar │  ← target/scan/cmd
 *   ├──────────────────┤
 *   │   3D Canvas        │  ← Globe + stars + cockpit
 *   ├──────────────────┤
 *   │ WeaponControlDeck │  ← PULSE / RAIL / MISSILE
 *   ├──────────────────┤
 *   │ BottomCommandNav  │  ← CMD SCAN WPN SHIP LOG
 *   └──────────────────┘
 *
 * Globe notes:
 *   - Canvas dpr is capped at min(devicePixelRatio, 2) to reduce GPU load on
 *     high-DPR mobile screens
 *   - GlobeErrorBoundary wraps the Canvas so a render fault cannot black-screen
 *   - data-tutorial-target="globe-area" sits as a pointer-events:none DOM overlay
 *     over the canvas so TutorialOverlay can spotlight it without stealing input
 *
 * CoreLoopDebug strip:
 *   Visible only when localStorage.debug_coreloop === '1'
 */
import { Canvas } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { useWeaponsStore } from "./combat/useWeapons";
import BottomCommandNav from "./components/game/BottomCommandNav";
import CameraController from "./components/game/CameraController";
import CockpitFrame from "./components/game/CockpitFrame";
import CombatEffectsLayer from "./components/game/CombatEffectsLayer";
import EarthGlobe from "./components/game/EarthGlobe";
import { GlobeErrorBoundary } from "./components/game/GlobeErrorBoundary";
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
import { useTacticalStore } from "./hooks/useTacticalStore";
import { useIntroStore } from "./intro/useIntroStore";
import { useShipMovementSetup } from "./motion/useShipMovementSetup";
import { useTacticalLogStore } from "./tacticalLog/useTacticalLogStore";
import { useTutorialStore } from "./tutorial/useTutorialStore";

// Cap device pixel ratio to 2 to reduce GPU load on high-DPR mobile screens
const DPR: [number, number] = [1, 2];

// Weapons cooldown rAF loop
function WeaponsTick() {
  useEffect(() => {
    let last = performance.now();
    let raf: number;
    const loop = (now: number) => {
      useWeaponsStore.getState().tick(now - last);
      last = now;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return null;
}

// Tutorial auto-start is disabled — user triggers manually from CMD panel
function TutorialBootstrap() {
  const pendingTutorialStart = useIntroStore((s) => s.pendingTutorialStart);
  const consumeTutorialStart = useIntroStore((s) => s.consumeTutorialStart);
  const hasRun = useRef(false);
  useEffect(() => {
    if (hasRun.current || !pendingTutorialStart) return;
    hasRun.current = true;
    consumeTutorialStart();
  }, [pendingTutorialStart, consumeTutorialStart]);
  return null;
}

function GameBootstrap() {
  useShipMovementSetup();
  useEffect(() => {
    const add = useTacticalLogStore.getState().addEntry;
    add({ type: "system", message: "A.E.G.I.S. TACTICAL COMMAND ONLINE" });
    add({ type: "system", message: "ALL SYSTEMS NOMINAL" });
  }, []);
  return null;
}

/** Lightweight QA strip — only visible when localStorage.debug_coreloop='1' */
function CoreLoopDebug() {
  const weapons = useWeaponsStore((s) => s.weapons);
  const selectedNode = useTacticalStore((s) => s.selectedNode);
  const tutorialActive = useTutorialStore((s) => s.tutorialActive);
  const introComplete = useIntroStore((s) => s.introComplete);

  const show =
    typeof window !== "undefined" &&
    localStorage.getItem("debug_coreloop") === "1";
  if (!show) return null;

  const allReady = weapons.every((w) => w.status === "READY");
  const dot = (ok: boolean, label: string) => (
    <span key={label} style={{ color: ok ? "#0f8" : "#f80", marginRight: 6 }}>
      {ok ? "●" : "○"} {label}
    </span>
  );

  return (
    <div
      style={{
        position: "fixed",
        bottom: 4,
        left: 4,
        zIndex: 9999,
        background: "rgba(0,0,0,0.75)",
        border: "1px solid rgba(0,255,150,0.3)",
        borderRadius: 4,
        padding: "4px 8px",
        fontFamily: "monospace",
        fontSize: 9,
        letterSpacing: "0.1em",
        color: "rgba(0,220,180,0.8)",
        pointerEvents: "none",
        display: "flex",
        gap: 0,
        flexWrap: "wrap",
      }}
    >
      {dot(!!selectedNode, "TGT")}
      {dot(allReady, "WPN")}
      {dot(true, "RADAR")}
      {dot(!tutorialActive, "CLEAR")}
      {dot(introComplete, "INTRO")}
    </div>
  );
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
      <CoreLoopDebug />

      <PortraitStatusBar />

      <div
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        {/* Globe error boundary — render failure shows fallback, not black screen */}
        <GlobeErrorBoundary>
          <Canvas
            style={{ position: "absolute", inset: 0, zIndex: 1 }}
            camera={{ fov: 55, near: 0.1, far: 200, position: [0, 0.9, 5] }}
            gl={{ antialias: true, alpha: false }}
            dpr={DPR}
          >
            <CameraController />
            <SpaceBackground />
            <EarthGlobe />
            <ThreatManager />
            <CombatEffectsLayer />
          </Canvas>
        </GlobeErrorBoundary>

        {/*
          Globe hit-zone DOM overlay — pointer-events:none so it never steals
          input from the Three.js canvas. Used by TutorialOverlay spotlight only.
        */}
        <div
          data-tutorial-target="globe-area"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(52vw, 52vh)",
            height: "min(52vw, 52vh)",
            borderRadius: "50%",
            zIndex: 2,
            pointerEvents: "none",
          }}
        />

        <ShipMotionLayer factor={0.55} zIndex={15} leanMult={1}>
          <CockpitFrame />
          <UpperCanopy />
        </ShipMotionLayer>

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

        <RadarSystem />
        <MobileJoystick />
        <RightDragZone />
      </div>

      <WeaponControlDeck portrait />
      <BottomCommandNav />

      <PortraitCommandDrawer />
      <TacticalLogPanel />
      <TutorialOverlay />
    </div>
  );
}
