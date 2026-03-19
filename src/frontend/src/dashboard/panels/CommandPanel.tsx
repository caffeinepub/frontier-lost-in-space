import { useWeaponsStore } from "../../combat/useWeapons";
import { useTacticalStore } from "../../hooks/useTacticalStore";
/**
 * CommandPanel — CMD dashboard panel.
 *
 * Contains:
 *   - Tutorial launcher (opt-in, never auto-starts)
 *   - System status overview
 */
import { useTutorialStore } from "../../tutorial/useTutorialStore";

export default function CommandPanel() {
  const startTutorial = useTutorialStore((s) => s.startTutorial);
  const tutorialActive = useTutorialStore((s) => s.tutorialActive);
  const tutorialComplete = useTutorialStore((s) => s.tutorialComplete);
  const weapons = useWeaponsStore((s) => s.weapons);
  const selectedNode = useTacticalStore((s) => s.selectedNode);

  const allWeaponsReady = weapons.every((w) => w.status === "READY");
  const targetLocked = !!selectedNode;

  return (
    <div
      style={{
        padding: "clamp(12px, 2vw, 18px)",
        fontFamily: "monospace",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        color: "rgba(0,200,255,0.85)",
      }}
    >
      {/* Section: System Status */}
      <div
        style={{
          borderBottom: "1px solid rgba(0,150,200,0.2)",
          paddingBottom: 10,
        }}
      >
        <div
          style={{
            fontSize: "clamp(7px, 1vw, 9px)",
            letterSpacing: "0.3em",
            color: "rgba(0,180,220,0.5)",
            marginBottom: 8,
          }}
        >
          SYSTEM STATUS
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <StatusRow
            label="TARGETING"
            value={targetLocked ? "LOCKED" : "SCANNING"}
            ok={targetLocked}
          />
          <StatusRow
            label="WEAPONS"
            value={allWeaponsReady ? "READY" : "CYCLING"}
            ok={allWeaponsReady}
          />
          <StatusRow label="CORE LOOP" value="NOMINAL" ok={true} />
        </div>
      </div>

      {/* Section: Tutorial — opt-in only */}
      <div>
        <div
          style={{
            fontSize: "clamp(7px, 1vw, 9px)",
            letterSpacing: "0.3em",
            color: "rgba(0,180,220,0.5)",
            marginBottom: 8,
          }}
        >
          CALIBRATION
        </div>
        {tutorialComplete ? (
          <div
            style={{
              fontSize: "clamp(9px, 1.1vw, 11px)",
              letterSpacing: "0.18em",
              color: "rgba(0,220,180,0.6)",
            }}
          >
            TUTORIAL COMPLETE
          </div>
        ) : tutorialActive ? (
          <div
            style={{
              fontSize: "clamp(9px, 1.1vw, 11px)",
              letterSpacing: "0.18em",
              color: "rgba(255,200,40,0.8)",
            }}
          >
            TUTORIAL RUNNING...
          </div>
        ) : (
          <button
            type="button"
            data-ocid="cmd.launch-tutorial.button"
            onClick={startTutorial}
            style={{
              width: "100%",
              fontFamily: "monospace",
              fontSize: "clamp(9px, 1.2vw, 11px)",
              letterSpacing: "0.2em",
              color: "rgba(0,220,200,0.9)",
              background: "rgba(0,40,50,0.5)",
              border: "1px solid rgba(0,200,180,0.4)",
              borderRadius: 4,
              padding: "10px 0",
              cursor: "pointer",
              outline: "none",
              WebkitTapHighlightColor: "transparent",
              textAlign: "center",
            }}
          >
            LAUNCH TUTORIAL
          </button>
        )}
        <div
          style={{
            marginTop: 6,
            fontSize: "clamp(7px, 0.9vw, 8px)",
            letterSpacing: "0.12em",
            color: "rgba(0,140,180,0.4)",
            lineHeight: 1.5,
          }}
        >
          Optional calibration walkthrough. Can be exited at any time.
        </div>
      </div>
    </div>
  );
}

function StatusRow({
  label,
  value,
  ok,
}: { label: string; value: string; ok: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span
        style={{
          fontSize: "clamp(8px, 1vw, 10px)",
          letterSpacing: "0.15em",
          color: "rgba(0,160,200,0.7)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "clamp(8px, 1vw, 10px)",
          letterSpacing: "0.15em",
          color: ok ? "rgba(0,230,180,0.9)" : "rgba(255,180,40,0.9)",
          textShadow: ok
            ? "0 0 6px rgba(0,220,160,0.4)"
            : "0 0 6px rgba(255,160,40,0.4)",
        }}
      >
        {value}
      </span>
    </div>
  );
}
