import { type BootState, useBootStore } from "./useBootStore";

const STATIC_IMAGE_URL =
  "https://cyan-chemical-capybara-537.mypinata.cloud/ipfs/bafybeigvbvrbpjr56x6lzmrt22pgllm5xyhp4bniuvdlmvapy6pysgidnq?pinataGatewayToken=7zglWYSGiMDzNDI6rKBp6n24Hn5dRANGNukXWHOraLmAUnl5cjJrHMrbnpJJJj2G";

function ts() {
  return `${Math.round(performance.now())}ms`;
}

async function phaseInitializingCore(store: BootState): Promise<boolean> {
  store.setPhase("initializing_core", "Validating core systems...", 5);
  console.log(`[BOOT ${ts()}] Phase: initializing_core`);
  try {
    if (typeof window === "undefined") throw new Error("window is undefined");
    const testKey = "_frontier_boot_test";
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
    store.setPhase("initializing_core", "Core systems online", 15);
    console.log(`[BOOT ${ts()}] Core systems online`);
    return true;
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    store.setError(`Core init failed: ${e.message}`, e.stack ?? "");
    return false;
  }
}

async function phaseConnectingNetwork(store: BootState): Promise<boolean> {
  store.setPhase("connecting_network", "Connecting to network...", 20);
  console.log(`[BOOT ${ts()}] Phase: connecting_network`);
  try {
    await new Promise<void>((resolve) => setTimeout(resolve, 50));
    store.setPhase("connecting_network", "Network ready", 30);
    console.log(`[BOOT ${ts()}] Network ready`);
    return true;
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    store.setError(`Network connection failed: ${e.message}`, e.stack ?? "");
    return false;
  }
}

async function phaseHydratingData(store: BootState): Promise<boolean> {
  store.setPhase("hydrating_data", "Loading player data...", 35);
  console.log(`[BOOT ${ts()}] Phase: hydrating_data`);
  try {
    const raw = localStorage.getItem("frontier_player_state");
    let count = 0;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        count =
          typeof parsed === "object" && parsed !== null
            ? Object.keys(parsed).length
            : 1;
      } catch {
        console.warn("[BOOT] frontier_player_state parse failed — fresh state");
      }
    }
    store.setPhase("hydrating_data", `Player data loaded (${count} keys)`, 50);
    console.log(`[BOOT ${ts()}] Player data hydrated — ${count} keys`);
    return true;
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    store.setError(`Data hydration failed: ${e.message}`, e.stack ?? "");
    return false;
  }
}

async function phaseInitializingEngine(store: BootState): Promise<boolean> {
  store.setPhase("initializing_engine", "Starting render engine...", 55);
  console.log(`[BOOT ${ts()}] Phase: initializing_engine`);
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) {
      throw new Error(
        "WebGL is not supported on this device. Please use a browser with WebGL enabled.",
      );
    }
    store.setPhase("initializing_engine", "Render engine ready", 65);
    console.log(`[BOOT ${ts()}] WebGL engine ready`);
    return true;
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    store.setError(`Render engine failed: ${e.message}`, e.stack ?? "");
    return false;
  }
}

async function phaseLoadingAssets(store: BootState): Promise<boolean> {
  store.setPhase("loading_assets", "Prefetching menu assets...", 65);
  console.log(`[BOOT ${ts()}] Phase: loading_assets`);
  try {
    await new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        useBootStore.getState().setPhase("loading_assets", "Assets loaded", 90);
        console.log(`[BOOT ${ts()}] Menu image loaded`);
        resolve();
      };
      img.onerror = () => {
        // Don't block boot on image failure
        console.warn(`[BOOT ${ts()}] Menu image failed to load — continuing`);
        resolve();
      };
      img.src = STATIC_IMAGE_URL;
    });
    return true;
  } catch (err) {
    // Asset loading is non-fatal
    console.warn("[BOOT] Asset load error (non-fatal):", err);
    return true;
  }
}

export async function runBootSequence(_store: BootState): Promise<void> {
  // Always read fresh state via getState() to avoid stale closures
  const getStore = () => useBootStore.getState();

  console.log(`[BOOT ${ts()}] Boot sequence starting`);

  if (!(await phaseInitializingCore(getStore()))) return;
  if (!(await phaseConnectingNetwork(getStore()))) return;
  if (!(await phaseHydratingData(getStore()))) return;
  if (!(await phaseInitializingEngine(getStore()))) return;
  if (!(await phaseLoadingAssets(getStore()))) return;

  getStore().setPhase("ready", "Systems online", 100);
  console.log(`[BOOT ${ts()}] Phase: ready — boot complete`);
}
