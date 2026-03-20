/**
 * TacticalStage — Main game view.
 *
 * Boot/render hardening (V15):
 * - onCreated callback logs WebGL context init
 * - SceneBootConfirm fires console log on first useFrame tick
 * - BootFadeOverlay shows "LOADING" until first 3D frame confirms render
 * - All store init is wrapped so errors are caught at the boundary above
 */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { useAlertsStore } from "./alerts/useAlertsStore";
import { useEnemyStore } from "./combat/useEnemyStore";
import { usePlayerStore } from "./combat/usePlayerStore";
import { useWeaponsStore } from "./combat/useWeapons";
import { HostileContactCinematic } from "./components/cinematics/HostileContactCinematic";
import BottomCommandNav from "./components/game/BottomCommandNav";
import CameraController from "./components/game/CameraController";
import CockpitFrame from "./components/game/CockpitFrame";
import CombatEffectsLayer from "./components/game/CombatEffectsLayer";
import EarthGlobe from "./components/game/EarthGlobe";
import EnemyTargetsLayer from "./components/game/EnemyTargetsLayer";
import { GlobeErrorBoundary } from "./components/game/GlobeErrorBoundary";
import { HudErrorBoundary } from "./components/game/HudErrorBoundary";
import IncomingFireLayer from "./components/game/IncomingFireLayer";
import MobileJoystick from "./components/game/MobileJoystick";
import PlayerShieldHUD from "./components/game/PlayerShieldHUD";
import PortraitCommandDrawer from "./components/game/PortraitCommandDrawer";
import PortraitStatusBar from "./components/game/PortraitStatusBar";
import QaPanel from "./components/game/QaPanel";
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
import WeaponHologramLayer from "./components/game/WeaponHologramLayer";
import { useTacticalStore } from "./hooks/useTacticalStore";
import { useIntroStore } from "./intro/useIntroStore";
import { useShipMovementSetup } from "./motion/useShipMovementSetup";
import { useShipSystemsStore } from "./systems/useShipSystemsStore";
import { useTacticalLogStore } from "./tacticalLog/useTacticalLogStore";
import { useTutorialStore } from "./tutorial/useTutorialStore";

const DPR: [number, number] = [1, 2];

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

function DegradationTicker() {
  useEffect(() => {
    const interval = setInterval(() => {
      useShipSystemsStore.getState().tick(30000);
      useAlertsStore.getState().tickDegradationCheck();
    }, 30000);
    return () => clearInterval(interval);
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
    console.log("[TacticalStage] GameBootstrap mounted — seeding stores");
    const add = useTacticalLogStore.getState().addEntry;
    add({ type: "system", message: "A.E.G.I.S. TACTICAL COMMAND ONLINE" });
    add({ type: "system", message: "ALL SYSTEMS NOMINAL" });
    add({ type: "system", message: "ORBITAL THREATS DETECTED — ENGAGE" });
    useAlertsStore.getState().seedDegradationAlerts();
  }, []);
  return null;
}

// Lives inside the Canvas. Fires onConfirm on the very first useFrame tick.
function SceneBootConfirm({ onConfirm }: { onConfirm: () => void }) {
  const confirmed = useRef(false);
  const { gl } = useThree();

  useEffect(() => {
    const ctx = gl.getContext();
    console.log("[Canvas] WebGL context:", ctx?.constructor?.name ?? "unknown");
  }, [gl]);

  useFrame(() => {
    if (confirmed.current) return;
    confirmed.current = true;
    console.log("[Canvas] First frame rendered ✔");
    onConfirm();
  });
  return null;
}

// Shown until the 3D scene confirms its first frame.
function BootFadeOverlay({ visible }: { visible: boolean }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 900,
        background: "#000010",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "monospace",
        fontSize: "clamp(9px,1.1vw,11px)",
        letterSpacing: "0.3em",
        color: "rgba(0,180,220,0.45)",
        pointerEvents: "none",
        opacity: visible ? 1 : 0,
        transition: visible ? "none" : "opacity 0.6s ease",
      }}
    >
      LOADING TACTICAL SYSTEMS
    </div>
  );
}

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
      {ok ? "\u25cf" : "\u25cb"} {label}
    </span>
  );

  return (
    <div
      style={{
        position: "fixed",
        bottom: 4,
        left: 40,
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

function DiagnosticsTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      title="Diagnostics"
      style={{
        position: "fixed",
        bottom: 72,
        left: 8,
        zIndex: 9997,
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: "rgba(0,20,30,0.7)",
        border: "1px solid rgba(0,180,220,0.3)",
        color: "rgba(0,180,220,0.6)",
        fontSize: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        backdropFilter: "blur(4px)",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      \u25c8
    </button>
  );
}

export default function TacticalStage() {
  const [diagOpen, setDiagOpen] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  // Use a ref so the timeout closure doesn't close over stale state
  const sceneReadyRef = useRef(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("[TacticalStage] mounted");
    // Hard failsafe: if Canvas never fires first frame within 5s, release overlay
    const t = setTimeout(() => {
      if (!sceneReadyRef.current) {
        console.warn(
          "[TacticalStage] Canvas first-frame timeout — releasing boot overlay",
        );
        sceneReadyRef.current = true;
        setSceneReady(true);
      }
    }, 5000);
    return () => clearTimeout(t);
  }, []);

  const handleSceneReady = () => {
    if (sceneReadyRef.current) return;
    sceneReadyRef.current = true;
    setSceneReady(true);
  };

  useEffect(() => {
    const t = setTimeout(() => {
      useEnemyStore.getState().triggerSessionCinematic();
    }, 2000);
    return () => clearTimeout(t);
  }, []);

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
      <DegradationTicker />
      <CoreLoopDebug />

      {/* Main viewport */}
      <div
        ref={viewportRef}
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          minHeight: "40vh",
          backgroundImage:
            "url('/assets/generated/space-background-deep.dim_1920x1080.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: "#000015",
        }}
      >
        {/* Boot overlay — fades once Canvas fires its first frame */}
        <BootFadeOverlay visible={!sceneReady} />
        <HostileContactCinematic viewportRef={viewportRef} />

        <HudErrorBoundary name="StatusBar">
          <PortraitStatusBar />
        </HudErrorBoundary>

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
            opacity: 0.7,
          }}
        />

        <GlobeErrorBoundary>
          <Canvas
            style={{ position: "absolute", inset: 0, zIndex: 1 }}
            camera={{ fov: 55, near: 0.1, far: 200, position: [0, 0.9, 5] }}
            gl={{ antialias: true, alpha: true }}
            dpr={DPR}
            onCreated={(state) => {
              console.log("[Canvas] WebGL context created ✔");
              console.log(
                "[Canvas] Size:",
                state.size.width,
                "x",
                state.size.height,
              );
            }}
          >
            <CameraController />
            <SpaceBackground />
            <EarthGlobe />
            <ThreatManager />
            <EnemyTargetsLayer />
            <IncomingFireLayer />
            <CombatEffectsLayer />
            <SceneBootConfirm onConfirm={handleSceneReady} />
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
            opacity: 0.15,
            pointerEvents: "none",
            zIndex: 3,
          }}
        />

        <ShipMotionLayer factor={0.55} zIndex={15} leanMult={1}>
          <CockpitFrame />
          <UpperCanopy />
        </ShipMotionLayer>

        <HudErrorBoundary name="ShieldHUD">
          <PlayerShieldHUD />
        </HudErrorBoundary>

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

        <HudErrorBoundary name="Radar">
          <RadarSystem />
        </HudErrorBoundary>
        <MobileJoystick />
        <RightDragZone />

        <PlayerHitFlash />
      </div>

      {/* Weapon console + hologram */}
      <div style={{ position: "relative", width: "100%", flexShrink: 0 }}>
        <HudErrorBoundary name="Hologram">
          <WeaponHologramLayer />
        </HudErrorBoundary>
        <WeaponConsole />
      </div>

      <BottomCommandNav />

      <PortraitCommandDrawer />
      <TacticalLogPanel />
      <TutorialOverlay />

      <DiagnosticsTrigger onOpen={() => setDiagOpen((v) => !v)} />
      {diagOpen && (
        <div
          style={{
            position: "fixed",
            bottom: 72,
            left: 44,
            zIndex: 9998,
            width: "min(340px, 90vw)",
            maxHeight: "60vh",
            overflow: "auto",
            background: "rgba(0,5,15,0.95)",
            border: "1px solid rgba(0,180,220,0.3)",
            borderRadius: 6,
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 12px",
              borderBottom: "1px solid rgba(0,150,200,0.2)",
            }}
          >
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 9,
                letterSpacing: "0.2em",
                color: "rgba(0,200,255,0.8)",
              }}
            >
              DIAGNOSTICS
            </span>
            <button
              type="button"
              onClick={() => setDiagOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "rgba(0,180,220,0.6)",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              \u00d7
            </button>
          </div>
          <QaPanel />
        </div>
      )}

      <style>{`
        @keyframes hitPulse {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
