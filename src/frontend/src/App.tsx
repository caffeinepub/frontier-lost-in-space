import { Component, type ReactNode, useEffect, useRef, useState } from "react";
import TacticalStage from "./TacticalStage";
import IntroSequence from "./components/game/IntroSequence";
import StartCampaignButton from "./components/ui/StartCampaignButton";
import CinematicIntro from "./intro/CinematicIntro";
import { useIntroStore } from "./intro/useIntroStore";
import { useGameState } from "./state/useGameState";

// Pre-computed star positions for the menu background (stable keys)
const MENU_STARS = Array.from({ length: 120 }, (_, i) => ({
  id: `s${i.toString().padStart(3, "0")}`,
  cx: (i * 137.508) % 100,
  cy: (i * 97.324) % 100,
  r: (0.1 + ((i * 3.7) % 0.25)).toFixed(3),
  opacity: (0.2 + ((i * 0.42) % 0.6)).toFixed(2),
}));

// ─── Root error boundary ──────────────────────────────────────────────────────
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

// ─── Boot screen ──────────────────────────────────────────────────────────────
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

// ─── Debug mode badge ─────────────────────────────────────────────────────────
function GameModeDebug({ mode }: { mode: string }) {
  if (typeof localStorage === "undefined") return null;
  if (localStorage.getItem("debug_gamemode") !== "1") return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 8,
        left: 8,
        fontFamily: "monospace",
        fontSize: 10,
        color: "rgba(0,220,255,0.5)",
        background: "rgba(0,0,0,0.5)",
        padding: "2px 6px",
        borderRadius: 2,
        pointerEvents: "none",
        zIndex: 99999,
        letterSpacing: "0.1em",
      }}
    >
      [GAME MODE: {mode}]
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const introPlaying = useIntroStore((s) => s.introPlaying);
  const introComplete = useIntroStore((s) => s.introComplete);
  const initIntroGating = useIntroStore((s) => s.initIntroGating);
  const mode = useGameState((s) => s.mode);
  const initRef = useRef(false);
  const [storeReady, setStoreReady] = useState(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    console.log("[App] Boot — initialising intro gating");
    initIntroGating();
    setStoreReady(true);

    // Safety net: if after 600ms neither flag is set, force to game
    setTimeout(() => {
      const state = useIntroStore.getState();
      if (!state.introPlaying && !state.introComplete) {
        console.warn("[App] Safety fallback: bypassing intro (stuck state)");
        state.skipIntro();
      }
    }, 600);
  }, [initIntroGating]);

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
        {/* Existing CinematicIntro gate — preserved unchanged */}
        {introPlaying && <CinematicIntro />}

        {/* Mode-based routing — only active when legacy intro is NOT playing */}
        {!introPlaying && (
          <>
            {/* MENU — show title + START CAMPAIGN button */}
            {mode === "menu" && (
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "100dvh",
                  background: "#000010",
                }}
              >
                {/* Deep-space star field (lightweight SVG) */}
                <svg
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                  }}
                  viewBox="0 0 100 100"
                  preserveAspectRatio="xMidYMid slice"
                >
                  {MENU_STARS.map((s) => (
                    <circle
                      key={s.id}
                      cx={s.cx}
                      cy={s.cy}
                      r={s.r}
                      fill="white"
                      opacity={s.opacity}
                    />
                  ))}
                </svg>

                {/* FRONTIER title */}
                <div
                  style={{
                    position: "absolute",
                    top: "30%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontFamily: "monospace",
                    color: "rgba(0,200,255,0.25)",
                    letterSpacing: "0.5em",
                    fontSize: "clamp(14px,2vw,22px)",
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                  }}
                >
                  FRONTIER
                </div>
                <div
                  style={{
                    position: "absolute",
                    top: "calc(30% + 40px)",
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontFamily: "monospace",
                    color: "rgba(0,150,200,0.15)",
                    letterSpacing: "0.3em",
                    fontSize: "clamp(8px,1vw,11px)",
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                  }}
                >
                  LOST IN SPACE
                </div>

                <StartCampaignButton />
              </div>
            )}

            {/* INTRO — placeholder sequence */}
            {mode === "intro" && <IntroSequence />}

            {/* GAME — full tactical stage (existing path) */}
            {mode === "game" && (
              <GameRootErrorBoundary>
                <TacticalStage />
              </GameRootErrorBoundary>
            )}

            {/* Returning player path: introComplete but still on menu → stay in menu */}
            {/* When introComplete is true and mode hasn't been advanced yet, */}
            {/* the player sees the menu as normal. */}
            {introComplete && mode === "game" && null /* handled above */}
          </>
        )}
      </div>

      <GameModeDebug mode={mode} />
    </>
  );
}
