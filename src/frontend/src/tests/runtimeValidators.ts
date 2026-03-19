export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function ok(): ValidationResult {
  return { valid: true, errors: [] };
}
function fail(...errors: string[]): ValidationResult {
  return { valid: false, errors };
}

export function validateWeaponState(w: unknown): ValidationResult {
  if (!w || typeof w !== "object")
    return fail("WeaponState is null/undefined or not an object");
  const obj = w as Record<string, unknown>;
  const errors: string[] = [];
  if (typeof obj.id !== "string") errors.push("weapon.id must be string");
  if (!["READY", "COOLDOWN"].includes(obj.status as string))
    errors.push(`weapon.status invalid: ${String(obj.status)}`);
  if (!["pulse", "railgun", "emp"].includes(obj.type as string))
    errors.push(`weapon.type invalid: ${String(obj.type)}`);
  if (typeof obj.cooldownTime !== "number" || (obj.cooldownTime as number) <= 0)
    errors.push("weapon.cooldownTime must be positive number");
  return errors.length ? fail(...errors) : ok();
}

export function validateThreatState(t: unknown): ValidationResult {
  if (!t || typeof t !== "object") return fail("ThreatState is null/undefined");
  const obj = t as Record<string, unknown>;
  const errors: string[] = [];
  if (typeof obj.id !== "string" || !obj.id)
    errors.push("threat.id must be non-empty string");
  if (
    typeof obj.health !== "number" ||
    (obj.health as number) < 0 ||
    (obj.health as number) > 1
  )
    errors.push(`threat.health out of range: ${String(obj.health)}`);
  if (
    typeof obj.progress !== "number" ||
    (obj.progress as number) < 0 ||
    (obj.progress as number) > 1
  )
    errors.push(`threat.progress out of range: ${String(obj.progress)}`);
  const validStatuses = [
    "INCOMING",
    "IMPACT_RISK",
    "PRIORITY_TARGET",
    "INTERCEPT_WINDOW",
    "DESTROYED",
    "SURVIVED",
  ];
  if (!validStatuses.includes(obj.status as string))
    errors.push(`threat.status invalid: ${String(obj.status)}`);
  return errors.length ? fail(...errors) : ok();
}

export function validateTargetState(t: unknown): ValidationResult {
  if (t === null) return ok();
  if (typeof t !== "string" && t !== null)
    return fail("targetId must be string or null");
  return ok();
}

export function validateAlertEntry(a: unknown): ValidationResult {
  if (!a || typeof a !== "object") return fail("AlertEntry is null/undefined");
  const obj = a as Record<string, unknown>;
  const errors: string[] = [];
  if (typeof obj.id !== "string") errors.push("alert.id must be string");
  if (typeof obj.title !== "string") errors.push("alert.title must be string");
  if (typeof obj.message !== "string")
    errors.push("alert.message must be string");
  if (!["INFO", "WARNING", "CRITICAL"].includes(obj.severity as string))
    errors.push(`alert.severity invalid: ${String(obj.severity)}`);
  if (typeof obj.timestamp !== "number" && typeof obj.timestamp !== "string")
    errors.push("alert.timestamp must be number or string");
  return errors.length ? fail(...errors) : ok();
}

export function checkDomSafety(): { key: string; ok: boolean; note: string }[] {
  return [
    {
      key: "hud_present",
      ok: !!document.querySelector("[data-hud]"),
      note: "[data-hud] element not found — HUD overlay may not have mounted",
    },
    {
      key: "canvas_present",
      ok: document.querySelectorAll("canvas").length >= 1,
      note: "No canvas found — Three.js may not have mounted",
    },
    {
      key: "single_canvas",
      ok: document.querySelectorAll("canvas").length <= 2,
      note: `Duplicate canvases detected: ${document.querySelectorAll("canvas").length}`,
    },
    {
      key: "no_black_overlay",
      ok: !Array.from(document.querySelectorAll("div")).some((el) => {
        const s = window.getComputedStyle(el);
        const bg = s.backgroundColor;
        const z = Number.parseInt(s.zIndex || "0");
        const rect = el.getBoundingClientRect();
        const isCovering =
          rect.width > window.innerWidth * 0.5 &&
          rect.height > window.innerHeight * 0.5;
        const isBlack = bg === "rgb(0, 0, 0)" || bg === "rgba(0, 0, 0, 1)";
        return isBlack && isCovering && z > 5 && z < 9990;
      }),
      note: "Black blocking overlay detected covering center viewport",
    },
    {
      key: "viewport_valid",
      ok: window.innerWidth > 100 && window.innerHeight > 100,
      note: `Viewport dimensions too small: ${window.innerWidth}x${window.innerHeight}`,
    },
  ];
}

export function checkBackendEnvVars(): { key: string; present: boolean }[] {
  return [
    {
      key: "VITE_UPSTASH_REDIS_REST_URL",
      present: !!import.meta.env.VITE_UPSTASH_REDIS_REST_URL,
    },
    {
      key: "VITE_UPSTASH_REDIS_REST_TOKEN",
      present: !!import.meta.env.VITE_UPSTASH_REDIS_REST_TOKEN,
    },
  ];
}

export function safeJsonParse<T>(raw: unknown, fallback: T): T {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }
  if (raw !== null && raw !== undefined) return raw as T;
  return fallback;
}
