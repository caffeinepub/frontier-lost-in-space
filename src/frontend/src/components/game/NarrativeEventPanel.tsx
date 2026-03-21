/**
 * NarrativeEventPanel.tsx — Interactive narrative decision HUD panel
 * BUG FIXES:
 * - Card background brightened from rgba(0,4,16,0.96) to rgba(0,8,28,0.97)
 * - Border brightened: rgba(0,220,255,0.45) + top accent 2px rgba(0,200,255,0.6)
 * - BoxShadow added for glow
 * - Header text brighter: rgba(0,220,255,0.85)
 * - Message text brighter: rgba(200,235,255,0.92)
 * - Choice border brighter: rgba(0,180,220,0.4)
 * - Result panel: removed opacity:0 inline (CSS animation handles it)
 */
import { useEffect, useRef, useState } from "react";
import { getEventById } from "../../narrative/narrativeEvents";
import {
  preloadVoices,
  speakAs,
  speakLines,
  stopNarrativeVoice,
} from "../../narrative/narrativeVoice";
import { useNarrativeStore } from "../../narrative/useNarrativeStore";

export default function NarrativeEventPanel() {
  const activeEventId = useNarrativeStore((s) => s.activeEventId);
  const resultChoiceIndex = useNarrativeStore((s) => s.resultChoiceIndex);
  const selectChoice = useNarrativeStore((s) => s.selectChoice);
  const dismissEvent = useNarrativeStore((s) => s.dismissEvent);

  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState(4);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasSpokenRef = useRef<string | null>(null);

  const event = activeEventId ? getEventById(activeEventId) : null;

  useEffect(() => {
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

  if (!event) return null;

  const selectedChoice =
    resultChoiceIndex >= 0 ? event.choices[resultChoiceIndex] : null;

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
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
            // BUG FIX: removed opacity:0 — CSS animation handles the fade-in
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
