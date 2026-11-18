import { useEffect, useRef, type MutableRefObject } from "react";

export interface PointerPosition {
  /** -1 (left edge) to 1 (right edge). */
  x: number;
  /** -1 (bottom edge) to 1 (top edge). */
  y: number;
}

/**
 * Tracks the cursor in a ref, not in state, so reading it every frame (the 3D scene does)
 * never triggers a React render.
 */
export function usePointerRef(enabled: boolean): MutableRefObject<PointerPosition> {
  const pointer = useRef<PointerPosition>({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled) {
      pointer.current.x = 0;
      pointer.current.y = 0;
      return;
    }
    const onMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((event.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled]);

  return pointer;
}
