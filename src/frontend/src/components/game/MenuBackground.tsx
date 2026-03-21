/**
 * MenuBackground.tsx
 *
 * Flow:
 * 1. Video plays once, muted by default.
 * 2. On video end (or error / autoplay block), crossfade to static image.
 * 3. Static image stays as the persistent menu backdrop.
 * 4. Player can unmute/mute via a small toggle button.
 */
import { useCallback, useEffect, useRef, useState } from "react";

const VIDEO_URL =
  "https://cyan-chemical-capybara-537.mypinata.cloud/ipfs/bafybeicgimauexrmuumwvxvibidfi4uaagjguv4leuwjrt3bw6qxrku7hq?pinataGatewayToken=7zglWYSGiMDzNDI6rKBp6n24Hn5dRANGNukXWHOraLmAUnl5cjJrHMrbnpJJJj2G";

const IMAGE_URL =
  "https://cyan-chemical-capybara-537.mypinata.cloud/ipfs/bafybeigvbvrbpjr56x6lzmrt22pgllm5xyhp4bniuvdlmvapy6pysgidnq?pinataGatewayToken=7zglWYSGiMDzNDI6rKBp6n24Hn5dRANGNukXWHOraLmAUnl5cjJrHMrbnpJJJj2G";

export default function MenuBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<"video" | "fading" | "image">("video");
  const [muted, setMuted] = useState(true);
  const [videoActive, setVideoActive] = useState(true);

  const transitionToImage = useCallback(() => {
    setPhase((prev) => {
      if (prev !== "video") return prev;
      return "fading";
    });
    setTimeout(() => {
      setPhase("image");
      setVideoActive(false);
    }, 1200);
  }, []);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const onEnded = () => transitionToImage();
    const onError = () => transitionToImage();

    vid.addEventListener("ended", onEnded);
    vid.addEventListener("error", onError);

    const playPromise = vid.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => transitionToImage());
    }

    return () => {
      vid.removeEventListener("ended", onEnded);
      vid.removeEventListener("error", onError);
    };
  }, [transitionToImage]);

  // Sync muted state to video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
    }
  }, [muted]);

  const baseStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    pointerEvents: "none",
    transition: "opacity 1.2s ease",
  };

  return (
    <>
      {/* Static image — always underneath, fades in when video ends */}
      <img
        src={IMAGE_URL}
        alt=""
        aria-hidden="true"
        style={{
          ...baseStyle,
          opacity: phase === "video" ? 0 : 1,
          zIndex: 0,
        }}
      />

      {/* Video — fades out on end */}
      {videoActive && (
        <video
          ref={videoRef}
          src={VIDEO_URL}
          muted
          playsInline
          autoPlay
          preload="auto"
          style={{
            ...baseStyle,
            opacity: phase === "fading" ? 0 : 1,
            zIndex: 1,
          }}
        />
      )}

      {/* Mute toggle — only visible while video is playing */}
      {videoActive && phase === "video" && (
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          title={muted ? "Unmute intro" : "Mute intro"}
          style={{
            position: "absolute",
            bottom: 20,
            right: 20,
            zIndex: 10,
            background: "rgba(0,0,0,0.45)",
            border: "1px solid rgba(0,200,255,0.25)",
            borderRadius: 4,
            color: "rgba(0,200,255,0.7)",
            fontFamily: "monospace",
            fontSize: "clamp(8px,1vw,11px)",
            letterSpacing: "0.15em",
            padding: "6px 12px",
            cursor: "pointer",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ fontSize: "1.1em" }}>{muted ? "🔇" : "🔊"}</span>
          {muted ? "UNMUTE" : "MUTE"}
        </button>
      )}
    </>
  );
}
