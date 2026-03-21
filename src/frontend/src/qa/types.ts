export type QaCategory =
  | "UI"
  | "GAMEPLAY"
  | "AUDIO"
  | "NETWORK"
  | "STORE"
  | "PERF";
export type QaStatus = "PASS" | "FAIL" | "SKIP" | "PARTIAL" | "NOT_IMPLEMENTED";

export interface QaCheckResult {
  id: string;
  label: string;
  category: QaCategory;
  status: QaStatus;
  message?: string;
  timestamp: number;
}

export interface SmokeTestResult {
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  checks: QaCheckResult[];
  runAt: number;
  durationMs: number;
}

export interface GlobalQaSummary {
  ui: SmokeTestResult | null;
  gameplay: SmokeTestResult | null;
  audio: SmokeTestResult | null;
  overall: "PASS" | "FAIL" | "PARTIAL" | "PENDING";
}
