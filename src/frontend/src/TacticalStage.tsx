/**
 * TacticalStage — Main game view.
 *
 * Layout (portrait mobile-first):
 *   ┌──────────────────┐
 *   │ PortraitStatusBar │  ← target/scan/cmd
 *   ├──────────────────┤
 *   │   3D Canvas        │  ← Globe + stars + cockpit
 *   ├──────────────────┤
 *   │  WeaponConsole    │  ← Cinematic PULSE / RAIL / MISSILE / FIRE
 *   ├──────────────────┤
 *   │ BottomCommandNav  │  ← CMD SCAN WPN SHIP LOG
 *   └──────────────────┘
 *
 * Phase 2 additions inside Canvas:
 *   - EnemyTargetsLayer  (satellites + bases)
 *   - IncomingFireLayer  (enemy projectiles toward player)
 *
 * Phase 2 additions in DOM:
 *   - PlayerShieldHUD   (shield/hull bars)
 *   - PlayerHitFlash    (screen-pulse on damage)
 */
import { Canvas } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { usePlayerStore } from "./combat/usePlayerStore";
import { useWeaponsStore } from "./combat/useWeapons";
import BottomCommandNav from "./components/game/BottomCommandNav";
import CameraController from "./components/game/CameraController";
import CockpitFrame from "./components/game/CockpitFrame";
import CombatEffectsLayer from "./components/game/CombatEffectsLayer";
import EarthGlobe from "./components/game/EarthGlobe";
import EnemyTargetsLayer from "./components/game/EnemyTargetsLayer";
import { GlobeErrorBoundary } from "./components/game/GlobeErrorBoundary";
import IncomingFireLayer from "./components/game/IncomingFireLayer";
import MobileJoystick from "./components/game/MobileJoystick";
import PlayerShieldHUD from "./components/game/PlayerShieldHUD";
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
import WeaponConsole from "./components/game/WeaponConsole";
import { useTacticalStore } from "./hooks/useTacticalStore";
import { useIntroStore } from "./intro/useIntroStore";
import { useShipMovementSetup } from "./motion/useShipMovementSetup";
import { useTacticalLogStore } from "./tacticalLog/useTacticalLogStore";
import { useTutorialStore } from "./tutorial/useTutorialStore";

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
    add({ type: "system", message: "ORBITAL THREATS DETECTED — ENGAGE" });
  }, []);
  return null;
}

/** Full-screen red flash when player takes a hit. */
function PlayerHitFlash() {
  const hitFlash = usePlayerStore((s) => s.hitFlash);
  if (!hitFlash) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 50,
        pointerEvents: "none",
        background: "rgba(255,30,0,0.18)",
        boxShadow: "inset 0 0 60px rgba(255,0,0,0.35)",
        animation: "hitPulse 0.4s ease-out forwards",
      }}
    />
  );
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
          backgroundImage:
            "url('/assets/generated/space-background-deep.dim_1920x1080.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Tactical planet — decorative CSS layer, behind R3F canvas */}
        <img
          src="/assets/generated/cockpit-planet-tactical.dim_800x800.png"
          alt=""
          aria-hidden
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(45vw, 45vh)",
            height: "auto",
            mixBlendMode: "screen",
            pointerEvents: "none",
            zIndex: 0,
            opacity: 0.85,
          }}
        />

        <GlobeErrorBoundary>
          <Canvas
            style={{ position: "absolute", inset: 0, zIndex: 1 }}
            camera={{ fov: 55, near: 0.1, far: 200, position: [0, 0.9, 5] }}
            gl={{ antialias: true, alpha: true }}
            dpr={DPR}
          >
            <CameraController />
            <SpaceBackground />
            <EarthGlobe />
            <ThreatManager />
            <EnemyTargetsLayer />
            <IncomingFireLayer />
            <CombatEffectsLayer />
          </Canvas>
        </GlobeErrorBoundary>

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

        {/* Tactical HUD overlay — above canvas, below cockpit frame */}
        <img
          src="/assets/generated/cockpit-hud-overlay-transparent.dim_1920x1080.png"
          alt=""
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            mixBlendMode: "screen",
            opacity: 0.35,
            pointerEvents: "none",
            zIndex: 3,
          }}
        />

        <ShipMotionLayer factor={0.55} zIndex={15} leanMult={1}>
          <CockpitFrame />
          <UpperCanopy />
        </ShipMotionLayer>

        {/* Shield + Hull bars — top-left of globe area */}
        <PlayerShieldHUD />

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

        {/* Player hit flash overlay */}
        <PlayerHitFlash />
      </div>

      {/* Cinematic AAA weapon console — replaces WeaponControlDeck */}
      <WeaponConsole />

      <BottomCommandNav />

      <PortraitCommandDrawer />
      <TacticalLogPanel />
      <TutorialOverlay />

      {/* Hit pulse animation */}
      <style>{`
        @keyframes hitPulse {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
