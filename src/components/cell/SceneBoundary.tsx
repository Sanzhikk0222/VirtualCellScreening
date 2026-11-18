import { Component, type ErrorInfo, type ReactNode } from "react";

interface SceneBoundaryProps {
  /** Shown if the 3D scene throws (no WebGL, blocked GPU, failed chunk download). */
  fallback: ReactNode;
  children: ReactNode;
}

/** Keeps a 3D failure local: the page loses the model, not the whole app. */
export class SceneBoundary extends Component<SceneBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.warn("3D scene failed:", error, info.componentStack);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
