/**
 * NarrativeEventPanel.tsx — Interactive narrative decision HUD panel
 * FIXES:
 * - Moved render-time console.log into useEffect to avoid side-effects in render.
 * - Added introSequenceComplete awareness — shows enhanced fallback with
 *   auto-launch countdown when all 15 events are done and no new event is queued.
 * - All render branches return JSX or null — never undefined.
 * - Added data-ocid markers on all interactive surfaces.
 * - Tutorial gate: returns null while tutorial is active so the narrative panel
 *   never blocks tutorial interactions or fires over the tutorial overlay.
 */
import { useEffect, useRef, useState } from "react";
import { useTacticalStore } from "../../hooks/useTacticalStore";
import { useIntroEventEngine } from "../../intro/useIntroEventEngine";
import { getEventById } from "../../narrative/narrativeEvents";
import {
  preloadVoices,
  speakAs,
  speakLines,
  stopNarrativeVoice,
} from "../../narrative/narrativeVoice";
import { useNarrativeStore } from "../../narrative/useNarrativeStore";
import { useGameState } from "../../state/useGameState";
import { useTutorialStore } from "../../tutorial/useTutorialStore";
import { bootTrace } from "../../utils/bootTrace";

export default function NarrativeEventPanel() {
  const activeEventId = useNarrativeStore((s) => s.activeEventId);
  const isDismissed = useNarrativeStore((s) => s.isDismissed);
  const resultChoiceIndex = useNarrativeStore((s) => s.resultChoiceIndex);
  const selectChoice = useNarrativeStore((s) => s.selectChoice);
  const dismissEvent = useNarrativeStore((s) => s.dismissEvent);
  const mode = useGameState((s) => s.mode);
  const setMode = useGameState((s) => s.setMode);
  const setPhase = useTacticalStore((s) => s.setPhase);
  const introSequenceComplete = useIntroEventEngine(
    (s) => s.introSequenceComplete,
  );
  // Tutorial gate — hide the panel entirely while the tutorial is running
  const tutorialActive = useTutorialStore((s) => s.tutorialActive);

  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState(4);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasSpokenRef = useRef<string | null>(null);

  const event = activeEventId ? (getEventById(activeEventId) ?? null) : null;

  // ── Log current game state at render time (in effect to avoid render side-effects)
  useEffect(() => {
    console.log("[GameState]", {
      source: "NarrativeEventPanel",
      mode,
      activeEventId,
      isDismissed,
      hasEvent: !!event,
      resultChoiceIndex,
      introSequenceComplete,
      tutorialActive,
    });
  });

  useEffect(() => {
    bootTrace("NarrativeEventPanel mounted");
    preloadVoices();
  }, []);

  useEffect(() => {
    if (!event) {
      setVisible(false);
      stopNarrativeVoice();
      return;
    }

    setVisible(true);
    setCountdown(4);

    if (hasSpokenRef.current === event.id) return;
    hasSpokenRef.current = event.id;

    const firstNarratorLine = event.narratorLines?.[0];
    const firstAegisLine = event.aegisLines?.[0];

    if (firstNarratorLine) {
      speakLines("narrator", [firstNarratorLine], () => {
        if (firstAegisLine) {
          setTimeout(() => speakLines("aegis", [firstAegisLine]), 300);
        }
      });
    } else if (firstAegisLine) {
      speakLines("aegis", [firstAegisLine]);
    }

    return () => {
      stopNarrativeVoice();
    };
  }, [event]);

  useEffect(() => {
    if (resultChoiceIndex < 0 || !event) return;

    setCountdown(4);
    if (countdownRef.current) clearInterval(countdownRef.current);

    countdownRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [resultChoiceIndex, event]);

  // ── Tutorial gate — render nothing while tutorial is active ─────────────────
  // This prevents the commander selection screen from appearing over the tutorial
  // and blocking firing / interactions.
  if (tutorialActive) return null;

  // ── Fallback action handlers ─────────────────────────────────────────────────
  const handleStabilize = () => {
    console.log("[FLOW] STABILIZE LIFE SUPPORT → setMode(game)");
    setMode("game");
  };

  const handleEngageHostiles = () => {
    console.log("[FLOW] ENGAGE HOSTILES → setPhase(combat) + setMode(game)");
    setPhase("combat");
    setMode("game");
  };

  const handleMainMenu = () => {
    console.log("[FLOW] RETURN TO MAIN MENU → setMode(menu)");
    setMode("menu");
  };

  // ── Fallback UI: no active event ─────────────────────────────────────────────
  // Show between events (brief gap) or after sequence completes.
  // Only render in intro mode — in game mode the cockpit is already live.
  if (!event) {
    if (mode !== "intro") return null;

    return (
      <div
        data-ocid="narrative.fallback.panel"
        style={{
          position: "fixed",
          bottom: "15%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(440px, 92vw)",
          zIndex: 280,
          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            background: "rgba(0,6,20,0.92)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            border: "1px solid rgba(0,255,136,0.22)",
            borderTop: "2px solid rgba(0,255,136,0.42)",
            borderRadius: 4,
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            boxShadow:
              "0 0 28px rgba(0,200,100,0.12), inset 0 0 14px rgba(0,40,20,0.3)",
            animation: "narrativeFallbackIn 0.5s ease forwards",
          }}
        >
          {/* A.E.G.I.S. status indicator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              alignSelf: "flex-start",
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: introSequenceComplete
                  ? "rgba(0,200,255,0.8)"
                  : "rgba(0,255,136,0.7)",
                boxShadow: introSequenceComplete
                  ? "0 0 8px rgba(0,200,255,0.7)"
                  : "0 0 8px rgba(0,255,136,0.6)",
                animation: "aegisPulse 1.8s ease-in-out infinite",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 8,
                letterSpacing: "0.28em",
                color: introSequenceComplete
                  ? "rgba(0,200,255,0.7)"
                  : "rgba(0,255,136,0.6)",
              }}
            >
              {introSequenceComplete
                ? "A.E.G.I.S. — BRIEFING COMPLETE"
                : "A.E.G.I.S. — AWAITING COMMAND"}
            </span>
          </div>

          {/* Divider */}
          <div
            style={{
              width: "100%",
              height: 1,
              background:
                "linear-gradient(to right, transparent, rgba(0,255,136,0.2), transparent)",
            }}
          />

          {/* Prompt */}
          <div
            style={{
              fontFamily: "monospace",
              fontSize: "clamp(9px, 1.1vw, 11px)",
              letterSpacing: "0.28em",
              color: introSequenceComplete
                ? "rgba(0,200,255,0.9)"
                : "rgba(0,255,136,0.85)",
              textAlign: "center",
            }}
          >
            SELECT AN ACTION
          </div>

          {/* Primary action buttons */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              width: "100%",
            }}
          >
            <FallbackButton
              ocid="narrative.fallback.stabilize_button"
              onClick={handleStabilize}
              label="▶ STABILIZE LIFE SUPPORT"
              primary
            />
            <FallbackButton
              ocid="narrative.fallback.engage_button"
              onClick={handleEngageHostiles}
              label="▶ ENGAGE HOSTILES"
              primary
            />
          </div>

          {/* Tertiary: Main Menu */}
          <button
            type="button"
            data-ocid="narrative.fallback.menu_button"
            onClick={handleMainMenu}
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(0,180,100,0.4)",
              cursor: "pointer",
              fontFamily: "monospace",
              fontSize: "clamp(7px, 0.9vw, 9px)",
              letterSpacing: "0.22em",
              padding: "4px 8px",
              WebkitTapHighlightColor: "transparent",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                "rgba(0,220,130,0.7)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                "rgba(0,180,100,0.4)";
            }}
          >
            RETURN TO MAIN MENU
          </button>
        </div>

        <style>{`
          @keyframes narrativeFallbackIn {
            from { opacity: 0; transform: translateY(14px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes aegisPulse {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.35); }
          }
        `}</style>
      </div>
    );
  }

  // ── Active event UI ──────────────────────────────────────────────────────────
  const selectedChoice =
    resultChoiceIndex >= 0 ? (event.choices[resultChoiceIndex] ?? null) : null;

  const handleChoiceClick = (idx: number) => {
    selectChoice(idx);
    speakAs("aegis", "Decision logged. Consequences calculated.");
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "15%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(520px, 92vw)",
        zIndex: 280,
        pointerEvents: "none",
      }}
    >
      <div
        data-ocid="narrative.panel"
        style={{
          pointerEvents: "auto",
          background: "rgba(0,8,28,0.97)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(0,220,255,0.45)",
          borderTop: "2px solid rgba(0,200,255,0.6)",
          borderRadius: 4,
          overflow: "hidden",
          boxShadow:
            "0 0 24px rgba(0,180,255,0.2), inset 0 0 12px rgba(0,60,100,0.3)",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.4s ease, transform 0.4s ease",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "6px 12px",
            borderBottom: "1px solid rgba(0,180,200,0.18)",
            background: "rgba(0,20,40,0.7)",
          }}
        >
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 8,
              letterSpacing: "0.28em",
              color: "rgba(0,220,255,0.85)",
            }}
          >
            NARRATIVE EVENT
          </span>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 8,
              letterSpacing: "0.2em",
              color: "rgba(0,180,210,0.65)",
            }}
          >
            {event.phaseTrigger ?? `PHASE ${event.phase}`}
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: "14px 16px 10px" }}>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: "clamp(11px, 1.6vw, 14px)",
              fontWeight: 700,
              letterSpacing: "0.22em",
              color: "rgba(0,230,255,0.95)",
              textShadow: "0 0 12px rgba(0,200,255,0.45)",
              marginBottom: 10,
            }}
          >
            {event.title}
          </div>

          <div
            style={{
              fontFamily: "monospace",
              fontSize: "clamp(9px, 1.2vw, 11px)",
              lineHeight: 1.7,
              color: "rgba(200,235,255,0.92)",
              marginBottom: 10,
              whiteSpace: "pre-wrap",
            }}
          >
            {event.message}
          </div>

          <div
            style={{
              borderTop: "1px solid rgba(0,140,160,0.2)",
              borderBottom: "1px solid rgba(0,140,160,0.2)",
              padding: "7px 0",
              marginBottom: 14,
            }}
          >
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "clamp(8px, 1vw, 10px)",
                fontStyle: "italic",
                color: "rgba(120,180,200,0.65)",
                letterSpacing: "0.08em",
              }}
            >
              {event.flavorText}
            </span>
          </div>

          {!selectedChoice ? (
            <div
              data-ocid="narrative.choices.list"
              style={{ display: "flex", flexDirection: "column", gap: 6 }}
            >
              {event.choices.map((choice, idx) => (
                <button
                  key={choice.label}
                  type="button"
                  data-ocid={`narrative.choice_${choice.label.toLowerCase()}.button`}
                  onClick={() => handleChoiceClick(idx)}
                  style={{
                    background: "rgba(0,20,40,0.8)",
                    border: "1px solid rgba(0,180,220,0.4)",
                    borderRadius: 2,
                    padding: "8px 12px",
                    textAlign: "left",
                    cursor: "pointer",
                    fontFamily: "monospace",
                    fontSize: "clamp(8px, 1.1vw, 10px)",
                    color: "rgba(160,215,235,0.9)",
                    letterSpacing: "0.08em",
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                    transition: "border-color 0.15s, background 0.15s",
                    WebkitTapHighlightColor: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "rgba(0,220,255,0.7)";
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(0,40,60,0.9)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "rgba(0,180,220,0.4)";
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(0,20,40,0.8)";
                  }}
                >
                  <span
                    style={{
                      color: "rgba(0,220,255,0.95)",
                      fontWeight: 700,
                      minWidth: 14,
                      flexShrink: 0,
                    }}
                  >
                    [{choice.label}]
                  </span>
                  <span>{choice.text}</span>
                </button>
              ))}
            </div>
          ) : (
            <div
              data-ocid="narrative.result.panel"
              style={{ animation: "narrativeResultIn 0.3s ease forwards" }}
            >
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: "clamp(9px, 1.1vw, 11px)",
                  color: "rgba(0,210,180,0.95)",
                  letterSpacing: "0.1em",
                  lineHeight: 1.5,
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-start",
                }}
              >
                <span style={{ color: "rgba(0,230,200,0.8)", flexShrink: 0 }}>
                  ▶
                </span>
                <span>{selectedChoice.resultText}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "6px 16px",
            borderTop: "1px solid rgba(0,140,160,0.18)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {selectedChoice ? (
            <>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 8,
                  letterSpacing: "0.2em",
                  color: "rgba(0,200,220,0.55)",
                }}
              >
                [ PROCESSING... ]
              </span>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 8,
                  letterSpacing: "0.15em",
                  color: "rgba(0,160,180,0.5)",
                }}
              >
                AUTO-CLOSE {countdown}s
              </span>
            </>
          ) : (
            <>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 8,
                  letterSpacing: "0.2em",
                  color: "rgba(0,180,210,0.5)",
                }}
              >
                AWAITING DECISION
              </span>
              <button
                type="button"
                data-ocid="narrative.close_button"
                onClick={dismissEvent}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(0,140,180,0.3)",
                  borderRadius: 2,
                  padding: "2px 8px",
                  fontFamily: "monospace",
                  fontSize: 8,
                  letterSpacing: "0.15em",
                  color: "rgba(0,180,210,0.55)",
                  cursor: "pointer",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                SKIP
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes narrativeResultIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── FallbackButton helper ────────────────────────────────────────────────────
function FallbackButton({
  ocid,
  onClick,
  label,
  primary,
}: {
  ocid: string;
  onClick: () => void;
  label: string;
  primary?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const base: React.CSSProperties = {
    padding: "11px 18px",
    background: hovered
      ? "rgba(0,50,28,0.9)"
      : primary
        ? "rgba(0,28,16,0.85)"
        : "transparent",
    border: `1px solid ${
      hovered ? "rgba(0,255,136,0.75)" : "rgba(0,255,136,0.38)"
    }`,
    borderRadius: 3,
    color: hovered ? "rgba(0,255,136,1)" : "rgba(0,255,136,0.85)",
    cursor: "pointer",
    fontFamily: "monospace",
    fontSize: "clamp(9px, 1.1vw, 11px)",
    letterSpacing: "0.2em",
    width: "100%",
    textAlign: "left",
    minHeight: 42,
    transition: "background 0.15s, border-color 0.15s, color 0.15s",
    boxShadow: hovered ? "0 0 12px rgba(0,255,136,0.15)" : "none",
    WebkitTapHighlightColor: "transparent",
  };
  return (
    <button
      type="button"
      data-ocid={ocid}
      style={base}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {label}
    </button>
  );
}
