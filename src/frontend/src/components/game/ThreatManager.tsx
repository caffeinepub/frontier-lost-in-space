import { useFrame } from "@react-three/fiber";
import { useEffect } from "react";
import { useThreatStore } from "../../combat/useThreatStore";
import AsteroidThreat from "./AsteroidThreat";

function ThreatUpdater() {
  const updateThreats = useThreatStore((s) => s.updateThreats);
  const removeDestroyedThreats = useThreatStore(
    (s) => s.removeDestroyedThreats,
  );

  useFrame((_, delta) => {
    updateThreats(delta);
    removeDestroyedThreats();
  });

  return null;
}

export default function ThreatManager() {
  const threats = useThreatStore((s) => s.threats);
  const spawnThreat = useThreatStore((s) => s.spawnThreat);

  // Auto-spawn threats
  useEffect(() => {
    // Spawn first threat after a short delay
    const initial = setTimeout(spawnThreat, 4000);

    function scheduleNext() {
      const delay = 12000 + Math.random() * 6000;
      return setTimeout(() => {
        spawnThreat();
        timer = scheduleNext();
      }, delay);
    }

    let timer = scheduleNext();

    return () => {
      clearTimeout(initial);
      clearTimeout(timer);
    };
  }, [spawnThreat]);

  return (
    <>
      <ThreatUpdater />
      {threats.map((threat) => (
        <AsteroidThreat key={threat.id} threat={threat} />
      ))}
    </>
  );
}
