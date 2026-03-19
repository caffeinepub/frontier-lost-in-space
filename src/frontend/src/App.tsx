import { useEffect, useRef } from "react";
import TacticalStage from "./TacticalStage";
import CinematicIntro from "./intro/CinematicIntro";
import { useIntroStore } from "./intro/useIntroStore";

/**
 * App — Section 1: First-run / new-game gating
 *
 * Flow:
 *   First launch  → introComplete===false → play CinematicIntro → TacticalStage
 *   Returning     → introComplete===true  → skip directly to TacticalStage
 *   New Game      → triggerNewGame() resets introComplete, plays again
 *   Replay Intro  → replayIntro() sets introPlaying without resetting progress
 *
 * After intro completes/skips, pendingTutorialStart=true is left in the
 * intro store for Section 2 (Tutorial) to read and act on.
 */
export default function App() {
  const introPlaying = useIntroStore((s) => s.introPlaying);
  const introComplete = useIntroStore((s) => s.introComplete);
  const initIntroGating = useIntroStore((s) => s.initIntroGating);
  const initRef = useRef(false);

  // Decide whether to show intro — run exactly once on mount
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    initIntroGating();
  }, [initIntroGating]);

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
        {/*
         * Cinematic intro — full-screen, z-index 9999.
         * Fades out and sets introComplete=true when done.
         */}
        {introPlaying && <CinematicIntro />}

        {/*
         * Main game — mounts once intro is complete (or was already complete).
         * Section 2 (Tutorial) reads useIntroStore.pendingTutorialStart
         * from inside TacticalStage to start the guided onboarding.
         */}
        {!introPlaying && introComplete && <TacticalStage />}
      </div>
    </>
  );
}
