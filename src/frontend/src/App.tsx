import { Component, type ReactNode, useEffect, useRef, useState } from "react";
import TacticalStage from "./TacticalStage";
import CinematicIntro from "./intro/CinematicIntro";
import { useIntroStore } from "./intro/useIntroStore";

// ─── Root error boundary ──────────────────────────────────────────────────────
// Catches any thrown error in TacticalStage or its subtree so a React crash
// never leaves the user staring at a silent black page.
interface EBState {
  hasError: boolean;
  message: string;
}
class GameRootErrorBoundary extends Component<
  { children: ReactNode },
  EBState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }
  static getDerivedStateFromError(err: unknown): EBState {
    console.error("[GameRootErrorBoundary] caught:", err);
    return { hasError: true, message: String(err).slice(0, 200) };
  }
  override render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#000810",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "monospace",
            color: "rgba(0,200,255,0.7)",
            zIndex: 99999,
          }}
        >
          <div
            style={{
              fontSize: "clamp(10px,1.5vw,14px)",
              letterSpacing: "0.2em",
              marginBottom: 12,
            }}
          >
            A.E.G.I.S. — SYSTEM FAULT
          </div>
          <div
            style={{
              fontSize: "clamp(8px,1vw,10px)",
              color: "rgba(255,100,100,0.6)",
              maxWidth: "80vw",
              textAlign: "center",
            }}
          >
            {this.state.message}
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: 24,
              padding: "8px 24px",
              background: "transparent",
              border: "1px solid rgba(0,180,220,0.4)",
              borderRadius: 4,
              color: "rgba(0,200,255,0.8)",
              fontFamily: "monospace",
              fontSize: "clamp(9px,1.1vw,11px)",
              letterSpacing: "0.18em",
              cursor: "pointer",
            }}
          >
            REBOOT SYSTEM
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Boot screen shown while zustand store is hydrating ───────────────────────
// Prevents a blank frame being visible before the store resolves.
function BootScreen() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000008",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "monospace",
        fontSize: "clamp(8px,1.1vw,11px)",
        letterSpacing: "0.25em",
        color: "rgba(0,180,220,0.35)",
        zIndex: 99998,
        pointerEvents: "none",
      }}
    >
      INITIALIZING
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const introPlaying = useIntroStore((s) => s.introPlaying);
  const introComplete = useIntroStore((s) => s.introComplete);
  const initIntroGating = useIntroStore((s) => s.initIntroGating);
  const initRef = useRef(false);

  // Track whether the intro store has been initialised yet.
  // This prevents the 1-frame black flash before the useEffect fires.
  const [storeReady, setStoreReady] = useState(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    console.log("[App] Boot — initialising intro gating");
    initIntroGating();
    setStoreReady(true);

    // Safety net: if after 600 ms neither flag is set, force to game
    setTimeout(() => {
      const state = useIntroStore.getState();
      if (!state.introPlaying && !state.introComplete) {
        console.warn("[App] Safety fallback: bypassing intro (stuck state)");
        state.skipIntro();
      }
    }, 600);
  }, [initIntroGating]);

  // Don't render anything until the effect has run (avoids blank 1st frame)
  if (!storeReady) return <BootScreen />;

  return (
    <>
      <style>{`
        html, body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          width: 100%;
          height: 100%;
          background: #000008;
          overscroll-behavior: none;
          touch-action: none;
        }
        #root {
          width: 100%;
          height: 100%;
        }
      `}</style>

      <div
        style={{
          width: "100%",
          height: "100dvh",
          overflow: "hidden",
          background: "#000008",
          boxSizing: "border-box" as const,
          position: "relative",
        }}
      >
        {introPlaying && <CinematicIntro />}

        {!introPlaying && introComplete && (
          <GameRootErrorBoundary>
            <TacticalStage />
          </GameRootErrorBoundary>
        )}
      </div>
    </>
  );
}
