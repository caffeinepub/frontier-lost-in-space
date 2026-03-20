/**
 * CockpitFrame — cockpit overlay image.
 *
 * V15 fix: changed mixBlendMode from "multiply" to "screen".
 * "multiply" was darkening / completely blacking out the 3D scene beneath
 * when the cockpit frame PNG had large dark areas. "screen" preserves the
 * bright cockpit border elements while letting the scene stay visible.
 * If the frame image loads correctly it will still frame the viewport;
 * if it fails (404 / CORS) a console warning is emitted and nothing blocks
 * the game from rendering.
 */
export default function CockpitFrame() {
  return (
    <img
      src="/assets/uploads/7AECA372-28A5-4DD8-AA6A-AC7B24F1D273-2.png"
      alt=""
      aria-hidden="true"
      onLoad={() => console.log("[CockpitFrame] image loaded ✔")}
      onError={() =>
        console.warn(
          "[CockpitFrame] Failed to load cockpit overlay image — frame hidden",
        )
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
        opacity: 0.92,
        // V15: was "multiply" — switched to "screen" so dark frame areas
        // do NOT multiply-darken the 3D canvas content below
        mixBlendMode: "screen" as const,
      }}
    />
  );
}
