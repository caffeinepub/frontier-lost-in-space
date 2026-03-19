import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useThreatStore } from "../../combat/useThreatStore";
import { useWeaponsStore } from "../../combat/useWeapons";
import { useTacticalStore } from "../../hooks/useTacticalStore";

interface Checkpoint {
  id: string;
  label: string;
  status: "PASS" | "FAIL" | "PENDING" | "PARTIAL";
  note?: string;
  position: CSSProperties;
}

export default function CheckpointMarkers() {
  const threats = useThreatStore((s) => s.threats);
  const selectedNode = useTacticalStore((s) => s.selectedNode);
  const weapons = useWeaponsStore((s) => s.weapons);

  const [cockpitLoaded, setCockpitLoaded] = useState(false);
  const [canvasPresent, setCanvasPresent] = useState(false);
  const [hudPresent, setHudPresent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCanvasPresent(document.querySelectorAll("canvas").length >= 1);
      setHudPresent(!!document.querySelector("[data-hud]"));
      const imgs = Array.from(document.querySelectorAll("img"));
      setCockpitLoaded(
        imgs.some((img) => img.src?.includes("E00E76F0") || img.complete),
      );
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const activeThreats = threats.filter(
    (t) => t.status !== "DESTROYED" && t.status !== "SURVIVED",
  );
  const readyWeapons = weapons.filter((w) => w.status === "READY");

  const checkpoints: Checkpoint[] = [
    {
      id: "cp_globe",
      label: "GLOBE",
      status: canvasPresent ? "PASS" : "FAIL",
      note: canvasPresent ? "3D canvas active" : "canvas missing",
      position: { top: "12%", left: "clamp(6px,1.5vw,16px)" },
    },
    {
      id: "cp_hud",
      label: "HUD",
      status: hudPresent ? "PASS" : "FAIL",
      note: hudPresent ? "overlay active" : "HUD not mounted",
      position: { top: "22%", left: "clamp(6px,1.5vw,16px)" },
    },
    {
      id: "cp_cockpit",
      label: "FRAME",
      status: cockpitLoaded ? "PASS" : "PARTIAL",
      note: cockpitLoaded ? "frame loaded" : "checking...",
      position: { top: "32%", left: "clamp(6px,1.5vw,16px)" },
    },
    {
      id: "cp_radar",
      label: "RADAR",
      status: "PASS",
      note: `${activeThreats.length} contacts`,
      position: { top: "42%", left: "clamp(6px,1.5vw,16px)" },
    },
    {
      id: "cp_weapons",
      label: "WEAPONS",
      status: readyWeapons.length > 0 ? "PASS" : "PARTIAL",
      note: `${readyWeapons.length}/${weapons.length} ready`,
      position: { top: "52%", left: "clamp(6px,1.5vw,16px)" },
    },
    {
      id: "cp_target",
      label: "TARGET",
      status: selectedNode ? "PASS" : "PENDING",
      note: selectedNode ?? "no lock",
      position: { top: "62%", left: "clamp(6px,1.5vw,16px)" },
    },
  ];

  const statusColor = (s: Checkpoint["status"]) => {
    switch (s) {
      case "PASS":
        return "#00ff96";
      case "FAIL":
        return "#ff5050";
      case "PARTIAL":
        return "#ffc832";
      case "PENDING":
        return "rgba(0,180,255,0.5)";
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 23,
      }}
    >
      {checkpoints.map((cp) => (
        <div
          key={cp.id}
          style={{
            position: "absolute",
            ...cp.position,
            display: "flex",
            alignItems: "center",
            gap: 3,
            opacity: 0.72,
          }}
        >
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: statusColor(cp.status),
              boxShadow: `0 0 4px ${statusColor(cp.status)}`,
              flexShrink: 0,
            }}
          />
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 6.5,
              letterSpacing: "0.14em",
              color: statusColor(cp.status),
              whiteSpace: "nowrap",
              lineHeight: 1,
            }}
          >
            {cp.label}
          </div>
        </div>
      ))}
    </div>
  );
}
