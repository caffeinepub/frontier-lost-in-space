/**
 * InteractionDebugShell.tsx — Collapsible real-time interaction debug panel.
 *
 * Activates when:
 *   - localStorage.getItem('debug_shell') === '1'
 *   - OR import.meta.env.DEV === true
 *
 * V20 additions:
 *   - NAV MODE section: currentMode, previousMode, last 5 transition entries
 *   - Nav mode transition buttons for manual testing
 *
 * V21 additions:
 *   - NAV GATE section: last tap accepted/rejected, rejection reason, auto-transition
 *   - CAMERA OFFSETS section: applied FOV and distance offset from cameraOffsetObserver
 *   - INPUT AUTHORITY section: targeting/drag/joystick authority per mode
 *
 * Layout:
 *   Fixed bottom-right overlay (above QaPanel, z-index: 9994)
 *   Dark monospace panel with cyan tactical theme
 *   Display areas: pointer-events: none
 *   Sliders + buttons: pointer-events: auto
 *   Panel container: pointer-events: auto
 */
import { useCallback, useEffect, useState } from "react";
import { useWeaponZoneStore } from "../../combat/useWeaponZoneStore";
import { globalFSM } from "../../interaction/InteractionStateMachine";
import { runInteractionAssertions } from "../../interaction/interactionAssertions";
import { useInteractionStore } from "../../interaction/useInteractionStore";
import {
  NAV_TRANSITION_TABLE,
  globalNavMode,
} from "../../navigation/NavigationModeController";
import {
  cameraOffsetObserver,
  useNavGateStore,
} from "../../navigation/useNavGateStore";
import { useNavigationModeStore } from "../../navigation/useNavigationModeStore";
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

const NAV_MODE_COLORS: Record<string, string> = {
  orbitObservation: "rgba(80,200,255,0.9)",
  tacticalLock: "rgba(255,80,80,0.9)",
  approach: "rgba(255,160,40,0.9)",
  breakaway: "rgba(160,100,255,0.9)",
  cruise: "rgba(60,230,160,0.9)",
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
  color,
}: {
  onClick: () => void;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...MONO,
        background: "rgba(0,30,50,0.8)",
        border: `1px solid ${color ?? "rgba(0,180,220,0.4)"}`,
        color: color ?? CYAN_DIM,
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

// ─── Nav Mode Section ──────────────────────────────────────────────────────

function NavModeSection() {
  const currentMode = useNavigationModeStore((s) => s.currentMode);
  const previousMode = useNavigationModeStore((s) => s.previousMode);
  const transitionHistory = useNavigationModeStore((s) => s.transitionHistory);
  const globeTargetingEnabled = useNavigationModeStore(
    (s) => s.globeTargetingEnabled,
  );
  const joystickPrimary = useNavigationModeStore((s) => s.joystickPrimary);

  const currentColor = NAV_MODE_COLORS[currentMode] ?? CYAN;
  const allowed = NAV_TRANSITION_TABLE[currentMode] ?? [];
  // Derive last 5 history entries in component body (not in selector)
  const last5 = transitionHistory.slice(-5).reverse();

  return (
    <>
      <SectionHeader title="── NAV MODE ───────────────────────" />
      <div style={{ pointerEvents: "none" }}>
        <div
          style={{
            ...MONO,
            display: "flex",
            justifyContent: "space-between",
            padding: "1px 0",
          }}
        >
          <span style={{ color: CYAN_DIM }}>CURRENT</span>
          <span style={{ color: currentColor, letterSpacing: "0.1em" }}>
            {currentMode.toUpperCase()}
          </span>
        </div>
        <Row label="PREVIOUS" value={previousMode.toUpperCase()} />
        <Row
          label="GLOBE TGT"
          value={globeTargetingEnabled ? "ENABLED" : "disabled"}
          warn={!globeTargetingEnabled}
        />
        <Row label="JOYSTICK PRI" value={joystickPrimary ? "YES" : "no"} />
        <Row
          label="ALLOWED →"
          value={allowed.length > 0 ? allowed.join(", ") : "none"}
        />
      </div>

      {/* Manual transition buttons */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 4 }}>
        {allowed.map((target) => (
          <SmallButton
            key={target}
            color={NAV_MODE_COLORS[target] ?? CYAN_DIM}
            onClick={() =>
              globalNavMode.transitionTo(target, "debug-shell manual")
            }
          >
            → {target.slice(0, 7).toUpperCase()}
          </SmallButton>
        ))}
      </div>

      {/* Transition history */}
      <div style={{ pointerEvents: "none", marginTop: 4 }}>
        {last5.length === 0 && (
          <div style={{ ...MONO, color: CYAN_FAINT }}>no transitions yet</div>
        )}
        {last5.map((h, i) => (
          <div
            key={`${h.from}-${h.to}-${h.ts}-${i}`}
            style={{ ...MONO, color: CYAN_DIM, display: "flex", gap: 4 }}
          >
            <span style={{ color: CYAN_FAINT }}>{String(h.ts).slice(-5)}</span>
            <span style={{ color: NAV_MODE_COLORS[h.from] ?? CYAN_DIM }}>
              {h.from.slice(0, 5)}
            </span>
            <span style={{ color: CYAN_FAINT }}>→</span>
            <span style={{ color: NAV_MODE_COLORS[h.to] ?? CYAN }}>
              {h.to.slice(0, 5)}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── V21: NAV GATE + CAMERA SECTION ─────────────────────────────────────────

function NavGateSection() {
  // Stable primitive selectors only
  const lastTapRejection = useNavGateStore((s) => s.lastTapRejection);
  const lastTapAccepted = useNavGateStore((s) => s.lastTapAccepted);
  const lastAutoTransition = useNavGateStore((s) => s.lastAutoTransition);

  // Camera offsets from mutable observer (no Zustand subscription needed)
  const [camFov, setCamFov] = useState(60);
  const [camDist, setCamDist] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCamFov(Math.round(cameraOffsetObserver.appliedFov * 10) / 10);
      setCamDist(
        Math.round(cameraOffsetObserver.appliedDistOffset * 100) / 100,
      );
    }, 200);
    return () => clearInterval(id);
  }, []);

  const tapStatus = (() => {
    const rej = lastTapRejection;
    const acc = lastTapAccepted;
    if (!rej && !acc) return { label: "NO TAPS YET", warn: false };
    const rejTs = rej?.ts ?? 0;
    const accTs = acc?.ts ?? 0;
    if (accTs >= rejTs) return { label: "ACCEPTED", warn: false };
    return { label: "REJECTED", warn: true };
  })();

  return (
    <>
      <SectionHeader title="── NAV GATE ────────────────────────" />
      <div style={{ pointerEvents: "none" }}>
        <Row label="LAST TAP" value={tapStatus.label} warn={tapStatus.warn} />
        {lastTapRejection &&
          (lastTapRejection.ts ?? 0) >= (lastTapAccepted?.ts ?? 0) && (
            <Row
              label="REJECT REASON"
              value={lastTapRejection.reason.slice(0, 28)}
              warn
            />
          )}
        {lastAutoTransition && (
          <>
            <Row
              label="AUTO TRANSITION"
              value={`${lastAutoTransition.from.slice(0, 5)} → ${lastAutoTransition.to.slice(0, 5)}`}
            />
            <Row
              label="AUTO TGT"
              value={lastAutoTransition.targetId.slice(0, 16)}
            />
          </>
        )}
      </div>
      <SectionHeader title="── CAMERA OFFSETS ──────────────────" />
      <div style={{ pointerEvents: "none" }}>
        <Row label="APPLIED FOV" value={`${camFov}°`} />
        <Row
          label="DIST OFFSET"
          value={camDist >= 0 ? `+${camDist}` : String(camDist)}
          warn={Math.abs(camDist) > 0.5}
        />
        <Row
          label="MODE"
          value={cameraOffsetObserver.currentMode.slice(0, 14).toUpperCase()}
        />
      </div>
      <SectionHeader title="── INPUT AUTHORITY ─────────────────" />
      <div style={{ pointerEvents: "none" }}>
        {(() => {
          const mode = globalNavMode.currentMode;
          const def = globalNavMode.currentDefinition;
          return (
            <>
              <Row
                label="TARGETING AUTH"
                value={
                  def.globe.targetingEnabled
                    ? mode.slice(0, 12).toUpperCase()
                    : "DISABLED"
                }
                warn={!def.globe.targetingEnabled}
              />
              <Row
                label="DRAG AUTH"
                value={def.input.globeOwnsDrag ? "GLOBE" : "none"}
                warn={!def.input.globeOwnsDrag}
              />
              <Row
                label="JOYSTICK PRI"
                value={def.input.joystickPrimary ? "YES" : "no"}
              />
            </>
          );
        })()}
      </div>
    </>
  );
}

function WeaponZonesSection() {
  const intentLevels = useWeaponZoneStore((s) => s.intentLevels);
  const dwellTimes = useWeaponZoneStore((s) => s.dwellTimes);
  const hitCounts = useWeaponZoneStore((s) => s.hitCounts);
  const missCounts = useWeaponZoneStore((s) => s.missCounts);
  const consoleMissCount = useWeaponZoneStore((s) => s.consoleMissCount);
  const assistTargetingUI = useWeaponZoneStore((s) => s.assistTargetingUI);
  const setAssistTargetingUI = useWeaponZoneStore(
    (s) => s.setAssistTargetingUI,
  );

  const weaponEntries = Object.entries(intentLevels);

  return (
    <>
      <SectionHeader title="── WEAPON ZONES ────────────────────" />
      <Row
        label="ASSIST TARGETING"
        value={assistTargetingUI ? "ON" : "OFF"}
        warn={!assistTargetingUI}
      />
      <div style={{ display: "flex", gap: 4, marginTop: 2 }}>
        <SmallButton onClick={() => setAssistTargetingUI(!assistTargetingUI)}>
          TOGGLE ASSIST
        </SmallButton>
      </div>
      <div style={{ pointerEvents: "none", marginTop: 2 }}>
        {weaponEntries.map(([id, level]) => {
          const hits = hitCounts[id] ?? 0;
          const misses = missCounts[id] ?? 0;
          const total = hits + misses;
          const hitRate = total > 0 ? Math.round((hits / total) * 100) : 0;
          const dwell = dwellTimes[id] ?? 0;
          return (
            <div
              key={id}
              style={{
                ...MONO,
                display: "flex",
                flexDirection: "column",
                borderTop: "1px solid rgba(0,160,200,0.12)",
                padding: "2px 0",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: CYAN }}>{id.toUpperCase()}</span>
                <span style={{ color: level > 0 ? "#00ff88" : CYAN_FAINT }}>
                  L{level} dwell:{dwell}ms
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: CYAN_DIM }}>
                  hit:{hits} miss:{misses}
                </span>
                <span
                  style={{
                    color:
                      hitRate >= 70
                        ? "#00ff88"
                        : hitRate >= 40
                          ? "#ffaa00"
                          : "#ff4444",
                  }}
                >
                  {total > 0 ? `${hitRate}%` : "—"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <Row
        label="CONSOLE MISSES"
        value={String(consoleMissCount)}
        warn={consoleMissCount > 3}
      />
    </>
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
          {/* ── NAV MODE (V20) ────────────────────────────────────────── */}
          <NavModeSection />

          {/* ── NAV GATE + CAMERA (V21) ──────────────────────────────── */}
          <NavGateSection />

          {/* Pointer info */}
          <SectionHeader title="── POINTER ─────────────────────────────" />
          <Row label="POINTER OWNER" value={pointerOwner} />
          <Row label="TOPMOST TARGET" value={topmostTarget} />
          <Row
            label="LAYERS ABOVE GLOBE"
            value={String(layersAboveGlobe)}
            warn={layersAboveGlobe > 3}
          />

          {/* Events */}
          <SectionHeader title="── LAST 10 EVENTS ───────────────────" />
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
          <SectionHeader title="── RAYCAST / LOCK ───────────────────" />
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
          <SectionHeader title="── JOYSTICK ─────────────────────────" />
          <Row
            label="Joystick Active"
            value={joystickActive ? "YES" : "NO"}
            warn={joystickActive}
          />
          <Row label="Tap/Drag" value={tapVsDrag.toUpperCase()} />

          {/* Globe Health */}
          <SectionHeader title="── GLOBE HEALTH ────────────────────" />
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
          <SectionHeader title="── ASSERTIONS ──────────────────────" />
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
          <SectionHeader title="── SMOKE TESTS ─────────────────────" />
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
          <SectionHeader title="── FSM HISTORY ─────────────────────" />
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

          {/* Weapon Zones */}
          <WeaponZonesSection />

          {/* Tuning */}
          <SectionHeader title="── TUNING ─────────────────────────" />
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
