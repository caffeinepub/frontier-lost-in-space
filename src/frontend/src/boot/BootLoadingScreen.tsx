import { type BootPhase, useBootStore } from "./useBootStore";

const PHASE_LABELS: Record<BootPhase, string> = {
  idle: "SYSTEM STANDBY",
  initializing_core: "INITIALIZING CORE SYSTEMS",
  connecting_network: "CONNECTING NETWORK",
  hydrating_data: "LOADING PLAYER DATA",
  initializing_engine: "STARTING RENDER ENGINE",
  loading_assets: "LOADING ASSETS",
  ready: "SYSTEMS ONLINE",
  error: "BOOT FAILURE",
};

const PHASE_ORDER: BootPhase[] = [
  "initializing_core",
  "connecting_network",
  "hydrating_data",
  "initializing_engine",
  "loading_assets",
];

export default function BootLoadingScreen() {
  const phase = useBootStore((s) => s.phase);
  const statusMessage = useBootStore((s) => s.statusMessage);
  const progress = useBootStore((s) => s.progress);
  const errorInfo = useBootStore((s) => s.errorInfo);

  const isError = phase === "error";
  const currentPhaseIndex = PHASE_ORDER.indexOf(phase as BootPhase);
  const completedPhases = PHASE_ORDER.filter(
    (_, i) => i < currentPhaseIndex || phase === "ready",
  );

  const stackLines = errorInfo?.stack
    ? errorInfo.stack.split("\n").slice(0, 8).join("\n")
    : "";

  return (
    <div
      data-ocid="boot.loading_state"
      style={{
        position: "fixed",
        inset: 0,
        background: "#000810",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "monospace",
        zIndex: 9999,
        padding: "2rem",
      }}
    >
      <style>{`
        @keyframes bootSpinArc {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes bootFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bootPulse {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }
      `}</style>

      {/* Corner decorations */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          width: 20,
          height: 20,
          borderTop: "1px solid rgba(0,200,255,0.3)",
          borderLeft: "1px solid rgba(0,200,255,0.3)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          width: 20,
          height: 20,
          borderTop: "1px solid rgba(0,200,255,0.3)",
          borderRight: "1px solid rgba(0,200,255,0.3)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          width: 20,
          height: 20,
          borderBottom: "1px solid rgba(0,200,255,0.3)",
          borderLeft: "1px solid rgba(0,200,255,0.3)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 16,
          right: 16,
          width: 20,
          height: 20,
          borderBottom: "1px solid rgba(0,200,255,0.3)",
          borderRight: "1px solid rgba(0,200,255,0.3)",
        }}
      />

      {/* A.E.G.I.S. header */}
      <div
        style={{
          position: "absolute",
          top: 24,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: "clamp(7px, 0.75vw, 9px)",
          letterSpacing: "0.4em",
          color: "rgba(0,180,200,0.35)",
          animation: "bootPulse 3s ease infinite",
        }}
      >
        A.E.G.I.S. — ADAPTIVE ENGINE / GUIDED INTELLIGENCE SYSTEM
      </div>

      {/* Error panel */}
      {isError ? (
        <div
          data-ocid="boot.error_state"
          style={{
            maxWidth: 600,
            width: "100%",
            background: "rgba(40,0,0,0.6)",
            border: "1px solid rgba(255,60,60,0.4)",
            borderRadius: 4,
            padding: "1.5rem",
            animation: "bootFadeIn 0.4s ease forwards",
          }}
        >
          <div
            style={{
              color: "rgba(255,80,80,0.7)",
              fontSize: "0.65rem",
              letterSpacing: "0.3em",
              marginBottom: "1rem",
            }}
          >
            ▸ BOOT FAILURE — SEQUENCE ABORTED
          </div>
          <div
            style={{
              color: "#ff4444",
              fontSize: "0.9rem",
              fontWeight: "bold",
              marginBottom: "0.75rem",
              wordBreak: "break-all",
              lineHeight: 1.4,
            }}
          >
            {errorInfo?.message ?? "Unknown boot error"}
          </div>
          {stackLines && (
            <pre
              style={{
                color: "rgba(255,100,100,0.6)",
                fontSize: "0.65rem",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                margin: "0 0 1.25rem 0",
                lineHeight: 1.6,
                maxHeight: 200,
                overflow: "hidden",
              }}
            >
              {stackLines}
            </pre>
          )}
          <button
            type="button"
            data-ocid="boot.primary_button"
            onClick={() => window.location.reload()}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,80,80,0.5)",
              color: "rgba(255,100,100,0.85)",
              fontFamily: "monospace",
              fontSize: "0.75rem",
              letterSpacing: "0.2em",
              padding: "8px 20px",
              cursor: "pointer",
              borderRadius: 2,
            }}
          >
            RETRY BOOT
          </button>
        </div>
      ) : (
        <>
          {/* Arc spinner */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              border: "2px solid rgba(0,255,136,0.08)",
              borderTopColor: "rgba(0,255,136,0.85)",
              borderRightColor: "rgba(0,200,255,0.45)",
              animation: "bootSpinArc 0.9s linear infinite",
              marginBottom: "2rem",
            }}
          />

          {/* Phase label */}
          <div
            key={phase}
            style={{
              fontSize: "clamp(9px, 1.1vw, 12px)",
              letterSpacing: "0.28em",
              color: "rgba(0,255,136,0.9)",
              animation: "bootFadeIn 0.3s ease forwards",
              marginBottom: "0.5rem",
              textAlign: "center",
            }}
          >
            {PHASE_LABELS[phase]}
          </div>

          {/* Status message */}
          <div
            style={{
              fontSize: "clamp(7px, 0.8vw, 9px)",
              letterSpacing: "0.15em",
              color: "rgba(0,200,200,0.5)",
              marginBottom: "2rem",
              textAlign: "center",
              minHeight: 16,
              animation: "bootFadeIn 0.4s ease forwards",
            }}
          >
            {statusMessage}
          </div>

          {/* Progress bar */}
          <div
            style={{
              width: "min(320px, 80vw)",
              height: 2,
              background: "rgba(0,200,255,0.08)",
              borderRadius: 2,
              overflow: "hidden",
              marginBottom: "2rem",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: "rgba(0,200,255,0.7)",
                boxShadow: "0 0 8px rgba(0,200,255,0.5)",
                transition: "width 0.4s ease",
                borderRadius: 2,
              }}
            />
          </div>

          {/* Completed phases checklist */}
          {completedPhases.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                alignItems: "flex-start",
                minWidth: "min(280px, 70vw)",
              }}
            >
              {completedPhases.map((p) => (
                <div
                  key={p}
                  style={{
                    fontSize: "clamp(7px, 0.75vw, 9px)",
                    letterSpacing: "0.15em",
                    color: "rgba(0,255,136,0.55)",
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    animation: "bootFadeIn 0.3s ease forwards",
                  }}
                >
                  <span style={{ color: "rgba(0,255,136,0.8)" }}>✓</span>
                  {PHASE_LABELS[p]}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Footer version */}
      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: "clamp(6px, 0.65vw, 8px)",
          letterSpacing: "0.25em",
          color: "rgba(0,150,180,0.25)",
        }}
      >
        FRONTIER — LOST IN SPACE
      </div>
    </div>
  );
}
