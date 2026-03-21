import { Component, type ReactNode } from "react";

interface GEBState {
  hasError: boolean;
  error: Error | null;
}

export default class GlobalErrorBoundary extends Component<
  { children: ReactNode },
  GEBState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: unknown): GEBState {
    return {
      hasError: true,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  override componentDidCatch(
    error: Error,
    errorInfo: { componentStack: string },
  ) {
    console.error("[GlobalErrorBoundary]", error, errorInfo);
  }

  override render() {
    if (this.state.hasError && this.state.error) {
      const err = this.state.error;
      return (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999999,
            background: "#0a0a0a",
            padding: "2rem",
            overflow: "auto",
            fontFamily: "monospace",
          }}
        >
          <div
            style={{
              color: "rgba(255,255,255,0.25)",
              fontSize: "0.7rem",
              letterSpacing: "0.2em",
              marginBottom: "1.5rem",
              textTransform: "uppercase",
            }}
          >
            [ FRONTIER — CRASH REPORT ]
          </div>

          <div
            style={{
              color: "#ff4444",
              fontSize: "1rem",
              fontWeight: "bold",
              marginBottom: "1rem",
              wordBreak: "break-all",
            }}
          >
            {err.message}
          </div>

          {err.stack && (
            <pre
              style={{
                color: "#ff6666",
                fontSize: "0.75rem",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                margin: "0 0 1.5rem 0",
                lineHeight: 1.5,
              }}
            >
              {err.stack}
            </pre>
          )}

          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              background: "transparent",
              border: "1px solid #ff4444",
              color: "#ff4444",
              fontFamily: "monospace",
              fontSize: "0.85rem",
              letterSpacing: "0.15em",
              padding: "8px 20px",
              cursor: "pointer",
            }}
          >
            RELOAD
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
