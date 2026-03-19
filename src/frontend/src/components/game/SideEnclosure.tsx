export default function SideEnclosure() {
  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: "21%",
          background:
            "linear-gradient(to right, rgba(0,0,6,0.94) 0%, rgba(0,0,8,0.72) 35%, rgba(0,0,10,0.28) 68%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 22,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: "21%",
          background:
            "linear-gradient(to left, rgba(0,0,6,0.94) 0%, rgba(0,0,8,0.72) 35%, rgba(0,0,10,0.28) 68%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 22,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "8%",
          background:
            "linear-gradient(to bottom, rgba(0,0,5,0.55) 0%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 22,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "8%",
          background:
            "linear-gradient(to top, rgba(0,0,5,0.55) 0%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 22,
        }}
      />
    </>
  );
}
