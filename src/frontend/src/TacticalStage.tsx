/**
 * TacticalStage — Main game view.
 *
 * V48 — FULL-SCREEN GLOBE + OVERLAY CONTROLS (mobile game pattern)
 *
 * Layout inspired by top mobile games (PUBG Mobile, COD Mobile, Fortnite):
 * - Globe fills 100% of the screen — no side panel stealing space
 * - All controls are semi-transparent overlays anchored to screen edges
 * - Fire/weapon console: bottom-right overlay
 * - CEP panel: left edge (existing, already absolute)
 * - Velocity/Radar: bottom-left + top-right (existing, already absolute)
 * - NavigationModeHUD: top-center (existing)
 *
 * CLICK FIX (V48):
 * - GameBootstrap forces tacticalLock on init so targeting is always active
 * - EarthGlobe click handler auto-transitions orbitObservation → tacticalLock
 *   BEFORE the gate check (previously the auto-transition was after the early
 *   return, so it never fired)
 *
 * SAFE AREA: padding-right uses env(safe-area-inset-right) for iPhone notches.
 * SCALING: controls scale via clamp() — no fixed px sizes that break on mobile.
 */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { useAlertsStore } from "./alerts/useAlertsStore";
import CEPHudAlert from "./cep/CEPHudAlert";
import CEPSystemController from "./cep/CEPSystemController";
import { useCEPStore } from "./cep/useCEPStore";
import { useEnemyStore } from "./combat/useEnemyStore";
import { usePlayerStore } from "./combat/usePlayerStore";
import { useWeaponsStore } from "./combat/useWeapons";
import { HostileContactCinematic } from "./components/cinematics/HostileContactCinematic";
import InteractionDebugShell from "./components/debug/InteractionDebugShell";
import CEPStatusPanel from "./components/game/CEPStatusPanel";
import CameraController from "./components/game/CameraController";
import CockpitFrame from "./components/game/CockpitFrame";
import CombatEffectsLayer from "./components/game/CombatEffectsLayer";
import EarthGlobe from "./components/game/EarthGlobe";
import EnemyTargetsLayer from "./components/game/EnemyTargetsLayer";
import { GlobeErrorBoundary } from "./components/game/GlobeErrorBoundary";
import { HudErrorBoundary } from "./components/game/HudErrorBoundary";
import IncomingFireLayer from "./components/game/IncomingFireLayer";
import InputLayerDebug from "./components/game/InputLayerDebug";
import NarrativeEventPanel from "./components/game/NarrativeEventPanel";
import NavigationModeHUD from "./components/game/NavigationModeHUD";
import PillControlOverlay from "./components/game/PillControlOverlay";
import PlayerShieldHUD from "./components/game/PlayerShieldHUD";
import PortraitCommandDrawer from "./components/game/PortraitCommandDrawer";
import PortraitStatusBar from "./components/game/PortraitStatusBar";
import QaPanel from "./components/game/QaPanel";
import RadarSystem from "./components/game/RadarSystem";
import ShipMotionLayer from "./components/game/ShipMotionLayer";
import SpaceBackground from "./components/game/SpaceBackground";
import TacticalLogPanel from "./components/game/TacticalLogPanel";
import ThreatManager from "./components/game/ThreatManager";
import TutorialOverlay from "./components/game/TutorialOverlay";
import UpperCanopy from "./components/game/UpperCanopy";
import VelocityIndicator from "./components/game/VelocityIndicator";
import { useIsLandscape } from "./hooks/useIsLandscape";
import { useTacticalStore } from "./hooks/useTacticalStore";
import { runInteractionAssertions } from "./interaction/interactionAssertions";
import { useIntroStore } from "./intro/useIntroStore";
import { useShipMovementSetup } from "./motion/useShipMovementSetup";
import { useNarrativeStore } from "./narrative/useNarrativeStore";
import { globalNavMode } from "./navigation/NavigationModeController";
import { useShipSystemsStore } from "./systems/useShipSystemsStore";
import { useTacticalLogStore } from "./tacticalLog/useTacticalLogStore";
import TutorialPromptModal from "./tutorial/TutorialPromptModal";
import { useTutorialStore } from "./tutorial/useTutorialStore";
import { bootTrace } from "./utils/bootTrace";

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

function GameBootstrap() {
  useShipMovementSetup();
  useEffect(() => {
    console.log("[TacticalStage] GameBootstrap mounted — seeding stores");
    const add = useTacticalLogStore.getState().addEntry;
    add({ type: "system", message: "A.E.G.I.S. TACTICAL COMMAND ONLINE" });
    add({ type: "system", message: "ALL SYSTEMS NOMINAL" });
    add({ type: "system", message: "ORBITAL THREATS DETECTED — ENGAGE" });
    useAlertsStore.getState().seedDegradationAlerts();

    // V48 FIX: Force tacticalLock on game start so globe targeting is always active.
    // orbitObservation has targetingEnabled:false which was blocking all globe taps.
    globalNavMode.forceMode(
      "tacticalLock",
      "game init — targeting always active",
    );
    console.log("[NAV-MODE] Session initialized — forced to tacticalLock");
  }, []);
  return null;
}

function NarrativeController() {
  const cepLevel = useCEPStore((s) => s.level);
  const tutorialActive = useTutorialStore((s) => s.tutorialActive);
  const tutorialComplete = useTutorialStore((s) => s.tutorialComplete);
  const tutorialSkipped = useTutorialStore((s) => s.tutorialSkipped);
  const tutorialDone = tutorialComplete || tutorialSkipped;
  const firedFirstContact = useRef(false);
  const firedCepWarning = useRef(false);
  const firedRevelation = useRef(false);

  useEffect(() => {
    if (tutorialActive) return;
    if (firedFirstContact.current) return;
    const delay = tutorialDone ? 1500 : 5000;
    const t = setTimeout(() => {
      if (firedFirstContact.current) return;
      if (useTutorialStore.getState().tutorialActive) return;
      firedFirstContact.current = true;
      useNarrativeStore.getState().triggerEvent("phase1_first_contact");
    }, delay);
    return () => clearTimeout(t);
  }, [tutorialActive, tutorialDone]);

  useEffect(() => {
    if (cepLevel >= 2 && !firedCepWarning.current && !tutorialActive) {
      firedCepWarning.current = true;
      useNarrativeStore.getState().triggerEvent("phase1_cep_warning");
    }
  }, [cepLevel, tutorialActive]);

  useEffect(() => {
    if (cepLevel >= 4 && !firedRevelation.current && !tutorialActive) {
      firedRevelation.current = true;
      useNarrativeStore.getState().triggerEvent("phase1_aegis_revelation");
    }
  }, [cepLevel, tutorialActive]);

  return null;
}

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
      {ok ? "●" : "○"} {label}
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
        bottom: 80,
        right: 8,
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
      ◈
    </button>
  );
}

/** Portrait-only gate */
function RotateToPlayGate() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#000008",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
      }}
    >
      <span
        style={{
          fontSize: 64,
          color: "rgba(0,200,255,0.7)",
          lineHeight: 1,
          userSelect: "none",
          display: "inline-block",
          animation: "rotatePrompt 2.4s ease-in-out infinite",
        }}
      >
        &#x21BB;
      </span>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 18,
            letterSpacing: "0.3em",
            color: "rgba(0,200,255,0.85)",
            userSelect: "none",
          }}
        >
          ROTATE TO PLAY
        </span>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 11,
            color: "rgba(0,200,255,0.4)",
            letterSpacing: "0.15em",
            userSelect: "none",
          }}
        >
          Frontier requires landscape orientation
        </span>
      </div>
      <style>{`
        @keyframes rotatePrompt {
          0%   { transform: rotate(0deg);   opacity: 0.7; }
          40%  { transform: rotate(90deg);  opacity: 1;   }
          60%  { transform: rotate(90deg);  opacity: 1;   }
          100% { transform: rotate(90deg);  opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

/** Inner component — only renders when landscape is confirmed */
function TacticalStageInner() {
  const [diagOpen, setDiagOpen] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const sceneReadyRef = useRef(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  const tutorialComplete = useTutorialStore((s) => s.tutorialComplete);
  const tutorialSkipped = useTutorialStore((s) => s.tutorialSkipped);
  const pendingTutorialStart = useIntroStore((s) => s.pendingTutorialStart);
  const consumeTutorialStart = useIntroStore((s) => s.consumeTutorialStart);
  const [showTutorialPrompt, setShowTutorialPrompt] = useState(false);
  const promptDecidedRef = useRef(false);

  useEffect(() => {
    if (promptDecidedRef.current) return;
    if (tutorialComplete || tutorialSkipped) {
      if (pendingTutorialStart) consumeTutorialStart();
      return;
    }
    const t = setTimeout(() => {
      if (promptDecidedRef.current) return;
      promptDecidedRef.current = true;
      if (pendingTutorialStart) {
        consumeTutorialStart();
        useTutorialStore.getState().startTutorial();
      } else {
        setShowTutorialPrompt(true);
      }
    }, 1200);
    return () => clearTimeout(t);
  }, [
    tutorialComplete,
    tutorialSkipped,
    pendingTutorialStart,
    consumeTutorialStart,
  ]);

  useEffect(() => {
    bootTrace("TacticalStage mounted");
    console.log("[TacticalStage] mounted");
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

  useEffect(() => {
    const t = setTimeout(() => {
      const results = runInteractionAssertions();
      const fails = results.filter((r) => !r.pass).length;
      const warns = results.filter((r) => r.pass && r.warn).length;
      for (const result of results) {
        if (!result.pass)
          console.error(`[TRIPWIRE] FAIL — ${result.name}: ${result.reason}`);
        else if (result.warn)
          console.warn(`[TRIPWIRE] WARN — ${result.name}: ${result.reason}`);
        else console.log(`[TRIPWIRE] PASS — ${result.name}: ${result.reason}`);
      }
      console.log(
        `[TRIPWIRE] Summary: ${results.length - fails - warns} PASS / ${warns} WARN / ${fails} FAIL`,
      );
    }, 1500);
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
        // Root container — full screen, no overflow
        position: "relative",
        width: "100vw",
        height: "100dvh",
        overflow: "hidden",
        background: "#000008",
      }}
    >
      {/* Non-rendering game systems */}
      <GameBootstrap />
      <WeaponsTick />
      <DegradationTicker />
      <CEPSystemController />
      <NarrativeController />
      <CEPHudAlert />

      {/* ── FULL-SCREEN GLOBE VIEWPORT ─────────────────────────────────── */}
      {/*
       * The globe fills the entire screen. All controls are overlaid on top.
       * This matches the mobile game pattern: PUBG Mobile / COD Mobile where
       * the game world takes 100% of screen real-estate.
       */}
      <div
        ref={viewportRef}
        data-layer="viewport"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "url('/assets/generated/space-background-deep.dim_1920x1080.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: "#000015",
        }}
      >
        <BootFadeOverlay visible={!sceneReady} />
        <HostileContactCinematic viewportRef={viewportRef} />

        <HudErrorBoundary name="StatusBar">
          <PortraitStatusBar />
        </HudErrorBoundary>

        {/* Globe Canvas — fills entire viewport */}
        <GlobeErrorBoundary>
          <Canvas
            data-layer="globe-canvas"
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

        {/* Invisible tutorial target zone — centered on globe */}
        <div
          data-tutorial-target="globe-area"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(70vw, 70vh)",
            height: "min(70vw, 70vh)",
            borderRadius: "50%",
            zIndex: 2,
            pointerEvents: "none",
          }}
        />

        {/* Cockpit HUD overlay texture — very subtle scanline/vignette */}
        <img
          src="/assets/generated/cockpit-hud-overlay-transparent.dim_1920x1080.png"
          alt=""
          aria-hidden
          data-layer="hud-decoration"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            mixBlendMode: "screen",
            opacity: 0.06,
            pointerEvents: "none",
            zIndex: 3,
          }}
        />

        {/* Navigation mode — top-center */}
        <NavigationModeHUD />

        {/* Cockpit frame overlay — decorative, pointer-events none */}
        <ShipMotionLayer
          factor={0.55}
          zIndex={15}
          leanMult={1}
          style={{ pointerEvents: "none" }}
        >
          <CockpitFrame />
          <UpperCanopy />
        </ShipMotionLayer>

        {/* CEP — left edge (existing absolute positioning preserved) */}
        <CEPStatusPanel />

        {/* Shield HUD — top area */}
        <HudErrorBoundary name="ShieldHUD">
          <PlayerShieldHUD />
        </HudErrorBoundary>

        {/* Velocity indicator — bottom-left */}
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

        {/* Radar — top-right (gives space for weapon console bottom-right) */}
        <HudErrorBoundary name="Radar">
          <RadarSystem />
        </HudErrorBoundary>

        <PlayerHitFlash />
      </div>

      {/* ── OVERLAID CONTROLS ─────────────────────────────────────────── */}
      {/*
       * Controls float above the globe as semi-transparent overlays.
       * This is the standard pattern in top mobile games.
       * pointer-events only active on interactive elements inside.
       */}

      {/* Weapon + fire console — bottom-right overlay */}
      <PillControlOverlay />

      {/* Narrative event panel — center overlay */}
      <NarrativeEventPanel />

      {/* Drawer + log — existing components */}
      <PortraitCommandDrawer />
      <TacticalLogPanel />
      <TutorialOverlay />

      {showTutorialPrompt && (
        <TutorialPromptModal
          onClose={() => {
            promptDecidedRef.current = true;
            setShowTutorialPrompt(false);
          }}
        />
      )}

      <DiagnosticsTrigger onOpen={() => setDiagOpen((v) => !v)} />
      {diagOpen && (
        <div
          style={{
            position: "fixed",
            bottom: 116,
            right: 44,
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
              ×
            </button>
          </div>
          <QaPanel />
        </div>
      )}

      <InputLayerDebug />
      <InteractionDebugShell />
      <CoreLoopDebug />

      <style>{`
        @keyframes hitPulse {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function TacticalStage() {
  const isLandscape = useIsLandscape();
  if (!isLandscape) return <RotateToPlayGate />;
  return <TacticalStageInner />;
}
