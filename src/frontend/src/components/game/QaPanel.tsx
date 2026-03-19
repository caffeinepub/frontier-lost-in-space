import { useCallback, useState } from "react";
import { useThreatStore } from "../../combat/useThreatStore";
import { useWeaponsStore } from "../../combat/useWeapons";
import { useTacticalStore } from "../../hooks/useTacticalStore";
import { type GlobalQaSummary, runAllSmokeTests } from "../../tests/smokeTests";
import { runStressTests } from "../../tests/stressTests";
import type { QaCategory, QaCheckResult, QaStatus } from "../../types";

const STATUS_ICON: Record<QaStatus, string> = {
  PASS: "✓",
  FAIL: "✗",
  SKIP: "—",
  PARTIAL: "~",
  NOT_IMPLEMENTED: "?",
  PENDING: "…",
};

const STATUS_COLOR: Record<QaStatus, string> = {
  PASS: "rgba(0,255,150,0.9)",
  FAIL: "rgba(255,80,80,0.95)",
  SKIP: "rgba(120,140,160,0.6)",
  PARTIAL: "rgba(255,200,50,0.85)",
  NOT_IMPLEMENTED: "rgba(100,120,160,0.7)",
  PENDING: "rgba(100,180,220,0.6)",
};

export default function QaPanel() {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<GlobalQaSummary | null>(null);
  const [stressResults, setStressResults] = useState<QaCheckResult[]>([]);
  const [running, setRunning] = useState(false);
  const [stressRunning, setStressRunning] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );

  const selectedNode = useTacticalStore((s) => s.selectedNode);
  const threats = useThreatStore((s) => s.threats);

  const runTests = useCallback(async () => {
    setRunning(true);
    await new Promise<void>((r) => setTimeout(r, 50));
    const result = await runAllSmokeTests({
      selectedNode,
      threats,
    });
    setSummary(result);
    setRunning(false);
  }, [selectedNode, threats]);

  const runStress = useCallback(async () => {
    setStressRunning(true);
    const results = await runStressTests();
    setStressResults(results);
    setStressRunning(false);
  }, []);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const hasSummary = !!summary;
  const allStable = summary ? summary.stable : null;

  const accentColor = hasSummary
    ? allStable
      ? "rgba(0,220,150,0.5)"
      : "rgba(255,60,60,0.5)"
    : "rgba(0,180,255,0.35)";

  const panelBg = hasSummary
    ? allStable
      ? "rgba(0,40,30,0.95)"
      : "rgba(40,10,10,0.95)"
    : "rgba(0,10,30,0.92)";

  /* ─── Collapsed pill ─────────────────────────────────────── */
  if (!open) {
    return (
      <div
        style={{
          position: "fixed",
          bottom: "clamp(8px, 2vw, 18px)",
          right: "clamp(8px, 2vw, 18px)",
          zIndex: 9999,
          pointerEvents: "auto",
          fontFamily: "monospace",
        }}
      >
        <button
          type="button"
          data-ocid="smoke.toggle"
          onClick={() => {
            if (!hasSummary) runTests();
            setOpen(true);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 10px",
            background: panelBg,
            border: `1px solid ${accentColor}`,
            cursor: "pointer",
            whiteSpace: "nowrap" as const,
          }}
        >
          {running ? (
            <span
              style={{
                color: "rgba(0,200,255,0.8)",
                fontSize: 9,
                letterSpacing: "0.12em",
              }}
            >
              ⟳ RUNNING...
            </span>
          ) : hasSummary ? (
            /* Compact pill: STATUS • PASS 30 • FAIL 5 • SKIP 18 */
            <>
              <span
                style={{
                  color: allStable
                    ? "rgba(0,255,150,0.9)"
                    : "rgba(255,80,80,0.9)",
                  fontSize: 8,
                  letterSpacing: "0.14em",
                  fontWeight: 700,
                }}
              >
                QA {allStable ? "◆ STABLE" : "◆ UNSTABLE"}
              </span>
              <span style={{ color: "rgba(0,180,255,0.25)", fontSize: 8 }}>
                |
              </span>
              <span
                style={{
                  color: STATUS_COLOR.PASS,
                  fontSize: 8,
                  letterSpacing: "0.08em",
                }}
              >
                PASS&nbsp;
                <strong style={{ fontSize: 10 }}>{summary!.totalPass}</strong>
              </span>
              <span
                style={{
                  color: STATUS_COLOR.FAIL,
                  fontSize: 8,
                  letterSpacing: "0.08em",
                }}
              >
                FAIL&nbsp;
                <strong style={{ fontSize: 10 }}>{summary!.totalFail}</strong>
              </span>
              <span
                style={{
                  color: STATUS_COLOR.SKIP,
                  fontSize: 8,
                  letterSpacing: "0.08em",
                }}
              >
                SKIP&nbsp;
                <strong style={{ fontSize: 10 }}>{summary!.totalSkip}</strong>
              </span>
            </>
          ) : (
            <span
              style={{
                color: "rgba(0,180,255,0.7)",
                fontSize: 9,
                letterSpacing: "0.12em",
              }}
            >
              QA ◆ RUN TESTS
            </span>
          )}
        </button>
      </div>
    );
  }

  /* ─── Expanded panel ─────────────────────────────────────── */
  return (
    <div
      style={{
        position: "fixed",
        bottom: "clamp(8px, 2vw, 18px)",
        right: "clamp(8px, 2vw, 18px)",
        zIndex: 9999,
        pointerEvents: "auto",
        fontFamily: "monospace",
        width: "clamp(260px, 30vw, 380px)",
        maxWidth: "calc(100vw - 16px)",
        display: "flex",
        flexDirection: "column" as const,
        background: "rgba(0,5,22,0.97)",
        border: `1px solid ${accentColor}`,
        backdropFilter: "blur(8px)",
        maxHeight: "clamp(50vh, 65vh, 72vh)",
        overflow: "hidden",
      }}
    >
      {/* ── Panel header: title + close ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "7px 10px 6px",
          borderBottom: "1px solid rgba(0,180,255,0.15)",
          background: "rgba(0,5,22,0.98)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            color: "rgba(0,180,255,0.85)",
            letterSpacing: "0.15em",
            fontSize: 9,
            fontWeight: 700,
          }}
        >
          TACTICAL QA SYSTEM
        </span>
        <button
          type="button"
          data-ocid="smoke.close_button"
          onClick={() => setOpen(false)}
          style={{
            background: "none",
            border: "none",
            color: "rgba(0,180,255,0.5)",
            cursor: "pointer",
            padding: "0 4px",
            fontSize: 14,
            lineHeight: 1,
            minHeight: 24,
            minWidth: 24,
          }}
        >
          ×
        </button>
      </div>

      {/* ── QA STATUS bar — only when tests have run ── */}
      {hasSummary && (
        <div
          style={{
            padding: "6px 12px",
            borderBottom: `1px solid ${accentColor}`,
            background: allStable ? "rgba(0,30,20,0.6)" : "rgba(35,5,5,0.6)",
            flexShrink: 0,
          }}
        >
          {/* Row 1: label + stability */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 5,
            }}
          >
            <span
              style={{
                color: allStable
                  ? "rgba(0,255,150,0.9)"
                  : "rgba(255,80,80,0.9)",
                fontSize: 8,
                letterSpacing: "0.18em",
                fontWeight: 700,
              }}
            >
              QA STATUS
            </span>
            <span
              style={{
                color: allStable
                  ? "rgba(0,255,150,0.65)"
                  : "rgba(255,80,80,0.65)",
                fontSize: 7,
                letterSpacing: "0.1em",
              }}
            >
              {allStable ? "◆ STABLE" : "◆ UNSTABLE"}
            </span>
          </div>
          {/* Row 2: PASS / FAIL / SKIP counts */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 4,
            }}
          >
            {(
              [
                {
                  label: "PASS",
                  value: summary!.totalPass,
                  color: STATUS_COLOR.PASS,
                  dim: "rgba(0,200,120,0.45)",
                },
                {
                  label: "FAIL",
                  value: summary!.totalFail,
                  color: STATUS_COLOR.FAIL,
                  dim: "rgba(220,60,60,0.45)",
                },
                {
                  label: "SKIP",
                  value: summary!.totalSkip,
                  color: STATUS_COLOR.SKIP,
                  dim: "rgba(100,130,160,0.45)",
                },
              ] as const
            ).map(({ label, value, color, dim }) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  flexDirection: "column" as const,
                  alignItems: "center",
                  padding: "3px 0",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: 2,
                  border: `1px solid ${dim}`,
                }}
              >
                <span
                  style={{
                    color,
                    fontSize: 13,
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                >
                  {value}
                </span>
                <span
                  style={{
                    color: dim,
                    fontSize: 7,
                    letterSpacing: "0.12em",
                    marginTop: 2,
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Sections list ── */}
      <div style={{ overflowY: "auto" as const, flex: 1 }}>
        {hasSummary &&
          summary!.sections.map((section) => {
            const key = section.suite;
            const expanded = expandedSections.has(key);
            const sectionFail = section.fail > 0;
            const sectionColor = sectionFail
              ? "rgba(255,80,80,0.85)"
              : section.pass ===
                  section.pass +
                    section.fail +
                    section.skip +
                    section.partial +
                    section.notImplemented
                ? "rgba(0,255,150,0.8)"
                : "rgba(255,200,50,0.8)";

            return (
              <div
                key={key}
                style={{ borderBottom: "1px solid rgba(0,180,255,0.08)" }}
              >
                <button
                  type="button"
                  onClick={() => toggleSection(key)}
                  style={{
                    display: "flex",
                    width: "100%",
                    padding: "5px 10px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    alignItems: "center",
                    gap: 6,
                    textAlign: "left" as const,
                  }}
                >
                  <span
                    style={{
                      color: sectionColor,
                      fontSize: 9,
                      fontFamily: "monospace",
                      letterSpacing: "0.12em",
                      flex: 1,
                    }}
                  >
                    {expanded ? "▾" : "▸"} {key}
                  </span>
                  <span style={{ color: STATUS_COLOR.PASS, fontSize: 8 }}>
                    {section.pass}P
                  </span>
                  {section.fail > 0 && (
                    <span style={{ color: STATUS_COLOR.FAIL, fontSize: 8 }}>
                      {section.fail}F
                    </span>
                  )}
                  <span style={{ color: STATUS_COLOR.SKIP, fontSize: 8 }}>
                    {section.skip}S
                  </span>
                </button>

                {expanded && (
                  <div style={{ paddingBottom: 4 }}>
                    {section.results.map((c) => (
                      <div
                        key={c.name}
                        style={{
                          display: "flex",
                          flexDirection: "column" as const,
                          padding: "2px 14px 2px 18px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: 5,
                            alignItems: "flex-start",
                          }}
                        >
                          <span
                            style={{
                              color: STATUS_COLOR[c.status],
                              flexShrink: 0,
                              fontSize: 9,
                            }}
                          >
                            {STATUS_ICON[c.status]}
                          </span>
                          <span
                            style={{
                              color: "rgba(180,210,240,0.75)",
                              fontSize: 8,
                              letterSpacing: "0.04em",
                              lineHeight: 1.4,
                            }}
                          >
                            {c.name}
                          </span>
                        </div>
                        {c.detail && (
                          <div
                            style={{
                              color: "rgba(120,150,180,0.55)",
                              fontSize: 7.5,
                              letterSpacing: "0.03em",
                              paddingLeft: 14,
                              lineHeight: 1.3,
                              marginTop: 1,
                            }}
                          >
                            {c.detail}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

        {/* Stress test results */}
        {stressResults.length > 0 && (
          <div style={{ borderBottom: "1px solid rgba(0,180,255,0.08)" }}>
            <div
              style={{
                padding: "5px 10px",
                color: "rgba(255,200,50,0.8)",
                fontSize: 9,
                letterSpacing: "0.12em",
              }}
            >
              ▸ STRESS TESTS
            </div>
            {stressResults.map((c) => (
              <div
                key={c.id}
                style={{
                  display: "flex",
                  gap: 5,
                  padding: "2px 14px 2px 18px",
                  alignItems: "flex-start",
                }}
              >
                <span
                  style={{
                    color: STATUS_COLOR[c.status],
                    flexShrink: 0,
                    fontSize: 9,
                  }}
                >
                  {STATUS_ICON[c.status]}
                </span>
                <div>
                  <div style={{ color: "rgba(180,210,240,0.75)", fontSize: 8 }}>
                    {c.label}
                  </div>
                  {c.message && (
                    <div
                      style={{ color: "rgba(120,150,180,0.55)", fontSize: 7.5 }}
                    >
                      {c.message}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Action buttons — pinned at bottom ── */}
      <div
        style={{
          display: "flex",
          gap: 4,
          padding: "7px 10px",
          borderTop: "1px solid rgba(0,180,255,0.12)",
          background: "rgba(0,5,22,0.98)",
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={runTests}
          disabled={running}
          style={{
            flex: 1,
            padding: "5px 6px",
            background: "rgba(0,20,40,0.8)",
            border: "1px solid rgba(0,180,255,0.35)",
            color: "rgba(0,200,255,0.85)",
            cursor: running ? "not-allowed" : "pointer",
            fontFamily: "monospace",
            fontSize: 8,
            letterSpacing: "0.1em",
          }}
        >
          {running ? "RUNNING..." : "RUN ALL TESTS"}
        </button>
        <button
          type="button"
          onClick={runStress}
          disabled={stressRunning}
          style={{
            flex: 1,
            padding: "5px 6px",
            background: "rgba(20,10,0,0.8)",
            border: "1px solid rgba(255,140,0,0.35)",
            color: "rgba(255,160,50,0.85)",
            cursor: stressRunning ? "not-allowed" : "pointer",
            fontFamily: "monospace",
            fontSize: 8,
            letterSpacing: "0.1em",
          }}
        >
          {stressRunning ? "STRESS..." : "STRESS TEST"}
        </button>
      </div>
    </div>
  );
}
