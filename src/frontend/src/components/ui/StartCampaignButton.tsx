import { useGameState } from "../../state/useGameState";

export default function StartCampaignButton() {
  const setMode = useGameState((s) => s.setMode);

  const handleStart = () => {
    console.log("[GameMode] START CAMPAIGN clicked → intro");
    setMode("intro");
  };

  return (
    <button
      type="button"
      data-ocid="menu.primary_button"
      onClick={handleStart}
      style={{
        position: "absolute",
        bottom: "40%",
        left: "50%",
        transform: "translateX(-50%)",
        padding: "14px 36px",
        fontSize: "clamp(12px, 1.4vw, 16px)",
        letterSpacing: "3px",
        background: "rgba(0,0,0,0.7)",
        border: "1px solid rgba(0,220,255,0.7)",
        color: "#00e0ff",
        cursor: "pointer",
        fontFamily: "monospace",
        zIndex: 100,
        whiteSpace: "nowrap",
        WebkitTapHighlightColor: "transparent",
        transition: "background 0.2s, border-color 0.2s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          "rgba(0,220,255,0.1)";
        (e.currentTarget as HTMLButtonElement).style.borderColor =
          "rgba(0,220,255,1)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          "rgba(0,0,0,0.7)";
        (e.currentTarget as HTMLButtonElement).style.borderColor =
          "rgba(0,220,255,0.7)";
      }}
    >
      START CAMPAIGN
    </button>
  );
}
