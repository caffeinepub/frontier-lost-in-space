export default function CockpitFrame() {
  return (
    <img
      src="/assets/uploads/7AECA372-28A5-4DD8-AA6A-AC7B24F1D273-2.png"
      alt=""
      aria-hidden="true"
      onError={() =>
        console.warn("[CockpitFrame] Failed to load cockpit overlay image")
      }
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        zIndex: 15,
        pointerEvents: "none",
        display: "block",
        opacity: 1,
        mixBlendMode: "multiply" as const,
      }}
    />
  );
}
