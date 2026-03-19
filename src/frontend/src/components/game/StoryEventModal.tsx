/**
 * StoryEventModal — Section 3
 *
 * Shows when useStoryStore.pendingEvent !== null.
 * Glass-panel modal with A.E.G.I.S. dialogue and player choices.
 */
import { useSpaceLogStore } from "../../story/useSpaceLogStore";
import { useStoryStore } from "../../story/useStoryStore";

export default function StoryEventModal() {
  const pendingEvent = useStoryStore((s) => s.pendingEvent);
  const makeChoice = useStoryStore((s) => s.makeChoice);
  const dismissEvent = useStoryStore((s) => s.dismissEvent);
  const addSpaceLogEntry = useSpaceLogStore((s) => s.addEntry);

  if (!pendingEvent) return null;

  const handleChoice = (index: number) => {
    const choice = pendingEvent.choices[index];
    makeChoice(pendingEvent.id, index);
    // Record decision in Space Log
    addSpaceLogEntry({
      type: "decision",
      title: `DECISION: ${pendingEvent.id.replace("p1_", "").replace(/_/g, " ").toUpperCase()}`,
      body: `Choice: "${choice.text}" \u2014 ${choice.consequence}`,
      phase: 1,
    });
  };

  const handleAcknowledge = () => {
    dismissEvent();
    addSpaceLogEntry({
      type: "aegis",
      title: "A.E.G.I.S. REPORT",
      body: pendingEvent.aegisDialogue,
      phase: 1,
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(16px, 4vw, 40px)",
        background: "rgba(0,0,8,0.72)",
        backdropFilter: "blur(4px)",
        animation: "storyModalIn 0.35s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      <style>{`
        @keyframes storyModalIn {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div
        style={{
          width: "min(480px, 100%)",
          background: "rgba(0,4,16,0.97)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(0,200,200,0.22)",
          borderRadius: 10,
          padding: "clamp(20px, 4vw, 32px)",
          boxShadow:
            "0 0 40px rgba(0,160,200,0.18), inset 0 0 30px rgba(0,80,120,0.06)",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {/* A.E.G.I.S. badge */}
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "clamp(7px, 1vw, 9px)",
            letterSpacing: "0.35em",
            color: "rgba(0,200,255,0.5)",
          }}
        >
          A.E.G.I.S. — PHASE 1
        </div>

        {/* A.E.G.I.S. dialogue */}
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "clamp(11px, 1.5vw, 14px)",
            letterSpacing: "0.08em",
            color: "rgba(0,230,255,0.9)",
            lineHeight: 1.55,
            textShadow: "0 0 12px rgba(0,200,255,0.3)",
          }}
        >
          &gt; {pendingEvent.aegisDialogue}
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(0,180,200,0.25), transparent)",
          }}
        />

        {/* Narrative */}
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "clamp(10px, 1.3vw, 12px)",
            letterSpacing: "0.05em",
            color: "rgba(160,200,230,0.7)",
            lineHeight: 1.6,
            fontStyle: "italic",
          }}
        >
          {pendingEvent.narrative}
        </div>

        {/* Choices or acknowledge */}
        {pendingEvent.choices.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pendingEvent.choices.map((choice, i) => (
              <button
                // biome-ignore lint/suspicious/noArrayIndexKey: ordered choices
                key={`choice-${i}`}
                type="button"
                onClick={() => handleChoice(i)}
                style={{
                  fontFamily: "monospace",
                  fontSize: "clamp(9px, 1.2vw, 12px)",
                  letterSpacing: "0.1em",
                  color: "rgba(0,220,200,0.9)",
                  background: "rgba(0,30,50,0.6)",
                  border: "1px solid rgba(0,180,200,0.25)",
                  borderRadius: 5,
                  padding: "10px 14px",
                  cursor: "pointer",
                  outline: "none",
                  WebkitTapHighlightColor: "transparent",
                  textAlign: "left",
                  lineHeight: 1.4,
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(0,50,80,0.8)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "rgba(0,220,200,0.45)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(0,30,50,0.6)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "rgba(0,180,200,0.25)";
                }}
              >
                <span style={{ color: "rgba(0,180,200,0.5)", marginRight: 8 }}>
                  [{String.fromCharCode(65 + i)}]
                </span>
                {choice.text}
                <div
                  style={{
                    marginTop: 3,
                    fontSize: "clamp(8px, 1vw, 10px)",
                    color: "rgba(100,160,180,0.55)",
                  }}
                >
                  {choice.consequence}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={handleAcknowledge}
            style={{
              fontFamily: "monospace",
              fontSize: "clamp(9px, 1.2vw, 11px)",
              letterSpacing: "0.2em",
              color: "rgba(0,200,200,0.8)",
              background: "rgba(0,30,50,0.5)",
              border: "1px solid rgba(0,160,180,0.25)",
              borderRadius: 5,
              padding: "10px 0",
              cursor: "pointer",
              outline: "none",
              WebkitTapHighlightColor: "transparent",
              width: "100%",
            }}
          >
            ACKNOWLEDGE
          </button>
        )}
      </div>
    </div>
  );
}
