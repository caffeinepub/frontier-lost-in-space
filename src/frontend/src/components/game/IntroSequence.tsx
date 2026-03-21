/**
 * IntroSequence.tsx
 * BUG FIX: background changed from solid #000010 to rgba(0,0,16,0.65)
 * so TacticalStage (cockpit) shows through underneath.
 * V38: Added console.log('[GameState]') at render time.
 * V38: Added default unmatched-state fallback to prevent blank screen.
 * V39: Added auto-transition when introSequenceComplete = true.
 *      When all 15 narrative events are dismissed, automatically
 *      transitions to game mode after 3s countdown.
 */
import { useEffect, useRef, useState } from "react";
import { useIntroEventEngine } from "../../intro/useIntroEventEngine";
import { useIntroPhaseStore } from "../../intro/useIntroPhaseStore";
import { useGameState } from "../../state/useGameState";
import { bootTrace } from "../../utils/bootTrace";
import IntroPhaseController from "./IntroPhaseController";
import NarrativeEventPanel from "./NarrativeEventPanel";

export default function IntroSequence() {
  const currentPhase = useIntroPhaseStore((s) => s.currentPhase);
  const phaseComplete = useIntroPhaseStore((s) => s.phaseComplete);
  const introSequenceComplete = useIntroEventEngine(
    (s) => s.introSequenceComplete,
  );
  const mode = useGameState((s) => s.mode);
  const setMode = useGameState((s) => s.setMode);

  // ── Auto-launch countdown when narrative sequence completes ──────────────
  const [autoLaunchCountdown, setAutoLaunchCountdown] = useState<number | null>(
    null,
  );
  const autoLaunchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  useEffect(() => {
    bootTrace("IntroSequence mounted");
    // Trigger auto-launch when narrative sequence finishes but mode hasn't changed yet
    if (!introSequenceComplete || mode !== "intro") {
      // Clean up if mode changed before countdown finished
      if (autoLaunchRef.current) clearTimeout(autoLaunchRef.current);
      if (countdownIntervalRef.current)
        clearInterval(countdownIntervalRef.current);
      setAutoLaunchCountdown(null);
      return;
    }

    console.log("[FLOW] introSequenceComplete → auto-launching cockpit in 3s");

    // Start visible countdown
    setAutoLaunchCountdown(3);
    countdownIntervalRef.current = setInterval(() => {
      setAutoLaunchCountdown((c) => {
        if (c === null || c <= 1) {
          if (countdownIntervalRef.current)
            clearInterval(countdownIntervalRef.current);
          return null;
        }
        return c - 1;
      });
    }, 1000);

    // Auto-transition
    autoLaunchRef.current = setTimeout(() => {
      console.log(
        "[FLOW] introSequenceComplete auto-transition → setMode(game)",
      );
      setMode("game");
    }, 3000);

    return () => {
      if (autoLaunchRef.current) clearTimeout(autoLaunchRef.current);
      if (countdownIntervalRef.current)
        clearInterval(countdownIntervalRef.current);
    };
  }, [introSequenceComplete, mode, setMode]);

  // ── Guard: only render in intro mode ─────────────────────────────────────
  if (mode !== "intro") {
    console.log("[GameState] IntroSequence: mode is", mode, "— not rendering");
    return null;
  }

  const PHASE_ORDER = [
    "INTRO_DRIFT",
    "INTRO_SYSTEMS",
    "INTRO_RECOVERY",
    "INTRO_ANOMALY",
    "INTRO_HANDOFF",
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,16,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 20,
        fontFamily: "monospace",
        zIndex: 200,
      }}
    >
      <IntroPhaseController />

      <div
        style={{
          color: "rgba(0,200,255,0.55)",
          letterSpacing: "0.5em",
          fontSize: "clamp(9px, 1.3vw, 13px)",
        }}
      >
        FRONTIER
      </div>

      <div
        style={{
          color: "rgba(0,150,180,0.35)",
          fontSize: "clamp(7px, 0.9vw, 9px)",
          letterSpacing: "0.3em",
          minHeight: 14,
        }}
      >
        {phaseComplete
          ? "INITIALIZING TACTICAL SYSTEMS…"
          : currentPhase
            ? currentPhase.replace("INTRO_", "").replace("_", " ")
            : "BOOTING"}
      </div>

      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {PHASE_ORDER.map((phase) => {
          const isActive = currentPhase === phase;
          const isDone =
            currentPhase !== null &&
            PHASE_ORDER.indexOf(currentPhase) > PHASE_ORDER.indexOf(phase);
          return (
            <div
              key={phase}
              style={{
                width: isActive ? 16 : 5,
                height: 3,
                borderRadius: 2,
                background: isActive
                  ? "rgba(0,200,220,0.7)"
                  : isDone
                    ? "rgba(0,160,180,0.4)"
                    : "rgba(0,80,100,0.25)",
                transition: "all 0.4s ease",
              }}
            />
          );
        })}
      </div>

      {/* Phase complete: transitioning banner */}
      {phaseComplete && (
        <div
          data-ocid="intro.phase_complete.panel"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            marginTop: 8,
          }}
        >
          <div
            style={{
              fontFamily: "monospace",
              fontSize: "clamp(8px, 1.1vw, 10px)",
              letterSpacing: "0.28em",
              color: "rgba(0,200,255,0.5)",
            }}
          >
            TACTICAL SYSTEMS ONLINE
          </div>
          <button
            type="button"
            data-ocid="intro.enter_cockpit.button"
            onClick={() => {
              console.log("[FLOW] Enter Cockpit → setMode(game)");
              setMode("game");
            }}
            style={{
              padding: "10px 28px",
              background: "rgba(0,30,55,0.85)",
              border: "1px solid rgba(0,200,255,0.5)",
              color: "rgba(0,220,255,0.9)",
              cursor: "pointer",
              fontFamily: "monospace",
              fontSize: "clamp(10px, 1.3vw, 12px)",
              letterSpacing: "0.25em",
              borderRadius: 3,
              minHeight: 44,
              transition: "background 0.15s, border-color 0.15s",
              WebkitTapHighlightColor: "transparent",
              boxShadow: "0 0 12px rgba(0,180,255,0.2)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(0,50,80,0.9)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(0,230,255,0.75)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(0,30,55,0.85)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(0,200,255,0.5)";
            }}
          >
            ENTER COCKPIT
          </button>
        </div>
      )}

      {/* Sequence-complete auto-launch banner — shown while countdown ticks */}
      {introSequenceComplete &&
        !phaseComplete &&
        autoLaunchCountdown !== null && (
          <div
            data-ocid="intro.sequence_complete.panel"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              marginTop: 8,
              animation: "introSeqIn 0.4s ease forwards",
            }}
          >
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "clamp(8px, 1.1vw, 10px)",
                letterSpacing: "0.28em",
                color: "rgba(0,255,136,0.6)",
              }}
            >
              BRIEFING COMPLETE
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "clamp(9px, 1.2vw, 11px)",
                letterSpacing: "0.22em",
                color: "rgba(0,200,255,0.7)",
              }}
            >
              LAUNCHING COCKPIT IN {autoLaunchCountdown}s
            </div>
            <button
              type="button"
              data-ocid="intro.sequence_complete.launch_button"
              onClick={() => {
                console.log("[FLOW] Manual launch → setMode(game)");
                setMode("game");
              }}
              style={{
                padding: "9px 22px",
                background: "rgba(0,30,55,0.85)",
                border: "1px solid rgba(0,200,255,0.45)",
                color: "rgba(0,210,255,0.85)",
                cursor: "pointer",
                fontFamily: "monospace",
                fontSize: "clamp(9px, 1.1vw, 11px)",
                letterSpacing: "0.22em",
                borderRadius: 3,
                minHeight: 40,
                WebkitTapHighlightColor: "transparent",
              }}
            >
              LAUNCH NOW
            </button>
          </div>
        )}

      {/* Default fallback: no phase loaded yet — prevents blank screen on stuck boot */}
      {!currentPhase && !phaseComplete && !introSequenceComplete && (
        <div
          data-ocid="intro.boot_fallback.panel"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            marginTop: 8,
          }}
        >
          <div
            style={{
              fontFamily: "monospace",
              fontSize: "clamp(8px, 1vw, 10px)",
              letterSpacing: "0.22em",
              color: "rgba(160,200,220,0.5)",
              textAlign: "center",
            }}
          >
            SELECT AN ACTION
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <button
              type="button"
              data-ocid="intro.boot_fallback.continue_button"
              onClick={() => {
                console.log("[FLOW] Boot fallback CONTINUE → setMode(game)");
                setMode("game");
              }}
              style={{
                padding: "9px 20px",
                background: "rgba(0,25,50,0.8)",
                border: "1px solid rgba(0,180,220,0.4)",
                color: "rgba(0,210,255,0.85)",
                cursor: "pointer",
                fontFamily: "monospace",
                fontSize: "clamp(9px, 1.1vw, 11px)",
                letterSpacing: "0.18em",
                borderRadius: 3,
                minHeight: 40,
                WebkitTapHighlightColor: "transparent",
              }}
            >
              CONTINUE
            </button>
            <button
              type="button"
              data-ocid="intro.boot_fallback.menu_button"
              onClick={() => {
                console.log("[FLOW] Boot fallback MAIN MENU → setMode(menu)");
                setMode("menu");
              }}
              style={{
                padding: "9px 20px",
                background: "transparent",
                border: "1px solid rgba(0,120,150,0.3)",
                color: "rgba(0,150,170,0.6)",
                cursor: "pointer",
                fontFamily: "monospace",
                fontSize: "clamp(9px, 1.1vw, 11px)",
                letterSpacing: "0.18em",
                borderRadius: 3,
                minHeight: 40,
                WebkitTapHighlightColor: "transparent",
              }}
            >
              MAIN MENU
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        data-ocid="intro.skip_button"
        onClick={() => {
          console.log("[FLOW] Skip intro → setMode(game)");
          setMode("game");
        }}
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          background: "transparent",
          border: "none",
          color: "rgba(0,140,160,0.28)",
          fontFamily: "monospace",
          fontSize: "clamp(7px, 0.9vw, 9px)",
          letterSpacing: "0.2em",
          cursor: "pointer",
          WebkitTapHighlightColor: "transparent",
          padding: "4px 8px",
        }}
      >
        SKIP INTRO
      </button>

      <NarrativeEventPanel />

      <style>{`
        @keyframes introSeqIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
