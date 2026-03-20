/**
 * TacticalStage — Main game view.
 *
 * V17.1: Landscape layout, pointer-events audit, InputLayerDebug.
 * V19:   InteractionDebugShell, runInteractionAssertions on mount.
 * V20:   Raycast + rendering fixes.
 *   - Removed cockpit-planet-tactical img.
 *     ROOT CAUSE OF STRIPE ARTIFACT: This AI-generated PNG has a hex-grid
 *     overlay and was positioned at zIndex:0 behind the Canvas (alpha:true).
 *     SpaceBackground renders stars/particles — it does not fill the entire
 *     canvas with a solid colour. The transparent canvas areas showed the
 *     tactical-planet grid through, creating vertical stripe / moiré patterns
 *     on top of the Three.js globe. Removed entirely; the Three.js EarthGlobe
 *     is the sole planet visual.
 *   - HUD overlay: added data-layer="hud-decoration" and reduced opacity 0.15→0.08.
 *     The generated HUD overlay contains scan lines. At 15% opacity with
 *     mixBlendMode:screen these appeared as additional stripes. Reduced.
 * V20 (Nav Mode):
 *   - NavigationModeHUD mounted in GlobeViewport (pointer-events:none overlay)
 *   - globalNavMode initialized to orbitObservation on GameBootstrap
 *   - Nav mode system sits ABOVE the interaction FSM; does NOT modify it
 */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { useAlertsStore } from "./alerts/useAlertsStore";
import { useEnemyStore } from "./combat/useEnemyStore";
import { usePlayerStore } from "./combat/usePlayerStore";
import { useWeaponsStore } from "./combat/useWeapons";
import { HostileContactCinematic } from "./components/cinematics/HostileContactCinematic";
import InteractionDebugShell from "./components/debug/InteractionDebugShell";
import BottomCommandNav from "./components/game/BottomCommandNav";
import CameraController from "./components/game/CameraController";
import CockpitFrame from "./components/game/CockpitFrame";
import CombatEffectsLayer from "./components/game/CombatEffectsLayer";
import EarthGlobe from "./components/game/EarthGlobe";
import EnemyTargetsLayer from "./components/game/EnemyTargetsLayer";
import { GlobeErrorBoundary } from "./components/game/GlobeErrorBoundary";
import { HudErrorBoundary } from "./components/game/HudErrorBoundary";
import IncomingFireLayer from "./components/game/IncomingFireLayer";
import InputLayerDebug from "./components/game/InputLayerDebug";
import MobileJoystick from "./components/game/MobileJoystick";
import NavigationModeHUD from "./components/game/NavigationModeHUD";
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
import WeaponGhostLayer from "./components/game/WeaponGhostLayer";
import WeaponHologramLayer from "./components/game/WeaponHologramLayer";
import { useIsLandscape } from "./hooks/useIsLandscape";
import { useTacticalStore } from "./hooks/useTacticalStore";
import { runInteractionAssertions } from "./interaction/interactionAssertions";
import { useIntroStore } from "./intro/useIntroStore";
import { useShipMovementSetup } from "./motion/useShipMovementSetup";
import { globalNavMode } from "./navigation/NavigationModeController";
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

    // Initialize navigation mode system
    // globalNavMode starts at orbitObservation by default (no forceMode needed)
    console.log(
      `[NAV-MODE] Session initialized — mode: ${globalNavMode.currentMode}`,
    );
  }, []);
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

function DiagnosticsTrigger({
  onOpen,
  isLandscape,
}: {
  onOpen: () => void;
  isLandscape: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      title="Diagnostics"
      style={{
        position: "fixed",
        bottom: isLandscape ? 80 : 72,
        left: isLandscape ? "auto" : 8,
        right: isLandscape ? 8 : "auto",
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

function GlobeViewport({
  viewportRef,
  sceneReady,
  handleSceneReady,
  isLandscape,
}: {
  viewportRef: React.RefObject<HTMLDivElement | null>;
  sceneReady: boolean;
  handleSceneReady: () => void;
  isLandscape: boolean;
}) {
  return (
    <div
      ref={viewportRef}
      data-layer="viewport"
      style={{
        flex: 1,
        position: "relative",
        overflow: "hidden",
        minHeight: isLandscape ? "unset" : "40vh",
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

      {/* Globe canvas — PRIMARY interaction target (no blocking overlays) */}
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

      {/* Globe area marker — no pointer interception */}
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

      {/*
       * HUD overlay — decoration only.
       * Opacity reduced 0.15 → 0.08: scan lines in image were visible as stripes.
       */}
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
          opacity: 0.08,
          pointerEvents: "none",
          zIndex: 3,
        }}
      />

      {/* Navigation Mode HUD — V20 — pointer-events:none, sits in viewport layer */}
      <NavigationModeHUD />

      {/* Cockpit frame + canopy — decoration, must not intercept globe taps */}
      <ShipMotionLayer
        factor={0.55}
        zIndex={15}
        leanMult={1}
        style={{ pointerEvents: "none" }}
      >
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

      <RightDragZone widthPct={isLandscape ? 50 : 58} />

      <PlayerHitFlash />
    </div>
  );
}

export default function TacticalStage() {
  const [diagOpen, setDiagOpen] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const sceneReadyRef = useRef(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const isLandscape = useIsLandscape();

  useEffect(() => {
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
      for (const result of results) {
        if (!result.pass) {
          console.error(
            `[TRIPWIRE] FAIL — ${result.name}: ${result.reason} (source: ${result.source})`,
          );
        } else if (result.warn) {
          console.warn(
            `[TRIPWIRE] WARN — ${result.name}: ${result.reason} (source: ${result.source})`,
          );
        } else {
          console.log(`[TRIPWIRE] PASS — ${result.name}: ${result.reason}`);
        }
      }
      const fails = results.filter((r) => !r.pass).length;
      const warns = results.filter((r) => r.pass && r.warn).length;
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
        width: "100%",
        height: "100dvh",
        display: "flex",
        flexDirection: isLandscape ? "row" : "column",
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

      {!isLandscape && (
        <>
          <GlobeViewport
            viewportRef={viewportRef}
            sceneReady={sceneReady}
            handleSceneReady={handleSceneReady}
            isLandscape={false}
          />
          <div style={{ position: "relative", width: "100%", flexShrink: 0 }}>
            <div style={{ pointerEvents: "none" }}>
              <HudErrorBoundary name="Hologram">
                <WeaponHologramLayer />
              </HudErrorBoundary>
            </div>
            <div style={{ position: "relative", pointerEvents: "none" }}>
              <WeaponGhostLayer />
            </div>
            <WeaponConsole />
          </div>
          <BottomCommandNav />
        </>
      )}

      {isLandscape && (
        <>
          <div
            style={{
              flex: "1.15",
              display: "flex",
              flexDirection: "column",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <GlobeViewport
              viewportRef={viewportRef}
              sceneReady={sceneReady}
              handleSceneReady={handleSceneReady}
              isLandscape={true}
            />
          </div>
          <div
            style={{
              flex: "0.75",
              display: "flex",
              flexDirection: "column",
              background: "rgba(0,3,12,0.97)",
              borderLeft: "1px solid rgba(0,200,255,0.12)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div style={{ pointerEvents: "none", flexShrink: 0 }}>
              <HudErrorBoundary name="Hologram">
                <WeaponHologramLayer />
              </HudErrorBoundary>
            </div>
            <div
              style={{
                position: "relative",
                pointerEvents: "none",
                flexShrink: 0,
              }}
            >
              <WeaponGhostLayer />
            </div>
            <div style={{ flexShrink: 0 }}>
              <WeaponConsole />
            </div>
            <div style={{ marginTop: "auto" }}>
              <BottomCommandNav />
            </div>
          </div>
        </>
      )}

      <MobileJoystick />
      <PortraitCommandDrawer />
      <TacticalLogPanel />
      <TutorialOverlay />

      <DiagnosticsTrigger
        onOpen={() => setDiagOpen((v) => !v)}
        isLandscape={isLandscape}
      />
      {diagOpen && (
        <div
          style={{
            position: "fixed",
            bottom: isLandscape ? 116 : 72,
            left: isLandscape ? "auto" : 44,
            right: isLandscape ? 44 : "auto",
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

      <InputLayerDebug />
      <InteractionDebugShell />

      <style>{`
        @keyframes hitPulse {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
