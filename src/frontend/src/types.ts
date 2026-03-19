export type QaStatus =
  | "PASS"
  | "FAIL"
  | "SKIP"
  | "PARTIAL"
  | "NOT_IMPLEMENTED"
  | "PENDING";

export interface QaCheckResult {
  id: string;
  label: string;
  status: QaStatus;
  message?: string;
  category: QaCategory;
  timestamp: number;
}

export type QaCategory =
  | "UI"
  | "GAMEPLAY"
  | "BACKEND"
  | "LIVE_DATA"
  | "RESPONSIVE"
  | "AUDIO"
  | "PERFORMANCE";

export interface SmokeTestResult {
  section: QaCategory;
  checks: QaCheckResult[];
  passCount: number;
  failCount: number;
  skipCount: number;
  totalCount: number;
  runAt: number;
}

export interface BackendCheckResult {
  id: string;
  label: string;
  status: QaStatus;
  detail?: string;
  latencyMs?: number;
}

export interface HudState {
  visible: boolean;
  scanMode: boolean;
  selectedNode: string | null;
  threatWarningActive: boolean;
  worstThreatStatus: string | null;
}

export interface CockpitState {
  frameLoaded: boolean;
  ambientFxActive: boolean;
  motionLayerActive: boolean;
  sideEnclosureActive: boolean;
}

export interface WeaponState {
  id: string;
  name: string;
  status: "READY" | "COOLDOWN";
  cooldownProgress: number;
  type: "pulse" | "railgun" | "emp";
}

export interface ThreatState {
  id: string;
  status: string;
  health: number;
  progress: number;
  spawnTime: number;
}

export interface TargetState {
  id: string;
  locked: boolean;
  energy?: number;
  signal?: number;
  stability?: number;
}

export interface ProjectileState {
  weaponId: string;
  type: "pulse" | "railgun" | "emp";
  targetId: string;
  startTime: number;
  duration: number;
  active: boolean;
}

export interface RadarContact {
  id: string;
  azimuth: number;
  distance: number;
  priority: "T1" | "T2" | "T3" | "T4";
  selected: boolean;
}

export interface ShipState {
  id: string;
  playerId: string;
  shields: number;
  hull: number;
  systems: Record<string, string>;
  position?: { lat: number; lng: number; sector: string };
  updatedAt: number;
}

export interface SectorState {
  id: string;
  name: string;
  threatLevel: number;
  controlledBy: string;
  activeThreats: number;
}

export interface AlertEntry {
  id: string;
  type: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  title: string;
  message: string;
  timestamp: number;
  source: string;
  acknowledged: boolean;
}

export interface CombatLogEntry {
  id: string;
  action: string;
  weaponType?: string;
  targetId?: string;
  result?: string;
  damage?: number;
  timestamp: number;
  playerId: string;
}

export interface GlobalQaSummary {
  totalPass: number;
  totalFail: number;
  totalSkip: number;
  totalPartial: number;
  totalNotImplemented: number;
  sections: SmokeTestResult[];
  runAt: number;
  stable: boolean;
}
