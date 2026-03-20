/**
 * useWeaponZoneIntent.ts — Single weapon zone proximity and dwell intent hook.
 * V22.1: COMBAT FEELS REAL LAYER
 *
 * Called once per WeaponSlot. Tracks dwell time, intent escalation,
 * and exposes pointer event handlers to merge onto the slot button.
 */
import { useCallback, useEffect, useRef } from "react";
import { useWeaponZoneStore } from "./useWeaponZoneStore";
import { playHoldRise, playLockClick, playNearZone } from "./weaponSynth";

export interface ZoneIntentConfig {
  weaponId: string;
  weaponType: string;
}

export function useWeaponZoneIntent(config: ZoneIntentConfig) {
  const { weaponId } = config;

  const intentLevel = useWeaponZoneStore((s) => s.intentLevels[weaponId] ?? 0);
  const dwellMs = useWeaponZoneStore((s) => s.dwellTimes[weaponId] ?? 0);
  const assistTargetingUI = useWeaponZoneStore((s) => s.assistTargetingUI);
  const setIntentLevel = useWeaponZoneStore((s) => s.setIntentLevel);
  const setDwellTime = useWeaponZoneStore((s) => s.setDwellTime);

  const dwellTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dwellAccRef = useRef(0);
  const insideRef = useRef(false);

  // Threshold in ms before escalating to intent level 2
  const DWELL_THRESHOLD = assistTargetingUI ? 300 : 400;

  const stopDwell = useCallback(() => {
    if (dwellTimerRef.current) {
      clearInterval(dwellTimerRef.current);
      dwellTimerRef.current = null;
    }
    dwellAccRef.current = 0;
    insideRef.current = false;
    setIntentLevel(weaponId, 0);
    setDwellTime(weaponId, 0);
  }, [weaponId, setIntentLevel, setDwellTime]);

  const startDwell = useCallback(() => {
    if (dwellTimerRef.current) return;
    dwellAccRef.current = 0;
    dwellTimerRef.current = setInterval(() => {
      dwellAccRef.current += 50;
      setDwellTime(weaponId, dwellAccRef.current);
      if (dwellAccRef.current >= DWELL_THRESHOLD) {
        const progress = Math.min(1, dwellAccRef.current / 600);
        playHoldRise(progress);
        setIntentLevel(weaponId, 2);
      }
    }, 50);
  }, [weaponId, DWELL_THRESHOLD, setIntentLevel, setDwellTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (dwellTimerRef.current) clearInterval(dwellTimerRef.current);
    };
  }, []);

  const onPointerEnter = useCallback(() => {
    insideRef.current = true;
    setIntentLevel(weaponId, 1);
    playNearZone();
    startDwell();
  }, [weaponId, setIntentLevel, startDwell]);

  const onPointerLeave = useCallback(() => {
    stopDwell();
  }, [stopDwell]);

  const onPointerDown = useCallback(() => {
    if (insideRef.current) {
      setIntentLevel(weaponId, 3);
      playLockClick();
    }
  }, [weaponId, setIntentLevel]);

  const onPointerUp = useCallback(() => {
    // Level stays at 3 briefly to allow fire handler to read it,
    // then naturally resets via onPointerLeave
  }, []);

  return {
    intentLevel,
    dwellMs,
    handlers: {
      onPointerEnter,
      onPointerLeave,
      onPointerDown,
      onPointerUp,
    },
  };
}
