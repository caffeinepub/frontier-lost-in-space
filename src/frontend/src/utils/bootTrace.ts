/**
 * bootTrace — Structured boot-sequence console logging with timestamps.
 * Import and call at component mount points to trace the full render lifecycle.
 */
export const bootTrace = (label: string): void => {
  console.log(`[BOOT ${performance.now().toFixed(0)}ms] ${label}`);
};
