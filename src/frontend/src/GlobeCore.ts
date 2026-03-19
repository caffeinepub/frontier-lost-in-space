// GlobeCore — globe node definitions
import * as THREE from "three";

export function latLngToVec3(
  lat: number | undefined,
  lng: number | undefined,
  radius = 1.0,
): THREE.Vector3 {
  const la = lat ?? 0;
  const lo = lng ?? 0;
  const phi = (90 - la) * (Math.PI / 180);
  const theta = (lo + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

export const NODE_IDS = [
  "node-us-east",
  "node-us-west",
  "node-europe",
  "node-asia",
  "node-russia",
  "node-china",
  "node-india",
  "node-brazil",
  "node-africa",
  "node-australia",
  "node-arctic",
  "node-antarctic",
  "node-pacific",
  "node-atlantic",
];

export const NODE_POSITIONS: Record<string, THREE.Vector3> = Object.fromEntries(
  [
    ["node-us-east", [38, -77]],
    ["node-us-west", [37, -122]],
    ["node-europe", [48, 11]],
    ["node-asia", [35, 105]],
    ["node-russia", [55, 37]],
    ["node-china", [39, 116]],
    ["node-india", [20, 77]],
    ["node-brazil", [-15, -47]],
    ["node-africa", [0, 20]],
    ["node-australia", [-25, 133]],
    ["node-arctic", [85, 0]],
    ["node-antarctic", [-85, 0]],
    ["node-pacific", [0, -170]],
    ["node-atlantic", [0, -30]],
  ].map(([id, [lat, lng]]) => [id, latLngToVec3(lat as number, lng as number)]),
);
