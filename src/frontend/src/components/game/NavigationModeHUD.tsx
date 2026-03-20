/**
 * NavigationModeHUD.tsx — Cinematic, non-blocking mode indicator overlay.
 *
 * V21 additions:
 *   - TargetingBlockedFlash: brief in-universe message when player taps globe
 *     while targeting is disabled by navigation mode. Listens for
 *     'frontier:targetingBlocked' CustomEvent from EarthGlobe.
 *     Messages: "TARGETING DISABLED" / "SWITCH TO TACTICAL" — feel in-universe.
 *
 * Rules (all layers):
 *   - pointer-events: none (never blocks globe or gameplay input)
 *   - Animates on mode change / block event
 *   - Auto-fades after timeout
 */
import { useEffect, useRef, useState } from "react";
import {
  MODE_DEFINITIONS,
  type NavigationMode,
} from "../../navigation/NavigationModeController";
import { useNavigationModeStore } from "../../navigation/useNavigationModeStore";

// ─── Color map per mode ───────────────────────────────────────────────────────

const MODE_COLORS: Record<
  NavigationMode,
  { primary: string; glow: string; bg: string }
> = {
  orbitObservation: {
    primary: "rgba(80,200,255,0.9)",
    glow: "rgba(40,160,220,0.4)",
    bg: "rgba(0,30,50,0.75)",
  },
  tacticalLock: {
    primary: "rgba(255,60,60,0.95)",
    glow: "rgba(220,30,30,0.5)",
    bg: "rgba(30,0,0,0.82)",
  },
  approach: {
    primary: "rgba(255,160,40,0.95)",
    glow: "rgba(200,120,0,0.45)",
    bg: "rgba(30,12,0,0.82)",
  },
  breakaway: {
    primary: "rgba(160,100,255,0.95)",
    glow: "rgba(120,60,220,0.45)",
    bg: "rgba(12,0,30,0.82)",
  },
  cruise: {
    primary: "rgba(60,230,160,0.9)",
    glow: "rgba(30,180,120,0.4)",
    bg: "rgba(0,22,14,0.78)",
  },
};

// ─── Persistent badge (always visible, top-left) ──────────────────────────────

function ModeBadge({
  mode,
  code,
}: {
  mode: NavigationMode;
  code: string;
}) {
  const { primary, bg } = MODE_COLORS[mode];
  return (
    <div
      style={{
        position: "absolute",
        top: "clamp(8px, 1.5vh, 16px)",
        left: "clamp(8px, 1.5vw, 16px)",
        zIndex: 35,
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: primary,
          boxShadow: `0 0 6px ${primary}`,
          animation: "navModePulse 2s ease-in-out infinite",
          flexShrink: 0,
        }}
      />
      <div
        style={{
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          fontSize: "clamp(7px, 1vw, 9px)",
          letterSpacing: "0.25em",
          color: primary,
          background: bg,
          border: `1px solid ${primary}`,
          padding: "2px 6px",
          borderRadius: 2,
          backdropFilter: "blur(4px)",
          opacity: 0.85,
          userSelect: "none",
        }}
      >
        {code}
      </div>
    </div>
  );
}

// ─── Cinematic banner (shows briefly on mode change) ──────────────────────────

interface BannerState {
  label: string;
  mode: NavigationMode;
  visible: boolean;
}

const BANNER_DURATION_MS = 2800;

function CinematicBanner({ banner }: { banner: BannerState }) {
  if (!banner.visible) return null;
  const { primary, glow, bg } = MODE_COLORS[banner.mode];

  return (
    <div
      style={{
        position: "absolute",
        top: "clamp(40px, 8vh, 72px)",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 36,
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        animation: "navBannerIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards",
      }}
    >
      <div
        style={{
          width: "clamp(80px, 18vw, 160px)",
          height: 1,
          background: `linear-gradient(90deg, transparent, ${primary}, transparent)`,
          marginBottom: 2,
        }}
      />
      <div
        style={{
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          fontSize: "clamp(10px, 1.6vw, 14px)",
          letterSpacing: "0.35em",
          color: primary,
          textShadow: `0 0 16px ${glow}, 0 0 32px ${glow}`,
          background: bg,
          border: `1px solid ${primary}`,
          borderTop: `2px solid ${primary}`,
          padding: "5px 18px",
          backdropFilter: "blur(8px)",
          userSelect: "none",
          whiteSpace: "nowrap",
        }}
      >
        {banner.label}
      </div>
      <div
        style={{
          width: "clamp(40px, 10vw, 90px)",
          height: 1,
          background: `linear-gradient(90deg, transparent, ${primary}, transparent)`,
          marginTop: 2,
        }}
      />
    </div>
  );
}

// ─── V21: Targeting Blocked Flash ────────────────────────────────────────────
//
// In-universe feedback when player taps globe in a mode that disables targeting.
// Listens for 'frontier:targetingBlocked' custom event dispatched by EarthGlobe.
// Subtle, tactical-styled — not a web app error.

const BLOCKED_MESSAGES: Record<NavigationMode, string> = {
  orbitObservation: "TARGETING DISABLED  /  SWITCH TO TACTICAL",
  tacticalLock: "", // targeting is enabled in this mode — never shown
  approach: "", // targeting is enabled in this mode — never shown
  breakaway: "TARGETING OFFLINE  /  BREAKING AWAY",
  cruise: "TARGETING OFFLINE  /  CRUISE ACTIVE",
};

const BLOCK_FLASH_DURATION_MS = 2200;

function TargetingBlockedFlash() {
  const [flash, setFlash] = useState<{
    visible: boolean;
    mode: NavigationMode;
    message: string;
  }>({ visible: false, mode: "orbitObservation", message: "" });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleBlocked = (evt: Event) => {
      const customEvt = evt as CustomEvent<{ mode: NavigationMode }>;
      const mode = customEvt.detail?.mode ?? "orbitObservation";
      const message = BLOCKED_MESSAGES[mode] || "TARGETING DISABLED";

      if (timerRef.current !== null) clearTimeout(timerRef.current);

      setFlash({ visible: true, mode, message });

      timerRef.current = setTimeout(() => {
        setFlash((prev) => ({ ...prev, visible: false }));
        timerRef.current = null;
      }, BLOCK_FLASH_DURATION_MS);
    };

    window.addEventListener("frontier:targetingBlocked", handleBlocked);
    return () => {
      window.removeEventListener("frontier:targetingBlocked", handleBlocked);
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  if (!flash.visible) return null;

  // Amber/warning color — not red (that's tactical), not cyan (that's orbit)
  const warnColor = "rgba(255,180,30,0.95)";
  const warnGlow = "rgba(220,140,0,0.5)";
  const warnBg = "rgba(28,18,0,0.88)";

  return (
    <div
      style={{
        position: "absolute",
        bottom: "clamp(28%, 32%, 38%)",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 38,
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        animation: "navBlockFlashIn 0.2s ease-out forwards",
      }}
    >
      {/* Warning tick mark */}
      <div
        style={{
          width: 18,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${warnColor}, transparent)`,
          marginBottom: 2,
          opacity: 0.7,
        }}
      />
      <div
        style={{
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          fontSize: "clamp(8px, 1.1vw, 11px)",
          letterSpacing: "0.3em",
          color: warnColor,
          textShadow: `0 0 10px ${warnGlow}`,
          background: warnBg,
          border: "1px solid rgba(255,160,20,0.5)",
          borderLeft: `2px solid ${warnColor}`,
          padding: "4px 14px",
          backdropFilter: "blur(6px)",
          userSelect: "none",
          whiteSpace: "nowrap",
          opacity: 0.92,
        }}
      >
        {flash.message}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function NavigationModeHUD() {
  const currentMode = useNavigationModeStore((s) => s.currentMode);
  const hudLabel = useNavigationModeStore((s) => s.hudLabel);
  const hudCode = useNavigationModeStore((s) => s.hudCode);

  const [banner, setBanner] = useState<BannerState>({
    label: MODE_DEFINITIONS[currentMode].label,
    mode: currentMode,
    visible: false,
  });

  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevModeRef = useRef<NavigationMode>(currentMode);

  useEffect(() => {
    if (prevModeRef.current === currentMode) return;
    prevModeRef.current = currentMode;

    if (bannerTimerRef.current !== null) {
      clearTimeout(bannerTimerRef.current);
    }

    setBanner({ label: hudLabel, mode: currentMode, visible: true });

    bannerTimerRef.current = setTimeout(() => {
      setBanner((prev) => ({ ...prev, visible: false }));
      bannerTimerRef.current = null;
    }, BANNER_DURATION_MS);

    return () => {
      if (bannerTimerRef.current !== null) {
        clearTimeout(bannerTimerRef.current);
      }
    };
  }, [currentMode, hudLabel]);

  return (
    <>
      <ModeBadge mode={currentMode} code={hudCode} />
      <CinematicBanner banner={banner} />
      <TargetingBlockedFlash />

      <style>{`
        @keyframes navModePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
        @keyframes navBannerIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-8px);
            filter: blur(3px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
            filter: blur(0);
          }
        }
        @keyframes navBlockFlashIn {
          from {
            opacity: 0;
            transform: translateX(-50%) scaleX(0.92);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) scaleX(1);
          }
        }
      `}</style>
    </>
  );
}
