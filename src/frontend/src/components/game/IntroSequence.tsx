import { useEffect } from "react";
import { useGameState } from "../../state/useGameState";

export default function IntroSequence() {
  const setMode = useGameState((s) => s.setMode);

  useEffect(() => {
    console.log("[GameMode] IntroSequence mounted — mode: intro");
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000010",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 24,
        fontFamily: "monospace",
        zIndex: 200,
      }}
    >
      <div
        style={{
          color: "rgba(0,200,255,0.6)",
          letterSpacing: "0.4em",
          fontSize: "clamp(10px,1.5vw,14px)",
        }}
      >
        INTRO SEQUENCE
      </div>
      <div
        style={{
          color: "rgba(0,150,200,0.4)",
          fontSize: "clamp(8px,1vw,11px)",
          letterSpacing: "0.2em",
        }}
      >
        [PLACEHOLDER — CINEMATIC NOT YET BUILT]
      </div>
      <button
        type="button"
        data-ocid="intro.confirm_button"
        onClick={() => {
          console.log("[GameMode] ENTER GAME clicked → game");
          setMode("game");
        }}
        style={{
          marginTop: 16,
          padding: "10px 28px",
          background: "transparent",
          border: "1px solid rgba(0,180,220,0.4)",
          color: "rgba(0,200,255,0.7)",
          fontFamily: "monospace",
          fontSize: "clamp(9px,1vw,11px)",
          letterSpacing: "0.18em",
          cursor: "pointer",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        ENTER GAME
      </button>
    </div>
  );
}
