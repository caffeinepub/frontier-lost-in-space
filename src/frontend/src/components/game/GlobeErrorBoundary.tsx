/**
 * GlobeErrorBoundary — catches Three.js / R3F errors in the globe scene.
 * Renders a dark fallback instead of black-screening the whole app.
 */
import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  message: string;
}

export class GlobeErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(err: unknown): State {
    console.error("[GlobeErrorBoundary]", err);
    return { hasError: true, message: String(err) };
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#000810",
            fontFamily: "monospace",
            color: "rgba(0,200,255,0.6)",
            fontSize: "clamp(9px, 1.2vw, 11px)",
            letterSpacing: "0.2em",
            pointerEvents: "none",
          }}
        >
          <div style={{ marginBottom: 8 }}>GLOBE RENDER FAULT</div>
          <div
            style={{
              fontSize: "clamp(7px, 0.9vw, 9px)",
              color: "rgba(255,100,100,0.5)",
            }}
          >
            {this.state.message.slice(0, 80)}
          </div>
          <div
            style={{
              marginTop: 12,
              fontSize: "clamp(7px, 0.9vw, 9px)",
              color: "rgba(0,160,200,0.4)",
            }}
          >
            WEAPONS AND NAVIGATION REMAIN ACTIVE
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
