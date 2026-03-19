/**
 * CinematicIntro — Section 1
 *
 * Full-screen cinematic intro. Premium intro_start event uses ElevenLabs;
 * subsequent dialogue lines use local browser TTS.
 */
import { useEffect, useRef, useState } from "react";
import { speak, stopSpeech } from "../audio/aegisVoice";
import { speakEleven, stopAllVoice } from "../systems/ElevenVoice";
import { useIntroStore } from "./useIntroStore";

const DIALOGUE_LINES = [
  { at: 14.5, text: "Commander\u2026 systems initializing." },
  { at: 16.5, text: "Long-range sensors online." },
  { at: 18.0, text: "Navigation systems partially restored." },
  { at: 19.5, text: "You are drifting in unstable orbit." },
  { at: 21.5, text: "Begin calibration." },
];

const TOTAL_DURATION = 26;

const STARS = Array.from({ length: 260 }, (_, i) => ({
  id: i,
  x: (i * 137.508) % 100,
  y: (i * 97.324) % 100,
  size: 0.5 + ((i * 3.7) % 1.8),
  opacity: 0.3 + ((i * 0.42) % 0.7),
  drift: ((i * 0.23) % 0.04) - 0.02,
}));

const HUD_LINES = [
  { at: 14.0, label: "AEGIS CORE", color: "#00ccff" },
  { at: 14.8, label: "RADAR ONLINE", color: "#00ffcc" },
  { at: 15.6, label: "WEAPONS ARMED", color: "#ff9900" },
  { at: 16.4, label: "SHIELDS NOMINAL", color: "#00ffcc" },
  { at: 17.2, label: "NAV PARTIAL", color: "#ffcc00" },
];

export default function CinematicIntro() {
  const skipIntro = useIntroStore((s) => s.skipIntro);
  const completeIntro = useIntroStore((s) => s.completeIntro);

  const [elapsed, setElapsed] = useState(0);
  const [showSkip, setShowSkip] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [activeDialogue, setActiveDialogue] = useState<string | null>(null);
  const [visibleHudLines, setVisibleHudLines] = useState<Set<string>>(
    new Set(),
  );
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);
  const completedRef = useRef(false);
  const spokenLinesRef = useRef<Set<number>>(new Set());
  const premiumSpokenRef = useRef(false);

  // Trigger ElevenLabs for intro_start on mount (after a short delay for iOS)
  useEffect(() => {
    const t = setTimeout(() => {
      if (!premiumSpokenRef.current) {
        premiumSpokenRef.current = true;
        speakEleven(
          "A.E.G.I.S. tactical command interface. Initializing.",
        ).catch(() => {});
      }
    }, 500);
    return () => clearTimeout(t);
  }, []);

  // Animation tick
  useEffect(() => {
    const tick = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const t = (ts - startRef.current) / 1000;
      setElapsed(t);

      // Speak dialogue lines at the right time (local TTS for non-premium lines)
      DIALOGUE_LINES.forEach((line, idx) => {
        if (t >= line.at && !spokenLinesRef.current.has(idx)) {
          spokenLinesRef.current.add(idx);
          speak(line.text);
        }
      });

      if (t >= TOTAL_DURATION && !completedRef.current) {
        completedRef.current = true;
        setFadingOut(true);
        stopSpeech();
        setTimeout(completeIntro, 800);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    const skipTimer = setTimeout(() => setShowSkip(true), 1000);
    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(skipTimer);
    };
  }, [completeIntro]);

  // HUD line visibility
  useEffect(() => {
    const next = new Set<string>();
    for (const line of HUD_LINES) {
      if (elapsed >= line.at) next.add(line.label);
    }
    setVisibleHudLines(next);
  }, [elapsed]);

  // Dialogue display
  useEffect(() => {
    let active: string | null = null;
    for (const line of DIALOGUE_LINES) {
      if (elapsed >= line.at) active = line.text;
    }
    setActiveDialogue(active);
  }, [elapsed]);

  function handleSkip() {
    if (completedRef.current) return;
    completedRef.current = true;
    cancelAnimationFrame(rafRef.current);
    stopAllVoice();
    setFadingOut(true);
    setTimeout(skipIntro, 600);
  }

  const starsOpacity = Math.min(1, Math.max(0, (elapsed - 2) / 3));
  const earthGlow = Math.min(1, Math.max(0, (elapsed - 5) / 4));
  const earthOpacity = Math.min(1, Math.max(0, (elapsed - 8) / 5));
  const earthScale =
    0.35 + Math.min(0.4, Math.max(0, (elapsed - 7) / 18) * 0.4);
  const hudOpacity = Math.min(1, Math.max(0, (elapsed - 13.5) / 2));
  const dialogueOpacity = Math.min(1, Math.max(0, (elapsed - 14) / 1.5));

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#000005",
        overflow: "hidden",
        opacity: fadingOut ? 0 : 1,
        transition: fadingOut ? "opacity 0.8s ease" : "none",
        cursor: "default",
        userSelect: "none",
      }}
    >
      {/* Stars */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: starsOpacity,
          transition: "opacity 0.5s ease",
        }}
      >
        <svg
          role="img"
          aria-label="Deep space star field"
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid slice"
          style={{ position: "absolute", inset: 0 }}
        >
          <title>Deep space star field</title>
          {STARS.map((s) => (
            <circle
              key={s.id}
              cx={s.x + elapsed * s.drift}
              cy={s.y}
              r={s.size * 0.15}
              fill="white"
              opacity={s.opacity}
            />
          ))}
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 60% 40% at 70% 30%, rgba(0,30,80,0.35) 0%, transparent 70%),radial-gradient(ellipse 40% 60% at 30% 70%, rgba(30,0,60,0.25) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Earth glow */}
      <div
        style={{
          position: "absolute",
          bottom: "8%",
          left: "50%",
          transform: "translate(-50%, 50%)",
          width: "180%",
          height: "80%",
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse at 50% 80%, rgba(0,120,255,0.18) 0%, rgba(0,60,180,0.08) 40%, transparent 65%)",
          opacity: earthGlow,
          transition: "opacity 0.8s ease",
          pointerEvents: "none",
        }}
      />

      {/* Earth */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) scale(${earthScale})`,
          width: "min(90vw, 90vh)",
          height: "min(90vw, 90vh)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 35% 32%, #1a5fad 0%, #0d3d80 25%, #091f4a 55%, #030d20 100%)",
          boxShadow: `0 0 ${60 * earthScale}px ${20 * earthScale}px rgba(0,100,255,0.18),inset -30px -20px 80px rgba(0,0,30,0.7),0 0 ${120 * earthScale}px ${40 * earthScale}px rgba(0,60,200,0.10)`,
          opacity: earthOpacity,
          transition: "opacity 1.2s ease, transform 0.1s linear",
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse 80% 30% at 40% 45%, rgba(180,210,255,0.12) 0%, transparent 60%),radial-gradient(ellipse 60% 20% at 60% 60%, rgba(180,210,255,0.08) 0%, transparent 50%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: -3,
            borderRadius: "50%",
            border: "3px solid transparent",
            boxShadow:
              "0 0 40px 12px rgba(80,160,255,0.22), inset 0 0 30px rgba(80,180,255,0.15)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* HUD power-on lines */}
      <div
        style={{
          position: "absolute",
          top: "clamp(16px, 3vh, 32px)",
          left: "clamp(16px, 3vw, 40px)",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          opacity: hudOpacity,
          transition: "opacity 0.5s ease",
          pointerEvents: "none",
        }}
      >
        {HUD_LINES.map((line) => (
          <div
            key={line.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              opacity: visibleHudLines.has(line.label) ? 1 : 0,
              transform: visibleHudLines.has(line.label)
                ? "translateX(0)"
                : "translateX(-12px)",
              transition: "opacity 0.4s ease, transform 0.4s ease",
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: line.color,
                boxShadow: `0 0 6px ${line.color}`,
                animation: "aegisPulse 1.8s ease-in-out infinite",
              }}
            />
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "clamp(8px, 1.1vw, 11px)",
                letterSpacing: "0.2em",
                color: line.color,
                textShadow: `0 0 8px ${line.color}88`,
              }}
            >
              {line.label}
            </span>
          </div>
        ))}
      </div>

      {/* A.E.G.I.S. header */}
      <div
        style={{
          position: "absolute",
          top: "clamp(16px, 3vh, 32px)",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: hudOpacity,
          transition: "opacity 0.6s ease",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "clamp(9px, 1.4vw, 14px)",
            letterSpacing: "0.35em",
            color: "rgba(0,200,255,0.55)",
            textShadow: "0 0 12px rgba(0,200,255,0.3)",
          }}
        >
          A.E.G.I.S. — TACTICAL COMMAND INTERFACE
        </div>
      </div>

      {/* Dialogue */}
      <div
        style={{
          position: "absolute",
          bottom: "clamp(80px, 18vh, 160px)",
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          opacity: dialogueOpacity,
          transition: "opacity 0.6s ease",
          pointerEvents: "none",
        }}
      >
        {activeDialogue && (
          <div
            key={activeDialogue}
            style={{
              fontFamily: "monospace",
              fontSize: "clamp(11px, 1.8vw, 18px)",
              letterSpacing: "0.15em",
              color: "rgba(0,230,255,0.9)",
              textShadow: "0 0 20px rgba(0,200,255,0.5)",
              textAlign: "center",
              padding: "0 clamp(16px, 5vw, 60px)",
              animation: "aegisDialogueFadeIn 0.6s ease forwards",
            }}
          >
            &gt; {activeDialogue}
          </div>
        )}
        <div
          style={{
            width: "clamp(120px, 30vw, 300px)",
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(0,200,255,0.4), transparent)",
            marginTop: 6,
            opacity: dialogueOpacity,
          }}
        />
      </div>

      {/* Progress bar */}
      <div
        style={{
          position: "absolute",
          bottom: "clamp(50px, 8vh, 80px)",
          left: "50%",
          transform: "translateX(-50%)",
          width: "clamp(160px, 40vw, 360px)",
          height: 2,
          background: "rgba(0,100,150,0.3)",
          borderRadius: 1,
          overflow: "hidden",
          opacity: hudOpacity,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${Math.min(100, (elapsed / TOTAL_DURATION) * 100)}%`,
            background:
              "linear-gradient(90deg, rgba(0,150,255,0.6), rgba(0,255,200,0.8))",
            boxShadow: "0 0 6px rgba(0,200,255,0.6)",
            transition: "width 0.3s linear",
          }}
        />
      </div>

      {/* Skip button */}
      {showSkip && (
        <button
          type="button"
          onClick={handleSkip}
          style={{
            position: "absolute",
            bottom: "clamp(16px, 3vh, 32px)",
            right: "clamp(16px, 3vw, 40px)",
            fontFamily: "monospace",
            fontSize: "clamp(9px, 1.2vw, 12px)",
            letterSpacing: "0.22em",
            color: "rgba(0,180,255,0.65)",
            background: "rgba(0,8,20,0.7)",
            border: "1px solid rgba(0,160,220,0.25)",
            borderRadius: 3,
            padding: "8px 18px",
            cursor: "pointer",
            backdropFilter: "blur(6px)",
            zIndex: 10,
            minHeight: 44,
            minWidth: 80,
            transition: "color 0.2s, border-color 0.2s",
            WebkitTapHighlightColor: "transparent",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color =
              "rgba(0,230,255,0.9)";
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              "rgba(0,200,255,0.5)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color =
              "rgba(0,180,255,0.65)";
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              "rgba(0,160,220,0.25)";
          }}
        >
          SKIP INTRO
        </button>
      )}

      <style>{`
        @keyframes aegisPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        @keyframes aegisDialogueFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
