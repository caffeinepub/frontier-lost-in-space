/**
 * MenuBackground.tsx — Static image only (video removed)
 */
const IMAGE_URL =
  "https://cyan-chemical-capybara-537.mypinata.cloud/ipfs/bafybeigvbvrbpjr56x6lzmrt22pgllm5xyhp4bniuvdlmvapy6pysgidnq?pinataGatewayToken=7zglWYSGiMDzNDI6rKBp6n24Hn5dRANGNukXWHOraLmAUnl5cjJrHMrbnpJJJj2G";

export default function MenuBackground() {
  return (
    <img
      src={IMAGE_URL}
      alt=""
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}
