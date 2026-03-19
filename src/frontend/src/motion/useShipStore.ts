/**
 * useShipStore — Zustand store for the ship's orbital position and heading.
 *
 * Earth is the fixed world anchor at (0,0,0).
 * The ship orbits Earth at a fixed radius described by:
 *   orbitalTheta  — longitude around equatorial plane (radians)
 *   orbitalPhi    — elevation/latitude above equator  (radians, clamped ±1.3)
 *
 * The camera is placed at the ship's orbital position looking at Earth,
 * preserving the cockpit-forward presentation.
 *
 * headingYaw / headingPitch = fine look-offset from right-drag.
 */
import { create } from "zustand";

export interface ShipState {
  orbitalTheta: number;
  orbitalPhi: number;
  orbitalRadius: number;
  headingYaw: number;
  headingPitch: number;
  velTheta: number;
  velPhi: number;
}

export interface ShipActions {
  setOrbital: (theta: number, phi: number) => void;
  setHeading: (yaw: number, pitch: number) => void;
  setVelocity: (velTheta: number, velPhi: number) => void;
  applyVelocityTick: (dt: number) => void;
}

export const useShipStore = create<ShipState & ShipActions>((set, get) => ({
  orbitalTheta: 0,
  orbitalPhi: 0.18,
  orbitalRadius: 5.0,
  headingYaw: 0,
  headingPitch: 0,
  velTheta: 0,
  velPhi: 0,

  setOrbital: (theta, phi) =>
    set({
      orbitalTheta: theta,
      orbitalPhi: Math.max(-1.3, Math.min(1.3, phi)),
    }),

  setHeading: (yaw, pitch) =>
    set({
      headingYaw: Math.max(-0.35, Math.min(0.35, yaw)),
      headingPitch: Math.max(-0.25, Math.min(0.25, pitch)),
    }),

  setVelocity: (velTheta, velPhi) => set({ velTheta, velPhi }),

  applyVelocityTick: (dt) => {
    const s = get();
    const newTheta = s.orbitalTheta + s.velTheta * dt;
    const newPhi = Math.max(-1.3, Math.min(1.3, s.orbitalPhi + s.velPhi * dt));
    const friction = 0.88;
    const nVT = s.velTheta * friction;
    const nVP = s.velPhi * friction;
    const hd = 0.965;
    set({
      orbitalTheta: newTheta,
      orbitalPhi: newPhi,
      velTheta: Math.abs(nVT) < 0.00001 ? 0 : nVT,
      velPhi: Math.abs(nVP) < 0.00001 ? 0 : nVP,
      headingYaw: s.headingYaw * hd,
      headingPitch: s.headingPitch * hd,
    });
  },
}));
