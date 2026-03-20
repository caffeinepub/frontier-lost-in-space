import type React from "react";
import { useEffect, useRef } from "react";
import { interruptVoice } from "../../systems/useAudioQueue";
import { useCinematicStore } from "../../systems/useCinematicStore";

interface Props {
  viewportRef: React.RefObject<HTMLDivElement | null>;
}

const BRACKETS: { key: string; style: React.CSSProperties; delay: number }[] = [
  {
    key: "tl",
    delay: 0,
    style: {
      top: "30%",
      left: "30%",
      borderTop: "2px solid #ff3333",
      borderLeft: "2px solid #ff3333",
      borderRight: "none",
      borderBottom: "none",
    },
  },
  {
    key: "tr",
    delay: 0.05,
    style: {
      top: "30%",
      right: "30%",
      borderTop: "2px solid #ff3333",
      borderRight: "2px solid #ff3333",
      borderLeft: "none",
      borderBottom: "none",
    },
  },
  {
    key: "bl",
    delay: 0.1,
    style: {
      bottom: "30%",
      left: "30%",
      borderBottom: "2px solid #ff3333",
      borderLeft: "2px solid #ff3333",
      borderRight: "none",
      borderTop: "none",
    },
  },
  {
    key: "br",
    delay: 0.15,
    style: {
      bottom: "30%",
      right: "30%",
      borderBottom: "2px solid #ff3333",
      borderRight: "2px solid #ff3333",
      borderLeft: "none",
      borderTop: "none",
    },
  },
];

export const HostileContactCinematic: React.FC<Props> = ({ viewportRef }) => {
  const hostileContactActive = useCinematicStore((s) => s.hostileContactActive);
  const cinematicPhase = useCinematicStore((s) => s.cinematicPhase);
  const clearHostileContact = useCinematicStore((s) => s.clearHostileContact);
  const setCinematicPhase = useCinematicStore((s) => s.setCinematicPhase);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (!hostileContactActive || hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;

    // Phase 1: entry — camera push-in
    setCinematicPhase(1);
    if (viewportRef.current) {
      viewportRef.current.style.transition =
        "transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
      viewportRef.current.style.transform = "scale(1.04) translateY(-6px)";
    }

    // Phase 2: peak — voice fires at 500ms
    const t1 = setTimeout(() => {
      setCinematicPhase(2);
      interruptVoice("hostile_contact_detected");
    }, 500);

    // Phase 3: exit — camera eases back at 3.5s
    const t2 = setTimeout(() => {
      setCinematicPhase(3);
      if (viewportRef.current) {
        viewportRef.current.style.transition =
          "transform 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
        viewportRef.current.style.transform = "scale(1) translateY(0px)";
      }
    }, 3500);

    // Phase 0: cleanup at 5s
    const t3 = setTimeout(() => {
      hasTriggeredRef.current = false;
      clearHostileContact();
    }, 5000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (viewportRef.current) {
        viewportRef.current.style.transition = "transform 0.6s ease";
        viewportRef.current.style.transform = "";
      }
    };
  }, [
    hostileContactActive,
    clearHostileContact,
    setCinematicPhase,
    viewportRef,
  ]);

  if (!hostileContactActive) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 50,
        overflow: "hidden",
      }}
    >
      {/* Red vignette — peaks at phase 2 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(255, 30, 30, 0.12) 100%)",
          opacity: cinematicPhase === 2 ? 1 : 0,
          transition: "opacity 0.5s ease",
        }}
      />

      {/* Scan-line overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0, 230, 255, 0.015) 3px, rgba(0, 230, 255, 0.015) 4px)",
          opacity: cinematicPhase >= 1 ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Alert banner */}
      <div
        style={{
          position: "absolute",
          top: "18%",
          left: "50%",
          transform: "translateX(-50%)",
          opacity: cinematicPhase === 2 ? 1 : 0,
          transition: "opacity 0.4s ease",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
        }}
      >
        <div
          style={{
            color: "#ff3333",
            fontSize: 11,
            fontFamily: "monospace",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            textShadow: "0 0 12px rgba(255,50,50,0.9)",
          }}
        >
          ⚠ HOSTILE CONTACT
        </div>
        <div
          style={{
            width: 120,
            height: 1,
            background:
              "linear-gradient(to right, transparent, #ff3333, transparent)",
          }}
        />
        <div
          style={{
            color: "rgba(0, 230, 255, 0.7)",
            fontSize: 9,
            fontFamily: "monospace",
            letterSpacing: "0.2em",
          }}
        >
          WEAPONS FREE
        </div>
      </div>

      {/* Corner brackets — tactical target emphasis */}
      {BRACKETS.map(({ key, style, delay }) => (
        <div
          key={key}
          style={{
            position: "absolute",
            width: 20,
            height: 20,
            opacity: cinematicPhase === 2 ? 0.8 : 0,
            transition: `opacity 0.3s ease ${delay}s`,
            ...style,
          }}
        />
      ))}
    </div>
  );
};
