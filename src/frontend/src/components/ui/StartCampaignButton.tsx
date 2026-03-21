import { useIntroStore } from "../../intro/useIntroStore";

export default function StartCampaignButton() {
  const triggerNewGame = useIntroStore((s) => s.triggerNewGame);

  const handleStart = () => {
    console.log("[GameMode] START HERE clicked → triggerNewGame()");
    const overlay = document.getElementById("fade-overlay");
    if (overlay) {
      overlay.style.opacity = "1";
    }
    setTimeout(() => {
      triggerNewGame(); // sets introPlaying: true — CinematicIntro will mount
      // Fade the overlay back out so the cinematic is visible
      setTimeout(() => {
        const el = document.getElementById("fade-overlay");
        if (el) el.style.opacity = "0";
      }, 80);
    }, 900);
  };

  return (
    <button
      type="button"
      data-ocid="menu.primary_button"
      onClick={handleStart}
      style={{
        marginTop: "28px",
        padding: "14px 40px",
        fontSize: "clamp(12px, 1.4vw, 15px)",
        letterSpacing: "4px",
        background: "rgba(0,0,0,0.65)",
        border: "1px solid rgba(0,220,255,0.7)",
        color: "#00e0ff",
        cursor: "pointer",
        fontFamily: "monospace",
        whiteSpace: "nowrap",
        WebkitTapHighlightColor: "transparent",
        transition: "background 0.2s, border-color 0.2s, box-shadow 0.2s",
        boxShadow: "0 0 12px rgba(0,220,255,0.15)",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.background = "rgba(0,220,255,0.1)";
        el.style.borderColor = "rgba(0,220,255,1)";
        el.style.boxShadow = "0 0 24px rgba(0,220,255,0.3)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.background = "rgba(0,0,0,0.65)";
        el.style.borderColor = "rgba(0,220,255,0.7)";
        el.style.boxShadow = "0 0 12px rgba(0,220,255,0.15)";
      }}
    >
      START HERE
    </button>
  );
}
