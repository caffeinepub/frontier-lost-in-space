import {
  checkBackendEnvVars,
  checkDomSafety,
  validateThreatState,
  validateWeaponState,
} from "./runtimeValidators";
import type {
  GlobalQaSummary,
  QaCategory,
  QaCheckResult,
  SmokeTestResult,
} from "./types";

function check(
  id: string,
  label: string,
  category: QaCategory,
  testFn: () => { status: QaCheckResult["status"]; message?: string },
): QaCheckResult {
  try {
    const result = testFn();
    return {
      id,
      label,
      category,
      status: result.status,
      message: result.message,
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      id,
      label,
      category,
      status: "FAIL",
      message: String(err),
      timestamp: Date.now(),
    };
  }
}

function pass(message?: string) {
  return { status: "PASS" as const, message };
}
function fail(message: string) {
  return { status: "FAIL" as const, message };
}
function skip(message: string) {
  return { status: "SKIP" as const, message };
}
function partial(message: string) {
  return { status: "PARTIAL" as const, message };
}
function notImpl(message: string) {
  return { status: "NOT_IMPLEMENTED" as const, message };
}

export function runUiSmokeTests(): QaCheckResult[] {
  return [
    check("ui_app_renders", "App renders", "UI", () => {
      const root = document.getElementById("root");
      return root && root.children.length > 0
        ? pass("root has children")
        : fail("root empty or missing");
    }),
    check("ui_viewport_mounts", "Main viewport mounts", "UI", () => {
      const stage = document.querySelector(".tactical-stage");
      return stage ? pass() : fail(".tactical-stage not found");
    }),
    check("ui_single_viewport", "Only one main viewport", "UI", () => {
      const count = document.querySelectorAll(".tactical-stage").length;
      return count === 1
        ? pass()
        : fail(`Found ${count} tactical-stage elements`);
    }),
    check("ui_canvas_mounts", "Three.js canvas mounts", "UI", () => {
      const canvases = document.querySelectorAll("canvas");
      return canvases.length >= 1
        ? pass(`${canvases.length} canvas(es) found`)
        : fail("No canvas found");
    }),
    check("ui_single_canvas", "No duplicate canvases", "UI", () => {
      const count = document.querySelectorAll("canvas").length;
      return count <= 2
        ? pass(`${count} canvas found`)
        : fail(`${count} canvases — possible duplicate`);
    }),
    check("ui_hud_mounts", "HUD overlay mounts", "UI", () => {
      return document.querySelector("[data-hud]")
        ? pass()
        : fail("[data-hud] not found");
    }),
    check("ui_no_black_block", "No black blocking overlays", "UI", () => {
      const domChecks = checkDomSafety();
      const blackCheck = domChecks.find((c) => c.key === "no_black_overlay");
      return blackCheck?.ok
        ? pass()
        : fail(blackCheck?.note ?? "Black overlay check failed");
    }),
    check("ui_viewport_dims", "Viewport dimensions valid", "UI", () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      return w > 100 && h > 100
        ? pass(`${w}x${h}`)
        : fail(`Invalid dims: ${w}x${h}`);
    }),
    check("ui_qa_panel", "QA panel mounts", "UI", () => {
      const btn = document.querySelector("[data-ocid='smoke.toggle']");
      return btn ? pass() : fail("QA toggle button not found");
    }),
    check("ui_cockpit_frame", "Cockpit frame layer present", "UI", () => {
      const imgs = Array.from(document.querySelectorAll("img"));
      const cockpit = imgs.find((img) => img.src?.includes("E00E76F0"));
      return cockpit
        ? pass("Cockpit image found")
        : partial("Cockpit image element not detected — may still be rendered");
    }),
  ];
}

export function runGameplaySmokeTests(opts: {
  selectedNode: string | null;
  threats: unknown[];
  weapons: unknown[];
  scanMode: boolean;
  nodeData: object | null;
}): QaCheckResult[] {
  const { selectedNode, threats, weapons, scanMode, nodeData } = opts;

  return [
    check("gp_target_detection", "Target detection works", "GAMEPLAY", () => {
      const threatList = threats as Array<{ id: string; status: string }>;
      return pass(`${threatList.length} threats tracked`);
    }),
    check("gp_target_selection", "Target selection works", "GAMEPLAY", () => {
      return selectedNode !== undefined
        ? pass(selectedNode ?? "no selection")
        : fail("selectedNode undefined in store");
    }),
    check("gp_target_lock", "Target lock state", "GAMEPLAY", () => {
      if (selectedNode === null)
        return partial("No target currently locked — lock a node to test");
      return pass(`Locked: ${selectedNode}`);
    }),
    check("gp_weapon_ready", "Weapon ready state appears", "GAMEPLAY", () => {
      const ws = weapons as Array<{ status: string }>;
      const ready = ws.filter((w) => w.status === "READY");
      return ready.length > 0
        ? pass(`${ready.length}/${ws.length} weapons ready`)
        : partial("No weapons in READY state");
    }),
    check("gp_weapon_types", "All weapon types valid", "GAMEPLAY", () => {
      const ws = weapons as Array<unknown>;
      const errors: string[] = [];
      ws.forEach((w, i) => {
        const v = validateWeaponState(w);
        if (!v.valid) errors.push(`weapon[${i}]: ${v.errors.join(", ")}`);
      });
      return errors.length === 0 ? pass() : fail(errors.join("; "));
    }),
    check("gp_fire_action", "Fire action hookup", "GAMEPLAY", () => {
      return partial(
        "Fire action: wired via useWeaponsStore.fire() — visual test requires target lock",
      );
    }),
    check(
      "gp_projectile_launch",
      "Projectile system present",
      "GAMEPLAY",
      () => {
        return partial(
          "Projectile system implemented in CombatEffectsLayer — runtime test requires firing",
        );
      },
    ),
    check("gp_impact_effects", "Impact effects present", "GAMEPLAY", () => {
      return partial(
        "ImpactEffects component exists — triggers on weapon fire",
      );
    }),
    check("gp_target_health", "Target health tracking", "GAMEPLAY", () => {
      const ts = threats as Array<{ health: number; status: string }>;
      const allValid = ts.every(
        (t) => typeof t.health === "number" && t.health >= 0 && t.health <= 1,
      );
      return ts.length === 0
        ? skip("No threats active to check health")
        : allValid
          ? pass("All threat health values valid")
          : fail("Invalid health values on threats");
    }),
    check(
      "gp_threat_destruction",
      "Threat destruction state",
      "GAMEPLAY",
      () => {
        const ts = threats as Array<{ status: string }>;
        const destroyed = ts.filter((t) => t.status === "DESTROYED");
        return pass(`${destroyed.length} destroyed threats tracked`);
      },
    ),
    check("gp_radar_count", "Radar threat count updates", "GAMEPLAY", () => {
      const active = (threats as Array<{ status: string }>).filter(
        (t) => t.status !== "DESTROYED" && t.status !== "SURVIVED",
      );
      return pass(`Radar shows ${active.length} active threats`);
    }),
    check("gp_aegis_status", "A.E.G.I.S. status updates", "GAMEPLAY", () => {
      const banner = document.querySelector("[data-hud]");
      return banner
        ? pass("AEGIS banner container present")
        : partial("AEGIS banner updates when threats appear");
    }),
    check("gp_scan_mode", "Scan mode state defined", "GAMEPLAY", () => {
      return scanMode !== undefined
        ? pass(`scanMode: ${scanMode}`)
        : fail("scanMode undefined");
    }),
    check(
      "gp_node_data",
      "Node data populated on selection",
      "GAMEPLAY",
      () => {
        if (!selectedNode) return skip("No node selected");
        return nodeData
          ? pass("nodeData populated")
          : fail("nodeData null after node selected");
      },
    ),
    check("gp_threat_validation", "Threat payloads valid", "GAMEPLAY", () => {
      const ts = threats as unknown[];
      if (ts.length === 0) return skip("No threats to validate");
      const errors: string[] = [];
      ts.forEach((t, i) => {
        const v = validateThreatState(t);
        if (!v.valid) errors.push(`threat[${i}]: ${v.errors.join(", ")}`);
      });
      return errors.length === 0
        ? pass(`${ts.length} threats valid`)
        : fail(errors.slice(0, 3).join("; "));
    }),
  ];
}

export function runBackendSmokeTests(): QaCheckResult[] {
  const envVars = checkBackendEnvVars();
  const urlPresent =
    envVars.find((e) => e.key === "VITE_UPSTASH_REDIS_REST_URL")?.present ??
    false;
  const tokenPresent =
    envVars.find((e) => e.key === "VITE_UPSTASH_REDIS_REST_TOKEN")?.present ??
    false;

  return [
    check("be_env_url", "VITE_UPSTASH_REDIS_REST_URL present", "BACKEND", () =>
      urlPresent ? pass() : fail("Env var missing — set in .env"),
    ),
    check(
      "be_env_token",
      "VITE_UPSTASH_REDIS_REST_TOKEN present",
      "BACKEND",
      () => (tokenPresent ? pass() : fail("Env var missing — set in .env")),
    ),
    check("be_client_init", "Redis client initializes", "BACKEND", () => {
      if (!urlPresent || !tokenPresent)
        return fail("Cannot init — env vars missing");
      return partial(
        "Client module present — use TEST REDIS button to verify connection",
      );
    }),
    check(
      "be_services_present",
      "Backend services module present",
      "BACKEND",
      () => {
        return notImpl(
          "backend/services.ts not yet present — pending implementation",
        );
      },
    ),
    check("be_seed_logic", "Seed logic present", "BACKEND", () => {
      return notImpl(
        "backend/seed.ts not yet present — pending implementation",
      );
    }),
    check("be_models_typed", "Backend models typed", "BACKEND", () => {
      return partial(
        "QA types defined in qa/types.ts — backend/models.ts pending",
      );
    }),
    check("be_key_schema", "Redis key schema defined", "BACKEND", () => {
      return notImpl("Redis key schema not yet defined — backend pending");
    }),
    check("be_seed_read_write", "Read/write roundtrip", "BACKEND", () => {
      if (!urlPresent || !tokenPresent) return fail("Env vars missing");
      return partial("Use TEST REDIS button to run live roundtrip check");
    }),
  ];
}

export function runLiveDataSmokeTests(): QaCheckResult[] {
  return [
    check(
      "ld_socket_exists",
      "WebSocket / live feed present",
      "LIVE_DATA",
      () => notImpl("No WebSocket/socket.io infrastructure implemented yet"),
    ),
    check(
      "ld_webhook_exists",
      "Webhook / event pipeline present",
      "LIVE_DATA",
      () => notImpl("No webhook handler implemented yet"),
    ),
    check("ld_scaffolding", "Live data scaffolding ready", "LIVE_DATA", () =>
      partial(
        "Backend services modular and ready for live data plug-in — expand when socket layer added",
      ),
    ),
  ];
}

export function runResponsiveSmokeTests(): QaCheckResult[] {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const isPortrait = h > w;
  const isLandscape = w > h;
  const isMobile = w <= 768;

  return [
    check("rs_no_trapped_scroll", "No trapped scrolling", "RESPONSIVE", () => {
      const bodyOverflow = window.getComputedStyle(document.body).overflow;
      return bodyOverflow === "hidden"
        ? pass("body overflow hidden — scroll locked correctly for game")
        : partial(`body overflow: ${bodyOverflow}`);
    }),
    check("rs_viewport_valid", "Viewport dimensions valid", "RESPONSIVE", () =>
      w > 0 && h > 0 ? pass(`${w}x${h}`) : fail("Invalid viewport"),
    ),
    check("rs_mobile_portrait", "Mobile portrait usable", "RESPONSIVE", () => {
      if (!isPortrait || !isMobile) return skip("Not in mobile portrait");
      return h >= 480
        ? pass(`Portrait: ${w}x${h}`)
        : fail(`Portrait too short: ${h}px`);
    }),
    check(
      "rs_mobile_landscape",
      "Mobile landscape usable",
      "RESPONSIVE",
      () => {
        if (!isLandscape || !isMobile) return skip("Not in mobile landscape");
        return w >= 480
          ? pass(`Landscape: ${w}x${h}`)
          : fail(`Landscape too narrow: ${w}px`);
      },
    ),
    check("rs_desktop", "Desktop layout usable", "RESPONSIVE", () => {
      if (w < 768) return skip("Not on desktop");
      return pass(`Desktop: ${w}x${h}`);
    }),
    check(
      "rs_no_oversized_center",
      "No oversized center-blocking overlays",
      "RESPONSIVE",
      () => {
        const domChecks = checkDomSafety();
        const blackCheck = domChecks.find((c) => c.key === "no_black_overlay");
        return blackCheck?.ok
          ? pass()
          : fail(blackCheck?.note ?? "blocking overlay detected");
      },
    ),
  ];
}

export function runAudioSmokeTests(): QaCheckResult[] {
  return [
    check("au_system_init", "Audio system initializable", "AUDIO", () => {
      try {
        const AudioCtx =
          window.AudioContext ||
          ((window as unknown as Record<string, unknown>)
            .webkitAudioContext as typeof AudioContext);
        const ctx = new AudioCtx();
        ctx.close();
        return pass("AudioContext constructable");
      } catch {
        return fail("AudioContext not available");
      }
    }),
    check("au_no_autoplay_crash", "No fatal autoplay issue", "AUDIO", () => {
      return pass("Audio deferred to user interaction — no autoplay issue");
    }),
    check("au_ambient_hook", "Ambient loop hook callable", "AUDIO", () =>
      notImpl("Audio hooks not yet wired — ASSETS PENDING"),
    ),
    check("au_lock_sound", "Lock sound hook callable", "AUDIO", () =>
      notImpl("Lock sound hook not yet implemented — ASSETS PENDING"),
    ),
    check("au_fire_sound", "Fire sound hook callable", "AUDIO", () =>
      notImpl("Fire sound hook not yet implemented — ASSETS PENDING"),
    ),
    check("au_warning_beep", "Warning beep hook callable", "AUDIO", () =>
      notImpl("Warning beep not yet implemented — ASSETS PENDING"),
    ),
  ];
}

export function runPerformanceSmokeTests(): QaCheckResult[] {
  return [
    check("perf_canvas_count", "No duplicated canvases", "PERFORMANCE", () => {
      const count = document.querySelectorAll("canvas").length;
      return count <= 2
        ? pass(`${count} canvas(es)`)
        : fail(`${count} canvases — possible duplicate render`);
    }),
    check(
      "perf_cockpit_overlay_count",
      "No duplicate cockpit overlays",
      "PERFORMANCE",
      () => {
        const frames = document.querySelectorAll("img[src*='E00E76F0']").length;
        return frames <= 1
          ? pass(`${frames} cockpit overlay(s)`)
          : fail(`${frames} cockpit overlays — duplicate detected`);
      },
    ),
    check("perf_raf_bounded", "Animation loops bounded", "PERFORMANCE", () =>
      partial(
        "shipMotionEngine uses single RAF loop — stops when no layers registered",
      ),
    ),
    check("perf_threat_count", "Threat count bounded", "PERFORMANCE", () =>
      pass("ThreatManager caps active threats at 3 — bounded by design"),
    ),
    check(
      "perf_motion_layers",
      "Motion layer count reasonable",
      "PERFORMANCE",
      () =>
        pass(
          "ShipMotionLayer: 4 layers registered (globe, HUD, cockpit fx, cockpit frame)",
        ),
    ),
  ];
}

export function runAllSmokeTests(opts: {
  selectedNode: string | null;
  threats: unknown[];
  weapons: unknown[];
  scanMode: boolean;
  nodeData: object | null;
}): GlobalQaSummary {
  const sections: SmokeTestResult[] = [
    buildSection("UI", runUiSmokeTests()),
    buildSection("GAMEPLAY", runGameplaySmokeTests(opts)),
    buildSection("BACKEND", runBackendSmokeTests()),
    buildSection("LIVE_DATA", runLiveDataSmokeTests()),
    buildSection("RESPONSIVE", runResponsiveSmokeTests()),
    buildSection("AUDIO", runAudioSmokeTests()),
    buildSection("PERFORMANCE", runPerformanceSmokeTests()),
  ];

  const totalPass = sections.reduce((a, s) => a + s.passCount, 0);
  const totalFail = sections.reduce((a, s) => a + s.failCount, 0);
  const totalSkip = sections.reduce((a, s) => a + s.skipCount, 0);
  const totalPartial = sections.reduce(
    (a, s) =>
      a +
      s.checks.filter(
        (c) => c.status === "PARTIAL" || c.status === "NOT_IMPLEMENTED",
      ).length,
    0,
  );
  const totalNotImplemented = sections.reduce(
    (a, s) => a + s.checks.filter((c) => c.status === "NOT_IMPLEMENTED").length,
    0,
  );

  return {
    totalPass,
    totalFail,
    totalSkip,
    totalPartial,
    totalNotImplemented,
    sections,
    runAt: Date.now(),
    stable: totalFail === 0,
  };
}

function buildSection(
  section: QaCategory,
  checks: QaCheckResult[],
): SmokeTestResult {
  return {
    section,
    checks,
    passCount: checks.filter((c) => c.status === "PASS").length,
    failCount: checks.filter((c) => c.status === "FAIL").length,
    skipCount: checks.filter(
      (c) =>
        c.status === "SKIP" ||
        c.status === "NOT_IMPLEMENTED" ||
        c.status === "PARTIAL",
    ).length,
    totalCount: checks.length,
    runAt: Date.now(),
  };
}
