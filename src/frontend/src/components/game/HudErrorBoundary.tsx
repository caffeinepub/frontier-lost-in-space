/**
 * HudErrorBoundary — wraps HUD/reticle/hologram systems.
 * If any HUD subsystem throws, it shows a minimal fallback
 * instead of crashing the entire app.
 */
import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  name?: string;
}
interface State {
  hasError: boolean;
  message: string;
}

export class HudErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(err: unknown): State {
    return { hasError: true, message: String(err).slice(0, 120) };
  }

  override componentDidCatch(
    error: unknown,
    info: { componentStack?: string },
  ) {
    console.error(
      `[HudErrorBoundary:${this.props.name ?? "HUD"}] caught:`,
      error,
      "\nComponent stack:",
      info.componentStack,
    );
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 200,
            fontFamily: "monospace",
            fontSize: 8,
            letterSpacing: "0.15em",
            color: "rgba(255,100,100,0.5)",
            background: "rgba(0,0,0,0.4)",
            padding: "3px 6px",
            borderRadius: 2,
            pointerEvents: "none",
          }}
        >
          {this.props.name ?? "HUD"} FAULT
        </div>
      );
    }
    return this.props.children;
  }
}
