/**
 * InteractionDebugShell.tsx — Collapsible real-time interaction debug panel.
 *
 * Activates when:
 *   - localStorage.getItem('debug_shell') === '1'
 *   - OR import.meta.env.DEV === true
 *
 * Layout:
 *   Fixed bottom-right overlay (above QaPanel, z-index: 9994)
 *   Dark monospace panel with cyan tactical theme
 *   Display areas: pointer-events: none
 *   Sliders + buttons: pointer-events: auto
 *   Panel container: pointer-events: auto
 */
import { useCallback, useEffect, useState } from "react";
import { globalFSM } from "../../interaction/InteractionStateMachine";
import { runInteractionAssertions } from "../../interaction/interactionAssertions";
import { useInteractionStore } from "../../interaction/useInteractionStore";
import { runInteractionModelTests } from "../../tests/interactionModelTests";
import { runAllSmokeTests } from "../../tests/smokeTests";

const CYAN = "rgba(0,200,255,0.9)";
const CYAN_DIM = "rgba(0,180,220,0.55)";
const CYAN_FAINT = "rgba(0,160,200,0.3)";
const BG = "rgba(0,4,14,0.97)";
const BORDER = "1px solid rgba(0,180,220,0.25)";
const MONO: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', 'Geist Mono', 'Courier New', monospace",
  fontSize: 9,
  letterSpacing: "0.06em",
  lineHeight: 1.5,
};

function Row({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div
      style={{
        ...MONO,
        display: "flex",
        justifyContent: "space-between",
        padding: "1px 0",
        pointerEvents: "none",
      }}
    >
      <span style={{ color: CYAN_DIM }}>{label}</span>
      <span style={{ color: warn ? "#ffaa00" : CYAN, marginLeft: 8 }}>
        {value}
      </span>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div
      style={{
        ...MONO,
        borderTop: BORDER,
        borderBottom: BORDER,
        color: CYAN_DIM,
        padding: "2px 0",
        marginTop: 3,
        letterSpacing: "0.2em",
        pointerEvents: "none",
      }}
    >
      {title}
    </div>
  );
}

function DebugSlider({
  label,
  min,
  max,
  step,
  value,
  unit,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ padding: "2px 0" }}>
      <div
        style={{
          ...MONO,
          display: "flex",
          justifyContent: "space-between",
          pointerEvents: "none",
        }}
      >
        <span style={{ color: CYAN_DIM }}>{label}</span>
        <span style={{ color: CYAN }}>
          {value}
          {unit ?? ""}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: "100%",
          height: 12,
          cursor: "pointer",
          accentColor: "rgba(0,200,255,0.8)",
          pointerEvents: "auto",
        }}
      />
    </div>
  );
}

function SmallButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...MONO,
        background: "rgba(0,30,50,0.8)",
        border: "1px solid rgba(0,180,220,0.4)",
        color: CYAN_DIM,
        padding: "3px 8px",
        borderRadius: 3,
        cursor: "pointer",
        fontSize: 8,
        letterSpacing: "0.15em",
        pointerEvents: "auto",
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

export default function InteractionDebugShell() {
  const shouldShow =
    typeof window !== "undefined" &&
    (localStorage.getItem("debug_shell") === "1" || import.meta.env.DEV);

  const [collapsed, setCollapsed] = useState(true);
  const [smokePass, setSmokePass] = useState(0);
  const [smokeWarn, setSmokeWarn] = useState(0);
  const [smokeFail, setSmokeFail] = useState(0);
  const [smokeRan, setSmokeRan] = useState(false);
  const [modelResults, setModelResults] = useState<
    { path: string; pass: boolean; failAt?: string }[]
  >([]);
  const [topmostTarget, setTopmostTarget] = useState("—");
  const [layersAboveGlobe, setLayersAboveGlobe] = useState(0);

  // Stable selectors — raw primitives only
  const fsmState = useInteractionStore((s) => s.fsmState);
  const pointerOwner = useInteractionStore((s) => s.pointerOwner);
  const recentEvents = useInteractionStore((s) => s.recentEvents);
  const lastRaycast = useInteractionStore((s) => s.lastRaycastResult);
  const lastLock = useInteractionStore((s) => s.lastTargetLockResult);
  const joystickActive = useInteractionStore((s) => s.joystickActive);
  const assertionResults = useInteractionStore((s) => s.assertionResults);
  const tapVsDrag = useInteractionStore((s) => s.tapVsDragClassification);
  const tuning = useInteractionStore((s) => s.tuning);
  const setTuning = useInteractionStore((s) => s.setTuning);
  const runAssertions = useInteractionStore((s) => s.runAssertions);

  // Count layers above globe
  useEffect(() => {
    if (collapsed) return;
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const els = Array.from(document.querySelectorAll("*"));
    let count = 0;
    for (const el of els) {
      const cs = window.getComputedStyle(el as HTMLElement);
      if (cs.pointerEvents === "none") continue;
      const z = Number.parseInt(cs.zIndex, 10);
      if (Number.isNaN(z) || z <= 1) continue;
      const r = (el as HTMLElement).getBoundingClientRect();
      if (r.left <= cx && r.right >= cx && r.top <= cy && r.bottom >= cy) {
        count++;
      }
    }
    setLayersAboveGlobe(count);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collapsed]);

  // Detect topmost DOM element at globe center on pointerdown
  useEffect(() => {
    if (collapsed) return;
    const handler = (e: PointerEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (el) {
        const tag = el.tagName.toLowerCase();
        const dataLayer = (el as HTMLElement).dataset.layer ?? "";
        const id = (el as HTMLElement).id ? `#${(el as HTMLElement).id}` : "";
        setTopmostTarget(
          `<${tag}${id}${dataLayer ? ` layer=${dataLayer}` : ""}>`,
        );
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [collapsed]);

  const handleRunAssertions = useCallback(() => {
    runAssertions();
  }, [runAssertions]);

  const handleRunSmoke = useCallback(async () => {
    const summary = await runAllSmokeTests();
    setSmokePass(summary.totalPass);
    setSmokeWarn(summary.totalPartial);
    setSmokeFail(summary.totalFail);
    setSmokeRan(true);
  }, []);

  const handleRunModelTests = useCallback(() => {
    const results = runInteractionModelTests();
    setModelResults(
      results.map((r) => ({ path: r.path, pass: r.pass, failAt: r.failAt })),
    );
  }, []);

  if (!shouldShow) return null;

  const fsmColor =
    fsmState === "idle"
      ? CYAN_FAINT
      : fsmState === "targetLocked"
        ? "#00ff88"
        : fsmState === "draggingGlobe"
          ? "#88aaff"
          : fsmState === "joystickActive"
            ? "#ffcc44"
            : fsmState === "debugInspecting"
              ? "#ff88cc"
              : CYAN;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 48,
        right: 8,
        zIndex: 9994,
        width: collapsed ? 140 : 280,
        maxHeight: collapsed ? 28 : "70vh",
        overflow: collapsed ? "hidden" : "auto",
        background: BG,
        border: BORDER,
        borderRadius: 5,
        backdropFilter: "blur(6px)",
        pointerEvents: "auto",
        transition: "max-height 0.2s ease, width 0.2s ease",
      }}
    >
      {/* Header */}
      <button
        type="button"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "4px 8px",
          borderBottom: collapsed ? "none" : BORDER,
          cursor: "pointer",
          pointerEvents: "auto",
          width: "100%",
          background: "transparent",
          border: "none",
          textAlign: "left",
        }}
        onClick={() => setCollapsed((v) => !v)}
      >
        <span
          style={{
            ...MONO,
            color: fsmColor,
            letterSpacing: "0.15em",
          }}
        >
          FSM: {fsmState.toUpperCase()}
        </span>
        <span style={{ ...MONO, color: CYAN_DIM, fontSize: 10 }}>
          {collapsed ? "▲" : "▼"}
        </span>
      </button>

      {!collapsed && (
        <div style={{ padding: "4px 8px 8px" }}>
          {/* Pointer info */}
          <SectionHeader title="── POINTER ──────────────────────" />
          <Row label="POINTER OWNER" value={pointerOwner} />
          <Row label="TOPMOST TARGET" value={topmostTarget} />
          <Row
            label="LAYERS ABOVE GLOBE"
            value={String(layersAboveGlobe)}
            warn={layersAboveGlobe > 3}
          />

          {/* Events */}
          <SectionHeader title="── LAST 10 EVENTS ───────────────" />
          <div style={{ pointerEvents: "none" }}>
            {recentEvents.length === 0 && (
              <div style={{ ...MONO, color: CYAN_FAINT }}>no events yet</div>
            )}
            {[...recentEvents].reverse().map((ev, i) => (
              <div
                key={`${ev.type}-${ev.ts}-${i}`}
                style={{
                  ...MONO,
                  color: CYAN_DIM,
                  display: "flex",
                  gap: 6,
                }}
              >
                <span style={{ color: CYAN_FAINT }}>
                  {String(ev.ts).slice(-5)}
                </span>
                <span style={{ color: CYAN }}>{ev.type}</span>
                {ev.source && (
                  <span style={{ color: CYAN_FAINT }}>src:{ev.source}</span>
                )}
              </div>
            ))}
          </div>

          {/* Raycast + Lock */}
          <SectionHeader title="── RAYCAST / LOCK ───────────────" />
          <Row
            label="Last Raycast"
            value={
              lastRaycast
                ? lastRaycast.hit
                  ? `HIT lat:${lastRaycast.lat?.toFixed(1)} lng:${lastRaycast.lng?.toFixed(1)}`
                  : "MISS"
                : "—"
            }
          />
          <Row
            label="Last Lock"
            value={
              lastLock
                ? lastLock.success
                  ? `OK ${lastLock.targetId ?? ""}`
                  : `FAIL ${lastLock.reason ?? ""}`
                : "—"
            }
          />

          {/* Joystick */}
          <SectionHeader title="── JOYSTICK ────────────────────" />
          <Row
            label="Joystick Active"
            value={joystickActive ? "YES" : "NO"}
            warn={joystickActive}
          />
          <Row label="Tap/Drag" value={tapVsDrag.toUpperCase()} />

          {/* Globe Health */}
          <SectionHeader title="── GLOBE HEALTH ─────────────────" />
          {(() => {
            const canvas = document.querySelector(
              "canvas",
            ) as HTMLCanvasElement | null;
            const w = canvas?.offsetWidth ?? 0;
            const h = canvas?.offsetHeight ?? 0;
            const aspect = h > 0 ? (w / h).toFixed(2) : "?";
            const aspectOk = h > 0 && w / h < 3 && w / h > 0.33;
            return (
              <>
                <Row label="Canvas" value={`${w}x${h}`} />
                <Row
                  label="Aspect"
                  value={`${aspect} ${aspectOk ? "PASS" : "WARN"}`}
                  warn={!aspectOk}
                />
              </>
            );
          })()}

          {/* Assertions */}
          <SectionHeader title="── ASSERTIONS ───────────────────" />
          <div style={{ pointerEvents: "none" }}>
            {assertionResults.length === 0 && (
              <div style={{ ...MONO, color: CYAN_FAINT }}>not run yet</div>
            )}
            {assertionResults.map((a, i) => (
              <div
                key={`${a.name}-${i}`}
                style={{
                  ...MONO,
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "1px 0",
                }}
              >
                <span
                  style={{
                    color: a.warn ? "#ffaa00" : a.pass ? "#00ff88" : "#ff4444",
                  }}
                >
                  {a.pass ? (a.warn ? "⚠" : "✓") : "✗"} {a.name}
                </span>
                <span
                  style={{
                    color: a.pass ? CYAN_FAINT : "#ff6666",
                    fontSize: 8,
                    maxWidth: 100,
                    textAlign: "right",
                  }}
                >
                  {a.pass ? (a.warn ? "WARN" : "PASS") : "FAIL"}
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
            <SmallButton onClick={handleRunAssertions}>
              RUN ASSERTIONS
            </SmallButton>
          </div>

          {/* Smoke Tests */}
          <SectionHeader title="── SMOKE TESTS ──────────────────" />
          <div style={{ pointerEvents: "none" }}>
            {smokeRan ? (
              <Row
                label="Results"
                value={`PASS:${smokePass} WARN:${smokeWarn} FAIL:${smokeFail}`}
                warn={smokeFail > 0}
              />
            ) : (
              <div style={{ ...MONO, color: CYAN_FAINT }}>not run yet</div>
            )}
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
            <SmallButton onClick={handleRunSmoke}>RUN SMOKE</SmallButton>
            <SmallButton onClick={handleRunModelTests}>MODEL TESTS</SmallButton>
          </div>
          {modelResults.length > 0 && (
            <div style={{ pointerEvents: "none", marginTop: 4 }}>
              {modelResults.map((r, i) => (
                <div
                  key={`${r.path}-${i}`}
                  style={{ ...MONO, color: r.pass ? "#00ff88" : "#ff4444" }}
                >
                  {r.pass ? "✓" : "✗"} {r.path}
                  {!r.pass && r.failAt && (
                    <span style={{ color: "#ff8866", marginLeft: 6 }}>
                      @ {r.failAt}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* FSM State History */}
          <SectionHeader title="── FSM HISTORY ──────────────────" />
          <div style={{ pointerEvents: "none" }}>
            {globalFSM
              .getHistory()
              .slice(-5)
              .reverse()
              .map((h) => (
                <div
                  key={`${h.from}-${h.to}-${h.ts}`}
                  style={{ ...MONO, color: CYAN_DIM }}
                >
                  {h.from} → {h.to}
                </div>
              ))}
          </div>

          {/* Tuning */}
          <SectionHeader title="── TUNING ───────────────────────" />
          <DebugSlider
            label="Drag Threshold"
            min={2}
            max={30}
            step={1}
            value={tuning.dragThresholdPx}
            unit="px"
            onChange={(v) => setTuning({ dragThresholdPx: v })}
          />
          <DebugSlider
            label="Tap Duration"
            min={100}
            max={500}
            step={25}
            value={tuning.tapDurationMs}
            unit="ms"
            onChange={(v) => setTuning({ tapDurationMs: v })}
          />
          <DebugSlider
            label="Reticle Sens"
            min={0.1}
            max={2.0}
            step={0.1}
            value={tuning.reticleSensitivity}
            onChange={(v) => setTuning({ reticleSensitivity: v })}
          />
          <DebugSlider
            label="Lock Sens"
            min={0.1}
            max={2.0}
            step={0.1}
            value={tuning.lockSensitivity}
            onChange={(v) => setTuning({ lockSensitivity: v })}
          />
        </div>
      )}
    </div>
  );
}
