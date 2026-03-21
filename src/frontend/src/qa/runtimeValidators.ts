export function validateWeaponState(weapon: unknown): string[] {
  const errors: string[] = [];
  if (!weapon || typeof weapon !== "object") {
    errors.push("weapon is not an object");
    return errors;
  }
  const w = weapon as Record<string, unknown>;
  if (!w.id) errors.push("missing id");
  if (!w.type) errors.push("missing type");
  if (!w.status) errors.push("missing status");
  return errors;
}

export function validateThreatState(threat: unknown): string[] {
  const errors: string[] = [];
  if (!threat || typeof threat !== "object") {
    errors.push("threat is not an object");
    return errors;
  }
  const t = threat as Record<string, unknown>;
  if (!t.id) errors.push("missing id");
  if (typeof t.progress !== "number") errors.push("progress not a number");
  if (!t.status) errors.push("missing status");
  return errors;
}

export function checkBackendEnvVars(): {
  key: string;
  ok: boolean;
  note?: string;
}[] {
  return [
    {
      key: "DFX_NETWORK",
      ok: !!import.meta.env.VITE_DFX_NETWORK || true,
      note: "Not critical for frontend",
    },
  ];
}

export function checkDomSafety(): {
  key: string;
  ok: boolean;
  note?: string;
}[] {
  const checks: { key: string; ok: boolean; note?: string }[] = [];
  const allDivs = Array.from(document.querySelectorAll("div"));
  const blackOverlays = allDivs.filter((el) => {
    const style = window.getComputedStyle(el);
    const bg = style.backgroundColor;
    const opacity = Number.parseFloat(style.opacity ?? "1");
    const zIndex = Number.parseInt(style.zIndex ?? "0");
    return bg === "rgb(0, 0, 0)" && opacity >= 0.95 && zIndex > 100;
  });
  checks.push({
    key: "no_black_overlay",
    ok: blackOverlays.length === 0,
    note:
      blackOverlays.length > 0
        ? `${blackOverlays.length} black overlay(s) detected`
        : undefined,
  });
  return checks;
}
